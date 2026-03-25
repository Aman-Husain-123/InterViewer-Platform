from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import List, Dict, Any, Optional
from app.api.v1.endpoints.auth import get_current_user
from app.core.deps import CurrentUser
from app.db.supabase import supabase
from app.services.resume_parser import resume_parser
from app.services.matching_engine import matching_engine, MATCH_THRESHOLD
import uuid

router = APIRouter()

@router.post("/")
async def apply_job(
    file: UploadFile = File(...),
    job_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
):
    """
    POST /api/v1/applications/
    Accepts resume file and applicant details. Uploads to Supabase, 
    parses, matches vs JD, and stores application.
    """
    try:
        # 1. READ FILE CONTENT
        file_content = await file.read()
        
        # 2. UPLOAD TO SUPABASE STORAGE
        file_ext = file.filename.split(".")[-1]
        file_path = f"resumes/{uuid.uuid4()}.{file_ext}"
        
        # Note: bucket 'resumes' must exist or be created via dashboard
        try:
            supabase.storage.from_("resumes").upload(file_path, file_content)
        except Exception as e:
            print(f"Supabase Storage Upload Error: {e}")
            # Continue locally if storage fails? (Or raise if mandatory)

        # 3. EXTRACT TEXT & PARSE
        resume_text = resume_parser.extract_text(file_content, file.filename)
        parsed_data = resume_parser.parse_resume(resume_text)
        
        # 4. FETCH JOB DETAILS (for matching)
        job_res = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not job_res.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = job_res.data[0]
        jd_text = f"{job['title']} {job['description']} {' '.join(job['requirements'] or [])}"
        
        # 5. COMPUTE MATCH SCORE
        match_score = matching_engine.compute_match_score(
            resume_text=resume_text,
            jd_text=jd_text,
            resume_skills=parsed_data.get("skills", []),
            jd_requirements=job.get("requirements", [])
        )
        
        # 6. DETERMINE STATUS
        status = "invited" if match_score >= MATCH_THRESHOLD else "pending_review"
        
        # 7. STORE IN DATABASE
        insert_data = {
            "job_id": job_id,
            "name": name,
            "email": email,
            "phone": phone,
            "resume_text": resume_text,
            "status": status,
            "match_score": match_score,
            "parsed_data": parsed_data,
        }
        
        db_res = supabase.table("applications").insert(insert_data).execute()
        if not db_res.data:
            raise HTTPException(status_code=500, detail="Failed to store application")
            
        application_id = db_res.data[0]["id"]
        
        return {
            "application_id": application_id,
            "match_score": match_score,
            "status": status,
            "parsed_data": parsed_data
        }
    except Exception as e:
        print(f"Application Submission Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{application_id}")
async def get_application_status(application_id: str):
    """GET /api/v1/applications/status/{id}."""
    res = supabase.table("applications").select("*").eq("id", application_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return res.data[0]

@router.get("/{job_id}", dependencies=[Depends(get_current_user)])
async def list_applications(job_id: str):
    """List applications for a job (Recruiter view)."""
    res = supabase.table("applications").select("*").eq("job_id", job_id).execute()
    return res.data or []
