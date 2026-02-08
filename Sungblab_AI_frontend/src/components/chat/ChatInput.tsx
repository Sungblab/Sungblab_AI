import React, { 
  useRef, 
  useCallback, 
  KeyboardEvent, 
  DragEvent, 
  useState,
  useEffect,
  useMemo 
} from "react";
import { 
  PaperClipIcon, 
  ArrowUpIcon,
  MagnifyingGlassIcon,
  StopIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { useApi } from "../../utils/api";

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchMode: boolean;
  setIsSearchMode: (searchMode: boolean) => void;
  isLoading: boolean;
  isAnonymousMode: boolean;
  uploadedFiles: File[];
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeUploadedFile: (index: number) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleStopResponse: () => void;
  selectedModel: string;
  modelOptions: Array<{
    value: string;
    name: string;
    logo?: string;
  }>;
  handleModelChange: (modelId: string) => void;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  MULTIMODAL_MODELS: string[];
  MODELS: { [key: string]: string };
  dragActive: boolean;
  handleDrag: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  projectId?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  newMessage,
  setNewMessage,
  searchQuery,
  setSearchQuery,
  isSearchMode,
  setIsSearchMode,
  isLoading,
  isAnonymousMode,
  uploadedFiles,
  handleFileSelect,
  removeUploadedFile,
  handleSubmit,
  handleStopResponse,
  selectedModel,
  modelOptions,
  handleModelChange,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  dropdownRef,
  MULTIMODAL_MODELS,
  MODELS,
  dragActive,
  handleDrag,
  handleDrop,
  projectId,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isImproving, setIsImproving] = useState(false);
  const { token } = useAuth();
  const { fetchWithAuth } = useApi();

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
    [setNewMessage, adjustTextareaHeight]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // Enter 키로 전송할 때는 form의 onSubmit이 자동으로 호출되므로
        // 여기서는 form submit을 트리거하기만 함
        const form = e.currentTarget.closest('form');
        if (form) {
          form.requestSubmit();
        }
      }
    },
    []
  );


  const handleImprovePrompt = useCallback(async () => {
    if (!newMessage.trim() || isAnonymousMode || isImproving) return;

    setIsImproving(true);
    try {
      const formData = new FormData();
      formData.append('original_prompt', newMessage);

      // 프로젝트 채팅인지 일반 채팅인지에 따라 API 엔드포인트 선택
      const endpoint = projectId 
        ? `/projects/${projectId}/improve-prompt`
        : '/chat/improve-prompt';

      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('프롬프트 개선에 실패했습니다.');
      }

      const data = await response.json();
      if (data.improved_prompt) {
        setNewMessage(data.improved_prompt);
        adjustTextareaHeight();
      }
    } catch (error) {
      console.error('프롬프트 개선 오류:', error);
      alert(error instanceof Error ? error.message : '프롬프트 개선에 실패했습니다.');
    } finally {
      setIsImproving(false);
    }
  }, [newMessage, projectId, isAnonymousMode, isImproving, setNewMessage, adjustTextareaHeight, fetchWithAuth]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage, adjustTextareaHeight]);

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={`bg-white dark:bg-gray-800 rounded-t-xl shadow-lg border-t border-gray-200 dark:border-gray-700 ${
          dragActive ? "border-primary-500 border-2" : ""
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* 첨부파일 표시 영역 */}
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

        {/* 메인 입력 영역 */}
        <div className="flex items-center gap-2 px-2 sm:px-2.5 pt-2 sm:pt-2.5 pb-1 sm:pb-1.5">
          {/* 파일 첨부 버튼 */}
          <label
            className={`flex-shrink-0 p-1.5 cursor-pointer rounded-lg transition-colors ${
              MULTIMODAL_MODELS.includes(selectedModel) && !isAnonymousMode
                ? "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
            }`}
            title={isAnonymousMode ? "파일 첨부는 로그인 후 사용 가능합니다" : "파일 첨부"}
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={!MULTIMODAL_MODELS.includes(selectedModel) || isAnonymousMode}
            />
            <PaperClipIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </label>

          {/* 텍스트 입력 영역 */}
          <div className="flex-1 min-w-0 relative">
            <textarea
              ref={textareaRef}
              value={isSearchMode ? searchQuery : newMessage}
              onChange={(e) => {
                if (isSearchMode) {
                  setSearchQuery(e.target.value);
                } else {
                  handleTextareaChange(e);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={isSearchMode ? "검색어를 입력하세요..." : "메시지를 입력하세요..."}
              rows={1}
              spellCheck="true"
              lang="ko"
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[36px] sm:min-h-[38px] max-h-[120px] sm:max-h-[160px] overflow-y-auto py-2 sm:py-2.5 px-1 leading-5 sm:leading-6 text-sm sm:text-base spell-check-enabled"
            />
          </div>

          {/* 오른쪽 버튼 그룹 */}
          <div className="flex items-center gap-1">
            {/* 검색/전송 버튼 (통합) */}
            {isLoading ? (
              <button
                type="button"
                onClick={handleStopResponse}
                className="flex-shrink-0 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                title="응답 중지"
              >
                <StopIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <div className="flex items-center gap-1">

                {/* 검색 모드 토글 */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isAnonymousMode) {
                      setIsSearchMode(!isSearchMode);
                      if (!isSearchMode) {
                        setSearchQuery(newMessage);
                      } else {
                        setNewMessage(searchQuery);
                      }
                    }
                  }}
                  disabled={isAnonymousMode}
                  className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
                    isAnonymousMode
                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      : isSearchMode
                      ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title={isAnonymousMode ? "검색 기능은 로그인 후 사용 가능합니다" : (isSearchMode ? "채팅 모드로 전환" : "검색 모드로 전환")}
                >
                  <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* 전송 버튼 */}
                <button
                  type="submit"
                  disabled={
                    (isSearchMode ? !searchQuery.trim() : (!newMessage.trim() && uploadedFiles.length === 0))
                  }
                  className="flex-shrink-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:hover:scale-100"
                >
                  {isSearchMode ? (
                    <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 하단 컨트롤 영역 */}
        <div className="flex items-center justify-between pb-4 px-2 sm:px-2.5 py-1.5 border-t border-gray-100 dark:border-gray-700">
          {/* 모델 선택 및 개선 버튼 */}
          <div className="flex items-center gap-2">
            {/* 모델 선택 드롭다운 */}
            <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              {modelOptions.find((option) => option.value === selectedModel)
                ?.logo && (
                <img
                  src={
                    modelOptions.find(
                      (option) => option.value === selectedModel
                    )?.logo
                  }
                  alt="Model logo"
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain"
                />
              )}
              {/* 모바일: 축약된 이름, 데스크톱: 전체 이름 */}
              <span className="font-medium">
                <span className="sm:hidden">
                  {(() => {
                    const selectedOption = modelOptions.find(
                      (option) => option.value === selectedModel
                    );
                    if (selectedOption?.name.includes('Flash')) return 'Flash';
                    if (selectedOption?.name.includes('Pro')) return 'Pro';
                    return selectedOption?.name.split(' ')[1] || 'AI';
                  })()}
                </span>
                <span className="hidden sm:inline">
                  {
                    modelOptions.find(
                      (option) => option.value === selectedModel
                    )?.name
                  }
                </span>
              </span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${
                  isModelDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* 모델 선택 드롭다운 메뉴 */}
            {isModelDropdownOpen && (
              <div className="absolute bottom-full mb-1 left-0 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-[1000] max-h-96 overflow-y-auto">
                {modelOptions.map((option) => {
                  const isDisabled = isAnonymousMode && option.value !== MODELS.GEMINI_FLASH;
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (!isDisabled) {
                          handleModelChange(option.value);
                          setIsModelDropdownOpen(false);
                        }
                      }}
                      disabled={isDisabled}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                        selectedModel === option.value
                          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                          : isDisabled
                          ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {option.logo && (
                          <img
                            src={option.logo}
                            alt={`${option.name} logo`}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <div>
                          <div className="font-medium">{option.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {(() => {
                              switch(option.value) {
                                case 'gemini-2.5-flash':
                                  return '빠른 응답과 정확한 추론. 일상적인 학습부터 간단한 과제까지';
                                case 'gemini-2.5-pro':
                                  return '고급 추론과 분석 기능. 복잡한 학습 과제에 효과적';
                                default:
                                  return '고성능 AI 언어 모델';
                              }
                            })()}
                          </div>
                          {isDisabled && (
                            <div className="text-xs text-gray-400 dark:text-gray-600">
                              로그인 후 사용 가능
                            </div>
                          )}
                        </div>
                      </div>
                      
                    </button>
                  );
                })}
              </div>
            )}
            </div>

            {/* 개선 버튼 */}
            <button
              type="button"
              onClick={handleImprovePrompt}
              disabled={!newMessage.trim() || isLoading || isAnonymousMode || isImproving}
              className="px-2 py-1 text-xs text-white dark:text-white bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                isAnonymousMode 
                  ? "개선 기능은 로그인 후 사용 가능합니다" 
                  : isImproving
                  ? "프롬프트 개선 중..."
                  : "프롬프트 개선"
              }
            >
              {isImproving ? "개선중..." : "개선"}
            </button>
          </div>

          {/* 모델 정보 */}
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Sungblab AI는 실수할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;