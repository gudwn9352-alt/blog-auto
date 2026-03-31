import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface UploadRequest {
  manuscriptId: string
  imageIndex: number
  dataUrl: string
}

export async function POST(req: Request) {
  try {
    const { manuscriptId, imageIndex, dataUrl }: UploadRequest = await req.json()

    if (!dataUrl || !manuscriptId) {
      return NextResponse.json({ error: '데이터 누락' }, { status: 400 })
    }

    // 이미 파일 URL이면 그대로 반환
    if (!dataUrl.startsWith('data:')) {
      return NextResponse.json({ imageUrl: dataUrl })
    }

    // data:image/png;base64,xxxxx → Buffer → 파일 저장
    const matches = dataUrl.match(/data:(image\/\w+);base64,(.+)/)
    if (!matches) {
      return NextResponse.json({ imageUrl: dataUrl })
    }

    const ext = matches[1].split('/')[1] ?? 'png'
    const buffer = Buffer.from(matches[2], 'base64')
    const fileName = `img_${manuscriptId}_${imageIndex}_edited_${Date.now()}.${ext}`
    const dirPath = join(process.cwd(), 'public', 'generated-images')
    await mkdir(dirPath, { recursive: true })
    await writeFile(join(dirPath, fileName), buffer)

    return NextResponse.json({ imageUrl: `/generated-images/${fileName}` })
  } catch (error: unknown) {
    console.error('[이미지 업로드 오류]', error)
    return NextResponse.json({ error: '업로드 실패' }, { status: 500 })
  }
}
