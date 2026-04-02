'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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
  // ?앹꽦 以??ㅼ떆媛??쒖떆??濡쒖뺄 ?대?吏 ?곹깭
  const [localImages, setLocalImages] = useState<GeneratedImage[] | null>(null)
  const displayImages = localImages ?? images

  function updateImages(updated: GeneratedImage[]) {
    setLocalImages(updated)
    onImagesChange(updated)
  }

  // ?대?吏 ?꾨＼?꾪듃 ?앹꽦 (怨쇱옣 ??븷)
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

      updateImages(newImages)
      toast.success(`${count}媛??대?吏 ?꾨＼?꾪듃 ?앹꽦 ?꾨즺`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '?꾨＼?꾪듃 ?앹꽦 ?ㅽ뙣')
    } finally {
      setPromptsLoading(false)
    }
  }

  // 媛쒕퀎 ?대?吏 ?앹꽦 (Gemini)
  async function handleGenerateImage(idx: number) {
    const img = displayImages[idx]
    if (!img?.promptEn) {
      toast.error('?꾨＼?꾪듃媛 ?놁뒿?덈떎')
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
          manuscriptId,
          imageIndex: idx,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // ?쒕쾭 API濡??낅줈????URL留?Firestore?????      let imageUrl = data.imageUrl
      try {
        const uploadRes = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manuscriptId, imageIndex: idx, dataUrl: data.imageUrl }),
        })
        const uploadData = await uploadRes.json()
        if (uploadData.imageUrl) imageUrl = uploadData.imageUrl
      } catch {
        // ?낅줈???ㅽ뙣 ??Base64 洹몃?濡??ъ슜
      }

      const updated = [...displayImages]
      updated[idx] = { ...updated[idx], imageUrl }
      updateImages(updated)
      if (data.model === 'gemini-2.5-flash-image') {
        toast.warning(`?대?吏 ${idx + 1} ??Imagen 4.0 ?ㅽ뙣, Gemini 2.5 Flash濡??泥??앹꽦??)
      } else {
        toast.success(`?대?吏 ${idx + 1} ?앹꽦 ?꾨즺 (Imagen 4.0)`)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '?대?吏 ?앹꽦 ?ㅽ뙣')
    } finally {
      setGenerating(false)
      setGeneratingIdx(-1)
    }
  }

  // 痍⑥냼 ?뚮옒洹?  const cancelRef = { current: false }

  // ?꾩껜 ?대?吏 ?쇨큵 ?앹꽦
  async function handleGenerateAll() {
    const hasExisting = displayImages.some((img) => img.imageUrl)
    if (hasExisting) {
      if (!confirm('?대? ?앹꽦???대?吏媛 ?덉뼱?? ?ъ깮???섏떆寃좎뒿?덇퉴?')) return
    }
    cancelRef.current = false
    setGenerating(true)
    const local = [...displayImages]
    let ok = 0
    const startTime = Date.now()

    for (let i = 0; i < local.length; i++) {
      if (cancelRef.current) { toast.info('?대?吏 ?앹꽦??痍⑥냼?섏뿀?듬땲??); break }
      setGeneratingIdx(i)
      try {
        const res = await fetch('/api/generate/image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: local[i].promptEn, imageType: local[i].imageType, manuscriptId, imageIndex: i }),
        })
        const data = await res.json()
        if (res.ok && data.imageUrl) {
          local[i] = { ...local[i], imageUrl: data.imageUrl }
          setLocalImages([...local])
          ok++
        } else {
          await new Promise(r => setTimeout(r, 2000))
          if (cancelRef.current) break
          const res2 = await fetch('/api/generate/image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: local[i].promptEn, imageType: local[i].imageType, manuscriptId, imageIndex: i }),
          })
          const data2 = await res2.json()
          if (res2.ok && data2.imageUrl) {
            local[i] = { ...local[i], imageUrl: data2.imageUrl }
            setLocalImages([...local])
            ok++
          }
        }
      } catch {}
      await new Promise(r => setTimeout(r, 1500))
    }
    // 理쒖쥌 1踰덈쭔 Firestore ???    onImagesChange([...local])
    setGenerating(false)
    setGeneratingIdx(-1)
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    toast.success(`?대?吏 ${ok}/${local.length}???앹꽦 ?꾨즺 (${elapsed}珥?`)
  }

  function handleCancelGenerate() {
    cancelRef.current = true
  }

  // ?먮뵒????????몄쭛???대?吏瑜??쒕쾭???뚯씪濡????  async function handleEditorSave(editedUrl: string) {
    let imageUrl = editedUrl
    try {
      // ?몄쭛???대?吏瑜??쒕쾭???뚯씪濡????      const uploadRes = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manuscriptId, imageIndex: editingIdx, dataUrl: editedUrl }),
      })
      const uploadData = await uploadRes.json()
      if (uploadData.imageUrl) imageUrl = uploadData.imageUrl
    } catch { /* ?ㅽ뙣 ??Base64 ?좎? */ }

    const updated = [...displayImages]
    updated[editingIdx] = { ...updated[editingIdx], imageUrl, edited: true }
    updateImages(updated)
    setEditingIdx(-1)
    toast.success('?대?吏 ?몄쭛 ????꾨즺')
  }

  // ?꾩껜 ?몄쭛 ?꾨즺 ??紐⑤뱺 ?대?吏???띿뒪???먮룞 ?⑹꽦
  async function handleApplyAllText() {
    const confirmed = confirm('紐⑤뱺 ?대?吏???띿뒪??硫붿씤 移댄뵾, 蹂댁“ 臾멸뎄)瑜??먮룞 ?⑹꽦?⑸땲??\n湲곗〈 ?몄쭛? ??뼱?뚯썙吏묐땲?? 吏꾪뻾?섏떆寃좎뒿?덇퉴?')
    if (!confirmed) return

    setGenerating(true)
    const local = [...displayImages]
    let ok = 0

    for (let i = 0; i < local.length; i++) {
      const img = local[i]
      if (!img.imageUrl) continue
      if (!img.processingText?.mainCopy && !img.processingText?.subCopy) { ok++; continue }

      setGeneratingIdx(i)

      try {
        // Canvas?먯꽌 ?띿뒪???⑹꽦
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) continue

        const size = 600
        canvas.width = size
        canvas.height = size

        // 諛곌꼍 ?대?吏 濡쒕뱶
        const bgImg = await loadImage(img.imageUrl)
        ctx.drawImage(bgImg, 0, 0, size, size)

        // ?섎떒 ?ㅻ쾭?덉씠
        if (img.processingText?.mainCopy || img.processingText?.subCopy) {
          ctx.fillStyle = 'rgba(0,0,0,0.45)'
          ctx.fillRect(0, size - 180, size, 180)
        }

        // ?띿뒪??洹몃┝??        ctx.shadowColor = 'rgba(0,0,0,0.7)'
        ctx.shadowBlur = 6
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        ctx.textAlign = 'center'

        // 硫붿씤 移댄뵾
        if (img.processingText?.mainCopy) {
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 44px "Noto Sans KR", sans-serif'
          ctx.fillText(img.processingText.mainCopy, size / 2, size - 110, size - 80)
        }

        // 蹂댁“ 臾멸뎄
        if (img.processingText?.subCopy) {
          ctx.fillStyle = '#dddddd'
          ctx.font = '22px "Noto Sans KR", sans-serif'
          ctx.fillText(img.processingText.subCopy, size / 2, size - 60, size - 80)
        }

        ctx.shadowColor = 'transparent'

        const editedUrl = canvas.toDataURL('image/png')

        // ?쒕쾭???뚯씪 ???        let imageUrl = editedUrl
        try {
          const uploadRes = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manuscriptId, imageIndex: i, dataUrl: editedUrl }),
          })
          const uploadData = await uploadRes.json()
          if (uploadData.imageUrl) imageUrl = uploadData.imageUrl
        } catch {}

        local[i] = { ...local[i], imageUrl, edited: true }
        setLocalImages([...local])
        ok++
      } catch {}
    }

    onImagesChange([...local])
    setGenerating(false)
    setGeneratingIdx(-1)
    toast.success(`${ok}???띿뒪???⑹꽦 ?꾨즺`)
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  // ?대?吏 ?ъ깮??  async function handleRegenerate(idx: number) {
    const img = images[idx]
    const updated = [...images]
    const history = img.regenerationHistory ?? []
    if (img.imageUrl) {
      history.push({
        timestamp: new Date().toISOString(),
        previousUrl: img.imageUrl,
        reason: '?ъ깮??,
      })
    }
    updated[idx] = { ...updated[idx], imageUrl: undefined, edited: false, regenerationHistory: history }
    updateImages(updated)
    await handleGenerateImage(idx)
  }

  // 媛쒕퀎 ?대?吏 ?ㅼ슫濡쒕뱶
  function handleDownloadImage(idx: number) {
    const img = images[idx]
    if (!img?.imageUrl) return
    const a = document.createElement('a')
    a.href = img.imageUrl
    a.download = `?대?吏${idx + 1}.png`
    a.click()
  }

  // ?꾩껜 ?대?吏 ZIP ?ㅼ슫濡쒕뱶
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
        zip.file(`?대?吏${i + 1}.png`, blob)
      } catch { /* skip */ }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}_?대?吏.zip`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('?대?吏 ZIP ?ㅼ슫濡쒕뱶 ?꾨즺')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">?대?吏 ({displayImages.length}媛?</CardTitle>
          <div className="flex gap-2">
            {displayImages.length === 0 && (
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => {
                  const rand = Math.floor(Math.random() * 9) + 7 // 7~15
                  handleGeneratePrompts(rand)
                }} disabled={promptsLoading}>
                  ?쒕뜡
                </Button>
                {[7, 10, 15].map((n) => (
                  <Button key={n} size="sm" variant="outline" onClick={() => handleGeneratePrompts(n)} disabled={promptsLoading}>
                    {n}??                  </Button>
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
                  {promptsLoading ? '?앹꽦 以?..' : '?앹꽦'}
                </Button>
              </div>
            )}
            {images.length > 0 && !generating && (
              <Button size="sm" onClick={handleGenerateAll}>
                {displayImages.every((img) => img.imageUrl) ? '?꾩껜 ?ъ깮?? : '?꾩껜 ?앹꽦'}
              </Button>
            )}
            {generating && (
              <>
                <span className="text-xs text-gray-500">{generatingIdx + 1}/{displayImages.length} (~{Math.round((displayImages.length - generatingIdx) * 8)}珥?</span>
                <Button size="sm" variant="destructive" onClick={handleCancelGenerate}>痍⑥냼</Button>
              </>
            )}
            {images.length > 0 && displayImages.some((img) => img.imageUrl) && (
              <>
                <Button size="sm" variant="outline" onClick={handleApplyAllText} disabled={generating}>
                  ?꾩껜 ?띿뒪???⑹꽦
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadAllImages}>
                  ?대?吏 ZIP
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayImages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            ?대?吏 ?꾨＼?꾪듃瑜?癒쇱? ?앹꽦?섏꽭??(7~15?? ?쒕뜡 ?먮뒗 吏곸젒 吏??
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {displayImages.map((img, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                {/* ?대?吏 ?곸뿭 */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {img.imageUrl ? (
                    <img src={img.imageUrl} alt={img.promptKo} className="w-full h-full object-cover transition-opacity duration-300" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                      {generating && generatingIdx === i ? (
                        <>
                          <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-blue-500 font-medium">{i + 1}/{displayImages.length} ?앹꽦 以?/span>
                        </>
                      ) : generating && i > generatingIdx ? (
                        <span className="text-gray-300">?湲?以?/span>
                      ) : (
                        <span>誘몄깮??/span>
                      )}
                    </div>
                  )}
                  {img.edited && (
                    <Badge className="absolute top-1 right-1 text-[10px]" variant="secondary">?몄쭛??/Badge>
                  )}
                  {generating && generatingIdx === i && img.imageUrl && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* ?뺣낫 + ?≪뀡 */}
                <div className="p-2 space-y-1.5">
                  <p className="text-xs text-gray-700 line-clamp-2">{img.promptKo}</p>
                  {img.processingText?.mainCopy && (
                    <p className="text-[10px] text-blue-600">移댄뵾: {img.processingText.mainCopy}</p>
                  )}
                  <div className="flex gap-1">
                    {!img.imageUrl ? (
                      <Button size="sm" variant="outline" className="text-xs h-6 flex-1"
                        onClick={() => handleGenerateImage(i)} disabled={generating}>
                        ?앹꽦
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="text-xs h-6 flex-1"
                          onClick={() => setEditingIdx(i)}>
                          ?몄쭛
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-6"
                          onClick={() => handleRegenerate(i)} disabled={generating}>
                          ?ъ깮??                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-6"
                          onClick={() => handleDownloadImage(i)}>
                          ???                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ?먮뵒???ㅼ씠?쇰줈洹????꾩껜?붾㈃ + 醫뚯슦 ?ㅻ퉬寃뚯씠??*/}
        <Dialog open={editingIdx >= 0} onOpenChange={(open) => !open && setEditingIdx(-1)}>
          <DialogContent className="p-0 overflow-hidden" style={{ maxWidth: '98vw', width: '98vw', maxHeight: '95vh', height: '95vh' }}>
            <div className="flex flex-col h-full">
              {/* ?곷떒 諛?*/}
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
                    {editingIdx + 1} / {displayImages.length}
                  </span>
                  <button
                    onClick={() => setEditingIdx(Math.min(images.length - 1, editingIdx + 1))}
                    disabled={editingIdx >= images.length - 1}
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <DialogTitle className="text-sm text-gray-600">?대?吏 ?몄쭛</DialogTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingIdx(-1)}>?リ린</Button>
                </div>
              </div>

              {/* ?먮뵒??蹂몄껜 */}
              <div className="flex-1 overflow-auto p-6">
                {editingIdx >= 0 && displayImages[editingIdx]?.imageUrl && (
                  <ImageEditor
                    key={editingIdx}
                    imageUrl={displayImages[editingIdx].imageUrl!}
                    initialMainCopy={displayImages[editingIdx].processingText?.mainCopy}
                    initialSubCopy={displayImages[editingIdx].processingText?.subCopy}
                    onSave={handleEditorSave}
                    onCancel={() => setEditingIdx(-1)}
                  />
                )}
                {editingIdx >= 0 && !displayImages[editingIdx]?.imageUrl && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    ???대?吏???꾩쭅 ?앹꽦?섏? ?딆븯?듬땲??                  </div>
                )}
              </div>

              {/* ?섎떒 ?몃꽕??諛?*/}
              <div className="flex items-center gap-2 px-6 py-3 border-t bg-gray-50 overflow-x-auto shrink-0">
                {displayImages.map((img, i) => (
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

