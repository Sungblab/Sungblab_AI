import React, { useState, useEffect } from "react";
import {
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  EyeIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import CreateProjectModal from "../project/CreateProjectModal";
import ProjectSettingsModal from "../project/ProjectSettingsModal";
import { ProjectType } from "../../types/project";
import { useProjectApi } from "../../api/projectApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AssessmentTools from "./AssessmentTools";

interface AssignmentSidebarContentProps {
  currentStep: string; // 현재 진행 단계 ID
  onStepChange: (step: string) => void; // 단계 변경 콜백
  onExampleClick?: (message: string) => void; // 예시 클릭 콜백(채팅창 등에 사용할 수 있음)
}

type ReportStep = "content" | "html" | "preview";

interface StepModalProps {
  step: {
    id: ReportStep;
    title: string;
    description: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

const StepModal: React.FC<StepModalProps> = ({
  step,
  isOpen,
  onClose,
  onAction,
}) => {
  if (!isOpen || !step) return null;

  const getStepContent = () => {
    switch (step.id) {
      case "content":
        return {
          icon: <DocumentTextIcon className="w-6 h-6" />,
          description:
            "보고서 내용을 작성하는 단계입니다. 다음과 같은 방법으로 시작할 수 있습니다:",
          items: [
            "주제 선정 및 개요 작성",
            "필요한 자료 수집",
            "내용 구성 및 작성",
          ],
          actionText: "내용 작성 시작하기",
        };
      case "html":
        return {
          icon: <CodeBracketIcon className="w-6 h-6" />,
          description:
            "작성된 내용을 HTML 형식으로 변환합니다. 다음 기능을 사용할 수 있습니다:",
          items: [
            "다양한 스타일 템플릿 선택",
            "커스텀 디자인 적용",
            "반응형 레이아웃 설정",
          ],
          actionText: "HTML 변환하기",
        };
      case "preview":
        return {
          icon: <EyeIcon className="w-6 h-6" />,
          description:
            "생성된 보고서를 미리보고 수정하고 PDF로 저장할 수 있습니다:",
          items: [
            "실시간 미리보기",
            "디자인 요소 수정",
            "내용 수정 및 보완",
            "PDF 형식으로 저장",
          ],
          actionText: "미리보기 열기",
        };
    }
  };

  const content = getStepContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-[500px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {content?.icon}
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {step.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {content?.description}
          </p>
          <ul className="space-y-2 mb-4">
            {content?.items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              onAction();
              onClose();
            }}
            className={`w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors`}
          >
            {content?.actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 새로운 인터페이스 추가
interface DropdownOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

// ProjectType을 직접 정의
const PROJECT_TYPE = {
  ASSIGNMENT: "assignment",
  STUDENT_RECORD: "student_record",
  GENERAL: "general",
} as const;

// 템플릿 타입 정의
interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  steps: {
    id: string;
    title: string;
    description: string;
    prompts: string[];
  }[];
}

const ASSESSMENT_TEMPLATES = [
  {
    id: "experiment-report",
    title: "실험 보고서 작성",
    description:
      "과학 실험 결과를 체계적으로 정리하고 보고서를 작성하는 템플릿",
    steps: [
      {
        id: "planning",
        title: "실험 계획 단계",
        description: "실험의 기초를 설정합니다",
        bulletPoints: ["실험 목적과 가설 설정", "실험 재료와 방법 정리"],
        prompt: `다음 항목들에 맞춰 실험 계획서를 작성해주세요:

1. 실험의 목적을 명확하게 서술하세요.
2. 실험의 가설을 구체적으로 제시하세요.
3. 필요한 실험 재료와 장비를 모두 나열하세요.
4. 실험 방법을 단계별로 상세히 기술하세요.
5. 실험 시 주의사항과 안전수칙을 포함하세요.
6. 예상되는 결과와 관찰점을 기록하세요.

위 항목들을 포함하여 체계적인 실험 계획서를 작성하도록 도와드리겠습니다.`,
      },
      // 추가 단계들...
    ],
  },
  {
    id: "korean-presentation",
    title: "국어 발표 준비",
    description:
      "국어 과목에서 주어진 주제에 대해 발표를 준비하고 실행하는 템플릿",
    steps: [
      {
        id: "topic-selection",
        title: "주제 선정",
        description: "발표할 주제를 선택하고 주제의 중요성을 설명합니다",
        bulletPoints: ["발표할 주제 선택", "선택한 주제가 중요한 이유 설명"],
        prompt: `다음 항목들에 맞춰 발표 주제를 선정하고 소개하는 내용을 작성해주세요:

1. 발표할 주제를 선택하세요.
2. 선택한 주제가 중요한 이유를 서술하세요.
3. 주제와 관련된 기본 정보를 제공하세요.

이 과정을 통해 발표 주제를 명확히 설정하도록 도와드리겠습니다.`,
      },
      {
        id: "research",
        title: "자료 조사",
        description: "발표 주제에 대한 자료를 조사하고 정리합니다",
        bulletPoints: [
          "신뢰할 수 있는 자료 출처 찾기",
          "주제와 관련된 핵심 정보 수집",
        ],
        prompt: `발표 주제와 관련된 신뢰할 수 있는 자료를 조사하고 다음 항목들에 맞춰 정리해주세요:

1. 주제와 관련된 주요 정보 수집
2. 자료의 출처 명시
3. 발표에 활용할 핵심 내용 정리

이 과정을 통해 발표에 필요한 자료를 효과적으로 준비할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "ppt-creation",
        title: "PPT 제작",
        description: "발표 내용을 시각적으로 표현하기 위해 PPT를 제작합니다",
        bulletPoints: [
          "발표 내용에 맞는 슬라이드 구성",
          "시각 자료(이미지, 그래프 등) 활용",
        ],
        prompt: `발표 내용을 시각적으로 표현하기 위해 PPT를 제작하세요. 다음 항목들을 포함하여 슬라이드를 구성해주세요:

1. 발표 제목 슬라이드
2. 주제 소개 및 목적
3. 주요 내용 정리
4. 시각 자료(이미지, 그래프 등) 삽입
5. 결론 및 요약
6. 참고 문헌 및 자료 출처

이 과정을 통해 효과적인 PPT를 제작할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "presentation-delivery",
        title: "발표 실행",
        description: "준비한 발표 자료를 바탕으로 실제 발표를 진행합니다",
        bulletPoints: ["발표 연습 및 시간 관리", "청중과의 상호작용"],
        prompt: `준비한 PPT를 바탕으로 실제 발표를 진행하세요. 다음 항목들을 고려하여 발표를 실행해주세요:

1. 발표 내용을 충분히 숙지하고 연습하세요.
2. 발표 시간을 관리하여 시간 내에 내용을 전달하세요.
3. 청중과의 눈 맞춤 및 상호작용을 유도하세요.
4. 질문에 대한 답변 준비

이 과정을 통해 자신감 있게 발표를 진행할 수 있도록 도와드리겠습니다.`,
      },
    ],
  },
  {
    id: "math-problem-solving",
    title: "수학 문제풀이",
    description:
      "수학 과목에서 주어진 문제를 해결하고 풀이 과정을 설명하는 템플릿",
    steps: [
      {
        id: "problem-understanding",
        title: "문제 이해",
        description: "문제를 정확히 이해하고 필요한 정보를 파악합니다",
        bulletPoints: [
          "문제의 조건과 요구사항 파악",
          "필요한 수학적 개념 정리",
        ],
        prompt: `다음 수학 문제를 정확히 이해하고 필요한 정보를 파악하세요:

1. 문제의 조건과 요구사항을 명확히 읽으세요.
2. 문제 해결에 필요한 수학적 개념이나 공식을 정리하세요.
3. 문제의 핵심을 요약하여 작성하세요.

이 과정을 통해 문제를 정확히 이해하고 해결할 준비를 할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "solution-development",
        title: "풀이 과정 개발",
        description: "문제 해결을 위한 단계별 풀이 과정을 작성합니다",
        bulletPoints: [
          "문제 해결을 위한 단계별 접근",
          "각 단계에서의 계산 및 논리 전개",
        ],
        prompt: `문제 해결을 위한 단계별 풀이 과정을 작성하세요. 다음 항목들을 포함하여 체계적으로 풀이 과정을 전개하세요:

1. 문제 해결을 위한 접근 방법 선택
2. 선택한 방법에 따라 단계별 계산 및 논리 전개
3. 각 단계에서 사용한 수학적 개념이나 공식을 명시
4. 중간 결과를 명확히 표시

이 과정을 통해 논리적이고 체계적인 풀이 과정을 개발할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "answer-verification",
        title: "정답 확인",
        description: "풀이 과정을 통해 도출한 정답을 확인하고 검증합니다",
        bulletPoints: ["정답 도출 후 검증", "오류 수정 및 최종 정리"],
        prompt: `풀이 과정을 통해 도출한 정답을 확인하고 검증하세요. 다음 항목들을 포함하여 정답을 검토하고 오류를 수정하세요:

1. 도출한 정답을 문제의 조건과 비교하여 정확성 확인
2. 풀이 과정 중 오류가 없는지 검토
3. 필요한 경우 풀이 과정을 다시 점검하고 수정
4. 최종 정답을 명확히 정리

이 과정을 통해 정확한 정답을 도출하고 풀이 과정을 검증할 수 있도록 도와드리겠습니다.`,
      },
    ],
  },
  {
    id: "social-studies-report",
    title: "사회과목 보고서 작성",
    description: "사회과목에서 주어진 주제에 대해 보고서를 작성하는 템플릿",
    steps: [
      {
        id: "topic-selection",
        title: "주제 선정",
        description: "보고서의 주제를 선택하고 주제의 중요성을 설명합니다",
        bulletPoints: ["보고서 주제 선택", "선택한 주제의 중요성 설명"],
        prompt: `다음 항목들에 맞춰 보고서 주제를 선정하고 소개하는 내용을 작성해주세요:

1. 보고서의 주제를 선택하세요.
2. 선택한 주제가 중요한 이유를 서술하세요.
3. 주제와 관련된 기본 정보를 제공하세요.

이 과정을 통해 보고서 주제를 명확히 설정하도록 도와드리겠습니다.`,
      },
      {
        id: "research",
        title: "자료 조사",
        description: "선정한 주제에 대한 자료를 조사하고 정리합니다",
        bulletPoints: [
          "신뢰할 수 있는 자료 출처 찾기",
          "주제와 관련된 핵심 정보 수집",
        ],
        prompt: `보고서 주제와 관련된 신뢰할 수 있는 자료를 조사하고 다음 항목들에 맞춰 정리해주세요:

1. 주제와 관련된 주요 정보 수집
2. 자료의 출처 명시
3. 보고서에 활용할 핵심 내용 정리

이 과정을 통해 보고서 작성에 필요한 자료를 효과적으로 준비할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "report-writing",
        title: "보고서 작성",
        description: "조사한 자료를 바탕으로 체계적인 보고서를 작성합니다",
        bulletPoints: ["서론, 본론, 결론 구조", "논리적 전개 및 근거 제시"],
        prompt: `조사한 자료를 바탕으로 체계적인 보고서를 작성하세요. 다음 항목들을 포함하여 보고서를 구성해주세요:

1. **서론**: 주제 소개 및 보고서의 목적 설명
2. **본론**: 조사한 자료를 바탕으로 주제에 대한 상세한 설명 및 분석
   - 각 단락마다 하나의 주요 내용 제시
   - 논리적 전개 및 근거 제시
3. **결론**: 보고서의 요약 및 결론 도출
4. **참고 문헌**: 사용한 자료의 출처 명시

이 과정을 통해 논리적이고 체계적인 보고서를 작성할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "review",
        title: "보고서 검토 및 수정",
        description: "작성한 보고서를 검토하고 수정하여 완성도를 높입니다",
        bulletPoints: ["문법 및 맞춤법 오류 수정", "논리적 흐름 점검 및 보완"],
        prompt: `작성한 보고서를 검토하고 수정하세요. 다음 항목들을 포함하여 보고서의 완성도를 높이세요:

1. 문법 및 맞춤법 오류 수정
2. 논리적 흐름 점검 및 보완
3. 불필요한 내용 삭제 및 필요한 내용 추가
4. 전체적인 구조 및 형식 점검

이 과정을 통해 완성도 높은 보고서를 완성할 수 있도록 도와드리겠습니다.`,
      },
    ],
  },
  {
    id: "english-writing",
    title: "영어 글쓰기",
    description: "영어 과목에서 주어진 주제로 글을 작성하는 템플릿",
    steps: [
      {
        id: "topic-selection",
        title: "주제 선정",
        description: "글쓰기 주제를 선택하고 주제의 중요성을 설명합니다",
        bulletPoints: ["글쓰기 주제 선택", "선택한 주제의 중요성 설명"],
        prompt: `다음 항목들에 맞춰 글쓰기 주제를 선정하고 소개하는 내용을 작성해주세요:

1. 글쓰기 주제를 선택하세요.
2. 선택한 주제가 중요한 이유를 서술하세요.
3. 주제와 관련된 기본 정보를 제공하세요.

이 과정을 통해 글쓰기 주제를 명확히 설정하도록 도와드리겠습니다.`,
      },
      {
        id: "research",
        title: "자료 조사",
        description: "선정한 주제에 대한 자료를 조사하고 정리합니다",
        bulletPoints: [
          "신뢰할 수 있는 자료 출처 찾기",
          "주제와 관련된 핵심 정보 수집",
        ],
        prompt: `글쓰기 주제와 관련된 신뢰할 수 있는 자료를 조사하고 다음 항목들에 맞춰 정리해주세요:

1. 주제와 관련된 주요 정보 수집
2. 자료의 출처 명시
3. 글쓰기에 활용할 핵심 내용 정리

이 과정을 통해 글쓰기 준비에 필요한 자료를 효과적으로 준비할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "draft-writing",
        title: "초안 작성",
        description: "조사한 자료를 바탕으로 글쓰기 초안을 작성합니다",
        bulletPoints: ["서론, 본론, 결론 구조", "논리적 전개 및 근거 제시"],
        prompt: `조사한 자료를 바탕으로 글쓰기 초안을 작성하세요. 다음 항목들을 포함하여 글을 구성해주세요:

1. **서론**: 주제 소개 및 글쓰기의 목적 설명
2. **본론**: 조사한 자료를 바탕으로 주제에 대한 상세한 설명 및 분석
   - 각 단락마다 하나의 주요 내용 제시
   - 논리적 전개 및 근거 제시
3. **결론**: 글의 요약 및 결론 도출
4. **참고 문헌**: 사용한 자료의 출처 명시

이 과정을 통해 논리적이고 체계적인 글의 초안을 작성할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "revision",
        title: "글쓰기 수정 및 완성",
        description: "작성한 글의 초안을 검토하고 수정하여 완성도를 높입니다",
        bulletPoints: ["문법 및 맞춤법 오류 수정", "논리적 흐름 점검 및 보완"],
        prompt: `작성한 글의 초안을 검토하고 수정하세요. 다음 항목들을 포함하여 글의 완성도를 높이세요:

1. 문법 및 맞춤법 오류 수정
2. 논리적 흐름 점검 및 보완
3. 불필요한 내용 삭제 및 필요한 내용 추가
4. 전체적인 구조 및 형식 점검

이 과정을 통해 완성도 높은 글을 완성할 수 있도록 도와드리겠습니다.`,
      },
    ],
  },
  {
    id: "english-presentation",
    title: "영어 발표 준비",
    description: "영어 과목에서 주어진 주제로 발표를 준비하는 템플릿",
    steps: [
      {
        id: "topic-selection",
        title: "주제 선정",
        description: "발표할 주제를 선택하고 주제의 중요성을 설명합니다",
        bulletPoints: ["발표할 주제 선택", "선택한 주제가 중요한 이유 설명"],
        prompt: `다음 항목들에 맞춰 발표 주제를 선정하고 소개하는 내용을 작성해주세요:

1. 발표할 주제를 선택하세요.
2. 선택한 주제가 중요한 이유를 서술하세요.
3. 주제와 관련된 기본 정보를 제공하세요.

이 과정을 통해 발표 주제를 명확히 설정하도록 도와드리겠습니다.`,
      },
      {
        id: "research",
        title: "자료 조사",
        description: "발표 주제에 대한 자료를 조사하고 정리합니다",
        bulletPoints: [
          "신뢰할 수 있는 자료 출처 찾기",
          "주제와 관련된 핵심 정보 수집",
        ],
        prompt: `발표 주제와 관련된 신뢰할 수 있는 자료를 조사하고 다음 항목들에 맞춰 정리해주세요:

1. 주제와 관련된 주요 정보 수집
2. 자료의 출처 명시
3. 발표에 활용할 핵심 내용 정리

이 과정을 통해 발표에 필요한 자료를 효과적으로 준비할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "ppt-creation",
        title: "PPT 제작",
        description: "발표 내용을 시각적으로 표현하기 위해 PPT를 제작합니다",
        bulletPoints: [
          "발표 내용에 맞는 슬라이드 구성",
          "시각 자료(이미지, 그래프 등) 활용",
        ],
        prompt: `발표 내용을 시각적으로 표현하기 위해 PPT를 제작하세요. 다음 항목들을 포함하여 슬라이드를 구성해주세요:

1. 발표 제목 슬라이드
2. 주제 소개 및 목적
3. 주요 내용 정리
4. 시각 자료(이미지, 그래프 등) 삽입
5. 결론 및 요약
6. 참고 문헌 및 자료 출처

이 과정을 통해 효과적인 PPT를 제작할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "script-writing",
        title: "대본 제작",
        description: "발표를 위한 대본을 작성합니다",
        bulletPoints: [
          "발표 내용에 맞는 대본 작성",
          "발표 시 사용할 문장 구성",
        ],
        prompt: `발표를 위한 대본을 작성하세요. 다음 항목들을 포함하여 발표 내용을 명확하게 전달할 수 있는 대본을 구성해주세요:

1. **서론**: 발표 주제 소개 및 목적 설명
2. **본론**: 조사한 자료를 바탕으로 주제에 대한 상세한 설명 및 분석
   - 각 단락마다 하나의 주요 내용 제시
   - 논리적 전개 및 근거 제시
3. **결론**: 발표 내용 요약 및 결론 도출
4. **질문 응답**: 예상 질문과 그에 대한 답변 준비

이 과정을 통해 논리적이고 체계적인 발표 대본을 작성할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "presentation-delivery",
        title: "발표 실행",
        description:
          "준비한 발표 자료와 대본을 바탕으로 실제 발표를 진행합니다",
        bulletPoints: ["발표 연습 및 시간 관리", "청중과의 상호작용"],
        prompt: `준비한 PPT와 대본을 바탕으로 실제 발표를 진행하세요. 다음 항목들을 고려하여 발표를 실행해주세요:

1. 발표 내용을 충분히 숙지하고 연습하세요.
2. 발표 시간을 관리하여 시간 내에 내용을 전달하세요.
3. 청중과의 눈 맞춤 및 상호작용을 유도하세요.
4. 질문에 대한 답변 준비

이 과정을 통해 자신감 있게 발표를 진행할 수 있도록 도와드리겠습니다.`,
      },
    ],
  },
  {
    id: "science-product-creation",
    title: "과학 결과물 제작",
    description: "과학 과목에서 주어진 과제를 통해 결과물을 제작하는 템플릿",
    steps: [
      {
        id: "assignment-understanding",
        title: "과제 이해",
        description: "과제를 정확히 이해하고 필요한 자료를 파악합니다",
        bulletPoints: [
          "과제의 조건과 요구사항 파악",
          "필요한 재료 및 도구 목록 작성",
        ],
        prompt: `다음 항목들에 맞춰 과제를 이해하고 필요한 자료를 파악해주세요:

1. 과제의 조건과 요구사항을 명확히 읽으세요.
2. 과제를 수행하기 위해 필요한 재료와 도구를 모두 나열하세요.
3. 과제의 목적과 기대 결과를 서술하세요.

이 과정을 통해 과제를 정확히 이해하고 준비할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "planning",
        title: "제작 계획",
        description: "결과물을 제작하기 위한 단계별 계획을 세웁니다",
        bulletPoints: [
          "제작 과정의 단계별 계획 수립",
          "시간 관리 및 역할 분담",
        ],
        prompt: `결과물을 제작하기 위한 단계별 계획을 세우세요. 다음 항목들을 포함하여 체계적인 계획을 수립해주세요:

1. 제작 과정의 단계별 접근 방법 설정
2. 각 단계별 소요 시간 예측 및 일정 관리
3. 팀 프로젝트인 경우 역할 분담 및 책임 설정

이 과정을 통해 체계적이고 효율적인 제작 계획을 수립할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "material-preparation",
        title: "재료 준비",
        description: "필요한 재료와 도구를 준비하고 정리합니다",
        bulletPoints: ["재료와 도구의 목록 확인", "필요한 재료 확보 및 정리"],
        prompt: `필요한 재료와 도구를 준비하고 정리하세요. 다음 항목들을 포함하여 재료 준비를 완료해주세요:

1. 재료와 도구의 목록을 다시 한번 확인하세요.
2. 필요한 재료를 구매하거나 확보하세요.
3. 재료와 도구를 작업 공간에 정리하여 효율적으로 사용할 수 있도록 준비하세요.

이 과정을 통해 제작에 필요한 재료를 완벽히 준비할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "production",
        title: "결과물 제작",
        description: "계획에 따라 결과물을 실제로 제작합니다",
        bulletPoints: [
          "계획에 따른 단계별 작업 수행",
          "문제 발생 시 해결 방안 모색",
        ],
        prompt: `계획에 따라 결과물을 실제로 제작하세요. 다음 항목들을 포함하여 체계적으로 작업을 수행해주세요:

1. 계획된 단계별 접근 방법에 따라 작업을 진행하세요.
2. 작업 도중 발생하는 문제를 해결하기 위한 방안을 모색하세요.
3. 각 단계별로 작업 진행 상황을 기록하고 필요한 경우 수정하세요.

이 과정을 통해 효율적이고 체계적으로 결과물을 제작할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "evaluation",
        title: "결과물 평가 및 개선",
        description: "제작한 결과물을 평가하고 필요한 개선 작업을 수행합니다",
        bulletPoints: [
          "결과물의 완성도 평가",
          "피드백을 바탕으로 개선 작업 수행",
        ],
        prompt: `제작한 결과물을 평가하고 필요한 개선 작업을 수행하세요. 다음 항목들을 포함하여 평가 및 개선을 진행해주세요:

1. 결과물의 완성도를 평가하세요.
2. 동료나 교사로부터 피드백을 받으세요.
3. 피드백을 바탕으로 결과물을 개선하세요.
4. 최종 결과물을 정리하고 발표 준비를 하세요.

이 과정을 통해 완성도 높은 결과물을 완성할 수 있도록 도와드리겠습니다.`,
      },
    ],
  },
  {
    id: "science-experiment",
    title: "과학 실험 수행",
    description: "과학 과목에서 주어진 실험을 수행하고 결과를 분석하는 템플릿",
    steps: [
      {
        id: "experiment-planning",
        title: "실험 계획",
        description: "실험의 목적과 방법을 계획합니다",
        bulletPoints: ["실험 목적 설정", "실험 방법 및 절차 계획"],
        prompt: `다음 항목들에 맞춰 실험 계획을 세워주세요:

1. 실험의 목적을 명확하게 서술하세요.
2. 실험에 필요한 재료와 장비를 모두 나열하세요.
3. 실험 방법을 단계별로 상세히 기술하세요.
4. 실험 시 주의사항과 안전수칙을 포함하세요.

이 과정을 통해 체계적인 실험 계획을 세울 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "conduct-experiment",
        title: "실험 수행",
        description: "계획한 대로 실험을 수행하고 데이터를 수집합니다",
        bulletPoints: ["실험 절차에 따라 작업 수행", "데이터 수집 및 기록"],
        prompt: `계획한 대로 실험을 수행하고 데이터를 수집하세요. 다음 항목들을 포함하여 실험을 진행해주세요:

1. 실험 절차에 따라 정확히 작업을 수행하세요.
2. 실험 과정에서 발생한 모든 데이터를 기록하세요.
3. 예상치 못한 변수나 변화가 있을 경우 기록하고 설명하세요.

이 과정을 통해 정확한 데이터를 수집하고 실험을 진행할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "data-analysis",
        title: "데이터 분석",
        description: "수집한 데이터를 분석하고 해석합니다",
        bulletPoints: ["데이터 정리 및 표/그래프 작성", "데이터 분석 및 해석"],
        prompt: `수집한 데이터를 분석하고 해석하세요. 다음 항목들을 포함하여 데이터 분석을 진행해주세요:

1. 수집한 데이터를 표나 그래프로 정리하세요.
2. 데이터 간의 관계나 패턴을 분석하세요.
3. 실험 목적과 관련하여 데이터의 의미를 해석하세요.
4. 예상 결과와 실제 결과를 비교하여 설명하세요.

이 과정을 통해 정확한 데이터 분석과 해석을 할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "report-writing",
        title: "실험 보고서 작성",
        description: "분석한 데이터를 바탕으로 실험 보고서를 작성합니다",
        bulletPoints: ["서론, 본론, 결론 구조", "논리적 전개 및 근거 제시"],
        prompt: `분석한 데이터를 바탕으로 실험 보고서를 작성하세요. 다음 항목들을 포함하여 보고서를 구성해주세요:

1. **서론**: 실험의 목적 및 배경 설명
2. **본론**: 실험 방법, 과정, 수집한 데이터 및 분석 결과 설명
3. **결론**: 실험 결과 요약 및 결론 도출
4. **참고 문헌**: 사용한 자료의 출처 명시

이 과정을 통해 논리적이고 체계적인 실험 보고서를 작성할 수 있도록 도와드리겠습니다.`,
      },
      {
        id: "report-review",
        title: "보고서 검토 및 수정",
        description: "작성한 보고서를 검토하고 수정하여 완성도를 높입니다",
        bulletPoints: ["문법 및 맞춤법 오류 수정", "논리적 흐름 점검 및 보완"],
        prompt: `작성한 보고서를 검토하고 수정하세요. 다음 항목들을 포함하여 보고서의 완성도를 높이세요:

1. 문법 및 맞춤법 오류 수정
2. 논리적 흐름 점검 및 보완
3. 불필요한 내용 삭제 및 필요한 내용 추가
4. 전체적인 구조 및 형식 점검

이 과정을 통해 완성도 높은 보고서를 완성할 수 있도록 도와드리겠습니다.`,
      },
    ],
  },
  {
    id: "ppt-creation-guide",
    title: "PPT 제작 가이드",
    description: "발표용 PPT를 체계적으로 제작하기 위한 템플릿",
    steps: [
      {
        id: "structure-planning",
        title: "구조 기획",
        description: "PPT의 전체적인 구조와 흐름을 계획합니다",
        bulletPoints: ["발표 목적과 핵심 메시지 정의", "전체 구조와 섹션 구성"],
        prompt: `다음 항목에 맞춰 PPT 구조를 기획해주세요:

1. 발표 주제: [주제 입력]
2. 발표 시간: [예상 발표 시간]
3. 청중 특성: [대상 청중의 특성]

다음 구조로 PPT 개요를 작성해주세요:

1. 표지 슬라이드
   - 제목, 부제목, 발표자 정보

2. 목차 슬라이드
   - 주요 섹션 구성

3. 도입부 (1-2장)
   - 주제 소개
   - 발표 목적
   - 핵심 메시지

4. 본론 (4-8장)
   - 섹션별 주요 내용
   - 데이터/사례 제시
   - 시각자료 활용 계획

5. 결론 (1-2장)
   - 핵심 내용 요약
   - Call-to-Action

각 슬라이드별로 다음 요소를 제안해주세요:
- 주요 내용
- 시각화 방법 (차트, 이미지, 다이어그램 등)
- 애니메이션/전환 효과 제안

이 구조를 바탕으로 Gamma나 다른 프레젠테이션 도구에서 활용할 수 있는 구체적인 기획안을 작성하겠습니다.`,
      },
      {
        id: "slide-design",
        title: "슬라이드 디자인",
        description: "각 슬라이드의 레이아웃과 디자인을 설계합니다",
        bulletPoints: ["슬라이드별 레이아웃 구성", "시각적 요소 기획"],
        prompt: `각 슬라이드의 디자인을 다음 형식으로 상세히 설명해주세요:

[슬라이드 1: 표지]
레이아웃:
- 배경: [색상/이미지 제안]
- 제목 위치: [화면 상단/중앙 등]
- 부제목 및 발표자 정보 배치
디자인 요소:
- 폰트: [제목/본문 폰트 조합]
- 색상 팔레트: [주요 색상 2-3가지]
- 강조 요소: [아이콘/그래픽 등]

[슬라이드 2: 목차]
레이아웃:
- 섹션 구분 방식
- 시각적 계층 구조
디자인 요소:
- 번호 매기기 스타일
- 섹션별 아이콘/심볼

[본문 슬라이드 템플릿]
1. 텍스트 중심 슬라이드
   - 제목 배치
   - 본문 텍스트 구성
   - 여백 및 간격

2. 데이터 시각화 슬라이드
   - 차트/그래프 배치
   - 설명 텍스트 위치
   - 범례 스타일

3. 이미지 중심 슬라이드
   - 이미지 크기/위치
   - 캡션 스타일
   - 오버레이 텍스트

디자인 일관성:
- 색상 코드
- 폰트 크기 체계
- 여백 규칙
- 그리드 시스템

Gamma 앱에서 활용할 수 있도록 구체적인 수치와 설정값을 포함해주세요.`,
      },
      {
        id: "content-creation",
        title: "콘텐츠 작성",
        description: "각 슬라이드의 실제 내용을 작성합니다",
        bulletPoints: ["슬라이드별 핵심 메시지 작성", "시각 자료 제작 가이드"],
        prompt: `각 슬라이드의 콘텐츠를 다음 형식으로 작성해주세요:

[슬라이드 제목]
핵심 메시지: [한 문장으로 된 핵심 내용]

텍스트 콘텐츠:
- 제목: [간단명료한 제목]
- 부제목: [필요시 추가 설명]
- 본문 내용:
  • [핵심 포인트 1]
  • [핵심 포인트 2]
  • [핵심 포인트 3]

시각화 요소:
1. [차트/그래프/이미지 설명]
   - 데이터 포인트
   - 강조할 부분
   - 애니메이션 순서

말하기 노트:
- [발표 시 강조할 포인트]
- [청중과의 상호작용 포인트]
- [예상 질문과 답변]

Gamma 앱 최적화:
- 추천 템플릿: [템플릿 이름/스타일]
- AI 이미지 생성 프롬프트: [구체적인 이미지 설명]
- 차트 생성을 위한 데이터 포맷: [데이터 구조 설명]

각 슬라이드는 다음 원칙을 따르도록 합니다:
1. 한 슬라이드당 하나의 핵심 메시지
2. 텍스트는 간단명료하게
3. 시각적 요소와 텍스트의 균형
4. 청중의 관심을 유지하는 구성`,
      },
      {
        id: "presentation-practice",
        title: "발표 연습",
        description: "작성된 PPT로 효과적인 발표를 준비합니다",
        bulletPoints: ["발표 스크립트 작성", "시간 배분 및 전달력 향상"],
        prompt: `발표 연습을 위한 가이드를 작성해드리겠습니다:

1. 발표 스크립트 작성
슬라이드별 스크립트:
[슬라이드 번호]
- 도입 문장: [슬라이드 전환 시 첫 문장]
- 핵심 내용: [전달할 주요 메시지]
- 마무리/전환: [다음 슬라이드로 자연스러운 전환]

2. 시간 배분
- 전체 발표 시간: [예상 시간]
- 슬라이드별 할당 시간:
  • 도입부: [시간]
  • 본론 각 섹션: [시간]
  • 결론: [시간]
  • Q&A: [시간]

3. 발표 기술
음성:
- 강조할 키워드
- 속도 조절 포인트
- 톤 변화 지점

제스처:
- 핵심 포인트 강조 시 동작
- 청중과의 아이컨택 포인트
- 슬라이드 전환 시 자세

4. 청중 참여
- 질문 유도 지점
- 상호작용 포인트
- 피드백 수집 방법

5. 예상 Q&A
자주 나올 수 있는 질문:
Q1: [예상 질문]
A1: [답변 준비]

Q2: [예상 질문]
A2: [답변 준비]

6. 발표 체크리스트
준비물:
- 발표자료 백업
- 레이저 포인터
- 타이머

리허설 포인트:
- 음향/영상 장비 테스트
- 타이밍 체크
- 제스처 연습

이 가이드를 따라 체계적으로 발표를 준비하면 자신감 있는 발표가 가능합니다.`,
      },
    ],
  },
  // 추가적인 템플릿을 필요에 따라 여기에 추가하세요
];

const AssignmentSidebarContent: React.FC<AssignmentSidebarContentProps> = ({
  currentStep,
  onStepChange,
  onExampleClick,
}) => {
  const [selectedStep, setSelectedStep] = useState<{
    id: ReportStep;
    title: string;
    description: string;
  } | null>(null);
  const [showContent, setShowContent] = useState<
    | "project"
    | "assignment"
    | "workflow"
    | "template"
    | "tools"
    | "deep-research"
  >(() => {
    const savedContent = localStorage.getItem("assignmentSidebarContent");
    return (
      (savedContent as
        | "project"
        | "assignment"
        | "workflow"
        | "template"
        | "tools"
        | "deep-research") || "project"
    );
  });
  const [selectedOption, setSelectedOption] = useState<string>(() => {
    return (
      localStorage.getItem("assignmentSidebarOption") || "프로젝트 생성 및 설정"
    );
  });
  const [isOpen, setIsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const projectApi = useProjectApi();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{
    templateId: string;
    stepId: string;
    prompt: string;
  } | null>(null);

  // showContent가 변경될 때마다 로컬 스토리지 업데이트
  useEffect(() => {
    localStorage.setItem("assignmentSidebarContent", showContent);
  }, [showContent]);

  // selectedOption이 변경될 때마다 로컬 스토리지 업데이트
  useEffect(() => {
    localStorage.setItem("assignmentSidebarOption", selectedOption);
  }, [selectedOption]);

  // 프로젝트 생성 핸들러
  const handleCreateProject = async (name: string, description: string) => {
    try {
      const newProject = await projectApi.createProject({
        name,
        type: PROJECT_TYPE.ASSIGNMENT,
        description,
      });

      const newChat = await projectApi.createProjectChat(newProject.id, {
        name: "새 채팅",
        type: PROJECT_TYPE.ASSIGNMENT,
      });

      navigate(`/assignment/${newProject.id}/chat/${newChat.id}`);
      setCreateModalOpen(false);
      window.dispatchEvent(new Event("projectUpdated"));
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("프로젝트 생성에 실패했습니다.");
    }
  };

  // 드롭다운 옵션 수정
  const options = [
    {
      id: "project-settings",
      label: "프로젝트 생성 및 설정",
      icon: <Cog6ToothIcon className="w-5 h-5" />,
      action: () => {
        setShowContent("project");
        setSelectedOption("프로젝트 생성 및 설정");
      },
    },
    {
      id: "assessment-workflow",
      label: "수행평가 워크플로우",
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      action: () => {
        setShowContent("workflow");
        setSelectedOption("수행평가 워크플로우");
      },
    },
    {
      id: "prompt-template",
      label: "프롬프트 템플릿",
      icon: <DocumentTextIcon className="w-5 h-5" />,
      action: () => {
        setShowContent("template");
        setSelectedOption("프롬프트 템플릿");
      },
    },
    {
      id: "assessment-tools",
      label: "수행평가 도구",
      icon: <CodeBracketIcon className="w-5 h-5" />,
      action: () => {
        setShowContent("tools");
        setSelectedOption("수행평가 도구");
      },
    },
  ];

  // 프로젝트 관리 컨텐츠
  const ProjectContent = () => {
    return (
      <div className="space-y-6">
        {/* 프로젝트 생성 버튼 */}
        <button
          onClick={() => setCreateModalOpen(true)}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors
                     flex items-center justify-center gap-2 font-medium"
        >
          새 프로젝트 생성하기
        </button>

        {/* 프로젝트 안내 가이드 */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              프로젝트 생성하기
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>상단의 '새 프로젝트 생성하기' 버튼을 클릭합니다.</li>
              <li>
                프로젝트의 이름을 입력합니다. (예: 과학 실험 보고서, 1학기
                수행평가 등)
              </li>
              <li>
                프로젝트 설명에는 수행평가의 주요 내용이나 목표를 기록합니다.
              </li>
              <li>생성 후 자동으로 새로운 채팅방이 열립니다.</li>
            </ol>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              프로젝트 설정하기
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>
                프로젝트 목록에서 설정 아이콘을 클릭하여 관리할 수 있습니다.
              </li>
              <li>프로젝트 이름과 설명을 수정할 수 있습니다.</li>
              <li>AI 지시사항을 프로젝트에 맞게 커스터마이징할 수 있습니다.</li>
              <li>더 이상 필요하지 않은 프로젝트는 삭제할 수 있습니다.</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              채팅방 활용하기
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>하나의 프로젝트에 여러 채팅방을 만들 수 있습니다.</li>
              <li>채팅방별로 다른 주제나 단계를 구분하여 관리하세요.</li>
              <li>
                채팅 내용은 자동으로 저장되어 나중에도 참고할 수 있습니다.
              </li>
            </ul>
          </div>
        </div>

        {/* 도움말 섹션 */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
            💡 알아두세요
          </h4>
          <ul className="text-sm text-purple-700 dark:text-purple-200 space-y-2">
            <li>• 모든 프로젝트는 개인별로 독립적으로 관리됩니다.</li>
            <li>• 채팅 내용과 파일은 프로젝트별로 자동 저장됩니다.</li>
            <li>• 프로젝트는 언제든지 수정하고 관리할 수 있습니다.</li>
          </ul>
        </div>
      </div>
    );
  };

  // 수행평가 진행 컴포넌트
  const AssessmentContent = () => {
    // 템플릿 목록 화면
    if (!selectedTemplate) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            수행평가 프롬프트 템플릿
          </h3>
          {ASSESSMENT_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <h4 className="font-medium text-gray-800 dark:text-gray-200">
                {template.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
              <button
                onClick={() => setSelectedTemplate(template.id)}
                className="mt-3 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 
                         rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm"
              >
                선택하기
              </button>
            </div>
          ))}
        </div>
      );
    }

    // 템플릿 상세 화면
    const template = ASSESSMENT_TEMPLATES.find(
      (t) => t.id === selectedTemplate
    );
    if (!template) return null;

    return (
      <div className="space-y-4">
        {/* 헤더 부분 */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setSelectedTemplate(null)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {template.title}
          </h3>
        </div>

        {/* 단계별 카드 */}
        <div className="space-y-4">
          {template.steps.map((step) => (
            <div
              key={step.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <h4 className="font-medium text-gray-800 dark:text-gray-200">
                {step.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {step.description}
              </p>

              {/* 단계별 수행 내용 */}
              <ul className="mt-2 mb-4 space-y-1">
                {step.bulletPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                  >
                    <span className="text-purple-600 dark:text-purple-400">
                      •
                    </span>
                    {point}
                  </li>
                ))}
              </ul>

              {/* 프롬프트 예시 영역 - MainSidebar 스타일 적용 */}
              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      프롬프트 예시
                    </span>
                    <div className="flex items-center gap-2">
                      {editingPrompt?.stepId === step.id ? (
                        <>
                          <button
                            onClick={() => {
                              handlePromptSave();
                            }}
                            className="text-xs px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 
                                     text-green-700 dark:text-green-300 hover:bg-green-200 
                                     dark:hover:bg-green-900/50 transition-colors"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingPrompt(null)}
                            className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 
                                     text-gray-700 dark:text-gray-300 hover:bg-gray-200 
                                     dark:hover:bg-gray-600 transition-colors"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            setEditingPrompt({
                              templateId: template.id,
                              stepId: step.id,
                              prompt: step.prompt,
                            })
                          }
                          className="text-xs px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 
                                   text-purple-700 dark:text-purple-300 hover:bg-purple-200 
                                   dark:hover:bg-purple-900/50 transition-colors"
                        >
                          수정하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800">
                  {editingPrompt?.stepId === step.id ? (
                    <textarea
                      value={editingPrompt.prompt}
                      onChange={(e) =>
                        setEditingPrompt({
                          ...editingPrompt,
                          prompt: e.target.value,
                        })
                      }
                      className="w-full h-40 font-mono text-sm text-gray-800 dark:text-gray-200 
                               bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md border border-gray-200 
                               dark:border-gray-600 focus:outline-none focus:ring-2 
                               focus:ring-purple-500 dark:focus:ring-purple-400"
                    />
                  ) : (
                    <div
                      className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap 
                             bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md"
                    >
                      {step.prompt}
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => onExampleClick?.(step.prompt)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg 
                             hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    이 프롬프트로 시작하기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 프롬프트 수정 핸들러
  const handlePromptEdit = (
    templateId: string,
    stepId: string,
    currentPrompt: string
  ) => {
    setEditingPrompt({
      templateId,
      stepId,
      prompt: currentPrompt,
    });
  };

  // 프롬프트 저장 핸들러
  const handlePromptSave = () => {
    if (!editingPrompt) return;

    // 템플릿 데이터 업데이트
    const templateIndex = ASSESSMENT_TEMPLATES.findIndex(
      (t) => t.id === editingPrompt.templateId
    );
    if (templateIndex === -1) return;

    const stepIndex = ASSESSMENT_TEMPLATES[templateIndex].steps.findIndex(
      (s) => s.id === editingPrompt.stepId
    );
    if (stepIndex === -1) return;

    ASSESSMENT_TEMPLATES[templateIndex].steps[stepIndex].prompt =
      editingPrompt.prompt;
    setEditingPrompt(null);
  };

  // 새로운 컴포넌트 추가
  const WorkflowContent = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          수행평가 워크플로우
        </h3>

        <div className="space-y-4">
          {/* 계획 단계 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">
              1. 계획 단계
            </h4>
            <div className="mt-2 space-y-3">
              <div className="border-l-2 border-purple-500 pl-3">
                <h5 className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  목표 설정 및 요구사항 분석
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Flash
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 수행평가 목표 명확화</li>
                  <li>• 평가 기준 수립</li>
                  <li>• 일정 계획 수립</li>
                </ul>
              </div>

              <div className="border-l-2 border-blue-500 pl-3">
                <h5 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  자료 조사 계획
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Pro
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 관련 자료 검색 전략 수립</li>
                  <li>• 신뢰성 있는 자료 출처 추천</li>
                  <li>• 검색 키워드 최적화</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 자료 수집 및 분석 단계 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">
              2. 자료 수집 및 분석 단계
            </h4>
            <div className="mt-2 space-y-3">
              <div className="border-l-2 border-green-500 pl-3">
                <h5 className="text-sm font-medium text-green-600 dark:text-green-400">
                  기본 자료 조사
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Pro
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 실시간 웹 검색</li>
                  <li>• 관련 학술 자료 검색</li>
                  <li>• 최신 연구/트렌드 파악</li>
                </ul>
              </div>

              <div className="border-l-2 border-indigo-500 pl-3">
                <h5 className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  심화 자료 분석
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Pro
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• PDF 문서 분석</li>
                  <li>• 이미지/도표 해석</li>
                  <li>• 복잡한 데이터 요약 및 정리</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 내용 구성 단계 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">
              3. 내용 구성 단계
            </h4>
            <div className="mt-2 space-y-3">
              <div className="border-l-2 border-yellow-500 pl-3">
                <h5 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  개요 작성
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Flash
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 구조화된 개요 제시</li>
                  <li>• 핵심 주제 정리</li>
                  <li>• 논리적 흐름 구성</li>
                </ul>
              </div>

              <div className="border-l-2 border-orange-500 pl-3">
                <h5 className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  상세 내용 구성
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Pro
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 수집된 자료 통합</li>
                  <li>• 멀티미디어 자료 활용</li>
                  <li>• 참고문헌 정리</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 작성 및 편집 단계 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">
              4. 작성 및 편집 단계
            </h4>
            <div className="mt-2 space-y-3">
              <div className="border-l-2 border-red-500 pl-3">
                <h5 className="text-sm font-medium text-red-600 dark:text-red-400">
                  초안 작성
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Pro
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 문장 구성 도움</li>
                  <li>• 논리적 전개 지원</li>
                  <li>• 인용 및 참조 관리</li>
                </ul>
              </div>

              <div className="border-l-2 border-pink-500 pl-3">
                <h5 className="text-sm font-medium text-pink-600 dark:text-pink-400">
                  교정 및 편집
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Flash
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 문법/맞춤법 검토</li>
                  <li>• 문체 일관성 확인</li>
                  <li>• 가독성 개선</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 평가 및 피드백 단계 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">
              5. 평가 및 피드백 단계
            </h4>
            <div className="mt-2 space-y-3">
              <div className="border-l-2 border-teal-500 pl-3">
                <h5 className="text-sm font-medium text-teal-600 dark:text-teal-400">
                  자체 평가
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Pro
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 평가 기준 대비 검토</li>
                  <li>• 개선점 도출</li>
                  <li>• 보완사항 제시</li>
                </ul>
              </div>

              <div className="border-l-2 border-cyan-500 pl-3">
                <h5 className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                  최종 점검
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  사용 모델: Gemini Flash
                </p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 최종 체크리스트 확인</li>
                  <li>• 제출 전 확인사항 점검</li>
                  <li>• 마무리 단계 가이드</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex-1 flex flex-col bg-white dark:bg-gray-800">
      <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-container">
        <div className="p-4 space-y-6">
          {/* 드롭다운 메뉴 */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                {options.find((opt) => opt.label === selectedOption)?.icon}
                <span className="font-medium">{selectedOption}</span>
              </div>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      option.action();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/10 text-gray-700 dark:text-gray-200"
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 컨텐츠 영역 */}
          {showContent === "project" ? (
            <ProjectContent />
          ) : showContent === "workflow" ? (
            <WorkflowContent />
          ) : showContent === "template" ? (
            <AssessmentContent />
          ) : showContent === "tools" ? (
            <AssessmentTools onExampleClick={onExampleClick} />
          ) : null}

          {/* 모달 컴포넌트들 */}
          <CreateProjectModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateProject}
            projectType={PROJECT_TYPE.ASSIGNMENT}
          />

          <ProjectSettingsModal
            isOpen={settingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            projectId={selectedProjectId}
            projectType={PROJECT_TYPE.ASSIGNMENT}
          />
        </div>
      </div>
    </div>
  );
};

export default AssignmentSidebarContent;
