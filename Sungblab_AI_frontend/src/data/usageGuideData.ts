// 사용 가이드 관련 타입 정의
export interface GuideDetail {
  subtitle: string;
  description: string;
  points: string[];
}

export interface UsageGuide {
  id: string;
  title: string;
  content: string;
  details: GuideDetail[];
}

// 사용 가이드 데이터
export const usageGuides: UsageGuide[] = [
  {
    id: "chatbot",
    title: "챗봇 사용법",
    content: "AI 챗봇을 통한 학습 지원 기능의 사용 방법을 안내합니다.",
    details: [
      {
        subtitle: "시작하기",
        description: "챗봇 시작 방법",
        points: [
          "우측 상단의 '새 채팅' 버튼을 클릭하여 새로운 대화 시작",
          "좌측의 '모델 선택' 메뉴에서 원하는 AI 모델 선택",
          "채팅창 하단의 입력창에 질문이나 요청사항 입력",
          "파일 첨부 버튼을 통해 이미지나 PDF 파일 업로드 가능",
        ],
      },
      {
        subtitle: "대화 관리",
        description: "대화 내용 관리 방법",
        points: [
          "좌측 사이드바에서 이전 대화 목록 확인 가능",
          "대화 제목 클릭으로 이전 대화 내용 불러오기",
          "휴지통 아이콘으로 불필요한 대화 삭제",
          "북마크로 중요한 대화 저장 가능",
        ],
      },
      {
        subtitle: "고급 기능",
        description: "추가 기능 활용 방법",
        points: [
          "코드 블록 내용은 복사 버튼으로 쉽게 복사",
          "드래그 앤 드롭으로 파일 첨부 가능",
          "Latex 렌더링 지원",
          "HTML/CSS 코드 작성 및 미리보기 요청 가능",
          "SVG 그래픽 생성 및 편집 도움 요청",
          "파이썬 데이터 시각화 코드 작성 요청 (matplotlib, plotly 등)",
          "차트, 그래프, 인포그래픽 생성 도움 요청",
        ],
      },
    ],
  },
  {
    id: "assignment",
    title: "수행평가",
    content: "수행평가 보고서 작성 도우미 기능의 사용 방법을 안내합니다.",
    details: [
      {
        subtitle: "보고서 작성 시작",
        description: "보고서 작성 시작 방법",
        points: [
          "상단 메뉴에서 '수행평가' 탭 선택",
          "좌측의 가이드 메뉴에서 원하는 항목 선택",
          "'새 보고서 작성' 버튼으로 시작",
          "주제와 기본 정보 입력 후 진행",
        ],
      },
      {
        subtitle: "작성 도구 활용",
        description: "보고서 작성 도구 사용법",
        points: [
          "상단 도구 모음에서 원하는 서식 도구 선택",
          "우측 사이드바에서 AI 도움말 확인",
          "실시간 저장 기능으로 작업 보호",
          "미리보기로 최종 결과물 확인",
        ],
      },
      {
        subtitle: "최종 완성",
        description: "보고서 완성 및 저장 방법",
        points: [
          "'PDF 변환' 버튼으로 최종 문서 생성",
          "변환된 PDF 미리보기로 확인",
          "'다운로드' 버튼으로 파일 저장",
        ],
      },
    ],
  },
  {
    id: "records",
    title: "생기부",
    content: "생기부(학교생활기록부) 작성 도우미 기능의 사용 방법을 안내합니다.",
    details: [
      {
        subtitle: "영역별 작성",
        description: "생기부 영역별 작성 방법",
        points: [
          "상단 탭에서 작성할 영역(교과/창체/행특) 선택",
          "좌측 템플릿에서 원하는 문구 양식 선택",
          "우측 입력창에서 내용 작성",
          "실시간 바이트 수 확인 가능",
        ],
      },
    ],
  },
]; 