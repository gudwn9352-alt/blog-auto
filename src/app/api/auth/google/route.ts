import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/gdrive/auth'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const returnTo = url.searchParams.get('returnTo') ?? '/dashboard'
  const authUrl = getAuthUrl(returnTo)
  return NextResponse.redirect(authUrl)
}
