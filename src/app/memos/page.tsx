'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { getMemos, createMemo, updateMemo, deleteMemo } from '@/lib/firebase/fact-rules'

interface Memo {
  id?: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMemos()
  }, [])

  async function loadMemos() {
    setLoading(true)
    try {
      const data = await getMemos()
      setMemos(data)
    } catch {
      toast.error('메모를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 모든 태그 수집
  const allTags = Array.from(new Set(memos.flatMap((m) => m.tags))).sort()

  // 필터링
  const filtered = filterTag
    ? memos.filter((m) => m.tags.includes(filterTag))
    : memos

  function selectMemo(memo: Memo) {
    setSelectedId(memo.id ?? null)
    setContent(memo.content)
    setTagsInput(memo.tags.join(', '))
  }

  function resetForm() {
    setSelectedId(null)
    setContent('')
    setTagsInput('')
  }

  async function handleSave() {
    if (!content.trim()) {
      toast.error('내용을 입력하세요')
      return
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    setSaving(true)
    try {
      if (selectedId) {
        await updateMemo(selectedId, { content, tags })
        toast.success('메모가 수정되었습니다')
      } else {
        await createMemo({
          content,
          tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        toast.success('메모가 추가되었습니다')
      }
      resetForm()
      await loadMemos()
    } catch {
      toast.error('저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return
    try {
      await deleteMemo(id)
      toast.success('메모가 삭제되었습니다')
      if (selectedId === id) resetForm()
      await loadMemos()
    } catch {
      toast.error('삭제에 실패했습니다')
    }
  }

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">메모</h1>
      <p className="text-gray-500 mb-6">원고 작성에 참고할 메모를 관리합니다</p>

      {/* 태그 필터 */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-gray-500">태그 필터:</span>
          <Badge
            variant={filterTag === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterTag(null)}
          >
            전체
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={filterTag === tag ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 메모 목록 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">
              목록 ({filtered.length})
            </h2>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              메모가 없습니다
            </p>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
              {filtered.map((memo) => (
                <Card
                  key={memo.id}
                  className={`cursor-pointer transition-colors ${
                    selectedId === memo.id
                      ? 'border-blue-400 bg-blue-50/50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => selectMemo(memo)}
                >
                  <CardContent className="pt-3 pb-2">
                    <p className="text-sm text-gray-800 line-clamp-2 whitespace-pre-wrap">
                      {memo.content}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {memo.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs h-5"
                        >
                          {tag}
                        </Badge>
                      ))}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(memo.updatedAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (memo.id) handleDelete(memo.id)
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 우측: 편집 영역 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedId ? '메모 수정' : '새 메모'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                내용
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="메모 내용을 입력하세요"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                태그 (쉼표로 구분)
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="예: 보험, 실손, 주의사항"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : selectedId ? '수정' : '추가'}
              </Button>
              {selectedId && (
                <Button variant="outline" onClick={resetForm}>
                  취소
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
