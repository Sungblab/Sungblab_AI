import React, { useState } from "react";
import { useReport } from "../../contexts/ReportContext";
import { useNavigate } from "react-router-dom";

interface AssessmentToolsProps {
  onExampleClick?: (message: string) => void;
}

const AssessmentTools: React.FC<AssessmentToolsProps> = ({
  onExampleClick,
}) => {
  const navigate = useNavigate();
  const { setReportStep } = useReport();
  const [currentStep, setCurrentStep] = useState<
    "content" | "html" | "preview"
  >("content");
  const [selectedHtmlTemplate, setSelectedHtmlTemplate] =
    useState<string>("standard");

  // 각 단계별 프롬프트 템플릿
  const stepPrompts = {
    content: `보고서 작성을 시작하겠습니다. 다음 사항을 고려하여 작성해 주세요:

1. 보고서 주제:
- 구체적인 주제나 연구 질문
- 보고서의 목적과 범위

2. 보고서 유형:
- 연구 보고서
- 실험/실습 보고서
- 조사/분석 보고서
- 기타 (구체적으로 명시)

3. 필수 포함 사항:
- 핵심 내용
- 참고 자료
- 특별히 강조하고 싶은 부분

위 내용을 바탕으로 보고서 작성을 시작하겠습니다. 어떤 내용으로 작성하시겠습니까?`,

    // HTML 변환 템플릿을 5가지로 세분화
    htmlTemplates: {
      standard: `위 보고서 내용을 바탕으로, PDF 인쇄에 최적화된 HTML 문서를 생성해 주세요:

1. 스타일링:
- Tailwind CSS 클래스만 사용
- 인쇄 시 모든 내용이 정확히 표현되는 스타일링
- 색상 대비가 인쇄 시에도 유지되는 디자인

2. 구조:
- 적절한 시맨틱 태그 사용 (header, main, section, article 등)
- 논리적인 문서 흐름과 명확한 계층 구조
- 페이지 나눔 시 자연스럽게 분리되는 섹션 설계

3. 타이포그래피:
- 본문 텍스트와 제목의 크기 대비 적절히 설정
- 적절한 행간과 여백
- 제목은 굵게, 본문은 보통 두께로 구분

4. 출력 형식:
- A4 형식으로 작성
- 프린트 시 페이지 나눔 고려
- 페이지 번호 자동 추가

이에 대한 답변은 무조건 코드블럭 서식 없이 HTML 코드만 포함해 주시고, 모든 스타일링은 Tailwind 클래스로 작성해 주세요.`,

      academic: `위 보고서 내용을 바탕으로, 학술 연구 보고서에 적합한 HTML 문서를 생성해 주세요:

1. 스타일링:
- Tailwind CSS 클래스만 사용
- 학술적 문서에 적합한 정돈된 디자인
- 인용문 및 참고문헌을 위한 들여쓰기 스타일
- 학술 표기법에 맞는 번호 매기기 스타일

2. 구조:
- 적절한 시맨틱 태그 사용 (header, main, section 등)
- 접근성 고려 (ARIA 레이블, 적절한 제목 구조)
- 목차와 섹션 구분 명확히
- 참고문헌 및 인용 형식 포함
- 각주 및 미주 스타일링

3. 타이포그래피:
- 본문과 제목의 크기 대비 적절히 설정
- 적절한 행간과 여백
- 제목 계층 구조 명확히

4. 출력 형식:
- A4 형식으로 작성
- 프린트 시 페이지 나눔 고려
- 페이지 번호 및 헤더/푸터 포함

이에대한 답변은 무조건 코드블럭 서식 없이 HTML 코드만 포함해 주시고, 모든 스타일링은 Tailwind 클래스로 작성해 주세요.`,

      experiment: `위 보고서 내용을 바탕으로, 실험/실습 보고서에 적합한 HTML 문서를 생성해 주세요:

1. 스타일링:
- Tailwind CSS 클래스만 사용
- 실험 데이터 표현에 적합한 테이블 및 그래프 스타일
- 데이터 테이블을 위한 그리드 라인 및 셀 패딩
- 실험 단계별 구분을 위한 번호 매기기 스타일

2. 구조:
- 적절한 시맨틱 태그 사용 (header, main, section 등)
- 접근성 고려 (ARIA 레이블, 적절한 제목 구조)
- 실험 방법, 결과, 고찰 등 명확한 섹션 구분
- 데이터 테이블 및 그래프를 위한 구조
- 실험 과정 단계별 구분을 위한 넘버링

3. 타이포그래피:
- 본문, 제목, 테이블 데이터의 크기 대비 적절히 설정
- 적절한 행간과 여백
- 제목 계층 구조 명확히

4. 출력 형식:
- A4 형식으로 작성
- 프린트 시 표와 그래프가 페이지 경계에서 잘리지 않도록 고려
- 페이지 번호 포함

이에대한 답변은 무조건 코드블럭 서식 없이 HTML 코드만 포함해 주시고, 모든 스타일링은 Tailwind 클래스로 작성해 주세요.`,

      business: `위 보고서 내용을 바탕으로, 비즈니스/사업 보고서에 적합한 HTML 문서를 생성해 주세요:

1. 스타일링:
- Tailwind CSS 클래스만 사용
- 전문적이고 깔끔한 비즈니스 문서 디자인
- 차트 및 그래프를 위한 스타일링
- 핵심 지표를 강조하기 위한 박스 및 카드 스타일

2. 구조:
- 적절한 시맨틱 태그 사용 (header, main, section 등)
- 접근성 고려 (ARIA 레이블, 적절한 제목 구조)
- 요약, 목표, 전략, 결과 등 비즈니스 문서에 적합한 섹션 구분
- 핵심 지표 및 데이터 강조를 위한 구조
- 요약 정보를 위한 카드 레이아웃

3. 타이포그래피:
- 본문, 제목, 핵심 지표 강조 텍스트의 크기 대비 적절히 설정
- 적절한 행간과 여백
- 제목 계층 구조 명확히

4. 출력 형식:
- A4 형식으로 작성
- 프린트 시 페이지 나눔 고려
- 페이지 번호 및 회사 로고/워터마크 위치 고려

이에대한 답변은 무조건 코드블럭 서식 없이 HTML 코드만 포함해 주시고, 모든 스타일링은 Tailwind 클래스로 작성해 주세요.`,

      technical: `위 보고서 내용을 바탕으로, 기술 문서/매뉴얼에 적합한 HTML 문서를 생성해 주세요:

1. 스타일링:
- Tailwind CSS 클래스만 사용
- 기술 문서에 적합한 코드 블록 및 단계별 지침 스타일
- 코드 블록을 위한 배경색 및 테두리 스타일
- 경고, 주의, 팁 등을 위한 알림 박스 스타일

2. 구조:
- 적절한 시맨틱 태그 사용 (header, main, section 등)
- 접근성 고려 (ARIA 레이블, 적절한 제목 구조)
- 단계별 지침, 코드 예제, 문제 해결 등 기술 문서에 적합한 섹션 구분
- 코드 블록 및 기술 다이어그램을 위한 구조
- 단계별 지침을 위한 넘버링 및 체크리스트

3. 타이포그래피:
- 본문, 제목, 코드 블록의 크기 대비 적절히 설정
- 적절한 행간과 여백
- 제목 계층 구조 명확히

4. 출력 형식:
- A4 형식으로 작성
- 프린트 시 코드 블록이 페이지 경계에서 잘리지 않도록 고려
- 페이지 번호 및 섹션 번호 포함

이에대한 답변은 무조건 코드블럭 서식 없이 HTML 코드만 포함해 주시고, 모든 스타일링은 Tailwind 클래스로 작성해 주세요.`,

      creative: `위 보고서 내용을 바탕으로, 창의적/시각적 보고서에 적합한 HTML 문서를 생성해 주세요:

1. 스타일링:
- Tailwind CSS 클래스만 사용
- 시각적으로 매력적인 레이아웃과 디자인 요소
- 인포그래픽 스타일의 데이터 표현
- 시각적 흐름을 위한 그리드 레이아웃
- 강조 요소를 위한 색상 및 테두리 스타일

2. 구조:
- 적절한 시맨틱 태그 사용 (header, main, section 등)
- 접근성 고려 (ARIA 레이블, 적절한 제목 구조)
- 시각적 흐름과 스토리텔링에 적합한 섹션 구분
- 이미지 및 시각적 요소를 위한 구조
- 카드 및 그리드 기반 레이아웃

3. 타이포그래피:
- 본문, 제목, 강조 텍스트의 크기 대비 적절히 설정
- 적절한 행간과 여백
- 제목 계층 구조 명확히

4. 출력 형식:
- A4 형식으로 작성
- 프린트 시 시각적 요소가 페이지 경계에서 잘리지 않도록 고려
- 페이지 번호 및 시각적 페이지 구분자 포함

이에대한 답변은 무조건 코드블럭 서식 없이 HTML 코드만 포함해 주시고, 모든 스타일링은 Tailwind 클래스로 작성해 주세요.`,
    },

    preview: `생성된 HTML 문서를 편집하고 저장할 수 있습니다. 다음 기능을 활용해보세요:

1. HTML 편집:
- 직접 HTML 코드 수정
- 문서 제목 변경
- 저장 및 관리

2. 문서 관리:
- 여러 HTML 문서 저장
- 이전 문서 불러오기
- 불필요한 문서 삭제

3. 출력 및 공유:
- PDF로 저장
- 인쇄 최적화 보기

HTML 편집기 페이지로 이동하시겠습니까?`,
  };

  // HTML 템플릿 선택 시 호출되는 함수
  const handleHtmlTemplateSelect = (template: string) => {
    setSelectedHtmlTemplate(template);
    onExampleClick?.(
      stepPrompts.htmlTemplates[
        template as keyof typeof stepPrompts.htmlTemplates
      ]
    );
  };

  const handleStepClick = (step: "content" | "html" | "preview") => {
    setCurrentStep(step);
    if (step === "content") {
      onExampleClick?.(stepPrompts[step]);
    } else if (step === "preview") {
      setReportStep("preview");
      navigate("/html-editor");
    }
    // HTML 단계는 템플릿 선택 UI를 표시하므로 여기서 프롬프트를 바로 전송하지 않음
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        수행평가 도구
      </h3>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-800 dark:text-gray-200">
          HTML 편집기
        </h4>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          HTML 문서를 작성하고 관리할 수 있는 도구입니다. 보고서 작성, 편집, PDF
          변환을 지원합니다.
        </p>

        <div className="mt-6 space-y-4">
          {/* 1단계: 내용 작성 */}
          <button
            onClick={() => handleStepClick("content")}
            className={`w-full p-4 bg-white dark:bg-gray-700 rounded-lg border-2 
              ${
                currentStep === "content"
                  ? "border-purple-500"
                  : "border-transparent hover:border-purple-500"
              } 
              transition-all group`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                1
              </div>
              <div className="flex-1 text-left">
                <h5 className="font-medium text-gray-900 dark:text-gray-100">
                  내용 작성
                </h5>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  보고서 주제, 유형, 필수 포함 사항을 입력하여 내용을
                  작성합니다.
                </p>
              </div>
            </div>
          </button>

          {/* 2단계: HTML 변환 */}
          <div>
            <button
              onClick={() => handleStepClick("html")}
              className={`w-full p-4 bg-white dark:bg-gray-700 rounded-lg border-2 
                ${
                  currentStep === "html"
                    ? "border-blue-500"
                    : "border-transparent hover:border-blue-500"
                } 
                transition-all group`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  2
                </div>
                <div className="flex-1 text-left">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    HTML 변환
                  </h5>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    작성된 내용을 Tailwind CSS가 적용된 HTML 문서로 변환합니다.
                  </p>
                </div>
              </div>
            </button>

            {/* HTML 템플릿 선택 UI - HTML 단계가 선택된 경우에만 표시 */}
            {currentStep === "html" && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  보고서 유형 선택
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleHtmlTemplateSelect("standard")}
                    className={`p-3 rounded-lg text-left ${
                      selectedHtmlTemplate === "standard"
                        ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                        : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      표준 보고서
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      PDF 인쇄에 최적화된 기본 형식
                    </p>
                  </button>

                  <button
                    onClick={() => handleHtmlTemplateSelect("academic")}
                    className={`p-3 rounded-lg text-left ${
                      selectedHtmlTemplate === "academic"
                        ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                        : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      학술 연구 보고서
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      논문, 연구 결과, 학술적 분석에 적합한 형식
                    </p>
                  </button>

                  <button
                    onClick={() => handleHtmlTemplateSelect("experiment")}
                    className={`p-3 rounded-lg text-left ${
                      selectedHtmlTemplate === "experiment"
                        ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                        : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      실험/실습 보고서
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      실험 방법, 데이터, 결과 분석에 중점을 둔 형식
                    </p>
                  </button>

                  <button
                    onClick={() => handleHtmlTemplateSelect("business")}
                    className={`p-3 rounded-lg text-left ${
                      selectedHtmlTemplate === "business"
                        ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                        : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      비즈니스/사업 보고서
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      사업 계획, 마케팅 전략, 재무 분석에 적합한 형식
                    </p>
                  </button>

                  <button
                    onClick={() => handleHtmlTemplateSelect("technical")}
                    className={`p-3 rounded-lg text-left ${
                      selectedHtmlTemplate === "technical"
                        ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                        : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      기술 문서/매뉴얼
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      기술 설명, 사용 지침, 코드 문서화에 적합한 형식
                    </p>
                  </button>

                  <button
                    onClick={() => handleHtmlTemplateSelect("creative")}
                    className={`p-3 rounded-lg text-left ${
                      selectedHtmlTemplate === "creative"
                        ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                        : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      창의적/시각적 보고서
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      시각적 요소와 창의적 레이아웃이 강조된 형식
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3단계: HTML 편집기 버튼 */}
          <button
            onClick={() => handleStepClick("preview")}
            className={`w-full p-4 bg-white dark:bg-gray-700 rounded-lg border-2 
              ${
                currentStep === "preview"
                  ? "border-green-500"
                  : "border-transparent hover:border-green-500"
              } 
              transition-all group`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                3
              </div>
              <div className="flex-1 text-left">
                <h5 className="font-medium text-gray-900 dark:text-gray-100">
                  HTML 편집기
                </h5>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  HTML 코드를 직접 편집하고 저장, 관리할 수 있습니다.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTools;
