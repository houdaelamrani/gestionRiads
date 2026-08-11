@echo off
title MoroccoRiads - Lancement Global
echo ========================================================
echo   LANCEMENT DU PROJET MOROCCO RIADS
echo ========================================================
echo 1. Lancement du Backend Spring Boot (Port 8080)...
start "Backend Spring Boot" cmd /k "d:\pfa1.0.0\start-backend.bat"

echo 2. Lancement du Frontend Next.js (Port 3000)...
start "Frontend Next.js" cmd /k "d:\pfa1.0.0\start-frontend.bat"

echo.
echo Tout est lance !
echo - Frontend : http://localhost:3000
echo - Backend  : http://localhost:8080
echo ========================================================
ping 127.0.0.1 -n 6 >nul
