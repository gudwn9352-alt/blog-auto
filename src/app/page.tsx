'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/lib/firebase/collections'
import { useBrandStore } from '@/stores/brandStore'
import type { Brand } from '@/types/manuscript'

export default function BrandSelectPage() {
  const router = useRouter()
  const { selectedBrand, selectBrand } = useBrandStore()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  // 로고 업로드/수정
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoTargetId, setLogoTargetId] = useState<string | null>(null)

  // 브랜드 추가 다이얼로그
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', serviceDescription: '', tone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedBrand) {
      router.replace('/dashboard')
      return
    }
    loadBrands()
  }, [selectedBrand, router])

  async function loadBrands() {
    setLoading(true)
    try {
      const data = await getBrands()
      setBrands(data)
    } catch { /* */ }
    setLoading(false)
  }

  function handleSelect(brand: Brand) {
    selectBrand(brand)
    router.push('/dashboard')
  }

  // ── 로고 업로드 ──
  function handleLogoClick(e: React.MouseEvent, brandId: string) {
    e.stopPropagation()
    setLogoTargetId(brandId)
    fileInputRef.current?.click()
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !logoTargetId) return

    if (file.size > 500_000) {
      toast.error('로고 파일은 500KB 이하만 가능합니다')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      try {
        await updateBrand(logoTargetId, { logoUrl: dataUrl })
        toast.success('로고가 업로드되었습니다')
        await loadBrands()
      } catch {
        toast.error('로고 업로드 실패')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
    setLogoTargetId(null)
  }

  async function handleLogoDelete(e: React.MouseEvent, brandId: string) {
    e.stopPropagation()
    if (!confirm('로고를 삭제하시겠습니까?')) return
    try {
      await updateBrand(brandId, { logoUrl: '' })
      toast.success('로고가 삭제되었습니다')
      await loadBrands()
    } catch {
      toast.error('로고 삭제 실패')
    }
  }

  // ── 브랜드 추가 ──
  async function handleAddBrand() {
    if (!addForm.name.trim()) { toast.error('브랜드명을 입력하세요'); return }
    if (!addForm.serviceDescription.trim()) { toast.error('서비스 설명을 입력하세요'); return }

    setSaving(true)
    try {
      await createBrand({
        name: addForm.name,
        serviceDescription: addForm.serviceDescription,
        tone: addForm.tone,
      })
      toast.success('브랜드가 추가되었습니다')
      alert('현재 원고 유형/소재/검수 규칙은 보험 업종(더바다) 기준으로 세팅되어 있습니다.\n\n새 브랜드의 업종에 맞는 원고 유형, 소재 카테고리, 검수 규칙 등을 변경 또는 추가해야 합니다.\n\n클로드와 채팅으로 진행해주세요.')
      setShowAdd(false)
      setAddForm({ name: '', serviceDescription: '', tone: '' })
      await loadBrands()
    } catch {
      toast.error('브랜드 추가 실패')
    } finally {
      setSaving(false)
    }
  }

  if (selectedBrand) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold mb-4 shadow-lg">B</div>
          <h1 className="text-3xl font-bold gradient-text">원고 생성 시스템</h1>
          <p className="text-gray-400 mt-2 text-sm">브랜드를 선택하여 시작하세요</p>
        </div>

        {/* 숨겨진 파일 인풋 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoChange}
        />

        {loading ? (
          <p className="text-center text-gray-400">불러오는 중...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brands.map((brand) => (
                <Card
                  key={brand.id}
                  className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                  onClick={() => handleSelect(brand)}
                >
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-4">
                      {/* 로고 */}
                      <div className="shrink-0">
                        {brand.logoUrl ? (
                          <div className="relative group">
                            <img
                              src={brand.logoUrl}
                              alt={`${brand.name} 로고`}
                              className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => handleLogoClick(e, brand.id!)}
                                className="text-white text-xs bg-blue-500 px-1.5 py-0.5 rounded"
                              >변경</button>
                              <button
                                onClick={(e) => handleLogoDelete(e, brand.id!)}
                                className="text-white text-xs bg-red-500 px-1.5 py-0.5 rounded"
                              >삭제</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleLogoClick(e, brand.id!)}
                            className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
                          >
                            <span className="text-xl">+</span>
                          </button>
                        )}
                      </div>

                      {/* 브랜드 정보 */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900">{brand.name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                          {brand.serviceDescription || '서비스 설명 없음'}
                        </p>
                        {brand.tone && (
                          <p className="text-xs text-gray-400 mt-1">톤: {brand.tone}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* 브랜드 추가 카드 */}
              <Card
                className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all border-dashed"
                onClick={() => setShowAdd(true)}
              >
                <CardContent className="pt-5 pb-5 flex items-center justify-center min-h-[100px]">
                  <div className="text-center text-gray-400">
                    <span className="text-3xl block mb-1">+</span>
                    <span className="text-sm">새 브랜드 추가</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {brands.length === 0 && (
              <p className="text-center text-gray-400 mt-4 text-sm">등록된 브랜드가 없습니다. 새 브랜드를 추가하세요.</p>
            )}
          </>
        )}

        {/* 브랜드 추가 다이얼로그 */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 브랜드 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>브랜드명 *</Label>
                <Input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="예: 더바다"
                />
              </div>
              <div className="space-y-1.5">
                <Label>서비스 설명 *</Label>
                <Textarea
                  value={addForm.serviceDescription}
                  onChange={(e) => setAddForm({ ...addForm, serviceDescription: e.target.value })}
                  placeholder="예: 보험금 조회 및 청구 대행 서비스"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>기본 톤</Label>
                <Input
                  value={addForm.tone}
                  onChange={(e) => setAddForm({ ...addForm, tone: e.target.value })}
                  placeholder="예: 친근하고 신뢰감 있는"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>취소</Button>
              <Button onClick={handleAddBrand} disabled={saving}>
                {saving ? '추가 중...' : '브랜드 추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
