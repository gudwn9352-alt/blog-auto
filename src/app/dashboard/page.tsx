'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getManuscripts } from '@/lib/firebase/collections'
import { useBrandStore } from '@/stores/brandStore'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Manuscript } from '@/types/manuscript'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day}.${h}:${min}`
}

export default function DashboardPage() {
  const { selectedBrand } = useBrandStore()
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Google Drive 토큰 저장 (OAuth 콜백에서 리다이렉트됨)
    const params = new URLSearchParams(window.location.search)
    const gdriveToken = params.get('gdrive_token')
    if (gdriveToken) {
      localStorage.setItem('gdrive_token', gdriveToken)
      window.history.replaceState({}, '', '/dashboard')
    }

    getManuscripts(selectedBrand?.id)
      .then(setManuscripts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedBrand])

  const total = manuscripts.length
  const approved = manuscripts.filter((m) => m.status === 'approved' || m.status === 'completed').length
  const pending = manuscripts.filter((m) => m.status === 'pending_review' || m.status === 'needs_user').length
  const rejected = manuscripts.filter((m) => m.status === 'rejected').length
  const recent = manuscripts.slice(0, 5)

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title="대시보드" description={`${selectedBrand?.name ?? ''} 원고 자동 생성 시스템`} backHref="/" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/manuscripts">
          <Card className="card-hover cursor-pointer border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-gray-400 mb-1">전체 원고</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '-' : total}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/manuscripts">
          <Card className="card-hover cursor-pointer border-0 shadow-sm bg-green-50">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-green-500 mb-1">승인 완료</p>
              <p className="text-3xl font-bold text-green-700">{loading ? '-' : approved}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/manuscripts">
          <Card className="card-hover cursor-pointer border-0 shadow-sm bg-yellow-50">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-yellow-500 mb-1">검수 대기</p>
              <p className="text-3xl font-bold text-yellow-700">{loading ? '-' : pending}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/manuscripts">
          <Card className="card-hover cursor-pointer border-0 shadow-sm bg-red-50">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-red-400 mb-1">반려</p>
              <p className="text-3xl font-bold text-red-600">{loading ? '-' : rejected}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 최근 원고 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 원고</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-400">불러오는 중...</p>
            ) : recent.length === 0 ? (
              <p className="text-sm text-gray-400">아직 원고가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {recent.map((m) => (
                  <Link key={m.id} href={`/manuscripts/${m.id}`}>
                    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                      <span className="text-sm text-gray-800 truncate flex-1 mr-2">
                        {m.title ?? '(제목 없음)'}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {m.createdAt ? formatDate(m.createdAt) : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 빠른 시작 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">빠른 시작</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/generate">
              <Button className="w-full" size="lg">
                새 원고 생성
              </Button>
            </Link>
            <Link href="/manuscripts">
              <Button variant="outline" className="w-full">
                원고 목록 보기
              </Button>
            </Link>
            <Link href="/settings/brand">
              <Button variant="outline" className="w-full">
                브랜드 설정
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
