# 더바다 프로젝트 — GitHub 사용 설명서

코딩 경험이 없어도 따라할 수 있게 작성했습니다.

---

## 1단계: GitHub 계정 만들기

1. https://github.com 접속
2. "Sign up" 클릭
3. 이메일, 비밀번호, 유저네임 입력
4. 이메일 인증 완료

---

## 2단계: GitHub에 저장소(리포지토리) 만들기

1. 로그인 후 https://github.com/new 접속
2. 아래처럼 입력:
   - **Repository name**: `thebada`
   - **Description**: `블로그 원고 자동 생성 시스템`
   - **Private** 선택 (비공개 — 나만 볼 수 있음)
   - 나머지는 건드리지 마세요
3. **"Create repository"** 클릭
4. 화면에 나오는 URL을 복사해두세요
   - 예: `https://github.com/내유저네임/thebada.git`

---

## 3단계: 내 컴퓨터에서 GitHub에 코드 올리기

VS Code 터미널 (Ctrl + `) 에서 아래 명령어를 **한 줄씩** 입력:

```bash
cd thebada
git init
git add .
git commit -m "더바다 원고 생성 시스템 v2.0"
git branch -M main
git remote add origin https://github.com/내유저네임/thebada.git
git push -u origin main
```

> ⚠️ "내유저네임" 부분을 본인 GitHub 유저네임으로 바꿔주세요!
>
> 처음 push 하면 GitHub 로그인 창이 뜰 수 있어요. 로그인하면 됩니다.

---

## 4단계: 회사 컴퓨터에서 코드 가져오기

### 사전 준비 (회사 컴퓨터에 설치 필요)
1. **Node.js** 설치: https://nodejs.org (LTS 버전)
2. **Git** 설치: https://git-scm.com/download/win
3. **VS Code** 설치: https://code.visualstudio.com

### 코드 가져오기

VS Code 터미널에서:

```bash
git clone https://github.com/내유저네임/thebada.git
cd thebada
npm install
```

### 환경변수 설정

`.env.local` 파일은 보안상 GitHub에 올라가지 않아요.
회사 컴퓨터에서 직접 만들어야 합니다.

thebada 폴더 안에 `.env.local` 파일을 새로 만들고 아래 내용을 입력:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=여기에_파이어베이스_키
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=여기에_도메인
NEXT_PUBLIC_FIREBASE_PROJECT_ID=여기에_프로젝트ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=여기에_스토리지
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=여기에_센더ID
NEXT_PUBLIC_FIREBASE_APP_ID=여기에_앱ID

# Anthropic (원고 생성 AI)
ANTHROPIC_API_KEY=여기에_클로드_키

# Gemini (이미지 생성 AI)
GEMINI_API_KEY=여기에_제미나이_키
```

> 값은 현재 컴퓨터의 `.env.local` 파일에서 복사하세요.
> 절대 카톡이나 메일로 보내지 마세요! USB나 직접 입력 추천.

### 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속하면 끝!

---

## 코드 수정 후 GitHub에 저장하기

코드를 수정한 후에는 GitHub에도 업데이트해야 해요.

```bash
git add .
git commit -m "수정 내용 설명"
git push
```

예시:
```bash
git add .
git commit -m "브랜드 설정 화면 수정"
git push
```

---

## 다른 컴퓨터에서 최신 코드 가져오기

회사에서 수정 → 집에서 최신 버전 가져오려면:

```bash
git pull
```

이 한 줄이면 됩니다!

---

## 자주 쓰는 명령어 요약

| 상황 | 명령어 |
|------|--------|
| 프로그램 실행 | `npm run dev` |
| 프로그램 종료 | `Ctrl + C` |
| 수정사항 저장 (GitHub) | `git add .` → `git commit -m "설명"` → `git push` |
| 최신 버전 가져오기 | `git pull` |
| 패키지 설치 (최초 1회) | `npm install` |

---

## 문제가 생겼을 때

### "Port 3000 is in use" 에러
→ 이미 실행 중이에요. 브라우저에서 `localhost:3000` 접속하면 됩니다.

### "Module not found" 에러
→ `npm install` 실행 후 다시 시도

### "Permission denied" 에러
→ VS Code를 **관리자 권한**으로 실행

### 기타 에러
→ Claude와 채팅해서 에러 메시지를 그대로 보여주면 해결해줍니다!

---

## 폴더 구조 (참고)

```
thebada/
├── src/           ← 소스코드 (여기만 수정하면 됨)
├── .env.local     ← API 키 (GitHub에 안 올라감, 비밀!)
├── package.json   ← 프로그램 설정
└── node_modules/  ← 설치된 패키지 (건드리지 마세요)
```
