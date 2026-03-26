import numpy as np
import re
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
        """Calculates normalized skill matching (0.0 to 1.0) with fuzzy sub-string handling."""
        if not jd_skills:
            return 1.0  # No specific skills required in JD
        
        # Normalize: lower, strip, remove non-alphanumeric chars for cleaner matching
        r_skills = [re.sub(r'[^a-zA-Z0-9]', '', s.lower()) for s in resume_skills if s]
        j_skills = [re.sub(r'[^a-zA-Z0-9]', '', s.lower()) for s in jd_skills if s]
        
        if not j_skills: return 1.0
        
        matches = 0
        for target in j_skills:
            # Check if any resume skill is a substring of or contains the target skill
            # e.g., 'react' matches 'reactjs' and vice versa
            if any((target in rs or rs in target) for rs in r_skills):
                matches += 1
        
        return matches / len(j_skills)

    def compute_match_score(self, resume_text: str, jd_text: str, resume_skills: List[str], jd_requirements: List[str]) -> float:
        """
        Returns a weighted match score (0-100) based on:
        - 80% Semantic Similarity (Embeddings capture overall context)
        - 20% Skill Overlap (Ensures specific tooling is present)
        """
        # 1. Semantic Similarity
        resume_emb = self.generate_embedding(resume_text)
        jd_emb = self.generate_embedding(jd_text)
        semantic_sim = self.cosine_similarity(resume_emb, jd_emb) # 0 to 1
        
        # 2. Skill Overlap
        skill_overlap = self.compute_skill_overlap(resume_skills, jd_requirements) # 0 to 1
        
        # 3. Weighted Final Score (Boosted Semantic weight for better general matching)
        final_score = (semantic_sim * 0.8) + (skill_overlap * 0.2)
        
        # Scale: Semantic sim is rarely 1.0, so we normalize the result for UX
        # Typical good match is 0.7-0.9.
        ux_score = min(round(final_score * 105, 1), 100.0)
        return ux_score

matching_engine = MatchingEngine()
# Default threshold for auto-invite
MATCH_THRESHOLD = float(getattr(settings, "MATCH_THRESHOLD", 75.0))
