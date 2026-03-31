// 의료 소재 자동 중복 방지

interface ManuscriptWithMaterial {
  materialSettings?: {
    category?: string
    specific?: string
  }
}

interface MaterialDuplicationResult {
  duplicate: boolean
  reason?: string
}

/**
 * 소재 중복 방지 체크
 *
 * 규칙:
 * - 같은 소재 카테고리: 최근 3개 이내 중복 금지
 * - 같은 구체 소재(specific): 최근 20개 이내 중복 금지
 */
export function checkMaterialDuplication(
  newMaterialCategory: string,
  recentManuscripts: ManuscriptWithMaterial[],
  newSpecific?: string,
): MaterialDuplicationResult {
  if (!recentManuscripts || recentManuscripts.length === 0) {
    return { duplicate: false }
  }

  // ── 같은 소재 카테고리: 3개 이내 중복 금지 ──
  const recent3 = recentManuscripts.slice(0, 3)
  for (const ms of recent3) {
    if (ms.materialSettings?.category === newMaterialCategory) {
      return {
        duplicate: true,
        reason: `같은 소재 카테고리(${newMaterialCategory})가 최근 3개 원고 이내에 이미 사용되었습니다.`,
      }
    }
  }

  // ── 같은 구체 소재: 20개 이내 중복 금지 ──
  if (newSpecific) {
    const recent20 = recentManuscripts.slice(0, 20)
    for (const ms of recent20) {
      if (
        ms.materialSettings?.specific &&
        ms.materialSettings.specific === newSpecific
      ) {
        return {
          duplicate: true,
          reason: `같은 구체 소재(${newSpecific})가 최근 20개 원고 이내에 이미 사용되었습니다.`,
        }
      }
    }
  }

  return { duplicate: false }
}
