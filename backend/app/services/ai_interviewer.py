import json
import logging
from typing import Dict, Any, List, Union

logger = logging.getLogger(__name__)

class AIInterviewer:
    """Core logic for round management and system prompts for the AI interviewer."""

    @staticmethod
    def get_system_prompt(
        round_name: str, 
        name: str, 
        parsed_resume: dict, 
        job_description: str,
        company: str = "Euron AI",
        expected_salary: str = "N/A",
        budget_min: str = "60,000",
        budget_max: str = "100,000"
    ) -> str:
        """Dynamic system prompts per round."""
        
        # Safety guard for missing resume data
        resume = parsed_resume or {}
        summary = resume.get("summary", "Not provided")
        skills = resume.get("skills", [])
        
        directives = {
            "INTRO": f"You are Alex, a professional AI interviewer at {company}. The candidate is {name}. "
                     f"Their background: {summary}. Ask 3-4 warm-up questions about their background.",
            
            "TECHNICAL": f"Now conduct the technical round. Focus on: {', '.join(skills)}. "
                         f"The role requirements: {job_description}. Ask 4-5 technical questions.",
            
            "HR": "Conduct the behavioral round using the STAR method. "
                  "Ask about teamwork, leadership, and conflict resolution scenarios.",
            
            "SALARY": f"Discuss compensation. Candidate expects {expected_salary}. "
                      f"Budget is between {budget_min} and {budget_max}. "
                      "Negotiate professionally within these limits."
        }
        
        base_instructions = (
            "You speak via voice. Be concise (max 2 sentences per response). "
            "Wait for the candidate to finish before responding. "
            "Ask only one question at a time."
        )
        
        return f"{directives.get(round_name, 'You are an AI Interviewer.')}\n\n{base_instructions}"

    @staticmethod
    def detect_round_completion(transcript: List[Dict[str, str]], current_round: str) -> bool:
        """Determines if enough interaction has occurred to transition rounds."""
        exchanges = [t for t in transcript if t.get("role") == "agent"]
        
        round_limits = {
            "INTRO": 4,
            "TECHNICAL": 6,
            "HR": 5,
            "SALARY": 3,
            "COMPLETED": 0
        }
        
        return len(exchanges) >= round_limits.get(current_round, 10)

    @staticmethod
    def handle_salary_negotiation(
        expected_salary: Union[int, float, str], 
        budget_min: Union[int, float], 
        budget_max: Union[int, float]
    ) -> Dict[str, Any]:
        """Logic for professional negotiation."""
        try:
            if isinstance(expected_salary, str):
                exp = float(expected_salary.replace(",", "").replace("$", ""))
            else:
                exp = float(expected_salary)
        except:
            exp = 0
            
        if exp <= budget_max:
            return {
                "in_budget": True, 
                "recommendation": "Acceptable within limits.", 
                "negotiation_flag": False
            }
        else:
            return {
                "in_budget": False, 
                "recommendation": "Negotiate lower or flag as over-budget.", 
                "negotiation_flag": True
            }

ai_interviewer = AIInterviewer()
