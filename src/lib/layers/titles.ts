// 레이어: 제목 모듈 상수

export interface TitleStructure {
  id: string
  name: string
  pattern: string
  example: string
}

export interface TitleBadaPosition {
  id: 'front' | 'middle' | 'back'
  name: string
  description: string
}

export interface TitleTone {
  id: string
  name: string
  description: string
}

export interface TitleHook {
  id: string
  name: string
  description: string
}

// ─── 제목 구조 15가지 ───
export const TITLE_STRUCTURES: TitleStructure[] = [
  { id: 'numeric',     name: '숫자형',   pattern: 'N가지 ~',            example: '보험 가입 전 꼭 확인해야 할 5가지' },
  { id: 'question',    name: '질문형',   pattern: '~했나요?',           example: '혹시 내 보험, 제대로 가입했나요?' },
  { id: 'method',      name: '방법형',   pattern: '~하는 법',           example: '보험료 절약하는 법' },
  { id: 'howto',       name: 'How-to형', pattern: '~하는 방법/노하우',   example: '실비보험 100% 활용하는 방법' },
  { id: 'comparison',  name: '비교형',   pattern: 'A vs B / A와 B 차이', example: '종신보험 vs 정기보험, 뭐가 나을까' },
  { id: 'warning',     name: '경고형',   pattern: '~하면 큰일!',         example: '이것 모르고 가입하면 큰일납니다' },
  { id: 'list',        name: '리스트형', pattern: '~ 총정리/모음',       example: '2026년 달라지는 보험 제도 총정리' },
  { id: 'reason',      name: '이유형',   pattern: '~인 이유',           example: '30대에 보험이 중요한 이유' },
  { id: 'secret',      name: '비밀형',   pattern: '~가 알려주지 않는',   example: '보험설계사가 알려주지 않는 진실' },
  { id: 'result',      name: '결과형',   pattern: '~한 결과/후기',      example: '실손보험 청구해본 결과' },
  { id: 'time',        name: '시간형',   pattern: '~전에/후에/때',      example: '40대 되기 전에 꼭 준비해야 할 보험' },
  { id: 'target',      name: '대상형',   pattern: '~를 위한',           example: '사회초년생을 위한 보험 가이드' },
  { id: 'reversal',    name: '반전형',   pattern: '~인 줄 알았는데',     example: '필요 없다고 생각했는데 알고 보니' },
  { id: 'emotional',   name: '감성형',   pattern: '~이야기/일기',       example: '아이가 태어나고 처음 든 생각' },
  { id: 'info',        name: '정보형',   pattern: '~안내/가이드/정리',   example: '암보험 가입 시 체크포인트 안내' },
]

// ─── 더바다 배치 3가지 ───
export const TITLE_BADA_POSITIONS: TitleBadaPosition[] = [
  { id: 'front',  name: '앞',   description: '더바다를 제목 앞에 배치' },
  { id: 'middle', name: '중간', description: '더바다를 제목 중간에 배치' },
  { id: 'back',   name: '뒤',   description: '더바다를 제목 뒤에 배치' },
]

// ─── 말투 8가지 ───
export const TITLE_TONES: TitleTone[] = [
  { id: 'friendly',     name: '친근',   description: '가까운 지인에게 말하듯 편안하고 다정한 톤' },
  { id: 'professional', name: '전문',   description: '전문가로서 신뢰감을 주는 차분하고 정확한 톤' },
  { id: 'curious',      name: '궁금',   description: '독자의 호기심을 자극하는 질문형/의문형 톤' },
  { id: 'shock',        name: '충격',   description: '놀라운 사실을 전달하며 시선을 끄는 강렬한 톤' },
  { id: 'emotional',    name: '감성',   description: '감정에 호소하는 따뜻하고 서정적인 톤' },
  { id: 'humor',        name: '유머',   description: '가볍고 재치 있는 위트가 담긴 톤' },
  { id: 'serious',      name: '진지',   description: '무게감 있고 진중한 메시지를 전달하는 톤' },
  { id: 'challenge',    name: '도전',   description: '독자에게 행동을 촉구하는 도전적인 톤' },
]

// ─── 훅킹 6가지 ───
export const TITLE_HOOKS: TitleHook[] = [
  { id: 'fear',      name: '공포',   description: '불안과 위험을 강조하여 주의를 환기' },
  { id: 'curiosity', name: '호기심', description: '궁금증을 유발하여 클릭을 유도' },
  { id: 'benefit',   name: '이익',   description: '독자가 얻을 수 있는 혜택/이점을 강조' },
  { id: 'urgency',   name: '긴급',   description: '시간적 촉박함으로 즉시 행동을 유도' },
  { id: 'empathy',   name: '공감',   description: '독자의 상황에 공감하며 감정적 연결' },
  { id: 'authority',  name: '권위',   description: '전문성과 신뢰를 바탕으로 설득' },
]
