@echo off
chcp 65001 >nul
title 블로그 원고 이미지 생성 시스템 - 업데이트

echo.
echo ========================================
echo  프로그램 업데이트
echo ========================================
echo.

echo 최신 코드 가져오는 중...
git pull

echo 패키지 업데이트 중...
call npm install --silent 2>nul

echo.
echo ========================================
echo  업데이트 완료!
echo  설치및실행.bat 을 실행하세요.
echo ========================================
echo.
pause
