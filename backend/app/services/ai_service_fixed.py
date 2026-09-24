# MIT License • Copyright (c) 2026 Pathfinder

import os
import json
from typing import List, Dict, Optional, AsyncGenerator
from app.services.cloud_service import get_cloud_response_stream, get_cloud_response_nonstream
from app.services.local_service import get_local_response_stream, get_local_response_nonstream

SYSTEM_PROMPT = """You are a Career and Education Counselling AI. Your purpose is to provide career guidance and recommend colleges based on user profiles and preferences.

### MANDATORY SCOPE CONTROL ###
1. **IN-SCOPE**: Career paths, college recommendations, admissions, fees, placements, scholarships, eligibility criteria, resumes, interviews, skill development, and professional goals.
2. **OUT-OF-SCOPE**: Cooking, recipes, food, sports scores, entertainment news, general trivia, medical advice, personal relationship advice, dating, making friends, social life advice, etc.
3. **REJECTION RULE**: If a user asks ANYTHING out-of-scope, you MUST NOT provide any part of the answer.
4. **CAREER PIVOTS**: If a user's current skills/role (e.g., Tech) differ from their education goals (e.g., Medical), acknowledge the transition and prioritize the **explicit preferences** found in the 'College Recommendation' data over the historical 'Skills' data.

### COLLEGE DATA HANDLING ###
- When provided with a list of colleges (from the database), use that data as your primary source of truth.
- If no matching colleges are found in the provided context, inform the user that their specific criteria (location/budget) might be too restrictive or that the database is limited, but offer general advice on how to find such colleges.

**STRICT RESPONSE REQUIREMENT**:
For any out-of-scope query, your response must be EXACTLY AND ONLY the refusal string:
it is out of context sorry i cant answer this

### FORMATTING RULES ###
- Return clean GitHub-flavored markdown.
- Use tables for college comparisons.
- Use headings like `## Recommended Colleges` or `## Admission Details`.
- Use Mermaid syntax for career roadmaps if requested.
"""

REFUSAL_STRING = "it is out of context sorry i cant answer this"

def post_process_response(content: str) -> str:
    cleaned = content.strip()
    if cleaned.lower().startswith(REFUSAL_STRING.lower()):
        return REFUSAL_STRING
    return content

def build_system_prompt(profile: Optional[Dict] = None) -> str:
    if not profile:
        return SYSTEM_PROMPT
    ctx = SYSTEM_PROMPT + "\n\n--- USER PROFILE ---"
    if profile.get("name"):             ctx += f"\nName: {profile['name']}"
    if profile.get("current_role"):     ctx += f"\nRole: {profile['current_role']}"
    if profile.get("years_experience"): ctx += f"\nExperience: {profile['years_experience']} years"
    if profile.get("education"):        ctx += f"\nEducation: {profile['education']}"
    if profile.get("skills"):
        skills = profile["skills"]
        if isinstance(skills, list):
            ctx += f"\nSkills: {', '.join(str(skill) for skill in skills[:25])}"
    if profile.get("interests"):
        interests = profile["interests"]
        if isinstance(interests, list):
            ctx += f"\nInterests: {', '.join(str(interest) for interest in interests[:15])}"
    if profile.get("career_goals"):     ctx += f"\nGoals: {profile['career_goals']}"
    if profile.get("location"):         ctx += f"\nLocation: {profile['location']}"
    parsed_resume = profile.get("parsed_resume")
    if isinstance(parsed_resume, dict):
        if parsed_resume.get("summary"):
            ctx += f"\nResume Summary: {parsed_resume['summary']}"
        if parsed_resume.get("current_role") and not profile.get("current_role"):
            ctx += f"\nResume Inferred Role: {parsed_resume['current_role']}"
    ctx += "\n--- END PROFILE ---\nPersonalise your advice based on this profile."
    return ctx

def build_messages(
    conversation_history: List[Dict[str, str]],
    profile: Optional[Dict] = None,
) -> List[Dict[str, str]]:
    clean_history = [
        {"role": msg["role"], "content": msg["content"].strip()}
        for msg in conversation_history
        if msg.get("role") in {"user", "assistant"} and msg.get("content", "").strip()
    ]
    messages = [{"role": "system", "content": build_system_prompt(profile)}]
    messages.extend(clean_history[-10:])
    return messages

async def get_ai_nonstream(
    conversation_history: List[Dict[str, str]],
    profile: Optional[Dict] = None,
    use_lm_studio: bool = False,
    user_api_key: Optional[str] = None,
) -> str:
    messages = build_messages(conversation_history, profile)
    if use_lm_studio:
        try:
            content = await get_local_response_nonstream(messages)
            return post_process_response(content)
        except Exception as e:
            print(f"Local fail: {e}")
    
    content = await get_cloud_response_nonstream(messages, user_api_key)
    return post_process_response(content)

async def get_ai_response(
    conversation_history: List[Dict[str, str]],
    profile: Optional[Dict] = None,
    use_hf: bool = False,
    use_lm_studio: bool = False,
    stream: bool = False,
    user_api_key: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    if not stream:
        result = await get_ai_nonstream(conversation_history, profile, use_lm_studio, user_api_key)
        yield result
        return

    messages = build_messages(conversation_history, profile)
    buffer = ""
    refusal_detected = False

    async def process_chunk(chunk: str) -> AsyncGenerator[str, None]:
        nonlocal buffer, refusal_detected
        if refusal_detected: return
        buffer += chunk
        if len(buffer.strip()) < len(REFUSAL_STRING):
            if buffer.strip() and not REFUSAL_STRING.lower().startswith(buffer.strip().lower()):
                yield buffer
                buffer = ""
        else:
            if buffer.strip().lower().startswith(REFUSAL_STRING.lower()):
                refusal_detected = True
                yield REFUSAL_STRING
            else:
                yield buffer
                buffer = ""

    if use_lm_studio:
        try:
            async for chunk in get_local_response_stream(messages):
                async for p in process_chunk(chunk):
                    yield p
                if refusal_detected: break
            if buffer and not refusal_detected: yield buffer
            return
        except Exception as e:
            print(f"Local stream fail: {e}")

    async for chunk in get_cloud_response_stream(messages, user_api_key):
        async for p in process_chunk(chunk):
            yield p
        if refusal_detected: break
    if buffer and not refusal_detected: yield buffer

async def get_career_advice_ai(prompt: str, use_lm_studio: bool = False, user_api_key: Optional[str] = None) -> str:
    return await get_ai_nonstream([{"role": "user", "content": prompt}], use_lm_studio=use_lm_studio, user_api_key=user_api_key)
