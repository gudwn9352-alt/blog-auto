@echo off
chcp 65001 >nul
title 블로그 원고 이미지 생성 시스템

echo.
echo  블로그 원고 이미지 생성 시스템
echo  ─────────────────────────────
echo.

:: Node.js 확인
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo  [오류] Node.js가 설치되어 있지 않습니다.
    echo  https://nodejs.org 에서 설치 후 다시 실행하세요.
    echo.
    pause
    exit
)

:: PowerShell 정책
powershell -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force" >nul 2>nul

:: 코드 다운로드 또는 업데이트
if exist "src\app" (
    echo  코드 업데이트 중...
    git pull >nul 2>nul
) else if exist "blog-auto\src" (
    cd blog-auto
) else (
    echo  코드 다운로드 중... (30초 소요)
    git clone https://github.com/gudwn9352-alt/blog-auto.git >nul 2>nul
    if exist "blog-auto" ( cd blog-auto ) else (
        echo  [오류] 다운로드 실패. 인터넷 연결을 확인하세요.
        pause
        exit
    )
)

:: .env.local 복사 (상위 폴더에 있으면)
if not exist ".env.local" (
    if exist "..\.env.local" (
        copy "..\.env.local" ".env.local" >nul
    ) else (
        echo  [오류] .env.local 파일이 없습니다.
        echo  관리자에게 파일을 요청하세요.
        pause
        exit
    )
)

:: 패키지 설치
if not exist "node_modules" (
    echo  패키지 설치 중... (1-2분 소요)
    call npm install --silent 2>nul
)

:: 실행
echo.
echo  시작합니다. 브라우저: http://localhost:3000
echo  종료: 이 창 닫기
echo.

timeout /t 2 /nobreak >nul
start http://localhost:3000
call npx next dev
