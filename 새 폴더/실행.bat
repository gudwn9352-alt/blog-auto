@echo off
chcp 65001 >nul
title Blog System

echo.
echo  Blog Manuscript Image Generator
echo  ================================
echo.

:: Check Node.js
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not installed.
    echo  Download from https://nodejs.org and install first.
    echo.
    start https://nodejs.org
    pause
    exit
)

:: PowerShell policy
powershell -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force" >nul 2>nul

:: Download or update code
if exist "src\app" (
    echo  Updating code...
    git pull >nul 2>nul
) else if exist "blog-auto\src" (
    cd blog-auto
) else (
    echo  Downloading code... (30sec)
    git clone https://github.com/gudwn9352-alt/blog-auto.git >nul 2>nul
    if exist "blog-auto" ( cd blog-auto ) else (
        echo  [ERROR] Download failed. Check internet.
        pause
        exit
    )
)

:: Copy .env.local
if not exist ".env.local" (
    if exist "..\.env.local" (
        copy "..\.env.local" ".env.local" >nul
    ) else (
        echo  [ERROR] .env.local file missing.
        pause
        exit
    )
)

:: Install packages
if not exist "node_modules" (
    echo  Installing packages... (1-2 min)
    call npm install --silent 2>nul
)

:: Run
echo.
echo  Starting... Browser: http://localhost:3000
echo  Close this window to stop.
echo.

timeout /t 2 /nobreak >nul
start http://localhost:3000
call npx next dev
