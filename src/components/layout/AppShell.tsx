'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { useBrandStore } from '@/stores/brandStore'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { selectedBrand } = useBrandStore()
  const pathname = usePathname()

  // 루트(/)는 브랜드 선택 화면 — 사이드바 없이 전체화면
  if (pathname === '/' && !selectedBrand) {
    return <>{children}</>
  }

  // 브랜드 미선택 상태에서 다른 페이지 접근 시에도 선택 화면
  if (!selectedBrand) {
    return <>{children}</>
  }

  // 브랜드 선택됨 — 사이드바 + 메인
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
