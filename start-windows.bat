@echo off
title AICTE Integrated Grievance Portal
echo ========================================================
echo   AICTE Sovereign Complaint & Monitoring Dashboard
echo ========================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo.
    echo Please install Node.js (LTS version) from:
    echo   https://nodejs.org/
    echo.
    echo After installation is complete, close this window and double-click start-windows.bat again.
    echo.
    pause
    exit /b
)

:: 2. Check and install dependencies if node_modules is missing
if not exist node_modules (
    echo [INFO] First-time setup: Installing required libraries...
    echo (This takes about 30-60 seconds depending on your connection)
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an issue.
        pause
        exit /b
    )
    echo.
)

:: 3. Start Vite dev server (will automatically open http://localhost:3000 in your browser)
echo [INFO] Starting the AICTE Portal server...
echo The site will automatically launch in your default web browser!
echo.
echo NOTE: Keep this command prompt window open while viewing the site.
echo (Press Ctrl + C to stop the server when done)
echo.

call npm run dev

pause
