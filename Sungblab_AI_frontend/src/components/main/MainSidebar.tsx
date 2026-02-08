import React, { useState, useCallback, useMemo } from "react";
import ModelGuideSection from "./ModelGuideSection";
import PromptGeneratorSection from "./PromptGeneratorSection";
import PromptingGuideSection from "./PromptingGuide";
import UsageGuideSection from "./UsageGuideSection";

/**
 * MainSidebarProps:
 * - onExampleClick: 가이드 예시 문구 클릭 시 동작하는 함수
 * - onFaqClick: FAQ 클릭 시 동작하는 함수
 * - onModelSelect: 모델 선택 시 동작하는 함수
 */
interface MainSidebarProps {
  onExampleClick: (message: string) => void;
  onFaqClick: () => void;
  onModelSelect?: (modelId: string) => void;
}

// 메뉴 설정 타입
interface MenuItem {
  id: string;
  label: string;
  tooltip: string;
}

/** ****************************************************************
 * 메인 사이드바 컴포넌트
 ******************************************************************/
const MainSidebar: React.FC<MainSidebarProps> = ({ onModelSelect }) => {
  /** 2x2 메뉴 상태 - 로컬 스토리지 활용 */
  const [activeMenu, setActiveMenu] = useState<string>(() => {
    const savedMenu = localStorage.getItem("sungblab-active-menu");
    return savedMenu || "model-guide";
  });

  // 메뉴 변경 시 로컬 스토리지에 저장
  const handleMenuChange = (menuId: string) => {
    setActiveMenu(menuId);
    localStorage.setItem("sungblab-active-menu", menuId);
  };

  /** 메뉴 2x2 구성 */
  const menus = [
    {
      id: "model-guide",
      label: "모델선택 가이드",
      tooltip: "각 모델 특징, 사용 용도, 워크플로우 등 안내",
    },
    {
      id: "prompt-generator",
      label: "프롬프트 생성기",
      tooltip: "기본 템플릿 기반 프롬프트 생성/개선",
    },
    {
      id: "prompting-guide",
      label: "프롬프팅 가이드",
      tooltip: "효과적인 프롬프트 작성법 안내",
    },
    {
      id: "usage-guide",
      label: "이용 가이드",
      tooltip: "Sungblab AI 활용 방법 안내",
    },
  ];

  return (
    <div
      className={`
        h-full w-full md:w-96
        bg-white dark:bg-gray-800
        shadow-lg flex flex-col
        border-l border-gray-200 dark:border-gray-700
        relative font-pretendard
      `}
    >
      <div className="flex flex-col h-full p-4 pt-2 md:pt-4 font-pretendard">
        {/* 2x2 그리드 메뉴: 반응형(작은화면: 1열, 중간이상: 2열) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-2 mb-4">
          {menus.map((menu) => (
            <button
              key={menu.id}
              title={menu.tooltip}
              onClick={() => handleMenuChange(menu.id)}
              className={`flex items-center justify-center p-2 
                bg-gray-100 dark:bg-gray-700 
                rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition 
                ${activeMenu === menu.id ? "border-2 border-primary-500" : ""}`}
            >
              <span className="text-sm font-pretendard">{menu.label}</span>
            </button>
          ))}
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto font-pretendard">
          {activeMenu === "model-guide" && (
            <ModelGuideSection onModelSelect={onModelSelect} />
          )}
          {activeMenu === "prompt-generator" && <PromptGeneratorSection />}
          {activeMenu === "prompting-guide" && <PromptingGuideSection />}
          {activeMenu === "usage-guide" && <UsageGuideSection />}
        </div>
      </div>
    </div>
  );
};

export default MainSidebar;
