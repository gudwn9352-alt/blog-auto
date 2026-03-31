// 비현실적 주체자 슬롯 조합 필터

import type { PersonaSlots } from '@/types/manuscript'

interface ValidationResult {
  valid: boolean
  reason?: string
}

/** 주체자 슬롯 조합이 비현실적인지 검증 */
export function validatePersonaCombination(persona: PersonaSlots): ValidationResult {
  const { slotA, slotC, slotD, slotF } = persona

  // ── 20대 초반 + 은퇴자/자녀독립/노년 ──
  if (slotA === '20s_early') {
    if (slotC === 'empty_nest') {
      return { valid: false, reason: '20대 초반은 자녀 독립 후 단계에 해당할 수 없습니다.' }
    }
    if (slotC === 'elderly') {
      return { valid: false, reason: '20대 초반은 노년 단계에 해당할 수 없습니다.' }
    }
    if (slotD === '은퇴자') {
      return { valid: false, reason: '20대 초반 은퇴자는 비현실적 조합입니다.' }
    }
    if (slotC === 'adult_child') {
      return { valid: false, reason: '20대 초반에 대학생/성인 자녀를 둘 수 없습니다.' }
    }
    if (slotC === 'teen_child') {
      return { valid: false, reason: '20대 초반에 중고등 자녀를 둘 수 없습니다.' }
    }
    if (slotC === 'school_child') {
      return { valid: false, reason: '20대 초반에 초등 자녀를 둘 수 없습니다.' }
    }
  }

  // ── 20대 후반 제한 ──
  if (slotA === '20s_late') {
    if (slotC === 'empty_nest') {
      return { valid: false, reason: '20대 후반은 자녀 독립 후 단계에 해당할 수 없습니다.' }
    }
    if (slotC === 'elderly') {
      return { valid: false, reason: '20대 후반은 노년 단계에 해당할 수 없습니다.' }
    }
    if (slotD === '은퇴자') {
      return { valid: false, reason: '20대 후반 은퇴자는 비현실적 조합입니다.' }
    }
    if (slotC === 'adult_child') {
      return { valid: false, reason: '20대 후반에 대학생/성인 자녀를 둘 수 없습니다.' }
    }
    if (slotC === 'teen_child') {
      return { valid: false, reason: '20대 후반에 중고등 자녀를 둘 수 없습니다.' }
    }
  }

  // ── 50대 + 대학생 ──
  if (slotA === '50s') {
    if (slotD === '학생 (대학생)') {
      return { valid: false, reason: '50대 대학생은 비현실적 조합입니다.' }
    }
  }

  // ── 20대 + 대학원생 + 고소득 ──
  if ((slotA === '20s_early' || slotA === '20s_late') && slotD === '학생 (대학원생)' && slotF === 'high_income') {
    return { valid: false, reason: '20대 대학원생이 고소득층인 것은 비현실적 조합입니다.' }
  }

  // ── 미혼/독립 + 대학생 자녀/성인 자녀 ──
  if (slotC === 'single') {
    // 미혼인데 자녀 관련 생애 단계는 직접 조합 불가이므로 다른 슬롯으로는 발생하지 않지만,
    // 혹시 다른 생애 단계가 동시에 설정되는 경우를 대비
    // (PersonaSlots에서 slotC 하나로 관리되므로 구조적으로 방지되지만, 안전 검증)
  }

  // ── 학생(대학생/대학원생) + 고소득층 ──
  if ((slotD === '학생 (대학생)' || slotD === '학생 (대학원생)') && slotF === 'high_income') {
    return { valid: false, reason: '학생이 고소득층인 것은 비현실적 조합입니다.' }
  }

  // ── 학생(대학생) + 자녀가 있는 생애 단계 ──
  if (slotD === '학생 (대학생)') {
    if (slotC === 'infant' || slotC === 'school_child' || slotC === 'teen_child' || slotC === 'adult_child') {
      return { valid: false, reason: '대학생이 자녀를 둔 것은 비현실적 조합입니다.' }
    }
    if (slotC === 'empty_nest' || slotC === 'elderly') {
      return { valid: false, reason: '대학생이 자녀 독립/노년 단계인 것은 비현실적 조합입니다.' }
    }
  }

  // ── 40대/50대 + 대학원생 + 고소득 ──
  // (40대 이상 대학원생 고소득은 가능하므로 패스)

  // ── 임원/경영진 + 20대 초반 ──
  if (slotA === '20s_early' && (slotD === '임원·경영진' || slotD === '중간관리자 (팀장급)')) {
    return { valid: false, reason: '20대 초반에 임원/팀장급은 비현실적 조합입니다.' }
  }

  // ── 파트타임/아르바이트 + 고소득 ──
  if (slotD === '파트타임·아르바이트' && slotF === 'high_income') {
    return { valid: false, reason: '파트타임/아르바이트 근무자가 고소득층인 것은 비현실적 조합입니다.' }
  }

  // ── 무직/구직 중 + 고소득 ──
  if (slotD === '무직·구직 중' && slotF === 'high_income') {
    return { valid: false, reason: '무직/구직 중인 사람이 고소득층인 것은 비현실적 조합입니다.' }
  }

  return { valid: true }
}
