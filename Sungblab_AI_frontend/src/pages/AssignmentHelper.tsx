import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import ChatInterface from "../components/chat/ChatInterface";
import MainLayout from "../components/layout/MainLayout";
import { ProjectSidebar } from "../components/layout/common/Sidebar";
import ContextSidebar from "../components/layout/common/ContextSidebar";
import AssignmentSidebarContent from "../components/assignment/AssignmentSidebar";
import { useLayout } from "../contexts/LayoutContext";

const AssignmentHelper: React.FC = () => {
  const { projectId, chatId } = useParams<{
    projectId?: string;
    chatId?: string;
  }>();
  const [currentStep, setCurrentStep] = useState("research");
  const chatInterfaceRef = useRef<any>(null);
  const { toggleRightSidebar, isRightSidebarOpen, isSidebarOpen } = useLayout();

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
  };

  const handleExampleClick = (message: string) => {
    if (chatInterfaceRef.current) {
      chatInterfaceRef.current.setInputMessage(message);
    }
  };

  return (
    <MainLayout>
      <div className={`flex min-w-0 h-full ${isSidebarOpen ? "md:space-x-3 lg:space-x-6" : "md:space-x-0"} transition-all duration-300 ease-in-out`}>
        {/* 왼쪽 사이드바 */}
        <div className="hidden md:block flex-shrink-0">
          <ProjectSidebar projectType="assignment" />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full mx-auto max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
            <ChatInterface
              ref={chatInterfaceRef}
              chatId={chatId}
              projectId={projectId}
            />
          </div>
        </div>

        {/* PC 오른쪽 사이드바 */}
        <div className="hidden 2xl:block w-96 flex-shrink-0">
          <ContextSidebar>
            <AssignmentSidebarContent
              currentStep={currentStep}
              onStepChange={handleStepChange}
              onExampleClick={handleExampleClick}
            />
          </ContextSidebar>
        </div>

        {/* 모바일 오른쪽 사이드바 */}
        <div
          className={`
            2xl:hidden fixed inset-y-0 right-0 w-full md:w-96 
            transform transition-transform duration-300 ease-in-out z-50
            ${isRightSidebarOpen ? "translate-x-0" : "translate-x-full"}
            bg-white dark:bg-gray-800 shadow-lg
          `}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={toggleRightSidebar}
            className="absolute left-2 top-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* 사이드바 컨텐츠 */}
          <div className="h-full pt-12 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <AssignmentSidebarContent
                currentStep={currentStep}
                onStepChange={handleStepChange}
                onExampleClick={handleExampleClick}
              />
            </div>
          </div>
        </div>

        {/* 모바일 우측 메뉴 토글 버튼 */}
        <button
          onClick={toggleRightSidebar}
          className={`
            2xl:hidden fixed right-3 top-20 z-50 p-1.5
            bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-sm
            backdrop-blur-sm
            transition-opacity duration-300
            ${
              isRightSidebarOpen
                ? "opacity-0 pointer-events-none"
                : "opacity-100"
            }
            hover:opacity-100
          `}
          aria-label="메뉴 열기"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </MainLayout>
  );
};

export default AssignmentHelper;
