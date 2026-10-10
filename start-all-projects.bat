@echo off
title Starting All Projects for Screenshots
echo.
echo ==========================================
echo  STARTING ALL 7 PROJECTS FOR SCREENSHOTS
echo ==========================================
echo.

echo [1/7] ProLink Frontend (CV #1)...
start "ProLink Frontend" cmd /k "cd /d C:\ProLink\prolink-frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/7] SchoolHub (CV #2) - Frontend...
start "SchoolHub Frontend" cmd /k "cd /d C:\New folder\School hub\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/7] SchoolHub Backend...
start "SchoolHub Backend" cmd /k "cd /d C:\New folder\School hub\backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [4/7] LykaFashion (CV #3)...
start "LykaFashion" cmd /k "cd /d C:\New folder\LykaFashion && npm run dev"

timeout /t 3 /nobreak >nul

echo [5/7] HumanProof (CV #4)...
start "HumanProof" cmd /k "cd /d C:\New folder\AI humanizer && npm run dev"

timeout /t 3 /nobreak >nul

echo [6/7] VentureHub...
start "VentureHub" cmd /k "cd /d C:\New folder\venturehub\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [7/7] Friendzy...
start "Friendzy" cmd /k "cd /d C:\New folder\Friendzy\frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ==========================================
echo  ALL 7 TERMINALS LAUNCHED
echo ==========================================
echo.
echo NEXT STEPS:
echo 1. Wait for each terminal to show "Local: http://localhost:PORT"
echo 2. Open Chrome and capture screenshots at 1080x1080
echo 3. Save to: C:\New folder\School hub\linkedin-posts\screenshots\
echo.
echo URLS TO CAPTURE:
echo   ProLink      -> http://localhost:3000
echo   SchoolHub    -> http://localhost:3000 (frontend)
echo   LykaFashion  -> http://localhost:3000
echo   HumanProof   -> http://localhost:3000
echo   VentureHub   -> http://localhost:3000
echo   Friendzy     -> http://localhost:5173
echo   EduCore      -> Open file:///C:/New folder/School hub/educore.html directly
echo.
echo SCREENSHOT NAMES:
echo   slide2-prolink.png
echo   slide3-schoolhub.png (already have)
echo   slide4-lykafashion.png
echo   slide5-humanproof.png
echo   slide6-educore-login.png + slide6-educore-dash.png
echo   slide7-venturehub.png
echo   slide8-friendzy.png
echo.
pause