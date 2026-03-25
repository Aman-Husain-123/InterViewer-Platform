import pytest
from app.services.resume_parser import resume_parser

def test_parse_text_resume():
    resume_text = "John Doe. email: john@example.com. Skills: Python, FastAPI, SQL. Experience: Senior Dev at X Corp for 5 years."
    parsed = resume_parser.parse_resume(resume_text)
    
    assert "name" in parsed
    assert "email" in parsed
    assert "skills" in parsed
    assert isinstance(parsed["skills"], list)
    # Check if AI actually extracted something
    if parsed.get("note") != "AI parsing failed, used regex fallback.":
        assert any("python" in s.lower() for s in parsed["skills"])

def test_fallback_regex():
    text = "Contact me at hr@google.com or call 123-456-7890."
    parsed = resume_parser._fallback_regex_parse(text)
    assert parsed["email"] == "hr@google.com"
    assert "123-456-7890" in parsed["phone"]
