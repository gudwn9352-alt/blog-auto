import { NextResponse } from 'next/server'
import type { ReviewRecord } from '@/types/manuscript'

const MAX_BRAND_MENTIONS = 10
const TITLE_MAX_LENGTH = 60

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

// 클라이언트에서 원고 데이터를 직접 전달받아 검수
interface ReviewRequest {
  title: string
  body: string
  brandName: string
  openProhibitions: string[]
  wordCountMin: number
  wordCountMax: number
}

export async function POST(req: Request) {
  try {
    const { title, body, brandName, openProhibitions, wordCountMin, wordCountMax }: ReviewRequest = await req.json()

    const fullText = `${title ?? ''}\n${body ?? ''}`
    const issues: Array<{ type: string; detail: string; location?: string }> = []

    // 1. 제목 글자수
    const titleNoSpace = title?.replace(/\s/g, '').length ?? 0
    if (title && titleNoSpace > TITLE_MAX_LENGTH) {
      issues.push({
        type: 'title_length',
        detail: `제목이 너무 깁니다 (${titleNoSpace}자 / 최대 ${TITLE_MAX_LENGTH}자, 공백 제외)`,
        location: 'title',
      })
    }

    // 2. 브랜드 언급 횟수
    if (brandName) {
      const mentionCount = (fullText.match(new RegExp(brandName, 'g')) ?? []).length
      if (mentionCount > MAX_BRAND_MENTIONS) {
        issues.push({
          type: 'brand_mention_excess',
          detail: `브랜드명 "${brandName}" 언급이 ${mentionCount}회로 과다합니다 (최대 ${MAX_BRAND_MENTIONS}회)`,
        })
      }
    }

    // 3. 오픈 금지사항 키워드
    const prohibitionIssues = checkProhibitions(fullText, openProhibitions ?? [])
    for (const issue of prohibitionIssues) {
      issues.push({ type: 'prohibition', detail: issue })
    }

    // 4. 실행 금지 표현
    const strictIssues = checkStrictForbidden(fullText)
    issues.push(...strictIssues)

    // 5. AI 패턴 감지 (규칙 기반)
    const aiPatterns = [
      { pattern: /오늘은.*알아보겠습니다/g, msg: 'AI 패턴 도입부: "오늘은 ~알아보겠습니다"' },
      { pattern: /마무리하며|정리하면|마치며/g, msg: 'AI 패턴 마무리: "마무리하며/정리하면"' },
      { pattern: /여러분[,!]|독자님|구독자님/g, msg: 'AI 패턴 호칭: "여러분/독자님"' },
      { pattern: /^(📌|✅|💡|🔥|⭐|📢|🎯|💰|🏥|📋).{0,5}/gm, msg: 'AI 패턴: 이모지 글머리' },
      { pattern: /이상으로.*마치겠습니다/g, msg: 'AI 패턴: "이상으로 마치겠습니다"' },
      { pattern: /참고하시[기면]/g, msg: 'AI 패턴: "참고하시기/참고하시면"' },
    ]
    for (const { pattern, msg } of aiPatterns) {
      if (pattern.test(body ?? '')) {
        issues.push({ type: 'ai_pattern', detail: msg })
      }
    }

    // 6. 본문 글자수 (공백 제외)
    const bodyLength = body?.replace(/\s/g, '').length ?? 0
    const minLength = wordCountMin ?? 500
    const maxLength = wordCountMax ?? 4000
    if (bodyLength < minLength) {
      issues.push({
        type: 'too_short',
        detail: `본문이 너무 짧습니다 (${bodyLength}자 / 최소 ${minLength}자, 공백 제외)`,
      })
    }
    if (bodyLength > maxLength) {
      issues.push({
        type: 'too_long',
        detail: `본문이 너무 깁니다 (${bodyLength}자 / 최대 ${maxLength}자, 공백 제외)`,
      })
    }

    const hardIssues = issues.filter((i) =>
      ['prohibition', 'strict_forbidden', 'title_length', 'too_short', 'too_long'].includes(i.type)
    )
    const warnIssues = issues.filter((i) =>
      !['prohibition', 'strict_forbidden', 'title_length', 'too_short', 'too_long'].includes(i.type)
    )

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
