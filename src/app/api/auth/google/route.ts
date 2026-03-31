import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Google Client ID 없음' }, { status: 500 })
  }

  // returnTo 파라미터로 로그인 후 돌아갈 경로 전달
  const url = new URL(req.url)
  const returnTo = url.searchParams.get('returnTo') ?? '/dashboard'

  const redirectUri = 'http://localhost:3000/api/auth/google/callback'
  const scope = encodeURIComponent('https://www.googleapis.com/auth/drive')
  const state = encodeURIComponent(returnTo)

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`

  return NextResponse.redirect(authUrl)
}
