import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Google Client ID 없음' }, { status: 500 })
  }

  const redirectUri = 'http://localhost:3000/api/auth/google/callback'
  const scope = encodeURIComponent('https://www.googleapis.com/auth/drive')

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`

  return NextResponse.redirect(authUrl)
}
