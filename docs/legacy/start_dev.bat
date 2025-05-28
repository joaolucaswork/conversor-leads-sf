@echo off
echo ========================================
echo   Leads Processing Development Server
echo ========================================
echo.
echo Starting both Backend and Frontend servers...
echo.
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:5173
echo API Documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop all servers
echo.

npm run dev:servers
