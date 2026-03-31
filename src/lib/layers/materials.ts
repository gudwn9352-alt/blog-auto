// 레이어 3: 소재 카테고리

export const MEDICAL_MATERIAL_CATEGORIES = [
  { id: 'cancer', name: '암/암수술' },
  { id: 'cardio', name: '심장/혈관' },
  { id: 'dental', name: '치과' },
  { id: 'eye', name: '안과' },
  { id: 'ob_gyn', name: '산부인과/출산' },
  { id: 'orthopedic', name: '정형외과/근골격' },
  { id: 'internal', name: '내과/소화기' },
  { id: 'dermatology', name: '피부과' },
  { id: 'ent', name: '이비인후과' },
  { id: 'diabetes', name: '당뇨기과' },
  { id: 'mental_health', name: '정신건강' },
  { id: 'health_checkup', name: '건강검진/검사' },
  { id: 'accident_emergency', name: '사고/응급' },
  { id: 'prevention_alternative', name: '예방/대체의학' },
  { id: 'medication', name: '약/처방' },
]

export const NON_MEDICAL_MATERIAL_CATEGORIES = [
  { id: 'finance_debt', name: '재정/빚' },
  { id: 'life_change', name: '생애변화' },
  { id: 'laziness_neglect', name: '귀찮음/방치' },
  { id: 'family', name: '가족' },
  { id: 'insurance_management', name: '보험 정리' },
  { id: 'goal_resolution', name: '목표/결심' },
]

export const MATERIAL_SCOPE_TERMS = [
  '질병/질환', '수술/시술', '증상', '검사', '치료',
  '사고/사망', '처방/약',
]

export const ALL_MATERIAL_CATEGORIES = [
  ...MEDICAL_MATERIAL_CATEGORIES,
  ...NON_MEDICAL_MATERIAL_CATEGORIES,
]
