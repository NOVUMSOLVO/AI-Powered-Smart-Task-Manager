#!/bin/bash

# Test Runner Script for AI-Powered Smart Task Manager
# This script runs all tests in the correct order

set -e

echo "🚀 Starting comprehensive test suite for AI-Powered Smart Task Manager"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Backend Tests
echo ""
echo "🧪 Running Backend Tests..."
echo "=============================="

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# For Windows: venv\Scripts\activate

# Install dependencies
print_status "Installing backend dependencies..."
pip install -r requirements.txt

# Run backend tests
print_status "Running backend unit tests..."
python -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term

print_status "Backend tests completed!"

# Frontend Tests
echo ""
echo "🎨 Running Frontend Tests..."
echo "============================="

cd ../frontend

# Install dependencies
print_status "Installing frontend dependencies..."
npm install

# Run component tests
print_status "Running React component tests..."
npm run test:ci

# Run integration tests
print_status "Running integration tests..."
npm run test:coverage

print_status "Frontend tests completed!"

# End-to-End Tests
echo ""
echo "🌐 Running End-to-End Tests..."
echo "==============================="

# Start backend server in background
print_status "Starting backend server..."
cd ../backend
python run.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 10

# Start frontend server in background
print_status "Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 15

# Run Cypress tests
print_status "Running Cypress E2E tests..."
npm run cypress:run

# Cleanup
print_status "Cleaning up test servers..."
kill $BACKEND_PID $FRONTEND_PID

print_status "End-to-end tests completed!"

# Load Testing
echo ""
echo "⚡ Running Load Tests..."
echo "========================"

cd ../backend/tests/load_testing

# Install load testing dependencies
pip install -r requirements.txt

# Run load tests
print_status "Running API load tests..."
python run_load_tests.py

print_status "Load tests completed!"

# Final Summary
echo ""
echo "🎉 All Tests Completed Successfully!"
echo "===================================="
echo "✅ Backend unit tests: PASSED"
echo "✅ Frontend component tests: PASSED"
echo "✅ Integration tests: PASSED" 
echo "✅ End-to-end tests: PASSED"
echo "✅ Load tests: PASSED"
echo ""
echo "🚀 Phase 1 Testing Suite Complete!"
echo "Ready to proceed to Phase 2: Core Feature Enhancement"
