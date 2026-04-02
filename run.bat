@echo off
title Blog System
echo.
echo  Blog Manuscript Image Generator
echo  ================================
echo.

echo  [1/3] Checking Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo  Installing Node.js...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent >nul 2>nul
    if %errorlevel% neq 0 (
        echo  Please install from https://nodejs.org
        start https://nodejs.org
        pause
        exit
    )
    set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"
    echo  Done!
) else ( echo  OK )

echo  [2/3] Checking Git...
git --version >nul 2>nul
if %errorlevel% neq 0 (
    echo  Installing Git...
    winget install Git.Git --accept-source-agreements --accept-package-agreements --silent >nul 2>nul
    if %errorlevel% neq 0 (
        echo  Please install from https://git-scm.com
        start https://git-scm.com/download/win
        pause
        exit
    )
    set "PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd"
    echo  Done!
) else ( echo  OK )

powershell -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force" >nul 2>nul

echo  [3/3] Checking code...
if exist "blog-auto\src\app" (
    cd blog-auto
    echo  Updating code...
    git pull
    cd ..
)
if not exist "blog-auto" (
    echo  Downloading code...
    git clone https://github.com/gudwn9352-alt/blog-auto.git
    if not exist "blog-auto" (
        echo  [ERROR] Download failed. Check internet.
        pause
        exit
    )
)
cd blog-auto

if exist "..\.env.local" (
    copy "..\.env.local" ".env.local" >nul
    echo  .env.local updated!
        echo  .env.local copied!
)
if not exist ".env.local" (
    echo  [ERROR] .env.local file missing.
    pause
    exit
)

if not exist "node_modules" (
    echo  Installing packages... (1-2 min)
    call npm install
)

echo.
echo  Ready! Browser: http://localhost:3000
echo  Close this window to stop.
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
call npx next dev
