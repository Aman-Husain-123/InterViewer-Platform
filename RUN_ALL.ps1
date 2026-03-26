#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start the AI Interviewer Platform (Frontend + Backend)

.DESCRIPTION
    This script starts both the frontend (Next.js on port 3000) and 
    backend (FastAPI on port 8000) services in separate windows.

.EXAMPLE
    .\RUN_ALL.ps1
#>

Write-Host "🚀 Starting AI Interviewer Platform..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$projectRoot = Get-Location

# Check if ports are available
Write-Host "✓ Checking ports..." -ForegroundColor Green
$port3000Free = -not (Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue).TcpTestSucceeded
$port8000Free = -not (Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue).TcpTestSucceeded

if (-not $port3000Free) {
    Write-Host "⚠️  Port 3000 is already in use!" -ForegroundColor Yellow
    Write-Host "   You can kill it with: npx kill-port 3000" -ForegroundColor Yellow
}

if (-not $port8000Free) {
    Write-Host "⚠️  Port 8000 is already in use!" -ForegroundColor Yellow
    Write-Host "   Kill it or change the backend port" -ForegroundColor Yellow
}

# Start Frontend
Write-Host "`n📱 Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command cd '$projectRoot\frontend'; npm install; npm run dev" `
    -WindowStyle Normal

# Wait a bit for frontend to start
Start-Sleep -Seconds 3

# Start Backend
Write-Host "⚙️  Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command cd '$projectRoot\backend'; pip install -r requirements.txt; python main.py" `
    -WindowStyle Normal

# Wait for services to start
Start-Sleep -Seconds 5

# Show access links
Write-Host "`n================================" -ForegroundColor Green
Write-Host "✅ Both services are starting!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "⚙️  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "📖 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Quick Links:" -ForegroundColor Yellow
Write-Host "   - Login:    http://localhost:3000/login" -ForegroundColor Yellow
Write-Host "   - Register: http://localhost:3000/register" -ForegroundColor Yellow
Write-Host "   - API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Tip: Check the backend window for logs" -ForegroundColor Green
Write-Host ""
