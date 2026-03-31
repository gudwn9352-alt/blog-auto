export type TextRequired = 'required' | 'optional' | 'none'

export interface ImageType {
  id: string
  groupId: number
  groupName: string
  name: string
  textRequired: TextRequired
}

export interface ImageGroup {
  id: number
  name: string
}

export const IMAGE_GROUPS: ImageGroup[] = [
  { id: 1, name: '인물 기반' },
  { id: 2, name: '일러스트/그래픽' },
  { id: 3, name: '카드뉴스/인포그래픽' },
  { id: 4, name: '사물/제품' },
  { id: 5, name: '감성/분위기' },
  { id: 6, name: '애니메이션/캐릭터' },
]

export const IMAGE_TYPES: ImageType[] = [
  // ─── 1. 인물 기반 (4개) ──────────────────────────────────────────────────
  { id: '1-1', groupId: 1, groupName: '인물 기반', name: '중심형 인물(정면)',    textRequired: 'optional' },
  { id: '1-2', groupId: 1, groupName: '인물 기반', name: '중심형 인물(상황)',    textRequired: 'optional' },
  { id: '1-3', groupId: 1, groupName: '인물 기반', name: '중심형 손/부분',       textRequired: 'optional' },
  { id: '1-4', groupId: 1, groupName: '인물 기반', name: '중심형 2인 이상',      textRequired: 'optional' },

  // ─── 2. 일러스트/그래픽 (5개) ────────────────────────────────────────────
  { id: '2-1', groupId: 2, groupName: '일러스트/그래픽', name: '플랫 일러스트(인물)', textRequired: 'optional' },
  { id: '2-2', groupId: 2, groupName: '일러스트/그래픽', name: '플랫 일러스트(사물)', textRequired: 'optional' },
  { id: '2-3', groupId: 2, groupName: '일러스트/그래픽', name: '아이소메트릭',        textRequired: 'optional' },
  { id: '2-4', groupId: 2, groupName: '일러스트/그래픽', name: '아이콘 조합형',       textRequired: 'optional' },
  { id: '2-5', groupId: 2, groupName: '일러스트/그래픽', name: '미니멈 그래픽',       textRequired: 'optional' },

  // ─── 3. 카드뉴스/인포그래픽 (7개) ───────────────────────────────────────
  { id: '3-1', groupId: 3, groupName: '카드뉴스/인포그래픽', name: '카드뉴스(단일)',    textRequired: 'required' },
  { id: '3-2', groupId: 3, groupName: '카드뉴스/인포그래픽', name: '숫자 강조 카드',    textRequired: 'required' },
  { id: '3-3', groupId: 3, groupName: '카드뉴스/인포그래픽', name: '비교 카드',         textRequired: 'required' },
  { id: '3-4', groupId: 3, groupName: '카드뉴스/인포그래픽', name: '체크리스트 카드',   textRequired: 'required' },
  { id: '3-5', groupId: 3, groupName: '카드뉴스/인포그래픽', name: '타임라인 카드',     textRequired: 'required' },
  { id: '3-6', groupId: 3, groupName: '카드뉴스/인포그래픽', name: '통계/데이터 카드',  textRequired: 'required' },
  { id: '3-7', groupId: 3, groupName: '카드뉴스/인포그래픽', name: '인용구 카드',       textRequired: 'required' },

  // ─── 4. 사물/제품 (4개) ──────────────────────────────────────────────────
  { id: '4-1', groupId: 4, groupName: '사물/제품', name: '스마트폰 화면', textRequired: 'optional' },
  { id: '4-2', groupId: 4, groupName: '사물/제품', name: '서류/문서',     textRequired: 'optional' },
  { id: '4-3', groupId: 4, groupName: '사물/제품', name: '통장/카드',     textRequired: 'optional' },
  { id: '4-4', groupId: 4, groupName: '사물/제품', name: '생활 사물',     textRequired: 'optional' },

  // ─── 5. 감성/분위기 (3개) ────────────────────────────────────────────────
  { id: '5-1', groupId: 5, groupName: '감성/분위기', name: '감성 배경+텍스트',  textRequired: 'required' },
  { id: '5-2', groupId: 5, groupName: '감성/분위기', name: '감성 사진형',       textRequired: 'none' },
  { id: '5-3', groupId: 5, groupName: '감성/분위기', name: '텍스처/패턴 배경',  textRequired: 'required' },

  // ─── 6. 애니메이션/캐릭터 (1개) ──────────────────────────────────────────
  { id: '6-1', groupId: 6, groupName: '애니메이션/캐릭터', name: '귀여운 캐릭터', textRequired: 'optional' },
]

export function getImageTypesByGroup(groupId: number): ImageType[] {
  return IMAGE_TYPES.filter((t) => t.groupId === groupId)
}
