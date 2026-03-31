interface ScoreDetail {
  item: string
  score: number
  max: number
  tip?: string
}

interface QualityScoreResult {
  total: number
  details: ScoreDetail[]
}

export function calculateQualityScore(
  title: string,
  body: string,
  persona?: Record<string, string>
): QualityScoreResult {
  const details: ScoreDetail[] = []
  const bodyNoSpace = body.replace(/\s/g, '')

  // 1. 자연스러움 (AI 패턴 없는지) /20점
  {
    const aiPatterns = [
      /오늘은.{0,20}알아보겠습니다/,
      /오늘은.{0,20}살펴보겠습니다/,
      /여러분/,
    ]
    const hasEmojiBullet = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}✅❌⭐🔥💡📌🎯]/mu.test(body)
    let penalty = 0
    for (const pattern of aiPatterns) {
      if (pattern.test(body)) {
        penalty += 5
      }
    }
    if (hasEmojiBullet) {
      penalty += 5
    }
    const score = Math.max(0, 20 - penalty)
    details.push({
      item: '자연스러움',
      score,
      max: 20,
      tip: score < 20 ? 'AI 패턴 표현("오늘은~알아보겠습니다", "여러분", 이모지 글머리)을 줄여보세요' : undefined,
    })
  }

  // 2. 일관성 (문체가 섞이지 않는지) /15점
  {
    const sentences = body.split(/[.!?。]+/).filter((s) => s.trim())
    let haeyoCount = 0
    let habnidaCount = 0
    for (const s of sentences) {
      const trimmed = s.trim()
      if (/해요$|에요$|세요$|네요$|죠$|요$/.test(trimmed)) {
        haeyoCount++
      }
      if (/합니다$|습니다$|됩니다$|입니다$|십시오$|니까$/.test(trimmed)) {
        habnidaCount++
      }
    }
    let score = 15
    if (haeyoCount > 0 && habnidaCount > 0) {
      const total = haeyoCount + habnidaCount
      const ratio = Math.min(haeyoCount, habnidaCount) / total
      if (ratio > 0.3) {
        score = 5
      } else if (ratio > 0.15) {
        score = 10
      }
    }
    details.push({
      item: '일관성',
      score,
      max: 15,
      tip: score < 15 ? '해요체와 합니다체가 혼용되고 있습니다. 하나의 문체로 통일해보세요' : undefined,
    })
  }

  // 3. 구체성 (숫자, 금액, 날짜 등 구체적 표현) /15점
  {
    const numberPattern = /\d+만?\s*원|\d{4}년|\d+%|\d+세|\d+개월|\d+일|\d+건/g
    const matches = body.match(numberPattern)
    const count = matches ? matches.length : 0
    let score = 0
    if (count >= 5) {
      score = 15
    } else if (count >= 3) {
      score = 10
    } else if (count >= 1) {
      score = 5
    }
    details.push({
      item: '구체성',
      score,
      max: 15,
      tip: count < 3 ? '숫자, 금액, 날짜 등 구체적인 표현을 더 추가해보세요' : undefined,
    })
  }

  // 4. 감정 표현 (감탄사, 감정 단어 포함) /10점
  {
    const emotionWords = [
      '정말', '진짜', '너무', '아쉽', '다행', '놀라', '걱정', '안심',
      '기쁘', '속상', '답답', '든든', '뿌듯', '사실', '솔직히',
      '감사', '고마', '힘들', '어렵', '좋았', '좋은',
    ]
    const exclamations = /[!]{1,}|와!|아!|맞아|세상에|대박/g
    const emotionCount = emotionWords.filter((w) => body.includes(w)).length
    const exclMatches = body.match(exclamations)
    const exclCount = exclMatches ? exclMatches.length : 0
    const total = emotionCount + exclCount
    let score = 0
    if (total >= 5) {
      score = 10
    } else if (total >= 3) {
      score = 7
    } else if (total >= 1) {
      score = 4
    }
    details.push({
      item: '감정 표현',
      score,
      max: 10,
      tip: total < 3 ? '감탄사나 감정 표현을 추가하면 글이 더 생동감 있어집니다' : undefined,
    })
  }

  // 5. 흐름 (문단 3개 이상, 도입-전개-마무리 구조) /15점
  {
    const paragraphs = body.split(/\n\n+/).filter((p) => p.trim() && p.replace(/\s/g, '').length > 20)
    let score = 0
    if (paragraphs.length >= 5) {
      score = 15
    } else if (paragraphs.length >= 3) {
      score = 10
    } else if (paragraphs.length >= 2) {
      score = 5
    }
    details.push({
      item: '흐름',
      score,
      max: 15,
      tip: paragraphs.length < 3 ? '문단을 3개 이상으로 나누어 도입-전개-마무리 구조를 갖추세요' : undefined,
    })
  }

  // 6. 독창성 (반복 표현 적은지, 같은 단어 5회 이상 반복 감점) /15점
  {
    // 2글자 이상 단어 추출
    const words = body.match(/[가-힣]{2,}/g) || []
    const freq: Record<string, number> = {}
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1
    }
    const overused = Object.entries(freq).filter(
      ([word, count]) => count >= 5 && word.length >= 2
    )
    let score = 15
    if (overused.length >= 5) {
      score = 5
    } else if (overused.length >= 3) {
      score = 8
    } else if (overused.length >= 1) {
      score = 12
    }
    details.push({
      item: '독창성',
      score,
      max: 15,
      tip:
        overused.length > 0
          ? `다음 단어가 5회 이상 반복됩니다: ${overused.map(([w]) => w).slice(0, 5).join(', ')}`
          : undefined,
    })
  }

  // 7. 글자수 적정 /10점
  {
    const len = bodyNoSpace.length
    let score = 0
    if (len >= 1200 && len <= 3000) {
      score = 10
    } else if (len >= 800 && len < 1200) {
      score = 7
    } else if (len > 3000 && len <= 4000) {
      score = 7
    } else if (len >= 400) {
      score = 4
    }
    details.push({
      item: '글자수 적정',
      score,
      max: 10,
      tip:
        len < 1200
          ? `현재 ${len}자입니다. 1200자 이상 작성해보세요`
          : len > 3000
            ? `현재 ${len}자입니다. 3000자 이하로 줄여보세요`
            : undefined,
    })
  }

  const totalScore = details.reduce((sum, d) => sum + d.score, 0)

  return { total: totalScore, details }
}
