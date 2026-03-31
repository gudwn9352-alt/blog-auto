import { NextResponse } from 'next/server'
import type { ReviewRecord } from '@/types/manuscript'

const MAX_BRAND_MENTIONS = 10
const MIN_BRAND_MENTIONS = 5
const TITLE_MAX_LENGTH = 60
const TITLE_MIN_LENGTH = 10

// 금지 호칭 (honorifics.ts에서 발췌)
const FORBIDDEN_HONORIFICS = [
  '직장 동료', '친한 친구', '배우자', '선배', '어머니', '아버지',
  '할머니', '할아버지', '삼촌', '이모', '고모', '큰아버지',
  '작은아버지', '사촌', '처남', '시누이', '형수', '제수씨',
  '올케', '동서', '사돈', '며느리',
]

function checkProhibitions(text: string, prohibitions: string[]): string[] {
  const issues: string[] = []
  for (const p of prohibitions) {
    const keywords = p.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
    for (const kw of keywords) {
      if (kw.length >= 2 && text.includes(kw)) {
        issues.push(`금지 키워드 감지: "${kw}" (규칙: ${p.substring(0, 30)}...)`)
        break
      }
    }
  }
  return issues
}

const STRICT_FORBIDDEN_PATTERNS = [
  { pattern: /보장됩니다|100%\s*보장|무조건\s*보장/g, msg: '보장 단정 표현 금지' },
  { pattern: /수익\s*보장|이익\s*보장/g, msg: '수익 보장 표현 금지' },
  { pattern: /최고|1위|업계\s*최초/g, msg: '최상급 표현 주의 (확인 필요)' },
]

function checkStrictForbidden(text: string): Array<{ type: string; detail: string }> {
  const issues: Array<{ type: string; detail: string }> = []
  for (const { pattern, msg } of STRICT_FORBIDDEN_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      issues.push({ type: 'strict_forbidden', detail: `${msg} — 발견: "${matches[0]}"` })
    }
  }
  return issues
}

// 금지 의료 소재
const BLOCKED_MEDICAL = ['자살', '자해', '자살방법', '자해방법', '안락사']
const CAUTION_MEDICAL = ['암 완치', '말기암', '임상시험', '줄기세포', '유전자치료']

interface ReviewRequest {
  title: string
  body: string
  brandName: string
  openProhibitions: string[]
  wordCountMin: number
  wordCountMax: number
  manuscriptMode?: 'brand' | 'thirdparty'
  existingTitles?: string[]
  factRules?: Array<{ keywords: string[]; blocked: string[]; rejectionMsg: string }>
}

export async function POST(req: Request) {
  try {
    const { title, body, brandName, openProhibitions, wordCountMin, wordCountMax, manuscriptMode, existingTitles, factRules }: ReviewRequest = await req.json()

    const fullText = `${title ?? ''}\n${body ?? ''}`
    const issues: Array<{ type: string; detail: string; location?: string }> = []

    // ═══ 1. 제목 검수 ═══

    // 1-1. 제목 글자수
    const titleNoSpace = title?.replace(/\s/g, '').length ?? 0
    if (title && titleNoSpace > TITLE_MAX_LENGTH) {
      issues.push({ type: 'title_length', detail: `제목이 너무 깁니다 (${titleNoSpace}자 / 최대 ${TITLE_MAX_LENGTH}자, 공백 제외)`, location: 'title' })
    }
    if (title && titleNoSpace < TITLE_MIN_LENGTH) {
      issues.push({ type: 'title_length', detail: `제목이 너무 짧습니다 (${titleNoSpace}자 / 최소 ${TITLE_MIN_LENGTH}자, 공백 제외)`, location: 'title' })
    }

    // 1-2. 제목 브랜드명 (최소 1번, 최대 2번)
    if (brandName && title) {
      const brandCount = (title.match(new RegExp(brandName, 'g')) ?? []).length
      if (brandCount === 0) {
        issues.push({ type: 'title_brand', detail: `제목에 브랜드명 "${brandName}"이 없습니다 (최소 1번 필요)`, location: 'title' })
      }
      if (brandCount > 2) {
        issues.push({ type: 'title_brand', detail: `제목에 브랜드명 "${brandName}"이 ${brandCount}번 — 최대 2번까지`, location: 'title' })
      }
    }

    // 1-3. 제목 중복 체크
    if (existingTitles && title) {
      for (const existing of existingTitles) {
        if (existing === title) {
          issues.push({ type: 'title_duplicate', detail: `기존 원고와 제목이 동일합니다: "${title}"`, location: 'title' })
          break
        }
      }
    }

    // ═══ 2. 브랜드 언급 횟수 (본문) ═══
    if (brandName) {
      const mentionCount = (fullText.match(new RegExp(brandName, 'g')) ?? []).length
      if (mentionCount < MIN_BRAND_MENTIONS) {
        issues.push({ type: 'brand_mention_low', detail: `브랜드명 "${brandName}" 언급이 ${mentionCount}회 — 최소 ${MIN_BRAND_MENTIONS}번 필요` })
      }
      if (mentionCount > MAX_BRAND_MENTIONS) {
        issues.push({ type: 'brand_mention_excess', detail: `브랜드명 "${brandName}" 언급이 ${mentionCount}회로 과다합니다 (최대 ${MAX_BRAND_MENTIONS}회)` })
      }
    }

    // ═══ 3. 오픈 금지사항 키워드 ═══
    const prohibitionIssues = checkProhibitions(fullText, openProhibitions ?? [])
    for (const issue of prohibitionIssues) {
      issues.push({ type: 'prohibition', detail: issue })
    }

    // ═══ 4. 실행 금지 표현 ═══
    const strictIssues = checkStrictForbidden(fullText)
    issues.push(...strictIssues)

    // ═══ 5. AI 패턴 감지 ═══
    const aiPatterns = [
      { pattern: /오늘은.*알아보겠습니다/g, msg: 'AI 패턴 도입부: "오늘은 ~알아보겠습니다"' },
      { pattern: /마무리하며|정리하면|마치며/g, msg: 'AI 패턴 마무리: "마무리하며/정리하면"' },
      { pattern: /여러분[,!]|독자님|구독자님/g, msg: 'AI 패턴 호칭: "여러분/독자님"' },
      { pattern: /^(📌|✅|💡|🔥|⭐|📢|🎯|💰|🏥|📋).{0,5}/gm, msg: 'AI 패턴: 이모지 글머리' },
      { pattern: /이상으로.*마치겠습니다/g, msg: 'AI 패턴: "이상으로 마치겠습니다"' },
      { pattern: /참고하시[기면]/g, msg: 'AI 패턴: "참고하시기/참고하시면"' },
      { pattern: /~하시는\s*분들/g, msg: 'AI 패턴: "~하시는 분들"' },
      { pattern: /지금부터.*살펴보/g, msg: 'AI 패턴: "지금부터 살펴보겠습니다"' },
    ]
    for (const { pattern, msg } of aiPatterns) {
      if (pattern.test(body ?? '')) {
        issues.push({ type: 'ai_pattern', detail: msg })
      }
    }

    // ═══ 6. 금지 호칭 22개 체크 ═══
    for (const honorific of FORBIDDEN_HONORIFICS) {
      if (fullText.includes(honorific)) {
        issues.push({ type: 'forbidden_honorific', detail: `금지 호칭 사용: "${honorific}"` })
      }
    }

    // ═══ 7. 주체 일관성 체크 ═══
    if (manuscriptMode === 'thirdparty' && brandName) {
      const thirdPartyViolations = [
        { pattern: new RegExp(`저희\\s*${brandName}`, 'g'), msg: `제3자 원고에 "저희 ${brandName}" 사용` },
        { pattern: /고객님|고객분/g, msg: '제3자 원고에 브랜드 입장 표현 "고객님"' },
        { pattern: new RegExp(`${brandName}에서\\s*(도와|진행|안내)`, 'g'), msg: '제3자 원고에 브랜드 행위 주체 표현' },
      ]
      for (const { pattern, msg } of thirdPartyViolations) {
        if (pattern.test(fullText)) {
          issues.push({ type: 'mode_violation', detail: msg })
        }
      }
    }
    if (manuscriptMode === 'brand') {
      const brandViolations = [
        { pattern: /내가\s*(해봤|받아봤|경험)/g, msg: '브랜드 원고에 개인 경험 표현' },
        { pattern: /솔직히\s*(말하면|나는)/g, msg: '브랜드 원고에 개인 의견 표현' },
        { pattern: /나는|내\s*경험/g, msg: '브랜드 원고에 1인칭 개인 표현' },
      ]
      for (const { pattern, msg } of brandViolations) {
        if (pattern.test(fullText)) {
          issues.push({ type: 'mode_violation', detail: msg })
        }
      }
    }

    // ═══ 8. 포맷 검수 ═══
    const lines = (body ?? '').split('\n')
    const paragraphs = (body ?? '').split('\n\n').filter(Boolean)

    // 8-1. 문단 수 (최소 3개)
    if (paragraphs.length < 3) {
      issues.push({ type: 'format', detail: `문단이 ${paragraphs.length}개 — 최소 3개 (도입/전개/마무리)` })
    }

    // 8-2. 한 문단이 너무 긴 경우 (200자 이상 줄바꿈 없이)
    for (let i = 0; i < paragraphs.length; i++) {
      const pLen = paragraphs[i].replace(/\s/g, '').length
      if (pLen > 300) {
        issues.push({ type: 'format', detail: `${i + 1}번째 문단이 너무 깁니다 (${pLen}자) — 줄바꿈 필요` })
        break
      }
    }

    // ═══ 9. 팩트 룰 체크 ═══
    if (factRules && factRules.length > 0) {
      for (const rule of factRules) {
        const hasKeyword = rule.keywords.some((kw) => fullText.includes(kw))
        if (hasKeyword) {
          for (const blocked of rule.blocked) {
            if (fullText.includes(blocked)) {
              issues.push({ type: 'fact_rule', detail: `팩트 룰 위반: "${blocked}" — ${rule.rejectionMsg}` })
            }
          }
        }
      }
    }

    // ═══ 10. 의료 소재 검증 ═══
    for (const blocked of BLOCKED_MEDICAL) {
      if (fullText.includes(blocked)) {
        issues.push({ type: 'medical_blocked', detail: `금지 의료 소재: "${blocked}"` })
      }
    }
    for (const caution of CAUTION_MEDICAL) {
      if (fullText.includes(caution)) {
        issues.push({ type: 'medical_caution', detail: `주의 의료 소재: "${caution}" — 사용자 확인 필요` })
      }
    }

    // ═══ 11. 본문 글자수 (공백 제외) ═══
    const bodyLength = body?.replace(/\s/g, '').length ?? 0
    const minLength = wordCountMin ?? 500
    const maxLength = wordCountMax ?? 4000
    if (bodyLength < minLength) {
      issues.push({ type: 'too_short', detail: `본문이 너무 짧습니다 (${bodyLength}자 / 최소 ${minLength}자, 공백 제외)` })
    }
    if (bodyLength > maxLength) {
      issues.push({ type: 'too_long', detail: `본문이 너무 깁니다 (${bodyLength}자 / 최대 ${maxLength}자, 공백 제외)` })
    }

    // ═══ 결과 결정 ═══
    const hardTypes = ['prohibition', 'strict_forbidden', 'title_length', 'title_brand', 'title_duplicate', 'too_short', 'too_long', 'mode_violation', 'brand_mention_low', 'medical_blocked', 'fact_rule']
    const hardIssues = issues.filter((i) => hardTypes.includes(i.type))
    const warnIssues = issues.filter((i) => !hardTypes.includes(i.type))

    const result: 'pass' | 'reject' | 'needs_user' =
      hardIssues.length > 0 ? 'reject' : warnIssues.length > 0 ? 'needs_user' : 'pass'

    const reviewRecord: ReviewRecord = {
      step: 1,
      timestamp: new Date().toISOString(),
      result,
      issues,
      reviewer: 'auto',
    }

    return NextResponse.json({
      passed: result === 'pass',
      result,
      reviewRecord,
      issues,
    })
  } catch (error: unknown) {
    console.error('[검수 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 }
    )
  }
}
