'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ImageEditorProps {
  imageUrl: string
  onSave: (editedUrl: string) => void
  onCancel: () => void
  initialMainCopy?: string
  initialSubCopy?: string
}

interface DraggableItem {
  id: string
  type: 'text' | 'box'
  x: number
  y: number
  width: number
  height: number
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  bold?: boolean
  shadow?: boolean
  bgColor?: string
  bgOpacity?: number
  borderRadius?: number
}

const FONTS = [
  { value: 'Noto Sans KR', label: '노토산스' },
  { value: 'serif', label: '명조체' },
  { value: 'sans-serif', label: '고딕체' },
]

const CANVAS_SIZE = 600

export function ImageEditor({ imageUrl, onSave, onCancel, initialMainCopy, initialSubCopy }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // 드래그 가능한 아이템들
  const [items, setItems] = useState<DraggableItem[]>([
    {
      id: 'overlay', type: 'box',
      x: 0, y: 250, width: CANVAS_SIZE, height: 200,
      bgColor: '#000000', bgOpacity: 40, borderRadius: 0,
    },
    {
      id: 'main', type: 'text',
      x: CANVAS_SIZE / 2, y: 320,
      width: 500, height: 60,
      text: initialMainCopy ?? '', fontSize: 48, fontFamily: 'Noto Sans KR',
      color: '#ffffff', bold: true, shadow: true,
    },
    {
      id: 'sub', type: 'text',
      x: CANVAS_SIZE / 2, y: 380,
      width: 500, height: 40,
      text: initialSubCopy ?? '', fontSize: 24, fontFamily: 'Noto Sans KR',
      color: '#ffffff', bold: false, shadow: true,
    },
  ])

  const [selectedId, setSelectedId] = useState<string | null>('main')
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizing, setResizing] = useState(false)

  const selected = items.find((i) => i.id === selectedId) ?? null

  // 이미지 로드
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imgRef.current = img; setImgLoaded(true) }
    img.src = imageUrl
  }, [imageUrl])

  // 렌더링
  const render = useCallback(() => {
    if (!canvasRef.current || !imgRef.current || !imgLoaded) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    ctx.drawImage(imgRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE)

    for (const item of items) {
      if (item.type === 'box') {
        const alpha = (item.bgOpacity ?? 40) / 100
        ctx.fillStyle = `${item.bgColor ?? '#000000'}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
        if (item.borderRadius && item.borderRadius > 0) {
          roundRect(ctx, item.x, item.y, item.width, item.height, item.borderRadius)
          ctx.fill()
        } else {
          ctx.fillRect(item.x, item.y, item.width, item.height)
        }
      } else if (item.type === 'text' && item.text) {
        if (item.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.7)'
          ctx.shadowBlur = 6
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = 2
        }
        ctx.fillStyle = item.color ?? '#ffffff'
        ctx.font = `${item.bold ? 'bold ' : ''}${item.fontSize ?? 48}px "${item.fontFamily ?? 'Noto Sans KR'}"`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(item.text, item.x, item.y, item.width)
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }

      // 선택 표시
      if (item.id === selectedId) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 3])
        if (item.type === 'box') {
          ctx.strokeRect(item.x - 2, item.y - 2, item.width + 4, item.height + 4)
        } else {
          const w = item.width ?? 200
          const h = item.fontSize ? item.fontSize + 10 : 50
          ctx.strokeRect(item.x - w / 2 - 2, item.y - h / 2 - 2, w + 4, h + 4)
        }
        ctx.setLineDash([])

        // 리사이즈 핸들
        ctx.fillStyle = '#3b82f6'
        if (item.type === 'box') {
          ctx.fillRect(item.x + item.width - 6, item.y + item.height - 6, 12, 12)
        }
      }
    }
  }, [items, selectedId, imgLoaded])

  useEffect(() => { render() }, [render])

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  // 마우스 이벤트
  function getCanvasPos(e: React.MouseEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scale = CANVAS_SIZE / rect.width
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale }
  }

  function hitTest(px: number, py: number): DraggableItem | null {
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]
      if (item.type === 'box') {
        if (px >= item.x && px <= item.x + item.width && py >= item.y && py <= item.y + item.height) return item
      } else {
        const w = item.width ?? 200
        const h = item.fontSize ? item.fontSize + 10 : 50
        if (px >= item.x - w / 2 && px <= item.x + w / 2 && py >= item.y - h / 2 && py <= item.y + h / 2) return item
      }
    }
    return null
  }

  function isResizeHandle(item: DraggableItem, px: number, py: number): boolean {
    if (item.type !== 'box') return false
    const hx = item.x + item.width
    const hy = item.y + item.height
    return Math.abs(px - hx) < 12 && Math.abs(py - hy) < 12
  }

  function handleMouseDown(e: React.MouseEvent) {
    const pos = getCanvasPos(e)
    const hit = hitTest(pos.x, pos.y)
    if (hit) {
      setSelectedId(hit.id)
      if (isResizeHandle(hit, pos.x, pos.y)) {
        setResizing(true)
      } else {
        setDragging(true)
        if (hit.type === 'box') {
          setDragOffset({ x: pos.x - hit.x, y: pos.y - hit.y })
        } else {
          setDragOffset({ x: pos.x - hit.x, y: pos.y - hit.y })
        }
      }
    } else {
      setSelectedId(null)
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!selectedId) return
    const pos = getCanvasPos(e)
    if (dragging) {
      setItems((prev) => prev.map((item) =>
        item.id === selectedId
          ? { ...item, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
          : item
      ))
    } else if (resizing && selected?.type === 'box') {
      setItems((prev) => prev.map((item) =>
        item.id === selectedId
          ? { ...item, width: Math.max(50, pos.x - item.x), height: Math.max(30, pos.y - item.y) }
          : item
      ))
    }
  }

  function handleMouseUp() {
    setDragging(false)
    setResizing(false)
  }

  function updateSelected(patch: Partial<DraggableItem>) {
    if (!selectedId) return
    setItems((prev) => prev.map((item) => item.id === selectedId ? { ...item, ...patch } : item))
  }

  function addBox() {
    const id = `box-${Date.now()}`
    setItems((prev) => [...prev, {
      id, type: 'box', x: 100, y: 100, width: 400, height: 120,
      bgColor: '#000000', bgOpacity: 50, borderRadius: 12,
    }])
    setSelectedId(id)
  }

  function addText() {
    const id = `text-${Date.now()}`
    setItems((prev) => [...prev, {
      id, type: 'text', x: 300, y: 200, width: 400, height: 50,
      text: '텍스트 입력', fontSize: 32, fontFamily: 'Noto Sans KR',
      color: '#ffffff', bold: true, shadow: true,
    }])
    setSelectedId(id)
  }

  function deleteSelected() {
    if (!selectedId) return
    setItems((prev) => prev.filter((i) => i.id !== selectedId))
    setSelectedId(null)
  }

  function handleSave() {
    // 선택 해제 후 렌더링
    setSelectedId(null)
    setTimeout(() => {
      if (!canvasRef.current) return
      const dataUrl = canvasRef.current.toDataURL('image/png')
      onSave(dataUrl)
    }, 50)
  }

  return (
    <div className="flex gap-4">
      {/* 캔버스 */}
      <div className="shrink-0">
        <canvas
          ref={canvasRef}
          className="border border-gray-200 rounded-lg cursor-move"
          style={{ width: 420, height: 420 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="flex gap-1.5 mt-2">
          <Button size="sm" variant="outline" onClick={addBox} className="text-xs">+ 박스</Button>
          <Button size="sm" variant="outline" onClick={addText} className="text-xs">+ 텍스트</Button>
          {selectedId && (
            <Button size="sm" variant="destructive" onClick={deleteSelected} className="text-xs">삭제</Button>
          )}
        </div>
      </div>

      {/* 편집 패널 */}
      <div className="flex-1 space-y-3 max-w-xs">
        {selected ? (
          <>
            <p className="text-xs font-medium text-gray-500">
              {selected.type === 'text' ? '텍스트' : '박스'} — {selected.id}
            </p>

            {selected.type === 'text' && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">텍스트</Label>
                  <Input
                    value={selected.text ?? ''}
                    onChange={(e) => updateSelected({ text: e.target.value.slice(0, 20) })}
                    placeholder="텍스트 입력"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">폰트</Label>
                    <Select value={selected.fontFamily ?? 'Noto Sans KR'} onValueChange={(v) => updateSelected({ fontFamily: v ?? 'Noto Sans KR' })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONTS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">크기</Label>
                    <Input type="number" className="h-8 text-xs" value={selected.fontSize ?? 48}
                      onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} min={12} max={72} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">색상</Label>
                    <input type="color" value={selected.color ?? '#ffffff'}
                      onChange={(e) => updateSelected({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                  </div>
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="checkbox" checked={selected.bold ?? false} onChange={(e) => updateSelected({ bold: e.target.checked })} />굵게
                  </label>
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="checkbox" checked={selected.shadow ?? false} onChange={(e) => updateSelected({ shadow: e.target.checked })} />그림자
                  </label>
                </div>
              </>
            )}

            {selected.type === 'box' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">배경색</Label>
                    <input type="color" value={selected.bgColor ?? '#000000'}
                      onChange={(e) => updateSelected({ bgColor: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">투명도 %</Label>
                    <Input type="number" className="h-8 text-xs" value={selected.bgOpacity ?? 40}
                      onChange={(e) => updateSelected({ bgOpacity: Number(e.target.value) })} min={0} max={100} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">둥근 모서리</Label>
                  <Input type="number" className="h-8 text-xs" value={selected.borderRadius ?? 0}
                    onChange={(e) => updateSelected({ borderRadius: Number(e.target.value) })} min={0} max={50} />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">X 위치</Label>
                <Input type="number" className="h-8 text-xs" value={Math.round(selected.x)}
                  onChange={(e) => updateSelected({ x: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y 위치</Label>
                <Input type="number" className="h-8 text-xs" value={Math.round(selected.y)}
                  onChange={(e) => updateSelected({ y: Number(e.target.value) })} />
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 py-4">캔버스에서 항목을 클릭하세요</p>
        )}

        <div className="flex gap-2 pt-3 border-t">
          <Button size="sm" onClick={handleSave} className="flex-1">저장</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>취소</Button>
        </div>
      </div>
    </div>
  )
}
