@echo off
title Backend Spring Boot - MoroccoRiads
SET "JAVA_HOME=D:\IntelliJ IDEA 2025.2.4\jbr"
SET "PATH=%JAVA_HOME%\bin;C:\Users\Houda\apache-maven-3.9.6\bin;%PATH%"
echo ========================================================
echo Démarrage du Backend Spring Boot (Port 8080)...
echo ========================================================
cd /d "d:\pfa1.0.0\backend"
"C:\Users\Houda\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
pause
