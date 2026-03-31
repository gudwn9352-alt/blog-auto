'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  getFactRules,
  createFactRule,
  updateFactRule,
  deleteFactRule,
} from '@/lib/firebase/fact-rules'
import type { FactRule } from '@/types/manuscript'

const EMPTY_RULE: Omit<FactRule, 'id'> = {
  keywords: [],
  condition: '',
  allowed: [],
  blocked: [],
  rejectionMsg: '',
}

export default function FactRulesPage() {
  const [rules, setRules] = useState<FactRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 폼 상태
  const [keywordsInput, setKeywordsInput] = useState('')
  const [condition, setCondition] = useState('')
  const [allowedInput, setAllowedInput] = useState('')
  const [blockedInput, setBlockedInput] = useState('')
  const [rejectionMsg, setRejectionMsg] = useState('')

  useEffect(() => {
    loadRules()
  }, [])

  async function loadRules() {
    setLoading(true)
    try {
      const data = await getFactRules()
      setRules(data)
    } catch {
      toast.error('팩트 룰을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingId(null)
    setKeywordsInput('')
    setCondition('')
    setAllowedInput('')
    setBlockedInput('')
    setRejectionMsg('')
    setDialogOpen(true)
  }

  function openEdit(rule: FactRule) {
    setEditingId(rule.id ?? null)
    setKeywordsInput(rule.keywords.join(', '))
    setCondition(rule.condition)
    setAllowedInput(rule.allowed.join('\n'))
    setBlockedInput(rule.blocked.join('\n'))
    setRejectionMsg(rule.rejectionMsg)
    setDialogOpen(true)
  }

  function parseList(input: string, separator: string): string[] {
    return input
      .split(separator)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function handleSave() {
    const keywords = parseList(keywordsInput, ',')
    const allowed = parseList(allowedInput, '\n')
    const blocked = parseList(blockedInput, '\n')

    if (keywords.length === 0) {
      toast.error('키워드를 1개 이상 입력하세요')
      return
    }
    if (!condition.trim()) {
      toast.error('조건을 입력하세요')
      return
    }

    const data: Omit<FactRule, 'id'> = {
      keywords,
      condition: condition.trim(),
      allowed,
      blocked,
      rejectionMsg: rejectionMsg.trim(),
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateFactRule(editingId, data)
        toast.success('룰이 수정되었습니다')
      } else {
        await createFactRule(data)
        toast.success('룰이 추가되었습니다')
      }
      setDialogOpen(false)
      await loadRules()
    } catch {
      toast.error('저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 팩트 룰을 삭제하시겠습니까?')) return
    try {
      await deleteFactRule(id)
      toast.success('룰이 삭제되었습니다')
      await loadRules()
    } catch {
      toast.error('삭제에 실패했습니다')
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title="팩트 룰 관리" description="원고 검수 시 적용되는 팩트 기반 룰을 관리합니다" backHref="/dashboard">
        <Button onClick={openCreate}>+ 룰 추가</Button>
      </PageHeader>

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>등록된 팩트 룰이 없습니다</p>
          <Button variant="outline" className="mt-3" onClick={openCreate}>
            첫 번째 룰 추가
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* 키워드 */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {rule.keywords.map((kw) => (
                        <Badge key={kw} variant="default" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>

                    {/* 조건 */}
                    <p className="text-sm text-gray-700">{rule.condition}</p>

                    {/* 허용/금지 */}
                    <div className="flex gap-6 text-xs">
                      {rule.allowed.length > 0 && (
                        <div>
                          <span className="text-green-600 font-medium">
                            허용:
                          </span>{' '}
                          <span className="text-gray-500">
                            {rule.allowed.join(', ')}
                          </span>
                        </div>
                      )}
                      {rule.blocked.length > 0 && (
                        <div>
                          <span className="text-red-500 font-medium">
                            금지:
                          </span>{' '}
                          <span className="text-gray-500">
                            {rule.blocked.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 반려 메시지 */}
                    {rule.rejectionMsg && (
                      <p className="text-xs text-orange-600">
                        반려: {rule.rejectionMsg}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => openEdit(rule)}
                    >
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 text-xs h-7"
                      onClick={() => rule.id && handleDelete(rule.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 추가/편집 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '팩트 룰 수정' : '팩트 룰 추가'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>키워드 (쉼표로 구분)</Label>
              <Input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="예: 실손보험, 실비보험"
                className="mt-1"
              />
            </div>

            <div>
              <Label>조건</Label>
              <Textarea
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                rows={2}
                placeholder="이 룰이 적용되는 조건을 설명하세요"
                className="mt-1"
              />
            </div>

            <div>
              <Label>허용 표현 (줄바꿈으로 구분)</Label>
              <Textarea
                value={allowedInput}
                onChange={(e) => setAllowedInput(e.target.value)}
                rows={3}
                placeholder="허용되는 표현을 한 줄에 하나씩 입력"
                className="mt-1"
              />
            </div>

            <div>
              <Label>금지 표현 (줄바꿈으로 구분)</Label>
              <Textarea
                value={blockedInput}
                onChange={(e) => setBlockedInput(e.target.value)}
                rows={3}
                placeholder="금지되는 표현을 한 줄에 하나씩 입력"
                className="mt-1"
              />
            </div>

            <div>
              <Label>반려 메시지</Label>
              <Input
                value={rejectionMsg}
                onChange={(e) => setRejectionMsg(e.target.value)}
                placeholder="위반 시 표시할 반려 메시지"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : editingId ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
