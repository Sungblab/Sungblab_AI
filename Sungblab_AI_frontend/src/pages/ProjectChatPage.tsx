import React, { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ChatInterface from "../components/chat/ChatInterface";
import ContextSidebar from "../components/layout/common/ContextSidebar";
import AssignmentSidebarContent from "../components/assignment/AssignmentSidebar";
import StudentRecordSidebarContent from "../components/student-record/StudentRecordSidebar";
import { ProjectSidebar } from "../components/layout/common/Sidebar";
import { ProjectType } from "../types/project";
import { useLayout } from "../contexts/LayoutContext";
import { useAuth } from "../contexts/AuthContext";

const ProjectChatPage: React.FC = () => {
  const { projectId, chatId } = useParams();
  const chatInterfaceRef = useRef<any>(null);
  const { toggleRightSidebar, isRightSidebarOpen, isSidebarOpen } = useLayout();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  // 프로젝트 ID에서 타입 추출
  const getProjectType = (id: string | undefined): ProjectType => {
    if (!id) return "assignment";
    // URL 경로에서 타입 추출
    const path = window.location.pathname;
    return path.includes("student-record") ? "record" : "assignment";
  };

  const projectType = getProjectType(projectId);

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
          <ProjectSidebar projectType={projectType} />
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
            {projectType === "assignment" ? (
              <AssignmentSidebarContent
                currentStep="research"
                onStepChange={() => {}}
                onExampleClick={handleExampleClick}
              />
            ) : (
              <StudentRecordSidebarContent
                onTemplateSelect={handleExampleClick}
              />
            )}
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
              {projectType === "assignment" ? (
                <AssignmentSidebarContent
                  currentStep="research"
                  onStepChange={() => {}}
                  onExampleClick={handleExampleClick}
                />
              ) : (
                <StudentRecordSidebarContent
                  onTemplateSelect={handleExampleClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProjectChatPage;
