import { NextResponse } from 'next/server'
import { google } from 'googleapis'

interface ExportRequest {
  title: string
  body: string
  brandName: string
  manuscriptMode: 'brand' | 'thirdparty'
  images?: Array<{ imageUrl: string; position: number }>
  accessToken: string
}

// 구글 드라이브 폴더 경로
// 바이럴/1.브랜드 원고 미사용
// 바이럴/3.제3자 원고 미사용
async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  folderName: string
): Promise<string> {
  // 기존 폴더 찾기
  const res = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  })

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }

  // 없으면 생성
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  })

  return folder.data.id!
}

export async function POST(req: Request) {
  try {
    const { title, body, brandName, manuscriptMode, images, accessToken }: ExportRequest = await req.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'Google 인증이 필요합니다' }, { status: 401 })
    }

    // OAuth2 클라이언트 설정
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    )
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // 폴더 경로 탐색: 내 드라이브 → 바이럴 → 1.브랜드 원고 미사용 or 3.제3자 원고 미사용
    const viralFolder = await findOrCreateFolder(drive, 'root', '바이럴')

    const targetFolderName = manuscriptMode === 'brand'
      ? '1.브랜드 원고 미사용'
      : '3.제3자 원고 미사용'
    const targetFolder = await findOrCreateFolder(drive, viralFolder, targetFolderName)

    // 원고별 폴더 생성 (제목으로)
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 50)
    const manuscriptFolder = await findOrCreateFolder(drive, targetFolder, safeTitle)

    // 1. 원고 텍스트 파일 업로드
    const textContent = `${title}\n\n${body}`
    await drive.files.create({
      requestBody: {
        name: `${safeTitle}.txt`,
        parents: [manuscriptFolder],
      },
      media: {
        mimeType: 'text/plain; charset=utf-8',
        body: textContent,
      },
    })

    // 2. 이미지 업로드
    let uploadedImages = 0
    if (images && images.length > 0) {
      for (const img of images) {
        if (!img.imageUrl) continue

        try {
          let imageBuffer: Buffer
          let mimeType = 'image/png'

          if (img.imageUrl.startsWith('data:')) {
            // Base64 data URL
            const matches = img.imageUrl.match(/data:(image\/\w+);base64,(.+)/)
            if (matches) {
              mimeType = matches[1]
              imageBuffer = Buffer.from(matches[2], 'base64')
            } else continue
          } else {
            // Firebase Storage URL → fetch
            const imgRes = await fetch(img.imageUrl)
            const arrayBuf = await imgRes.arrayBuffer()
            imageBuffer = Buffer.from(arrayBuf)
            mimeType = imgRes.headers.get('content-type') ?? 'image/png'
          }

          const ext = mimeType.split('/')[1] ?? 'png'
          await drive.files.create({
            requestBody: {
              name: `이미지${img.position + 1}.${ext}`,
              parents: [manuscriptFolder],
            },
            media: {
              mimeType,
              body: require('stream').Readable.from(imageBuffer),
            },
          })
          uploadedImages++
        } catch (e) {
          console.error(`[이미지 ${img.position} 업로드 실패]`, e)
        }
      }
    }

    return NextResponse.json({
      success: true,
      folder: targetFolderName,
      manuscriptFolder: safeTitle,
      uploadedImages,
    })
  } catch (error: unknown) {
    console.error('[구글 드라이브 내보내기 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '내보내기 실패' },
      { status: 500 }
    )
  }
}
