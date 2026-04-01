@echo off
chcp 65001 >nul
title 블로그 원고 이미지 생성 시스템
color 0A

echo.
echo  ╔══════════════════════════════════════╗
echo  ║  블로그 원고 이미지 생성 시스템       ║
echo  ║  자동 설치 및 실행                    ║
echo  ╚══════════════════════════════════════╝
echo.
echo  모든 설치가 자동으로 진행됩니다.
echo  잠시만 기다려주세요...
echo.

:: ═══════════════════════════════════════
:: 1. Node.js 자동 설치
:: ═══════════════════════════════════════
echo [1/5] Node.js 확인 중...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo       Node.js 설치가 필요합니다. 자동 다운로드 중...

    :: winget으로 설치 시도 (Windows 10/11 기본 내장)
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent >nul 2>nul

    if %errorlevel% neq 0 (
        echo       winget 실패. 직접 다운로드 중...
        powershell -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.16.0/node-v22.16.0-x64.msi' -OutFile '%TEMP%\node_install.msi'" 2>nul
        msiexec /i "%TEMP%\node_install.msi" /quiet /norestart
        del "%TEMP%\node_install.msi" >nul 2>nul
    )

    :: PATH 갱신
    set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"
    echo       Node.js 설치 완료!
) else (
    echo       OK
)

:: ═══════════════════════════════════════
:: 2. Git 자동 설치
:: ═══════════════════════════════════════
echo [2/5] Git 확인 중...
git --version >nul 2>nul
if %errorlevel% neq 0 (
    echo       Git 설치가 필요합니다. 자동 다운로드 중...

    winget install Git.Git --accept-source-agreements --accept-package-agreements --silent >nul 2>nul

    if %errorlevel% neq 0 (
        echo       winget 실패. 직접 다운로드 중...
        powershell -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.2/Git-2.47.1.2-64-bit.exe' -OutFile '%TEMP%\git_install.exe'" 2>nul
        "%TEMP%\git_install.exe" /VERYSILENT /NORESTART
        del "%TEMP%\git_install.exe" >nul 2>nul
    )

    set "PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd"
    echo       Git 설치 완료!
) else (
    echo       OK
)

:: PowerShell 실행 정책 설정
powershell -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force" >nul 2>nul

:: ═══════════════════════════════════════
:: 3. 코드 다운로드 / 업데이트
:: ═══════════════════════════════════════
echo [3/5] 코드 확인 중...

:: src 폴더가 있으면 이미 코드가 있는 것
if exist "src\app" (
    echo       코드 업데이트 중...
    git pull >nul 2>nul
    echo       OK
) else if exist "blog-auto\src" (
    echo       기존 코드 발견. 이동 중...
    cd blog-auto
) else (
    echo       코드 다운로드 중... (30초 소요)
    git clone https://github.com/gudwn9352-alt/blog-auto.git >nul 2>nul
    if exist "blog-auto" (
        cd blog-auto
        echo       다운로드 완료!
    ) else (
        echo       다운로드 실패. 인터넷 연결을 확인하세요.
        pause
        exit
    )
)

:: ═══════════════════════════════════════
:: 4. .env.local 확인
:: ═══════════════════════════════════════
echo [4/5] API 설정 확인 중...

if not exist ".env.local" (
    :: 같은 폴더나 상위 폴더에 .env.local 있으면 복사
    if exist "..\\.env.local" (
        copy "..\\.env.local" ".env.local" >nul
        echo       API 설정 복사 완료!
    ) else if exist "..\\env-local-백업.txt" (
        copy "..\\env-local-백업.txt" ".env.local" >nul
        echo       API 설정 복사 완료!
    ) else (
        echo.
        echo  ════════════════════════════════════
        echo   .env.local 파일이 없습니다!
        echo  ════════════════════════════════════
        echo.
        echo   이 폴더에 .env.local 파일을 넣고
        echo   다시 실행하세요.
        echo.
        echo   관리자에게 파일을 요청하세요.
        echo.
        pause
        exit
    )
) else (
    echo       OK
)

:: ═══════════════════════════════════════
:: 5. 패키지 설치
:: ═══════════════════════════════════════
echo [5/5] 패키지 설치 중... (처음 실행 시 1-2분)

:: node_modules 없으면 설치
if not exist "node_modules" (
    call npm install --silent 2>nul
    if %errorlevel% neq 0 (
        echo       npm install 재시도 중...
        call npm install 2>nul
    )
)
echo       OK

:: ═══════════════════════════════════════
:: 실행
:: ═══════════════════════════════════════
echo.
echo  ╔══════════════════════════════════════╗
echo  ║  설치 완료! 프로그램을 시작합니다.    ║
echo  ║                                      ║
echo  ║  브라우저: http://localhost:3000      ║
echo  ║  종료: 이 창을 닫으세요              ║
echo  ╚══════════════════════════════════════╝
echo.

:: 3초 후 브라우저 자동 열기
timeout /t 3 /nobreak >nul
start http://localhost:3000

:: 서버 실행
call npx next dev
