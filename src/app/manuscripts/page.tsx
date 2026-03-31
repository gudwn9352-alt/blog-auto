'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getManuscripts } from '@/lib/firebase/collections'
import { useBrandStore } from '@/stores/brandStore'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Manuscript, ManuscriptStatus } from '@/types/manuscript'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day}.${h}:${min}`
}

const STATUS_LABELS: Record<ManuscriptStatus, { label: string; color: string }> = {
  draft: { label: '설정 중', color: 'bg-gray-100 text-gray-600' },
  generating: { label: '생성 중', color: 'bg-blue-100 text-blue-600' },
  pending_review: { label: '검수 대기', color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: '검수 중', color: 'bg-orange-100 text-orange-600' },
  needs_user: { label: '확인 필요', color: 'bg-purple-100 text-purple-600' },
  approved: { label: '승인', color: 'bg-green-100 text-green-700' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-600' },
  image_pending: { label: '이미지 대기', color: 'bg-teal-100 text-teal-600' },
  completed: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
}

const TAB_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending_review', label: '검수 대기' },
  { value: 'needs_user', label: '확인 필요' },
  { value: 'approved', label: '승인' },
  { value: 'completed', label: '완료' },
  { value: 'rejected', label: '반려' },
]

function ManuscriptCard({ m }: { m: Manuscript }) {
  const statusInfo = STATUS_LABELS[m.status] ?? { label: m.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <Link href={`/manuscripts/${m.id}`}>
      <Card className="hover:border-blue-300 transition-colors cursor-pointer">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
              {m.title ?? '(제목 없음)'}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {m.category && (
              <Badge variant="outline" className="text-xs h-5">
                {m.category}형
              </Badge>
            )}
            {m.wordCount?.actual && (
              <span className="text-xs text-gray-400">{m.wordCount.actual}자</span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {m.createdAt ? formatDate(m.createdAt) : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function ManuscriptsPage() {
  const { selectedBrand } = useBrandStore()
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    loadManuscripts()
  }, [selectedBrand])

  async function loadManuscripts() {
    setLoading(true)
    try {
      const data = await getManuscripts(selectedBrand?.id)
      setManuscripts(data)
    } catch {
      toast.error('원고 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  const filtered = tab === 'all'
    ? manuscripts
    : manuscripts.filter((m) => m.status === tab)

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title="원고 목록" description={`총 ${manuscripts.length}개`} backHref="/dashboard">
        <Button
          variant="outline"
          size="sm"
          disabled={manuscripts.filter((m) => m.status === 'approved').length === 0}
          onClick={async () => {
            const approved = manuscripts.filter((m) => m.status === 'approved')
            if (approved.length === 0) return
            try {
              const res = await fetch('/api/download/zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  manuscripts: approved.map((m) => ({
                    title: m.title ?? '제목없음',
                    body: m.body ?? '',
                    brandName: '더바다',
                  })),
                }),
              })
              if (!res.ok) throw new Error()
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = '원고_일괄.zip'
              a.click()
              URL.revokeObjectURL(url)
              toast.success(`${approved.length}개 원고 다운로드 완료`)
            } catch { toast.error('다운로드 실패') }
          }}
        >
          일괄 다운로드
        </Button>
        <Link href="/generate">
          <Button>새 원고</Button>
        </Link>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          {TAB_FILTERS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
              {t.value !== 'all' && (
                <span className="ml-1 text-gray-400">
                  ({manuscripts.filter((m) => m.status === t.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_FILTERS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {loading ? (
              <p className="text-gray-400 text-sm">불러오는 중...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>원고가 없습니다</p>
                <Link href="/generate">
                  <Button variant="outline" className="mt-3">원고 생성하기</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-2">
                {filtered.map((m) => (
                  <ManuscriptCard key={m.id} m={m} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
