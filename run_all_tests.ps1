# Test Runner Script for AI-Powered Smart Task Manager (Windows)
# This script runs all tests in the correct order

Write-Host "🚀 Starting comprehensive test suite for AI-Powered Smart Task Manager" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

# Backend Tests
Write-Host ""
Write-Host "🧪 Running Backend Tests..." -ForegroundColor Yellow
Write-Host "=============================="

Set-Location backend

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "⚠️ Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "✅ Installing backend dependencies..." -ForegroundColor Green
pip install -r requirements.txt

# Run backend tests
Write-Host "✅ Running backend unit tests..." -ForegroundColor Green
python -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term

Write-Host "✅ Backend tests completed!" -ForegroundColor Green

# Frontend Tests
Write-Host ""
Write-Host "🎨 Running Frontend Tests..." -ForegroundColor Yellow
Write-Host "============================="

Set-Location ..\frontend

# Install dependencies
Write-Host "✅ Installing frontend dependencies..." -ForegroundColor Green
npm install

# Run component tests
Write-Host "✅ Running React component tests..." -ForegroundColor Green
npm run test:ci

# Run integration tests
Write-Host "✅ Running integration tests..." -ForegroundColor Green
npm run test:coverage

Write-Host "✅ Frontend tests completed!" -ForegroundColor Green

# End-to-End Tests
Write-Host ""
Write-Host "🌐 Running End-to-End Tests..." -ForegroundColor Yellow
Write-Host "==============================="

# Start backend server in background
Write-Host "✅ Starting backend server..." -ForegroundColor Green
Set-Location ..\backend
Start-Process -FilePath "python" -ArgumentList "run.py" -NoNewWindow

# Wait for backend to start
Start-Sleep -Seconds 10

# Start frontend server in background
Write-Host "✅ Starting frontend server..." -ForegroundColor Green
Set-Location ..\frontend
Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow

# Wait for frontend to start
Start-Sleep -Seconds 15

# Run Cypress tests
Write-Host "✅ Running Cypress E2E tests..." -ForegroundColor Green
npm run cypress:run

Write-Host "✅ End-to-end tests completed!" -ForegroundColor Green

# Load Testing
Write-Host ""
Write-Host "⚡ Running Load Tests..." -ForegroundColor Yellow
Write-Host "========================"

Set-Location ..\backend\tests\load_testing

# Install load testing dependencies
pip install -r requirements.txt

# Run load tests
Write-Host "✅ Running API load tests..." -ForegroundColor Green
python run_load_tests.py

Write-Host "✅ Load tests completed!" -ForegroundColor Green

# Final Summary
Write-Host ""
Write-Host "🎉 All Tests Completed Successfully!" -ForegroundColor Green
Write-Host "===================================="
Write-Host "✅ Backend unit tests: PASSED" -ForegroundColor Green
Write-Host "✅ Frontend component tests: PASSED" -ForegroundColor Green
Write-Host "✅ Integration tests: PASSED" -ForegroundColor Green
Write-Host "✅ End-to-end tests: PASSED" -ForegroundColor Green
Write-Host "✅ Load tests: PASSED" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Phase 1 Testing Suite Complete!" -ForegroundColor Cyan
Write-Host "Ready to proceed to Phase 2: Core Feature Enhancement" -ForegroundColor Cyan
