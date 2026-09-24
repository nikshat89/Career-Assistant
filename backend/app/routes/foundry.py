# MIT License • Copyright (c) 2026 Pathfinder

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from aiosqlite import Connection
import json
import uuid
from datetime import datetime, timezone

from app.database import get_db
from app.schemas.schemas import ChatRequest
from app.services.foundry_agents import FoundryOrchestrator
from app.routes.chat import normalize_profile
from app.utils import decrypt_data

router = APIRouter()

@router.post("/reason", response_model=None)
async def foundry_reasoning(payload: ChatRequest, db: Connection = Depends(get_db)):
    """
    Endpoint for advanced multi-step reasoning using Microsoft Foundry Agent patterns.
    """
    # 1. Verify session
    async with db.execute(
        "SELECT id FROM sessions WHERE id = ? AND user_id = ?",
        (payload.session_id, payload.user_id),
    ) as cur:
        session = await cur.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Fetch user API key
    async with db.execute("SELECT openrouter_api_key FROM users WHERE id = ?", (payload.user_id,)) as cur:
        user_row = await cur.fetchone()
        encrypted_key = user_row["openrouter_api_key"] if user_row else None
        user_api_key = decrypt_data(encrypted_key) if encrypted_key else None

    # 2. Get profile
    async with db.execute(
        """SELECT up.*, u.name FROM user_profiles up
           JOIN users u ON u.id = up.user_id
           WHERE up.user_id = ?""",
        (payload.user_id,),
    ) as cur:
        row = await cur.fetchone()
    profile = normalize_profile(row)

    # 3. Log user message
    user_msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_msg_id, payload.session_id, "user", payload.message, now),
    )
    await db.commit()

    # 4. Initialize assistant message
    asst_msg_id = str(uuid.uuid4())
    reply_at = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (asst_msg_id, payload.session_id, "assistant", "Reasoning in progress...", reply_at),
    )
    await db.commit()

    orchestrator = FoundryOrchestrator()

    # Fetch college data if relevant
    colleges_context = []
    if any(keyword in payload.message.lower() for keyword in ["college", "university", "admission", "fees", "placement"]):
        from app.services.college_service import search_colleges
        colleges_context = await search_colleges(
            preferred_courses=profile.get("preferred_courses"),
            preferred_locations=profile.get("preferred_locations"),
            max_budget=profile.get("max_budget"),
            preferred_college_type=profile.get("preferred_college_type")
        )

    async def event_generator():
        full_response = ""
        try:
            async for event in orchestrator.solve(payload.message, profile, user_api_key, context={"colleges": colleges_context}):
                yield event
                # Extract text if it's a chunk of the final response
                if event.startswith("data: \""):
                    try:
                        chunk = json.loads(event[6:])
                        full_response += chunk
                    except:
                        pass
        finally:
            # Update DB with final consolidated response
            if full_response:
                try:
                    import aiosqlite
                    from app.database import DB_PATH
                    async with aiosqlite.connect(DB_PATH) as db_save:
                        await db_save.execute(
                            "UPDATE messages SET content = ? WHERE id = ?",
                            (full_response, asst_msg_id),
                        )
                        await db_save.commit()
                except Exception as e:
                    print(f"Failed to save foundry response: {e}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")
