import numpy as np
from typing import List, Dict, Any
from openai import OpenAI
from app.core.config import settings

class MatchingEngine:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_model = "text-embedding-3-small"

    def generate_embedding(self, text: str) -> List[float]:
        """Generates a 1536-dim embedding for the given text."""
        if not text or not settings.OPENAI_API_KEY:
            return [0.0] * 1536
        
        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Embedding Error: {e}")
            return [0.0] * 1536

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Calculates cosine similarity between two vectors."""
        a = np.array(vec_a)
        b = np.array(vec_b)
        if np.all(a == 0) or np.all(b == 0):
            return 0.0
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        return float(dot_product / (norm_a * norm_b))

    def compute_skill_overlap(self, resume_skills: List[str], jd_skills: List[str]) -> float:
        """Calculates simple intersection-based overlap for skills (0.0 to 1.0)."""
        if not jd_skills:
            return 1.0  # No specific skills required in JD
        
        r_skills = set(s.lower().strip() for s in resume_skills)
        j_skills = set(s.lower().strip() for s in jd_skills)
        
        # Count semantic overlap if exact match fails? (Optional improvement)
        overlap = len(r_skills.intersection(j_skills))
        return overlap / len(j_skills)

    def compute_match_score(self, resume_text: str, jd_text: str, resume_skills: List[str], jd_requirements: List[str]) -> float:
        """
        Returns a weighted match score (0-100) based on:
        - 70% Semantic Similarity (Embeddings)
        - 30% Skill Overlap
        """
        # 1. Semantic Similarity
        resume_emb = self.generate_embedding(resume_text)
        jd_emb = self.generate_embedding(jd_text)
        semantic_sim = self.cosine_similarity(resume_emb, jd_emb) # 0 to 1
        
        # 2. Skill Overlap
        skill_overlap = self.compute_skill_overlap(resume_skills, jd_requirements) # 0 to 1
        
        # 3. Weighted Final Score
        final_score = (semantic_sim * 0.7) + (skill_overlap * 0.3)
        return round(final_score * 100, 1)

matching_engine = MatchingEngine()
# Default threshold for auto-invite
MATCH_THRESHOLD = float(getattr(settings, "MATCH_THRESHOLD", 75.0))
