@echo off
chcp 65001 >nul
title 업데이트

echo.
echo  업데이트 중...
echo.

git pull
call npm install --silent 2>nul

echo.
echo  완료! "실행.bat"을 실행하세요.
echo.
pause
