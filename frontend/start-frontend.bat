@echo off
SET "PATH=C:\Program Files\nodejs;%PATH%"
echo Demarrage du Frontend Next.js (Gestion Riads)...
npx next dev --webpack -H 0.0.0.0 -p 3000
