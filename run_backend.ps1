# Set working directory to project root
Set-Location -Path $PSScriptRoot

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Starting ComFuse FastAPI Backend on http://localhost:8000" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan

& ".\.venv\Scripts\python.exe" -m uvicorn backend.main:app --reload --port 8000
