from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from fastapi import UploadFile, File

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    has_api_key: bool = False
    created_at: datetime

class ProfileUpsert(BaseModel):
    current_role: Optional[str] = None
    years_experience: Optional[int] = None
    education: Optional[str] = None
    skills: Optional[List[str]] = []
    interests: Optional[List[str]] = []
    career_goals: Optional[str] = None
    location: Optional[str] = None
    preferred_courses: Optional[List[str]] = []
    preferred_locations: Optional[List[str]] = []
    max_budget: Optional[int] = None
    entrance_exams: Optional[dict] = {}
    preferred_college_type: Optional[str] = None

class ProfileOut(ProfileUpsert):
    user_id: str
    updated_at: datetime

class CollegeOut(BaseModel):
    id: str
    name: str
    type: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    courses: Optional[List[dict]] = []
    facilities: Optional[List[str]] = []
    placement_stats: Optional[dict] = {}
    scholarships: Optional[List[str]] = []
    eligibility_criteria: Optional[dict] = {}
    entrance_exams_accepted: Optional[List[str]] = []
    is_blacklisted: bool = False
    created_at: datetime

class SessionCreate(BaseModel):
    user_id: str
    title: Optional[str] = "Career Counselling Session"

class SessionUpdate(BaseModel):
    title: str

class SessionOut(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime

class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime

class SessionWithMessages(SessionOut):
    messages: List[MessageOut] = []

class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    message_id: str
    reply: str
    created_at: datetime

class ResumeUploadResponse(BaseModel):
    skills: List[str]
    interests: List[str]
    summary: str

class ApiKeyUpdate(BaseModel):
    openrouter_api_key: str

# Added for career.py
class ResumeReviewRequest(BaseModel):
    session_id: str
    resume_text: str

class ResumeReviewResponse(BaseModel):
    strengths: List[str]
    areas_for_improvement: List[str]
    suggestions: List[str]
    overall_score: int

class InterviewPrepRequest(BaseModel):
    session_id: str
    target_role: str
    interview_type: str

class InterviewPrepResponse(BaseModel):
    target_role: str
    interview_type: str
    questions: List[str]
    tips: List[str]

class CareerAdviceResponse(BaseModel):
    career_paths: List[dict]
    recommended_resources: List[str]
    next_steps: List[str]

