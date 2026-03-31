// 레이어 6: 페르소나 변수 옵션

export const VAR1_WRITING_STYLE = [
  { value: 'casual_diary', label: '구어체 일기' },
  { value: 'formal_info', label: '격식체 정보글' },
  { value: 'emotional_essay', label: '감성 에세이' },
  { value: 'sns_short', label: 'SNS 짧은 글' },
  { value: 'story_narrative', label: '스토리 서사형' },
  { value: 'report_analytical', label: '보고서형 분석' },
  { value: 'friendly_advice', label: '친근한 조언체' },
]

export const VAR2_FORMALITY = [
  { value: 'very_formal', label: '아주 격식 (합니다체)' },
  { value: 'formal', label: '격식 (해요체)' },
  { value: 'semi_casual', label: '반말 섞인 친근체' },
  { value: 'casual', label: '친근한 반말' },
  { value: 'very_casual', label: '아주 친근한 반말' },
]

export const VAR3_EMOTION_EXPRESSION = [
  { value: 'restrained', label: '절제됨' },
  { value: 'slightly_warm', label: '약간 따뜻함' },
  { value: 'warm', label: '따뜻함' },
  { value: 'empathetic', label: '공감형' },
  { value: 'passionate', label: '열정적' },
  { value: 'humorous', label: '유머러스' },
  { value: 'urgent', label: '긴박함' },
]

export const VAR4_SPELLING = [
  { value: 'very_strict', label: '완벽한 맞춤법' },
  { value: 'strict', label: '엄격한 맞춤법' },
  { value: 'natural', label: '자연스러운 수준' },
  { value: 'conversational', label: '구어체적 허용' },
  { value: 'free', label: '자유로운 구어체' },
]

export const VAR6_BRAND_MENTION = [
  { value: 'no_mention', label: '언급 없음' },
  { value: 'very_subtle', label: '아주 은근하게' },
  { value: 'subtle', label: '은근하게' },
  { value: 'natural', label: '자연스럽게' },
  { value: 'recommended', label: '추천 방식으로' },
  { value: 'direct', label: '직접 언급' },
]

export const VAR7_CONTENT_LENGTH = [
  { value: 'short', label: '짧게 (500~800자)' },
  { value: 'mid', label: '중간 (800~1500자)' },
  { value: 'long', label: '길게 (1500~2500자)' },
  { value: 'extra_long', label: '아주 길게 (2500자+)' },
]

export const VAR8_PERSONAL_DISCLOSURE = [
  { value: 'anonymous', label: '완전 익명' },
  { value: 'minimal', label: '최소한만' },
  { value: 'selective', label: '선택적 공개' },
  { value: 'moderate', label: '적당히 공개' },
  { value: 'open', label: '많이 공개' },
  { value: 'very_open', label: '아주 많이 공개' },
  { value: 'full', label: '전체 공개' },
  { value: 'custom', label: '상황별 다름' },
]
