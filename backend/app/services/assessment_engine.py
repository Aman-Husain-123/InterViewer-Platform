import json
import logging
from typing import Dict, Any, List
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class AssessmentEngine:
    """Phase 5: Automated scoring and feedback generation based on interview transcripts."""

    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )

    async def generate_scorecard(self, transcript: List[Dict], job_desc: str, candidate_resume: Dict) -> Dict[str, Any]:
        """Analyzes the full transcript and generates a detailed scorecard."""
        
        chat_content = "\n".join([f"{t['role']}: {t['text']}" for t in transcript if 'role' in t and 'text' in t])
        
        prompt = f"""
        You are a Senior Technical Recruiter. Based on the following interview transcript, JD, and Resume, generate a scorecard.
        
        JD: {job_desc}
        RESUME: {json.dumps(candidate_resume)}
        TRANSCRIPT:
        {chat_content}
        
        Provide a JSON object with:
        1. scores: {{ technical: 1-10, communication: 1-10, culture_fit: 1-10, overall: 1-10 }}
        2. feedback: {{ strengths: [], weaknesses: [], suggestions: "" }}
        3. recommendation: "hire" | "reject" | "further_review"
        4. round_breakdown: {{ intro: "summary", tech: "summary", hr: "summary", salary: "summary" }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{ "role": "system", "content": "You are a professional scorecard generator. Output ONLY valid JSON." },
                          { "role": "user", "content": prompt }],
                response_format={{ "type": "json_object" }}
            )
            
            scorecard = json.loads(response.choices[0].message.content)
            return scorecard
        except Exception as e:
            logger.error(f"Scorecard generation failed: {e}")
            return {
                "scores": { "technical": 0, "communication": 0, "culture_fit": 0, "overall": 0 },
                "feedback": { "strengths": [], "weaknesses": ["Error in generation"], "suggestions": str(e) },
                "recommendation": "further_review"
            }

assessment_engine = AssessmentEngine()
