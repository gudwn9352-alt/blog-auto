'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { getManuscript, updateManuscript, deleteManuscript, getBrands, getOpenProhibitions } from '@/lib/firebase/collections'
import { PageHeader } from '@/components/layout/PageHeader'
import { ImageManager } from '@/components/images/ImageManager'
import type { Manuscript } from '@/types/manuscript'

const STATUS_LABELS: Record<string, string> = {
  draft: '설정 중',
  generating: '생성 중',
  pending_review: '검수 대기',
  reviewing: '검수 중',
  needs_user: '확인 필요',
  approved: '승인',
  rejected: '반려',
  image_pending: '이미지 대기',
  completed: '완료',
}

export default function ManuscriptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [manuscript, setManuscript] = useState<Manuscript | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadManuscript()
  }, [id])

  async function loadManuscript() {
    setLoading(true)
    try {
      const data = await getManuscript(id)
      if (!data) {
        toast.error('원고를 찾을 수 없습니다')
        router.push('/manuscripts')
        return
      }
      setManuscript(data)
      setEditedTitle(data.title ?? '')
      setEditedBody(data.body ?? '')
    } catch {
      toast.error('원고를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveEdit() {
    if (!manuscript?.id) return
    setSaving(true)
    try {
      const editHistory = [
        ...(manuscript.editHistory ?? []),
        {
          timestamp: new Date().toISOString(),
          before: manuscript.body ?? '',
          after: editedBody,
          editedBy: 'user' as const,
        },
      ]
      await updateManuscript(manuscript.id, {
        title: editedTitle,
        body: editedBody,
        editHistory,
      })
      toast.success('수정되었습니다')
      setEditing(false)
      await loadManuscript()
    } catch {
      toast.error('수정에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  async function handleReview() {
    if (!manuscript?.id) return
    setReviewing(true)
    try {
      // 브랜드 이름과 금지사항을 클라이언트에서 가져오기
      const brands = await getBrands()
      const brand = brands.find((b) => b.id === manuscript.brandId)
      const openProhibitions = await getOpenProhibitions()

      const res = await fetch('/api/generate/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manuscript.title,
          body: manuscript.body,
          brandName: brand?.name ?? '',
          openProhibitions,
          wordCountMin: manuscript.wordCount?.min ?? 500,
          wordCountMax: manuscript.wordCount?.max ?? 4000,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 검수 결과를 클라이언트에서 Firestore에 저장
      const newStatus = data.result === 'pass' ? 'approved' : data.result === 'needs_user' ? 'needs_user' : 'rejected'
      await updateManuscript(manuscript.id, {
        status: newStatus,
        reviewHistory: [...(manuscript.reviewHistory ?? []), data.reviewRecord],
      })

      toast.success(data.passed ? '검수를 통과했습니다!' : `검수 결과: ${data.issues?.length ?? 0}개 이슈`)
      await loadManuscript()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '검수 실패')
    } finally {
      setReviewing(false)
    }
  }

  async function handleApprove() {
    if (!manuscript?.id) return
    await updateManuscript(manuscript.id, { status: 'approved' })
    toast.success('승인되었습니다')
    await loadManuscript()
  }

  async function handleDownloadDocx() {
    if (!manuscript) return
    try {
      const res = await fetch('/api/download/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manuscript.title,
          body: manuscript.body,
          brandName: '더바다',
        }),
      })
      if (!res.ok) throw new Error('다운로드 실패')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${manuscript.title ?? '원고'}.docx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('다운로드 완료')
    } catch {
      toast.error('다운로드에 실패했습니다')
    }
  }

  async function handleDelete() {
    if (!manuscript?.id) return
    if (!confirm('원고를 삭제하시겠습니까?')) return
    try {
      await deleteManuscript(manuscript.id)
      toast.success('삭제되었습니다')
      router.push('/manuscripts')
    } catch {
      toast.error('삭제에 실패했습니다')
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-400">불러오는 중...</div>
  }

  if (!manuscript) return null

  const lastReview = manuscript.reviewHistory?.at(-1)

  return (
    <div className="p-6 max-w-3xl space-y-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {editing ? (
            <Textarea
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-xl font-bold resize-none"
              rows={2}
            />
          ) : (
            <h1 className="text-xl font-bold text-gray-900">{manuscript.title}</h1>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {STATUS_LABELS[manuscript.status] ?? manuscript.status}
            </Badge>
            {manuscript.category && <Badge variant="secondary">{manuscript.category}형</Badge>}
            {manuscript.wordCount?.actual && (
              <span className="text-xs text-gray-400">{manuscript.wordCount.actual}자</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false)
                  setEditedTitle(manuscript.title ?? '')
                  setEditedBody(manuscript.body ?? '')
                }}
              >
                취소
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={handleDownloadDocx}>
                다운로드
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                수정
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* 본문 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">본문</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <Textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="min-h-[400px] text-sm leading-relaxed resize-none"
            />
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
              {manuscript.body}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 검수 결과 */}
      {lastReview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">최근 검수 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${
                lastReview.result === 'pass' ? 'text-green-600' : 'text-red-600'
              }`}>
                {lastReview.result === 'pass' ? '✅ 통과' : lastReview.result === 'reject' ? '❌ 반려' : '⚠️ 확인 필요'}
              </span>
              <span className="text-xs text-gray-400">
                STEP {lastReview.step} — {new Date(lastReview.timestamp).toLocaleString('ko-KR')}
              </span>
            </div>
            {lastReview.issues && lastReview.issues.length > 0 && (
              <ul className="space-y-1">
                {lastReview.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    [{issue.type}] {issue.detail}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* 원고 설정 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">원고 설정</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 space-y-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {manuscript.typeId && <div><span className="text-gray-400">유형:</span> {manuscript.typeId}</div>}
            {manuscript.appealPoint && <div><span className="text-gray-400">소구:</span> {manuscript.appealPoint}</div>}
            {manuscript.wordCount && (
              <div>
                <span className="text-gray-400">글자수:</span>{' '}
                {manuscript.wordCount.actual ?? '-'} / {manuscript.wordCount.min}~{manuscript.wordCount.max}자
              </div>
            )}
            {manuscript.createdAt && (
              <div>
                <span className="text-gray-400">생성일:</span>{' '}
                {new Date(manuscript.createdAt).toLocaleString('ko-KR')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 이미지 관리 */}
      {(manuscript.status === 'approved' || manuscript.status === 'completed') && (
        <ImageManager
          manuscriptId={manuscript.id!}
          title={manuscript.title ?? ''}
          body={manuscript.body ?? ''}
          images={manuscript.images ?? []}
          onImagesChange={async (images) => {
            await updateManuscript(manuscript.id!, { images })
            await loadManuscript()
          }}
        />
      )}

      {/* STEP 3: 사용자 검토 (needs_user 상태) */}
      {manuscript.status === 'needs_user' && lastReview?.issues && lastReview.issues.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">사용자 확인 필요</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-purple-600">
              AI가 자동으로 판단하기 어려운 항목입니다. 확인 후 승인 또는 반려해주세요.
            </p>
            <ul className="space-y-1.5">
              {lastReview.issues.map((issue, i) => (
                <li key={i} className="text-xs bg-white px-3 py-2 rounded border border-purple-200">
                  <span className="font-medium text-purple-700">[{issue.type}]</span>{' '}
                  <span className="text-gray-700">{issue.detail}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  await updateManuscript(manuscript.id!, { status: 'approved' })
                  toast.success('승인되었습니다')
                  await loadManuscript()
                }}
              >
                확인 완료 — 승인
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await updateManuscript(manuscript.id!, { status: 'rejected' })
                  toast.info('반려되었습니다')
                  await loadManuscript()
                }}
              >
                반려
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      {!editing && (
        <div className="flex gap-2">
          {manuscript.status === 'pending_review' && (
            <Button onClick={handleReview} disabled={reviewing} className="flex-1">
              {reviewing ? '검수 중...' : '검수 실행'}
            </Button>
          )}
          {manuscript.status === 'approved' && (
            <div className="text-sm text-green-600 font-medium">승인된 원고입니다</div>
          )}
          {manuscript.status === 'rejected' && (
            <div className="text-sm text-red-500 font-medium">반려된 원고입니다</div>
          )}
        </div>
      )}
    </div>
  )
}
