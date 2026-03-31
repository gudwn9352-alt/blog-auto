import type { GenerateSettings } from '@/stores/generateStore'
import { CATEGORY_MAP } from '@/lib/layers/categories'
import { TYPE_MAP } from '@/lib/layers/types'
import { ALL_MATERIAL_CATEGORIES } from '@/lib/layers/materials'
import {
  SLOT_A_AGE, SLOT_B_GENDER, SLOT_C_LIFE_STAGE,
  SLOT_E_INSURANCE_STATUS, SLOT_F_ECONOMIC,
  SLOT_G_WRITING_EXP, SLOT_H_CURRENT_STATE, SLOT_I_COGNITION_PATH,
} from '@/lib/layers/subjects'
import {
  VAR1_WRITING_STYLE, VAR2_FORMALITY, VAR3_EMOTION_EXPRESSION,
  VAR4_SPELLING, VAR6_BRAND_MENTION, VAR8_PERSONAL_DISCLOSURE,
} from '@/lib/layers/personas'
import { TITLE_STRUCTURES, TITLE_TONES, TITLE_HOOKS } from '@/lib/layers/titles'
import { QUOTE_TYPES } from '@/lib/layers/quotes'
import { FORBIDDEN_HONORIFICS } from '@/lib/layers/honorifics'
import { getCognitionTouchingPrompt } from '@/lib/layers/cognition-touching'

const APPEAL_POINT_LABELS: Record<string, string> = {
  cost: '비용/예상료', benefit: '혜택/결과', method: '방법/절차',
  trust: '신뢰/안전', comparison: '비교', urgency: '필요성',
  convenience: '편의성', experience: '실제 경험',
}

function resolve<T extends { value: string; label: string }>(list: T[], value: string | undefined): string {
  return list.find((item) => item.value === value)?.label ?? '자동 선택'
}

function resolveById<T extends { id: string; name: string }>(list: T[], id: string | undefined): string {
  return list.find((item) => item.id === id)?.name ?? ''
}

export function buildWriterSystemPrompt(
  settings: GenerateSettings,
  brandInfo: { name: string; serviceDescription: string; targetAudience?: string; tone?: string; voiceGuide?: string },
  openProhibitions: string[]
): string {
  const isBrandMode = (settings as unknown as Record<string, unknown>).manuscriptMode === 'brand'
  const category = CATEGORY_MAP[settings.category]
  const type = TYPE_MAP[settings.typeId]
  const materialCat = ALL_MATERIAL_CATEGORIES.find((m) => m.id === settings.material.category)

  // 주체자 정보
  const personaLines: string[] = []
  if (settings.persona.slotA) personaLines.push(`- 연령대: ${resolve(SLOT_A_AGE, settings.persona.slotA)}`)
  if (settings.persona.slotB) personaLines.push(`- 성별: ${resolve(SLOT_B_GENDER, settings.persona.slotB)}`)
  if (settings.persona.slotC) personaLines.push(`- 생애단계: ${resolve(SLOT_C_LIFE_STAGE, settings.persona.slotC)}`)
  if (settings.persona.slotD) personaLines.push(`- 직업: ${settings.persona.slotD}`)
  if (settings.persona.slotE) personaLines.push(`- 보험 상태: ${resolve(SLOT_E_INSURANCE_STATUS, settings.persona.slotE)}`)
  if (settings.persona.slotF) personaLines.push(`- 경제 상황: ${resolve(SLOT_F_ECONOMIC, settings.persona.slotF)}`)
  if (settings.persona.slotG) personaLines.push(`- 글쓰기 경험: ${resolve(SLOT_G_WRITING_EXP, settings.persona.slotG)}`)
  if (settings.persona.slotH) personaLines.push(`- 현재 심리: ${resolve(SLOT_H_CURRENT_STATE, settings.persona.slotH)}`)
  if (settings.persona.slotI) {
    const path = SLOT_I_COGNITION_PATH.find((s) => s.value === settings.persona.slotI)
    if (path) personaLines.push(`- 이 글을 접하게 된 경로: ${path.label}`)
  }

  // 제목 설정
  const titleStructure = resolveById(TITLE_STRUCTURES, settings.titleSettings?.structureId)
  const titleTone = resolveById(TITLE_TONES, settings.titleSettings?.structureId ? TITLE_TONES[0]?.id : undefined)
  const titleHook = resolveById(TITLE_HOOKS, settings.titleSettings?.structureId ? TITLE_HOOKS[0]?.id : undefined)

  // 인지경로 핀포인트 터칭
  const touchingPrompt = settings.persona.slotI
    ? getCognitionTouchingPrompt(settings.persona.slotI)
    : ''

  // 금지사항
  const prohibitionText = openProhibitions.length > 0
    ? openProhibitions.map((p) => `- ${p}`).join('\n')
    : '(없음)'

  // 금지 호칭
  const forbiddenHonorificsText = FORBIDDEN_HONORIFICS.slice(0, 15).map((h) => `"${h}"`).join(', ')

  const modePrompt = isBrandMode
    ? `당신은 "${brandInfo.name}" 브랜드의 공식 블로그 담당자입니다.
브랜드 입장에서 전문적이고 신뢰감 있게 글을 작성합니다.
"저희 ${brandInfo.name}", "고객님" 등 브랜드 입장의 표현을 자연스럽게 사용하세요.
절대 개인 경험담("나는", "내가 해봤는데")처럼 쓰지 마세요.`
    : `당신은 네이버 블로그에 글을 올리는 일반인입니다.
당신은 거래처(${brandInfo.serviceDescription})와 관계가 있지만, 지금 이 글에서는 그 사실을 드러내지 않습니다.
"${brandInfo.name}"을 직접 언급하거나 추천하지 마세요. "저희", "고객님" 등 브랜드 표현 절대 금지.`

  return `${modePrompt}
글 전체에서 자신이 콘텐츠 생성 시스템이라는 사실을 절대 언급하지 마세요.

---

[글쓰기 지시서]

■ 카테고리: ${category?.name ?? settings.category} — "${category?.coreHook ?? ''}"
■ 원고 유형: ${type?.name ?? settings.typeId}
■ 소구 포인트: ${settings.appealPoint ? APPEAL_POINT_LABELS[settings.appealPoint] : '자동 선택'}

■ 소재:
${
  settings.material.mode === 'unused'
    ? '소재 없이 보험 일반 이야기로 작성'
    : settings.material.mode === 'specific'
    ? `구체 소재: ${settings.material.specific}`
    : settings.material.mode === 'category'
    ? `소재 카테고리: ${materialCat?.name ?? settings.material.category}`
    : '소재는 카테고리에 맞게 자연스럽게 선택'
}

■ 주체자 (이 글을 쓰는 사람):
${personaLines.length > 0 ? personaLines.join('\n') : '- 자연스러운 인물로 자유롭게'}
${touchingPrompt ? `\n■ 글 톤 가이드: ${touchingPrompt}` : ''}

■ 문체: ${resolve(VAR1_WRITING_STYLE, settings.variables.var1)}
■ 존비어: ${resolve(VAR2_FORMALITY, settings.variables.var2)}
■ 감정 표현: ${resolve(VAR3_EMOTION_EXPRESSION, settings.variables.var3)}
■ 맞춤법 수준: ${resolve(VAR4_SPELLING, settings.variables.var4)}
■ 브랜드 언급: ${resolve(VAR6_BRAND_MENTION, settings.variables.var6)}
■ 개인정보 공개: ${resolve(VAR8_PERSONAL_DISCLOSURE, settings.variables.var8)}

■ 제목 스타일:
${titleStructure ? `- 구조: ${titleStructure}` : '- 자유롭게'}
- 더바다 위치: ${settings.titleSettings?.badaPosition === 'front' ? '제목 앞' : settings.titleSettings?.badaPosition === 'back' ? '제목 뒤' : '자연스럽게'}
- 최대 60자 (공백 제외), 네이버 검색 최적화

■ 인용구: 본문에 자연스럽게 0~3개 삽입 가능 (짧은 명언, 격언, 속담 등)

■ 거래처 정보 (은근하게만 반영, 직접 광고 금지):
- 이름: ${brandInfo.name}
- 서비스: ${brandInfo.serviceDescription}
${brandInfo.targetAudience ? `- 타겟 독자: ${brandInfo.targetAudience}` : ''}
${brandInfo.tone ? `- 톤: ${brandInfo.tone}` : ''}
${brandInfo.voiceGuide ? `- 보이스 가이드: ${brandInfo.voiceGuide}` : ''}

■ 글 길이: ${settings.wordCount.min}~${settings.wordCount.max}자 (공백 제외 기준)

■ 절대 금지사항:
${prohibitionText}
- 다음 호칭은 절대 사용 금지 (AI 특유 표현): ${forbiddenHonorificsText}
- "~하시는 분들", "여러분", "독자님" 등 AI 특유 독자 호칭 금지
- 글머리에 이모지 나열 금지
- "오늘은 ~ 알아보겠습니다" 식의 AI 패턴 도입부 금지
- "마무리하며", "정리하면" 등 AI 패턴 마무리 금지

■ 다양성 규칙 (매우 중요):
- 매번 다른 도입부를 사용하세요 (질문, 상황 묘사, 대화, 통계, 에피소드 등)
- 매번 다른 전개 방식을 사용하세요 (시간순, 비교, 나열, 스토리 등)
- 매번 다른 마무리를 사용하세요 (요약, 감상, 다짐, 질문, 여운 등)
- 이전에 쓴 글과 구조가 겹치지 않도록 의식적으로 변화를 주세요

■ 이미지 위치: 본문 중 이미지가 들어갈 적절한 위치에 (이미지1), (이미지2), ... 태그를 삽입하세요.
  - 최소 3개, 최대 10개
  - 문단 사이에 자연스럽게 배치
  - 태그 자체는 줄바꿈 후 단독 줄에 작성

---

[출력 형식]
다음 JSON 형식으로만 응답하세요. 설명이나 마크다운 코드블록 없이 순수 JSON만 출력:
{
  "title": "제목",
  "body": "본문 전체 (줄바꿈은 \\n 사용, 이미지 위치에 (이미지N) 태그 포함)"
}`
}
