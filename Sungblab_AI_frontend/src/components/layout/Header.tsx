import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Menu, Transition } from "@headlessui/react";
import SettingsModal from "./common/SettingsModal";
import {
  Bars3Icon,
  XMarkIcon,
  TrashIcon,
  PlusIcon,
  Cog6ToothIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useProjectApi } from "../../api/projectApi";
import { useChatApi } from "../../api/chatApi";
import { ProjectType, ProjectWithChats, ProjectChat } from "../../types/project";
import CreateProjectModal from "../project/CreateProjectModal";
import ProjectSettingsModal from "../project/ProjectSettingsModal";
import ProfileMenu from "./common/ProfileMenu";
import { useLayout } from "../../contexts/LayoutContext";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  parseISO,
} from "date-fns";
import { ko } from "date-fns/locale";

// User 인터페이스 추가
interface User {
  full_name: string;
  email: string;
  profile_image?: string;
}

// 미트볼 메뉴 컴포넌트들
const ChatMeatballMenu: React.FC<{
  chatId: string;
  chatName: string;
  onRename: (chatId: string, newName: string) => void;
  onDelete: (chatId: string, e: React.MouseEvent) => void;
}> = ({ chatId, chatName, onRename, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(chatName);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsRenaming(false);
        setNewName(chatName);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [chatName]);

  const handleRename = () => {
    if (newName.trim() && newName !== chatName) {
      onRename(chatId, newName.trim());
    }
    setIsRenaming(false);
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewName(chatName);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="md:opacity-0 md:group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
      >
        <EllipsisVerticalIcon className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-6 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {isRenaming ? (
            <div className="p-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleRename}
                autoFocus
                className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
                className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <PencilIcon className="w-3 h-3 mr-2" />
                이름 변경
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onDelete(chatId, e);
                }}
                className="flex items-center w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <TrashIcon className="w-3 h-3 mr-2" />
                삭제
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ProjectChatMeatballMenu: React.FC<{
  chatId: string;
  chatName: string;
  projectId: string;
  onRename: (chatId: string, newName: string) => void;
  onDelete: (chatId: string, e: React.MouseEvent) => void;
}> = ({ chatId, chatName, projectId, onRename, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(chatName);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsRenaming(false);
        setNewName(chatName);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [chatName]);

  const handleRename = () => {
    if (newName.trim() && newName !== chatName) {
      onRename(chatId, newName.trim());
    }
    setIsRenaming(false);
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewName(chatName);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="md:opacity-0 md:group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
      >
        <EllipsisVerticalIcon className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-6 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {isRenaming ? (
            <div className="p-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleRename}
                autoFocus
                className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
                className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <PencilIcon className="w-3 h-3 mr-2" />
                이름 변경
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onDelete(chatId, e);
                }}
                className="flex items-center w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <TrashIcon className="w-3 h-3 mr-2" />
                삭제
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleSidebar } = useLayout();
  const navigate = useNavigate();
  const chatApi = useChatApi();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectSettings, setSelectedProjectSettings] = useState<
    string | null
  >(null);
  const [chats, setChats] = useState<any[]>([]);

  // 사용자 이름의 첫 글자를 가져오는 함수
  const getInitial = (name: string) => {
    return name?.charAt(0) || "?";
  };

  // 현재 페이지 여부를 확인하는 함수
  const isCurrentPage = (path: string) => {
    if (path === "/chat") {
      return location.pathname === "/" || location.pathname.startsWith("/chat");
    }
    return location.pathname === path;
  };

  const AuthButtons = () => (
    <>
      <Link
        to="/auth/login"
        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:text-primary-600 hover:border-primary-600 hover:bg-primary-50 dark:border-gray-600 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:border-primary-400 dark:hover:bg-primary-900/50 transition-all duration-200 shadow-sm"
      >
        로그인
      </Link>
      <Link
        to="/auth/register"
        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm hover:shadow-md dark:bg-primary-500 dark:hover:bg-primary-600 transition-all duration-200"
      >
        회원가입
      </Link>
    </>
  );

  const NavLinks = () => (
    <div className="flex flex-col space-y-4">
      {/* 메인 네비게이션 */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          to="/chat"
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-center ${
            isCurrentPage("/chat")
              ? "bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          일반 채팅
        </Link>
        <Link
          to="/assignment"
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-center ${
            isCurrentPage("/assignment")
              ? "bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          수행평가
        </Link>
        <Link
          to="/student-record"
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-center ${
            isCurrentPage("/student-record")
              ? "bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          생기부
        </Link>
      </div>

      {/* 관리자 메뉴 */}
      {isAuthenticated && user?.is_superuser && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/admin"
            className={`flex items-center justify-center px-3 py-2 rounded-lg text-center ${
              isCurrentPage("/admin")
                ? "bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            관리자 페이지
          </Link>
        </div>
      )}
    </div>
  );

  const ProjectList: React.FC = () => {
    const location = useLocation();
    const projectApi = useProjectApi();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<ProjectWithChats[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<ProjectWithChats[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [expandedProjects, setExpandedProjects] = useState<{[key: string]: boolean}>({});
    const projectsCache = useRef<{ data: ProjectWithChats[]; timestamp: number } | null>(null);
    const isInitialLoad = useRef(true);

    // 현재 페이지에 따른 프로젝트 타입 결정
    const getCurrentProjectType = useCallback(() => {
      if (location.pathname.startsWith("/assignment")) return "assignment";
      if (location.pathname.startsWith("/student-record")) return "record";
      return null;
    }, [location.pathname]);

    // 프로젝트 확장/축소 토글
    const toggleProjectExpand = (projectId: string) => {
      setExpandedProjects(prev => ({
        ...prev,
        [projectId]: !prev[projectId]
      }));
    };

    // 프로젝트 검색 필터링
    useEffect(() => {
      if (!searchQuery.trim()) {
        setFilteredProjects(projects);
        return;
      }

      const filtered = projects
        .filter(project =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      setFilteredProjects(filtered);
    }, [searchQuery, projects]);

    const fetchProjects = useCallback(async (forceRefresh = false) => {
      try {
        // 강제 새로고침이 아닌 경우 캐시 확인 (캐시 유효시간을 1분으로 설정)
        const now = Date.now();
        if (
          !forceRefresh &&
          projectsCache.current &&
          now - projectsCache.current.timestamp < 60 * 1000
        ) {
          const currentType = getCurrentProjectType();
          const filteredProjects = currentType
            ? projectsCache.current.data
                .filter((project: ProjectWithChats) => project.type === currentType)
                .sort((a: ProjectWithChats, b: ProjectWithChats) => 
                  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                )
            : [];
          setProjects(filteredProjects);
          return;
        }

        // 초기 로딩이 아닌 경우에만 로딩 상태 표시
        if (isInitialLoad.current) {
          setIsLoading(true);
          isInitialLoad.current = false;
        }

        const projectList = await projectApi.getProjects();
        
        // 캐시 업데이트
        projectsCache.current = {
          data: projectList,
          timestamp: now,
        };

        const currentType = getCurrentProjectType();
        const filteredAndSortedProjects = currentType
          ? projectList
              .filter((project: ProjectWithChats) => project.type === currentType)
              .sort((a: ProjectWithChats, b: ProjectWithChats) => 
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              )
          : [];

        setProjects(filteredAndSortedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    }, [getCurrentProjectType]); // projectApi는 안정적인 참조이므로 의존성에서 제외

    // 프로젝트 업데이트 이벤트 핸들러 최적화
    const handleProjectUpdate = useCallback((event?: Event) => {
      // 이벤트에서 프로젝트 정보를 받은 경우
      const customEvent = event as CustomEvent;
      if (customEvent && customEvent.detail && customEvent.detail.projectId) {
        const { projectId, updatedAt, name, type } = customEvent.detail;
        
        // 현재 프로젝트 타입 직접 계산 (의존성 순환 방지)
        const currentType = location.pathname.startsWith("/assignment") 
          ? "assignment" 
          : location.pathname.startsWith("/student-record") 
          ? "record" 
          : null;
        
        // 해당 프로젝트 타입이 현재 표시 중인 타입과 일치하는 경우에만 처리
        if (type === currentType) {
          setProjects(prevProjects => {
            const updatedProjects = prevProjects.map((project: ProjectWithChats) => 
              project.id === projectId 
                ? { 
                    ...project, 
                    name: name || project.name,
                    updatedAt: new Date(updatedAt)
                  }
                : project
            );
            
            // 최신 순으로 다시 정렬
            return updatedProjects.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          });
          
          // 캐시도 업데이트
          if (projectsCache.current) {
            projectsCache.current.data = projectsCache.current.data.map((project: ProjectWithChats) => 
              project.id === projectId 
                ? { 
                    ...project, 
                    name: name || project.name,
                    updatedAt: new Date(updatedAt)
                  }
                : project
            );
            projectsCache.current.timestamp = Date.now();
          }
        }
      } else {
        // 기존 방식: 캐시 무효화하고 강제 새로고침
        if (projectsCache.current) {
          projectsCache.current = null;
        }
        // fetchProjects 직접 호출 대신 flag로 처리
        setProjects([]);
        fetchProjects(true);
      }
    }, [location.pathname]); // 간단한 의존성만 사용

    // 포커스 이벤트 핸들러 추가
    const handleWindowFocus = useCallback(() => {
      // 캐시가 30초 이상 된 경우 새로고침
      if (
        projectsCache.current &&
        Date.now() - projectsCache.current.timestamp > 30 * 1000
      ) {
        // 캐시 무효화하고 다시 로드
        projectsCache.current = null;
        setProjects([]);
        fetchProjects(true);
      }
    }, []); // 의존성 제거하여 순환 참조 방지

    useEffect(() => {
      if (isAuthenticated) {
        fetchProjects();

        // 다양한 이벤트 리스너 추가
        window.addEventListener("projectUpdated", handleProjectUpdate);
        window.addEventListener("projectDeleted", handleProjectUpdate);
        window.addEventListener("chatRoomCreated", handleProjectUpdate);
        window.addEventListener("focus", handleWindowFocus);

        // 주기적 새로고침 (5분마다)
        const interval = setInterval(() => {
          // 캐시 무효화하고 새로고침
          if (projectsCache.current) {
            projectsCache.current = null;
          }
          fetchProjects(true);
        }, 5 * 60 * 1000);

        return () => {
          window.removeEventListener("projectUpdated", handleProjectUpdate);
          window.removeEventListener("projectDeleted", handleProjectUpdate);
          window.removeEventListener("chatRoomCreated", handleProjectUpdate);
          window.removeEventListener("focus", handleWindowFocus);
          clearInterval(interval);
        };
      }
    }, [isAuthenticated, handleProjectUpdate, handleWindowFocus]); // fetchProjects 의존성 제거

    const handleNewProject = async (name: string, description: string) => {
      try {
        const currentType = getCurrentProjectType();
        if (!currentType) return;

        const newProject = await projectApi.createProject({
          name,
          type: currentType,
          description,
        });
        
        // 즉시 목록에 추가하여 사용자 경험 개선
        const newProjectData = {
          id: newProject.id,
          name: newProject.name,
          type: newProject.type,
          description: newProject.description,
          createdAt: new Date(),
          updatedAt: new Date(),
          chats: [],
        };
        
        setProjects(prevProjects => {
          const updatedProjects = [newProjectData, ...prevProjects];
          // 최신 순으로 정렬 (새 프로젝트가 맨 위에 오도록)
          return updatedProjects.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
        
        // 캐시도 즉시 업데이트
        if (projectsCache.current) {
          const updatedCacheData = [newProjectData, ...projectsCache.current.data];
          projectsCache.current.data = updatedCacheData.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          projectsCache.current.timestamp = Date.now();
        }

        setIsCreateModalOpen(false);
        
        // 백그라운드에서 전체 목록 새로고침
        setTimeout(() => {
          fetchProjects(true);
        }, 1000);
      } catch (error) {
        console.error("Error creating project:", error);
      }
    };

    const handleNewProjectChat = async (projectId: string) => {
      try {
        const newChat = await projectApi.createProjectChat(projectId, {
          name: "",
        });
        
        // 즉시 해당 프로젝트에 채팅방 추가하고 업데이트 시간 갱신하여 맨 위로 정렬
        setProjects(prevProjects => {
          const updatedProjects = prevProjects.map((project: ProjectWithChats) => 
            project.id === projectId 
              ? { 
                  ...project, 
                  chats: [newChat, ...project.chats],
                  updatedAt: new Date() // 업데이트 시간 갱신
                }
              : project
          );
          
          // 최신 순으로 다시 정렬
          return updatedProjects.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
        
        // 캐시도 즉시 업데이트
        if (projectsCache.current) {
          projectsCache.current.data = projectsCache.current.data.map((project: ProjectWithChats) => 
            project.id === projectId 
              ? { 
                  ...project, 
                  chats: [newChat, ...project.chats],
                  updatedAt: new Date()
                }
              : project
          );
          projectsCache.current.timestamp = Date.now();
        }

        const route = getCurrentProjectType() === "record" ? "student-record" : "assignment";
        if (route) {
          navigate(`/${route}/${projectId}/chat/${newChat.id}`);
          setIsMobileMenuOpen(false);
        }
        
        // 백그라운드에서 전체 목록 새로고침
        setTimeout(() => {
          fetchProjects(true);
        }, 1000);
      } catch (error) {
        console.error("Error creating project chat:", error);
      }
    };

    const handleDeleteProjectChat = async (
      projectId: string,
      chatId: string,
      e: React.MouseEvent
    ) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm("정말로 이 대화를 삭제하시겠습니까?")) {
        try {
          await projectApi.deleteProjectChat(projectId, chatId);
          
          // 즉시 해당 프로젝트에서 채팅방 제거하고 업데이트 시간 갱신
          setProjects(prevProjects => {
            const updatedProjects = prevProjects.map((project: ProjectWithChats) => 
              project.id === projectId 
                ? { 
                    ...project, 
                    chats: project.chats.filter((chat: ProjectChat) => chat.id !== chatId),
                    updatedAt: new Date() // 업데이트 시간 갱신
                  }
                : project
            );
            
            // 최신 순으로 다시 정렬
            return updatedProjects.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          });
          
          // 캐시도 즉시 업데이트
          if (projectsCache.current) {
            projectsCache.current.data = projectsCache.current.data.map((project: ProjectWithChats) => 
              project.id === projectId 
                                  ? { 
                      ...project, 
                      chats: project.chats.filter((chat: ProjectChat) => chat.id !== chatId),
                      updatedAt: new Date()
                    }
                : project
            );
            projectsCache.current.timestamp = Date.now();
          }

          // 현재 URL이 삭제된 채팅방의 URL인 경우 프로젝트 메인 페이지로 이동하고 이벤트 발생
          if (window.location.pathname.includes(chatId)) {
            const route = getCurrentProjectType() === "record" ? "/student-record" : "/assignment";
            navigate(route);
            // 채팅방 삭제 이벤트 발생
            window.dispatchEvent(
              new CustomEvent("chatRoomDeleted", { detail: { chatId } })
            );
          }
        } catch (error) {
          console.error("Error deleting project chat:", error);
          // 삭제 실패 시 목록 새로고침
          fetchProjects(true);
        }
      }
    };

    // 스켈레톤 UI
    const ProjectSkeleton = () => (
      <div className="space-y-2 p-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse space-y-1.5 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg"
          >
            <div className="flex justify-between items-center">
              <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-6"></div>
            </div>
            <div className="space-y-1 ml-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );

    // 빈 상태 컴포넌트
    const EmptyState = () => (
      <div className="text-center py-6">
        <DocumentTextIcon className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {searchQuery ? "검색 결과가 없습니다" : "아직 프로젝트가 없습니다"}
        </p>
      </div>
    );

    if (!getCurrentProjectType()) return null;

    return (
      <div className="space-y-3">
        {/* 새 프로젝트 버튼 */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          새 프로젝트
        </button>

        {/* 검색 바 */}
        <div className="px-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* 프로젝트 목록 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && projects.length === 0 ? (
            <ProjectSkeleton />
          ) : (
            <div className="space-y-2 px-2">
              {filteredProjects.length === 0 ? (
                <EmptyState />
              ) : (
                filteredProjects.map((project: ProjectWithChats) => {
                  const isExpanded = expandedProjects[project.id] || false;
                  const sortedChats = project.chats?.sort(
                    (a: ProjectChat, b: ProjectChat) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  ) || [];
                  
                  // 확장 상태에 따라 표시할 채팅방 수 결정
                  const maxChatsToShow = isExpanded ? sortedChats.length : 3;
                  const visibleChats = sortedChats.slice(0, maxChatsToShow);
                  const hasMoreChats = sortedChats.length > maxChatsToShow;

                  return (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      {/* 프로젝트 헤더 */}
                      <div className="p-2.5 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {/* 접고 펼치기 버튼 */}
                            {sortedChats.length > 3 && (
                              <button
                                onClick={() => toggleProjectExpand(project.id)}
                                className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                                {project.name}
                              </h3>
                              {project.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                              {sortedChats.length}
                            </span>
                            <button
                              onClick={() => setSelectedProjectSettings(project.id)}
                              className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:text-primary-400 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Cog6ToothIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 채팅 목록 */}
                      <div className="p-1.5">
                        <div className="space-y-0.5">
                          {/* 채팅방 목록 */}
                          <div className={`space-y-0.5 ${isExpanded && sortedChats.length > 6 ? 'max-h-60 overflow-y-auto' : ''}`}>
                            {visibleChats.map((chat: ProjectChat) => (
                              <div
                                key={chat.id}
                                className="flex items-center justify-between group rounded hover:bg-gray-50 dark:hover:bg-gray-700 p-1.5 transition-colors"
                              >
                                <button
                                  onClick={() => {
                                    const route = getCurrentProjectType() === "record" ? "student-record" : "assignment";
                                    navigate(`/${route}/${project.id}/chat/${chat.id}`);
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className="flex-1 flex items-center space-x-1.5 text-left min-w-0"
                                >
                                  <DocumentTextIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {chat.name || "새 대화"}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {chat.created_at && format(parseISO(chat.created_at), 'MM/dd HH:mm', { locale: ko })}
                                    </div>
                                  </div>
                                </button>
                                {/* 미트볼 메뉴 */}
                                <ProjectChatMeatballMenu
                                  chatId={chat.id}
                                  chatName={chat.name || "새 대화"}
                                  projectId={project.id}
                                  onRename={async (chatId: string, newName: string) => {
                                    try {
                                      await projectApi.updateProjectChat(project.id, chatId, { name: newName });
                                      // 즉시 목록 업데이트
                                      setProjects(prevProjects => 
                                        prevProjects.map(p => 
                                          p.id === project.id 
                                            ? {
                                                ...p, 
                                                chats: p.chats.map(c => 
                                                  c.id === chatId ? { ...c, name: newName } : c
                                                )
                                              }
                                            : p
                                        )
                                      );
                                    } catch (error) {
                                      console.error('Error renaming chat:', error);
                                    }
                                  }}
                                  onDelete={(chatId: string, e: React.MouseEvent) => handleDeleteProjectChat(project.id, chatId, e)}
                                />
                              </div>
                            ))}
                          </div>
                          
                          {/* 더 보기 버튼 */}
                          {hasMoreChats && (
                            <button
                              onClick={() => toggleProjectExpand(project.id)}
                              className="flex items-center justify-center w-full py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronDownIcon className="w-3.5 h-3.5 mr-1" />
                                  접기
                                </>
                              ) : (
                                <>
                                  <ChevronRightIcon className="w-3.5 h-3.5 mr-1" />
                                  {sortedChats.length - maxChatsToShow}개 더 보기
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* 새 대화 버튼 */}
                          <button
                            onClick={() => handleNewProjectChat(project.id)}
                            className="flex items-center justify-center w-full py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors border border-dashed border-gray-300 dark:border-gray-600 mt-2"
                          >
                            <PlusIcon className="w-3.5 h-3.5 mr-1" />
                            새 대화
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 모달 */}
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleNewProject}
          projectType={getCurrentProjectType() || "assignment"}
        />
        <ProjectSettingsModal
          isOpen={!!selectedProjectSettings}
          onClose={() => setSelectedProjectSettings(null)}
          projectId={selectedProjectSettings}
          projectType={getCurrentProjectType() || "assignment"}
        />
      </div>
    );
  };

  // 새 채팅방 생성 함수
  const handleNewChat = async () => {
    try {
      const newRoom = await chatApi.createChatRoom();
      window.dispatchEvent(new Event("chatRoomUpdated"));
      navigate(`/chat/${newRoom.id}`);
      setIsMobileMenuOpen(false); // 모바일에서 새 채팅 생성 후 메뉴 닫기
    } catch (error) {
      console.error("Error creating chat room:", error);
    }
  };

  const ChatList = () => {
    const [chats, setChats] = useState<any[]>([]);
    const [filteredChats, setFilteredChats] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [folderStates, setFolderStates] = useState<{ [key: string]: boolean }>({});

    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const rooms = await chatApi.getChatRooms();
        setChats(rooms);
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // 검색 필터링
    useEffect(() => {
      if (!searchQuery.trim()) {
        setFilteredChats(chats);
        return;
      }

      const filtered = chats.filter(chat =>
        chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }, [searchQuery, chats]);

    // 폴더 상태 초기화
    useEffect(() => {
      if (filteredChats.length > 0) {
        const monthKeys = new Set(
          filteredChats.map(chat => format(parseISO(chat.created_at), 'yyyy-MM', { locale: ko }))
        );
        
        setFolderStates(prev => {
          const newStates = { ...prev };
          monthKeys.forEach(monthKey => {
            if (!(monthKey in newStates)) {
              newStates[monthKey] = true; // 새로운 월은 기본적으로 열림
            }
          });
          return newStates;
        });
      }
    }, [filteredChats]);

    useEffect(() => {
      if (isAuthenticated) {
        fetchChats();
      }
    }, [isAuthenticated]);

    useEffect(() => {
      const handleChatRoomUpdate = () => {
        fetchChats();
      };

      window.addEventListener("chatRoomUpdated", handleChatRoomUpdate);
      return () => {
        window.removeEventListener("chatRoomUpdated", handleChatRoomUpdate);
      };
    }, []);

    const handleDeleteChat = async (roomId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm("정말로 이 대화를 삭제하시겠습니까?")) {
        try {
          await chatApi.deleteChatRoom(roomId);
          await fetchChats();
          if (location.pathname === `/chat/${roomId}`) {
            navigate("/");
          }
        } catch (error) {
          console.error("Error deleting chat room:", error);
        }
      }
    };

    // 폴더 토글 함수
    const toggleFolder = (folder: string) => {
      setFolderStates(prev => ({
        ...prev,
        [folder]: !prev[folder]
      }));
    };

    const groupChatsByDate = (chats: any[]) => {
      const groups: { [key: string]: any[] } = {};

      chats.forEach((chat) => {
        const date = parseISO(chat.created_at);
        const monthKey = format(date, 'yyyy-MM', { locale: ko });
        
        if (!groups[monthKey]) {
          groups[monthKey] = [];
        }
        groups[monthKey].push(chat);
      });

      // 날짜순으로 정렬 (최신 월부터)
      const sortedGroups: { [key: string]: any[] } = {};
      Object.keys(groups)
        .sort((a, b) => b.localeCompare(a))
        .forEach(key => {
          sortedGroups[key] = groups[key];
        });

      return sortedGroups;
    };

    const getFolderTitle = (period: string) => {
      // period는 'yyyy-MM' 형태 (예: '2025-01')
      const [year, month] = period.split('-');
      return `${year}년 ${parseInt(month)}월`;
    };

    // 스켈레톤 UI
    const ChatSkeleton = () => (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-2 mb-1">
              <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
            </div>
            <div className="space-y-1 ml-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );

    // 빈 상태 컴포넌트
    const EmptyState = () => (
      <div className="text-center py-4">
        <DocumentTextIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {searchQuery ? "검색 결과가 없습니다" : "아직 채팅방이 없습니다"}
        </p>
      </div>
    );

    return (
      <div className="space-y-3">
        {/* 검색 바 */}
        <div className="relative">
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
          />
          <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 채팅방 목록 */}
        <div className="space-y-2">
          {isLoading ? (
            <ChatSkeleton />
          ) : filteredChats.length === 0 ? (
            <EmptyState />
          ) : (
            Object.entries(groupChatsByDate(filteredChats)).map(([period, periodChats]) => {
              if (periodChats.length === 0) return null;

              const isOpen = folderStates[period] !== false;

              return (
                <div key={period} className="space-y-1">
                  {/* 폴더 헤더 */}
                  <button
                    onClick={() => toggleFolder(period)}
                    className="flex items-center justify-between w-full p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="transition-transform duration-200">
                        {isOpen ? (
                          <ChevronDownIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      <CalendarDaysIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                        {getFolderTitle(period)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                      {periodChats.length}
                    </span>
                  </button>

                  {/* 채팅방 목록 */}
                  {isOpen && (
                    <div className="ml-5 space-y-1">
                      {periodChats.map((chat) => (
                        <div
                          key={chat.id}
                          className="flex items-center justify-between group rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 p-1.5"
                        >
                          <button
                            onClick={() => {
                              navigate(`/chat/${chat.id}`);
                              setIsMobileMenuOpen(false);
                            }}
                            className="flex-1 flex items-center space-x-2 text-left min-w-0"
                          >
                            <DocumentTextIcon className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {chat.name || "새 채팅"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {format(parseISO(chat.created_at), 'MM/dd HH:mm', { locale: ko })}
                              </div>
                            </div>
                          </button>
                          {/* 미트볼 메뉴 */}
                          <ChatMeatballMenu
                            chatId={chat.id}
                            chatName={chat.name || "새 채팅"}
                            onRename={async (chatId: string, newName: string) => {
                              try {
                                await chatApi.updateChatRoom(chatId, { name: newName });
                                setFilteredChats(prevChats => 
                                  prevChats.map(c => 
                                    c.id === chatId ? { ...c, name: newName } : c
                                  )
                                );
                                setChats(prevChats => 
                                  prevChats.map(c => 
                                    c.id === chatId ? { ...c, name: newName } : c
                                  )
                                );
                              } catch (error) {
                                console.error('Error renaming chat:', error);
                              }
                            }}
                            onDelete={handleDeleteChat}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // 프로필 이미지나 이니셜을 표시하는 컴포넌트
  const ProfileImage = () => {
    // 사용자 정보가 아직 로딩 중일 때 스켈레톤 표시
    if (!user) {
      return (
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      );
    }
    
    if (user?.profile_image) {
      return (
        <img
          className="w-9 h-9 rounded-full object-cover"
          src={user.profile_image}
          alt={user.full_name}
        />
      );
    }
    
    return (
      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors">
        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
          {getInitial(user.full_name)}
        </span>
      </div>
    );
  };

  return (
    <header className="bg-white shadow-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-16 px-4 sm:px-6">
        {/* Desktop/Tablet Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex mr-2 p-2.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="사이드바 토글"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link to="/chat" className="flex items-center">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            Sungblab AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-end flex-1 space-x-4">
          <nav className="flex items-center space-x-8">
            <div className="flex space-x-8">
              <Link
                to="/chat"
                className={`relative text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors ${
                  isCurrentPage("/chat")
                    ? "text-primary-600 dark:text-primary-400 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-primary-600 dark:after:bg-primary-400"
                    : ""
                }`}
              >
                일반 채팅
              </Link>
              <Link
                to="/assignment"
                className={`relative text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors ${
                  isCurrentPage("/assignment")
                    ? "text-primary-600 dark:text-primary-400 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-primary-600 dark:after:bg-primary-400"
                    : ""
                }`}
              >
                수행평가
              </Link>
              <Link
                to="/student-record"
                className={`relative text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors ${
                  isCurrentPage("/student-record")
                    ? "text-primary-600 dark:text-primary-400 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-primary-600 dark:after:bg-primary-400"
                    : ""
                }`}
              >
                생기부
              </Link>
            </div>
            {isAuthenticated && user?.is_superuser && (
              <div className="pl-8 border-l border-gray-200 dark:border-gray-700">
                <Link
                  to="/admin"
                  className={`relative text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors ${
                    isCurrentPage("/admin")
                      ? "text-primary-600 dark:text-primary-400 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-primary-600 dark:after:bg-primary-400"
                      : ""
                  }`}
                >
                  관리자
                </Link>
              </div>
            )}
          </nav>

          {/* Auth Buttons or Profile */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <AuthButtons />
            ) : (
              <Menu as="div" className="relative z-50">
                <Menu.Button>
                  <ProfileImage />
                </Menu.Button>

                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none">
                    <div className="p-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => setShowSettings(true)}
                            className={`${
                              active ? "bg-gray-100 dark:bg-gray-700" : ""
                            } w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300`}
                          >
                            설정
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`${
                              active ? "bg-gray-100 dark:bg-gray-700" : ""
                            } w-full text-left px-3 py-2 text-sm rounded-md text-red-600 dark:text-red-400`}
                          >
                            로그아웃
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden ml-auto">
          <button
            type="button"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* 배경 오버레이 - 페이드 인/아웃 애니메이션 */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? "opacity-30" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* 메뉴 패널 - 슬라이드 애니메이션 */}
        <div
          className={`fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            {/* 헤더 - 로고와 닫기 버튼 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                Sungblab AI
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="메뉴 닫기"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 상단 네비게이션 */}
            <div className="p-4">
              <NavLinks />
            </div>

            {/* 채팅/프로젝트 목록 */}
            {isAuthenticated && (
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="px-4">
                  <div className="py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {location.pathname === "/" ||
                        location.pathname.startsWith("/chat")
                          ? "일반 채팅"
                          : location.pathname.startsWith("/assignment")
                          ? "수행평가 프로젝트"
                          : "생기부 프로젝트"}
                      </h3>
                      {(location.pathname === "/" ||
                        location.pathname.startsWith("/chat")) && (
                        <button
                          onClick={handleNewChat}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md flex items-center"
                        >
                          <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />새 채팅
                        </button>
                      )}
                    </div>
                    {(location.pathname === "/" ||
                      location.pathname.startsWith("/chat")) && <ChatList />}
                    {(location.pathname.startsWith("/assignment") ||
                      location.pathname.startsWith("/student-record")) && (
                      <ProjectList />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 하단 고정 영역 */}
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700 p-4">
              {isAuthenticated ? (
                <ProfileMenu />
              ) : (
                <div className="flex flex-col space-y-2">
                  <AuthButtons />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  );
};

export default Header;
