// 원고 상태
export type ManuscriptStatus =
  | 'draft'          // 설정 중
  | 'generating'     // 원고 생성 중
  | 'pending_review' // 검수 대기
  | 'reviewing'      // 검수 중
  | 'needs_user'     // 사용자 확인 필요
  | 'approved'       // 승인 완료
  | 'rejected'       // 반려
  | 'image_pending'  // 이미지 생성 대기
  | 'completed'      // 완료

// 원고 카테고리 (레이어 1)
export type ManuscriptCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'random'

// 소재 역할 레벨
export type MaterialRole = 'A' | 'B' | 'C' // 주인공 / 조기 / 배경

// 소재 선택 모드
export type MaterialMode = 'unused' | 'category' | 'specific' | 'auto'

// 소재 설정
export interface MaterialSettings {
  mode: MaterialMode
  category?: string
  specific?: string
  role?: MaterialRole
  expression?: string
}

// 소구 포인트
export type AppealPoint =
  | 'cost'       // 비용/예상료
  | 'benefit'    // 혜택/결과
  | 'method'     // 방법/절차
  | 'trust'      // 신뢰/안전
  | 'comparison' // 비교
  | 'urgency'    // 필요성
  | 'convenience'// 편의성
  | 'experience' // 실제 경험

// 주체자 슬롯 (레이어 5)
export interface PersonaSlots {
  slotA?: string  // 연령대
  slotB?: string  // 성별
  slotC?: string  // 생애 단계
  slotD?: string  // 직업군
  slotE?: string  // 보험 관계 상태
  slotF?: string  // 경제적 맥락
  slotG?: string  // 글쓰기 경험
  slotH?: string  // 현재 상태
  slotI?: string  // 인지경로
}

// 페르소나 변수 (레이어 6)
export interface PersonaVariables {
  var1?: string   // 문체
  var2?: string   // 존비어
  var3?: string   // 감정 표현
  var4?: string   // 맞춤법/띄어쓰기
  var5?: {        // 가독성/포맷
    lineBreak?: number      // 줄바꿈 (문장 수)
    bigParagraph?: number   // 큰문단
    sentenceLength?: string // 문장길이
    subheading?: boolean    // 소목
    citation?: number       // 인용구 수
    alignment?: string      // 가운데정렬
    bold?: boolean          // 볼드
    list?: boolean          // 리스트
    divider?: boolean       // 구분선
  }
  var6?: string   // 브랜드 언급 방식
  var7?: string   // 콘텐츠 길이
  var8?: string   // 개인 상황 공개 범위
}

// 이미지 설정
export interface ImageSettings {
  count: number           // 이미지 수 (7~10)
  types: string[]         // 선택된 이미지 유형들
  textInclude?: boolean   // 텍스트 포함 여부
  selectionMode: 'unified' | 'individual' | 'random' // 이미지 유형 선택 방식
}

// 생성된 이미지
export interface GeneratedImage {
  position: number
  imageType: string
  promptKo: string      // 이미지 설명 (한국어)
  promptEn: string      // 생성 프롬프트 (영어)
  negativePrompt?: string
  processingText?: {
    mainCopy?: string       // 메인 카피 (최대 15자)
    subCopy?: string        // 보조 문구 (최대 20자)
    contextNote?: string    // 문맥 연결 메모
  }
  imageUrl?: string       // 생성된 이미지 URL
  edited?: boolean
  regenerationHistory?: Array<{
    timestamp: string
    previousUrl: string
    reason: string
  }>
}

// 검수 이력
export interface ReviewRecord {
  step: 1 | 2 | 3 | 4
  timestamp: string
  result: 'pass' | 'reject' | 'needs_user'
  issues?: Array<{
    type: string
    detail: string
    location?: string
  }>
  reviewer?: 'auto' | 'ai' | 'user'
}

// 수정 이력
export interface EditHistory {
  timestamp: string
  before: string
  after: string
  editedBy: 'user' | 'ai'
}

// Firestore manuscripts 문서 타입
export interface Manuscript {
  id?: string
  brandId: string
  status: ManuscriptStatus
  createdAt: string
  updatedAt: string

  // 원고 내용
  title?: string
  body?: string
  originalBody?: string  // 수정 전 원본
  editHistory?: EditHistory[]

  // 레이어 설정
  category?: ManuscriptCategory
  typeId?: string         // 원고 유형 ID
  materialSettings?: MaterialSettings
  appealPoint?: AppealPoint
  titleSettings?: {
    structureId?: string
    badaPosition?: 'front' | 'middle' | 'back'
    hookType?: string
    spikeType?: string
    charCount?: 'short' | 'mid' | 'long'
  }
  persona?: PersonaSlots
  variables?: PersonaVariables

  // 글자수
  wordCount?: {
    min: number
    max: number
    actual?: number
  }

  // 이미지
  imageSettings?: ImageSettings
  images?: GeneratedImage[]

  // 검수
  reviewHistory?: ReviewRecord[]
  medicalCheck?: {
    pendingMaterials?: string[]
    verifiedMaterials?: string[]
    blockedMaterials?: string[]
  }
}

// Firestore brands 문서 타입
export interface Brand {
  id?: string
  name: string                    // 브랜드명
  serviceDescription: string      // 서비스 설명
  targetAudience?: string         // 타겟 독자
  tone?: string                   // 기본 톤
  contactInfo?: string            // 연락처 정보
  voiceGuide?: string             // 브랜드 보이스 가이드
  imageStyleGuide?: string        // 이미지 스타일 가이드 (타입별)
  logoUrl?: string                // 브랜드 로고 (Base64 data URL)
  createdAt?: string
  updatedAt?: string
}

// 팩트 룰
export interface FactRule {
  id?: string
  keywords: string[]
  condition: string
  allowed: string[]
  blocked: string[]
  rejectionMsg: string
}

// 사용자 설정
export interface UserSettings {
  batchRatios?: {
    categoryA: number
    categoryB: number
    categoryC: number
    categoryD: number
    categoryE: number
    categoryF: number
  }
  wordCount?: {
    short: { min: number; max: number }
    mid: { min: number; max: number }
    long: { min: number; max: number }
    extraLong: { min: number; max: number }
  }
  imageDefaults?: ImageSettings
  feedbackSettings?: {
    typeAFrequency: 'auto' | 'every' | `every_${number}` | 'unused'
    typeBEnabled: boolean
  }
}
