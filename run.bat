@echo off
chcp 65001 >nul
title Blog System

echo.
echo  Blog Manuscript Image Generator
echo  ================================
echo.

:: Block cloud folder execution
echo %CD% | findstr /I /C:"Google Drive" /C:"GoogleDrive" /C:"Dropbox" >nul
if %errorlevel% equ 0 (
    echo  [ERROR] Do NOT run from Google Drive / Dropbox!
    echo.
    echo  Copy these 3 files to Desktop first:
    echo    - run.bat
    echo    - update.bat
    echo    - .env.local
    echo.
    echo  Then run from Desktop.
    echo.
    pause
    exit
)

echo  [1/3] Checking Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo  Installing Node.js...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent >nul 2>nul
    if %errorlevel% neq 0 (
        start https://nodejs.org
        pause
        exit
    )
    set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"
)
echo  OK

echo  [2/3] Checking Git...
git --version >nul 2>nul
if %errorlevel% neq 0 (
    echo  Installing Git...
    winget install Git.Git --accept-source-agreements --accept-package-agreements --silent >nul 2>nul
    if %errorlevel% neq 0 (
        start https://git-scm.com/download/win
        pause
        exit
    )
    set "PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd"
)
echo  OK

powershell -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force" >nul 2>nul

echo  [3/3] Checking code...
if exist "src\app" (
    git pull >nul 2>nul
) else if exist "blog-auto\src" (
    cd blog-auto
) else (
    echo  Downloading code...
    git clone https://github.com/gudwn9352-alt/blog-auto.git >nul 2>nul
    if exist "blog-auto" ( cd blog-auto ) else (
        echo  [ERROR] Download failed.
        pause
        exit
    )
)

if not exist ".env.local" (
    if exist "..\.env.local" (
        copy "..\.env.local" ".env.local" >nul
    ) else (
        echo  [ERROR] .env.local missing.
        pause
        exit
    )
)

if not exist "node_modules" (
    echo  Installing packages... (1-2 min)
    call npm install --silent 2>nul
)

echo.
echo  Ready! Browser: http://localhost:3000
echo  Close this window to stop.
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
call npx next dev


