@echo off
cd /d "%~dp0"
echo ====================================================
echo Starting ComFuse FastAPI Backend on http://localhost:8000
echo ====================================================
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
pause
