import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  useCallback,
  DragEvent,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { 
  PaperClipIcon, 
  ArrowUpIcon,
  MagnifyingGlassIcon,
  StopIcon
} from "@heroicons/react/24/outline";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import { useApi, getBaseUrl } from "../../utils/api";
import { ChatMessage } from "../../types/chat";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useProjectApi } from "../../api/projectApi";
import { ProjectWithChats, ProjectChat } from "../../types/project";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { useReport } from "../../contexts/ReportContext";
import { useChatApi } from "../../api/chatApi";

interface ChatInterfaceProps {
  chatId?: string;
  projectId?: string;
}

interface StreamingMessage extends ChatMessage {
  isStreaming?: boolean;
  files?: Array<{
    type: string;
    data: string;
    name: string;
  }>;
  citations?: Array<{
    url: string;
    title?: string;
  }>;
  reasoningContent?: string;
  thoughtTime?: number;
  showReasoning?: boolean;
  functionCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }>;
  codeExecutions?: Array<{
    code: string;
    result: string;
    language: string;
  }>;
  groundingMetadata?: {
    searchQueries?: string[];
    sources?: Array<{ url: string; title: string }>;
  };
  updated_at: string;
}

// 스트리밍 응답 타입 정의 (확장)
interface StreamingResponse {
  content?: string;
  reasoning_content?: string;
  thought_time?: number;
  citations?: Array<{ url: string; title?: string }>;
  function_call?: {
    name: string;
    arguments: Record<string, any>;
    result?: any;
  };
  code_execution?: {
    code: string;
    result: string;
    language: string;
  };
  grounding_metadata?: {
    search_queries?: string[];
    sources?: Array<{ url: string; title: string }>;
  };
  error?: string;
}

// 모델 그룹 타입 정의
type ModelGroup = "basic_chat" | "normal_analysis" | "advanced_analysis";

// 익명 사용자 관련 타입
interface AnonymousUsage {
  session_id: string;
  current_usage: number;
  limit: number;
  remaining: number;
  is_limit_exceeded: boolean;
}

// 모델 상수 정의 (제미나이 2개 모델만)
const MODELS = {
  GEMINI_PRO: 'gemini-2.5-pro',
  GEMINI_FLASH: 'gemini-2.5-flash'
};

// 백엔드 버전 코드 매핑
const MODEL_VERSION_MAPPING: Record<string, string> = {
  [MODELS.GEMINI_PRO]: "gemini-2.5-pro",
  [MODELS.GEMINI_FLASH]: "gemini-2.5-flash"
};

// 채팅방 모델 정보를 저장하는 키 상수 추가
const ROOM_MODEL_KEY = (roomId: string) => `chat_room_${roomId}_model`;

interface ModelOption {
  value: string;
  name: string;
  description: string;
  logo?: string;
}

const ChatInterface = forwardRef<
  {
    setNewMessage: (message: string) => void;
    setInputMessage: (message: string) => void;
    handleModelChange: (modelId: string) => void;
  },
  ChatInterfaceProps
>(({ chatId, projectId }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ roomId: string }>();
  const currentRoomId = params.roomId || chatId;
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    // 채팅방별 저장된 모델 설정을 우선 확인
    if (currentRoomId) {
      const savedRoomModel = localStorage.getItem(
        ROOM_MODEL_KEY(currentRoomId)
      );
      if (savedRoomModel) return savedRoomModel;
    }
    // 없으면 기본 모델 설정 사용
    const savedModel = localStorage.getItem("selected_model");
    return savedModel || MODELS.GEMINI_FLASH;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { fetchWithAuth } = useApi();
  const projectApi = useProjectApi();
  const { updateChatRoom, generateChatTitle } = useChatApi();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { isAuthenticated, token, user } = useAuth();
  const [isLimitExceeded] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const {
    reportState,
    setContent,
    setHtmlContent,
    setPreviewOpen,
    setReportStep,
  } = useReport();
  const { subscription, updateUsage } = useSubscription();

  // 익명 사용자 관련 상태
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [anonymousUsage, setAnonymousUsage] = useState<AnonymousUsage | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const MESSAGE_WARNING_THRESHOLD = 40; // 메시지 경고 임계값


  const MULTIMODAL_MODELS = useMemo(
    () => [MODELS.GEMINI_PRO, MODELS.GEMINI_FLASH],
    []
  );

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [reasoningStates, setReasoningStates] = useState<{[key: string | number]: boolean}>({});

  // 중복 메시지 제거를 위한 공통 함수
  const removeDuplicateMessages = useCallback((messages: StreamingMessage[]): StreamingMessage[] => {
    const messageMap = new Map<string, StreamingMessage>();
    
    messages.forEach((curr: StreamingMessage) => {
      const messageKey = `${curr.content}_${curr.role}_${Math.floor(
        new Date(curr.created_at || '').getTime() / 1000
      )}`;
      
      if (!messageMap.has(messageKey)) {
        messageMap.set(messageKey, curr);
      }
    });
    
    return Array.from(messageMap.values()).sort(
      (a: StreamingMessage, b: StreamingMessage) => {
        return (
          new Date(a.created_at || '').getTime() -
          new Date(b.created_at || '').getTime()
        );
      }
    );
  }, []);

  // reasoning 상태 토글 함수
  const handleToggleReasoning = useCallback((messageId: number | string) => {
    setReasoningStates(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  }, []);

  // 드롭다운 외부 클릭 감지
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsModelDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // 모델 옵션 정의 (제미나이 2개 모델만)
  const modelOptions = useMemo(() => {
    const baseOptions: ModelOption[] = [
      {
        value: MODELS.GEMINI_PRO,
        name: "Gemini 2.5 Pro",
        description: "고급 추론 및 분석 기능, 멀티모달 지원",
        logo: "/Google.png",
      },
      {
        value: MODELS.GEMINI_FLASH,
        name: "Gemini 2.5 Flash",
        description: "빠른 응답과 정확한 답변 제공",
        logo: "/Google.png",
      },
    ];

    return baseOptions;
  }, []);

  // 통합된 인증 및 모델 상태 관리
  useEffect(() => {
    // 모델 변경 시 파일 첨부 초기화
    if (!MULTIMODAL_MODELS.includes(selectedModel)) {
      setUploadedFiles([]);
      setDragActive(false);
    }

    // location.state에서 initialMessage가 있다면 설정
    const state = location.state as { initialMessage?: string };
    if (state?.initialMessage) {
      setNewMessage(state.initialMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }

    // 인증 상태 체크 및 익명 모드 처리
    if (token && isAuthenticated && user) {
      setIsAuthChecked(true);
      setIsAnonymousMode(false);
    } else {
      setIsAnonymousMode(true);
      
      const savedSessionId = localStorage.getItem('anonymous_session_id');
      if (savedSessionId) {
        setAnonymousSessionId(savedSessionId);
        fetchAnonymousUsage(savedSessionId);
      } else {
        initializeAnonymousSession();
      }
    }

    // 익명 모드에서 모델을 Flash로 강제 설정
    if (isAnonymousMode && selectedModel !== MODELS.GEMINI_FLASH) {
      setSelectedModel(MODELS.GEMINI_FLASH);
    }
  }, [selectedModel, MULTIMODAL_MODELS, location.state, navigate, location.pathname, token, isAuthenticated, user, isAnonymousMode]);

  // 메시지 수 경고 표시 로직 수정
  useEffect(() => {
    if (messages.length >= MESSAGE_WARNING_THRESHOLD) {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    대화가 길어지고 있습니다
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    새 채팅방을 생성해 주세요. 응답 속도가 느려질 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                확인
              </button>
            </div>
          </div>
        ),
        {
          duration: 3000,
          position: "top-center",
        }
      );
    }
  }, [messages.length]);

  const validateFile = async (file: File): Promise<boolean> => {
    if (!MULTIMODAL_MODELS.includes(selectedModel)) {
      alert(
        "현재 선택된 모델은 파일 첨부를 지원하지 않습니다. Gemini 모델을 선택해주세요."
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("파일 크기는 100MB를 초과할 수 없습니다. 큰 파일은 자동으로 File API를 통해 처리됩니다.");
      return false;
    }

    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfData = new Uint8Array(arrayBuffer);
        // PDF 페이지 수를 확인하는 간단한 방법
        const pageCount = (pdfData.toString().match(/\/Page\W/g) || []).length;

        if (pageCount > 100) {
          alert("PDF는 100페이지를 초과할 수 없습니다.");
          return false;
        }
      } catch (error) {
        alert("PDF 파일을 확인하는 중 오류가 발생했습니다.");
        return false;
      }
    } else if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.width > 8000 || img.height > 8000) {
            alert("이미지 크기는 8000x8000 픽셀을 초과할 수 없습니다.");
            resolve(false);
          }
          resolve(true);
        };
        img.onerror = () => {
          alert("이미지 파일을 확인하는 중 오류가 발생했습니다.");
          resolve(false);
        };
        img.src = URL.createObjectURL(file);
      });
    }

    return true;
  };

  // 채팅방 ID가 변경될 때 메시지 초기화
  useEffect(() => {
    setMessages([]);
    setNewMessage("");
  }, [currentRoomId]);

  // 메시지 초기화
  useEffect(() => {
    const initializeMessages = async () => {
      if (!currentRoomId || !isAuthChecked) return;

      try {
        setIsLoading(true);
        let response;

        if (projectId) {
          response = await projectApi.getProjectChatMessages(
            projectId,
            currentRoomId
          );
          if (response?.messages) {
            // 중복 메시지 제거 및 정렬
            const sortedMessages = removeDuplicateMessages(response.messages);

            const processedMessages = sortedMessages.map((msg: any) => {
              const processed = {
                ...msg,
                isStreaming: false,
                reasoningContent: msg.reasoning_content,
                thoughtTime: msg.thought_time,
                showReasoning: !!msg.reasoning_content,
                citations: Array.isArray(msg.citations)
                  ? msg.citations.map((c: string | { url: string }) =>
                      typeof c === "string" ? { url: c } : c
                    )
                  : [],
              };
              return processed;
            });

            setMessages(processedMessages);
          }
        } else {
          try {
            response = await fetchWithAuth(
              `/chat/rooms/${currentRoomId}/messages`
            );
            const data = await response.json();
            if (data?.messages) {
              // 중복 메시지 제거 및 정렬
              const sortedMessages = removeDuplicateMessages(data.messages);

              const processedMessages = sortedMessages.map((msg: any) => {
                const processed = {
                  ...msg,
                  isStreaming: false,
                  reasoningContent: msg.reasoning_content,
                  thoughtTime: msg.thought_time,
                  showReasoning: !!msg.reasoning_content,
                  citations: Array.isArray(msg.citations)
                    ? msg.citations.map((c: string | { url: string }) =>
                        typeof c === "string" ? { url: c } : c
                      )
                    : [],
                };
                return processed;
              });

              setMessages(processedMessages);
            }
          } catch (error) {
            toast.error("일반 채팅 메시지를 불러오는데 실패했습니다.");
          }
        }
      } catch (error) {
        toast.error("메시지를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeMessages();
  }, [currentRoomId, projectId, isAuthChecked]);

  const generateUniqueId = () => {
    return Date.now();
  };

  // ============================================================================
  // 익명 사용자 관련 함수들
  // ============================================================================
  
  // 익명 세션 ID 생성
  const generateAnonymousSessionId = () => {
    return crypto.randomUUID();
  };

  // 익명 세션 초기화
  const initializeAnonymousSession = async () => {
    try {
      const response = await fetch('/api/v1/chat/anonymous-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnonymousSessionId(data.session_id);
        localStorage.setItem('anonymous_session_id', data.session_id);
        await fetchAnonymousUsage(data.session_id);
        return data.session_id;
      } else {
        throw new Error('Failed to create anonymous session');
      }
    } catch (error) {
      console.error('Anonymous session creation error:', error);
      // 로컬에서 세션 ID 생성 (백엔드 실패 시 fallback)
      const sessionId = generateAnonymousSessionId();
      setAnonymousSessionId(sessionId);
      localStorage.setItem('anonymous_session_id', sessionId);
      setAnonymousUsage({
        session_id: sessionId,
        current_usage: 0,
        limit: 5,
        remaining: 5,
        is_limit_exceeded: false
      });
      return sessionId;
    }
  };

  // 익명 사용량 조회
  const fetchAnonymousUsage = async (sessionId: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/chat/anonymous-usage/${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        setAnonymousUsage(data);
        return data;
      } else {
        // 실패 시 기본값 설정
        const defaultUsage = {
          session_id: sessionId,
          current_usage: 0,
          limit: 5,
          remaining: 5,
          is_limit_exceeded: false
        };
        setAnonymousUsage(defaultUsage);
        return defaultUsage;
      }
    } catch (error) {
      console.error('Anonymous usage fetch error:', error);
      const defaultUsage = {
        session_id: sessionId,
        current_usage: 0,
        limit: 5,
        remaining: 5,
        is_limit_exceeded: false
      };
      setAnonymousUsage(defaultUsage);
      return defaultUsage;
    }
  };

  // 익명 채팅 전송
  const sendAnonymousMessage = async (message: string) => {
    if (!anonymousSessionId) {
      throw new Error('Anonymous session not initialized');
    }

    const formData = new FormData();
    formData.append('session_id', anonymousSessionId);
    formData.append('message', message);
    formData.append('model', 'gemini-2.5-flash'); // 익명 사용자는 Flash만

    const response = await fetch(`${getBaseUrl()}/chat/anonymous-chat`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 429) {
        // 사용량 초과
        setShowLoginModal(true);
        throw new Error(errorData.detail?.message || '사용량을 초과했습니다.');
      }
      throw new Error(errorData.detail || 'Anonymous chat failed');
    }

    return response;
  };

  // 익명 채팅 제출 처리
  const handleAnonymousSubmit = async (message: string) => {
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      // 입력창 즉시 비우기
      setNewMessage("");

      // 사용자 메시지 화면에 표시
      const currentTime = new Date().toISOString();
      const userMessage: StreamingMessage = {
        id: Date.now(),
        role: "user",
        content: message,
        created_at: currentTime,
        updated_at: currentTime,
        room_id: 0, // 익명 채팅은 room_id가 없음
      };

      setMessages((prev) => [...prev, userMessage]);

      // AI 응답 메시지 준비
      const messageId = generateUniqueId();
      const assistantMessage: StreamingMessage = {
        id: messageId,
        content: "",
        role: "assistant",
        created_at: currentTime,
        updated_at: currentTime,
        room_id: 0,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 익명 채팅 API 호출
      const response = await sendAnonymousMessage(message);
      
      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonString = line.slice(6).trim();
              if (!jsonString) continue;
              const jsonData = JSON.parse(jsonString);

              if (jsonData.error) {
                throw new Error(jsonData.error);
              }

              if (jsonData.content) {
                accumulatedContent += jsonData.content;
                updateStreamingMessage(messageId, accumulatedContent, true);
              }
            } catch (error) {
              console.error("Error processing anonymous response:", error);
            }
          }
        }
      }

      // 스트리밍 완료
      updateStreamingMessage(messageId, accumulatedContent, false);

      // 사용량 정보 로컬 카운팅 업데이트
      if (anonymousUsage) {
        setAnonymousUsage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            current_usage: prev.current_usage + 1,
            remaining: Math.max(0, prev.remaining - 1),
            is_limit_exceeded: prev.remaining - 1 <= 0
          };
        });
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Anonymous request was aborted');
      } else {
        console.error("Anonymous chat error:", error);
        
        if (error.message.includes('사용량을 초과')) {
          toast.error(error.message);
        } else {
          toast.error("메시지 전송 중 오류가 발생했습니다.");
        }
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const updateStreamingMessage = useCallback(
    (
      messageId: number,
      content: string,
      isStreaming: boolean,
      reasoningContent?: string,
      thoughtTime?: number,
      citations?: Array<{ url: string; title?: string }>,
      functionCalls?: Array<{ name: string; arguments: Record<string, any>; result?: any }>,
      codeExecutions?: Array<{ code: string; result: string; language: string }>,
      groundingMetadata?: { searchQueries?: string[]; sources?: Array<{ url: string; title: string }> }
    ) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId && msg.role === "assistant"
            ? {
                ...msg,
                content,
                isStreaming,
                reasoningContent,
                thoughtTime,
                citations: citations || msg.citations,
                functionCalls: functionCalls || msg.functionCalls,
                codeExecutions: codeExecutions || msg.codeExecutions,
                groundingMetadata: groundingMetadata || msg.groundingMetadata,
                updated_at: new Date().toISOString(),
              }
            : msg
        )
      );
    },
    []
  );

  const getRoomName = useCallback(
    async (roomId: string) => {
      try {
        if (projectId) {
          // 프로젝트 채팅방인 경우
          const projectList = await projectApi.getProjects();
          const project = projectList.find((p: ProjectWithChats) =>
            p.chats.some((chat: ProjectChat) => chat.id === roomId)
          );
          const chat = project?.chats.find(
            (chat: ProjectChat) => chat.id === roomId
          );
          return chat?.name || "";
        } else {
          // 일반 채팅방인 경우
          const response = await fetchWithAuth(`/chat/rooms/${roomId}`);
          const data = await response.json();
          return data.name;
        }
      } catch (error) {
        console.error("Error getting room name:", error);
        return "";
      }
    },
    [fetchWithAuth, projectApi, projectId]
  );

  const createNewChatRoom = useCallback(async () => {
    try {
      const response = await fetchWithAuth("/chat/rooms", {
        method: "POST",
        body: JSON.stringify({
          name: "",
        }),
      });
      const newRoom = await response.json();
      return newRoom.id;
    } catch (error) {
      console.error("Error creating chat room:", error);
      return null;
    }
  }, [fetchWithAuth]);


  const updateRoomNameWithMessages = useCallback(
    async (roomId: string, messagesList: any[]) => {
      try {
        
        // 첫 번째 사용자 메시지 찾기
        const firstUserMessage = messagesList.find(msg => msg.role === "user")?.content;
        
        if (!firstUserMessage) {
          return;
        }
        
        
        // AI 기반 제목 생성 시도
        try {
          const simpleMessages = [{
            id: 1,
            role: "user", 
            content: firstUserMessage,
            created_at: new Date().toISOString(),
            room_id: 1,
          }] as ChatMessage[];
          const titleResponse = await generateChatTitle(simpleMessages);
          
          if (titleResponse && titleResponse.title) {
            const aiGeneratedTitle = titleResponse.title;
            
            if (projectId) {
              await projectApi.updateProjectChat(projectId, roomId, { name: aiGeneratedTitle });
              // 즉시 사이드바 업데이트
              window.dispatchEvent(new Event("projectUpdated"));
            } else {
              await updateChatRoom(roomId, { title: aiGeneratedTitle });
              // 즉시 사이드바 업데이트
              window.dispatchEvent(new Event("chatRoomUpdated"));
            }
            return;
          } else {
          }
        } catch (titleError) {
        }
        
        // AI 제목 생성 실패 시 fallback
        const fallbackTitle = firstUserMessage.length > 20 
          ? firstUserMessage.slice(0, 20) + "..." 
          : firstUserMessage;
          
        if (projectId) {
          await projectApi.updateProjectChat(projectId, roomId, { name: fallbackTitle });
          console.log("Project chat name updated (fallback):", fallbackTitle);
          // 즉시 사이드바 업데이트
          window.dispatchEvent(new Event("projectUpdated"));
        } else {
          await updateChatRoom(roomId, { title: fallbackTitle });
          console.log("General chat name updated (fallback):", fallbackTitle);
          // 즉시 사이드바 업데이트
          window.dispatchEvent(new Event("chatRoomUpdated"));
        }
        
      } catch (error) {
        console.error("Error in updateRoomNameWithMessages:", error);
      }
    },
    [projectId, projectApi, updateChatRoom, generateChatTitle]
  );

  const updateRoomName = useCallback(
    async (roomId: string, content: string, isAIResponse: boolean = false) => {
      try {
        console.log("updateRoomName called with:", { roomId, content: content.slice(0, 50), isAIResponse, messagesLength: messages.length });
        
        // AI 기반 제목 생성을 위한 메시지 수집
        const allMessages = messages.filter(msg => 
          msg?.content && typeof msg.content === 'string' && msg.content.trim() !== ''
        );
        
        console.log("Filtered messages for title generation:", allMessages.length);
        
        // 첫 번째 사용자 메시지를 찾아서 AI 제목 생성 시도
        let firstUserMessage = "";
        if (allMessages.length > 0) {
          const userMessage = allMessages.find(msg => msg.role === "user");
          if (userMessage) {
            firstUserMessage = userMessage.content;
          }
        }
        
        // 첫 번째 사용자 메시지가 없으면 현재 content 사용 (AI 응답이 아닌 경우)
        if (!firstUserMessage && !isAIResponse) {
          firstUserMessage = content;
        }
        
        console.log("First user message for title generation:", firstUserMessage.slice(0, 50));
        
        // AI 기반 제목 생성 시도 (사용자 메시지가 있는 경우에만)
        if (firstUserMessage) {
          try {
            console.log("Attempting AI title generation...");
            // 간단한 메시지 구조로 AI 제목 생성
            const simpleMessages = [{
              id: 1,
              role: "user", 
              content: firstUserMessage,
              created_at: new Date().toISOString(),
              room_id: 1,
            }] as ChatMessage[];
            const titleResponse = await generateChatTitle(simpleMessages);
            
            if (titleResponse && titleResponse.title) {
              const aiGeneratedTitle = titleResponse.title;
              
              if (projectId) {
                // 프로젝트 채팅방 업데이트
                await projectApi.updateProjectChat(projectId, roomId, { name: aiGeneratedTitle });
                console.log("Project chat name updated with AI title:", aiGeneratedTitle);
                // 즉시 사이드바 업데이트
                window.dispatchEvent(new Event("projectUpdated"));
              } else {
                // 일반 채팅방 업데이트
                await updateChatRoom(roomId, { title: aiGeneratedTitle });
                console.log("General chat name updated with AI title:", aiGeneratedTitle);
                // 즉시 사이드바 업데이트
                window.dispatchEvent(new Event("chatRoomUpdated"));
              }
              return;
            } else {
              console.log("AI title generation returned empty result");
            }
          } catch (titleError) {
            console.error("AI title generation failed:", titleError);
          }
        }
        
        // AI 제목 생성 실패 시 fallback
        const messageForNaming = firstUserMessage || content;

        if (projectId) {
          // 프로젝트 채팅방인 경우 - 백엔드 API 사용
          try {
            const formData = new FormData();
            formData.append("message_content", messageForNaming);
            
            const response = await fetchWithAuth(
              `/projects/${projectId}/chats/${roomId}/generate-name`,
              {
                method: "POST",
                body: formData,
              }
            );
            
            if (response.ok) {
              const result = await response.json();
              console.log("Project chat name generated:", result.generated_name);
              // 백엔드에서 이미 DB를 업데이트했으므로 프론트엔드에서 중복 호출 제거
            } else {
              throw new Error("Failed to generate project chat name");
            }
          } catch (error) {
            console.error("Error generating project chat name:", error);
            // Fallback: 기존 방식으로 이름 업데이트
            const fallbackTitle = messageForNaming.length > 20
              ? messageForNaming.slice(0, 20) + "..."
              : messageForNaming;
            await projectApi.updateProjectChat(projectId, roomId, {
              name: fallbackTitle,
            });
          }
          // 프로젝트 업데이트 이벤트 발생
          window.dispatchEvent(new Event("projectUpdated"));
        } else {
          // 일반 채팅방인 경우 - 백엔드 API 사용
          try {
            const formData = new FormData();
            formData.append("message_content", messageForNaming);
            
            const response = await fetchWithAuth(
              `/chat/rooms/${roomId}/generate-name`,
              {
                method: "POST",
                body: formData,
              }
            );
            
            if (response.ok) {
              const result = await response.json();
              console.log("Chat name generated:", result.generated_name);
            } else {
              throw new Error("Failed to generate chat name");
            }
          } catch (error) {
            console.error("Error generating chat name:", error);
            // Fallback: 기존 방식으로 이름 업데이트
            const fallbackTitle = messageForNaming.length > 20
              ? messageForNaming.slice(0, 20) + "..."
              : messageForNaming;
            await fetchWithAuth(`/chat/rooms/${roomId}`, {
              method: "PATCH",
              body: JSON.stringify({
                name: fallbackTitle, // 백엔드에서는 name 필드 사용
              }),
            });
          }
        }
      } catch (error) {
        console.error("Error updating room name:", error);
      }
    },
    [fetchWithAuth, projectApi, projectId, messages]
  );

  const handleAIResponse = (content: string) => {
    // 보고서 관련 응답 처리
    const isAssignmentPage = location.pathname.startsWith("/assignment");

    if (
      (content.includes("<html") || content.includes("<!DOCTYPE html")) &&
      isAssignmentPage
    ) {
      setHtmlContent(content);
      setReportStep("html");
      setPreviewOpen(true);
    } else if (
      (content.toLowerCase().includes("보고서") ||
        content.toLowerCase().includes("리포트")) &&
      isAssignmentPage
    ) {
      setContent(content);
      setReportStep("content");
    }
  };

  // 사이드바에서 전달된 메시지 처리
  useEffect(() => {
    if (location.state?.initialMessage) {
      const message = location.state.initialMessage;
      setNewMessage(message);

      // 보고서 관련 메시지인 경우 보고서 상태 초기화
      const isAssignmentPage = location.pathname.startsWith("/assignment");
      if (
        (message.includes("보고서") || message.includes("리포트")) &&
        isAssignmentPage
      ) {
        setContent("");
        setHtmlContent("");
        setPreviewOpen(false);
      }

      // state 초기화
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    location.state,
    navigate,
    location.pathname,
    setContent,
    setHtmlContent,
    setPreviewOpen,
  ]);

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // 검색 API 호출 함수 (스트리밍 버전)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    let targetRoomId: string = currentRoomId || "";

    try {
      // 채팅방이 없는 경우 새로 생성
      if (!targetRoomId) {
        const newRoomId = await createNewChatRoom();
        if (!newRoomId) {
          throw new Error("Failed to create chat room");
        }
        targetRoomId = newRoomId.toString();
      }

      // 검색 메시지 생성
      const currentTime = new Date().toISOString();
      const searchMessage: StreamingMessage = {
        id: Date.now(),
        role: "user",
        content: `🔍 검색: ${searchQuery}`,
        created_at: currentTime,
        updated_at: currentTime,
        room_id: parseInt(targetRoomId, 10),
      };

      // 검색 메시지 추가
      setMessages(prev => [...prev, searchMessage]);

      // AI 응답을 위한 임시 메시지 생성
      const messageId = generateUniqueId();
      const assistantMessage: StreamingMessage = {
        id: messageId,
        content: "",
        role: "assistant",
        created_at: currentTime,
        updated_at: currentTime,
        room_id: parseInt(targetRoomId, 10),
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantMessage]);

      const formData = new FormData();
      formData.append("query", searchQuery);
      formData.append("room_id", targetRoomId);

      const response = await fetchWithAuth("/chat/search", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

             let accumulatedContent = "";
       let citations: Array<{ url: string; title: string }> = [];
       let searchQueries: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonString = line.slice(6).trim();
              if (!jsonString) continue;
              const jsonData = JSON.parse(jsonString);

              if (jsonData.error) {
                throw new Error(jsonData.error);
              }

              if (jsonData.content) {
                accumulatedContent += jsonData.content;
                updateStreamingMessage(messageId, accumulatedContent, true);
              }

                             if (jsonData.citations) {
                 // 중복 방지하면서 새로운 citations 추가
                 const formattedCitations = jsonData.citations.map((c: any) => ({
                   url: c.url,
                   title: c.title || ""
                 }));
                 const newCitations = formattedCitations.filter((newCitation: any) => 
                   !citations.some((existingCitation: any) => 
                     existingCitation.url === newCitation.url
                   )
                 );
                 citations = [...citations, ...newCitations];
                 updateStreamingMessage(messageId, accumulatedContent, true, undefined, undefined, citations);
               }

              if (jsonData.search_queries) {
                searchQueries = jsonData.search_queries;
              }
            } catch (error) {
              console.error("Error processing search data:", error);
            }
          }
        }
      }

      // 스트리밍 완료
      updateStreamingMessage(
        messageId, 
        accumulatedContent, 
        false, 
        undefined, 
        undefined, 
        citations, 
        undefined, 
        undefined, 
        { searchQueries, sources: citations }
      );

      // 첫 번째 메시지인 경우 채팅방 이름 설정 (검색 결과 기반)
      const roomName = await getRoomName(targetRoomId);
      const isNewRoom = !roomName || roomName.trim() === "";
      if (isNewRoom) {
        try {
          await updateRoomName(targetRoomId, accumulatedContent, true);
          
          // 사이드바 업데이트 이벤트 발생
          setTimeout(() => {
            if (projectId) {
              window.dispatchEvent(new Event("projectUpdated"));
              window.dispatchEvent(new Event("chatRoomCreated"));
            } else {
              window.dispatchEvent(new Event("chatRoomUpdated"));
              window.dispatchEvent(new Event("chatRoomCreated"));
            }
          }, 100);
          
          // 새 채팅방인 경우 React Router로 navigate (일반 채팅만)
          if (!projectId && !currentRoomId) {
            navigate(`/chat/${targetRoomId}`, { replace: true });
          }
        } catch (error) {
          console.error("Error updating room name:", error);
        }
      }

      setSearchQuery("");
      setIsSearchMode(false);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // 검색이 중지된 경우 - 현재 내용에 따라 처리
        console.log('Search was aborted');
        const streamingMessageIndex = messages.findIndex(msg => msg.isStreaming);
        if (streamingMessageIndex !== -1) {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            const currentMessage = newMessages[streamingMessageIndex];
            const hasContent = currentMessage.content && currentMessage.content.trim().length > 0;
            
            if (hasContent) {
              // 이미 내용이 있다면 그대로 유지하고 중지 표시만 추가
              newMessages[streamingMessageIndex] = {
                ...currentMessage,
                content: currentMessage.content + "\n\n*[검색이 중지되었습니다]*",
                isStreaming: false
              };
            } else {
              // 아직 내용이 없다면 중지 메시지로 교체
              newMessages[streamingMessageIndex] = {
                ...currentMessage,
                content: "검색이 중지되었습니다.",
                isStreaming: false,
                reasoningContent: undefined,
                thoughtTime: undefined,
                citations: undefined,
                functionCalls: undefined,
                codeExecutions: undefined,
                groundingMetadata: undefined
              };
            }
            return newMessages;
          });
        }
      } else {
        console.error("Search error:", error);
        toast.error("검색 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 응답 중지 함수
  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      console.log("🛑 클라이언트에서 응답 중지 요청");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      
      // 현재 스트리밍 중인 메시지 찾기
      const streamingMessageIndex = messages.findIndex(msg => msg.isStreaming);
      if (streamingMessageIndex !== -1) {
        const currentMessage = messages[streamingMessageIndex];
        const hasContent = currentMessage.content && currentMessage.content.trim().length > 0;
        
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          // 이미 생성된 내용이 있다면 그대로 유지하고 중지 표시만 추가
          if (hasContent) {
            newMessages[streamingMessageIndex] = {
              ...newMessages[streamingMessageIndex],
              content: newMessages[streamingMessageIndex].content + "\n\n*[응답이 중지되었습니다]*",
              isStreaming: false,
              reasoningContent: newMessages[streamingMessageIndex].reasoningContent,
              thoughtTime: newMessages[streamingMessageIndex].thoughtTime,
              citations: newMessages[streamingMessageIndex].citations,
              functionCalls: newMessages[streamingMessageIndex].functionCalls,
              codeExecutions: newMessages[streamingMessageIndex].codeExecutions,
              groundingMetadata: newMessages[streamingMessageIndex].groundingMetadata
            };
          } else {
            // 아직 내용이 없다면 중지 메시지로 교체
            newMessages[streamingMessageIndex] = {
              ...newMessages[streamingMessageIndex],
              content: "응답이 중지되었습니다.",
              isStreaming: false,
              reasoningContent: undefined,
              thoughtTime: undefined,
              citations: undefined,
              functionCalls: undefined,
              codeExecutions: undefined,
              groundingMetadata: undefined
            };
          }
          return newMessages;
        });
      }
      
      toast.success("응답이 중지되었습니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 검색 모드일 때
    if (isSearchMode) {
      await handleSearch();
      return;
    }

    if (!newMessage.trim() && uploadedFiles.length === 0) return;

    // 로그인되지 않은 경우 익명 채팅 처리
    if (!isAuthenticated) {
      if (!isAnonymousMode || !anonymousSessionId || !anonymousUsage) {
        toast.error("채팅 세션을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 익명 사용자 사용량 체크
      if (anonymousUsage.is_limit_exceeded) {
        setShowLoginModal(true);
        return;
      }

      // 익명 채팅 처리
      await handleAnonymousSubmit(newMessage.trim());
      return;
    }

    // 메인 페이지에서의 채팅 시도 제한
    if (!currentRoomId) {
      const isAssignmentMain = location.pathname === "/assignment";
      const isStudentRecordMain = location.pathname === "/student-record";

      if (isAssignmentMain || isStudentRecordMain) {
        const message = isAssignmentMain
          ? "채팅방을 직접 생성해주세요."
          : "채팅방을 직접 생성해주세요.";

        toast.error(message, {
          duration: 3000,
          position: "top-center",
        });
        return;
      }
    }

    // 현재 선택된 모델의 사용량 체크
    if (checkUsageLimit(selectedModel)) {
      const availableModel = getAvailableModelRecommendation();
      if (availableModel) {
        toast.error(
          `${
            GROUP_NAMES[MODEL_GROUP_MAPPING[selectedModel]]
          } 사용 횟수를 초과했습니다. ${availableModel} 모델을 사용해보세요.`
        );
      } else {
        toast.error(
          "모든 모델의 사용 횟수를 초과했습니다. 플랜을 업그레이드하거나 다음 달까지 기다려주세요."
        );
      }
      return;
    }

    setIsLoading(true);
    
    // AbortController 생성
    abortControllerRef.current = new AbortController();
    
    let targetRoomId: string = currentRoomId || "";
    const messageContent = newMessage.trim();

    try {
      // 메시지 전송 즉시 입력창 비우기
      setNewMessage("");
      setUploadedFiles([]);

      // 채팅방이 없는 경우 새로 생성
      if (!targetRoomId) {
        const newRoomId = await createNewChatRoom();
        if (!newRoomId) {
          throw new Error("Failed to create chat room");
        }
        targetRoomId = newRoomId.toString();
        // 새 채팅방 ID를 로컬 변수로 저장 (메시지 전송 완료 후 navigate)
      }

      // 사용자 메시지 생성
      const currentTime = new Date().toISOString();
      const currentUserMessage: StreamingMessage = {
        id: Date.now(),
        role: "user",
        content: messageContent,
        created_at: currentTime,
        updated_at: currentTime,
        room_id: parseInt(targetRoomId, 10),
        files:
          uploadedFiles.length > 0
            ? await Promise.all(
                uploadedFiles.map(async (file) => ({
                  type: file.type,
                  name: file.name,
                  data: await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64data = reader.result as string;
                      resolve(base64data.split(",")[1]);
                    };
                    reader.readAsDataURL(file);
                  }),
                }))
              )
            : undefined,
      };

      // 메시지 목록에 사용자 메시지 추가
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        // 중복 체크
        const isDuplicate = updatedMessages.some(
          (msg) =>
            msg.content === currentUserMessage.content &&
            msg.role === currentUserMessage.role &&
            Math.abs(
              new Date(msg.created_at || '').getTime() -
                new Date(currentUserMessage.created_at || '').getTime()
            ) < 1000
        );
        if (!isDuplicate) {
          updatedMessages.push(currentUserMessage);
        }
        return updatedMessages;
      });

      // AI 응답을 위한 임시 메시지 생성
      const messageId = generateUniqueId();
      const assistantMessage: StreamingMessage = {
        id: messageId,
        content: "",
        role: "assistant",
        created_at: currentTime,
        updated_at: currentTime,
        room_id: parseInt(targetRoomId, 10),
        isStreaming: true,
      };

      // AI 응답 메시지를 화면에 표시
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      const formData = new FormData();

      // 이전 메시지들과 현재 메시지를 결합
      const allMessages = messages
        .concat(currentUserMessage)
        .filter(
          (msg) =>
            msg?.content &&
            typeof msg.content === "string" &&
            msg.content.trim() !== ""
        )
        .map((msg) => ({
          role: msg.role,
          content: msg.content.trim(),
        }));

      // 메시지가 비어있지 않은지 확인
      if (allMessages.length === 0) {
        throw new Error("메시지를 입력해주세요.");
      }

      formData.append(
        "request_data",
        JSON.stringify({
          messages: allMessages,
          model: MODEL_VERSION_MAPPING[selectedModel] || selectedModel,
        })
      );

      // 파일 처리 로직 수정
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
          formData.append("files", file); // 'files'로 통일
        });
      }

              // 프로젝트 채팅과 일반 채팅의 엔드포인트를 구분하여 호출
        let response;
        if (projectId) {
          response = await projectApi.streamProjectChat(
            projectId,
            targetRoomId,
            formData
          );
        } else {
        response = await fetchWithAuth(`/chat/rooms/${targetRoomId}/chat`, {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        });
      }

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let accumulatedContent = "";
      let accumulatedReasoning = "";
      let thoughtTime = 0;
      let citations: Array<{ url: string; title?: string }> = [];
      let functionCalls: Array<{ name: string; arguments: Record<string, any>; result?: any }> = [];
      let codeExecutions: Array<{ code: string; result: string; language: string }> = [];
      let groundingMetadata: { searchQueries?: string[]; sources?: Array<{ url: string; title: string }> } = {};
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              let jsonData: StreamingResponse;
              try {
                const jsonString = line.slice(6).trim();
                if (!jsonString) continue;
                jsonData = JSON.parse(jsonString);
              } catch (parseError) {
                console.error("Invalid JSON data:", line.slice(6));
                continue;
              }

              if (jsonData.error) {
                throw new Error(jsonData.error);
              }

              // 사고 내용 처리 (먼저 처리)
              if (jsonData.reasoning_content) {
                accumulatedReasoning += jsonData.reasoning_content;
                thoughtTime = jsonData.thought_time || thoughtTime;
                // 사고 내용만 업데이트 (일반 콘텐츠는 변경하지 않음)
                updateStreamingMessage(
                  messageId, 
                  accumulatedContent, 
                  true, 
                  accumulatedReasoning, 
                  thoughtTime
                );
              }

              // 기본 콘텐츠 처리 (사고 내용과 분리)
              if (jsonData.content) {
                accumulatedContent += jsonData.content;
                // 일반 콘텐츠만 업데이트
                updateStreamingMessage(
                  messageId, 
                  accumulatedContent, 
                  true, 
                  accumulatedReasoning, 
                  thoughtTime
                );
              }

              // 인용 처리
              if (jsonData.citations) {
                // 중복 방지하면서 새로운 citations 추가
                const newCitations = jsonData.citations.filter((newCitation: any) => 
                  !citations.some((existingCitation: any) => 
                    existingCitation.url === newCitation.url
                  )
                );
                citations = [...citations, ...newCitations];
                updateStreamingMessage(
                  messageId, 
                  accumulatedContent, 
                  true, 
                  accumulatedReasoning, 
                  thoughtTime, 
                  citations
                );
              }

              // 함수 호출 처리
              if (jsonData.function_call) {
                functionCalls = [...functionCalls, jsonData.function_call];
                updateStreamingMessage(
                  messageId, 
                  accumulatedContent, 
                  true, 
                  accumulatedReasoning, 
                  thoughtTime, 
                  citations, 
                  functionCalls
                );
              }

              // 코드 실행 처리
              if (jsonData.code_execution) {
                codeExecutions = [...codeExecutions, jsonData.code_execution];
                updateStreamingMessage(
                  messageId, 
                  accumulatedContent, 
                  true, 
                  accumulatedReasoning, 
                  thoughtTime, 
                  citations, 
                  functionCalls, 
                  codeExecutions
                );
              }

              // 그라운딩 메타데이터 처리
              if (jsonData.grounding_metadata) {
                groundingMetadata = {
                  ...groundingMetadata,
                  ...jsonData.grounding_metadata
                };
                updateStreamingMessage(
                  messageId, 
                  accumulatedContent, 
                  true, 
                  accumulatedReasoning, 
                  thoughtTime, 
                  citations, 
                  functionCalls, 
                  codeExecutions, 
                  groundingMetadata
                );
              }

            } catch (error) {
              console.error("Error processing SSE data:", error);
              if (error instanceof SyntaxError) {
                console.error("Invalid JSON:", line.slice(6));
                continue; // JSON 파싱 에러는 건너뛰고 계속 진행
              }
              throw error; // 다른 에러는 상위로 전파
            }
          }
        }
      }

      // 스트리밍이 끝난 후 최종 상태 업데이트
      updateStreamingMessage(
        messageId, 
        accumulatedContent, 
        false, 
        accumulatedReasoning, 
        thoughtTime, 
        citations, 
        functionCalls, 
        codeExecutions, 
        groundingMetadata
      );
      handleAIResponse(accumulatedContent);

      // AI 응답 완료 후 자동으로 채팅방 제목 생성
      const roomName = await getRoomName(targetRoomId);
      const isNewRoom = !roomName || roomName.trim() === "" || roomName === "새 채팅";
      
      if (isNewRoom && accumulatedContent.trim()) {
        // DB 저장 완료를 기다리기 위해 지연 실행
        setTimeout(async () => {
          try {
            // AI 응답 내용으로 제목 생성
            const aiResponseContent = accumulatedContent.trim();
            
            if (aiResponseContent) {
              // 백엔드 API를 통해 제목 생성 (프로젝트 채팅과 일반 채팅 구분)
              const formData = new FormData();
              formData.append("message_content", aiResponseContent);
              
              const apiUrl = projectId 
                ? `/projects/${projectId}/chats/${targetRoomId}/generate-name`
                : `/chat/rooms/${targetRoomId}/generate-name`;
              
              const titleResponse = await fetchWithAuth(apiUrl, {
                method: "POST",
                body: formData,
              });
              
              if (titleResponse.ok) {
                const result = await titleResponse.json();
                
                // 사이드바 즉시 업데이트
                if (projectId) {
                  window.dispatchEvent(new Event("projectUpdated"));
                } else {
                  window.dispatchEvent(new Event("chatRoomUpdated"));
                }
              }
            }
          } catch (error) {
            // 에러 로깅은 제거
          }
        }, 2000); // 2초 지연으로 DB 저장 완료 대기
      }

      // 첫 메시지인 경우 AI 응답 완료 후 제목 생성
      if (isNewRoom) {
        // 새 채팅방인 경우 React Router로 navigate (일반 채팅만)
        if (!projectId && !currentRoomId) {
          navigate(`/chat/${targetRoomId}`, { replace: true });
        }
      }

      // 메시지 전송 성공 후 구독 정보 로컬 카운팅 업데이트
      if (subscription) {
        const modelGroup = MODEL_GROUP_MAPPING[selectedModel];
        if (modelGroup) {
          updateUsage(modelGroup);
        }
      }

      // 메시지 전송 완료 후 사이드바 업데이트
      if (projectId) {
        window.dispatchEvent(new Event("projectUpdated"));
      } else {
        window.dispatchEvent(new Event("chatRoomUpdated"));
      }

      // 🚀 AI 응답 완료 후 자동 사이드바 업데이트 (제목 생성 후)
      setTimeout(() => {
        if (projectId) {
          window.dispatchEvent(new Event("projectUpdated"));
        } else {
          window.dispatchEvent(new Event("chatRoomUpdated"));
        }
      }, 1000); // 1초 후 추가 업데이트

      setUploadedFiles([]); // 메시지 전송 후 파일 목록 초기화
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // 사용자가 중지한 경우 - 현재 내용에 따라 처리
        console.log('Request was aborted');
        const streamingMessageIndex = messages.findIndex(msg => msg.isStreaming);
        if (streamingMessageIndex !== -1) {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            const currentMessage = newMessages[streamingMessageIndex];
            const hasContent = currentMessage.content && currentMessage.content.trim().length > 0;
            
            if (hasContent) {
              // 이미 내용이 있다면 그대로 유지하고 중지 표시만 추가
              newMessages[streamingMessageIndex] = {
                ...currentMessage,
                content: currentMessage.content + "\n\n*[응답이 중지되었습니다]*",
                isStreaming: false
              };
            } else {
              // 아직 내용이 없다면 중지 메시지로 교체
              newMessages[streamingMessageIndex] = {
                ...currentMessage,
                content: "응답이 중지되었습니다.",
                isStreaming: false,
                reasoningContent: undefined,
                thoughtTime: undefined,
                citations: undefined,
                functionCalls: undefined,
                codeExecutions: undefined,
                groundingMetadata: undefined
              };
            }
            return newMessages;
          });
        }
      } else {
        console.error("Error in chat:", error);
        toast.error("메시지 전송 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!MULTIMODAL_MODELS.includes(selectedModel)) {
      return;
    }
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!MULTIMODAL_MODELS.includes(selectedModel)) {
      alert(
        "현재 선택된 모델은 파일 첨부를 지원하지 않습니다. Gemini 모델을 선택해주세요."
      );
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (uploadedFiles.length + files.length > 3) {
        alert("파일은 최대 3개까지만 첨부할 수 있습니다.");
        return;
      }

      const validFiles: File[] = [];
      for (const file of files) {
        if (
          (file.type.startsWith("image/") || file.type === "application/pdf") &&
          (await validateFile(file))
        ) {
          validFiles.push(file);
        }
      }
      setUploadedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (uploadedFiles.length + files.length > 3) {
        alert("파일은 최대 3개까지만 첨부할 수 있습니다.");
        return;
      }

      const validFiles: File[] = [];
      for (const file of files) {
        if (
          (file.type.startsWith("image/") || file.type === "application/pdf") &&
          (await validateFile(file))
        ) {
          validFiles.push(file);
        }
      }
      setUploadedFiles((prev) => [...prev, ...validFiles]);
    }
  }, [uploadedFiles.length]);

  const removeUploadedFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // textarea 높이 조절 함수를 별도로 분리
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 400);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      const newValue = textarea.value;
      setNewMessage(newValue);
      adjustTextareaHeight();
    },
    [adjustTextareaHeight]
  );

  // 통합된 UI 상태 관리 useEffect
  useEffect(() => {
    // 컴포넌트 마운트 시 초기 높이 설정
    adjustTextareaHeight();
    
    // 채팅방이 변경될 때마다 메시지 초기화
    if (currentRoomId) {
      setNewMessage("");
    }
    
    // location.state에서 initialMessage 처리
    const state = location.state as { initialMessage?: string };
    if (state?.initialMessage) {
      setNewMessage(state.initialMessage);
      setTimeout(adjustTextareaHeight, 0);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [currentRoomId, location.state, navigate, location.pathname, adjustTextareaHeight]);

  const renderEmptyState = () => {
    if (messages.length > 0) return null;

    // 페이지 타입에 따라 다른 초기 화면 렌더링
    const pageType = location.pathname.includes("project-chat")
      ? "assignment"
      : location.pathname.includes("student-record")
      ? "record"
      : location.pathname.includes("assignment")
      ? "assignment"
      : "general";

    const renderContent = () => {
      switch (pageType) {
        case "assignment":
          return {
            title: "수행평가 도우미",
            subtitle: "수행평가 과제를 함께 해결해보세요",
            cards: [
              {
                title: "보고서 작성",
                description: "보고서 작성 방법과 구체적인 예시를 알려드립니다",
                message: "보고서 작성 방법을 알려주세요. 주제: ",
              },
              {
                title: "발표 자료",
                description: "발표 자료 구성과 발표 요령을 안내해드립니다",
                message: "발표 자료 만드는 방법을 알려주세요. 주제: ",
              },
              {
                title: "실험·실습",
                description: "실험/실습 보고서 작성을 도와드립니다",
                message: "실험 보고서 작성 방법을 알려주세요. 실험 주제: ",
              },
              {
                title: "채점표 분석",
                description:
                  "채점 기준을 분석하고 높은 점수를 받는 방법을 알려드립니다",
                message: "채점표를 분석해주세요:\n",
              },
            ],
          };

        case "record":
          return {
            title: "생기부 도우미",
            subtitle: "생기부 작성을 도와드립니다",
            cards: [
              {
                title: "세부능력특기사항",
                description: "교과별 세특 작성을 도와드립니다",
                message: "다음 과목의 세특 작성을 도와주세요. 과목: ",
              },
              {
                title: "창의적체험활동",
                description: "창체활동 기록을 작성해드립니다",
                message: "창체활동 기록을 작성해주세요. 활동 내용: ",
              },
              {
                title: "독서활동",
                description: "독서활동 내용을 기록해드립니다",
                message: "독서활동 기록을 작성해주세요. 책 제목: ",
              },
              {
                title: "행동특성",
                description: "행동특성 및 종합의견을 작성해드립니다",
                message: "행동특성 기록을 작성해주세요. 학생 특성: ",
              },
            ],
          };

        default:
          return {
            title: "무엇을 도와드릴까요?",
            subtitle: "Sungblab AI와 대화를 시작해보세요",
            cards: [
              {
                title: "학습 질문",
                description: "교과 개념, 문제 풀이 등을 도와드립니다",
                message: "다음 개념을 설명해주세요: ",
              },
              {
                title: "과제 도움",
                description: "과제 작성과 자료 조사를 도와드립니다",
                message: "다음 과제를 도와주세요: ",
              },
              {
                title: "공부 방법",
                description: "효과적인 학습 방법을 알려드립니다",
                message: "다음 과목의 공부 방법을 알려주세요: ",
              },

              {
                title: "시각화 요청",
                description: "HTML, SVG, 파이썬 시각화 코드를 생성해드립니다",
                message: "다음 내용을 시각화해주세요: ",
              },
            ],
          };
      }
    };

    const content = renderContent();

    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3 sm:space-y-6 px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-12 py-4 sm:py-6">
        <div className="text-center space-y-2 sm:space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {content.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{content.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl">
          {content.cards.map((card, index) => (
            <button
              key={index}
              onClick={() => setNewMessage(card.message)}
              className="p-2.5 sm:p-3 text-left bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors hover:shadow-md"
            >
              <div className="font-medium text-gray-900 dark:text-white mb-1 text-sm sm:text-base">
                {card.title}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 모델 변경 핸들러 수정
  const handleModelChange = useCallback(
    (model: string) => {
      setSelectedModel(model);
      // 전역 기본값으로 저장
      localStorage.setItem("selected_model", model);
      // 현재 채팅방의 모델 설정으로 저장
      if (currentRoomId) {
        localStorage.setItem(ROOM_MODEL_KEY(currentRoomId), model);
      }
      // 파일 첨부 초기화
      if (!MULTIMODAL_MODELS.includes(model)) {
        setUploadedFiles([]);
        setDragActive(false);
      }
    },
    [currentRoomId, MULTIMODAL_MODELS]
  );

  // 모델 그룹 매핑
  const MODEL_GROUP_MAPPING: { [key: string]: ModelGroup } = {
    [MODELS.GEMINI_FLASH]: "basic_chat",
    [MODELS.GEMINI_PRO]: "advanced_analysis",
  };

  // 그룹 이름 한글화
  const GROUP_NAMES: { [K in ModelGroup]: string } = {
    basic_chat: "기본 대화",
    normal_analysis: "일반 분석",
    advanced_analysis: "고급 분석",
  };



  // 사용량 체크 함수
  const checkUsageLimit = (model: string): boolean => {
    if (!subscription) return false;

    const group = MODEL_GROUP_MAPPING[model];
    if (!group) return false;

    return subscription.group_usage[group] >= subscription.group_limits[group];
  };

  // 사용 가능한 다른 모델 추천
  const getAvailableModelRecommendation = (): string | null => {
    if (!subscription) return null;

    for (const [model, group] of Object.entries(MODEL_GROUP_MAPPING)) {
      if (subscription.group_usage[group] < subscription.group_limits[group]) {
        return `${GROUP_NAMES[group]}(${model})`;
      }
    }
    return null;
  };

  useImperativeHandle(ref, () => ({
    setNewMessage: (message: string) => {
      setNewMessage(message);
    },
    setInputMessage: (message: string) => {
      setNewMessage(message);
    },
    handleModelChange: (modelId: string) => {
      handleModelChange(modelId);
    },
  }));



  // 자동 스크롤 상태 추가
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const isStreamingRef = useRef(false);

  // 스트리밍 상태 감지
  useEffect(() => {
    const hasStreamingMessage = messages.some(msg => msg.isStreaming);
    isStreamingRef.current = hasStreamingMessage;
  }, [messages]);

  // 스크롤을 최하단으로 이동하는 함수
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior,
        block: 'end',
        inline: 'nearest'
      });
    }
  }, []);

  // 메시지 업데이트 시 자동 스크롤 (개선된 버전)
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isStreaming = lastMessage?.isStreaming || false;

    // 스트리밍 중이거나 autoScroll이 true일 때 스크롤
    if (autoScroll || isStreaming) {
      // 기존 타이머 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (isStreaming) {
        // 스트리밍 중에는 즉시 스크롤 (부드럽게)
        scrollToBottom('smooth');
      } else {
        // 스트리밍이 끝났을 때는 약간의 지연 후 스크롤
        scrollTimeoutRef.current = setTimeout(() => {
          scrollToBottom('smooth');
        }, 100);
      }
    }
  }, [messages, autoScroll, scrollToBottom]);

  // 스크롤 위치 감지 및 자동 스크롤 처리 (개선된 버전)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollDebounceTimer: number;

    const handleScroll = () => {
      // 스트리밍 중에는 스크롤 감지를 지연시킴
      if (isStreamingRef.current) {
        return;
      }

      // 디바운스 적용
      clearTimeout(scrollDebounceTimer);
      scrollDebounceTimer = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const isNearBottom = distanceFromBottom < 150; // 임계값 증가

        setAutoScroll(isNearBottom);
        setShowScrollButton(!isNearBottom);
      }, 100);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollDebounceTimer);
    };
  }, []);

  // 채팅방 초기화 시 스크롤 (개선된 버전)
  useEffect(() => {
    if (messages.length > 0) {
      // 초기 로드 시에는 즉시 스크롤
      setTimeout(() => {
        scrollToBottom('auto');
        setAutoScroll(true);
        setShowScrollButton(false);
      }, 200);
    }
  }, [currentRoomId, scrollToBottom]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);



  // HTML 에디터 모달 대신 페이지로 이동하는 useEffect 추가
  useEffect(() => {
    if (reportState.isPreviewOpen) {
      navigate("/html-editor");
      setPreviewOpen(false);
    }
  }, [reportState.isPreviewOpen, navigate, setPreviewOpen]);

  return (
    <div className="flex flex-col h-full max-w-full">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden pr-0 relative py-1 sm:py-2 max-w-full"
      >
        {renderEmptyState()}
        <div className="px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-12 max-w-full">
          {messages.map((message, index) => {
            // 메시지 키 최적화 - index를 추가하여 고유성 보장
            const messageKey = `${message.id}-${message.role}-${index}-${
              message.updated_at || message.created_at
            }`;

            return (
              <MessageBubble
                key={messageKey}
                content={message.content}
                isUser={message.role === "user"}
                files={message.files}
                isStreaming={message.isStreaming}
                citations={message.citations}
                reasoningContent={message.reasoningContent}
                thoughtTime={message.thoughtTime}
                messageId={message.id}
                isReasoningOpen={reasoningStates[message.id] || false}
                onToggleReasoning={handleToggleReasoning}
                createdAt={message.created_at}
                updatedAt={message.updated_at}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-12 border-gray-200 dark:border-gray-700">
        {/* 스크롤 버튼 - 플로팅 */}
        {showScrollButton && (
          <button
            onClick={() => {
              setAutoScroll(true);
              scrollToBottom('smooth');
            }}
            className="fixed bottom-24 sm:bottom-32 left-1/2 transform -translate-x-1/2 p-2 rounded-full bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-600 z-40"
            aria-label="최신 메시지 보기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}

        {/* 구독 사용량 초과 경고 표시 */}
        {subscription && checkUsageLimit(selectedModel) && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 p-3 sm:p-4 mb-3 sm:mb-4 rounded-xl border border-red-200 dark:border-red-800 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-1 bg-red-100 dark:bg-red-800/50 rounded-full">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 dark:text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-red-800 dark:text-red-200 mb-1">
                  사용량 초과 알림
                </h3>
                <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 leading-relaxed">
                  <p>
                    <span className="font-medium">{GROUP_NAMES[MODEL_GROUP_MAPPING[selectedModel]]}</span> 유형의
                    이번 달 사용량을 초과했습니다.
                  </p>
                  <p className="mt-1">
                    {getAvailableModelRecommendation()
                      ? `💡 ${getAvailableModelRecommendation()} 모델을 사용해보세요.`
                      : "💎 구독을 업그레이드하거나 다음 달까지 기다려주세요."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 익명 사용자 사용량 표시 */}
        {isAnonymousMode && anonymousUsage && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 p-3 sm:p-4 mb-3 sm:mb-4 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-1 bg-purple-100 dark:bg-purple-800/50 rounded-full">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-purple-800 dark:text-purple-200 mb-1">
                  무료 체험 중
                </h3>
                <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                  <p>
                    <span className="font-medium">
                      {anonymousUsage.remaining}/{anonymousUsage.limit}
                    </span>
                    번의 질문이 남았습니다.
                  </p>
                  <p className="mt-1">
                    {anonymousUsage.remaining <= 2 ? (
                      <>🔑 더 많은 기능을 원하시면 <button 
                        onClick={() => navigate("/auth/login")}
                        className="underline font-medium hover:text-purple-600 dark:hover:text-purple-200"
                      >
                        로그인
                      </button>해주세요!</>
                    ) : (
                      "💡 로그인하시면 무제한으로 이용할 수 있어요!"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-2 px-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 mb-2">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 font-medium">
              <PaperClipIcon className="w-3 h-3" />
              <span className="hidden sm:inline">첨부파일 ({uploadedFiles.length})</span>
              <span className="sm:hidden">({uploadedFiles.length})</span>
            </div>
            <div className="flex flex-wrap gap-1 w-full">
              {uploadedFiles.map((file: File, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-md px-2 py-1 shrink-0 border border-gray-200 dark:border-gray-600 shadow-sm max-w-[150px] sm:max-w-[200px]"
                >
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {file.type.startsWith('image/') ? (
                      <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate font-medium">
                      {file.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeUploadedFile(index)}
                    className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title={`${file.name} 제거`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 메시지 제한 경고 표시 */}
        {isLimitExceeded && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 p-3 sm:p-4 mb-3 sm:mb-4 rounded-xl border border-red-200 dark:border-red-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-1 bg-red-100 dark:bg-red-800/50 rounded-full">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-200 font-medium leading-relaxed">
                ⚠️ 이번 달 메시지 사용량을 초과했습니다. 
                <br className="sm:hidden" />
                <span className="sm:ml-1">💎 구독을 업그레이드하거나 다음 달까지 기다려주세요.</span>
              </p>
            </div>
          </div>
        )}

        <ChatInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchMode={isSearchMode}
          setIsSearchMode={setIsSearchMode}
          isLoading={isLoading}
          isAnonymousMode={isAnonymousMode}
          uploadedFiles={uploadedFiles}
          handleFileSelect={handleFileSelect}
          removeUploadedFile={removeUploadedFile}
          handleSubmit={handleSubmit}
          handleStopResponse={handleStopResponse}
          selectedModel={selectedModel}
          modelOptions={modelOptions}
          handleModelChange={handleModelChange}
          isModelDropdownOpen={isModelDropdownOpen}
          setIsModelDropdownOpen={setIsModelDropdownOpen}
          dropdownRef={dropdownRef}
          MULTIMODAL_MODELS={MULTIMODAL_MODELS}
          MODELS={MODELS}
          dragActive={dragActive}
          handleDrag={handleDrag}
          handleDrop={handleDrop}
        />
      </div>

      {/* 로그인 유도 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                <svg className="h-6 w-6 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                체험 사용량 완료!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                익명으로 5번의 채팅을 모두 사용하셨습니다.
                <br />
                로그인하시면 더 많은 기능을 무제한으로 이용할 수 있어요!
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    navigate("/auth/login");
                  }}
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  로그인하기
                </button>
                
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    navigate("/auth/register");
                  }}
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  회원가입하기
                </button>
                
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2 px-4 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  나중에 하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatInterface;
