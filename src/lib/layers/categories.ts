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
