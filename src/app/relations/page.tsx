'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/layout/PageHeader'

// 4개 역할 정의
const roles = [
  {
    name: '브랜드 (CEO)',
    color: 'bg-amber-50 border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: '전체 브랜드 방향과 톤을 결정하는 최고 의사결정자',
    knows: [
      '브랜드 아이덴티티 및 톤',
      '서비스 설명 및 타겟 독자',
      '금지사항 및 팩트 룰',
      '이미지 스타일 가이드',
    ],
    doesNotKnow: [
      '개별 원고의 구체적 내용',
      '검수 세부 결과',
      '이미지 생성 프롬프트 상세',
    ],
    connections: '원고생성, 원고검수, 이미지생성 모두에게 브랜드 가이드라인을 제공',
  },
  {
    name: '원고생성 (계약직)',
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: '브랜드 가이드에 따라 원고 초안을 작성하는 역할',
    knows: [
      '브랜드 가이드라인',
      '원고 카테고리 및 타입',
      '소재, 소구 포인트, 제목 구조',
      '페르소나 변수, 인지경로',
    ],
    doesNotKnow: [
      '검수 기준의 세부 가중치',
      '이미지 생성 방법',
      '다른 원고의 반려 이력',
    ],
    connections: '브랜드로부터 가이드 수신 -> 원고 초안 작성 -> 원고검수에게 전달',
  },
  {
    name: '원고검수 (과장)',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-800',
    description: '작성된 원고를 팩트 룰과 금지사항 기준으로 검수하는 역할',
    knows: [
      '브랜드 금지사항 (오픈/비밀)',
      '팩트 룰 전체',
      '의료소재 금지/주의/검증 리스트',
      '반려 피드백 이력',
    ],
    doesNotKnow: [
      '원고 생성 프롬프트 상세',
      '이미지 스타일 가이드 상세',
      '소구 포인트 선택 로직',
    ],
    connections: '원고생성으로부터 초안 수신 -> 검수 -> 통과 시 이미지생성으로 전달 / 반려 시 피드백 반환',
  },
  {
    name: '이미지생성 (정규직)',
    color: 'bg-purple-50 border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-800',
    description: '검수 통과된 원고에 맞는 이미지를 생성하는 역할',
    knows: [
      '브랜드 이미지 스타일 가이드',
      '이미지 타입 및 배치 비율',
      '원고 본문 컨텍스트',
      '글자수 범위 기준',
    ],
    doesNotKnow: [
      '검수 규칙 상세',
      '원고 생성 시 사용된 페르소나',
      '브랜드 금지사항 상세',
    ],
    connections: '원고검수로부터 통과된 원고 수신 -> 이미지 생성 -> 최종 원고 완성',
  },
]

// 레이어 구조
const layers = [
  {
    id: 1,
    name: '레이어 1: 입력',
    description: '사용자 입력 및 브랜드 설정을 수집하는 단계',
    items: ['브랜드 설정', '원고 유형 선택', '소재 선택', '페르소나 구성'],
  },
  {
    id: 2,
    name: '레이어 2: 소재 조합',
    description: '입력된 정보를 기반으로 소재를 조합하는 단계',
    items: ['소구 포인트 매칭', '제목 구조 선택', '주체자/인지경로 결정', '인용구 선택'],
  },
  {
    id: 3,
    name: '레이어 3: 원고 생성',
    description: '조합된 소재로 원고 초안을 작성하는 단계',
    items: ['프롬프트 조립', 'LLM 원고 생성', '글자수 범위 확인', '구조 검증'],
  },
  {
    id: 4,
    name: '레이어 4: 1차 검수',
    description: '자동화된 규칙 기반 1차 검수 단계',
    items: ['팩트 룰 체크', '금지사항 필터링', '의료소재 검증', '형식 검증'],
  },
  {
    id: 5,
    name: '레이어 5: 2차 검수',
    description: 'LLM 기반 의미론적 2차 검수 단계',
    items: ['맥락 일관성 검사', '톤 적절성 평가', '소구력 평가', '자연스러움 검증'],
  },
  {
    id: 6,
    name: '레이어 6: 출력',
    description: '이미지 생성 및 최종 원고 출력 단계',
    items: ['이미지 프롬프트 생성', '이미지 생성', '배치 적용', '최종 원고 완성'],
  },
]

// 데이터 흐름 STEP
const steps = [
  { step: 0, label: '설정 로드', description: '브랜드, 금지사항, 팩트 룰 등 시스템 설정 로드' },
  { step: 1, label: '입력 수집', description: '원고 유형, 소재, 페르소나 등 생성 파라미터 수집' },
  { step: 2, label: '소재 조합', description: '소구 포인트, 제목, 인용구 등 소재 요소 조합' },
  { step: 3, label: '프롬프트 조립', description: '최종 LLM 프롬프트 조립 및 토큰 최적화' },
  { step: 4, label: '원고 생성', description: 'LLM을 통한 원고 초안 생성' },
  { step: 5, label: 'STEP1 검수', description: '규칙 기반 자동 검수 (팩트 룰, 금지사항)' },
  { step: 6, label: '반려/재생성', description: '검수 실패 시 피드백 반영 후 재생성 (최대 3회)' },
  { step: 7, label: 'STEP2 검수', description: 'LLM 기반 의미론적 검수 (톤, 맥락, 자연스러움)' },
  { step: 8, label: '이미지 생성', description: '검수 통과된 원고에 맞는 이미지 생성' },
  { step: 9, label: '최종 출력', description: '원고 + 이미지 결합, 최종 결과물 저장' },
]

export default function RelationsPage() {
  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="관계성 보기"
        description="시스템 역할, 레이어 구조, 데이터 흐름을 카드 형태로 확인합니다"
        backHref="/dashboard"
      />

      {/* 역할 카드 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">역할 관계</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Card key={role.name} className={`border-2 ${role.color}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge className={`${role.badgeColor} border-0`}>{role.name}</Badge>
                </CardTitle>
                <p className="text-xs text-gray-600">{role.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">아는 것</p>
                  <div className="flex flex-wrap gap-1">
                    {role.knows.map((item) => (
                      <Badge key={item} variant="outline" className="text-xs font-normal">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">모르는 것</p>
                  <div className="flex flex-wrap gap-1">
                    {role.doesNotKnow.map((item) => (
                      <Badge key={item} variant="outline" className="text-xs font-normal text-gray-400">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <p className="text-xs text-gray-500">{role.connections}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 레이어 구조 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">레이어 구조</h2>
        <div className="space-y-3">
          {layers.map((layer, idx) => (
            <div key={layer.id}>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">
                      L{layer.id}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{layer.name}</p>
                      <p className="text-xs text-gray-500 mb-2">{layer.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {layer.items.map((item) => (
                          <Badge key={item} variant="outline" className="text-xs font-normal">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {idx < layers.length - 1 && (
                <div className="flex justify-center py-1">
                  <span className="text-gray-300 text-lg">&#8595;</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 데이터 흐름 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">데이터 흐름 (STEP 0-9)</h2>
        <div className="space-y-2">
          {steps.map((s, idx) => (
            <div key={s.step}>
              <Card>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {s.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {idx < steps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <span className="text-gray-300 text-sm">&#8595;</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
