import { google } from 'googleapis'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const TOKEN_PATH = join(process.cwd(), '.gdrive-token.json')
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback'

function getOAuth2() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  )
}

export function getDriveClient() {
  const oauth2Client = getOAuth2()

  // 1순위: .gdrive-token.json
  if (existsSync(TOKEN_PATH)) {
    try {
      const data = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'))
      oauth2Client.setCredentials(data)
      return google.drive({ version: 'v3', auth: oauth2Client })
    } catch (e) {
      console.error('[GDrive] Token file corrupted, trying refresh token:', e)
    }
  }

  // 2순위: .env.local GOOGLE_REFRESH_TOKEN
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    return google.drive({ version: 'v3', auth: oauth2Client })
  }

  throw new Error('Google Drive not connected. Set GOOGLE_REFRESH_TOKEN in .env.local')
}

export function saveToken(tokens: Record<string, unknown>) {
  let existing: Record<string, unknown> = {}
  if (existsSync(TOKEN_PATH)) {
    try { existing = JSON.parse(readFileSync(TOKEN_PATH, 'utf8')) } catch {}
  }
  writeFileSync(TOKEN_PATH, JSON.stringify({ ...existing, ...tokens }, null, 2))
}

export function getAuthUrl(state?: string): string {
  return getOAuth2().generateAuthUrl({
    access_type: 'offline', prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
    state: state ?? '',
  })
}

export async function exchangeCode(code: string) {
  const oauth2Client = getOAuth2()
  const { tokens } = await oauth2Client.getToken(code)
  saveToken(tokens as Record<string, unknown>)
  return tokens
}

export function hasToken(): boolean {
  return existsSync(TOKEN_PATH) || !!process.env.GOOGLE_REFRESH_TOKEN
}
