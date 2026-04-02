@echo off
title Update
echo.
echo  Updating...
echo.
if exist "blog-auto" ( cd blog-auto )
git pull
call npm install >nul 2>nul
echo.
echo  Done! Run "run.bat" to start.
echo.
pause
