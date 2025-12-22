#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")"

# Create virtual environment if it doesn't exist
if [ ! -d "backend_env" ]; then
    echo "Creating virtual environment..."
    python3 -m venv backend_env
fi

# Activate virtual environment
source backend_env/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r backend/requirements.txt

# Run the server
echo "Starting Backend Server on http://localhost:8000"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
