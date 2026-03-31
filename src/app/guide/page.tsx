'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Separator } from '@/components/ui/separator'

const steps = [
  {
    num: 1,
    title: '브랜드 등록',
    desc: '처음 들어오면 브랜드를 선택하는 화면이 나와요.',
    detail: '"+ 새 브랜드 추가" 를 눌러서 브랜드 이름과 서비스 설명을 입력하면 끝!',
    tip: '로고도 넣을 수 있어요. 클릭해서 이미지 파일을 선택하세요.',
  },
  {
    num: 2,
    title: '브랜드 선택',
    desc: '등록한 브랜드 카드를 클릭하면 그 브랜드 전용 화면으로 들어가요.',
    detail: '브랜드마다 원고/설정이 따로 관리돼요. 왼쪽 상단에서 언제든 브랜드를 변경할 수 있어요.',
  },
  {
    num: 3,
    title: '원고 생성',
    desc: '왼쪽 메뉴에서 "원고 생성"을 눌러요.',
    detail: '카테고리, 소재, 글자수를 선택하고 "원고 생성 시작" 버튼을 누르면 AI가 원고를 만들어요.',
    tip: '"랜덤"을 선택하면 시스템이 알아서 다양하게 조합해줘요. 한 번에 최대 100개까지 생성 가능!',
  },
  {
    num: 4,
    title: '자동 검수',
    desc: '만들어진 원고는 자동으로 검수를 거쳐요.',
    detail: 'STEP 1 (글자수, 금지 표현 체크) → STEP 2 (AI가 자연스러운지 확인). 문제가 있으면 자동으로 다시 만들어요 (최대 2번).',
  },
  {
    num: 5,
    title: '원고 확인',
    desc: '"원고 목록"에서 생성된 원고를 확인해요.',
    detail: '승인된 원고는 바로 사용 가능. "확인 필요" 원고는 직접 보고 승인/반려를 결정해주세요.',
    tip: '"수정" 버튼으로 원고 내용을 직접 고칠 수도 있어요.',
  },
  {
    num: 6,
    title: '이미지 만들기',
    desc: '승인된 원고에서 이미지를 만들 수 있어요.',
    detail: '이미지 수(7~15장)를 선택하면 AI가 프롬프트를 만들고, 이미지를 생성해요. 생성된 이미지에 텍스트를 넣거나 박스를 추가할 수도 있어요.',
  },
  {
    num: 7,
    title: '다운로드',
    desc: '원고를 .docx 파일로 다운로드하거나, 여러 원고를 ZIP으로 한 번에 받을 수 있어요.',
    detail: '원고 상세 페이지에서 "다운로드" 버튼, 원고 목록에서 "일괄 다운로드" 버튼을 이용하세요.',
  },
]

const settingsGuide = [
  { title: '검수 규칙', desc: '원고에 포함되면 안 되는 표현을 등록해요. 한 줄에 하나씩 입력하면 돼요.' },
  { title: '팩트 룰', desc: '특정 키워드가 나오면 어떤 표현은 허용하고, 어떤 표현은 금지할지 정하는 규칙이에요.' },
  { title: '반려 피드백', desc: '검수에서 반려된 이유를 모아볼 수 있어요. 어떤 문제가 자주 생기는지 파악할 수 있어요.' },
  { title: '전체 관리', desc: '시스템에 설정된 카테고리, 소재, 주체자 등 모든 항목을 한눈에 볼 수 있어요.' },
]

export default function GuidePage() {
  return (
    <div className="p-6 max-w-3xl">
      <PageHeader title="이용 방법" description="처음 사용하시나요? 여기서 확인하세요" backHref="/dashboard" />

      {/* 메인 플로우 */}
      <div className="space-y-4 mb-8">
        {steps.map((step) => (
          <Card key={step.num} className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center">
                  {step.num}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{step.desc}</p>
                  <p className="text-sm text-gray-500 mt-1">{step.detail}</p>
                  {step.tip && (
                    <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg mt-2 inline-block">
                      TIP: {step.tip}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      {/* 설정 가이드 */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">설정 메뉴 안내</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {settingsGuide.map((item) => (
          <Card key={item.title} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <h4 className="font-semibold text-sm text-gray-800">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      {/* FAQ */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
      <div className="space-y-3">
        {[
          { q: '원고를 한 번에 몇 개까지 만들 수 있나요?', a: '최대 100개까지 한 번에 생성할 수 있어요. 10개 정도부터 시작하는 걸 추천해요.' },
          { q: '생성된 원고가 다 비슷하지 않나요?', a: '아니요! 시스템이 자동으로 주체자(나이/성별/직업), 문체, 소재 등을 전부 다르게 조합해요. 100개를 만들어도 각각 다른 사람이 쓴 것처럼 나와요.' },
          { q: '글자수는 어떻게 세나요?', a: '공백을 제외한 글자수에요. "길게"를 선택하면 1500~2500자 사이로 만들어져요.' },
          { q: '이미지는 어떻게 만들어지나요?', a: 'AI가 배경 이미지를 만들고, 에디터에서 텍스트나 박스를 올려서 카드뉴스처럼 완성할 수 있어요.' },
          { q: '다른 업종 브랜드도 사용할 수 있나요?', a: '네! 새 브랜드를 추가하면 돼요. 다만 현재 원고 유형은 보험 업종 기준이라, 다른 업종은 Claude와 채팅으로 유형을 맞춰야 해요.' },
        ].map((faq, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <p className="font-semibold text-sm text-gray-800">{faq.q}</p>
              <p className="text-xs text-gray-500 mt-1">{faq.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
