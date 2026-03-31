import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' })

interface ImageRequest {
  prompt: string          // 영어 프롬프트
  negativePrompt?: string
  imageType: string       // 이미지 타입 ID (1-1, 3-1 등)
}

export async function POST(req: Request) {
  try {
    const { prompt, imageType }: ImageRequest = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 })
    }

    // Gemini Imagen 3으로 이미지 생성
    const response = await genai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
      },
    })

    if (!response.generatedImages || response.generatedImages.length === 0) {
      return NextResponse.json({ error: '이미지 생성 실패' }, { status: 500 })
    }

    const imageData = response.generatedImages[0].image?.imageBytes
    if (!imageData) {
      return NextResponse.json({ error: '이미지 데이터 없음' }, { status: 500 })
    }

    // Base64 data URL로 반환
    const dataUrl = `data:image/png;base64,${imageData}`

    return NextResponse.json({
      imageUrl: dataUrl,
      imageType,
    })
  } catch (error: unknown) {
    console.error('[이미지 생성 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '이미지 생성 실패' },
      { status: 500 }
    )
  }
}
