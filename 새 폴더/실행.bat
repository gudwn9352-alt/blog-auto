@echo off
title Blog System Setup
echo.
echo  Blog Manuscript Image Generator
echo  ================================
echo.

:: ===== 1. Node.js =====
echo  [1/3] Checking Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo  Installing Node.js...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent >nul 2>nul
    if %errorlevel% neq 0 (
        echo  Downloading Node.js installer...
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.16.0/node-v22.16.0-x64.msi' -OutFile '%TEMP%\node.msi'" 2>nul
        msiexec /i "%TEMP%\node.msi" /quiet /norestart
        del "%TEMP%\node.msi" >nul 2>nul
    )
    set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"
    echo  Node.js installed!
) else (
    echo  OK
)

:: ===== 2. Git =====
echo  [2/3] Checking Git...
git --version >nul 2>nul
if %errorlevel% neq 0 (
    echo  Installing Git...
    winget install Git.Git --accept-source-agreements --accept-package-agreements --silent >nul 2>nul
    if %errorlevel% neq 0 (
        echo  Downloading Git installer...
        powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.2/Git-2.47.1.2-64-bit.exe' -OutFile '%TEMP%\git.exe'" 2>nul
        "%TEMP%\git.exe" /VERYSILENT /NORESTART
        del "%TEMP%\git.exe" >nul 2>nul
    )
    set "PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd"
    echo  Git installed!
) else (
    echo  OK
)

:: PowerShell policy
powershell -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force" >nul 2>nul

:: ===== 3. Code =====
echo  [3/3] Checking code...
if exist "src\app" (
    echo  Updating...
    git pull >nul 2>nul
) else if exist "blog-auto\src" (
    cd blog-auto
) else (
    echo  Downloading code...
    git clone https://github.com/gudwn9352-alt/blog-auto.git >nul 2>nul
    if exist "blog-auto" ( cd blog-auto ) else (
        echo  [ERROR] Download failed. Check internet.
        pause
        exit
    )
)

:: .env.local
if not exist ".env.local" (
    if exist "..\.env.local" (
        copy "..\.env.local" ".env.local" >nul
    ) else (
        echo  [ERROR] .env.local missing.
        pause
        exit
    )
)

:: Packages
if not exist "node_modules" (
    echo  Installing packages... (1-2 min)
    call npm install --silent 2>nul
)

:: Run
echo.
echo  Ready! Browser: http://localhost:3000
echo  Close this window to stop.
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
call npx next dev
