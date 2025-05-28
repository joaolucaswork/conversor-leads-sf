@echo off
echo Starting Leads Processing Backend Server...
echo.

cd /d "%~dp0backend"
python start_server.py

pause
