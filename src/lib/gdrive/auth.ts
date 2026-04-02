import { google } from 'googleapis'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const TOKEN_PATH = join(process.cwd(), '.gdrive-token.json')

function getOAuth2() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback'
  )
}

// 인증된 Drive 클라이언트 (자동 토큰 관리)
export function getDriveClient() {
  const oauth2Client = getOAuth2()

  // 1순위: .gdrive-token.json 파일
  if (existsSync(TOKEN_PATH)) {
    try {
      const data = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'))
      oauth2Client.setCredentials(data)
      return google.drive({ version: 'v3', auth: oauth2Client })
    } catch {}
  }

  // 2순위: .env.local의 GOOGLE_REFRESH_TOKEN
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    return google.drive({ version: 'v3', auth: oauth2Client })
  }

  throw new Error('Google Drive not connected')
}

// 토큰 저장
export function saveToken(tokens: Record<string, unknown>) {
  let existing: Record<string, unknown> = {}
  if (existsSync(TOKEN_PATH)) {
    try { existing = JSON.parse(readFileSync(TOKEN_PATH, 'utf8')) } catch {}
  }
  const merged = { ...existing, ...tokens }
  writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2))
}

// 인증 URL 생성
export function getAuthUrl(state?: string): string {
  return getOAuth2().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
    state: state ?? '',
  })
}

// 인증 코드 → 토큰 교환 + 저장
export async function exchangeCode(code: string) {
  const oauth2Client = getOAuth2()
  const { tokens } = await oauth2Client.getToken(code)
  saveToken(tokens as Record<string, unknown>)
  return tokens
}

// 토큰 존재 여부 (.env.local 또는 파일)
export function hasToken(): boolean {
  if (existsSync(TOKEN_PATH)) return true
  if (process.env.GOOGLE_REFRESH_TOKEN) return true
  return false
}
