@echo off
chcp 65001 >nul
title 블로그 원고 이미지 생성 시스템 - 설치 및 실행

echo.
echo ========================================
echo  블로그 원고 이미지 생성 시스템
echo  설치 및 실행 프로그램
echo ========================================
echo.

:: 1. Node.js 설치 확인
echo [1/4] Node.js 확인 중...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js가 설치되어 있지 않습니다.
    echo 자동으로 설치합니다... 잠시만 기다려주세요.
    echo.

    :: Node.js LTS 다운로드 + 설치
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.16.0/node-v22.16.0-x64.msi' -OutFile '%TEMP%\node_install.msi'"
    msiexec /i "%TEMP%\node_install.msi" /quiet /norestart

    :: PATH 갱신
    set "PATH=%PATH%;C:\Program Files\nodejs"

    echo Node.js 설치 완료!
) else (
    echo Node.js 이미 설치됨
)

:: 2. Git 설치 확인
echo [2/4] Git 확인 중...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git이 설치되어 있지 않습니다.
    echo 자동으로 설치합니다... 잠시만 기다려주세요.
    echo.

    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.2/Git-2.47.1.2-64-bit.exe' -OutFile '%TEMP%\git_install.exe'"
    "%TEMP%\git_install.exe" /VERYSILENT /NORESTART

    set "PATH=%PATH%;C:\Program Files\Git\bin"

    echo Git 설치 완료!
) else (
    echo Git 이미 설치됨
)

:: 3. 코드 가져오기 / 업데이트
echo [3/4] 코드 확인 중...

:: 현재 폴더에 src 폴더가 있으면 이미 설치된 것
if exist "src" (
    echo 코드 업데이트 중...
    git pull 2>nul
) else if exist "blog-auto" (
    echo 기존 코드 발견
    cd blog-auto
) else (
    echo 코드 다운로드 중... 잠시만 기다려주세요.
    git clone https://github.com/gudwn9352-alt/blog-auto.git
    cd blog-auto
)

:: 4. .env.local 확인
echo [4/4] 환경 설정 확인 중...
if not exist ".env.local" (
    echo.
    echo ========================================
    echo  .env.local 파일이 없습니다!
    echo ========================================
    echo.
    echo  이 프로그램을 실행하려면 API 키 파일이 필요합니다.
    echo.
    echo  방법 1: env-local-백업.txt 파일을 이 폴더에 넣고
    echo          이름을 .env.local 로 변경하세요.
    echo.
    echo  방법 2: 관리자에게 .env.local 파일을 요청하세요.
    echo.
    echo  파일을 넣은 후 이 프로그램을 다시 실행하세요.
    echo.
    pause
    exit
)

:: 5. 패키지 설치
echo.
echo 패키지 설치 중... (처음 실행 시 1-2분 소요)
call npm install --silent 2>nul

:: 6. 실행
echo.
echo ========================================
echo  설치 완료! 프로그램을 시작합니다.
echo  브라우저에서 http://localhost:3000 접속
echo ========================================
echo.
echo  종료하려면 이 창을 닫으세요.
echo.

:: 브라우저 자동 열기
start http://localhost:3000

:: 서버 실행
call npx next dev
