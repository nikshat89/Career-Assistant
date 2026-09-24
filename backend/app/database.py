# MIT License • Copyright (c) 2026 Pathfinder

import aiosqlite
import os

# Ensure DB_PATH is always absolute and points to the project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.getenv("DB_PATH", os.path.join(BASE_DIR, "career_counsellor.db"))


async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                openrouter_api_key TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id TEXT PRIMARY KEY REFERENCES users(id),
                current_role TEXT,
                years_experience INTEGER,
                education TEXT,
                skills TEXT,            -- JSON array as string
                interests TEXT,         -- JSON array as string
                career_goals TEXT,
                location TEXT,
                parsed_resume TEXT,
                preferred_courses TEXT,   -- JSON array
                preferred_locations TEXT, -- JSON array
                max_budget INTEGER,
                entrance_exams TEXT,      -- JSON object/array
                preferred_college_type TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS colleges (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT,                -- Govt/Private
                location TEXT,
                state TEXT,
                courses TEXT,             -- JSON array of dicts
                facilities TEXT,          -- JSON array
                placement_stats TEXT,     -- JSON dict
                scholarships TEXT,        -- JSON array
                eligibility_criteria TEXT, -- JSON dict
                entrance_exams_accepted TEXT, -- JSON array
                is_blacklisted BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                title TEXT DEFAULT 'Career Counselling Session',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT REFERENCES sessions(id),
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.commit()
