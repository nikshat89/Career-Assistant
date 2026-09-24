import csv
import sqlite3
import json
import uuid
import os

# Absolute path to the database
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "career_counsellor.db")

def parse_json_field(value, default=[]):
    if not value or value.strip() == "":
        return json.dumps(default)
    try:
        # If it's already a JSON string (e.g. starts with [ or {)
        if value.strip().startswith(('[', '{')):
            return json.dumps(json.loads(value))
        # Otherwise, assume it's a comma-separated string
        return json.dumps([item.strip() for item in value.split(',')])
    except:
        return json.dumps(default)

def import_from_csv(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Optional: Clear existing colleges if you want a fresh start
    # cursor.execute("DELETE FROM colleges")
    
    count = 0
    with open(file_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            college_id = str(uuid.uuid4())
            
            # Prepare courses JSON (Expects format "Course1:Fee1:Dur1, Course2:Fee2:Dur2")
            courses = []
            if row.get('courses'):
                for c in row['courses'].split(';'):
                    parts = c.split(':')
                    if len(parts) == 3:
                        courses.append({"name": parts[0].strip(), "fees": int(parts[1].strip() or 0), "duration": parts[2].strip()})
            
            # Prepare placement stats JSON (Expects format "Avg:High:Recruiters")
            placement = {"average_package": 0, "highest_package": 0, "top_recruiters": []}
            if row.get('placement_stats'):
                parts = row['placement_stats'].split(':')
                if len(parts) >= 1: placement["average_package"] = int(parts[0].strip() or 0)
                if len(parts) >= 2: placement["highest_package"] = int(parts[1].strip() or 0)
                if len(parts) >= 3: placement["top_recruiters"] = [r.strip() for r in parts[2].split(',')]

            # Prepare eligibility JSON (Expects format "MinMarks:Exam1,Exam2")
            eligibility = {"minimum_marks": 0, "exams": []}
            if row.get('eligibility_criteria'):
                parts = row['eligibility_criteria'].split(':')
                if len(parts) >= 1: eligibility["minimum_marks"] = int(parts[0].strip() or 0)
                if len(parts) >= 2: eligibility["exams"] = [ex.strip() for ex in parts[1].split(',')]

            cursor.execute("""
                INSERT INTO colleges (
                    id, name, type, location, state, courses, facilities, 
                    placement_stats, scholarships, eligibility_criteria, 
                    entrance_exams_accepted, is_blacklisted
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                college_id,
                row['name'],
                row['type'],
                row['location'],
                row['state'],
                json.dumps(courses),
                parse_json_field(row.get('facilities')),
                json.dumps(placement),
                parse_json_field(row.get('scholarships')),
                json.dumps(eligibility),
                parse_json_field(row.get('entrance_exams_accepted')),
                int(row.get('is_blacklisted', 0))
            ))
            count += 1
            
    conn.commit()
    conn.close()
    print(f"Successfully imported {count} colleges from {file_path}.")

if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE_DIR, "colleges.csv")
    import_from_csv(path)
