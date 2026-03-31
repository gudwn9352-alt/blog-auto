interface ScoreDetail {
  item: string
  score: number
  max: number
  tip?: string
}

interface SeoScoreResult {
  total: number
  details: ScoreDetail[]
}

export function calculateSeoScore(
  title: string,
  body: string,
  brandName: string
): SeoScoreResult {
  const details: ScoreDetail[] = []
  const titleNoSpace = title.replace(/\s/g, '')
  const bodyNoSpace = body.replace(/\s/g, '')

  // 1. 제목 길이 (15~40자 최적) /15점
  {
    const len = titleNoSpace.length
    let score = 0
    if (len >= 15 && len <= 40) {
      score = 15
    } else if (len >= 10 && len < 15) {
      score = 10
    } else if (len > 40 && len <= 50) {
      score = 10
    } else if (len > 0) {
      score = 5
    }
    details.push({
      item: '제목 길이',
      score,
      max: 15,
      tip: len < 15 ? '제목을 15자 이상으로 늘려보세요' : len > 40 ? '제목을 40자 이하로 줄여보세요' : undefined,
    })
  }

  // 2. 제목 키워드 (브랜드명 또는 핵심단어 포함) /15점
  {
    const hasBrand = brandName && title.includes(brandName)
    const score = hasBrand ? 15 : 0
    details.push({
      item: '제목 키워드',
      score,
      max: 15,
      tip: !hasBrand ? `제목에 브랜드명("${brandName}")을 포함해보세요` : undefined,
    })
  }

  // 3. 본문 길이 (1500자 이상 만점) /15점
  {
    const len = bodyNoSpace.length
    let score = 0
    if (len >= 1500) {
      score = 15
    } else if (len >= 1000) {
      score = 10
    } else if (len >= 500) {
      score = 5
    }
    details.push({
      item: '본문 길이',
      score,
      max: 15,
      tip: len < 1500 ? `본문이 ${len}자입니다. 1500자 이상 작성하면 SEO에 유리합니다` : undefined,
    })
  }

  // 4. 소제목 사용 (\n\n 후 짧은 문장으로 구분) /10점
  {
    const paragraphs = body.split(/\n\n+/).filter((p) => p.trim())
    const subheadings = paragraphs.filter((p) => {
      const trimmed = p.trim()
      const noSpace = trimmed.replace(/\s/g, '')
      return noSpace.length > 0 && noSpace.length <= 30 && !trimmed.includes('.')
    })
    let score = 0
    if (subheadings.length >= 3) {
      score = 10
    } else if (subheadings.length >= 2) {
      score = 7
    } else if (subheadings.length >= 1) {
      score = 4
    }
    details.push({
      item: '소제목 사용',
      score,
      max: 10,
      tip: subheadings.length < 3 ? '소제목을 3개 이상 사용하면 가독성이 높아집니다' : undefined,
    })
  }

  // 5. 문단 나눔 (3~5문장마다 줄바꿈) /10점
  {
    const paragraphs = body.split(/\n\n+/).filter((p) => p.trim())
    const contentParagraphs = paragraphs.filter((p) => p.replace(/\s/g, '').length > 30)
    let goodCount = 0
    for (const p of contentParagraphs) {
      const sentences = p.split(/[.!?。]+/).filter((s) => s.trim())
      if (sentences.length >= 2 && sentences.length <= 6) {
        goodCount++
      }
    }
    let score = 0
    if (contentParagraphs.length === 0) {
      score = 0
    } else {
      const ratio = goodCount / contentParagraphs.length
      score = Math.round(ratio * 10)
    }
    details.push({
      item: '문단 나눔',
      score,
      max: 10,
      tip: score < 10 ? '문단을 3~5문장 단위로 나누면 읽기 편합니다' : undefined,
    })
  }

  // 6. 키워드 밀도 (핵심 키워드 3~7회) /15점
  {
    let count = 0
    if (brandName) {
      const regex = new RegExp(brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const matches = body.match(regex)
      count = matches ? matches.length : 0
    }
    let score = 0
    if (count >= 3 && count <= 7) {
      score = 15
    } else if (count >= 1 && count <= 2) {
      score = 8
    } else if (count > 7 && count <= 10) {
      score = 10
    } else if (count > 10) {
      score = 5
    }
    details.push({
      item: '키워드 밀도',
      score,
      max: 15,
      tip:
        count < 3
          ? `키워드("${brandName}")를 본문에 3회 이상 사용해보세요`
          : count > 7
            ? `키워드가 ${count}회 반복됩니다. 7회 이하로 줄여보세요`
            : undefined,
    })
  }

  // 7. 도입부 훅 (첫 2문장 50자 이상) /10점
  {
    const sentences = body.split(/[.!?。]+/).filter((s) => s.trim())
    const firstTwo = sentences.slice(0, 2).join('')
    const len = firstTwo.replace(/\s/g, '').length
    let score = 0
    if (len >= 50) {
      score = 10
    } else if (len >= 30) {
      score = 5
    }
    details.push({
      item: '도입부 훅',
      score,
      max: 10,
      tip: len < 50 ? '도입부 첫 2문장을 50자 이상으로 작성하면 독자의 관심을 끌 수 있습니다' : undefined,
    })
  }

  // 8. CTA 행동유도 (마지막 단락에 행동유도 키워드) /10점
  {
    const ctaKeywords = ['확인', '문의', '상담', '신청', '클릭', '방문', '검색', '추천']
    const paragraphs = body.split(/\n\n+/).filter((p) => p.trim())
    const lastParagraph = paragraphs[paragraphs.length - 1] || ''
    const hasCta = ctaKeywords.some((kw) => lastParagraph.includes(kw))
    const score = hasCta ? 10 : 0
    details.push({
      item: 'CTA 행동유도',
      score,
      max: 10,
      tip: !hasCta ? '마지막 문단에 행동유도 키워드(상담, 문의, 신청 등)를 넣어보세요' : undefined,
    })
  }

  const total = details.reduce((sum, d) => sum + d.score, 0)

  return { total, details }
}
