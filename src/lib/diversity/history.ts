// 중복 방지 3레벨 체크

import type { Manuscript, PersonaSlots } from '@/types/manuscript'

interface DuplicationResult {
  duplicate: boolean
  level: number
  reason?: string
}

interface NewSettings {
  category?: string
  typeId?: string
  persona?: PersonaSlots
  material?: {
    mode?: string
    category?: string
    specific?: string
  }
}

/**
 * 최근 N개 원고 이력과 비교하여 중복 여부를 3레벨로 체크
 *
 * 레벨 1: 같은 카테고리+유형 연속 금지 (직전 1개)
 * 레벨 2: 같은 주체자 슬롯 조합 5개 이내 중복 금지
 * 레벨 3: 같은 소재 카테고리 3개 이내 중복 금지
 */
export function checkDuplication(
  newSettings: NewSettings,
  recentManuscripts: Manuscript[],
): DuplicationResult {
  // 이력이 없으면 중복 아님
  if (!recentManuscripts || recentManuscripts.length === 0) {
    return { duplicate: false, level: 0 }
  }

  // ── 레벨 1: 같은 카테고리+유형 연속 금지 ──
  const latest = recentManuscripts[0]
  if (
    latest &&
    newSettings.category &&
    newSettings.typeId &&
    latest.category === newSettings.category &&
    latest.typeId === newSettings.typeId
  ) {
    return {
      duplicate: true,
      level: 1,
      reason: `직전 원고와 같은 카테고리(${newSettings.category})+유형(${newSettings.typeId}) 조합입니다. 연속 사용이 금지됩니다.`,
    }
  }

  // ── 레벨 2: 같은 주체자 슬롯 조합 5개 이내 중복 금지 ──
  if (newSettings.persona) {
    const recent5 = recentManuscripts.slice(0, 5)
    const matchIndex = recent5.findIndex((m) => isSamePersona(m.persona, newSettings.persona))
    if (matchIndex !== -1) {
      return {
        duplicate: true,
        level: 2,
        reason: `최근 5개 원고 중 ${matchIndex + 1}번째 전 원고와 동일한 주체자 슬롯 조합입니다.`,
      }
    }
  }

  // ── 레벨 3: 같은 소재 카테고리 3개 이내 중복 금지 ──
  if (newSettings.material?.category) {
    const recent3 = recentManuscripts.slice(0, 3)
    const matchIndex = recent3.findIndex(
      (m) => m.materialSettings?.category === newSettings.material?.category,
    )
    if (matchIndex !== -1) {
      return {
        duplicate: true,
        level: 3,
        reason: `최근 3개 원고 중 ${matchIndex + 1}번째 전 원고와 같은 소재 카테고리(${newSettings.material.category})입니다.`,
      }
    }
  }

  return { duplicate: false, level: 0 }
}

/** 두 PersonaSlots가 동일한지 비교 (모든 슬롯 일치) */
function isSamePersona(a?: PersonaSlots, b?: PersonaSlots): boolean {
  if (!a || !b) return false
  return (
    a.slotA === b.slotA &&
    a.slotB === b.slotB &&
    a.slotC === b.slotC &&
    a.slotD === b.slotD &&
    a.slotE === b.slotE &&
    a.slotF === b.slotF &&
    a.slotG === b.slotG &&
    a.slotH === b.slotH &&
    a.slotI === b.slotI
  )
}
