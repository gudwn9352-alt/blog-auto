import { NextResponse } from 'next/server'

interface ImageRequest {
  prompt: string
  imageType: string
}

export async function POST(req: Request) {
  try {
    const { prompt, imageType }: ImageRequest = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API 키가 없습니다' }, { status: 500 })
    }

    // Gemini 2.0 Flash로 이미지 생성
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `Generate a high quality image: ${prompt}. The image should be clean, professional, and suitable for a blog post. Korean people only for human subjects.` }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          }
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('[Gemini 오류]', JSON.stringify(err))
      return NextResponse.json({ error: err.error?.message ?? '이미지 생성 실패' }, { status: 500 })
    }

    const data = await response.json()

    // 응답에서 이미지 데이터 추출
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('image/'))

    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: '이미지가 생성되지 않았습니다. 프롬프트를 수정해보세요.' }, { status: 500 })
    }

    const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`

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
