import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from aiosqlite import Connection

from app.database import get_db
from app.schemas.schemas import UserCreate, UserLogin, UserOut, ProfileUpsert, ProfileOut, UploadFile, File, ResumeUploadResponse, ApiKeyUpdate
import bcrypt
from app.utils import encrypt_data

def get_password_hash(password):
    # Truncate to 72 bytes as per bcrypt specification
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

router = APIRouter()

@router.post("/users", response_model=UserOut)
async def create_user(payload: UserCreate, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE email = ?", (payload.email,)) as cur:
        existing = await cur.fetchone()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    hashed_password = get_password_hash(payload.password)
    await db.execute("INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, payload.name, payload.email, hashed_password, now))
    await db.commit()
    return UserOut(id=user_id, name=payload.name, email=payload.email, has_api_key=False,
                   created_at=datetime.fromisoformat(now))

@router.post("/login", response_model=UserOut)
async def login(payload: UserLogin, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM users WHERE email = ?", (payload.email,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    user_data = dict(row)
    if not verify_password(payload.password, user_data.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    user_data["has_api_key"] = bool(user_data.get("openrouter_api_key"))
    return UserOut(**user_data)

@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")
    user_data = dict(row)
    user_data["has_api_key"] = bool(user_data.get("openrouter_api_key"))
    return UserOut(**user_data)

@router.put("/users/{user_id}/api-key")
async def update_api_key(user_id: str, payload: ApiKeyUpdate, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE id = ?", (user_id,)) as cur:
        user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    encrypted_key = encrypt_data(payload.openrouter_api_key)
    await db.execute("UPDATE users SET openrouter_api_key = ? WHERE id = ?", (encrypted_key, user_id))
    await db.commit()
    return {"message": "API key stored securely. This key is encrypted and used only for your cloud model requests."}

@router.put("/users/{user_id}/profile", response_model=ProfileOut)
async def upsert_profile(user_id: str, payload: ProfileUpsert, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE id = ?", (user_id,)) as cur:
        user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    now = datetime.now(timezone.utc).isoformat()
    skills_json = json.dumps(payload.skills or [])
    interests_json = json.dumps(payload.interests or [])
    courses_json = json.dumps(payload.preferred_courses or [])
    locations_json = json.dumps(payload.preferred_locations or [])
    exams_json = json.dumps(payload.entrance_exams or {})
    
    await db.execute("""
        INSERT INTO user_profiles (user_id, current_role, years_experience, education,
                                   skills, interests, career_goals, location, 
                                   preferred_courses, preferred_locations, max_budget,
                                   entrance_exams, preferred_college_type, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            current_role = COALESCE(excluded.current_role, current_role),
            years_experience = COALESCE(excluded.years_experience, years_experience),
            education = COALESCE(excluded.education, education),
            skills = COALESCE(excluded.skills, skills),
            interests = COALESCE(excluded.interests, interests),
            career_goals = COALESCE(excluded.career_goals, career_goals),
            location = COALESCE(excluded.location, location),
            preferred_courses = COALESCE(excluded.preferred_courses, preferred_courses),
            preferred_locations = COALESCE(excluded.preferred_locations, preferred_locations),
            max_budget = COALESCE(excluded.max_budget, max_budget),
            entrance_exams = COALESCE(excluded.entrance_exams, entrance_exams),
            preferred_college_type = COALESCE(excluded.preferred_college_type, preferred_college_type),
            updated_at = excluded.updated_at
    """, (user_id, payload.current_role, payload.years_experience, payload.education,
            skills_json, interests_json, payload.career_goals, payload.location,
            courses_json, locations_json, payload.max_budget, exams_json, 
            payload.preferred_college_type, now))
    await db.commit()
    
    # Fetch the updated profile to return it accurately
    async with db.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)) as cur:
        row = await cur.fetchone()
    data = dict(row)
    data["skills"] = json.loads(data.get("skills") or "[]")
    data["interests"] = json.loads(data.get("interests") or "[]")
    data["preferred_courses"] = json.loads(data.get("preferred_courses") or "[]")
    data["preferred_locations"] = json.loads(data.get("preferred_locations") or "[]")
    data["entrance_exams"] = json.loads(data.get("entrance_exams") or "{}")
    
    return ProfileOut(**data)

@router.get("/users/{user_id}/profile", response_model=ProfileOut)
async def get_profile(user_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found.")
    data = dict(row)
    data["skills"] = json.loads(data.get("skills") or "[]")
    data["interests"] = json.loads(data.get("interests") or "[]")
    data["preferred_courses"] = json.loads(data.get("preferred_courses") or "[]")
    data["preferred_locations"] = json.loads(data.get("preferred_locations") or "[]")
    data["entrance_exams"] = json.loads(data.get("entrance_exams") or "{}")
    return ProfileOut(**data)

@router.get("/users/by-email/{email}", response_model=UserOut)
async def get_user_by_email(email: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM users WHERE email = ?", (email,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")
    user_data = dict(row)
    user_data["has_api_key"] = bool(user_data.get("openrouter_api_key"))
    return UserOut(**user_data)

import fitz  # PyMuPDF
import io
from app.services.resume_parser import parse_resume_from_content
import json
from typing import List

async def extract_text_from_resume(file: UploadFile) -> str:
    content = await file.read()
    filename = file.filename.lower()
    if filename.endswith('.pdf'):
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    elif filename.endswith('.docx'):
        try:
            from docx import Document
        except ModuleNotFoundError as exc:
            raise HTTPException(
                status_code=500,
                detail="DOCX support requires the python-docx package to be installed.",
            ) from exc
        doc = Document(io.BytesIO(content))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or DOCX.")

async def extract_skills_from_resume(user_id: str, resume_text: str, db: Connection):
    prompt = f"""
Extract the top 10 skills from this resume. Respond ONLY with JSON: {{"skills": ["skill1", "skill2"], "interests": ["interest1"]}}

Resume:
{resume_text[:4000]}
"""
    history = [{"role": "user", "content": prompt}]
    full_reply = await get_ai_nonstream(history)
    try:
        parsed = json.loads(full_reply)
        skills = parsed.get("skills", [])
        interests = parsed.get("interests", [])
        # Upsert to profile
        skills_json = json.dumps(skills)
        interests_json = json.dumps(interests)
        now = datetime.now(timezone.utc).isoformat()
        await db.execute("""
            INSERT INTO user_profiles (user_id, skills, interests, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                skills = excluded.skills,
                interests = excluded.interests,
                updated_at = excluded.updated_at
        """, (user_id, skills_json, interests_json, now))
        await db.commit()
        return ResumeUploadResponse(skills=skills, interests=interests, summary="Skills extracted and saved to profile")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.post("/users/{user_id}/resume", response_model=ResumeUploadResponse)
async def upload_resume(user_id: str, file: UploadFile = File(..., description="PDF or DOCX resume"), db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE id = ?", (user_id,)) as cur:
        user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    content = await file.read()
    parsed = await parse_resume_from_content(content, file.filename)
    if 'error' in parsed:
        raise HTTPException(status_code=400, detail=parsed['error'])
    skills = parsed.get('skills', [])
    interests = parsed.get('interests', [])
    summary = parsed.get('summary', 'Resume parsed successfully')
    parsed_json = json.dumps(parsed)
    now = datetime.now(timezone.utc).isoformat()
    skills_json = json.dumps(skills)
    interests_json = json.dumps(interests)
    await db.execute("""
        INSERT INTO user_profiles (user_id, skills, interests, parsed_resume, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            skills = excluded.skills,
            interests = excluded.interests,
            parsed_resume = excluded.parsed_resume,
            updated_at = excluded.updated_at
        """, (user_id, skills_json, interests_json, parsed_json, now))
    await db.commit()
    return ResumeUploadResponse(skills=skills, interests=interests, summary=summary)
