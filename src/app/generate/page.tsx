'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/PageHeader'
import { getBrands, getOpenProhibitions, createManuscript } from '@/lib/firebase/collections'
import { CATEGORIES, BRAND_CATEGORIES, THIRD_PARTY_BLOCKED, BRAND_BLOCKED } from '@/lib/layers/categories'
import { getTypesByCategory } from '@/lib/layers/types'
import { MEDICAL_MATERIAL_CATEGORIES, NON_MEDICAL_MATERIAL_CATEGORIES } from '@/lib/layers/materials'
import { VAR7_CONTENT_LENGTH } from '@/lib/layers/personas'
import { useGenerateStore } from '@/stores/generateStore'
import { useBrandStore } from '@/stores/brandStore'
import type { Brand } from '@/types/manuscript'
import type { ManuscriptCategory } from '@/types/manuscript'

function sv(v: string | null | undefined): string {
  return v ?? ''
}

function svu(v: string | null | undefined): string | undefined {
  return v ?? undefined
}

export default function GeneratePage() {
  const router = useRouter()
  const { settings, updateSettings, lastBatchResults, lastBatchTime, setLastBatch } = useGenerateStore()
  const { selectedBrand } = useBrandStore()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingBrands, setFetchingBrands] = useState(true)
  const [batchCount, setBatchCount] = useState(1)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [batchResults, setBatchResults] = useState<Array<{ id: string; title: string; status: 'generating' | 'reviewing' | 'pass' | 'retry' | 'needs_user' | 'fail'; detail?: string }>>([])

  const selectedTypes = settings.category ? getTypesByCategory(settings.category) : []

  useEffect(() => {
    // 선택된 브랜드가 있으면 자동 설정
    if (selectedBrand?.id) {
      updateSettings({ brandId: selectedBrand.id })
      setBrands([selectedBrand])
      setFetchingBrands(false)
    } else {
      getBrands()
        .then((data) => {
          setBrands(data)
          if (data.length > 0 && !settings.brandId) {
            updateSettings({ brandId: data[0].id ?? '' })
          }
        })
        .catch(() => toast.error('브랜드를 불러오지 못했습니다'))
        .finally(() => setFetchingBrands(false))
    }
  }, [selectedBrand])

  function handleCategoryChange(cat: string) {
    if (cat === 'random') {
      updateSettings({ category: 'random' as ManuscriptCategory, typeId: '' })
    } else {
      updateSettings({ category: cat as ManuscriptCategory, typeId: '' })
    }
  }

  async function handleGenerate() {
    if (!settings.brandId) { toast.error('브랜드를 선택하세요'); return }
    if (!settings.category) { toast.error('카테고리를 선택하세요'); return }
    // 랜덤이 아닌 경우에만 유형 필수
    if (settings.category !== 'random' && !settings.typeId) {
      toast.error('원고 유형을 선택하세요'); return
    }

    const MAX_RETRY = 2

    setLoading(true)
    setBatchProgress({ current: 0, total: batchCount })
    setBatchResults([])

    try {
      const brand = brands.find((b) => b.id === settings.brandId)
      if (!brand) throw new Error('브랜드를 찾을 수 없습니다')

      const openProhibitions = await getOpenProhibitions()
      const brandInfo = {
        name: brand.name,
        serviceDescription: brand.serviceDescription,
        targetAudience: brand.targetAudience,
        tone: brand.tone,
        voiceGuide: brand.voiceGuide,
      }

      const results: typeof batchResults = Array.from({ length: batchCount }, (_, i) => ({
        id: '', title: `${i + 1}번째 원고`, status: 'generating' as const, detail: '대기 중',
      }))
      setBatchResults([...results])

      // ── 원고 저장 헬퍼 ──
      async function saveManuscript(
        data: { title: string; body: string; resolvedSettings: Record<string, unknown> },
        status: 'approved' | 'needs_user' | 'rejected',
        reviewRecord: Record<string, unknown>,
      ) {
        const rs = data.resolvedSettings as Record<string, unknown>
        return createManuscript({
          brandId: settings.brandId,
          status,
          title: data.title,
          body: data.body,
          originalBody: data.body,
          category: rs.category as ManuscriptCategory,
          typeId: rs.typeId as string,
          materialSettings: rs.material as Record<string, unknown> as never,
          appealPoint: rs.appealPoint as never,
          persona: rs.persona as Record<string, unknown> as never,
          variables: rs.variables as Record<string, unknown> as never,
          wordCount: {
            min: (rs.wordCount as { min: number }).min,
            max: (rs.wordCount as { max: number }).max,
            actual: data.body.replace(/\s/g, '').length,
          },
          imageSettings: settings.imageSettings,
          reviewHistory: [reviewRecord as never],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      // ── 검수 헬퍼 ──
      async function reviewManuscript(
        data: { title: string; body: string; resolvedSettings: Record<string, unknown> },
        idx: number,
      ) {
        // STEP 1 자동 검수
        let reviewResult: { passed: boolean; result: string; reviewRecord: Record<string, unknown>; issues: Array<{ type: string; detail: string }> }
        try {
          const reviewRes = await fetch('/api/generate/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: data.title, body: data.body, brandName: brand!.name, openProhibitions,
              wordCountMin: (data.resolvedSettings.wordCount as { min: number }).min,
              wordCountMax: (data.resolvedSettings.wordCount as { max: number }).max,
              manuscriptMode: settings.manuscriptMode,
            }),
          })
          reviewResult = await reviewRes.json()
        } catch {
          reviewResult = { passed: true, result: 'pass', reviewRecord: {}, issues: [] }
        }

        // STEP 2 AI 검수 (STEP 1 통과 시)
        if (reviewResult.result === 'pass') {
          results[idx] = { ...results[idx], detail: 'STEP2 AI검수' }
          setBatchResults([...results])
          try {
            const existingTitles = results.filter((r) => r.status === 'pass').map((r) => r.title)
            const aiRes = await fetch('/api/generate/review-ai', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: data.title, body: data.body,
                persona: (data.resolvedSettings as Record<string, unknown>).persona,
                existingTitles,
              }),
            })
            const aiReview = await aiRes.json()
            if (aiReview.result === 'reject') reviewResult = aiReview
            else if (aiReview.result === 'needs_user') {
              reviewResult.result = 'needs_user'
              reviewResult.issues = [...reviewResult.issues, ...(aiReview.issues ?? [])]
              reviewResult.reviewRecord = aiReview.reviewRecord
            }
          } catch { /* AI 검수 실패 시 STEP 1 결과 유지 */ }
        }

        return reviewResult
      }

      // ════════════════════════════════════════════════════
      // 파이프라인: 계약직(생성) → 과장(검수) 병렬 처리
      // ════════════════════════════════════════════════════

      // Phase 1: 계약직이 전체 원고 생성 (순차, API 부하 제한)
      type GeneratedData = { title: string; body: string; resolvedSettings: Record<string, unknown> }
      const generated: (GeneratedData | null)[] = []

      for (let i = 0; i < batchCount; i++) {
        setBatchProgress({ current: i + 1, total: batchCount })
        results[i] = { id: '', title: `${i + 1}번째 원고`, status: 'generating', detail: '생성 중' }
        setBatchResults([...results])

        try {
          const res = await fetch('/api/generate/manuscript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings, brandInfo, openProhibitions }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error((data as { error?: string }).error ?? '생성 실패')
          generated.push(data)
          results[i] = { id: '', title: data.title, status: 'reviewing', detail: '검수 대기' }
        } catch (e: unknown) {
          generated.push(null)
          results[i] = { id: '', title: `${i + 1}번째 원고`, status: 'fail', detail: e instanceof Error ? e.message : '생성 실패' }
        }
        setBatchResults([...results])
      }

      // Phase 2: 과장이 전체 검수 (병렬)
      const reviewPromises = generated.map(async (data, i) => {
        if (!data) return // 생성 실패한 건 스킵

        results[i] = { id: '', title: data.title, status: 'reviewing', detail: 'STEP1 검수' }
        setBatchResults([...results])

        const reviewResult = await reviewManuscript(data, i)

        if (reviewResult.result === 'pass' || reviewResult.result === 'needs_user') {
          const status = reviewResult.result === 'pass' ? 'approved' : 'needs_user' as const
          const manuscriptId = await saveManuscript(data, status, reviewResult.reviewRecord)
          results[i] = {
            id: manuscriptId, title: data.title,
            status: reviewResult.result === 'pass' ? 'pass' : 'needs_user',
            detail: reviewResult.result === 'pass' ? '검수 통과' : '사용자 확인 필요',
          }
        } else {
          // 반려 → 재생성 시도
          results[i] = { id: '', title: data.title, status: 'retry', detail: '반려 → 재생성' }
          setBatchResults([...results])

          for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
            results[i] = { id: '', title: `${i + 1}번째 원고`, status: 'generating', detail: `재생성 ${attempt}/${MAX_RETRY}` }
            setBatchResults([...results])

            try {
              const retryRes = await fetch('/api/generate/manuscript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings, brandInfo, openProhibitions }),
              })
              const retryData = await retryRes.json()
              if (!retryRes.ok) continue

              results[i] = { id: '', title: retryData.title, status: 'reviewing', detail: `재검수 ${attempt}/${MAX_RETRY}` }
              setBatchResults([...results])

              const retryReview = await reviewManuscript(retryData, i)
              if (retryReview.result === 'pass' || retryReview.result === 'needs_user') {
                const status = retryReview.result === 'pass' ? 'approved' : 'needs_user' as const
                const manuscriptId = await saveManuscript(retryData, status, retryReview.reviewRecord)
                results[i] = {
                  id: manuscriptId, title: retryData.title,
                  status: retryReview.result === 'pass' ? 'pass' : 'needs_user',
                  detail: `재시도 ${attempt} 통과`,
                }
                setBatchResults([...results])
                return
              }
            } catch { /* 재시도 실패, 다음 시도 */ }
          }

          // 재시도 소진 → 반려 저장
          const manuscriptId = await saveManuscript(data, 'rejected', reviewResult.reviewRecord)
          const summary = reviewResult.issues.slice(0, 2).map((i) => i.detail).join(', ')
          results[i] = { id: manuscriptId, title: data.title, status: 'fail', detail: `재시도 소진: ${summary}` }
        }
        setBatchResults([...results])
      })

      await Promise.all(reviewPromises)

      // 스토어에 최종 결과 저장 (탭 이동해도 유지)
      setLastBatch([...results])

      const passCount = results.filter((r) => r.status === 'pass').length
      const needsUserCount = results.filter((r) => r.status === 'needs_user').length
      const failCount = results.filter((r) => r.status === 'fail').length

      if (failCount === 0) {
        toast.success(`${passCount}개 통과${needsUserCount > 0 ? `, ${needsUserCount}개 확인 필요` : ''} — 전체 ${batchCount}개 완료!`)
      } else {
        toast.warning(`${passCount}개 통과, ${failCount}개 실패 — 전체 ${batchCount}개`)
      }

      if (batchCount === 1 && results[0]?.id) {
        router.push(`/manuscripts/${results[0].id}`)
      } else {
        router.push('/manuscripts')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '원고 생성에 실패했습니다')
    } finally {
      setLoading(false)
      setBatchProgress({ current: 0, total: 0 })
    }
  }

  const isRandomCategory = settings.category === 'random'

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <PageHeader title="원고 생성" description="STEP 0 — 원고 설정" backHref="/dashboard" />

      {/* 브랜드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">브랜드</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingBrands ? (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          ) : brands.length === 0 ? (
            <p className="text-sm text-gray-500">
              브랜드가 없습니다.{' '}
              <a href="/settings/brand" className="text-blue-600 underline">브랜드 설정</a>에서 먼저 추가하세요.
            </p>
          ) : (
            <Select
              value={settings.brandId}
              onValueChange={(v) => updateSettings({ brandId: sv(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="브랜드 선택">
                  {brands.find((b) => b.id === settings.brandId)?.name ?? '브랜드 선택'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {brands.filter((b) => b.id).map((b) => (
                  <SelectItem key={b.id} value={b.id as string}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* 원고 모드 선택 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">원고 모드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateSettings({ manuscriptMode: 'thirdparty', category: '', typeId: '' })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                settings.manuscriptMode === 'thirdparty'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-bold text-sm text-gray-900">제3자 원고</p>
              <p className="text-xs text-gray-500 mt-1">일반인이 쓴 글처럼</p>
              <p className="text-[10px] text-gray-400 mt-0.5">6개 카테고리 × 78개 유형</p>
            </button>
            <button
              onClick={() => updateSettings({ manuscriptMode: 'brand', category: '', typeId: '' })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                settings.manuscriptMode === 'brand'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-bold text-sm text-gray-900">브랜드 원고</p>
              <p className="text-xs text-gray-500 mt-1">브랜드 공식 입장으로</p>
              <p className="text-[10px] text-gray-400 mt-0.5">5개 카테고리 (정보/이슈/분석/후기/환급)</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 카테고리 + 유형 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">원고 유형</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>카테고리</Label>
            <div className="flex flex-wrap gap-2">
              {/* 랜덤 버튼 */}
              <button
                onClick={() => handleCategoryChange('random')}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isRandomCategory
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                랜덤
              </button>
              {(settings.manuscriptMode === 'brand' ? BRAND_CATEGORIES : CATEGORIES).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    settings.category === cat.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {cat.name}
                  <span className="text-xs ml-1 opacity-70">({cat.typeCount})</span>
                </button>
              ))}
            </div>
          </div>

          {isRandomCategory && (
            <p className="text-xs text-gray-500">카테고리와 유형이 다양성 규칙에 따라 자동 선택됩니다</p>
          )}

          {settings.category && !isRandomCategory && (
            <div className="space-y-1.5">
              <Label>원고 유형</Label>
              <Select
                value={settings.typeId}
                onValueChange={(v) => updateSettings({ typeId: sv(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.index}. {t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 소재 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">소재</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {(['auto', 'unused', 'category', 'specific'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateSettings({ material: { ...settings.material, mode } })}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  settings.material.mode === mode
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {{ auto: '자동', unused: '미사용', category: '카테고리', specific: '직접입력' }[mode]}
              </button>
            ))}
          </div>
          {settings.material.mode === 'category' && (
            <div className="space-y-3">
              {/* 의료 소재 */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Label className="text-xs text-gray-500">의료 소재</Label>
                  <button
                    onClick={() => updateSettings({ material: { ...settings.material, category: '_medical_random' } })}
                    className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                      settings.material.category === '_medical_random'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-blue-300 text-blue-500 hover:bg-blue-50'
                    }`}
                  >랜덤</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MEDICAL_MATERIAL_CATEGORIES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => updateSettings({ material: { ...settings.material, category: m.id } })}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        settings.material.category === m.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              {/* 비의료 소재 */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Label className="text-xs text-gray-500">비의료 소재</Label>
                  <button
                    onClick={() => updateSettings({ material: { ...settings.material, category: '_non_medical_random' } })}
                    className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                      settings.material.category === '_non_medical_random'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-green-300 text-green-500 hover:bg-green-50'
                    }`}
                  >랜덤</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {NON_MEDICAL_MATERIAL_CATEGORIES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => updateSettings({ material: { ...settings.material, category: m.id } })}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        settings.material.category === m.id
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:border-green-300'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {settings.material.mode === 'specific' && (
            <Input
              placeholder="예: 백내장 수술, 뇌졸중 재활치료..."
              value={settings.material.specific ?? ''}
              onChange={(e) => updateSettings({ material: { ...settings.material, specific: e.target.value } })}
            />
          )}
        </CardContent>
      </Card>

      {/* 글자수 — 사용자가 선택할 수 있는 유일한 페르소나 변수 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">글자수</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateSettings({
                variables: { ...settings.variables, var7: undefined },
                wordCount: { min: 500, max: 4000 },
              })}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                !settings.variables.var7 ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >랜덤</button>
            {VAR7_CONTENT_LENGTH.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  const lengthMap: Record<string, { min: number; max: number }> = {
                    short: { min: 500, max: 800 },
                    mid: { min: 800, max: 1500 },
                    long: { min: 1500, max: 2500 },
                    extra_long: { min: 2500, max: 4000 },
                  }
                  updateSettings({
                    variables: { ...settings.variables, var7: o.value },
                    wordCount: lengthMap[o.value] ?? settings.wordCount,
                  })
                }}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  settings.variables.var7 === o.value ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-300'
                }`}
              >{o.label}</button>
            ))}
          </div>
          {settings.variables.var7 && (
            <div className="flex items-center gap-3">
              <Input
                type="number"
                className="w-24"
                value={settings.wordCount.min}
                onChange={(e) => updateSettings({ wordCount: { ...settings.wordCount, min: Number(e.target.value) } })}
              />
              <span className="text-gray-500">~</span>
              <Input
                type="number"
                className="w-24"
                value={settings.wordCount.max}
                onChange={(e) => updateSettings({ wordCount: { ...settings.wordCount, max: Number(e.target.value) } })}
              />
              <span className="text-sm text-gray-500">자</span>
            </div>
          )}
          <p className="text-xs text-gray-400">
            주체자, 문체, 톤, 감정 표현 등 모든 페르소나 변수는 다양성을 위해 자동으로 선택됩니다
          </p>
        </CardContent>
      </Card>

      {/* 설정 요약 */}
      {settings.category && (isRandomCategory || settings.typeId) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-blue-800 mb-2">선택된 설정</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">
                {isRandomCategory ? '랜덤 카테고리' : CATEGORIES.find((c) => c.id === settings.category)?.name}
              </Badge>
              {!isRandomCategory && settings.typeId && (
                <Badge variant="secondary">{settings.typeId}</Badge>
              )}
              {settings.material.mode !== 'auto' && (
                <Badge variant="secondary">소재: {settings.material.mode === 'unused' ? '미사용' : settings.material.category ?? settings.material.specific ?? '카테고리'}</Badge>
              )}
              <Badge variant="secondary">
                {settings.variables.var7 ? `${settings.wordCount.min}~${settings.wordCount.max}자` : '글자수 랜덤'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 생성 개수 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">생성 개수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 3, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setBatchCount(n)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  batchCount === n ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >{n}개</button>
            ))}
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={100}
                className="w-20 h-8 text-sm"
                value={batchCount}
                onChange={(e) => setBatchCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              />
              <span className="text-xs text-gray-500">개</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 진행 상태 */}
      {loading && batchProgress.total > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {batchProgress.total}개 중 {batchProgress.current}개 생성 중...
              </p>
              <span className="text-xs text-gray-500">
                {Math.round((batchProgress.current / batchProgress.total) * 100)}%
              </span>
            </div>
            <Progress value={(batchProgress.current / batchProgress.total) * 100} />
            {batchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {batchResults.map((r, i) => {
                  const styles = {
                    generating: 'bg-blue-50 text-blue-600',
                    reviewing: 'bg-yellow-50 text-yellow-700',
                    pass: 'bg-green-50 text-green-700',
                    needs_user: 'bg-purple-50 text-purple-600',
                    retry: 'bg-orange-50 text-orange-600',
                    fail: 'bg-red-50 text-red-600',
                  }
                  const icons = {
                    generating: '⏳',
                    reviewing: '🔍',
                    pass: '✓',
                    needs_user: '⚠',
                    retry: '🔄',
                    fail: '✗',
                  }
                  return (
                    <div key={i} className={`text-xs px-2 py-1 rounded ${styles[r.status]}`}>
                      {icons[r.status]} {i + 1}번 — {r.title} {r.detail ? `(${r.detail})` : ''}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={loading || !settings.category || !settings.brandId || (!isRandomCategory && !settings.typeId)}
      >
        {loading
          ? `${batchProgress.total}개 중 ${batchProgress.current}개 생성 중...`
          : batchCount === 1
          ? '원고 생성 시작'
          : `원고 ${batchCount}개 생성 시작`
        }
      </Button>

      {/* 마지막 배치 결과 (탭 이동 후 돌아와도 유지) */}
      {!loading && lastBatchResults.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                최근 생성 결과 ({lastBatchResults.length}개)
              </CardTitle>
              <span className="text-xs text-gray-400">
                {lastBatchTime ? new Date(lastBatchTime).toLocaleString('ko-KR') : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {lastBatchResults.map((r, i) => {
                const styles = {
                  generating: 'bg-blue-50 text-blue-600',
                  reviewing: 'bg-yellow-50 text-yellow-700',
                  pass: 'bg-green-50 text-green-700',
                  needs_user: 'bg-purple-50 text-purple-600',
                  retry: 'bg-orange-50 text-orange-600',
                  fail: 'bg-red-50 text-red-600',
                }
                const icons = {
                  generating: '⏳', reviewing: '🔍', pass: '✓',
                  needs_user: '⚠', retry: '🔄', fail: '✗',
                }
                return (
                  <div key={i} className={`text-xs px-2 py-1.5 rounded flex items-center justify-between ${styles[r.status]}`}>
                    <span>{icons[r.status]} {i + 1}번 — {r.title} {r.detail ? `(${r.detail})` : ''}</span>
                    {r.id && (
                      <a href={`/manuscripts/${r.id}`} className="text-blue-600 underline ml-2 shrink-0">보기</a>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 mt-3 text-xs">
              <span className="text-green-600">통과: {lastBatchResults.filter((r) => r.status === 'pass').length}</span>
              <span className="text-purple-600">확인필요: {lastBatchResults.filter((r) => r.status === 'needs_user').length}</span>
              <span className="text-red-600">실패: {lastBatchResults.filter((r) => r.status === 'fail').length}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
