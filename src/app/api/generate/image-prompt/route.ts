import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ImagePromptRequest {
  title: string
  body: string
  persona?: string
  imageCount: number
}

interface GeneratedImagePrompt {
  position: number
  promptKo: string
  promptEn: string
  imageType: string
  processingText: {
    mainCopy: string
    subCopy: string
  }
}

export async function POST(req: Request) {
  try {
    const { title, body, persona, imageCount }: ImagePromptRequest =
      await req.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: '제목과 본문이 필요합니다' },
        { status: 400 },
      )
    }

    if (!imageCount || imageCount < 1 || imageCount > 15) {
      return NextResponse.json(
        { error: '이미지 수는 1~15 사이여야 합니다' },
        { status: 400 },
      )
    }

    const systemPrompt = `당신은 보험 블로그 원고 검수를 담당하는 "원고검수(과장)"입니다.
주어진 원고를 분석하여 이미지가 삽입될 최적의 위치를 선정하고, 각 위치에 적합한 이미지 생성 프롬프트를 작성합니다.

규칙:
1. 원고 본문의 줄 번호(1부터 시작)를 기준으로 position을 지정합니다.
2. 이미지는 본문 흐름에 자연스럽게 배치되어야 합니다.
3. 이미지 설명(promptKo)은 한국어로, 생성 프롬프트(promptEn)는 영어로 작성합니다.
4. 인물이 포함된 이미지의 경우 반드시 "Korean man" 또는 "Korean woman"을 프롬프트에 포함합니다.
5. imageType은 "photo", "illustration", "infographic", "icon", "chart" 중 적합한 것을 선택합니다.
6. processingText의 mainCopy는 최대 15자(한글만), subCopy는 최대 20자(한글만)로 제한합니다.
7. 총 ${imageCount}개의 이미지 프롬프트를 생성합니다.
8. ★ 매우 중요: promptEn에 이미지 안에 텍스트를 넣으라는 지시를 절대 포함하지 마세요. "no text, no typography, no letters, no words in the image" 를 반드시 포함하세요. 텍스트는 에디터에서 별도로 추가합니다.
9. processingText는 이미지 위에 에디터로 올릴 텍스트입니다 — 한글만 사용, 영문 금지.

JSON 형식으로만 응답하세요:
{
  "images": [
    {
      "position": 줄번호(number),
      "promptKo": "한국어 이미지 설명",
      "promptEn": "English image generation prompt",
      "imageType": "photo|illustration|infographic|icon|chart",
      "processingText": {
        "mainCopy": "메인 카피 (최대 15자)",
        "subCopy": "보조 문구 (최대 20자)"
      }
    }
  ]
}`

    const userMessage = `다음 원고를 분석하여 ${imageCount}개의 이미지 프롬프트를 생성해주세요.

[제목]
${title}

[본문]
${body}
${persona ? `\n[페르소나]\n${persona}` : ''}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed: { images: GeneratedImagePrompt[] }
    try {
      const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: '이미지 프롬프트 파싱 실패', rawText },
        { status: 500 },
      )
    }

    if (!parsed.images || !Array.isArray(parsed.images)) {
      return NextResponse.json(
        { error: '응답 형식 오류 — images 배열 누락' },
        { status: 500 },
      )
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('[이미지 프롬프트 생성 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 },
    )
  }
}
