// 모델 가이드 관련 타입 정의
export interface ModelGuide {
  id: string;
  title: string;
  logo: string;
  description: string;
  useCases: string[];
  recommended: string;
}

// 모델 가이드 데이터
export const modelGuides: ModelGuide[] = [
  {
    id: "gemini-flash",
    title: "Gemini Flash",
    logo: "/Google.png",
    description: "Google의 Gemini Flash 모델입니다. 빠른 응답과 정확한 추론이 특징입니다. 일상적인 학습 질문부터 간단한 과제까지 신속하게 도와드립니다.",
    useCases: [
      "기초 개념 학습 및 복습",
      "빠른 문제 풀이 지원",
      "학습 계획 수립",
      "간단한 영어 작문/첨삭",
      "기초 수학/과학 문제 해결",
      "실시간 학습 피드백",
      "수행평가 기초 방향 설정",
      "생기부 문구 초안 작성",
    ],
    recommended: "기본적인 학습 지원이 필요하거나 빠른 피드백이 필요한 상황",
  },
  {
    id: "gemini-pro",
    title: "Gemini Pro",
    logo: "/Google.png",
    description: "Google의 Gemini Pro 모델입니다. 고급 추론과 분석 기능을 제공하며, 복잡한 학습 과제에 효과적입니다.",
    useCases: [
      "고급 추론 및 분석",
      "복잡한 문제 해결",
      "창의적 사고 지원",
      "논리적 사고력 향상",
      "심화 학습 지원",
      "전문적인 과제 수행",
      "수행평가 고급 전략",
      "생기부 심화 내용 구성",
    ],
    recommended: "고급 추론이나 창의적 사고가 필요한 상황",
  },
];

// 모델 메뉴 데이터
export const modelMenus = modelGuides.map((model) => ({
  id: model.id,
  label: model.title,
})); 