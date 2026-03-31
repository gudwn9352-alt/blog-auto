'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getManuscripts } from '@/lib/firebase/collections'
import { useBrandStore } from '@/stores/brandStore'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Manuscript, ManuscriptCategory } from '@/types/manuscript'

const CATEGORIES: ManuscriptCategory[] = ['A', 'B', 'C', 'D', 'E', 'F']

function formatDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m}/${d}`
}

export default function ReportsPage() {
  const { selectedBrand } = useBrandStore()
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedBrand])

  async function loadData() {
    setLoading(true)
    try {
      const data = await getManuscripts(selectedBrand?.id)
      setManuscripts(data)
    } catch {
      toast.error('데이터를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 통계 계산
  const total = manuscripts.length
  const approved = manuscripts.filter(
    (m) => m.status === 'approved' || m.status === 'completed',
  ).length
  const rejected = manuscripts.filter((m) => m.status === 'rejected').length
  const pending = manuscripts.filter(
    (m) =>
      m.status === 'pending_review' ||
      m.status === 'reviewing' ||
      m.status === 'needs_user',
  ).length

  // 카테고리별 분포
  const categoryDist = CATEGORIES.map((cat) => ({
    category: cat,
    count: manuscripts.filter((m) => m.category === cat).length,
  }))
  const maxCategoryCount = Math.max(...categoryDist.map((c) => c.count), 1)

  // 최근 7일 생성 추이
  const today = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - i))
    date.setHours(0, 0, 0, 0)
    return date
  })

  const dailyCounts = last7Days.map((date) => {
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)
    const count = manuscripts.filter((m) => {
      if (!m.createdAt) return false
      const created = new Date(m.createdAt)
      return created >= date && created < nextDay
    }).length
    return { date, count }
  })
  const maxDailyCount = Math.max(...dailyCounts.map((d) => d.count), 1)

  // 평균 글자수
  const withWordCount = manuscripts.filter((m) => m.wordCount?.actual)
  const avgWordCount =
    withWordCount.length > 0
      ? Math.round(
          withWordCount.reduce((sum, m) => sum + (m.wordCount?.actual ?? 0), 0) /
            withWordCount.length,
        )
      : 0

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">보고서</h1>
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader title="보고서" description="원고 현황 통계" backHref="/dashboard" />

      {/* 상단 카운트 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-gray-500">전체</p>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-green-600">승인/완료</p>
            <p className="text-3xl font-bold text-green-700">{approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-red-500">반려</p>
            <p className="text-3xl font-bold text-red-600">{rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-yellow-600">대기/검수</p>
            <p className="text-3xl font-bold text-yellow-700">{pending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 카테고리별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">카테고리별 분포</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryDist.map(({ category, count }) => (
              <div key={category} className="flex items-center gap-3">
                <span className="text-sm font-medium w-8 text-gray-700">
                  {category}형
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{
                      width: `${(count / maxCategoryCount) * 100}%`,
                      minWidth: count > 0 ? '24px' : '0',
                    }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 최근 7일 생성 추이 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 7일 생성 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {dailyCounts.map(({ date, count }) => (
                <div
                  key={date.toISOString()}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-xs text-gray-500">{count}</span>
                  <div
                    className="w-full bg-blue-400 rounded-t transition-all"
                    style={{
                      height: `${(count / maxDailyCount) * 80}px`,
                      minHeight: count > 0 ? '4px' : '0',
                    }}
                  />
                  <span className="text-xs text-gray-400">
                    {formatDate(date)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 평균 글자수 */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">평균 글자수</p>
              <p className="text-3xl font-bold text-gray-900">
                {avgWordCount > 0 ? `${avgWordCount.toLocaleString()}자` : '-'}
              </p>
            </div>
            <p className="text-sm text-gray-400">
              {withWordCount.length}개 원고 기준
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
