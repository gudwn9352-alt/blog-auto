import { NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

// Firebase Admin 초기화 (서버사이드 전용)
if (getApps().length === 0) {
  initializeApp({
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

interface UploadRequest {
  manuscriptId: string
  imageIndex: number
  dataUrl: string  // base64 data URL
}

export async function POST(req: Request) {
  try {
    const { manuscriptId, imageIndex, dataUrl }: UploadRequest = await req.json()

    if (!dataUrl || !manuscriptId) {
      return NextResponse.json({ error: '데이터 누락' }, { status: 400 })
    }

    // data:image/png;base64,xxxxx → Buffer
    const matches = dataUrl.match(/data:(image\/\w+);base64,(.+)/)
    if (!matches) {
      // Base64가 아닌 경우 (이미 URL이면 그대로 반환)
      return NextResponse.json({ imageUrl: dataUrl })
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const ext = mimeType.split('/')[1] ?? 'png'
    const buffer = Buffer.from(base64Data, 'base64')

    const bucket = getStorage().bucket()
    const filePath = `manuscripts/${manuscriptId}/image_${imageIndex}.${ext}`
    const file = bucket.file(filePath)

    await file.save(buffer, {
      contentType: mimeType,
      metadata: { cacheControl: 'public, max-age=31536000' },
    })

    await file.makePublic()
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error: unknown) {
    console.error('[이미지 업로드 오류]', error)
    // 업로드 실패 시 원본 dataUrl 그대로 반환 (폴백)
    try {
      const body = await req.clone().json()
      return NextResponse.json({ imageUrl: body.dataUrl })
    } catch {
      return NextResponse.json({ error: '업로드 실패' }, { status: 500 })
    }
  }
}
