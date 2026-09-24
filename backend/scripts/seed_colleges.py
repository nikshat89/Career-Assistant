import sqlite3
import json
import uuid
import os

# Absolute path to the database
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "career_counsellor.db")

COLLEGES = [
    {
        "name": "Indian Institute of Technology (IIT) Delhi",
        "type": "Government",
        "location": "New Delhi",
        "state": "Delhi",
        "courses": [
            {"name": "Computer Science and Engineering", "fees": 200000, "duration": "4 Years"},
            {"name": "Electrical Engineering", "fees": 200000, "duration": "4 Years"},
            {"name": "Mechanical Engineering", "fees": 200000, "duration": "4 Years"}
        ],
        "facilities": ["Library", "Hostel", "Sports", "Wi-Fi", "Labs", "Gym"],
        "placement_stats": {"average_package": 1800000, "highest_package": 10000000, "top_recruiters": ["Google", "Microsoft", "Amazon"]},
        "scholarships": ["MCM Scholarship", "Central Sector Scholarship"],
        "eligibility_criteria": {"minimum_marks": 75, "exams": ["JEE Advanced"]},
        "entrance_exams_accepted": ["JEE Advanced"],
        "is_blacklisted": 0
    },
    {
        "name": "Birla Institute of Technology and Science (BITS) Pilani",
        "type": "Private",
        "location": "Pilani",
        "state": "Rajasthan",
        "courses": [
            {"name": "Computer Science", "fees": 500000, "duration": "4 Years"},
            {"name": "Electronics & Instrumentation", "fees": 450000, "duration": "4 Years"}
        ],
        "facilities": ["Library", "Hostel", "Innovation Lab", "Wi-Fi"],
        "placement_stats": {"average_package": 1500000, "highest_package": 6000000, "top_recruiters": ["Apple", "Uber", "Goldman Sachs"]},
        "scholarships": ["Merit Scholarship", "Merit-cum-Need Scholarship"],
        "eligibility_criteria": {"minimum_marks": 75, "exams": ["BITSAT"]},
        "entrance_exams_accepted": ["BITSAT"],
        "is_blacklisted": 0
    },
    {
        "name": "Delhi Technological University (DTU)",
        "type": "Government",
        "location": "New Delhi",
        "state": "Delhi",
        "courses": [
            {"name": "Software Engineering", "fees": 150000, "duration": "4 Years"},
            {"name": "Information Technology", "fees": 150000, "duration": "4 Years"}
        ],
        "facilities": ["Library", "Hostel", "Auditorium", "Sports"],
        "placement_stats": {"average_package": 1200000, "highest_package": 4500000, "top_recruiters": ["Adobe", "Samsung", "Paytm"]},
        "scholarships": ["Delhi Govt Scholarships"],
        "eligibility_criteria": {"minimum_marks": 60, "exams": ["JEE Main"]},
        "entrance_exams_accepted": ["JEE Main"],
        "is_blacklisted": 0
    },
    {
        "name": "VIT University",
        "type": "Private",
        "location": "Vellore",
        "state": "Tamil Nadu",
        "courses": [
            {"name": "Computer Science and Engineering", "fees": 198000, "duration": "4 Years"},
            {"name": "Bio-Technology", "fees": 175000, "duration": "4 Years"}
        ],
        "facilities": ["Smart Classrooms", "Modern Labs", "Hostel", "Sports"],
        "placement_stats": {"average_package": 800000, "highest_package": 4400000, "top_recruiters": ["TCS", "Infosys", "Cognizant"]},
        "scholarships": ["GV School Development Programme (GVSDP)"],
        "eligibility_criteria": {"minimum_marks": 60, "exams": ["VITEEE"]},
        "entrance_exams_accepted": ["VITEEE"],
        "is_blacklisted": 0
    },
    {
        "name": "Manipal Institute of Technology",
        "type": "Private",
        "location": "Manipal",
        "state": "Karnataka",
        "courses": [
            {"name": "Data Science", "fees": 400000, "duration": "4 Years"},
            {"name": "Computer Communication", "fees": 380000, "duration": "4 Years"}
        ],
        "facilities": ["Library", "AC Hostels", "Gym", "Swimming Pool"],
        "placement_stats": {"average_package": 900000, "highest_package": 4000000, "top_recruiters": ["Microsoft", "Dell", "Intel"]},
        "scholarships": ["MAHE Scholarships"],
        "eligibility_criteria": {"minimum_marks": 50, "exams": ["MET"]},
        "entrance_exams_accepted": ["MET"],
        "is_blacklisted": 0
    },
    {
        "name": "SRM Institute of Science and Technology",
        "type": "Private",
        "location": "Chennai",
        "state": "Tamil Nadu",
        "courses": [
            {"name": "Artificial Intelligence", "fees": 250000, "duration": "4 Years"},
            {"name": "Cyber Security", "fees": 250000, "duration": "4 Years"}
        ],
        "facilities": ["Hostel", "Transport", "Library", "Medical"],
        "placement_stats": {"average_package": 700000, "highest_package": 5000000, "top_recruiters": ["Amazon", "Wipro", "HCL"]},
        "scholarships": ["Founder's Scholarship"],
        "eligibility_criteria": {"minimum_marks": 50, "exams": ["SRMJEEE"]},
        "entrance_exams_accepted": ["SRMJEEE"],
        "is_blacklisted": 0
    },
    {
        "name": "College of Engineering, Pune (COEP)",
        "type": "Government",
        "location": "Pune",
        "state": "Maharashtra",
        "courses": [
            {"name": "Civil Engineering", "fees": 85000, "duration": "4 Years"},
            {"name": "Mechanical Engineering", "fees": 85000, "duration": "4 Years"}
        ],
        "facilities": ["Heritage Buildings", "Labs", "Hostel", "Sports"],
        "placement_stats": {"average_package": 1000000, "highest_package": 3500000, "top_recruiters": ["Tata Motors", "Barclays", "Citi"]},
        "scholarships": ["EBC Scholarship"],
        "eligibility_criteria": {"minimum_marks": 50, "exams": ["MHT CET"]},
        "entrance_exams_accepted": ["MHT CET", "JEE Main"],
        "is_blacklisted": 0
    },
    {
        "name": "National Institute of Technology (NIT) Trichy",
        "type": "Government",
        "location": "Tiruchirappalli",
        "state": "Tamil Nadu",
        "courses": [
            {"name": "Production Engineering", "fees": 125000, "duration": "4 Years"},
            {"name": "Chemical Engineering", "fees": 125000, "duration": "4 Years"}
        ],
        "facilities": ["Library", "Hostel", "Research Centers", "Wi-Fi"],
        "placement_stats": {"average_package": 1200000, "highest_package": 4200000, "top_recruiters": ["Morgan Stanley", "Visa", "Nvidia"]},
        "scholarships": ["National Scholarship Portal"],
        "eligibility_criteria": {"minimum_marks": 75, "exams": ["JEE Main"]},
        "entrance_exams_accepted": ["JEE Main"],
        "is_blacklisted": 0
    },
    {
        "name": "All India Institute of Medical Sciences (AIIMS) Delhi",
        "type": "Government",
        "location": "New Delhi",
        "state": "Delhi",
        "courses": [
            {"name": "MBBS", "fees": 1628, "duration": "5.5 Years"},
            {"name": "B.Sc Nursing", "fees": 1000, "duration": "4 Years"}
        ],
        "facilities": ["World-class Hospitals", "Hostel", "Medical Labs", "Library"],
        "placement_stats": {"average_package": 2500000, "highest_package": 5000000, "top_recruiters": ["Apollo", "Fortis", "Max Healthcare"]},
        "scholarships": ["Institute Merit Scholarship"],
        "eligibility_criteria": {"minimum_marks": 60, "exams": ["NEET UG"]},
        "entrance_exams_accepted": ["NEET UG"],
        "is_blacklisted": 0
    },
    {
        "name": "Christian Medical College (CMC) Vellore",
        "type": "Private",
        "location": "Vellore",
        "state": "Tamil Nadu",
        "courses": [
            {"name": "MBBS", "fees": 52830, "duration": "5.5 Years"},
            {"name": "BDS", "fees": 45000, "duration": "4 Years"}
        ],
        "facilities": ["Hospital", "Community Centers", "Hostel", "Chapel"],
        "placement_stats": {"average_package": 1200000, "highest_package": 3000000, "top_recruiters": ["CMC Network", "Government Hospitals"]},
        "scholarships": ["Endowment Scholarships"],
        "eligibility_criteria": {"minimum_marks": 50, "exams": ["NEET UG"]},
        "entrance_exams_accepted": ["NEET UG"],
        "is_blacklisted": 0
    },
    {
        "name": "Armed Forces Medical College (AFMC) Pune",
        "type": "Government",
        "location": "Pune",
        "state": "Maharashtra",
        "courses": [
            {"name": "MBBS", "fees": 31000, "duration": "5.5 Years"}
        ],
        "facilities": ["Military Hospital", "Cadet Mess", "Sports", "Labs"],
        "placement_stats": {"average_package": 1500000, "highest_package": 2000000, "top_recruiters": ["Indian Armed Forces"]},
        "scholarships": ["Defense Scholarships"],
        "eligibility_criteria": {"minimum_marks": 60, "exams": ["NEET UG", "AFMC Interview"]},
        "entrance_exams_accepted": ["NEET UG"],
        "is_blacklisted": 0
    }
]

def seed():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print(f"Seeding {len(COLLEGES)} colleges into {DB_PATH}...")
    
    for college in COLLEGES:
        college_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO colleges (
                id, name, type, location, state, courses, facilities, 
                placement_stats, scholarships, eligibility_criteria, 
                entrance_exams_accepted, is_blacklisted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            college_id,
            college["name"],
            college["type"],
            college["location"],
            college["state"],
            json.dumps(college["courses"]),
            json.dumps(college["facilities"]),
            json.dumps(college["placement_stats"]),
            json.dumps(college["scholarships"]),
            json.dumps(college["eligibility_criteria"]),
            json.dumps(college["entrance_exams_accepted"]),
            college["is_blacklisted"]
        ))
    
    conn.commit()
    conn.close()
    print("Seeding completed successfully.")

if __name__ == "__main__":
    seed()
