#!/usr/bin/env powershell

# AI Interviewer Frontend Startup Script
# Starts the Next.js development server

$projectRoot = "C:\Users\user\OneDrive\Documents\Data_Scientist\Internship_Projects\AI-Interviewer-Skill-assessment"
$frontendPath = Join-Path $projectRoot "frontend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Interviewer - Frontend Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "$frontendPath/node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Push-Location $frontendPath
    npm install
    Pop-Location
    Write-Host ""
}

# Check .env file
if (-not (Test-Path "$frontendPath/.env")) {
    Write-Host "Warning: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with Supabase credentials" -ForegroundColor Red
    exit 1
}

Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

Push-Location $frontendPath
npm run dev
Pop-Location
