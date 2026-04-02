import { google } from 'googleapis'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const TOKEN_PATH = join(process.cwd(), '.gdrive-token.json')

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/google/callback'
)

// 저장된 토큰 로드
function loadToken(): boolean {
  if (!existsSync(TOKEN_PATH)) return false
  try {
    const data = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'))
    oauth2Client.setCredentials(data)
    return true
  } catch {
    return false
  }
}

// 토큰 저장 (refresh_token 포함)
export function saveToken(tokens: { access_token?: string | null; refresh_token?: string | null }) {
  // 기존 토큰에 merge (refresh_token 유지)
  let existing: Record<string, unknown> = {}
  if (existsSync(TOKEN_PATH)) {
    try { existing = JSON.parse(readFileSync(TOKEN_PATH, 'utf8')) } catch {}
  }
  const merged = { ...existing, ...tokens }
  writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2))
  oauth2Client.setCredentials(merged as { access_token?: string; refresh_token?: string })
}

// 인증된 Drive 클라이언트 반환 (자동 토큰 갱신)
export function getDriveClient() {
  loadToken()
  return google.drive({ version: 'v3', auth: oauth2Client })
}

// 인증 URL 생성
export function getAuthUrl(state?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
    state: state ?? '',
  })
}

// 인증 코드 → 토큰 교환 + 저장
export async function exchangeCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  saveToken(tokens)
  return tokens
}

// 토큰 존재 여부
export function hasToken(): boolean {
  return existsSync(TOKEN_PATH)
}

// OAuth2 클라이언트 직접 접근
export function getOAuth2Client() {
  loadToken()
  return oauth2Client
}
