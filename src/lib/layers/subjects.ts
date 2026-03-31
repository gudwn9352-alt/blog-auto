// 레이어 5: 주체자 슬롯 옵션

export const SLOT_A_AGE = [
  { value: '20s_early', label: '20대 초반' },
  { value: '20s_late', label: '20대 후반' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50s', label: '50대' },
]

export const SLOT_B_GENDER = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
]

export const SLOT_C_LIFE_STAGE = [
  { value: 'single', label: '미혼·독립' },
  { value: 'newlywed', label: '신혼' },
  { value: 'infant', label: '영유아 자녀' },
  { value: 'school_child', label: '초등 자녀' },
  { value: 'teen_child', label: '중고등 자녀' },
  { value: 'adult_child', label: '대학생·성인 자녀' },
  { value: 'empty_nest', label: '자녀 독립 후' },
  { value: 'elderly', label: '노년' },
]

export const SLOT_D_OCCUPATION: string[] = [
  '직장인 (대기업)', '직장인 (중소기업)', '직장인 (공무원)', '직장인 (의료직)',
  '직장인 (교육직)', '자영업자 (일반)', '자영업자 (요식업)', '자영업자 (서비스업)',
  '프리랜서 (IT)', '프리랜서 (디자인)', '프리랜서 (콘텐츠)', '프리랜서 (강사)',
  '전업주부', '학생 (대학생)', '학생 (대학원생)', '무직·구직 중',
  '농업·어업·임업', '건설·현장직', '운수·물류직', '금융·보험직',
  '의사·한의사', '간호사', '약사', '치과의사',
  '변호사·법무사', '회계사·세무사', '건축사', '기술사',
  '스타트업 창업자', '중간관리자 (팀장급)', '임원·경영진', '은퇴자',
  '파트타임·아르바이트', '돌봄 종사자', '군인·경찰·소방관', '예술·문화직',
  '스포츠·피트니스', 'IT·개발자', '영업직', '유통·판매직',
]

export const SLOT_E_INSURANCE_STATUS = [
  { value: 'no_insurance', label: '보험 미가입' },
  { value: 'basic_only', label: '실손 하나만' },
  { value: 'over_insured', label: '보험 많음·정리 필요' },
  { value: 'claim_pending', label: '청구 준비 중' },
  { value: 'claim_rejected', label: '청구 거절 경험' },
  { value: 'reviewing', label: '보험 점검 중' },
  { value: 'comparing', label: '보험 비교 검토 중' },
  { value: 'family_concern', label: '가족 보험 걱정' },
  { value: 'premium_burden', label: '보험료 부담' },
  { value: 'renewal_due', label: '만기·갱신 임박' },
  { value: 'new_subscriber', label: '최근 가입자' },
  { value: 'caregiver', label: '부양가족 보험 관리' },
]

export const SLOT_F_ECONOMIC = [
  { value: 'tight', label: '빠듯한 살림' },
  { value: 'stable', label: '안정적' },
  { value: 'investing', label: '재테크 중' },
  { value: 'high_income', label: '고소득층' },
]

export const SLOT_G_WRITING_EXP = [
  { value: 'none', label: '글쓰기 경험 없음' },
  { value: 'sns_casual', label: 'SNS 가벼운 글' },
  { value: 'blog_regular', label: '블로그 정기 포스팅' },
  { value: 'professional', label: '전문적 글쓰기 경험' },
]

export const SLOT_H_CURRENT_STATE = [
  { value: 'curious', label: '궁금해서 찾아봄' },
  { value: 'worried', label: '걱정·불안 상태' },
  { value: 'frustrated', label: '답답·고민 중' },
  { value: 'decided', label: '결정 직전' },
  { value: 'satisfied', label: '만족·해결 후' },
  { value: 'sharing', label: '경험 공유 욕구' },
]

export const SLOT_I_COGNITION_PATH = [
  // 온라인
  { value: 'naver_search', label: '네이버검색', type: 'online' },
  { value: 'youtube', label: '유튜브', type: 'online' },
  { value: 'instagram', label: '인스타그램', type: 'online' },
  { value: 'kakao_channel', label: '카카오채널', type: 'online' },
  { value: 'blog_surfing', label: '블로그 탐색', type: 'online' },
  { value: 'naver_cafe', label: '네이버카페', type: 'online' },
  { value: 'naver_talk', label: '네이버 톡톡', type: 'online' },
  // 오프라인
  { value: 'family', label: '가족', type: 'offline' },
  { value: 'friend', label: '친구', type: 'offline' },
  { value: 'workplace', label: '직장', type: 'offline' },
  { value: 'neighborhood', label: '동네이웃', type: 'offline' },
  { value: 'meeting', label: '모임', type: 'offline' },
  { value: 'hospital', label: '병원 ·약국', type: 'offline' },
  { value: 'salon_nail', label: '미용실·네일샵', type: 'offline' },
  // 생애 이벤트
  { value: 'insurance_notice', label: '보험료 알림', type: 'life_event' },
  { value: 'household_book', label: '가계부', type: 'life_event' },
  { value: 'wedding_invite', label: '결혼 이벤트', type: 'life_event' },
  { value: 'childbirth', label: '출산', type: 'life_event' },
  { value: 'moving', label: '이사', type: 'life_event' },
  { value: 'job_change', label: '퇴직·이직', type: 'life_event' },
  { value: 'year_end', label: '연말연초', type: 'life_event' },
  { value: 'health_checkup', label: '건강검진', type: 'life_event' },
  { value: 'family_health', label: '가족건강', type: 'life_event' },
  { value: 'tv_radio', label: 'TV·라디오', type: 'life_event' },
]
