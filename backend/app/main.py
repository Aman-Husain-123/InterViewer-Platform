"""
Updated FastAPI main application.
- CORS configured for localhost:3000 and :3001
- /health and / root endpoints
- Mounts /api/v1 routers (legacy + new auth)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.endpoints import jobs, applications, assessments, schedule, interview_ws
from app.api.v1.endpoints import auth

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AI Interview Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
# Legacy endpoints (keep working)
app.include_router(jobs.router,          prefix="/api/v1/jobs",         tags=["Jobs"])
app.include_router(applications.router,  prefix="/api/v1/applications",  tags=["Applications"])
app.include_router(assessments.router,   prefix="/api/v1/assessments",   tags=["Assessments"])
app.include_router(schedule.router,      prefix="/api/v1/schedule",      tags=["Schedule"])
app.include_router(interview_ws.router,  prefix="/ws/v1/interview",      tags=["Interview WS"])

# New v1 auth router
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}", "version": "1.0.0"}


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}
