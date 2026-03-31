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

    // 본문에서 볼드(**텍스트**) 처리 + 줄바꿈 분할
    const bodyLines = body.split('\n')

    const bodyParagraphs = bodyLines.map((line: string) => {
      const children: typeof TextRun[] = []
      // **볼드** 패턴 처리
      const parts = line.split(/(\*\*[^*]+\*\*)/g)
      const runs = parts.map((part: string) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return new TextRun({ text: part.slice(2, -2), bold: true, size: 22, font: 'Malgun Gothic' })
        }
        return new TextRun({ text: part, size: 22, font: 'Malgun Gothic' })
      })
      return new Paragraph({ children: runs, spacing: { after: 120 } })
    })

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [
                new TextRun({ text: title, bold: true, size: 32, font: 'Malgun Gothic' }),
              ],
            }),
            new Paragraph({ children: [] }),
            ...bodyParagraphs,
            new Paragraph({ children: [] }),
            new Paragraph({ children: [] }),
            new Paragraph({
              children: [
                new TextRun({ text: brandName ?? '더바다', bold: true, size: 20, color: '888888', font: 'Malgun Gothic' }),
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
