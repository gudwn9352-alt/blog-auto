import type { Category } from '@/types/layers'

export const CATEGORIES: Category[] = [
  {
    id: 'A',
    name: '경험형',
    typeCount: 30,
    coreHook: '나 해봤어',
    brandExposure: 'strong',
    role: '신뢰',
  },
  {
    id: 'B',
    name: '정보형',
    typeCount: 15,
    coreHook: '알려드림',
    brandExposure: 'medium',
    role: '검색 유입',
  },
  {
    id: 'C',
    name: '공감형',
    typeCount: 9,
    coreHook: '맞죠 공감',
    brandExposure: 'weak',
    role: '팔로우 유도',
  },
  {
    id: 'D',
    name: '이슈형',
    typeCount: 7,
    coreHook: '이거 보셨어요',
    brandExposure: 'medium',
    role: '글자수 유입',
  },
  {
    id: 'E',
    name: '의견형',
    typeCount: 7,
    coreHook: '내 생각은',
    brandExposure: 'medium',
    role: '권위 구축',
  },
  {
    id: 'F',
    name: '심층분석형',
    typeCount: 10,
    coreHook: '파헤보니까',
    brandExposure: 'medium',
    role: '전문성·체류시간',
  },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// 브랜드 원고 전용 카테고리
export const BRAND_CATEGORIES: Category[] = [
  {
    id: 'B',
    name: '정보형',
    typeCount: 15,
    coreHook: '알려드림',
    brandExposure: 'strong',
    role: '공식 안내',
  },
  {
    id: 'D',
    name: '이슈형',
    typeCount: 7,
    coreHook: '업계 소식',
    brandExposure: 'strong',
    role: '업계 소식',
  },
  {
    id: 'F',
    name: '심층분석형',
    typeCount: 10,
    coreHook: '전문 분석',
    brandExposure: 'strong',
    role: '전문성',
  },
  {
    id: 'G',
    name: '고객후기 사례',
    typeCount: 5,
    coreHook: '고객님 사례',
    brandExposure: 'strong',
    role: '신뢰·공감',
  },
  {
    id: 'H',
    name: '환급 과정',
    typeCount: 5,
    coreHook: '이렇게 받았어요',
    brandExposure: 'strong',
    role: '전환 유도',
  },
]

export const BRAND_CATEGORY_MAP = Object.fromEntries(BRAND_CATEGORIES.map((c) => [c.id, c]))

// 제3자 원고에서 사용 불가 카테고리
export const THIRD_PARTY_BLOCKED = ['G', 'H']

// 브랜드 원고에서 사용 불가 카테고리
export const BRAND_BLOCKED = ['A', 'C', 'E']
