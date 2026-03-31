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
      return NextResponse.json({ error: '제목과 본문이 필요합니다' }, { status: 400 })
    }

    const bodyLines = body.split('\n')

    const bodyParagraphs = bodyLines.map((line: string) => {
      // **볼드** 패턴 처리
      const parts = line.split(/(\*\*[^*]+\*\*)/g)
      const runs = parts.filter(Boolean).map((part: string) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return new TextRun({ text: part.slice(2, -2), bold: true, size: 22, font: { name: 'Malgun Gothic' } })
        }
        return new TextRun({ text: part, size: 22, font: { name: 'Malgun Gothic' } })
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
                new TextRun({ text: title, bold: true, size: 32, font: { name: 'Malgun Gothic' } }),
              ],
            }),
            new Paragraph({ children: [] }),
            ...bodyParagraphs,
            new Paragraph({ children: [] }),
            new Paragraph({ children: [] }),
            new Paragraph({
              children: [
                new TextRun({ text: brandName ?? '', bold: true, size: 20, font: { name: 'Malgun Gothic' } }),
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
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="manuscript.docx"',
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
