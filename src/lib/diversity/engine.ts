import { CATEGORIES } from '@/lib/layers/categories'
import { getTypesByCategory } from '@/lib/layers/types'
import {
  SLOT_A_AGE, SLOT_B_GENDER, SLOT_C_LIFE_STAGE,
  SLOT_D_OCCUPATION, SLOT_E_INSURANCE_STATUS,
  SLOT_F_ECONOMIC, SLOT_G_WRITING_EXP, SLOT_H_CURRENT_STATE,
  SLOT_I_COGNITION_PATH,
} from '@/lib/layers/subjects'
import {
  VAR1_WRITING_STYLE, VAR2_FORMALITY, VAR3_EMOTION_EXPRESSION,
  VAR4_SPELLING, VAR6_BRAND_MENTION, VAR7_CONTENT_LENGTH,
  VAR8_PERSONAL_DISCLOSURE,
} from '@/lib/layers/personas'
import { TITLE_STRUCTURES, TITLE_BADA_POSITIONS, TITLE_TONES, TITLE_HOOKS } from '@/lib/layers/titles'
import { QUOTE_TYPES } from '@/lib/layers/quotes'
import { MEDICAL_MATERIAL_CATEGORIES, NON_MEDICAL_MATERIAL_CATEGORIES } from '@/lib/layers/materials'
import { validatePersonaCombination } from './validator'
import type { GenerateSettings } from '@/stores/generateStore'
import type { ManuscriptCategory, PersonaSlots, PersonaVariables } from '@/types/manuscript'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickValue<T extends { value: string }>(arr: T[]): string {
  return pick(arr).value
}

export function resolveCategory(settings: GenerateSettings): { category: ManuscriptCategory; typeId: string } {
  if (settings.category === 'random' || !settings.category) {
    const cat = pick(CATEGORIES)
    const types = getTypesByCategory(cat.id)
    const type = pick(types)
    return { category: cat.id as ManuscriptCategory, typeId: type.id }
  }
  if (!settings.typeId) {
    const types = getTypesByCategory(settings.category)
    return { category: settings.category, typeId: pick(types).id }
  }
  return { category: settings.category, typeId: settings.typeId }
}

export function resolveMaterial(settings: GenerateSettings): { mode: string; category?: string; specific?: string } {
  if (settings.material.mode === 'category') {
    if (settings.material.category === '_medical_random') {
      return { mode: 'category', category: pick(MEDICAL_MATERIAL_CATEGORIES).id }
    }
    if (settings.material.category === '_non_medical_random') {
      return { mode: 'category', category: pick(NON_MEDICAL_MATERIAL_CATEGORIES).id }
    }
    return settings.material
  }
  if (settings.material.mode !== 'auto') return settings.material

  const roll = Math.random()
  if (roll < 0.15) return { mode: 'unused' }
  if (roll < 0.55) return { mode: 'category', category: pick(NON_MEDICAL_MATERIAL_CATEGORIES).id }
  return { mode: 'category', category: pick(MEDICAL_MATERIAL_CATEGORIES).id }
}

/** 주체자 슬롯 전체 랜덤 + 비현실적 조합 필터 (최대 10회 재시도) */
export function resolvePersona(): PersonaSlots {
  for (let attempt = 0; attempt < 10; attempt++) {
    const persona: PersonaSlots = {
      slotA: pickValue(SLOT_A_AGE),
      slotB: pickValue(SLOT_B_GENDER),
      slotC: pickValue(SLOT_C_LIFE_STAGE),
      slotD: pick(SLOT_D_OCCUPATION),
      slotE: pickValue(SLOT_E_INSURANCE_STATUS),
      slotF: pickValue(SLOT_F_ECONOMIC),
      slotG: pickValue(SLOT_G_WRITING_EXP),
      slotH: pickValue(SLOT_H_CURRENT_STATE),
      slotI: pickValue(SLOT_I_COGNITION_PATH),
    }
    const validation = validatePersonaCombination(persona)
    if (validation.valid) return persona
  }
  // 10회 실패 시 안전한 기본값
  return {
    slotA: '30s', slotB: 'female', slotC: 'infant',
    slotD: '직장인 (중소기업)', slotE: 'reviewing',
    slotF: 'stable', slotG: 'sns_casual', slotH: 'curious',
    slotI: 'naver_search',
  }
}

export function resolveVariables(settings: GenerateSettings): PersonaVariables {
  const var7 = settings.variables.var7 || pickValue(VAR7_CONTENT_LENGTH)
  return {
    var1: pickValue(VAR1_WRITING_STYLE),
    var2: pickValue(VAR2_FORMALITY),
    var3: pickValue(VAR3_EMOTION_EXPRESSION),
    var4: pickValue(VAR4_SPELLING),
    var6: pickValue(VAR6_BRAND_MENTION),
    var7,
    var8: pickValue(VAR8_PERSONAL_DISCLOSURE),
  }
}

/** 제목 설정 랜덤 */
export function resolveTitleSettings(): {
  structureId: string
  badaPosition: string
  toneId: string
  hookId: string
} {
  return {
    structureId: pick(TITLE_STRUCTURES).id,
    badaPosition: pick(TITLE_BADA_POSITIONS).id,
    toneId: pick(TITLE_TONES).id,
    hookId: pick(TITLE_HOOKS).id,
  }
}

/** 인용구 설정 랜덤 (0~3개) */
export function resolveQuoteSettings(): { typeId: string; count: number } {
  const count = Math.floor(Math.random() * 4) // 0~3개
  return {
    typeId: count > 0 ? pick(QUOTE_TYPES).id : 'none',
    count,
  }
}

export function resolveAppealPoint(current: string): string {
  if (current) return current
  const points = ['cost', 'benefit', 'method', 'trust', 'comparison', 'urgency', 'convenience', 'experience']
  return pick(points)
}

/** 전체 설정을 확정된 값으로 변환 */
export function resolveAllSettings(settings: GenerateSettings): GenerateSettings {
  const { category, typeId } = resolveCategory(settings)
  const material = resolveMaterial(settings)
  const persona = resolvePersona()
  const variables = resolveVariables(settings)
  const appealPoint = resolveAppealPoint(settings.appealPoint || '')
  const titleConfig = resolveTitleSettings()
  const quoteConfig = resolveQuoteSettings()

  const lengthMap: Record<string, { min: number; max: number }> = {
    short: { min: 500, max: 800 },
    mid: { min: 800, max: 1500 },
    long: { min: 1500, max: 2500 },
    extra_long: { min: 2500, max: 4000 },
  }

  return {
    ...settings,
    category,
    typeId,
    material: { mode: material.mode as 'auto' | 'unused' | 'category' | 'specific', category: material.category, specific: material.specific },
    persona,
    personaMode: 'random',
    variables,
    appealPoint: appealPoint as never,
    wordCount: lengthMap[variables.var7 ?? 'mid'] ?? settings.wordCount,
    titleSettings: {
      structureId: titleConfig.structureId,
      badaPosition: titleConfig.badaPosition as 'front' | 'middle' | 'back' | 'auto',
      charCount: 'mid',
    },
  }
}
