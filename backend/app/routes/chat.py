import uuid
import json
import os
from datetime import datetime, timezone
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from aiosqlite import Connection

from app.database import get_db, DB_PATH
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.ai_service_fixed import get_ai_response
import aiosqlite
from app.utils import decrypt_data

router = APIRouter()


def normalize_profile(row) -> dict | None:
    if not row:
        return None

    profile = dict(row)
    for field in ["skills", "interests", "parsed_resume"]:
        value = profile.get(field)
        if isinstance(value, str):
            try:
                profile[field] = json.loads(value)
            except json.JSONDecodeError:
                pass
    return profile

async def stream_generator(history: list[dict[str, str]], profile: dict, payload: ChatRequest, asst_msg_id: str, reply_at: str, use_hf: bool = False, use_lm: bool = False, user_api_key: str = None) -> AsyncGenerator[str, None]:
    full_reply = ""
    chunk_count = 0
    
    try:
        async for chunk in get_ai_response(history, profile, use_hf, use_lm, stream=True, user_api_key=user_api_key):
            if chunk:
                full_reply += chunk
                chunk_count += 1
                yield f"data: {json.dumps(chunk)}\n\n"
                
                # Periodically save to DB every 20 chunks to ensure partial progress is kept
                if chunk_count % 20 == 0:
                    try:
                        async with aiosqlite.connect(DB_PATH) as db_mid:
                            await db_mid.execute(
                                "UPDATE messages SET content = ? WHERE id = ?",
                                (full_reply, asst_msg_id),
                            )
                            await db_mid.commit()
                    except:
                        pass
    except Exception as e:
        error_msg = f"\n\n[Error: {str(e)}]"
        full_reply += error_msg
        print(f"DEBUG ERROR: Streaming error for session {payload.session_id}: {e}")
        try:
            yield f"data: {json.dumps(error_msg)}\n\n"
        except:
            pass
    finally:
        # CRITICAL: This block runs even if the client disconnects (GeneratorExit)
        if full_reply:
            db_save = None
            try:
                db_save = await aiosqlite.connect(DB_PATH)
                await db_save.execute(
                    "UPDATE messages SET content = ? WHERE id = ?",
                    (full_reply, asst_msg_id),
                )
                await db_save.execute(
                    "UPDATE sessions SET updated_at = ? WHERE id = ?",
                    (reply_at, payload.session_id),
                )
                await db_save.commit()
                print(f"DEBUG: Final save successful for {asst_msg_id} (Length: {len(full_reply)})")
            except Exception as db_err:
                print(f"DEBUG ERROR: Final save failed for {asst_msg_id}: {db_err}")
            finally:
                if db_save:
                    await db_save.close()

        try:
            yield "data: [DONE]\n\n"
        except:
            pass

@router.post("/", response_model=ChatResponse)
async def send_message(payload: ChatRequest, stream: bool = Query(False), use_hf: bool = Query(False), use_lm: bool = Query(False), db: Connection = Depends(get_db)):
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

    async with db.execute(
        """SELECT up.*, u.name FROM user_profiles up
           JOIN users u ON u.id = up.user_id
           WHERE up.user_id = ?""",
        (payload.user_id,),
    ) as cur:
        row = await cur.fetchone()
    profile = normalize_profile(row)

    async with db.execute(
        "SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC, id ASC",
        (payload.session_id,),
    ) as cur:
        rows = await cur.fetchall()
    history = [{"role": r["role"], "content": r["content"]} for r in rows]
    history.append({"role": "user", "content": payload.message})

    user_msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_msg_id, payload.session_id, "user", payload.message, now),
    )
    await db.commit()

    asst_msg_id = str(uuid.uuid4())
    reply_at = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (asst_msg_id, payload.session_id, "assistant", "", reply_at),
    )
    await db.commit()

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
        if colleges_context and profile:
            profile["retrieved_colleges"] = colleges_context

    if stream:
        return StreamingResponse(stream_generator(history, profile or {}, payload, asst_msg_id, reply_at, use_hf, use_lm, user_api_key), media_type="text/plain")
    else:
        try:
            gen = get_ai_response(history, profile, use_hf, use_lm, user_api_key=user_api_key)
            reply_text = ""
            async for chunk in gen:
                reply_text += chunk
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
        await db.execute(
            "UPDATE messages SET content = ? WHERE id = ?",
            (reply_text, asst_msg_id),
        )
        await db.commit()
        return ChatResponse(
            session_id=payload.session_id,
            message_id=asst_msg_id,
            reply=reply_text,
            created_at=datetime.fromisoformat(reply_at),
        )
