import { NextResponse } from 'next/server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface ImageRequest {
  prompt: string
  imageType: string
  manuscriptId?: string
  imageIndex?: number
}

export async function POST(req: Request) {
  try {
    const { prompt, imageType, manuscriptId, imageIndex }: ImageRequest = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API 키가 없습니다' }, { status: 500 })
    }

    // Imagen 4.0으로 이미지 생성 (고품질)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [
            {
              prompt: `${prompt}. High quality, professional, clean composition. Korean people only for human subjects. IMPORTANT: Do NOT include any text, letters, words, numbers, watermarks, or typography in the image. Pure visual image only, no text overlay.`,
            }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
          }
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('[Imagen 오류]', JSON.stringify(err))

      // Imagen 실패 시 Gemini 2.5 Flash Image로 폴백
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `Generate a high quality image: ${prompt}. Clean, professional. Korean people only for human subjects. IMPORTANT: Do NOT include any text, letters, words, numbers, or typography in the image. Pure visual only.` }
                ]
              }
            ],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            }
          }),
        }
      )

      if (!fallbackResponse.ok) {
        return NextResponse.json({ error: err.error?.message ?? '이미지 생성 실패' }, { status: 500 })
      }

      const fallbackData = await fallbackResponse.json()
      const parts = fallbackData.candidates?.[0]?.content?.parts ?? []
      const imagePart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('image/'))

      if (!imagePart?.inlineData) {
        return NextResponse.json({ error: '이미지 생성 실패 (폴백 포함)' }, { status: 500 })
      }

      // 폴백도 파일로 저장
      const fbBase64 = imagePart.inlineData.data
      const fbBuffer = Buffer.from(fbBase64, 'base64')
      const fbExt = imagePart.inlineData.mimeType.split('/')[1] ?? 'png'
      const fbFileName = `img_${manuscriptId ?? 'temp'}_${imageIndex ?? Date.now()}_fb.${fbExt}`
      const fbDirPath = join(process.cwd(), 'public', 'generated-images')
      await mkdir(fbDirPath, { recursive: true })
      await writeFile(join(fbDirPath, fbFileName), fbBuffer)

      return NextResponse.json({
        imageUrl: `/generated-images/${fbFileName}`,
        imageType,
        model: 'gemini-2.5-flash-image',
      })
    }

    const data = await response.json()

    // Imagen 응답에서 이미지 추출
    const predictions = data.predictions ?? []
    if (predictions.length === 0 || !predictions[0].bytesBase64Encoded) {
      return NextResponse.json({ error: '이미지 데이터 없음' }, { status: 500 })
    }

    // public/images 폴더에 파일로 저장 → URL로 반환 (Firestore 1MB 제한 회피)
    const base64 = predictions[0].bytesBase64Encoded
    const buffer = Buffer.from(base64, 'base64')
    const fileName = `img_${manuscriptId ?? 'temp'}_${imageIndex ?? Date.now()}.png`
    const dirPath = join(process.cwd(), 'public', 'generated-images')
    await mkdir(dirPath, { recursive: true })
    await writeFile(join(dirPath, fileName), buffer)
    const imageUrl = `/generated-images/${fileName}`

    return NextResponse.json({
      imageUrl,
      imageType,
      model: 'imagen-4.0-generate-001',
    })
  } catch (error: unknown) {
    console.error('[이미지 생성 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '이미지 생성 실패' },
      { status: 500 }
    )
  }
}
