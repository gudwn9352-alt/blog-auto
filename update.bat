@echo off
echo Updating...
git pull
call npm install --silent 2>/dev/null
echo Done!
pause
