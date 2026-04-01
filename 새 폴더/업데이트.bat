@echo off
chcp 65001 >nul
title Update

echo.
echo  Updating...
echo.

git pull
call npm install --silent 2>nul

echo.
echo  Done! Run "실행.bat" to start.
echo.
pause
