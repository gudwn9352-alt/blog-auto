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
import { Progress } from '@/components/ui/progress'
import { calculateSeoScore } from '@/lib/scoring/seo-score'
import { calculateQualityScore } from '@/lib/scoring/quality-score'
import { needsBrandApproval } from '@/lib/brand-track'
import { useBrandStore } from '@/stores/brandStore'
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
  const { selectedBrand } = useBrandStore()
  const id = params.id as string

  const [manuscript, setManuscript] = useState<Manuscript | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Google Drive 토큰 수신 (OAuth 콜백에서 리다이렉트됨)
    const params = new URLSearchParams(window.location.search)
    const gdriveToken = params.get('gdrive_token')
    if (gdriveToken) {
      localStorage.setItem('gdrive_token', gdriveToken)
      window.history.replaceState({}, '', `/manuscripts/${id}`)
      toast.success('Google 드라이브 연결 완료! 내보내기를 다시 클릭하세요.')
    }

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
          brandName: selectedBrand?.name ?? '더바다',
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

  // 원고 내보내기 → 구글 드라이브 (브랜드/제3자 폴더 자동 분류)
  async function handleExportAll() {
    if (!manuscript) return

    // Google Drive 토큰 확인
    const token = localStorage.getItem('gdrive_token')
    if (!token) {
      toast.info('Google 드라이브 로그인이 필요합니다.')
      window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(`/manuscripts/${manuscript.id}`)}`
      return
    }

    try {
      toast.info('구글 드라이브에 내보내기 중...')

      const mode = (manuscript as unknown as Record<string, unknown>).manuscriptMode as string ?? 'thirdparty'

      // 원고 .docx 생성
      const docxRes = await fetch('/api/download/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manuscript.title,
          body: manuscript.body,
          brandName: selectedBrand?.name ?? '더바다',
        }),
      })
      if (!docxRes.ok) throw new Error('.docx 생성 실패')
      const docxBlob = await docxRes.blob()

      // 이미지 수집
      const imgs = manuscript.images ?? []
      const imageFiles: Array<{ name: string; blob: Blob }> = []
      for (let i = 0; i < imgs.length; i++) {
        if (!imgs[i]?.imageUrl) continue
        try {
          const res = await fetch(imgs[i].imageUrl!)
          const blob = await res.blob()
          imageFiles.push({ name: `이미지${i + 1}.png`, blob })
        } catch { /* skip */ }
      }

      // 구글 드라이브 API로 업로드
      const res = await fetch('/api/export/gdrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manuscript.title,
          body: manuscript.body,
          brandName: selectedBrand?.name ?? '더바다',
          manuscriptMode: mode,
          gdriveBrandFolder: selectedBrand?.gdriveBrandFolder,
          gdriveThirdPartyFolder: selectedBrand?.gdriveThirdPartyFolder,
          docxBase64: await blobToBase64(docxBlob),
          images: await Promise.all(imageFiles.map(async (f, i) => ({
            imageUrl: await blobToBase64(f.blob),
            position: i,
            fileName: f.name,
          }))),
          accessToken: token,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || (res.status === 404 && data.error?.includes('폴더'))) {
          localStorage.removeItem('gdrive_token')
          const retry = confirm(`${data.error ?? 'Google 드라이브 접근 오류'}\n\n권한을 다시 설정하시겠습니까?`)
          if (retry) window.location.href = '/api/auth/google'
          return
        }
        throw new Error(data.error)
      }
      const imgMsg = imageFiles.length > 0 ? `, 이미지 ${imageFiles.length}장` : ''
      toast.success(`구글 드라이브 내보내기 완료! (${data.folder}/${data.manuscriptFolder}${imgMsg})`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '내보내기 실패')
    }
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  }

  async function handleAiFix() {
    if (!manuscript?.id || !lastReview?.issues) return
    setReviewing(true)
    try {
      const issuesSummary = lastReview.issues.map((i) => `- [${i.type}] ${i.detail}`).join('\n')

      const res = await fetch('/api/generate/manuscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            brandId: manuscript.brandId,
            category: manuscript.category,
            typeId: manuscript.typeId,
            material: manuscript.materialSettings ?? { mode: 'auto' },
            appealPoint: manuscript.appealPoint ?? '',
            titleSettings: { structureId: '', badaPosition: 'auto', charCount: 'mid' },
            persona: manuscript.persona ?? {},
            personaMode: 'random',
            variables: manuscript.variables ?? { var7: 'long' },
            wordCount: manuscript.wordCount ?? { min: 1500, max: 2500 },
            imageSettings: { count: 8, types: [], selectionMode: 'random' },
            manuscriptMode: (manuscript as unknown as Record<string, unknown>).manuscriptMode ?? 'thirdparty',
          },
          brandInfo: {
            name: selectedBrand?.name ?? '더바다',
            serviceDescription: selectedBrand?.serviceDescription ?? '',
            targetAudience: selectedBrand?.targetAudience,
            tone: selectedBrand?.tone,
            voiceGuide: selectedBrand?.voiceGuide,
          },
          openProhibitions: [],
          fixMode: {
            originalTitle: manuscript.title,
            originalBody: manuscript.body,
            issues: issuesSummary,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 수정된 원고로 업데이트
      await updateManuscript(manuscript.id, {
        title: data.title,
        body: data.body,
        status: 'pending_review',
        editHistory: [
          ...(manuscript.editHistory ?? []),
          {
            timestamp: new Date().toISOString(),
            before: manuscript.body ?? '',
            after: data.body,
            editedBy: 'ai' as const,
          },
        ],
      })
      toast.success('AI가 반려 사유를 수정했습니다. 재검수를 실행하세요.')
      await loadManuscript()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'AI 수정 실패')
    } finally {
      setReviewing(false)
    }
  }

  async function handleExportGDrive() {
    if (!manuscript) return
    // Google Drive 토큰 확인
    const token = localStorage.getItem('gdrive_token')
    if (!token) {
      // Google 로그인 필요
      toast.info('Google 드라이브 연결이 필요합니다. 로그인 페이지로 이동합니다.')
      window.location.href = '/api/auth/google'
      return
    }

    try {
      const mode = (manuscript as unknown as Record<string, unknown>).manuscriptMode as string ?? 'thirdparty'
      const res = await fetch('/api/export/gdrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manuscript.title,
          body: manuscript.body,
          brandName: selectedBrand?.name ?? '더바다',
          manuscriptMode: mode,
          images: manuscript.images?.map((img, i) => ({
            imageUrl: img.imageUrl,
            position: i,
          })),
          accessToken: token,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || (res.status === 404 && data.error?.includes('폴더'))) {
          localStorage.removeItem('gdrive_token')
          const retry = confirm(`${data.error ?? 'Google 드라이브 접근 오류'}\n\n권한을 다시 설정하시겠습니까?`)
          if (retry) window.location.href = '/api/auth/google'
          return
        }
        throw new Error(data.error)
      }
      toast.success(`구글 드라이브 내보내기 완료! (${data.folder}/${data.manuscriptFolder}, 이미지 ${data.uploadedImages}장)`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '내보내기 실패')
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
      <PageHeader title={manuscript.title ?? '원고 상세'} backHref="/manuscripts" />
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
              {manuscript.status === 'approved' && (
                <>
                  <Button size="sm" variant="outline" onClick={handleExportAll}>
                    내보내기
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs text-gray-400" onClick={() => {
                    localStorage.removeItem('gdrive_token')
                    toast.info('Google 드라이브 토큰 초기화 완료. 내보내기를 다시 클릭하세요.')
                  }}>
                    연결 초기화
                  </Button>
                </>
              )}
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

      {/* SEO 점수 + 품질 점수 */}
      {manuscript.title && manuscript.body && (() => {
        const seo = calculateSeoScore(manuscript.title, manuscript.body, selectedBrand?.name ?? '')
        const quality = calculateQualityScore(manuscript.title, manuscript.body)
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">SEO 점수</CardTitle>
                  <span className={`text-lg font-bold ${seo.total >= 80 ? 'text-green-600' : seo.total >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{seo.total}점</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {seo.details.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 w-20 shrink-0">{d.item}</span>
                    <Progress value={(d.score / d.max) * 100} className="h-1.5 flex-1" />
                    <span className="text-[11px] text-gray-400 w-10 text-right">{d.score}/{d.max}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">품질 점수</CardTitle>
                  <span className={`text-lg font-bold ${quality.total >= 80 ? 'text-green-600' : quality.total >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{quality.total}점</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {quality.details.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 w-20 shrink-0">{d.item}</span>
                    <Progress value={(d.score / d.max) * 100} className="h-1.5 flex-1" />
                    <span className="text-[11px] text-gray-400 w-10 text-right">{d.score}/{d.max}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )
      })()}

      {/* CEO 승인 필요 알림 */}
      {manuscript.category && manuscript.variables?.var6 &&
        needsBrandApproval(manuscript.category, manuscript.variables.var6) && manuscript.status === 'approved' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm font-medium text-orange-700">브랜드 트랙 — CEO 승인 필요</p>
            <p className="text-xs text-orange-600 mt-1">이 원고는 브랜드 노출이 강해서 CEO(브랜드 담당자) 승인이 필요합니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 수정 히스토리 */}
      {manuscript.editHistory && manuscript.editHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">수정 이력 ({manuscript.editHistory.length}회)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {manuscript.editHistory.map((edit, i) => (
              <div key={i} className="text-xs border rounded-lg p-2">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">{new Date(edit.timestamp).toLocaleString('ko-KR')}</span>
                  <Badge variant="outline" className="text-[10px]">{edit.editedBy === 'user' ? '직접 수정' : 'AI 수정'}</Badge>
                </div>
                <details className="cursor-pointer">
                  <summary className="text-blue-600 hover:text-blue-800">변경 내용 보기</summary>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <div className="bg-red-50 p-1.5 rounded text-[10px] max-h-32 overflow-y-auto">
                      <p className="font-medium text-red-600 mb-0.5">수정 전</p>
                      <p className="whitespace-pre-wrap text-gray-600">{edit.before.slice(0, 300)}{edit.before.length > 300 ? '...' : ''}</p>
                    </div>
                    <div className="bg-green-50 p-1.5 rounded text-[10px] max-h-32 overflow-y-auto">
                      <p className="font-medium text-green-600 mb-0.5">수정 후</p>
                      <p className="whitespace-pre-wrap text-gray-600">{edit.after.slice(0, 300)}{edit.after.length > 300 ? '...' : ''}</p>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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

      {/* 반려 원고 — 강제 승인 + AI 수정 */}
      {manuscript.status === 'rejected' && lastReview && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">반려된 원고</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastReview.issues && lastReview.issues.length > 0 && (
              <ul className="space-y-1">
                {lastReview.issues.map((issue, i) => (
                  <li key={i} className="text-xs bg-white px-3 py-2 rounded border border-red-200">
                    <span className="font-medium text-red-600">[{issue.type}]</span>{' '}
                    <span className="text-gray-700">{issue.detail}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAiFix}
                disabled={reviewing}
              >
                {reviewing ? 'AI 수정 중...' : 'AI로 반려 사유 수정'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                onClick={async () => {
                  const confirmed = confirm('이 원고는 검수 미통과입니다.\n강제 승인하시겠습니까?\n\n품질 미달 원고가 내보내기/다운로드에 포함될 수 있습니다.')
                  if (!confirmed) return
                  await updateManuscript(manuscript.id!, { status: 'approved' })
                  toast.warning('강제 승인되었습니다')
                  await loadManuscript()
                }}
              >
                강제 승인
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 검수 대기 — 강제 승인 */}
      {manuscript.status === 'pending_review' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 pb-3 flex gap-2">
            <Button onClick={handleReview} disabled={reviewing} className="flex-1">
              {reviewing ? '검수 중...' : '검수 실행'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              onClick={async () => {
                const confirmed = confirm('이 원고는 아직 검수되지 않았습니다.\n강제 승인하시겠습니까?')
                if (!confirmed) return
                await updateManuscript(manuscript.id!, { status: 'approved' })
                toast.warning('강제 승인되었습니다')
                await loadManuscript()
              }}
            >
              강제 승인
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 승인 완료 */}
      {!editing && manuscript.status === 'approved' && (
        <div className="text-sm text-green-600 font-medium">승인된 원고입니다</div>
      )}
    </div>
  )
}
