import pytest
from app.services.matching_engine import matching_engine

def test_match_score_high():
    jd = "Senior Python Developer with experience in FastAPI and OpenAI."
    resume = "Expert Python backend engineer. Built many FastAPI apps and integrated OpenAI GPT-4."
    skills_jd = ["Python", "FastAPI", "OpenAI"]
    skills_resume = ["Python", "FastAPI", "OpenAI", "Docker"]
    
    score = matching_engine.compute_match_score(resume, jd, skills_resume, skills_jd)
    # Strong match should be high
    assert score > 75.0

def test_match_score_low():
    jd = "Experienced Nurse for intensive care unit."
    resume = "Graphic designer specialized in Adobe Photoshop and Illustrator."
    skills_jd = ["Nursing", "ICU", "Patient Care"]
    skills_resume = ["Photoshop", "Illustrator", "Figma"]
    
    score = matching_engine.compute_match_score(resume, jd, skills_resume, skills_jd)
    # Weak match should be low
    assert score < 50.0
