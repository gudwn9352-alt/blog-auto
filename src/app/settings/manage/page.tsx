'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/layout/PageHeader'

interface ManageItem {
  id: number
  label: string
  count?: number
  link?: string
  description: string
}

const manageItems: ManageItem[] = [
  { id: 1, label: '원고 카테고리', count: 6, description: '보험, 건강, 재테크 등 원고의 대분류 카테고리' },
  { id: 2, label: '원고 타입', count: 8, description: '정보형, 후기형, 비교형 등 원고 작성 유형' },
  { id: 3, label: '소재 카테고리', count: 12, description: '실손보험, 암보험, 연금 등 소재 분류' },
  { id: 4, label: '소구 포인트', count: 10, description: '절약, 안심, 혜택 등 독자 설득 포인트' },
  { id: 5, label: '제목 구조/말투/훅킹', count: 15, description: '제목 템플릿, 말투 스타일, 훅킹 문구 패턴' },
  { id: 6, label: '주체자 슬롯 옵션', count: 5, description: '나, 친구, 부모님 등 원고 주체자 설정' },
  { id: 7, label: '인지경로', count: 7, description: '블로그, SNS, 지인소개 등 서비스 인지 경로' },
  { id: 8, label: '타인 호칭 풀', count: 8, description: '언니, 선배, 이웃 등 타인 호칭 옵션' },
  { id: 9, label: '인용구 종류', count: 6, description: '속담, 명언, 통계 등 인용구 유형' },
  { id: 10, label: '페르소나 변수', count: 9, description: '나이, 직업, 상황 등 페르소나 구성 변수' },
  { id: 11, label: '브랜드 설정', link: '/settings/brand', description: '브랜드 정보, 톤, 이미지 스타일 관리' },
  { id: 12, label: '오픈/비밀 금지사항', link: '/settings/rules', description: '원고 작성 시 금지 표현 및 규칙 관리' },
  { id: 13, label: '팩트 룰', link: '/settings/fact-rules', description: '사실 검증 규칙 및 팩트 체크 기준 관리' },
  { id: 14, label: '의료소재 금지/주의/검증 리스트', count: 20, description: '의료 관련 소재의 사용 가능 여부 및 주의사항' },
  { id: 15, label: '이미지 타입', count: 4, description: '실사, 일러스트, 카드뉴스 등 이미지 유형' },
  { id: 16, label: '배치 비율', count: 3, description: '텍스트 대비 이미지 배치 비율 설정' },
  { id: 17, label: '글자수 범위', count: 4, description: '원고 유형별 최소/최대 글자수 범위' },
  { id: 18, label: '반려 피드백 목록', link: '/settings/feedback', description: '반려 로그 및 피드백 적용 현황 관리' },
]

export default function ManageSettingsPage() {
  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="관리 항목"
        description="더바다 시스템의 18개 관리 가능 항목을 확인하고 설정합니다"
        backHref="/settings/brand"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {manageItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-normal shrink-0">
                    {item.id}
                  </Badge>
                  {item.label}
                </CardTitle>
                {item.count !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {item.count}개 설정됨
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-500 mb-3">{item.description}</p>
              <Separator className="mb-3" />
              {item.link ? (
                <Link href={item.link}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    설정 페이지로 이동
                  </Button>
                </Link>
              ) : (
                <p className="text-xs text-gray-400 text-center py-1">
                  이 항목을 수정하려면 클로드와 채팅하세요
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
