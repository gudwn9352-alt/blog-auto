@echo off
chcp 65001 >/dev/null
title Blog System

echo.
echo  Blog Manuscript Image Generator
echo  ================================
echo.

echo  [1/3] Checking Node.js...
node --version >/dev/null 2>/dev/null
if %errorlevel% neq 0 (
    echo  Installing Node.js...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent >/dev/null 2>/dev/null
    if %errorlevel% neq 0 (
        echo  Please install from https://nodejs.org
        start https://nodejs.org
        pause
        exit
    )
    set PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm
    echo  Done!
) else ( echo  OK )

echo  [2/3] Checking Git...
git --version >/dev/null 2>/dev/null
if %errorlevel% neq 0 (
    echo  Installing Git...
    winget install Git.Git --accept-source-agreements --accept-package-agreements --silent >/dev/null 2>/dev/null
    if %errorlevel% neq 0 (
        echo  Please install from https://git-scm.com
        start https://git-scm.com/download/win
        pause
        exit
    )
    set PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd
    echo  Done!
) else ( echo  OK )

powershell -Command Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force >/dev/null 2>/dev/null

echo  [3/3] Checking code...
if exist src\app (
    echo  Updating...
    git pull >/dev/null 2>/dev/null
) else if exist blog-auto\src (
    cd blog-auto
) else (
    echo  Downloading code...
    git clone https://github.com/gudwn9352-alt/blog-auto.git >/dev/null 2>/dev/null
    if exist blog-auto ( cd blog-auto ) else (
        echo  [ERROR] Download failed. Check internet.
        pause
        exit
    )
)

if not exist .env.local (
    if exist ..\.env.local (
        copy ..\.env.local .env.local >/dev/null
    ) else (
        echo  [ERROR] .env.local file missing.
        pause
        exit
    )
)

if not exist node_modules (
    echo  Installing packages... (1-2 min)
    call npm install --silent 2>/dev/null
)

echo.
echo  Ready! Browser: http://localhost:3000
echo  Close this window to stop.
echo.
timeout /t 2 /nobreak >/dev/null
start http://localhost:3000
call npx next dev