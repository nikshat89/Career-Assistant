# MIT License • Copyright (c) 2026 Pathfinder

from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_name = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    career_stage = Column(String, nullable=True)  # student, early, mid, senior
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    profile = relationship("UserProfile", back_populates="session", uselist=False, cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    role = Column(String, nullable=False)   # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="messages")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), unique=True, nullable=False)
    education_level = Column(String, nullable=True)
    field_of_study = Column(String, nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    current_role = Column(String, nullable=True)
    skills = Column(JSON, nullable=True)        # list of skills
    interests = Column(JSON, nullable=True)     # list of interests
    goals = Column(Text, nullable=True)
    
    preferred_courses = Column(JSON, nullable=True)
    preferred_locations = Column(JSON, nullable=True)
    max_budget = Column(Integer, nullable=True)
    entrance_exams = Column(JSON, nullable=True)
    preferred_college_type = Column(String, nullable=True)
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    session = relationship("Session", back_populates="profile")


class College(Base):
    __tablename__ = "colleges"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)
    location = Column(String, nullable=True)
    state = Column(String, nullable=True)
    courses = Column(JSON, nullable=True)
    facilities = Column(JSON, nullable=True)
    placement_stats = Column(JSON, nullable=True)
    scholarships = Column(JSON, nullable=True)
    eligibility_criteria = Column(JSON, nullable=True)
    entrance_exams_accepted = Column(JSON, nullable=True)
    is_blacklisted = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
