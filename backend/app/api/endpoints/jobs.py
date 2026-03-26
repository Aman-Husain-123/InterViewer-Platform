from fastapi import APIRouter, HTTPException, Depends
from app.schemas.schemas import JobCreate, JobResponse
from typing import List
from app.db.supabase import supabase
from app.api.v1.endpoints.auth import get_current_user
from app.core.deps import CurrentUser
import uuid
import json

router = APIRouter()

@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate, current_user: CurrentUser = Depends(get_current_user)):
    """
    Creates a new job listing.
    """
    try:
        # 1. ATTEMPT TO SYNC PROFILE (CRITICAL: We now raise the error if it fails)
        try:
            profile_data = {
                "id": current_user.id,
                "email": current_user.email,
                "role": "recruiter"
            }
            # This must succeed for the next step to work
            supabase.table("profiles").upsert(profile_data, on_conflict="id").execute()
            print(f"Auto-synced profile for {current_user.email}")
        except Exception as profile_err:
            print(f"Profile Sync Fatal Error: {profile_err}")
            # We raise this because if we can't create the profile, the job WILL NOT save.
            # This error will show us if the 'profiles' table is missing.
            raise HTTPException(
                status_code=500, 
                detail=f"CRITICAL: Failed to initialize recruiter profile. Reason: {str(profile_err)}"
            )

        # 2. Check if user is recruiter
        if current_user.role != "recruiter":
            raise HTTPException(status_code=403, detail="Only recruiters can create jobs")

        # 3. Insert Job Data
        job_data = job.model_dump()
        job_data["recruiter_id"] = current_user.id
        
        response = supabase.table("jobs").insert(job_data).execute()
        
        if response.data:
            return response.data[0]
        
        raise HTTPException(status_code=400, detail="Failed to create job - database returned no data.")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Job Creation Fatal Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[JobResponse])
def list_jobs():
    """Returns all active jobs."""
    try:
        response = supabase.table("jobs").select("*").eq("is_active", True).execute()
        data = response.data or []
        # Support both JSON objects and JSON strings from Supabase
        for job in data:
            if isinstance(job.get("requirements"), str):
                try:
                    job["requirements"] = json.loads(job["requirements"])
                except Exception as e:
                    print(f"Failed to parse requirements string: {job.get('requirements')}. Error: {e}")
                    job["requirements"] = []
        return data
    except Exception as e:
        print(f"List Jobs Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    """Returns details for a single job."""
    try:
        response = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        job = response.data[0]
        if isinstance(job.get("requirements"), str):
            try:
                job["requirements"] = json.loads(job["requirements"])
            except:
                job["requirements"] = []
        return job
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get Job Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
