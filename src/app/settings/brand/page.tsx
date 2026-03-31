'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/lib/firebase/collections'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Brand } from '@/types/manuscript'

const brandSchema = z.object({
  name: z.string().min(1, '브랜드명을 입력하세요'),
  serviceDescription: z.string().min(1, '서비스 설명을 입력하세요'),
  targetAudience: z.string().optional(),
  tone: z.string().optional(),
  contactInfo: z.string().optional(),
  voiceGuide: z.string().optional(),
  imageStyleGuide: z.string().optional(),
  gdriveBrandFolder: z.string().optional(),
  gdriveThirdPartyFolder: z.string().optional(),
})

type BrandForm = z.infer<typeof brandSchema>

export default function BrandSettingsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const form = useForm<BrandForm>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
      serviceDescription: '',
      targetAudience: '',
      tone: '',
      contactInfo: '',
      voiceGuide: '',
      imageStyleGuide: '',
      gdriveBrandFolder: '바이럴/1.브랜드 원고 미사용',
      gdriveThirdPartyFolder: '바이럴/3.제3자 원고 미사용',
    },
  })

  useEffect(() => {
    loadBrands()
  }, [])

  async function loadBrands() {
    setFetching(true)
    try {
      const data = await getBrands()
      setBrands(data)
      if (data.length > 0 && !selectedId) {
        selectBrand(data[0])
      }
    } catch {
      toast.error('브랜드 목록을 불러오지 못했습니다')
    } finally {
      setFetching(false)
    }
  }

  function selectBrand(brand: Brand) {
    setSelectedId(brand.id ?? null)
    form.reset({
      name: brand.name,
      serviceDescription: brand.serviceDescription ?? '',
      targetAudience: brand.targetAudience ?? '',
      tone: brand.tone ?? '',
      contactInfo: brand.contactInfo ?? '',
      voiceGuide: brand.voiceGuide ?? '',
      imageStyleGuide: brand.imageStyleGuide ?? '',
      gdriveBrandFolder: brand.gdriveBrandFolder ?? '바이럴/1.브랜드 원고 미사용',
      gdriveThirdPartyFolder: brand.gdriveThirdPartyFolder ?? '바이럴/3.제3자 원고 미사용',
    })
  }

  function newBrand() {
    setSelectedId(null)
    form.reset({
      name: '',
      serviceDescription: '',
      targetAudience: '',
      tone: '',
      contactInfo: '',
      voiceGuide: '',
      imageStyleGuide: '',
      gdriveBrandFolder: '바이럴/1.브랜드 원고 미사용',
      gdriveThirdPartyFolder: '바이럴/3.제3자 원고 미사용',
    })
  }

  async function onSubmit(values: BrandForm) {
    setLoading(true)
    try {
      const data: Omit<Brand, 'id'> = {
        name: values.name,
        serviceDescription: values.serviceDescription,
        targetAudience: values.targetAudience,
        tone: values.tone,
        contactInfo: values.contactInfo,
        voiceGuide: values.voiceGuide,
        imageStyleGuide: values.imageStyleGuide,
        gdriveBrandFolder: values.gdriveBrandFolder,
        gdriveThirdPartyFolder: values.gdriveThirdPartyFolder,
      }

      if (selectedId) {
        await updateBrand(selectedId, data)
        toast.success('브랜드가 수정되었습니다')
      } else {
        const id = await createBrand(data)
        setSelectedId(id)
        toast.success('브랜드가 생성되었습니다')
        alert('현재 원고 유형/소재/검수 규칙은 보험 업종(더바다) 기준으로 세팅되어 있습니다.\n\n새 브랜드의 업종에 맞는 원고 유형, 소재 카테고리, 검수 규칙 등을 변경 또는 추가해야 합니다.\n\n클로드와 채팅으로 진행해주세요.')
      }
      await loadBrands()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[브랜드 저장 오류]', e)
      if (msg.includes('PERMISSION_DENIED') || msg.includes('permission')) {
        toast.error('Firestore 보안규칙에서 쓰기가 거부됐습니다. Firebase 콘솔에서 테스트 모드로 변경하세요.')
      } else if (msg.includes('NOT_FOUND') || msg.includes('FAILED_PRECONDITION')) {
        toast.error('Firestore가 활성화되지 않았습니다. Firebase 콘솔에서 Firestore Database를 먼저 생성하세요.')
      } else {
        toast.error(`저장 실패: ${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm('브랜드를 삭제하시겠습니까?')) return
    try {
      await deleteBrand(selectedId)
      toast.success('브랜드가 삭제되었습니다')
      setSelectedId(null)
      form.reset()
      await loadBrands()
    } catch {
      toast.error('삭제에 실패했습니다')
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title="브랜드 설정" description="원고 생성에 사용할 브랜드 정보를 관리합니다" backHref="/dashboard" />

      <div className="flex gap-6">
        {/* 브랜드 목록 */}
        <div className="w-48 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">브랜드 목록</span>
            <Button size="sm" variant="outline" onClick={newBrand}>+</Button>
          </div>
          <div className="space-y-1">
            {fetching ? (
              <p className="text-xs text-gray-400 p-2">불러오는 중...</p>
            ) : brands.length === 0 ? (
              <p className="text-xs text-gray-400 p-2">브랜드가 없습니다</p>
            ) : (
              brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => selectBrand(b)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedId === b.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {b.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* 브랜드 폼 */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedId ? '브랜드 편집' : '새 브랜드'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">브랜드명 *</Label>
                <Input id="name" {...form.register('name')} placeholder="더바다" />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="serviceDescription">서비스 설명 *</Label>
                <Textarea
                  id="serviceDescription"
                  {...form.register('serviceDescription')}
                  placeholder="보험금/환급금 조회 및 청구 대행 서비스. 미청구 보험금을 찾아드리고 청구까지 대행합니다."
                  rows={3}
                />
                {form.formState.errors.serviceDescription && (
                  <p className="text-xs text-red-500">{form.formState.errors.serviceDescription.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetAudience">타겟 독자</Label>
                <Input
                  id="targetAudience"
                  {...form.register('targetAudience')}
                  placeholder="보험 가입자, 보험금 청구가 필요한 사람, 미청구 보험금이 궁금한 사람"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tone">기본 톤</Label>
                <Input
                  id="tone"
                  {...form.register('tone')}
                  placeholder="친근하고 신뢰감 있는, 전문적이지만 쉬운"
                />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="contactInfo">연락처 정보</Label>
                <Input
                  id="contactInfo"
                  {...form.register('contactInfo')}
                  placeholder="전화번호, 이메일, 카카오톡 채널 등"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="voiceGuide">브랜드 보이스 가이드</Label>
                <Textarea
                  id="voiceGuide"
                  {...form.register('voiceGuide')}
                  placeholder="브랜드의 말투, 글쓰기 방향, 강조하고 싶은 이미지 등을 자유롭게 작성..."
                  rows={4}
                />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="imageStyleGuide">이미지 스타일 가이드</Label>
                <Textarea
                  id="imageStyleGuide"
                  {...form.register('imageStyleGuide')}
                  placeholder={'전체 톤: 깔끔하고 따뜻한 느낌\n인물 이미지: 밝은 조명, 자연스러운 표정\n카드뉴스: 파란색 계열 배경, 흰색 텍스트\n일러스트: 플랫 스타일, 파스텔 톤'}
                  rows={5}
                />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="font-semibold">구글 드라이브 내보내기 경로</Label>
                <p className="text-xs text-gray-400">구글 드라이브에 이미 존재하는 폴더 경로를 입력하세요. 슬래시(/)로 구분합니다.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gdriveBrandFolder">브랜드 원고 저장 경로</Label>
                <Input
                  id="gdriveBrandFolder"
                  {...form.register('gdriveBrandFolder')}
                  placeholder="바이럴/1.브랜드 원고 미사용"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gdriveThirdPartyFolder">제3자 원고 저장 경로</Label>
                <Input
                  id="gdriveThirdPartyFolder"
                  {...form.register('gdriveThirdPartyFolder')}
                  placeholder="바이럴/3.제3자 원고 미사용"
                />
              </div>

              <div className="flex justify-between pt-2">
                {selectedId && (
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                    삭제
                  </Button>
                )}
                <Button type="submit" disabled={loading} className="ml-auto">
                  {loading ? '저장 중...' : selectedId ? '수정하기' : '생성하기'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
