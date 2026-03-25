import pytest
import io
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.supabase import supabase

client = TestClient(app)

def test_full_apply_flow():
    # 1. Ensure we have a job in the system to apply for
    job_id = str(uuid.uuid4())
    job_data = {
        "id": job_id,
        "title": "Software Engineer (Test)",
        "description": "Building AI features at scale.",
        "requirements": ["Python", "OpenAI"],
        "recruiter_id": "00000000-0000-0000-0000-000000000000" # Dummy / Valid UUID if profile exists
    }
    
    # Try to insert dummy job for test (only works if auth/rls allows or using service role)
    # For CI, usually we use mock DB or bypass RLS
    try:
        supabase.table("jobs").upsert(job_data).execute()
    except:
        # Fallback: get an existing job if upsert fails
        jobs_res = supabase.table("jobs").select("id").limit(1).execute()
        if jobs_res.data:
            job_id = jobs_res.data[0]["id"]
        else:
            pytest.skip("No jobs available for testing.")

    # 2. CREATE A SAMPLE FILE
    file_content = b"Candidate Name: John Doe. Skills: Python, AI, Machine Learning. Experience at Google for 10 years."
    file = io.BytesIO(file_content)
    file.name = "resume.pdf" # pretending it's a pdf for extension check

    # 3. POST /applications/
    response = client.post(
        "/api/v1/applications/",
        data={
            "job_id": job_id,
            "name": "Integration Test Candidate",
            "email": "test@example.com",
            "phone": "1234567890"
        },
        files={"file": ("resume.pdf", file, "application/pdf")}
    )

    assert response.status_code == 200
    data = response.json()
    assert "application_id" in data
    assert "match_score" in data
    assert "status" in data
    assert "parsed_data" in data
    
    # 4. GET status
    app_id = data["application_id"]
    r2 = client.get(f"/api/v1/applications/status/{app_id}")
    assert r2.status_code == 200
    assert r2.json()["status"] == data["status"]

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
