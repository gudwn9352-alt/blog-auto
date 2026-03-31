// 레이어 1: 카테고리
export interface Category {
  id: string          // A~F
  name: string
  typeCount: number
  coreHook: string
  brandExposure: 'strong' | 'medium' | 'weak'
  role: string
}

// 레이어 2: 원고 유형
export interface ManuscriptType {
  id: string          // 예: A-1, B-3
  categoryId: string  // A~F
  name: string        // 예: "낙관적 서사로"
  index: number       // 카테고리 내 순서
}

// 소재 카테고리
export interface MaterialCategory {
  id: string
  name: string
  type: 'medical' | 'non_medical'
}

// 이미지 유형
export interface ImageType {
  id: string          // 예: 1-1, 2-3
  groupId: number     // 대분류 1~6
  groupName: string
  name: string        // 유형명
  textRequired: 'required' | 'optional' | 'none'  // 텍스트 필수/선택/없음
}

// 인지경로
export interface CognitionPath {
  id: string
  name: string
  type: 'online' | 'offline' | 'life_event'
  touchpointEnabled: boolean  // 핀포인트 터칭 가능
}
