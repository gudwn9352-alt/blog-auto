import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ReviewRecord } from '@/types/manuscript'

// 검수(품질관리) 전용 Claude 클라이언트 — 원고생성 클라이언트와 역할 분리
const reviewerClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ReviewAIRequest {
  title: string
  body: string
  persona: {
    slotA?: string // 연령대
    slotB?: string // 성별
    slotC?: string // 생애 단계
    slotD?: string // 직업군
    slotE?: string // 보험 관계 상태
    slotF?: string // 경제적 맥락
    slotG?: string // 글쓰기 경험
    slotH?: string // 현재 상태
    slotI?: string // 인지경로
  }
  existingTitles: string[]
}

// ─── 제목 유사도 계산 (레벤슈타인 기반) ───
function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function titleSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshteinDistance(a, b) / maxLen
}

const SIMILARITY_THRESHOLD = 0.7

// ─── AI 검수 시스템 프롬프트 ───
function buildReviewSystemPrompt(persona: ReviewAIRequest['persona']): string {
  const personaDesc = [
    persona.slotA && `연령대: ${persona.slotA}`,
    persona.slotB && `성별: ${persona.slotB}`,
    persona.slotC && `생애 단계: ${persona.slotC}`,
    persona.slotD && `직업군: ${persona.slotD}`,
    persona.slotE && `보험 관계: ${persona.slotE}`,
    persona.slotF && `경제적 맥락: ${persona.slotF}`,
    persona.slotG && `글쓰기 경험: ${persona.slotG}`,
    persona.slotH && `현재 상태: ${persona.slotH}`,
    persona.slotI && `인지경로: ${persona.slotI}`,
  ]
    .filter(Boolean)
    .join(', ')

  return `당신은 보험 블로그 원고 품질 검수 전문가입니다.
주어진 원고(제목+본문)를 아래 검수 항목에 따라 꼼꼼히 검사하고, JSON으로 결과를 반환하세요.

## 주체자(페르소나) 정보
${personaDesc || '(정보 없음)'}

## 검수 항목

### 1. 자연스러움 (naturalness)
- 사람이 실제로 블로그에 쓸 법한 자연스러운 문체인지 확인
- 주체자 특성에 맞는 어투인지 검증 (연령대, 성별, 직업에 맞지 않는 표현 감지)
- 지나치게 딱딱하거나 기계적인 톤 감지

### 2. AI 패턴 감지 (ai_pattern)
- AI가 자주 쓰는 특유의 패턴이 있는지 감지
- 예: "~라고 할 수 있습니다", "다양한", "중요합니다", "살펴보겠습니다" 과도 반복
- 불필요하게 균형 잡힌 나열, 기계적인 접속사 사용
- 비정상적으로 완벽한 문단 구조

### 3. 문맥 흐름 (flow)
- 서론→본론→결론의 자연스러운 흐름
- 갑작스러운 주제 전환이나 논리적 비약
- 문단 간 연결이 어색한 부분

### 4. 어색한 문장 (awkward)
- 문법적으로 맞지만 한국어로 어색한 표현
- 번역투 표현
- 같은 어미의 과도한 반복

### 5. 비밀 금지사항 (secret_prohibition)
- 보험료를 구체적 금액으로 명시하는 행위
- 보장 내용을 단정적으로 표현 ("무조건 보장", "100% 보장")
- 타사 비방 또는 특정 보험사/상품명 직접 언급
- 의료 행위에 대한 단정적 조언
- 허위/과장 정보

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
\`\`\`json
{
  "issues": [
    {
      "type": "naturalness | ai_pattern | flow | awkward | secret_prohibition",
      "severity": "error | warning | info",
      "detail": "구체적인 문제 설명",
      "location": "title | body",
      "suggestion": "수정 제안 (선택)"
    }
  ]
}
\`\`\`

- severity 기준:
  - error: 반드시 수정 필요 (secret_prohibition은 항상 error)
  - warning: 수정 권장
  - info: 참고 사항
- 문제가 없으면 issues를 빈 배열로 반환하세요.`
}

export async function POST(req: Request) {
  try {
    const { title, body, persona, existingTitles }: ReviewAIRequest = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: '제목과 본문이 필요합니다' }, { status: 400 })
    }

    const issues: Array<{
      type: string
      severity: 'error' | 'warning' | 'info'
      detail: string
      location?: string
      suggestion?: string
    }> = []

    // ─── 1단계: 기존 원고 제목 유사도 검사 ───
    if (existingTitles?.length > 0) {
      for (const existing of existingTitles) {
        const similarity = titleSimilarity(title, existing)
        if (similarity >= SIMILARITY_THRESHOLD) {
          issues.push({
            type: 'title_similarity',
            severity: similarity >= 0.9 ? 'error' : 'warning',
            detail: `기존 원고 제목과 ${Math.round(similarity * 100)}% 유사합니다: "${existing}"`,
            location: 'title',
            suggestion: '제목을 차별화해주세요. 구조나 표현 방식을 변경하는 것을 권장합니다.',
          })
        }
      }
    }

    // ─── 2단계: AI 검수 (Claude 호출) ───
    const systemPrompt = buildReviewSystemPrompt(persona ?? {})

    const message = await reviewerClient.messages.create({
      model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `다음 블로그 원고를 검수해주세요.\n\n## 제목\n${title}\n\n## 본문\n${body}`,
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // AI 응답 파싱
    try {
      const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim()
      const parsed: { issues: Array<{ type: string; severity: string; detail: string; location?: string; suggestion?: string }> } =
        JSON.parse(cleaned)

      if (parsed.issues?.length > 0) {
        for (const aiIssue of parsed.issues) {
          issues.push({
            type: aiIssue.type,
            severity: (aiIssue.severity as 'error' | 'warning' | 'info') ?? 'warning',
            detail: aiIssue.detail,
            location: aiIssue.location,
            suggestion: aiIssue.suggestion,
          })
        }
      }
    } catch {
      // AI 응답 파싱 실패 시 경고 추가하고 계속 진행
      issues.push({
        type: 'ai_parse_error',
        severity: 'warning',
        detail: 'AI 검수 응답 파싱에 실패했습니다. 수동 확인을 권장합니다.',
      })
    }

    // ─── 최종 판정 ───
    const hasError = issues.some((i) => i.severity === 'error')
    const hasWarning = issues.some((i) => i.severity === 'warning')

    const result: 'pass' | 'reject' | 'needs_user' = hasError
      ? 'reject'
      : hasWarning
        ? 'needs_user'
        : 'pass'

    const reviewRecord: ReviewRecord = {
      step: 2,
      timestamp: new Date().toISOString(),
      result,
      issues: issues.map((i) => ({
        type: i.type,
        detail: i.detail,
        location: i.location,
      })),
      reviewer: 'ai',
    }

    return NextResponse.json({ result, issues, reviewRecord })
  } catch (error: unknown) {
    console.error('[AI 검수 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 }
    )
  }
}
