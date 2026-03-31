// 브랜드 트랙 (CEO 승인 플로우)

/**
 * 브랜드 트랙 허용 카테고리
 * 정보형(B), 이슈형(D), 심층분석형(F), 고객사례 소개형
 */
export const BRAND_TRACK_CATEGORIES = [
  { id: 'B', name: '정보형' },
  { id: 'D', name: '이슈형' },
  { id: 'F', name: '심층분석형' },
  { id: 'customer_case', name: '고객사례 소개형' },
] as const

/**
 * 브랜드 노출 수준
 */
export const BRAND_EXPOSURE_LEVELS = [
  {
    id: 'low',
    name: '은근한 노출',
    description: '브랜드명 직접 언급 없이 간접적으로 존재감을 드러냄. 자연스러운 맥락 속에서 브랜드가 스며드는 방식.',
  },
  {
    id: 'mid',
    name: '중간 노출',
    description: '본문 중후반부에 브랜드명을 1~2회 자연스럽게 언급. 정보 제공 흐름 속에서 솔루션으로 등장.',
  },
  {
    id: 'high',
    name: '강한 노출',
    description: '브랜드명을 적극적으로 노출하며, CTA(행동유도)를 포함. 브랜드 혜택과 차별점을 명시적으로 전달.',
  },
] as const

/**
 * CEO 승인 필요 여부 판단
 *
 * - 경험형(A) / 공감형(C)에서 high 노출이면 승인 필요
 * - 그 외 조합은 승인 불필요
 */
export function needsBrandApproval(
  category: string,
  brandMentionLevel: string,
): boolean {
  const sensitiveCategories = ['A', 'C']
  return sensitiveCategories.includes(category) && brandMentionLevel === 'high'
}
