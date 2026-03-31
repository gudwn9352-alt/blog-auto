import { NextResponse } from 'next/server'
import JSZip from 'jszip'

interface ManuscriptEntry {
  title: string
  body: string
  brandName?: string
}

interface ZipRequest {
  manuscripts: ManuscriptEntry[]
}

export async function POST(req: Request) {
  try {
    const { manuscripts }: ZipRequest = await req.json()

    if (!manuscripts || manuscripts.length === 0) {
      return NextResponse.json(
        { error: '원고 데이터가 필요합니다' },
        { status: 400 },
      )
    }

    const zip = new JSZip()

    manuscripts.forEach((m, idx) => {
      const content = [
        m.title,
        '',
        m.body,
        '',
        '',
        m.brandName ?? '더바다',
      ].join('\n')

      const filename = `${m.title}_${idx + 1}.txt`
      zip.file(filename, content)
    })

    const buffer = await zip.generateAsync({ type: 'uint8array' })

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="원고_일괄.zip"',
      },
    })
  } catch (error: unknown) {
    console.error('[ZIP 생성 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 },
    )
  }
}
