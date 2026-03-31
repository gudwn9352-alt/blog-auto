import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: '인증 코드 없음' }, { status: 400 })
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/google/callback'
    )

    const { tokens } = await oauth2Client.getToken(code)

    // 토큰을 클라이언트로 전달 (쿠키 대신 URL 파라미터)
    const accessToken = tokens.access_token ?? ''
    const redirectUrl = `/dashboard?gdrive_token=${encodeURIComponent(accessToken)}`

    return NextResponse.redirect(new URL(redirectUrl, req.url))
  } catch (error: unknown) {
    console.error('[Google OAuth 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Google 인증 실패' },
      { status: 500 }
    )
  }
}
