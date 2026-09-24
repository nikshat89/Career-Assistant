import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from aiosqlite import Connection
from typing import List

from app.database import get_db
from app.schemas.schemas import SessionCreate, SessionUpdate, SessionOut, SessionWithMessages, MessageOut

router = APIRouter()

@router.post("/", response_model=SessionOut)
async def create_session(payload: SessionCreate, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE id = ?", (payload.user_id,)) as cur:
        user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.execute("INSERT INTO sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (session_id, payload.user_id, payload.title, now, now))
    await db.commit()
    return SessionOut(id=session_id, user_id=payload.user_id, title=payload.title,
                      created_at=datetime.fromisoformat(now), updated_at=datetime.fromisoformat(now))

@router.get("/user/{user_id}", response_model=List[SessionOut])
async def list_sessions(user_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)) as cur:
        rows = await cur.fetchall()
    return [SessionOut(**dict(r)) for r in rows]

@router.put("/{session_id}", response_model=SessionOut)
async def update_session(session_id: str, payload: SessionUpdate, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM sessions WHERE id = ?", (session_id,)) as cur:
        session = await cur.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.execute("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?",
        (payload.title, now, session_id))
    await db.commit()
    
    async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cur:
        row = await cur.fetchone()
    return SessionOut(**dict(row))

@router.get("/{session_id}", response_model=SessionWithMessages)
async def get_session(session_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cur:
        session = await cur.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    async with db.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC, id ASC", (session_id,)) as cur:
        msg_rows = await cur.fetchall()
    messages = [MessageOut(**dict(m)) for m in msg_rows]
    return SessionWithMessages(**dict(session), messages=messages)

@router.delete("/{session_id}")
async def delete_session(session_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM sessions WHERE id = ?", (session_id,)) as cur:
        session = await cur.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    await db.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    await db.commit()
    return {"detail": "Session deleted successfully."}
