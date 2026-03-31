import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/layout/AppShell'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
})

export const metadata: Metadata = {
  title: '원고 생성 시스템',
  description: '블로그 원고 자동 생성 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full`}>
      <body className="font-[var(--font-noto)] bg-gray-50 min-h-screen">
        <AppShell>{children}</AppShell>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
