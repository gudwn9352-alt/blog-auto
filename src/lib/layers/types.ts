import type { ManuscriptType } from '@/types/layers'

export const MANUSCRIPT_TYPES: ManuscriptType[] = [
  // A. 경험형 (30개)
  { id: 'A-1',  categoryId: 'A', index: 1,  name: '낙관적 서사로' },
  { id: 'A-2',  categoryId: 'A', index: 2,  name: '사건 발생형' },
  { id: 'A-3',  categoryId: 'A', index: 3,  name: '라포 형성형' },
  { id: 'A-4',  categoryId: 'A', index: 4,  name: 'PAS형' },
  { id: 'A-5',  categoryId: 'A', index: 5,  name: '고백형' },
  { id: 'A-6',  categoryId: 'A', index: 6,  name: '통념 해괴형' },
  { id: 'A-7',  categoryId: 'A', index: 7,  name: '빅픽-작은필터 브릿지형' },
  { id: 'A-8',  categoryId: 'A', index: 8,  name: '황제 경고형' },
  { id: 'A-9',  categoryId: 'A', index: 9,  name: '타임라인 일지형' },
  { id: 'A-10', categoryId: 'A', index: 10, name: '체크리스트 진단형' },
  { id: 'A-11', categoryId: 'A', index: 11, name: '지인 대화형' },
  { id: 'A-12', categoryId: 'A', index: 12, name: '비교 분석형' },
  { id: 'A-13', categoryId: 'A', index: 13, name: '랭킹형' },
  { id: 'A-14', categoryId: 'A', index: 14, name: '실험/검증형' },
  { id: 'A-15', categoryId: 'A', index: 15, name: '루틴 공개형' },
  { id: 'A-16', categoryId: 'A', index: 16, name: '실패담형' },
  { id: 'A-17', categoryId: 'A', index: 17, name: '전문가 인용형' },
  { id: 'A-18', categoryId: 'A', index: 18, name: '인증/유효성형' },
  { id: 'A-19', categoryId: 'A', index: 19, name: '몰랐던 사실형' },
  { id: 'A-20', categoryId: 'A', index: 20, name: '감사 편지형' },
  { id: 'A-21', categoryId: 'A', index: 21, name: '논쟁/토론형' },
  { id: 'A-22', categoryId: 'A', index: 22, name: '가이드/튜토리얼형' },
  { id: 'A-23', categoryId: 'A', index: 23, name: '오해 해명형' },
  { id: 'A-24', categoryId: 'A', index: 24, name: '꿈/목표 선언형' },
  { id: 'A-25', categoryId: 'A', index: 25, name: '동조 인물형' },
  { id: 'A-26', categoryId: 'A', index: 26, name: '질문 폭격형' },
  { id: 'A-27', categoryId: 'A', index: 27, name: '뒷이야기 폭로형' },
  { id: 'A-28', categoryId: 'A', index: 28, name: '숫자/데이터 충격형' },
  { id: 'A-29', categoryId: 'A', index: 29, name: '선택지 제시형' },
  { id: 'A-30', categoryId: 'A', index: 30, name: '반성/다짐형' },

  // B. 정보형 (15개)
  { id: 'B-1',  categoryId: 'B', index: 1,  name: '용어 해설형' },
  { id: 'B-2',  categoryId: 'B', index: 2,  name: '절차 안내형' },
  { id: 'B-3',  categoryId: 'B', index: 3,  name: '차이점 정리형' },
  { id: 'B-4',  categoryId: 'B', index: 4,  name: '구조 해체형' },
  { id: 'B-5',  categoryId: 'B', index: 5,  name: '단계별 가이드형' },
  { id: 'B-6',  categoryId: 'B', index: 6,  name: '종류 안내형' },
  { id: 'B-7',  categoryId: 'B', index: 7,  name: '실수 방지형' },
  { id: 'B-8',  categoryId: 'B', index: 8,  name: '상황별 매뉴얼형' },
  { id: 'B-9',  categoryId: 'B', index: 9,  name: '통계형' },
  { id: 'B-10', categoryId: 'B', index: 10, name: '소멸시효 경고형' },
  { id: 'B-11', categoryId: 'B', index: 11, name: '뉴스 해석형' },
  { id: 'B-12', categoryId: 'B', index: 12, name: '대형 서비스 비교형' },
  { id: 'B-13', categoryId: 'B', index: 13, name: '보험 종류별 안내형' },
  { id: 'B-14', categoryId: 'B', index: 14, name: 'FAQ 모음형' },
  { id: 'B-15', categoryId: 'B', index: 15, name: '오해에 집중형' },

  // C. 공감형 (9개)
  { id: 'C-1', categoryId: 'C', index: 1, name: '아무말 토론형' },
  { id: 'C-2', categoryId: 'C', index: 2, name: '계절 감성형' },
  { id: 'C-3', categoryId: 'C', index: 3, name: '가족 걱정형' },
  { id: 'C-4', categoryId: 'C', index: 4, name: '나만 모르는 분석형' },
  { id: 'C-5', categoryId: 'C', index: 5, name: '다름을 표현형' },
  { id: 'C-6', categoryId: 'C', index: 6, name: '피곤한 사람 감성형' },
  { id: 'C-7', categoryId: 'C', index: 7, name: '부모님 감사형' },
  { id: 'C-8', categoryId: 'C', index: 8, name: '요즘 것들의 무게형' },
  { id: 'C-9', categoryId: 'C', index: 9, name: '외로움 감성형' },

  // D. 이슈형 (7개)
  { id: 'D-1', categoryId: 'D', index: 1, name: '법 개정 소보형' },
  { id: 'D-2', categoryId: 'D', index: 2, name: '연말연초 이슈형' },
  { id: 'D-3', categoryId: 'D', index: 3, name: '보험사 이슈 반응형' },
  { id: 'D-4', categoryId: 'D', index: 4, name: '요즘 건강 이슈형' },
  { id: 'D-5', categoryId: 'D', index: 5, name: '사회 트렌드 연결형' },
  { id: 'D-6', categoryId: 'D', index: 6, name: '통계 발표 반응형' },
  { id: 'D-7', categoryId: 'D', index: 7, name: '디지털 소비 트렌드형' },

  // E. 의견형 (7개)
  { id: 'E-1', categoryId: 'E', index: 1, name: '소비자 권리 주장형' },
  { id: 'E-2', categoryId: 'E', index: 2, name: '금융문맹 문제 제기형' },
  { id: 'E-3', categoryId: 'E', index: 3, name: '대형 서비스 친화형' },
  { id: 'E-4', categoryId: 'E', index: 4, name: '세대 간 인식 차이형' },
  { id: 'E-5', categoryId: 'E', index: 5, name: '개인 경험 기반 칼럼형' },
  { id: 'E-6', categoryId: 'E', index: 6, name: '미래 예측형' },
  { id: 'E-7', categoryId: 'E', index: 7, name: '반론 반박형' },

  // F. 심층분석형 (10개)
  { id: 'F-1',  categoryId: 'F', index: 1,  name: '구조 해부형' },
  { id: 'F-2',  categoryId: 'F', index: 2,  name: '돈의 흐름 추적형' },
  { id: 'F-3',  categoryId: 'F', index: 3,  name: '케이스 스터디형' },
  { id: 'F-4',  categoryId: 'F', index: 4,  name: '법·제도 심층형' },
  { id: 'F-5',  categoryId: 'F', index: 5,  name: '숫자 해체형' },
  { id: 'F-6',  categoryId: 'F', index: 6,  name: '비교 심층형' },
  { id: 'F-7',  categoryId: 'F', index: 7,  name: '역사/변천형' },
  { id: 'F-8',  categoryId: 'F', index: 8,  name: '실패 원인 분석형' },
  { id: 'F-9',  categoryId: 'F', index: 9,  name: '타 분야 비교형' },
  { id: 'F-10', categoryId: 'F', index: 10, name: '미래 전망형' },
]

export const TYPE_MAP = Object.fromEntries(MANUSCRIPT_TYPES.map((t) => [t.id, t]))

export function getTypesByCategory(categoryId: string): ManuscriptType[] {
  return MANUSCRIPT_TYPES.filter((t) => t.categoryId === categoryId)
}
