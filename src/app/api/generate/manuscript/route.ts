import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildWriterSystemPrompt } from '@/lib/prompts/writer-system'
import { resolveAllSettings } from '@/lib/diversity/engine'
import type { GenerateSettings } from '@/stores/generateStore'

// 원고생성(계약직) 전용 Claude 클라이언트
const writerClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface GenerateRequest {
  settings: GenerateSettings
  brandInfo: {
    name: string
    serviceDescription: string
    targetAudience?: string
    tone?: string
    voiceGuide?: string
  }
  openProhibitions: string[]
  recentManuscripts?: Array<{ category?: string; typeId?: string; materialSettings?: { category?: string }; persona?: Record<string, string> }>
  fixMode?: { originalTitle: string; originalBody: string; issues: string }
}

export async function POST(req: Request) {
  try {
    const { settings: rawSettings, brandInfo, openProhibitions, recentManuscripts, fixMode }: GenerateRequest = await req.json()

    if (!brandInfo?.name) {
      return NextResponse.json({ error: '브랜드 정보가 필요합니다' }, { status: 400 })
    }

    // ★ 다양성 엔진: 모든 랜덤 값 확정 (중복방지 포함)
    const settings = resolveAllSettings(rawSettings, recentManuscripts as never)

    // 시스템 프롬프트 구성 (확정된 설정값 사용)
    const systemPrompt = buildWriterSystemPrompt(settings, brandInfo, openProhibitions)

    // Claude API 호출
    const userContent = fixMode
      ? `아래 원고가 검수에서 반려되었습니다. 반려 사유에 해당하는 부분만 수정하고, 나머지 문맥·흐름·톤은 그대로 유지해주세요.

[반려 사유]
${fixMode.issues}

[기존 제목]
${fixMode.originalTitle}

[기존 본문]
${fixMode.originalBody}

수정된 원고를 동일한 JSON 형식으로 출력하세요.`
      : '지시서대로 블로그 원고를 작성해주세요.'

    const message = await writerClient.messages.create({
      model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // JSON 파싱
    let parsed: { title: string; body: string }
    try {
      const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: '원고 파싱 실패', rawText }, { status: 500 })
    }

    if (!parsed.title || !parsed.body) {
      return NextResponse.json({ error: '원고 형식 오류 — 제목 또는 본문 누락' }, { status: 500 })
    }

    // 확정된 설정값 + 생성 결과 반환 (Firestore 저장은 클라이언트에서)
    return NextResponse.json({
      title: parsed.title,
      body: parsed.body,
      resolvedSettings: {
        category: settings.category,
        typeId: settings.typeId,
        material: settings.material,
        appealPoint: settings.appealPoint,
        persona: settings.persona,
        variables: settings.variables,
        wordCount: settings.wordCount,
      },
    })
  } catch (error: unknown) {
    console.error('[원고생성 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 }
    )
  }
}
