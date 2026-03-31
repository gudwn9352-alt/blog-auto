// 의료 소재 상세: 표현 타입 및 검증 레벨

/** 의료 표현 타입 5가지 */
export const MEDICAL_EXPRESSION_TYPES = [
  {
    id: 'professional',
    label: '전문',
    description: '의학 용어를 정확하게 사용 (예: 급성심근경색, 관상동맥중재술)',
  },
  {
    id: 'everyday',
    label: '일상',
    description: '일반인이 이해하기 쉬운 표현 (예: 심장마비, 심장 시술)',
  },
  {
    id: 'ambiguous',
    label: '애매',
    description: '전문/일상 중간 수준 (예: 심근경색, 심장 수술)',
  },
  {
    id: 'combined',
    label: '병기',
    description: '전문 용어와 일상 표현을 함께 사용 (예: 심근경색(심장마비))',
  },
  {
    id: 'abbreviated',
    label: '약식',
    description: '줄임말/약어 사용 (예: MI, PCI)',
  },
] as const

export type MedicalExpressionType = (typeof MEDICAL_EXPRESSION_TYPES)[number]['id']

/** 검증 3단계 */
export const MEDICAL_VERIFICATION_LEVELS = [
  {
    level: 1,
    id: 'blocked',
    label: '사용금지',
    description: '자동 반려 - 해당 소재가 포함되면 원고가 자동으로 반려됩니다.',
    action: 'auto_reject' as const,
  },
  {
    level: 2,
    id: 'caution',
    label: '사용주의',
    description: '사용자 검토 필요 - 해당 소재 사용 시 사용자에게 확인을 요청합니다.',
    action: 'user_review' as const,
  },
  {
    level: 3,
    id: 'verified',
    label: '검증완료',
    description: '자동 통과 - 검증이 완료되어 별도 확인 없이 사용 가능합니다.',
    action: 'auto_pass' as const,
  },
] as const

export type MedicalVerificationLevel = (typeof MEDICAL_VERIFICATION_LEVELS)[number]['id']

/** 기본 사용금지 소재 목록 (level 1: 자동반려) */
export const BLOCKED_MEDICAL_MATERIALS: string[] = [
  // 자살/자해 관련
  '자살',
  '자해',
  '자살 시도',
  '자살 충동',
  '극단적 선택',
  '목숨을 끊',
  '스스로 목숨',
  // 약물 오남용
  '약물 남용',
  '마약',
  '약물 중독',
  '본드 흡입',
  // 성적 관련 의료
  '성병',
  '성관계',
  '성적 기능',
  // 극단적/선정적 표현
  '사체',
  '시체',
  '부검',
  '해부',
  // 민감 정신건강
  '조현병',
  '정신분열',
  '다중인격',
]

/** 기본 사용주의 소재 목록 (level 2: 사용자 검토) */
export const CAUTION_MEDICAL_MATERIALS: string[] = [
  // 정신건강 일반
  '우울증',
  '불안장애',
  '공황장애',
  '수면장애',
  '불면증',
  'ADHD',
  '섭식장애',
  // 중증 질환
  '말기암',
  '호스피스',
  '여명',
  '시한부',
  // 민감 시술
  '성형수술',
  '미용시술',
  '지방흡입',
  // 임신/출산 관련 민감 사안
  '유산',
  '사산',
  '불임',
  '난임',
]

/** 소재의 검증 레벨을 판단 */
export function getMedicalVerificationLevel(material: string): MedicalVerificationLevel {
  const normalized = material.trim()

  if (BLOCKED_MEDICAL_MATERIALS.some((blocked) => normalized.includes(blocked))) {
    return 'blocked'
  }

  if (CAUTION_MEDICAL_MATERIALS.some((caution) => normalized.includes(caution))) {
    return 'caution'
  }

  return 'verified'
}

/** 소재 목록에서 검증 레벨별로 분류 */
export function classifyMedicalMaterials(materials: string[]): {
  blocked: string[]
  caution: string[]
  verified: string[]
} {
  const result = { blocked: [] as string[], caution: [] as string[], verified: [] as string[] }

  for (const m of materials) {
    const level = getMedicalVerificationLevel(m)
    result[level].push(m)
  }

  return result
}
