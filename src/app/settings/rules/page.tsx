'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { getOpenProhibitions, updateOpenProhibitions } from '@/lib/firebase/collections'
import { PageHeader } from '@/components/layout/PageHeader'

export default function RulesSettingsPage() {
  const [openProhibitions, setOpenProhibitions] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getOpenProhibitions()
      .then((items) => setOpenProhibitions(items.join('\n')))
      .catch(() => toast.error('규칙을 불러오지 못했습니다'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const items = openProhibitions.split('\n').filter(Boolean)
      await updateOpenProhibitions(items)
      toast.success('검수 규칙이 저장되었습니다')
    } catch {
      toast.error('저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="검수 규칙 관리" description="원고 자동 검수에 사용되는 규칙을 관리합니다" backHref="/dashboard" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">오픈 금지사항</CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            원고에 포함되어서는 안 되는 표현/키워드입니다. 원고생성(계약직)에게도 전달됩니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">
              한 줄에 하나씩 입력 (키워드 또는 규칙 설명)
            </Label>
            {loading ? (
              <p className="text-sm text-gray-400">불러오는 중...</p>
            ) : (
              <Textarea
                value={openProhibitions}
                onChange={(e) => setOpenProhibitions(e.target.value)}
                rows={10}
                placeholder={
                  '경쟁사 직접 비교 금지\n수익 보장 표현 금지\n최고 최저 등 최상급 표현 금지\n"반드시" "무조건" 등 단정적 표현 금지'
                }
              />
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">자동 검수 항목</CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            현재 STEP 1 자동 검수에서 체크하는 항목들입니다
          </p>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-1.5">
            <li className="flex gap-2">
              <span className="text-green-500">✓</span>
              <span>제목 글자수 (최대 60자)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500">✓</span>
              <span>브랜드명 과다 언급 (최대 10회)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500">✓</span>
              <span>오픈 금지사항 키워드</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500">✓</span>
              <span>브랜드 설정 금지사항</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500">✓</span>
              <span>보장 단정 표현 (보장됩니다, 100% 보장 등)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500">✓</span>
              <span>본문 최소 길이</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
