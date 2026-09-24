# MIT License • Copyright (c) 2026 Pathfinder

import json
import re
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas import (
    ResumeReviewRequest, ResumeReviewResponse,
    InterviewPrepRequest, InterviewPrepResponse,
    CareerAdviceResponse,
)
from app.services.ai_service_fixed import get_career_advice_ai
from fastapi import Query

router = APIRouter()


def _safe_parse_json(text: str) -> dict:
    """Strip markdown fences and parse JSON from AI response."""
    cleaned = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return json.loads(cleaned)


@router.post("/resume-review", response_model=ResumeReviewResponse)
async def review_resume(payload: ResumeReviewRequest, use_lm_studio: bool = Query(False), db = Depends(get_db)):
    """
    Submit resume text for AI-powered analysis.
    Returns strengths, improvement areas, actionable suggestions, and a score out of 10.
    """
    async with db.execute("SELECT * FROM sessions WHERE id = ?", (payload.session_id,)) as cur:
        session_row = await cur.fetchone()
        if not session_row:
            raise HTTPException(status_code=404, detail="Session not found")

    prompt = f"""
You are an expert resume reviewer and career counsellor.

Analyse the following resume and respond ONLY with a valid JSON object (no markdown, no extra text) 
in this exact format:
{{
  "strengths": ["...", "..."],
  "areas_for_improvement": ["...", "..."],
  "suggestions": ["...", "..."],
  "overall_score": <integer 1-10>
}}

Resume:
{payload.resume_text}
"""
    raw = await get_career_advice_ai(prompt)

    try:
        data = _safe_parse_json(raw)
        return ResumeReviewResponse(**data)
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI returned an unexpected format. Raw response: {raw[:300]}",
        )


@router.post("/interview-prep", response_model=InterviewPrepResponse)
async def interview_prep(payload: InterviewPrepRequest, db = Depends(get_db)):
    """
    Generate targeted interview questions and tips for a specific role and interview type.
    Interview types: behavioral | technical | hr
    """
    async with db.execute("SELECT * FROM sessions WHERE id = ?", (payload.session_id,)) as cur:
        session_row = await cur.fetchone()
        if not session_row:
            raise HTTPException(status_code=404, detail="Session not found")

    prompt = f"""
You are an expert interview coach.

Generate interview preparation material for a candidate applying for: {payload.target_role}
Interview type: {payload.interview_type}

Respond ONLY with a valid JSON object (no markdown, no extra text) in this exact format:
{{
  "target_role": "{payload.target_role}",
  "interview_type": "{payload.interview_type}",
  "questions": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4"]
}}
"""
    raw = await get_career_advice_ai(prompt)

    try:
        data = _safe_parse_json(raw)
        return InterviewPrepResponse(**data)
    except (json.JSONDecodeError, KeyError, TypeError):
        raise HTTPException(status_code=500, detail=f"Unexpected AI response format: {raw[:300]}")


@router.get("/career-paths/{session_id}", response_model=CareerAdviceResponse)
async def get_career_paths(session_id: str, db = Depends(get_db)):
    """
    Generate personalised career path recommendations based on the user's saved profile.
    Requires a profile to be created for the session first.
    """
    async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cur:
        session_row = await cur.fetchone()
        if not session_row:
            raise HTTPException(status_code=404, detail="Session not found")
    
    session = dict(session_row)

    async with db.execute("SELECT * FROM user_profiles WHERE user_id = ?", (session['user_id'],)) as cur:
        profile_row = await cur.fetchone()
        if not profile_row:
            raise HTTPException(
                status_code=400,
                detail="No profile found for this user. Create a profile first.",
            )
        profile = dict(profile_row)

    # Parse JSON fields
    skills = json.loads(profile.get('skills') or '[]')
    interests = json.loads(profile.get('interests') or '[]')

    profile_summary = f"""
Education: {profile.get('education', 'Not specified')}
Current role: {profile.get('current_role', 'Not specified')}
Years of experience: {profile.get('years_experience', 'Not specified')}
Skills: {', '.join(skills)}
Interests: {', '.join(interests)}
Goals: {profile.get('career_goals', 'Not specified')}
"""

    prompt = f"""
You are an expert career counsellor. Based on the user profile below, recommend suitable career paths.

{profile_summary}

Respond ONLY with valid JSON (no markdown) in this exact format:
{{
  "career_paths": [
    {{
      "title": "Job Title",
      "description": "What this role involves",
      "typical_salary_range": "$X - $Y per year",
      "required_skills": ["skill1", "skill2"],
      "growth_outlook": "Growing / Stable / Declining"
    }}
  ],
  "recommended_resources": ["resource 1", "resource 2", "resource 3"],
  "next_steps": ["step 1", "step 2", "step 3"]
}}

Provide 3 career path options.
"""
    raw = await get_career_advice_ai(prompt)

    try:
        data = _safe_parse_json(raw)
        return CareerAdviceResponse(**data)
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise HTTPException(status_code=500, detail=f"Unexpected AI response format: {raw[:300]}")


@router.get("/tips/{topic}")
async def get_career_tips(topic: str):
    """
    Get quick career tips on a given topic.
    Example topics: networking, salary-negotiation, remote-work, career-change, linkedin
    """
    prompt = f"""
Give 5 concise, actionable career tips about: {topic}

Respond ONLY with valid JSON (no markdown):
{{
  "topic": "{topic}",
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
}}
"""
    raw = await get_career_advice_ai(prompt)

    try:
        return _safe_parse_json(raw)
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(status_code=500, detail=f"Unexpected AI response: {raw[:200]}")

