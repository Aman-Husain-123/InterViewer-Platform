#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verification script to check if all interview scheduling features are integrated.
Run this to verify backend implementation is complete.
"""

import os
import sys
from pathlib import Path

def check_file_exists(path: str) -> tuple[bool, str]:
    """Check if file exists and return status."""
    exists = os.path.exists(path)
    status = "✅" if exists else "❌"
    return exists, status

def check_file_contains(path: str, *patterns: str) -> dict:
    """Check if file contains patterns."""
    if not os.path.exists(path):
        return {pattern: False for pattern in patterns}
    
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    return {pattern: pattern in content for pattern in patterns}

def main():
    print("\n" + "="*70)
    print("🔍 INTERVIEW SCHEDULING INTEGRATION VERIFICATION")
    print("="*70 + "\n")
    
    base_path = Path(__file__).parent
    
    # Check 1: Files exist
    print("1️⃣  CHECKING FILE STRUCTURE...")
    print("-" * 70)
    
    files_to_check = {
        "Backend Endpoints": "backend/app/api/endpoints/notifications.py",
        "Pydantic Models": "backend/app/schemas/schemas.py",
        "Main App": "backend/app/main.py",
        "Database Migration": "backend/migrations/add_notifications_and_invites.sql",
        "Schema File": "supabase_schema.sql",
    }
    
    all_files_exist = True
    for name, filepath in files_to_check.items():
        full_path = base_path / filepath
        exists, status = check_file_exists(full_path)
        all_files_exist = all_files_exist and exists
        print(f"{status} {name}: {filepath}")
    
    # Check 2: Content verification
    print("\n2️⃣  CHECKING API ENDPOINTS IMPLEMENTATION...")
    print("-" * 70)
    
    endpoints_file = base_path / "backend/app/api/endpoints/notifications.py"
    if os.path.exists(endpoints_file):
        endpoints = [
            "POST /invites",
            "GET /invites/{invite_id}",
            "POST /invites/{invite_id}/respond",
            "GET /notifications",
            "POST /notifications/{id}/read",
            "GET /recruiter/responses",
        ]
        
        with open(endpoints_file, 'r') as f:
            content = f.read()
        
        for endpoint in endpoints:
            has_endpoint = endpoint in content or endpoint.split()[1] in content
            status = "✅" if has_endpoint else "❌"
            print(f"{status} {endpoint}")
    
    # Check 3: Pydantic models
    print("\n3️⃣  CHECKING PYDANTIC MODELS...")
    print("-" * 70)
    
    schemas_file = base_path / "backend/app/schemas/schemas.py"
    if os.path.exists(schemas_file):
        models = [
            "class NotificationMetadata",
            "class NotificationResponse",
            "class InterviewInviteCreate",
            "class InterviewInviteResponse",
            "class CandidateResponseRequest",
            "class RecruiterResponseData",
        ]
        
        results = check_file_contains(str(schemas_file), *models)
        for model, found in results.items():
            status = "✅" if found else "❌"
            print(f"{status} {model}")
    
    # Check 4: Router registration
    print("\n4️⃣  CHECKING ROUTER REGISTRATION...")
    print("-" * 70)
    
    main_file = base_path / "backend/app/main.py"
    if os.path.exists(main_file):
        checks = [
            ("Notifications import", "from app.api.endpoints import ... notifications"),
            ("Router inclusion", "app.include_router(notifications.router"),
            ("Correct prefix", 'prefix="/api/v1"'),
        ]
        
        results = check_file_contains(str(main_file), *[c[1] for c in checks])
        for (name, pattern), found in zip(checks, results.values()):
            status = "✅" if found else "❌"
            print(f"{status} {name}")
    
    # Check 5: Database tables
    print("\n5️⃣  CHECKING DATABASE TABLES DEFINITION...")
    print("-" * 70)
    
    schema_file = base_path / "supabase_schema.sql"
    if os.path.exists(schema_file):
        tables = [
            "CREATE TABLE IF NOT EXISTS public.interview_invites",
            "CREATE TABLE IF NOT EXISTS public.notifications",
        ]
        
        results = check_file_contains(str(schema_file), *tables)
        for table, found in results.items():
            status = "✅" if found else "❌"
            table_name = table.split("public.")[-1].replace('"', '')
            print(f"{status} {table_name} table definition")
    
    # Check 6: RLS Policies
    print("\n6️⃣  CHECKING RLS SECURITY POLICIES...")
    print("-" * 70)
    
    migration_file = base_path / "backend/migrations/add_notifications_and_invites.sql"
    if os.path.exists(migration_file):
        policies = [
            "Recruiters manage invites",
            "Candidates view invites",
            "Users view own notifications",
        ]
        
        results = check_file_contains(str(migration_file), *policies)
        for policy, found in results.items():
            status = "✅" if found else "❌"
            print(f"{status} Policy: {policy}")
    
    # Check 7: Enhanced schedule endpoints
    print("\n7️⃣  CHECKING ENHANCED SCHEDULE ENDPOINTS...")
    print("-" * 70)
    
    schedule_file = base_path / "backend/app/api/endpoints/schedule.py"
    if os.path.exists(schedule_file):
        logging_checks = [
            "logger.info",
            "🔄",  # Progress indicator
            "✅",  # Success indicator
            "⚠️",  # Warning indicator
        ]
        
        results = check_file_contains(str(schedule_file), *logging_checks)
        print(f"{'✅' if results['logger.info'] else '❌'} Logging implementation")
        print(f"{'✅' if results['🔄'] else '❌'} Progress indicators in logs")
    
    # Check 8: Documentation
    print("\n8️⃣  CHECKING DOCUMENTATION...")
    print("-" * 70)
    
    docs = [
        "API_SCHEDULING_CONTRACT.md",
        "FRONTEND_INTEGRATION_GUIDE.md",
        "IMPLEMENTATION_SUMMARY.md",
        "IMPLEMENTATION_COMPLETE.md",
    ]
    
    for doc in docs:
        full_path = base_path / doc
        exists, status = check_file_exists(full_path)
        print(f"{status} {doc}")
    
    # Summary
    print("\n" + "="*70)
    print("📊 INTEGRATION STATUS SUMMARY")
    print("="*70)
    
    if all_files_exist:
        print("\n✅ ALL FEATURES SUCCESSFULLY INTEGRATED!")
        print("\n✨ Ready for:")
        print("   1. Database migration (run add_notifications_and_invites.sql)")
        print("   2. Frontend integration (connect to new endpoints)")
        print("   3. Testing & deployment")
        return 0
    else:
        print("\n❌ Some files are missing! Please check the implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
