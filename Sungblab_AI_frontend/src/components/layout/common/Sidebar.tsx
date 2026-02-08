import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  Cog6ToothIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import ProfileMenu from "./ProfileMenu";
import CreateProjectModal from "../../project/CreateProjectModal";
import ProjectSettingsModal from "../../project/ProjectSettingsModal";
import { useProjectApi } from "../../../api/projectApi";
import { ProjectWithChats, ProjectType } from "../../../types/project";
import { useAuth } from "../../../contexts/AuthContext";
import { useChatApi, ChatRoom } from "../../../api/chatApi";
import { useLayout } from "../../../contexts/LayoutContext";
import { parseISO, format } from "date-fns";
import { ko } from "date-fns/locale";

// 폴더 상태 타입
interface FolderState {
  [key: string]: boolean;
}

// 프로젝트 확장 상태 타입
interface ProjectExpandState {
  [key: string]: boolean;
}

// 개선된 스켈레톤 UI
const ChatRoomSkeleton = () => (
  <div className="space-y-1.5 p-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="flex items-center space-x-2 mb-1">
          <div className="h-3.5 w-3.5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-6"></div>
        </div>
        <div className="space-y-1 ml-5">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// 폴더 컴포넌트
interface FolderProps {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Folder: React.FC<FolderProps> = ({ title, count, isOpen, onToggle, icon, children }) => (
  <div className="mb-1.5">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
    >
      <div className="flex items-center space-x-2.5">
        <div className="transition-transform duration-200">
          {isOpen ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </div>
        <div className="text-gray-600 dark:text-gray-400">{icon}</div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
          {title}
        </span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full min-w-[20px] text-center">
        {count}
      </span>
    </button>
    {isOpen && (
      <div className="ml-6 mt-1 space-y-1">
        {children}
      </div>
    )}
  </div>
);

// 빈 상태 컴포넌트
const EmptyState: React.FC<{ searchQuery: string }> = ({ searchQuery }) => (
  <div className="text-center py-6">
    <DocumentTextIcon className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {searchQuery ? "검색 결과가 없습니다" : "아직 채팅방이 없습니다"}
    </p>
  </div>
);

// 미트볼 메뉴 컴포넌트
const MeatballMenu: React.FC<{
  roomId: string;
  roomName: string;
  onRename: (roomId: string, newName: string) => void;
  onDelete: (roomId: string, e: React.MouseEvent) => void;
  index?: number;
}> = ({ roomId, roomName, onRename, onDelete, index = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(roomName);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsRenaming(false);
        setNewName(roomName);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [roomName]);

  const handleRename = () => {
    if (newName.trim() && newName !== roomName) {
      onRename(roomId, newName.trim());
    }
    setIsRenaming(false);
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewName(roomName);
    }
  };

  const calculateDropdownPosition = () => {
    // 첫 번째 채팅(index 0)은 항상 아래로, 두 번째부터(index 1+)는 위로
    if (index === 0) {
      setDropdownPosition('bottom');
    } else {
      setDropdownPosition('top');
    }
  };

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    calculateDropdownPosition();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
      >
        <EllipsisVerticalIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-[9999] ${
          dropdownPosition === 'top' ? 'bottom-6 mb-1' : 'top-6 mt-1'
        }`}>
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
                  onDelete(roomId, e);
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

// 채팅방 아이템 컴포넌트
const ChatRoomItem: React.FC<{
  room: ChatRoom;
  onChatRoomClick: (roomId: string) => void;
  onDeleteChat: (roomId: string, e: React.MouseEvent) => void;
  onRenameChat: (roomId: string, newName: string) => void;
}> = ({ room, onChatRoomClick, onDeleteChat, onRenameChat }) => (
  <div className="flex items-center justify-between group rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 p-2">
    <button
      onClick={() => onChatRoomClick(room.id)}
      className="flex-1 flex items-center space-x-3 text-left min-w-0"
    >
      <div className="flex-shrink-0">
        <DocumentTextIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {room.name || "새 채팅"}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {format(parseISO(room.created_at), 'MM/dd HH:mm', { locale: ko })}
        </div>
      </div>
    </button>
    <MeatballMenu
      roomId={room.id}
      roomName={room.name || "새 채팅"}
      onRename={onRenameChat}
      onDelete={onDeleteChat}
    />
  </div>
);

// 채팅방 목록 컴포넌트
const ChatRoomList: React.FC<{
  chatRooms: ChatRoom[];
  folderStates: FolderState;
  toggleFolder: (folder: string) => void;
  onChatRoomClick: (roomId: string) => void;
  onDeleteChat: (roomId: string, e: React.MouseEvent) => void;
  onRenameChat: (roomId: string, newName: string) => void;
}> = ({ chatRooms, folderStates, toggleFolder, onChatRoomClick, onDeleteChat, onRenameChat }) => {
  const groupChatsByDate = (chats: ChatRoom[]) => {
    const groups: { [key: string]: ChatRoom[] } = {};

    chats.forEach((chat) => {
      const date = parseISO(chat.created_at);
      const monthKey = format(date, 'yyyy-MM', { locale: ko });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(chat);
    });

    // 날짜순으로 정렬 (최신 월부터)
    const sortedGroups: { [key: string]: ChatRoom[] } = {};
    Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .forEach(key => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  };

  const getFolderIcon = (period: string) => {
    return <CalendarDaysIcon className="w-4 h-4" />;
  };

  const getFolderTitle = (period: string) => {
    // period는 'yyyy-MM' 형태 (예: '2025-01')
    const [year, month] = period.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  return (
    <>
      {Object.entries(groupChatsByDate(chatRooms)).map(([period, chats]) => {
        if (chats.length === 0) return null;

        return (
          <Folder
            key={period}
            title={getFolderTitle(period)}
            count={chats.length}
            isOpen={folderStates[period] !== false} // 기본값은 true (열림)
            onToggle={() => toggleFolder(period)}
            icon={getFolderIcon(period)}
          >
            <div className="space-y-1">
              {chats.map(room => (
                <ChatRoomItem
                  key={room.id}
                  room={room}
                  onChatRoomClick={onChatRoomClick}
                  onDeleteChat={onDeleteChat}
                  onRenameChat={onRenameChat}
                />
              ))}
            </div>
          </Folder>
        );
      })}
    </>
  );
};

export const GeneralChatSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [filteredChatRooms, setFilteredChatRooms] = useState<ChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderStates, setFolderStates] = useState<FolderState>({});
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const chatApi = useChatApi();
  const { isMobileMenuOpen, toggleMobileMenu, isSidebarOpen } = useLayout();
  const chatRoomsCache = useRef<{ data: ChatRoom[]; timestamp: number } | null>(null);
  const isInitialLoad = useRef(true);

  // 폴더 토글 함수
  const toggleFolder = (folder: string) => {
    setFolderStates(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  // 폴더 상태 초기화 (새로운 월이 나타날 때마다)
  useEffect(() => {
    if (filteredChatRooms.length > 0) {
      const monthKeys = new Set(
        filteredChatRooms.map(room => format(parseISO(room.created_at), 'yyyy-MM', { locale: ko }))
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
  }, [filteredChatRooms]);

  // 검색 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChatRooms(chatRooms);
      return;
    }

    const filtered = chatRooms.filter(room =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChatRooms(filtered);
  }, [searchQuery, chatRooms]);

  const fetchChatRooms = async (forceRefresh = false) => {
    try {
      const now = Date.now();
      if (
        !forceRefresh &&
        chatRoomsCache.current &&
        now - chatRoomsCache.current.timestamp < 60 * 1000
      ) {
        setChatRooms(chatRoomsCache.current.data);
        return;
      }

      if (isInitialLoad.current) {
        setIsLoading(true);
        isInitialLoad.current = false;
      }

      const rooms = await chatApi.getChatRooms();

      chatRoomsCache.current = {
        data: rooms,
        timestamp: now,
      };

      setChatRooms(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatRoomUpdate = useCallback(() => {
    if (chatRoomsCache.current) {
      chatRoomsCache.current = null;
    }
    fetchChatRooms(true);
  }, []);

  const handleWindowFocus = useCallback(() => {
    if (
      chatRoomsCache.current &&
      Date.now() - chatRoomsCache.current.timestamp > 30 * 1000
    ) {
      fetchChatRooms(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChatRooms();

      window.addEventListener("chatRoomUpdated", handleChatRoomUpdate);
      window.addEventListener("chatRoomCreated", handleChatRoomUpdate);
      window.addEventListener("focus", handleWindowFocus);

      const interval = setInterval(() => {
        fetchChatRooms(true);
      }, 5 * 60 * 1000);

      return () => {
        window.removeEventListener("chatRoomUpdated", handleChatRoomUpdate);
        window.removeEventListener("chatRoomCreated", handleChatRoomUpdate);
        window.removeEventListener("focus", handleWindowFocus);
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, handleChatRoomUpdate, handleWindowFocus]);

  const handleNewGeneralChat = async () => {
    try {
      const newRoom = await chatApi.createChatRoom();
      
      const newRoomData: ChatRoom = {
        id: newRoom.id,
        name: newRoom.name || "새 채팅",
        user_id: newRoom.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setChatRooms(prevRooms => [newRoomData, ...prevRooms]);
      
      if (chatRoomsCache.current) {
        chatRoomsCache.current.data = [newRoomData, ...chatRoomsCache.current.data];
        chatRoomsCache.current.timestamp = Date.now();
      }

      navigate(`/chat/${newRoom.id}`);
      
      if (isMobileMenuOpen) {
        toggleMobileMenu();
      }

      setTimeout(() => {
        fetchChatRooms(true);
      }, 1000);
    } catch (error) {
      console.error("Error creating chat room:", error);
    }
  };

  const handleDeleteChat = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("정말로 이 대화를 삭제하시겠습니까?")) {
      try {
        await chatApi.deleteChatRoom(roomId);

        const updatedRooms = chatRooms.filter((room) => room.id !== roomId);
        setChatRooms(updatedRooms);
        if (chatRoomsCache.current) {
          chatRoomsCache.current.data = updatedRooms;
          chatRoomsCache.current.timestamp = Date.now();
        }

        if (window.location.pathname.includes(roomId)) {
          navigate("/chat");
          window.dispatchEvent(
            new CustomEvent("chatRoomDeleted", { detail: { roomId } })
          );
        }
      } catch (error) {
        console.error("Error deleting chat room:", error);
        fetchChatRooms(true);
      }
    }
  };

  const handleRenameChat = async (roomId: string, newName: string) => {
    try {
      await chatApi.updateChatRoom(roomId, {
        title: newName,
      });

      // 즉시 UI 업데이트
      const updatedRooms = chatRooms.map((room) =>
        room.id === roomId ? { ...room, name: newName } : room
      );
      setChatRooms(updatedRooms);
      
      if (chatRoomsCache.current) {
        chatRoomsCache.current.data = chatRoomsCache.current.data.map((room) =>
          room.id === roomId ? { ...room, name: newName } : room
        );
        chatRoomsCache.current.timestamp = Date.now();
      }

      // 백그라운드에서 전체 목록 새로고침
      setTimeout(() => {
        fetchChatRooms(true);
      }, 1000);
    } catch (error) {
      console.error("Error renaming chat room:", error);
      fetchChatRooms(true);
    }
  };

  return (
    <aside
      className={`
        ${isSidebarOpen ? "w-72" : "w-0"}
        bg-white dark:bg-gray-900 h-[calc(100vh-4rem)] shadow-xl flex flex-col border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 ease-in-out
        overflow-hidden
      `}
    >


      <div className="flex-1 flex flex-col min-h-0">
        {/* 헤더 */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              일반 채팅
            </h2>
            <button
              onClick={handleNewGeneralChat}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <PlusIcon className="w-4 h-4" />
              <span>새 채팅</span>
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
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

        {/* 채팅방 목록 */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-y-auto">
            {isLoading && chatRooms.length === 0 ? (
              <ChatRoomSkeleton />
            ) : (
              <div className="p-3 space-y-2">
                {filteredChatRooms.length === 0 ? (
                  <EmptyState searchQuery={searchQuery} />
                ) : (
                  <ChatRoomList 
                    chatRooms={filteredChatRooms} 
                    folderStates={folderStates} 
                    toggleFolder={toggleFolder}
                    onChatRoomClick={(roomId) => navigate(`/chat/${roomId}`)}
                    onDeleteChat={handleDeleteChat}
                    onRenameChat={handleRenameChat}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* 프로필 메뉴 */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-auto">
          <div className="p-2">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </aside>
  );
};

interface ProjectSidebarProps {
  projectType: ProjectType;
}

// ProjectSidebar도 동일한 방식으로 스켈레톤 UI 적용
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

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projectType,
}) => {
  const navigate = useNavigate();
  const projectApi = useProjectApi();
  const [projects, setProjects] = useState<ProjectWithChats[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithChats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectSettings, setSelectedProjectSettings] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<ProjectExpandState>({});
  const { isSidebarOpen } = useLayout();
  const projectsCache = useRef<{ data: ProjectWithChats[]; timestamp: number } | null>(
    null
  );
  const isInitialLoad = useRef(true);

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

  const fetchProjects = async (forceRefresh = false) => {
    try {
      // 강제 새로고침이 아닌 경우 캐시 확인 (캐시 유효시간을 1분으로 설정)
      const now = Date.now();
      if (
        !forceRefresh &&
        projectsCache.current &&
        now - projectsCache.current.timestamp < 60 * 1000
      ) {
        const filteredProjects = projectsCache.current.data
          .filter((project: ProjectWithChats) => project.type === projectType)
          .sort((a: ProjectWithChats, b: ProjectWithChats) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
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

      const filteredAndSortedProjects = projectList
        .filter((project: ProjectWithChats) => project.type === projectType)
        .sort((a: ProjectWithChats, b: ProjectWithChats) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

      setProjects(filteredAndSortedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 프로젝트 업데이트 이벤트 핸들러 최적화
  const handleProjectUpdate = useCallback((event?: Event) => {
    // 이벤트에서 프로젝트 정보를 받은 경우
    const customEvent = event as CustomEvent;
    if (customEvent && customEvent.detail && customEvent.detail.projectId) {
      const { projectId, updatedAt, name, type } = customEvent.detail;
      
      // 해당 프로젝트 타입이 현재 표시 중인 타입과 일치하는 경우에만 처리
      if (type === projectType) {
        setProjects(prevProjects => {
          const updatedProjects = prevProjects.map(project => 
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
          projectsCache.current.data = projectsCache.current.data.map(project => 
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
      if (projectsCache.current) {
        projectsCache.current = null;
      }
      fetchProjects(true);
    }
  }, [projectType]);

  // 포커스 이벤트 핸들러 추가
  const handleWindowFocus = useCallback(() => {
    // 캐시가 30초 이상 된 경우 새로고침
    if (
      projectsCache.current &&
      Date.now() - projectsCache.current.timestamp > 30 * 1000
    ) {
      fetchProjects(true);
    }
  }, []);

  useEffect(() => {
    fetchProjects();

    // 다양한 이벤트 리스너 추가
    window.addEventListener("projectUpdated", handleProjectUpdate);
    window.addEventListener("projectDeleted", handleProjectUpdate);
    window.addEventListener("chatRoomCreated", handleProjectUpdate);
    window.addEventListener("focus", handleWindowFocus);

    // 주기적 새로고침 (5분마다)
    const interval = setInterval(() => {
      fetchProjects(true);
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("projectUpdated", handleProjectUpdate);
      window.removeEventListener("projectDeleted", handleProjectUpdate);
      window.removeEventListener("chatRoomCreated", handleProjectUpdate);
      window.removeEventListener("focus", handleWindowFocus);
      clearInterval(interval);
    };
  }, [projectType, handleProjectUpdate, handleWindowFocus]);

  // 새 프로젝트 생성
  const handleCreateProject = async (name: string, description: string) => {
    try {
      const newProject = await projectApi.createProject({
        name,
        type: projectType,
        description,
      });
      
      // 즉시 목록에 추가하여 사용자 경험 개선
      const newProjectData: ProjectWithChats = {
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

  // 새 채팅방 생성
  const handleNewChat = async (projectId: string) => {
    try {
      const newChat = await projectApi.createProjectChat(projectId, {
        name: "",
      });
      
      // 즉시 해당 프로젝트에 채팅방 추가하고 업데이트 시간 갱신하여 맨 위로 정렬
      setProjects(prevProjects => {
        const updatedProjects = prevProjects.map(project => 
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
        projectsCache.current.data = projectsCache.current.data.map(project => 
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

      const route =
        projectType === "assignment" ? "assignment" : "student-record";
      navigate(`/${route}/${projectId}/chat/${newChat.id}`);
      
      // 백그라운드에서 전체 목록 새로고침
      setTimeout(() => {
        fetchProjects(true);
      }, 1000);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  // 채팅방 삭제
  const handleDeleteChat = async (projectId: string, chatId: string) => {
    if (window.confirm("정말로 이 대화를 삭제하시겠습니까?")) {
      try {
        await projectApi.deleteProjectChat(projectId, chatId);
        
        // 즉시 해당 프로젝트에서 채팅방 제거하고 업데이트 시간 갱신
        setProjects(prevProjects => {
          const updatedProjects = prevProjects.map(project => 
            project.id === projectId 
              ? { 
                  ...project, 
                  chats: project.chats.filter(chat => chat.id !== chatId),
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
          projectsCache.current.data = projectsCache.current.data.map(project => 
            project.id === projectId 
              ? { 
                  ...project, 
                  chats: project.chats.filter(chat => chat.id !== chatId),
                  updatedAt: new Date()
                }
              : project
          );
          projectsCache.current.timestamp = Date.now();
        }

        // 현재 URL이 삭제된 채팅방의 URL인 경우 프로젝트 메인 페이지로 이동하고 이벤트 발생
        if (window.location.pathname.includes(chatId)) {
          const route =
            projectType === "assignment" ? "/assignment" : "/student-record";
          navigate(route);
          // 채팅방 삭제 이벤트 발생
          window.dispatchEvent(
            new CustomEvent("chatRoomDeleted", { detail: { chatId } })
          );
        }
      } catch (error) {
        console.error("Error deleting chat:", error);
        // 삭제 실패 시 목록 새로고침
        fetchProjects(true);
      }
    }
  };

  // 채팅방 이름 변경
  const handleRenameChat = async (projectId: string, chatId: string, newName: string) => {
    try {
      await projectApi.updateProjectChat(projectId, chatId, {
        name: newName,
      });

      // 즉시 UI 업데이트
      setProjects(prevProjects => {
        const updatedProjects = prevProjects.map(project => 
          project.id === projectId 
            ? { 
                ...project, 
                chats: project.chats.map(chat => 
                  chat.id === chatId ? { ...chat, name: newName } : chat
                ),
                updatedAt: new Date()
              }
            : project
        );
        
        return updatedProjects.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      
      // 캐시도 즉시 업데이트
      if (projectsCache.current) {
        projectsCache.current.data = projectsCache.current.data.map(project => 
          project.id === projectId 
            ? { 
                ...project, 
                chats: project.chats.map(chat => 
                  chat.id === chatId ? { ...chat, name: newName } : chat
                ),
                updatedAt: new Date()
              }
            : project
        );
        projectsCache.current.timestamp = Date.now();
      }

      // 백그라운드에서 전체 목록 새로고침
      setTimeout(() => {
        fetchProjects(true);
      }, 1000);
    } catch (error) {
      console.error("Error renaming chat:", error);
      fetchProjects(true);
    }
  };

  const renderProjectCard = (project: ProjectWithChats) => {
    const isExpanded = expandedProjects[project.id] || false;
    const sortedChats = project.chats.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );
    
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
              {project.chats.length > 3 && (
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
                {project.chats.length}
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
          <div className="space-y-0.5 min-h-[120px]">
            {/* 채팅방 목록 */}
            <div className={`space-y-0.5 ${isExpanded && sortedChats.length > 6 ? 'max-h-60 overflow-y-auto overflow-x-hidden' : ''}`}>
              {visibleChats.map((chat, index) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between group rounded hover:bg-gray-50 dark:hover:bg-gray-700 p-1.5 transition-colors"
                >
                  <button
                    onClick={() => {
                      const route =
                        projectType === "assignment"
                          ? "assignment"
                          : "student-record";
                      navigate(
                        `/${route}/${project.id}/chat/${chat.id}`
                      );
                    }}
                    className="flex-1 flex items-center space-x-1.5 text-left min-w-0"
                  >
                    <DocumentTextIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {chat.name || "새 대화"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(parseISO(chat.created_at), 'MM/dd HH:mm', { locale: ko })}
                      </div>
                    </div>
                  </button>
                  <MeatballMenu
                    roomId={chat.id}
                    roomName={chat.name || "새 대화"}
                    onRename={(chatId, newName) => handleRenameChat(project.id, chatId, newName)}
                    onDelete={(chatId, e) => {
                      e.stopPropagation();
                      handleDeleteChat(project.id, chatId);
                    }}
                    index={index}
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
              onClick={() => handleNewChat(project.id)}
              className="flex items-center justify-center w-full py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors border border-dashed border-gray-300 dark:border-gray-600 mt-2"
            >
              <PlusIcon className="w-3.5 h-3.5 mr-1" />
              새 대화
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className={`
      ${isSidebarOpen ? "w-72" : "w-0"}
      bg-white dark:bg-gray-900 h-[calc(100vh-4rem)] shadow-xl flex flex-col border-r border-gray-200 dark:border-gray-800
      transition-all duration-300 ease-in-out
      overflow-hidden
    `}>
      <div className="flex-1 flex flex-col min-h-0">
        {/* 헤더 */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {projectType === "assignment" ? "수행평가" : "생기부"}
            </h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <PlusIcon className="w-4 h-4" />
              <span>새 프로젝트</span>
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
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

        {/* 프로젝트 목록 */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-y-auto">
            {isLoading && projects.length === 0 ? (
              <ProjectSkeleton />
            ) : (
              <div className="p-2 space-y-2">
                {filteredProjects.length === 0 ? (
                  <EmptyState searchQuery={searchQuery} />
                ) : (
                  filteredProjects.map(renderProjectCard)
                )}
              </div>
            )}
          </div>
        </div>

        {/* 프로필 메뉴 */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-auto">
          <div className="p-2">
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* 모달 */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        projectType={projectType}
      />
      <ProjectSettingsModal
        isOpen={!!selectedProjectSettings}
        onClose={() => setSelectedProjectSettings(null)}
        projectId={selectedProjectSettings}
        projectType={projectType}
      />
    </aside>
  );
};
