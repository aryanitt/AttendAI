@echo off
echo ============================================
echo   Smart Attendance Backend
echo ============================================
echo.

REM Use the short-path venv (avoids Windows long path issues with TensorFlow)
set VENV_PYTHON=C:\tf_venv\Scripts\python.exe

if not exist %VENV_PYTHON% (
    echo ERROR: Virtual environment not found at C:\tf_venv
    echo Please run: python -m venv C:\tf_venv
    echo Then: C:\tf_venv\Scripts\python.exe -m pip install -r requirements.txt
    pause
    exit /b 1
)

echo Using Python: %VENV_PYTHON%
echo Starting Flask server on http://localhost:5000 ...
echo.

cd /d "%~dp0"
%VENV_PYTHON% run.py
pause
