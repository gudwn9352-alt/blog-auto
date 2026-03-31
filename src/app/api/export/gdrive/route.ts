import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

interface ExportRequest {
  title: string
  body: string
  brandName: string
  manuscriptMode: 'brand' | 'thirdparty'
  docxBase64?: string
  images?: Array<{ imageUrl: string; position: number; fileName?: string }>
  accessToken: string
}

// 기존 폴더 찾기 (생성 안 함)
async function findFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  folderName: string
): Promise<string | null> {
  const res = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  })
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }
  return null
}

// 폴더 생성
async function createFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  folderName: string
): Promise<string> {
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
    const { title, body, brandName, manuscriptMode, docxBase64, images, accessToken }: ExportRequest = await req.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'Google 인증이 필요합니다' }, { status: 401 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    )
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // 1. 기존 바이럴 폴더 찾기
    const viralFolder = await findFolder(drive, 'root', '바이럴')
    if (!viralFolder) {
      return NextResponse.json({ error: '"바이럴" 폴더를 찾을 수 없습니다. 구글 드라이브에 "바이럴" 폴더가 있는지 확인하세요.' }, { status: 404 })
    }

    // 2. 브랜드/제3자 폴더 찾기 (기존 폴더 사용)
    const targetFolderName = manuscriptMode === 'brand'
      ? '1.브랜드 원고 미사용'
      : '3.제3자 원고 미사용'
    const targetFolder = await findFolder(drive, viralFolder, targetFolderName)
    if (!targetFolder) {
      return NextResponse.json({ error: `"${targetFolderName}" 폴더를 찾을 수 없습니다.` }, { status: 404 })
    }

    // 3. 날짜_제목 폴더 생성
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const safeTitle = (title ?? '원고').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 30)
    const folderName = `${dateStr}_${safeTitle}`
    const manuscriptFolder = await createFolder(drive, targetFolder, folderName)

    // 4. 원고 .docx 업로드
    if (docxBase64) {
      const matches = docxBase64.match(/base64,(.+)/)
      if (matches) {
        const buffer = Buffer.from(matches[1], 'base64')
        await drive.files.create({
          requestBody: {
            name: `${safeTitle}.docx`,
            parents: [manuscriptFolder],
          },
          media: {
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            body: Readable.from(buffer),
          },
        })
      }
    } else {
      // docx 없으면 텍스트 파일로 대체
      await drive.files.create({
        requestBody: {
          name: `${safeTitle}.txt`,
          parents: [manuscriptFolder],
        },
        media: {
          mimeType: 'text/plain; charset=utf-8',
          body: `${title}\n\n${body}`,
        },
      })
    }

    // 5. 이미지 업로드
    let uploadedImages = 0
    if (images && images.length > 0) {
      for (const img of images) {
        if (!img.imageUrl) continue
        try {
          const matches = img.imageUrl.match(/data:(image\/\w+);base64,(.+)/)
          if (!matches) continue

          const mimeType = matches[1]
          const buffer = Buffer.from(matches[2], 'base64')
          const ext = mimeType.split('/')[1] ?? 'png'
          const fileName = img.fileName ?? `이미지${img.position + 1}.${ext}`

          await drive.files.create({
            requestBody: {
              name: fileName,
              parents: [manuscriptFolder],
            },
            media: {
              mimeType,
              body: Readable.from(buffer),
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
      manuscriptFolder: folderName,
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
