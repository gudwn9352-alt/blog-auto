'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageEditor } from './ImageEditor'
import type { GeneratedImage } from '@/types/manuscript'

interface ImageManagerProps {
  manuscriptId: string
  title: string
  body: string
  images: GeneratedImage[]
  onImagesChange: (images: GeneratedImage[]) => void
}

export function ImageManager({ manuscriptId, title, body, images, onImagesChange }: ImageManagerProps) {
  const [generating, setGenerating] = useState(false)
  const [generatingIdx, setGeneratingIdx] = useState(-1)
  const [editingIdx, setEditingIdx] = useState(-1)
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [customCount, setCustomCount] = useState(8)

  // 이미지 프롬프트 생성 (과장 역할)
  async function handleGeneratePrompts(count: number) {
    setPromptsLoading(true)
    try {
      const res = await fetch('/api/generate/image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, persona: {}, imageCount: count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const newImages: GeneratedImage[] = data.images.map((img: {
        position: number
        promptKo: string
        promptEn: string
        imageType: string
        processingText: { mainCopy: string; subCopy: string }
      }) => ({
        position: img.position,
        promptKo: img.promptKo,
        promptEn: img.promptEn,
        imageType: img.imageType,
        processingText: {
          mainCopy: img.processingText?.mainCopy ?? '',
          subCopy: img.processingText?.subCopy ?? '',
        },
      }))

      onImagesChange(newImages)
      toast.success(`${count}개 이미지 프롬프트 생성 완료`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '프롬프트 생성 실패')
    } finally {
      setPromptsLoading(false)
    }
  }

  // 개별 이미지 생성 (Gemini)
  async function handleGenerateImage(idx: number) {
    const img = images[idx]
    if (!img?.promptEn) {
      toast.error('프롬프트가 없습니다')
      return
    }

    setGenerating(true)
    setGeneratingIdx(idx)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: img.promptEn,
          imageType: img.imageType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 서버 API로 업로드 → URL만 Firestore에 저장
      let imageUrl = data.imageUrl
      try {
        const uploadRes = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manuscriptId, imageIndex: idx, dataUrl: data.imageUrl }),
        })
        const uploadData = await uploadRes.json()
        if (uploadData.imageUrl) imageUrl = uploadData.imageUrl
      } catch {
        // 업로드 실패 시 Base64 그대로 사용
      }

      const updated = [...images]
      updated[idx] = { ...updated[idx], imageUrl }
      onImagesChange(updated)
      if (data.model === 'gemini-2.5-flash-image') {
        toast.warning(`이미지 ${idx + 1} — Imagen 4.0 실패, Gemini 2.5 Flash로 대체 생성됨`)
      } else {
        toast.success(`이미지 ${idx + 1} 생성 완료 (Imagen 4.0)`)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '이미지 생성 실패')
    } finally {
      setGenerating(false)
      setGeneratingIdx(-1)
    }
  }

  // 전체 이미지 일괄 생성
  async function handleGenerateAll() {
    setGenerating(true)
    for (let i = 0; i < images.length; i++) {
      if (images[i].imageUrl) continue // 이미 생성된 건 스킵
      setGeneratingIdx(i)
      await handleGenerateImage(i)
    }
    setGenerating(false)
    setGeneratingIdx(-1)
  }

  // 에디터 저장
  async function handleEditorSave(editedUrl: string) {
    let imageUrl = editedUrl
    try {
      const uploadRes = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manuscriptId, imageIndex: editingIdx, dataUrl: editedUrl }),
      })
      const uploadData = await uploadRes.json()
      if (uploadData.imageUrl) imageUrl = uploadData.imageUrl
    } catch { /* 업로드 실패 시 Base64 유지 */ }

    const updated = [...images]
    updated[editingIdx] = { ...updated[editingIdx], imageUrl, edited: true }
    onImagesChange(updated)
    setEditingIdx(-1)
    toast.success('이미지 편집 저장 완료')
  }

  // 이미지 재생성
  async function handleRegenerate(idx: number) {
    const img = images[idx]
    const updated = [...images]
    const history = img.regenerationHistory ?? []
    if (img.imageUrl) {
      history.push({
        timestamp: new Date().toISOString(),
        previousUrl: img.imageUrl,
        reason: '재생성',
      })
    }
    updated[idx] = { ...updated[idx], imageUrl: undefined, edited: false, regenerationHistory: history }
    onImagesChange(updated)
    await handleGenerateImage(idx)
  }

  // 개별 이미지 다운로드
  function handleDownloadImage(idx: number) {
    const img = images[idx]
    if (!img?.imageUrl) return
    const a = document.createElement('a')
    a.href = img.imageUrl
    a.download = `이미지${idx + 1}.png`
    a.click()
  }

  // 전체 이미지 ZIP 다운로드
  async function handleDownloadAllImages() {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (!img?.imageUrl) continue

      try {
        let blob: Blob
        if (img.imageUrl.startsWith('data:')) {
          const res = await fetch(img.imageUrl)
          blob = await res.blob()
        } else {
          const res = await fetch(img.imageUrl)
          blob = await res.blob()
        }
        zip.file(`이미지${i + 1}.png`, blob)
      } catch { /* skip */ }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}_이미지.zip`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('이미지 ZIP 다운로드 완료')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">이미지 ({images.length}개)</CardTitle>
          <div className="flex gap-2">
            {images.length === 0 && (
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => {
                  const rand = Math.floor(Math.random() * 9) + 7 // 7~15
                  handleGeneratePrompts(rand)
                }} disabled={promptsLoading}>
                  랜덤
                </Button>
                {[7, 10, 15].map((n) => (
                  <Button key={n} size="sm" variant="outline" onClick={() => handleGeneratePrompts(n)} disabled={promptsLoading}>
                    {n}장
                  </Button>
                ))}
                <Input
                  type="number"
                  min={7}
                  max={15}
                  className="w-16 h-8 text-xs"
                  value={customCount}
                  onChange={(e) => setCustomCount(Math.max(7, Math.min(15, Number(e.target.value))))}
                />
                <Button size="sm" onClick={() => handleGeneratePrompts(customCount)} disabled={promptsLoading}>
                  {promptsLoading ? '생성 중...' : '생성'}
                </Button>
              </div>
            )}
            {images.length > 0 && images.some((img) => !img.imageUrl) && (
              <Button size="sm" onClick={handleGenerateAll} disabled={generating}>
                {generating ? `${generatingIdx + 1}/${images.length} 생성 중...` : '전체 생성'}
              </Button>
            )}
            {images.length > 0 && images.some((img) => img.imageUrl) && (
              <Button size="sm" variant="outline" onClick={handleDownloadAllImages}>
                이미지 ZIP
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            이미지 프롬프트를 먼저 생성하세요 (7~15장, 랜덤 또는 직접 지정)
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                {/* 이미지 영역 */}
                <div className="aspect-square bg-gray-100 relative">
                  {img.imageUrl ? (
                    <img src={img.imageUrl} alt={img.promptKo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      {generating && generatingIdx === i ? '생성 중...' : '미생성'}
                    </div>
                  )}
                  {img.edited && (
                    <Badge className="absolute top-1 right-1 text-[10px]" variant="secondary">편집됨</Badge>
                  )}
                </div>

                {/* 정보 + 액션 */}
                <div className="p-2 space-y-1.5">
                  <p className="text-xs text-gray-700 line-clamp-2">{img.promptKo}</p>
                  {img.processingText?.mainCopy && (
                    <p className="text-[10px] text-blue-600">카피: {img.processingText.mainCopy}</p>
                  )}
                  <div className="flex gap-1">
                    {!img.imageUrl ? (
                      <Button size="sm" variant="outline" className="text-xs h-6 flex-1"
                        onClick={() => handleGenerateImage(i)} disabled={generating}>
                        생성
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="text-xs h-6 flex-1"
                          onClick={() => setEditingIdx(i)}>
                          편집
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-6"
                          onClick={() => handleRegenerate(i)} disabled={generating}>
                          재생성
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-6"
                          onClick={() => handleDownloadImage(i)}>
                          저장
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 에디터 다이얼로그 — 전체화면 + 좌우 네비게이션 */}
        <Dialog open={editingIdx >= 0} onOpenChange={(open) => !open && setEditingIdx(-1)}>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 overflow-hidden">
            <div className="flex flex-col h-full">
              {/* 상단 바 */}
              <div className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setEditingIdx(Math.max(0, editingIdx - 1))}
                    disabled={editingIdx <= 0}
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <span className="text-sm font-bold text-gray-900">
                    {editingIdx + 1} / {images.length}
                  </span>
                  <button
                    onClick={() => setEditingIdx(Math.min(images.length - 1, editingIdx + 1))}
                    disabled={editingIdx >= images.length - 1}
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <DialogTitle className="text-sm text-gray-600">이미지 편집</DialogTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingIdx(-1)}>닫기</Button>
                </div>
              </div>

              {/* 에디터 본체 */}
              <div className="flex-1 overflow-auto p-6">
                {editingIdx >= 0 && images[editingIdx]?.imageUrl && (
                  <ImageEditor
                    key={editingIdx}
                    imageUrl={images[editingIdx].imageUrl!}
                    initialMainCopy={images[editingIdx].processingText?.mainCopy}
                    initialSubCopy={images[editingIdx].processingText?.subCopy}
                    onSave={handleEditorSave}
                    onCancel={() => setEditingIdx(-1)}
                  />
                )}
                {editingIdx >= 0 && !images[editingIdx]?.imageUrl && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    이 이미지는 아직 생성되지 않았습니다
                  </div>
                )}
              </div>

              {/* 하단 썸네일 바 */}
              <div className="flex items-center gap-2 px-6 py-3 border-t bg-gray-50 overflow-x-auto shrink-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setEditingIdx(i)}
                    className={`shrink-0 w-14 h-14 rounded-lg border-2 overflow-hidden transition-all ${
                      i === editingIdx ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {img.imageUrl ? (
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">{i + 1}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
