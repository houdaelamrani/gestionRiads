@echo off
SET "JAVA_HOME=C:\Users\Houda\.antigravity-ide\extensions\redhat.java-1.55.0-win32-x64\jre\21.0.11-win32-x86_64"
SET "PATH=%JAVA_HOME%\bin;C:\Users\Houda\apache-maven-3.9.6\bin;%PATH%"
echo Demarrage du Backend Spring Boot (Gestion Riads)...
"C:\Users\Houda\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
