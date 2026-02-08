import React, { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import {
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import CreateProjectModal from "../project/CreateProjectModal";
import ProjectSettingsModal from "../project/ProjectSettingsModal";
import { ProjectType } from "../../types/project";
import { useProjectApi } from "../../api/projectApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// 프로젝트 타입 상수 정의
const PROJECT_TYPE: Record<string, ProjectType> = {
  STUDENT_RECORD: "student_record" as ProjectType,
  ASSIGNMENT: "assignment" as ProjectType,
  GENERAL: "general" as ProjectType
};

// 바이트 계산 함수: (string) => number
const getByteSize = (str: string) => new Blob([str]).size;

interface StudentRecordSidebarContentProps {
  onTemplateSelect: (template: string) => void;
}

const StudentRecordSidebarContent: React.FC<
  StudentRecordSidebarContentProps
> = ({ onTemplateSelect }) => {
  // 현재 탭 상태를 로컬 스토리지와 연동
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem('studentRecordCategory') || "subject";
  });

  // 사용자가 자유 입력하는 필드(바이트 측정 용)
  const [text, setText] = useState("");

  // 드롭다운 관련 state를 로컬 스토리지와 연동
  const [showContent, setShowContent] = useState<"project" | "workflow" | "tools">(() => {
    const savedContent = localStorage.getItem('studentRecordSidebarContent');
    return (savedContent as "project" | "workflow" | "tools") || "project";
  });

  const [selectedOption, setSelectedOption] = useState<string>(() => {
    return localStorage.getItem('studentRecordSidebarOption') || "프로젝트 생성 및 설정";
  });

  const [isOpen, setIsOpen] = useState(false);

  // 로컬 스토리지 업데이트를 위한 useEffect
  useEffect(() => {
    localStorage.setItem('studentRecordCategory', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem('studentRecordSidebarContent', showContent);
  }, [showContent]);

  useEffect(() => {
    localStorage.setItem('studentRecordSidebarOption', selectedOption);
  }, [selectedOption]);

  // 탭 목록
  const categories = [
    { id: "subject", label: "교과 세특" },
    { id: "creative", label: "창체" },
    { id: "behavior", label: "행특" },
  ];

  // 문장 템플릿
  const templates = {
    subject: [
      {
        id: "basic",
        label: "기본 구조",
        text: `수업 중 (활동/과제)에서 (구체적 행동/성과)을 보여줌. (과정/방법)을 통해 (교과역량 or 성장내용)을 드러냄. 이를 통해 (결과/변화)를 확인함.`,
      },
      {
        id: "participation",
        label: "수업 참여도",
        text: `(과목명) 수업에서 (활동명)을 준비함. 조사 과정에서 (자료/근거)를 활용하여 논리적으로 제시함. 질의응답 중 (의사소통 능력)을 보임.`,
      },
      {
        id: "research",
        label: "탐구 활동",
        text: `(탐구주제)에 대해 관심을 갖고 실험·분석 과정에 적극 참여함. (자료수집/실험결과)를 바탕으로 (결론/발견)을 도출함. 이를 통해 (핵심 개념/역량)을 깊이 있게 이해함.`,
      },
    ],
    creative: [
      {
        id: "club",
        label: "동아리 활동",
        text: `동아리 (동아리명)에서 (구체적 역할)을 수행함. (주요 프로젝트/활동)을 진행하며 (협동/창의적 아이디어)를 보임. 결과적으로 (성과/배운점)을 얻음.`,
      },
      {
        id: "autonomous",
        label: "자율 활동",
        text: `학급 임원으로서 (행사/프로젝트)을 주도함. (특정 상황)에서 (리더십/문제해결력)을 발휘하였으며, 마무리 단계에서 (결과/성장)을 보여줌.`,
      },
      {
        id: "career",
        label: "진로 활동",
        text: `(진로 탐색 활동) 통해 (관련 분야) 정보를 수집함. 이 과정에서 (적성/흥미) 확인하고 진로 계획을 구체화함. (추가 탐구/독서 등)으로 확장 가능성 보임.`,
      },
    ],
    behavior: [
      {
        id: "attitude",
        label: "학습 태도",
        text: `수업 중 (집중/참여)하는 모습을 보임. (구체 사례)에서 성실히 임하며, (교우/교사)와의 상호작용을 통해 (변화/발전)을 보임.`,
      },
      {
        id: "personality",
        label: "성격 특성",
        text: `(성격 특성)을 바탕으로 학교생활에 임함. (구체적 사례)에서 (장점) 활용이 돋보였으며, (개선해야 할 점)에 대해서는 지속적으로 노력함.`,
      },
      {
        id: "relationship",
        label: "대인 관계",
        text: `교우 관계에서 (특징/에피소드)을 보여줌. (문제 상황)에서도 (협력/의사소통)으로 해결함. 이를 통해 (성장/변화)가 관찰됨.`,
      },
    ],
  };

  // 키워드 제안 (카테고리별)
  const keywordSuggestions = {
    subject: [
      {
        category: "교과역량",
        keywords: ["논리적 사고", "창의성", "분석력", "의사소통"],
      },
      {
        category: "활동유형",
        keywords: ["개별발표", "프로젝트", "토론", "실험탐구"],
      },
      {
        category: "결과/성장",
        keywords: ["개념 심화", "적극적 태도", "참여도 향상"],
      },
    ],
    creative: [
      {
        category: "영역",
        keywords: ["자율활동", "동아리활동", "봉사활동", "진로활동"],
      },
      {
        category: "성과",
        keywords: ["협동심 강화", "책임감 발휘", "창의성 계발"],
      },
      {
        category: "리더십",
        keywords: ["행사 기획", "프로젝트 주도", "팀원 관리"],
      },
    ],
    behavior: [
      { category: "장점", keywords: ["성실함", "배려심", "적극성", "리더십"] },
      {
        category: "단점",
        keywords: ["주의산만", "독단적", "끈기부족", "소극적"],
      },
      {
        category: "변화/가능성",
        keywords: ["긍정적 변화", "꾸준한 노력", "개선 의지"],
      },
    ],
  };

  // 추가 가이드/금지사항
  const guidelines = [
    {
      title: "작성 순서 (CoT)",
      items: [
        "1) 활동 계기 → 2) 과정 → 3) 결과(성장)",
        "구체적 증거 중심, 음슴체(예: ~함, ~보임)",
      ],
    },
    {
      title: "바이트 제한",
      items: [
        "• 진로 과목 세특: 최대 2100바이트",
        "• 일반 교과 세특: 최대 1500바이트",
        "• 창체: 500자(혹은 1500바이트 이내) 권장",
        "• 행동특성: 1500~2000바이트 정도로 관리",
      ],
    },
  ];

  const prohibitedItems = [
    "교외 수상 실적 기재 금지",
    "공인어학시험 점수 기재 금지",
    "특정 대학·기관명, 부모 직업 기재 금지",
    "수상/자격증을 세특·창체·행특에 직접 언급 금지",
    "사교육 유발 요소(학원명 등) 언급 지양",
  ];

  // 현재 입력 내용의 바이트 수
  const byteSize = getByteSize(text);

  // 드롭다운 옵션
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
      id: "record-workflow",
      label: "생기부 워크플로우",
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      action: () => {
        setShowContent("workflow");
        setSelectedOption("생기부 워크플로우");
      },
    },
    {
      id: "record-tools",
      label: "생기부 도구",
      icon: <DocumentTextIcon className="w-5 h-5" />,
      action: () => {
        setShowContent("tools");
        setSelectedOption("생기부 도구");
      },
    },
  ];

  // 프로젝트 관련 state 추가
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const projectApi = useProjectApi();
  const navigate = useNavigate();

  // 프로젝트 생성 핸들러
  const handleCreateProject = async (name: string, description: string) => {
    try {
      const newProject = await projectApi.createProject({
        name,
        type: PROJECT_TYPE.STUDENT_RECORD,
        description
      });
      
      const newChat = await projectApi.createProjectChat(newProject.id, {
        name: "새 채팅",
        type: PROJECT_TYPE.STUDENT_RECORD
      });

      navigate(`/student-record/${newProject.id}/chat/${newChat.id}`);
      setCreateModalOpen(false);
      window.dispatchEvent(new Event('projectUpdated'));
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("프로젝트 생성에 실패했습니다.");
    }
  };

  // 프로젝트 관리 컨텐츠
  const ProjectContent = () => {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors
                     flex items-center justify-center gap-2 font-medium"
        >
          새 프로젝트 생성하기
        </button>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              프로젝트 생성하기
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>상단의 '새 프로젝트 생성하기' 버튼을 클릭합니다.</li>
              <li>프로젝트의 이름을 입력합니다. (예: 1학기 생기부, 3학년 세특 등)</li>
              <li>프로젝트 설명에는 생기부 작성의 주요 내용이나 목표를 기록합니다.</li>
              <li>생성 후 자동으로 새로운 채팅방이 열립니다.</li>
            </ol>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              채팅방 활용하기
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>하나의 프로젝트에 여러 채팅방을 만들 수 있습니다.</li>
              <li>채팅방별로 다른 주제나 단계를 구분하여 관리하세요.</li>
              <li>채팅 내용은 자동으로 저장되어 나중에도 참고할 수 있습니다.</li>
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
  // 생기부 워크플로우 컨텐츠
  const WorkflowContent = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          생기부 워크플로우
        </h3>
        
        <div className="space-y-4">
          {/* 1단계: 영역 선택 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">1. 영역 선택</h4>
            <div className="mt-2 space-y-3">
              <div className="border-l-2 border-purple-500 pl-3">
                <h5 className="text-sm font-medium text-purple-600 dark:text-purple-400">작성할 영역 선택하기</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">사용 모델: Gemini Flash</p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 교과 세특: 교과별 특기사항</li>
                  <li>• 창체: 자율/동아리/봉사/진로</li>
                  <li>• 행특: 행동발달 및 종합의견</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2단계: 초안 작성 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">2. 초안 작성</h4>
            <div className="mt-2 space-y-3">
              <div className="border-l-2 border-blue-500 pl-3">
                <h5 className="text-sm font-medium text-blue-600 dark:text-blue-400">기본 내용 구성하기</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">사용 모델: Gemini Pro</p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 핵심 활동/성과 정리</li>
                  <li>• 주요 키워드 선정</li>
                  <li>• 문장 구조 설계</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3단계: 자료 분석 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">3. 자료 분석</h4>
            <div className="mt-2 space-y-3">
              <div className="border-l-2 border-green-500 pl-3">
                <h5 className="text-sm font-medium text-green-600 dark:text-green-400">관련 자료 업로드 및 분석</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">지원 파일 형식: PDF, 이미지, 텍스트</p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 수업/활동 자료</li>
                  <li>• 평가 결과물</li>
                  <li>• 활동 사진/기록</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 4단계: 생기부 작성 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">4. 생기부 작성</h4>
            <div className="mt-2 space-y-3">
              <div className="border-l-2 border-orange-500 pl-3">
                <h5 className="text-sm font-medium text-orange-600 dark:text-orange-400">분석 결과 기반 작성</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">사용 모델: Gemini Pro</p>
                <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 자료 분석 결과 반영</li>
                  <li>• 구체적 증거 기반 서술</li>
                  <li>• 학생 성장 중심 기술</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 도움말 */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
              💡 워크플로우 활용 팁
            </h4>
            <ul className="text-sm text-purple-700 dark:text-purple-200 space-y-2">
              <li>• 각 단계별로 채팅방을 생성하여 진행하면 효율적입니다.</li>
              <li>• 분석한 자료는 자동으로 저장되어 다음 작성에도 활용할 수 있습니다.</li>
              <li>• 작성 중인 내용은 실시간으로 저장됩니다.</li>
            </ul>
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
                {options.find(opt => opt.label === selectedOption)?.icon}
                <span className="font-medium">{selectedOption}</span>
              </div>
              <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
          ) : (
            // 생기부 도구 (기존 UI)
            <>
              {/* Tab for category switching */}
              <Tab.Group
                onChange={(index) => setSelectedCategory(categories[index].id)}
              >
                <Tab.List className="flex space-x-1 rounded-xl bg-purple-100 p-1">
                  {categories.map((cat) => (
                    <Tab
                      key={cat.id}
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 break-words
                         ${
                           selected
                             ? "bg-white text-purple-700 shadow"
                             : "text-gray-600 hover:bg-white/[0.12] hover:text-gray-800"
                         }`
                      }
                    >
                      {cat.label}
                    </Tab>
                  ))}
                </Tab.List>
              </Tab.Group>

              {/* Recommended keywords */}
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  추천 키워드
                </h4>
                {keywordSuggestions[
                  selectedCategory as keyof typeof keywordSuggestions
                ].map((section, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {section.category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {section.keywords.map((keyword) => (
                        <button
                          key={keyword}
                          onClick={() =>
                            setText((prev) => (prev ? prev + " " : "") + keyword)
                          }
                          className="px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional guidelines */}
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4">
                {guidelines.map((g) => (
                  <div key={g.title} className="mb-4 last:mb-0">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {g.title}
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {g.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Byte check area */}
              <div className="bg-purple-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
                  <span>바이트 계산기</span>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      byteSize > 1500
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {byteSize} / {selectedCategory === "subject" ? "1500" : "2000"}
                  </span>
                </h4>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-48 p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500
                             dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200
                             font-mono resize-none"
                  placeholder={`${
                    selectedCategory === "subject"
                      ? "교과 세특"
                      : selectedCategory === "creative"
                      ? "창체"
                      : "행특"
                  } 문안을 입력해 보세요...`}
                  style={{ lineHeight: "1.5" }}
                />
                <div className="mt-3 space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        byteSize > (selectedCategory === "subject" ? 1500 : 2000)
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (byteSize /
                            (selectedCategory === "subject" ? 1500 : 2000)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span
                      className={
                        byteSize > (selectedCategory === "subject" ? 1500 : 2000)
                          ? "text-red-500"
                          : "text-gray-600 dark:text-gray-400"
                      }
                    >
                      {byteSize > (selectedCategory === "subject" ? 1500 : 2000)
                        ? `${
                            byteSize -
                            (selectedCategory === "subject" ? 1500 : 2000)
                          }바이트 초과`
                        : "적정 범위 내"}
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(text)}
                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        복사
                      </button>
                      <button
                        onClick={() => setText("")}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        초기화
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template buttons */}
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  문장 템플릿
                </h4>
                <div className="space-y-2">
                  {templates[selectedCategory as keyof typeof templates].map(
                    (tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => onTemplateSelect(tpl.text)}
                        className="w-full p-3 text-left text-sm bg-white dark:bg-gray-700 
                                   rounded-lg shadow-sm hover:bg-purple-50 
                                   dark:hover:bg-gray-600 transition-colors break-words"
                      >
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {tpl.label}
                        </span>
                        <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                          {tpl.text}
                        </p>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Prohibited items */}
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                  기재 금지사항
                </h4>
                <ul className="text-sm text-red-600 dark:text-red-200 space-y-1">
                  {prohibitedItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* 모달 컴포넌트들 */}
          <CreateProjectModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateProject}
            projectType={PROJECT_TYPE.STUDENT_RECORD}
          />
          
          <ProjectSettingsModal
            isOpen={settingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            projectId={selectedProjectId}
            projectType={PROJECT_TYPE.STUDENT_RECORD}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentRecordSidebarContent;
