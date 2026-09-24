# MIT License • Copyright (c) 2026 Pathfinder

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

from app.routes import profile, chat, sessions, foundry
from app.database import init_db
from career import router as career_router

app = FastAPI(title="Career Counselling AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router, prefix="/api/v1/profile")
app.include_router(chat.router, prefix="/api/v1/chat")
app.include_router(sessions.router, prefix="/api/v1/sessions")
app.include_router(career_router, prefix="/api/v1/career")
app.include_router(foundry.router, prefix="/api/v1/foundry")

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Career Counselling AI Backend"}
