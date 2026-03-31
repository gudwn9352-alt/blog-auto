// 타인 호칭 표현 풀

export interface HonorificPool {
  age: string
  gender: string
  options: string[]
}

/** 연령대/성별별 사용 가능한 호칭 풀 */
export const HONORIFIC_POOLS: HonorificPool[] = [
  // 20대 여성
  { age: '20s_early', gender: 'female', options: ['언니', '이웃', '지인', '아는 분', '동갑내기', '같은 동네 사는 분'] },
  { age: '20s_late', gender: 'female', options: ['언니', '이웃', '지인', '아는 분', '같은 동네 사는 분', '옆집 분'] },
  // 20대 남성
  { age: '20s_early', gender: 'male', options: ['형', '이웃', '지인', '아는 분', '동갑내기', '같은 동네 사는 분'] },
  { age: '20s_late', gender: 'male', options: ['형', '이웃', '지인', '아는 분', '같은 동네 사는 분', '옆집 분'] },
  // 30대
  { age: '30s', gender: 'female', options: ['언니', '이웃', '지인', '아는 분', '옆집 분', '같은 아파트 주민', '맘카페 분', '동네 엄마'] },
  { age: '30s', gender: 'male', options: ['형', '이웃', '지인', '아는 분', '옆집 분', '같은 아파트 주민', '동네 아빠'] },
  // 40대
  { age: '40s', gender: 'female', options: ['언니', '이웃', '지인', '아는 분', '옆집 분', '같은 아파트 주민', '학부모', '동네 엄마', '맘카페 분'] },
  { age: '40s', gender: 'male', options: ['형', '이웃', '지인', '아는 분', '옆집 분', '같은 아파트 주민', '학부모 아빠'] },
  // 50대
  { age: '50s', gender: 'female', options: ['언니', '이웃', '지인', '아는 분', '옆집 분', '같은 아파트 주민', '동네 분'] },
  { age: '50s', gender: 'male', options: ['형', '이웃', '지인', '아는 분', '옆집 분', '같은 아파트 주민', '동네 분'] },
]

/** AI 특유의 금지 호칭 목록 */
export const FORBIDDEN_HONORIFICS: string[] = [
  '직장 동료',
  '친한 친구',
  '배우자',
  '선배',
  '어머니',
  '아버지',
  '남편',
  '아내',
  '친구',
  '동료',
  '후배',
  '제 친구',
  '우리 엄마',
  '우리 아빠',
  '시어머니',
  '장모님',
  '형수',
  '올케',
  '사촌',
  '삼촌',
  '이모',
  '고모',
]

/**
 * 연령대, 성별, 문체 격식도에 맞는 호칭을 반환
 * @param age - 연령대 (예: '20s_early', '30s', '40s', '50s')
 * @param gender - 성별 ('male' | 'female')
 * @param formality - 문체 격식도 ('very_formal' | 'formal' | 'semi_casual' | 'casual' | 'very_casual')
 */
export function getHonorific(age: string, gender: string, formality: string): string {
  // 해당 연령대/성별 풀 찾기
  let pool = HONORIFIC_POOLS.find((p) => p.age === age && p.gender === gender)

  // 정확한 매칭이 없으면 연령대만으로 찾기 (성별 무관)
  if (!pool) {
    pool = HONORIFIC_POOLS.find((p) => p.age === age)
  }

  // 그래도 없으면 기본 풀 사용
  const options = pool?.options ?? ['이웃', '지인', '아는 분']

  // 격식도에 따라 필터링
  if (formality === 'very_formal' || formality === 'formal') {
    // 격식체에서는 존칭 느낌의 호칭 우선
    const formalOptions = options.filter(
      (o) => o.includes('분') || o.includes('주민') || o.includes('학부모'),
    )
    if (formalOptions.length > 0) {
      return formalOptions[Math.floor(Math.random() * formalOptions.length)]
    }
  }

  if (formality === 'very_casual' || formality === 'casual') {
    // 반말체에서는 친근한 호칭 우선
    const casualOptions = options.filter(
      (o) => o === '언니' || o === '형' || o === '동갑내기' || o.includes('동네'),
    )
    if (casualOptions.length > 0) {
      return casualOptions[Math.floor(Math.random() * casualOptions.length)]
    }
  }

  // 기본: 랜덤 선택
  return options[Math.floor(Math.random() * options.length)]
}
