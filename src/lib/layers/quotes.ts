// 레이어: 인용구 시스템 상수

export interface QuoteType {
  id: string
  name: string
  template: string
  description: string
}

// ─── 인용구 6종류 ───
export const QUOTE_TYPES: QuoteType[] = [
  {
    id: 'dating',
    name: '데이팅',
    template: '"{content}"\n— {date}',
    description: '날짜와 함께 표시되는 인용구 스타일. 일기/회고 느낌',
  },
  {
    id: 'vertical_line',
    name: '버티컬라인',
    template: '| {content}',
    description: '왼쪽 세로선과 함께 들여쓰기된 인용구. 깔끔하고 모던한 느낌',
  },
  {
    id: 'said',
    name: '말한적',
    template: '"{content}"\n— {speaker}',
    description: '화자가 명시된 인용구. 전문가/지인의 말을 빌리는 형태',
  },
  {
    id: 'line_dating',
    name: '라인&데이팅',
    template: '───\n"{content}"\n— {date}\n───',
    description: '구분선 + 날짜가 함께 표시. 강조형 인용구',
  },
  {
    id: 'postit',
    name: '포스트잇',
    template: '📌 {content}',
    description: '포스트잇/메모 스타일. 핵심 내용을 간결하게 강조',
  },
  {
    id: 'frame',
    name: '프레임',
    template: '┌───────────────┐\n  {content}\n└───────────────┘',
    description: '텍스트 프레임으로 감싼 인용구. 시각적으로 독립된 강조 블록',
  },
]
