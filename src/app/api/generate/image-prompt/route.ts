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
6. 총 ${imageCount}개의 이미지 프롬프트를 생성합니다.

★★★ 매우 중요한 규칙 ★★★
7. promptEn은 순수 배경/장면 이미지만 묘사하세요. 텍스트, 글자, 문자, 로고, 아이콘 라벨, 체크박스 텍스트 등 어떤 형태의 글자도 이미지에 포함시키지 마세요.
8. promptEn 마지막에 반드시 이 문장을 추가하세요: "Absolutely no text, no letters, no words, no numbers, no typography, no labels, no captions anywhere in the image. Pure visual only."
9. infographic, chart, icon 타입이라도 텍스트 없이 시각적 요소만으로 표현하세요.

10. processingText는 이미지 위에 에디터에서 사용자가 올릴 한글 텍스트입니다.
  - mainCopy: 최대 15자, 한글만
  - subCopy: 최대 20자, 한글만
  - 영문, 영어 단어 절대 금지 (Surgery ❌ → 수술 ✅, Diagnosis ❌ → 진단 ✅)

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
