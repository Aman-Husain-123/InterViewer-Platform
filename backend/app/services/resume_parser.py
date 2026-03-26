import io
import json
import re
from typing import Optional, List, Dict, Any
from pypdf import PdfReader
from docx import Document
from openai import OpenAI
from app.core.config import settings

class ResumeParserService:
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )

    def extract_text(self, file_content: bytes, filename: str) -> str:
        """Extracts raw text from PDF or DOCX bytes."""
        text = ""
        try:
            if filename.lower().endswith(".pdf"):
                reader = PdfReader(io.BytesIO(file_content))
                for page in reader.pages:
                    text += page.extract_text() + "\n"
            elif filename.lower().endswith(".docx"):
                doc = Document(io.BytesIO(file_content))
                for para in doc.paragraphs:
                    text += para.text + "\n"
            else:
                # Assume raw text if not pdf/docx
                text = file_content.decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"Error extracting text from {filename}: {e}")
            # Fallback to decoder
            text = file_content.decode("utf-8", errors="ignore")
        return text

    def parse_resume(self, resume_text: str) -> Dict[str, Any]:
        """Parses resume text into structured JSON using GPT-4o."""
        if not settings.OPENAI_API_KEY:
            return self._fallback_regex_parse(resume_text)

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert HR recruitment AI. Extract candidate information from the provided resume text into a precise JSON format."},
                    {"role": "user", "content": f"Resume Text:\n{resume_text}\n\nReturn JSON with these fields: name, email, phone, skills[], experience[{'company', 'role', 'duration', 'description'}], education[{'institution', 'degree', 'year'}], certifications[], projects[]."}
                ],
                response_format={"type": "json_object"}
            )
            parsed_data = json.loads(response.choices[0].message.content)
            return parsed_data
        except Exception as e:
            print(f"OpenAI Parsing Error: {e}")
            return self._fallback_regex_parse(resume_text)

    def _fallback_regex_parse(self, text: str) -> Dict[str, Any]:
        """Basic regex-based extraction for email and phone if AI fails."""
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        
        return {
            "name": "Extracted Candidate",
            "email": email_match.group(0) if email_match else "unknown@example.com",
            "phone": phone_match.group(0) if phone_match else "",
            "skills": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "projects": [],
            "note": "AI parsing failed, used regex fallback."
        }

resume_parser = ResumeParserService()
