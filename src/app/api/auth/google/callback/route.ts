import { NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/gdrive/auth'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') ?? '/dashboard'

  if (!code) {
    return NextResponse.json({ error: 'No auth code' }, { status: 400 })
  }

  try {
    const tokens = await exchangeCode(code)

    // 토큰이 서버 파일에 자동 저장됨 (.gdrive-token.json)
    // 클라이언트에도 전달
    const returnPath = state || '/dashboard'
    const accessToken = tokens.access_token ?? ''
    const redirectUrl = `${returnPath}${returnPath.includes('?') ? '&' : '?'}gdrive_token=${encodeURIComponent(accessToken)}`

    return NextResponse.redirect(new URL(redirectUrl, req.url))
  } catch (error: unknown) {
    console.error('[Google OAuth error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Auth failed' },
      { status: 500 }
    )
  }
}
