# MIT License • Copyright (c) 2026 Pathfinder

from typing import Any, Dict, List, Optional
import io
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from app.services.ai_service_fixed import get_ai_nonstream

async def get_ai_nonstream(conversation_history):
    return "Mock AI response for resume parsing: {\"name\": \"John Doe\", \"skills\": [\"Python\", \"React\"], \"interests\": [\"AI\"]}"




SKILL_PATTERNS = {
    "Python": [r"\bpython\b", r"\bpython3\b"],
    "Java": [r"\bjava\b"],
    "JavaScript": [r"\bjavascript\b", r"\bjs\b"],
    "TypeScript": [r"\btypescript\b", r"\bts\b"],
    "React": [r"\breact(?:\.js)?\b"],
    "Node.js": [r"\bnode(?:\.js)?\b"],
    "Express.js": [r"\bexpress(?:\.js)?\b"],
    "Next.js": [r"\bnext(?:\.js)?\b"],
    "HTML": [r"\bhtml5?\b"],
    "CSS": [r"\bcss3?\b"],
    "Tailwind CSS": [r"\btailwind\b", r"\btailwind css\b"],
    "Bootstrap": [r"\bbootstrap\b"],
    "SQL": [r"\bsql\b", r"\bmysql\b", r"\bpostgresql\b", r"\bpostgres\b", r"\bsqlite\b"],
    "MongoDB": [r"\bmongodb\b", r"\bmongo\b"],
    "Redis": [r"\bredis\b"],
    "REST APIs": [r"\brest api\b", r"\brestful\b", r"\bapi development\b"],
    "GraphQL": [r"\bgraphql\b"],
    "Git": [r"\bgit\b", r"\bgithub\b", r"\bgitlab\b", r"\bbitbucket\b"],
    "Docker": [r"\bdocker\b", r"\bcontaineri[sz]ation\b"],
    "Kubernetes": [r"\bkubernetes\b", r"\bk8s\b"],
    "AWS": [r"\baws\b", r"\bamazon web services\b"],
    "Azure": [r"\bazure\b", r"\bmicrosoft azure\b"],
    "GCP": [r"\bgcp\b", r"\bgoogle cloud\b"],
    "CI/CD": [r"\bci/cd\b", r"\bcontinuous integration\b", r"\bcontinuous delivery\b", r"\bjenkins\b", r"\bgithub actions\b"],
    "Linux": [r"\blinux\b", r"\bunix\b"],
    "Testing": [r"\bunit testing\b", r"\bintegration testing\b", r"\bpytest\b", r"\bjest\b", r"\btesting\b"],
    "Data Analysis": [r"\bdata analysis\b", r"\bdata analytics\b", r"\banalytics\b"],
    "Machine Learning": [r"\bmachine learning\b", r"\bml\b"],
    "Deep Learning": [r"\bdeep learning\b"],
    "NLP": [r"\bnlp\b", r"\bnatural language processing\b"],
    "Pandas": [r"\bpandas\b"],
    "NumPy": [r"\bnumpy\b"],
    "Scikit-learn": [r"\bscikit-?learn\b", r"\bsklearn\b"],
    "TensorFlow": [r"\btensorflow\b"],
    "PyTorch": [r"\bpytorch\b"],
    "Excel": [r"\bexcel\b", r"\bms excel\b", r"\bmicrosoft excel\b"],
    "Power BI": [r"\bpower bi\b"],
    "Tableau": [r"\btableau\b"],
    "Agile": [r"\bagile\b", r"\bscrum\b", r"\bkanban\b"],
    "Communication": [r"\bcommunication\b", r"\bcommunicat(ed|ion|ing)\b"],
    "Leadership": [r"\bleadership\b", r"\bled teams?\b", r"\bteam lead\b"],
    "Project Management": [r"\bproject management\b", r"\bproject manager\b"],
}

INTEREST_KEYWORDS = [
    "ai",
    "machine learning",
    "data science",
    "backend",
    "frontend",
    "full stack",
    "cloud",
    "cybersecurity",
    "devops",
    "product",
    "analytics",
    "automation",
]

ROLE_PATTERNS = [
    r"\bsoftware engineer\b",
    r"\bsoftware developer\b",
    r"\bfrontend developer\b",
    r"\bbackend developer\b",
    r"\bfull[- ]stack developer\b",
    r"\bdata analyst\b",
    r"\bdata scientist\b",
    r"\bmachine learning engineer\b",
    r"\bdevops engineer\b",
    r"\bproduct manager\b",
    r"\bproject manager\b",
    r"\bbusiness analyst\b",
]

EDUCATION_PATTERNS = [
    r"\bb\.?tech\b",
    r"\bbachelor of technology\b",
    r"\bb\.?e\.?\b",
    r"\bbachelor of engineering\b",
    r"\bbsc\b",
    r"\bbachelor of science\b",
    r"\bmca\b",
    r"\bm\.?tech\b",
    r"\bmaster of technology\b",
    r"\bmba\b",
    r"\bbachelor of computer applications\b",
    r"\bmaster of computer applications\b",
]


def normalize_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def unique_preserve(items: List[str]) -> List[str]:
    seen = set()
    result = []
    for item in items:
        value = (item or "").strip()
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(value)
    return result


def extract_text_with_ocr(content: bytes) -> str:
    if not shutil.which("tesseract"):
        return ""

    try:
        import fitz
    except ModuleNotFoundError:
        return ""

    texts = []
    with tempfile.TemporaryDirectory(prefix="resume-ocr-") as tmpdir:
        doc = fitz.open(stream=content, filetype="pdf")
        try:
            for index, page in enumerate(doc):
                image_path = Path(tmpdir) / f"page-{index + 1}.png"
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                pix.save(image_path)

                result = subprocess.run(
                    ["tesseract", str(image_path), "stdout", "--psm", "6"],
                    capture_output=True,
                    text=True,
                    check=False,
                )
                if result.returncode == 0 and result.stdout.strip():
                    texts.append(result.stdout)
        finally:
            doc.close()

    return normalize_text("\n".join(texts))


def extract_text(content: bytes, filename: str) -> str:
    lower_fn = filename.lower()
    if lower_fn.endswith(".pdf"):
        try:
            try:
                import pdfplumber
            except ModuleNotFoundError:
                try:
                    import fitz
                except ModuleNotFoundError:
                    return ""

                doc = fitz.open(stream=content, filetype="pdf")
                text = "\n".join(page.get_text() for page in doc)
                doc.close()
                normalized = normalize_text(text)
                return normalized or extract_text_with_ocr(content)

            with pdfplumber.open(io.BytesIO(content)) as pdf:
                normalized = normalize_text("\n".join(page.extract_text() or "" for page in pdf.pages))
                return normalized or extract_text_with_ocr(content)
        except Exception:
            return extract_text_with_ocr(content)
    if lower_fn.endswith(".docx"):
        try:
            from docx import Document
        except ModuleNotFoundError:
            return ""
        try:
            doc = Document(io.BytesIO(content))
            return normalize_text("\n".join(para.text for para in doc.paragraphs))
        except Exception:
            return ""
    return ""


def extract_name(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines[:8]:
        if any(char.isdigit() for char in line):
            continue
        if "@" in line or len(line.split()) < 2 or len(line.split()) > 4:
            continue
        if re.fullmatch(r"[A-Za-z][A-Za-z .'-]+", line):
            return " ".join(part.capitalize() for part in line.split())
    return "Unknown"


def extract_skills_rule_based(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for skill, patterns in SKILL_PATTERNS.items():
        if any(re.search(pattern, text_lower) for pattern in patterns):
            found.append(skill)
    return unique_preserve(found)


def extract_interests(text: str) -> List[str]:
    text_lower = text.lower()
    matches = []
    for keyword in INTEREST_KEYWORDS:
        if keyword in text_lower:
            matches.append(keyword.title())
    return unique_preserve(matches)


def extract_current_role(text: str) -> Optional[str]:
    text_lower = text.lower()
    for pattern in ROLE_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            return match.group(0).title().replace("Full-Stack", "Full-Stack")
    return None


def extract_education(text: str) -> Optional[str]:
    text_lower = text.lower()
    for pattern in EDUCATION_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            return match.group(0).upper().replace(".", "")
    return None


def extract_total_experience_years(text: str) -> Optional[int]:
    text_lower = text.lower()
    patterns = [
        r"(\d+)\+?\s+years? of experience",
        r"experience\s+of\s+(\d+)\+?\s+years?",
        r"over\s+(\d+)\+?\s+years?",
        r"(\d+)\+?\s+years?\s+in\s+(software|it|development|engineering|analytics|data)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                return int(match.group(1))
            except (TypeError, ValueError):
                return None
    return None


def build_summary(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    summary_lines = []
    for line in lines:
        if len(line) < 20:
            continue
        summary_lines.append(line)
        if len(" ".join(summary_lines)) >= 350:
            break
    summary = " ".join(summary_lines)
    return summary[:500] if summary else text[:500]


def parse_resume(content: bytes, filename: str) -> Dict[str, Any]:
    text = extract_text(content, filename)
    if not text:
        return {"error": "No text extracted"}

    return {
        "name": extract_name(text),
        "current_role": extract_current_role(text),
        "education": extract_education(text),
        "skills": extract_skills_rule_based(text),
        "interests": extract_interests(text),
        "total_experience_years": extract_total_experience_years(text),
        "summary": build_summary(text),
        "raw_text_excerpt": text[:4000],
    }


def extract_json_object(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        return None

    try:
        parsed = json.loads(match.group(0))
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


async def extract_with_ai(text: str, fallback: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    prompt = f"""
Extract structured data from this resume text.
Return JSON only with these keys:
{{
  "name": "string or null",
  "current_role": "string or null",
  "education": "string or null",
  "skills": ["skill1", "skill2"],
  "interests": ["interest1", "interest2"],
  "total_experience_years": number or null,
  "summary": "2-3 sentence professional summary"
}}

Prefer explicit evidence from the resume. Normalize skill names. Do not invent details.

Fallback data:
{json.dumps({k: v for k, v in fallback.items() if k != "raw_text_excerpt"})}

Resume text:
{text[:12000]}
""".strip()

    try:
        response = await get_ai_nonstream([{"role": "user", "content": prompt}])
    except Exception:
        return None

    return extract_json_object(response)


def merge_resume_data(base: Dict[str, Any], ai_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not ai_data:
        base.pop("raw_text_excerpt", None)
        base["skills"] = unique_preserve(base.get("skills", []))[:20]
        base["interests"] = unique_preserve(base.get("interests", []))[:10]
        return base

    merged = dict(base)
    for key in ["name", "current_role", "education", "total_experience_years", "summary"]:
        if ai_data.get(key) not in (None, "", []):
            merged[key] = ai_data[key]

    merged["skills"] = unique_preserve((ai_data.get("skills") or []) + merged.get("skills", []))[:20]
    merged["interests"] = unique_preserve((ai_data.get("interests") or []) + merged.get("interests", []))[:10]
    merged.pop("raw_text_excerpt", None)
    return merged


async def parse_resume_from_content(content: bytes, filename: str) -> Dict[str, Any]:
    result = parse_resume(content, filename)
    if "error" in result:
        return result

    ai_result = await extract_with_ai(result["raw_text_excerpt"], result)
    return merge_resume_data(result, ai_result)
