# 🚀 AI Interviewer Platform - Quick Start Guide

## ⚡ Quick Start (30 seconds)

### **Option 1: Automated Setup**
```powershell
# From project root directory
.\QUICKSTART.ps1
```

### **Option 2: Manual Setup**

#### **Terminal 1 - Frontend (Port 3000)**
```powershell
cd frontend
npm install
npm run dev
```

#### **Terminal 2 - Backend (Port 8000)**
```powershell
cd backend
python -m pip install -r requirements.txt
python main.py
```

---

## 🔗 Access Links

Once both services are running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Web application |
| **Landing** | http://localhost:3000 | Marketing page |
| **Login** | http://localhost:3000/login | Authentication |
| **Register** | http://localhost:3000/register | Sign up |
| **Backend API** | http://localhost:8000 | REST API |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **ReDoc** | http://localhost:8000/redoc | Alternative API docs |

---

## 📋 Prerequisites

### Frontend
- Node.js 18+ (check with `node --version`)
- npm or yarn

### Backend
- Python 3.10+ (check with `python --version`)
- pip (check with `pip --version`)

### Environment
- Supabase account & project (for database)
- .env file configured in backend/

---

## 🧪 Quick Test URLs

### Authentication Tests
```
# Candidate Login
GET http://localhost:3000/login?role=candidate

# Recruiter Login
GET http://localhost:3000/login?role=recruiter

# Register
GET http://localhost:3000/register
```

### API Tests
```
# List available interview slots
GET http://localhost:8000/api/v1/schedule/slots?application_id=test-app-id

# API Documentation
GET http://localhost:8000/docs
```

---

## 🛠️ Troubleshooting

### Frontend won't start
```powershell
cd frontend
rm -r node_modules
npm install
npm run dev
```

### Backend won't start
```powershell
cd backend
pip install -r requirements.txt
python main.py
```

### Port already in use
- Frontend (3000): `npx kill-port 3000`
- Backend (8000): `lsof -ti:8000 | xargs kill -9`

---

## 📚 Documentation

- **Frontend Auth**: `AUTHENTICATION_IMPLEMENTATION.md`
- **Backend Scheduling**: `schedule.py` (in attachments)
- **API Contract**: `API_SCHEDULING_CONTRACT.md`
- **Architecture**: `BRD_and_Architecture_Detailed.md`

---

## ✨ What's Ready

✅ Frontend Authentication
- Login/Register with role selection
- Candidate & Recruiter dashboards
- Protected routes
- Hydration fixes

✅ Backend Scheduling
- Get available slots
- Book interviews
- Send invitations
- Email confirmations

✅ Integration
- Frontend connects to Supabase
- Backend connects to Supabase
- Email service configured
- All endpoints documented

---

**Ready to go!** 🎉
