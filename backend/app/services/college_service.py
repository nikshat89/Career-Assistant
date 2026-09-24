import json
import aiosqlite
from typing import List, Dict, Optional
from app.database import DB_PATH

async def search_colleges(
    preferred_courses: Optional[List[str]] = None,
    preferred_locations: Optional[List[str]] = None,
    max_budget: Optional[int] = None,
    preferred_college_type: Optional[str] = None
) -> List[Dict]:
    """
    Search for colleges based on user preferences using SQL filtering.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        query = "SELECT * FROM colleges WHERE is_blacklisted = 0"
        params = []
        
        if preferred_college_type and preferred_college_type != "Any":
            query += " AND type = ?"
            params.append(preferred_college_type)
            
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            
        results = []
        for row in rows:
            college = dict(row)
            # Parse JSON fields
            for field in ["courses", "facilities", "placement_stats", "scholarships", "eligibility_criteria", "entrance_exams_accepted"]:
                if college.get(field):
                    college[field] = json.loads(college[field])
            
            # Post-filtering for Budget, Course, and Location
            match = True
            
            # 1. Filter by Budget (Check if any course matches the budget)
            if max_budget is not None:
                has_affordable_course = False
                for course in college.get("courses", []):
                    if course.get("fees", 0) <= max_budget:
                        has_affordable_course = True
                        break
                if not has_affordable_course:
                    match = False
            
            # 2. Filter by Course
            if match and preferred_courses:
                has_matching_course = False
                for pref_course in preferred_courses:
                    for course in college.get("courses", []):
                        if pref_course.lower() in course.get("name", "").lower():
                            has_matching_course = True
                            break
                    if has_matching_course:
                        break
                if not has_matching_course:
                    match = False
            
            # 3. Filter by Location/State
            if match and preferred_locations:
                location_match = False
                for loc in preferred_locations:
                    if loc.lower() in college.get("location", "").lower() or loc.lower() in college.get("state", "").lower():
                        location_match = True
                        break
                if not location_match:
                    match = False
                    
            if match:
                results.append(college)
                
        return results

async def get_college_by_name(name: str) -> Optional[Dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM colleges WHERE name = ? COLLATE NOCASE", (name,)) as cursor:
            row = await cursor.fetchone()
            if row:
                college = dict(row)
                for field in ["courses", "facilities", "placement_stats", "scholarships", "eligibility_criteria", "entrance_exams_accepted"]:
                    if college.get(field):
                        college[field] = json.loads(college[field])
                return college
    return None
