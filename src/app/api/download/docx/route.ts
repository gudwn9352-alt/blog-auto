import { NextResponse } from 'next/server'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from 'docx'

interface DocxRequest {
  title: string
  body: string
  brandName?: string
}

export async function POST(req: Request) {
  try {
    const { title, body, brandName }: DocxRequest = await req.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: '제목과 본문이 필요합니다' },
        { status: 400 },
      )
    }

    const bodyLines = body.split('\n')

    const doc = new Document({
      sections: [
        {
          children: [
            // 제목
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 32,
                }),
              ],
            }),

            // 빈 줄
            new Paragraph({ children: [] }),

            // 본문 (줄바꿈 기준 분할)
            ...bodyLines.map(
              (line) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 120 },
                }),
            ),

            // 빈 줄
            new Paragraph({ children: [] }),
            new Paragraph({ children: [] }),

            // 하단 브랜드명
            new Paragraph({
              children: [
                new TextRun({
                  text: brandName ?? '더바다',
                  bold: true,
                  size: 20,
                  color: '888888',
                }),
              ],
            }),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="원고.docx"',
      },
    })
  } catch (error: unknown) {
    console.error('[DOCX 생성 오류]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 },
    )
  }
}
