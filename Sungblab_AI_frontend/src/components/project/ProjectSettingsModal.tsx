import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Dialog, Transition } from "@headlessui/react";
import { 
  XMarkIcon, 
  TrashIcon, 
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon
} from "@heroicons/react/24/outline";
import { ProjectType } from "../../types/project";
import { useProjectApi } from "../../api/projectApi";
import { useNavigate } from "react-router-dom";

interface ProjectFile {
  file_id: string;
  original_name: string;
  display_name: string;
  uri: string;
  state: string;
  create_time: string | null;
  expire_time: string | null;
}

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  projectType: ProjectType;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectType,
}) => {
  const navigate = useNavigate();
  const projectApi = useProjectApi();
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  
  // 새로운 상태들 - 파일 관리
  const [activeTab, setActiveTab] = useState<'settings' | 'files' | 'knowledge' | 'embeddings'>('settings');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // 임베딩 관련 상태
  const [embeddingStats, setEmbeddingStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // 파일 입력 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 초기화 함수
  const resetForm = useCallback(() => {
    setName("");
    setInstructions("");
    setSaveError(null);
    setProjectFiles([]);
    setSearchQuery("");
    setSearchResults([]);
    setActiveTab('settings');
    fetchedRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    const fetchProject = async () => {
      if (!projectId || fetchedRef.current) return;

      try {
        setIsLoading(true);
        const project = await projectApi.getProject(projectId);
        setName(project.name);
        setInstructions(project.system_instruction || "");
        setSaveError(null);
        fetchedRef.current = true;
        
        // 프로젝트 파일들 로드
        await loadProjectFiles();
        
        // 임베딩 통계 로드
        await loadEmbeddingStats();
      } catch (error) {
        console.error("Error fetching project:", error);
        setSaveError("프로젝트 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [isOpen, projectId, resetForm]);

  // 프로젝트 파일 목록 로드
  const loadProjectFiles = async () => {
    if (!projectId) return;
    
    try {
      const files = await projectApi.getProjectFiles(projectId);
      setProjectFiles(files);
    } catch (error) {
      console.error("Error loading project files:", error);
    }
  };

  // 임베딩 통계 로드
  const loadEmbeddingStats = async () => {
    if (!projectId) return;
    
    setLoadingStats(true);
    try {
      const stats = await projectApi.getEmbeddingStats(projectId);
      setEmbeddingStats(stats);
    } catch (error) {
      console.error("Error loading embedding stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (files: FileList) => {
    if (!projectId || files.length === 0) return;

    setUploading(true);
    
    try {
      const fileArray = Array.from(files);
      const result = await projectApi.uploadProjectFiles(projectId, fileArray);
      console.log('Files uploaded successfully:', result);
      await loadProjectFiles(); // 파일 목록 새로고침
      await loadEmbeddingStats(); // 임베딩 통계 새로고침
    } catch (error) {
      console.error('File upload error:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 파일 삭제
  const handleDeleteFile = async (fileId: string) => {
    if (!projectId) return;
    
    if (!confirm('이 파일을 삭제하시겠습니까?')) return;
    
    try {
      await projectApi.deleteProjectFile(projectId, fileId);
      await loadProjectFiles(); // 파일 목록 새로고침
      await loadEmbeddingStats(); // 임베딩 통계 새로고침
    } catch (error) {
      console.error('File delete error:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  // 지식베이스 검색
  const handleKnowledgeSearch = async () => {
    if (!projectId || !searchQuery.trim()) return;
    
    setSearching(true);
    
    try {
      const results = await projectApi.searchProjectKnowledge(projectId, searchQuery, 5);
      setSearchResults(results);
    } catch (error) {
      console.error('Knowledge search error:', error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  // 드래그 상태 관리
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // 드래그 앤 드롭 핸들러 (개선된 로직)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev + 1);
    
    // 파일이 드래그되고 있는지 확인
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragOver(false);
      }
      return newCount;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setDragCounter(0);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // 파일 타입 검증
      const validFiles = Array.from(files).filter(file => {
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/gif',
          'image/webp'
        ];
        return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB 제한
      });
      
             if (validFiles.length > 0) {
        handleFileUpload(validFiles as any as FileList);
      } else {
        alert('지원되지 않는 파일 형식이거나 파일 크기가 50MB를 초과합니다.');
      }
    }
  };

  const handleSave = async () => {
    if (!projectId || !name.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setSaveError(null);

      // 지시사항 유효성 검사 및 전처리
      const trimmedInstructions = instructions.trim();
      if (trimmedInstructions.length > 2000) {
        throw new Error("추가 지시사항은 2000자를 초과할 수 없습니다.");
      }

      const updatedProject = await projectApi.updateProject(projectId, {
        name: name.trim(),
        type: projectType,
        system_instruction: trimmedInstructions || "",
      });

      // 성공적으로 업데이트된 경우에만 이벤트 발생 및 모달 닫기
      if (updatedProject) {
        // 프로젝트 업데이트 이벤트와 함께 업데이트된 프로젝트 정보 전달
        window.dispatchEvent(new CustomEvent("projectUpdated", {
          detail: {
            projectId: projectId,
            updatedAt: new Date().toISOString(),
            name: name.trim(),
            type: projectType
          }
        }));
        onClose();
      }
    } catch (error) {
      console.error("Error updating project:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "프로젝트 업데이트 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || isLoading) return;

    if (window.confirm("정말로 이 프로젝트를 삭제하시겠습니까? 업로드된 모든 파일도 함께 삭제됩니다.")) {
      try {
        setIsLoading(true);
        await projectApi.deleteProject(projectId);
        window.dispatchEvent(new CustomEvent("projectDeleted", {
          detail: {
            projectId: projectId,
            type: projectType
          }
        }));
        onClose();
        navigate(`/project/${projectType}`);
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("프로젝트 삭제 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 파일 아이콘 결정
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <PhotoIcon className="w-5 h-5 text-blue-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <FilmIcon className="w-5 h-5 text-purple-500" />;
    } else if (mimeType === 'application/pdf') {
      return <DocumentTextIcon className="w-5 h-5 text-red-500" />;
    }
    return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
  };

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* 프로젝트 이름 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          프로젝트 이름
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-primary w-full"
          disabled={isLoading}
          placeholder="프로젝트 이름을 입력하세요"
        />
      </div>

      {/* 프로젝트 지시사항 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          추가 시스템 지시사항
        </label>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="font-medium mb-1">고급 지시사항 작성 팁:</p>
          <ul className="space-y-1 text-xs">
            <li>• 답변 스타일: "항상 구체적인 예시를 3개 이상 들어주세요"</li>
            <li>• 출력 형식: "답변을 표 형태로 정리해주세요"</li>
            <li>• 톤앤매너: "전문적이면서도 친근한 말투로 설명해주세요"</li>
            <li>• 특별 요구사항: "수학 공식은 LaTeX 형식으로 작성해주세요"</li>
          </ul>
        </div>
        <textarea
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value);
            setSaveError(null);
          }}
          rows={8}
          className={`input-primary w-full ${
            instructions.length > 2000 ? "border-red-500" : ""
          }`}
          placeholder={`예시 (${projectType}):
${projectType === 'assignment' ? 
  `• 과제 분석 시 평가 기준표를 먼저 확인하고 점수 배분을 고려해주세요
• 창의적인 아이디어와 함께 실현 가능한 방안을 제시해주세요
• 참고자료는 최신 자료를 우선적으로 활용해주세요` :
projectType === 'record' ?
  `• 생기부 작성 시 교육부 기재요령을 엄격히 준수해주세요
• 구체적인 활동 사례와 수치를 포함해주세요  
• 음슴체("~함", "~을 보임")를 일관되게 사용해주세요` :
  `• 학습자의 수준에 맞는 설명을 제공해주세요
• 이론과 실제를 연결한 예시를 들어주세요
• 단계별로 차근차근 설명해주세요`}`}
          disabled={isLoading}
        />
        {instructions.length > 0 && (
          <div className={`text-xs mt-1 ${
            instructions.length > 2000 ? "text-red-500" : "text-gray-500"
          }`}>
            {instructions.length}/2000자
          </div>
        )}
      </div>

      {/* 에러 메시지 표시 */}
      {saveError && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {saveError}
        </div>
      )}
    </div>
  );

  const renderFilesTab = () => (
    <div className="space-y-4">
      {/* 파일 업로드 영역 */}
      <div 
        className={`border-2 border-dashed rounded-lg p-4 sm:p-6 transition-all duration-300 ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
            : uploading
            ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {isDragOver ? (
            <>
              <div className="animate-bounce">
                <CloudArrowUpIcon className="mx-auto h-8 sm:h-12 w-8 sm:w-12 text-blue-500 mb-2 sm:mb-3" />
              </div>
              <p className="text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                파일을 여기에 놓으세요
              </p>
            </>
          ) : uploading ? (
            <>
              <div className="relative">
                <div className="animate-pulse">
                  <CloudArrowUpIcon className="mx-auto h-8 sm:h-12 w-8 sm:w-12 text-green-500 mb-2 sm:mb-3" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-green-600 font-medium text-sm sm:text-base">업로드 중...</p>
                <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
              </div>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="mx-auto h-8 sm:h-12 w-8 sm:w-12 text-gray-400 mb-2 sm:mb-3" />
              <p className="text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
                파일을 드래그하거나 선택하세요
              </p>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2"
              >
                파일 선택
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                disabled={uploading}
              />
              
              <div className="mt-2 sm:mt-3 text-xs text-gray-500 text-center">
                PDF, Word, 이미지, 텍스트 파일 지원 (최대 50MB)
              </div>
            </>
          )}
        </div>
      </div>

      {/* 업로드된 파일 목록 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          업로드된 파일 ({projectFiles.length}개)
        </h4>
        
        {projectFiles.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <DocumentPlusIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>업로드된 파일이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectFiles.map((file) => (
              <div
                key={file.file_id}
                className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {getFileIcon(file.display_name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.original_name}
                    </p>
                    <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500">
                      <span>{file.create_time ? new Date(file.create_time).toLocaleDateString() : ''}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        file.state === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {file.state === 'ACTIVE' ? '완료' : '처리중'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.file_id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                  title="파일 삭제"
                >
                  <TrashIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderKnowledgeTab = () => (
    <div className="space-y-4">
      {/* 지식베이스 개요 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          지식베이스 검색
        </h4>
        <div className="flex items-center space-x-4 text-xs text-blue-800 dark:text-blue-300">
          <span>파일: {projectFiles.length}개</span>
          <span>•</span>
          <span>임베딩: {embeddingStats?.embedding_stats?.total_embeddings || 0}개</span>
        </div>
      </div>

      {/* 지식베이스 검색 */}
      <div>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색할 내용을 입력하세요..."
            className="input-primary flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleKnowledgeSearch()}
            disabled={searching}
          />
          <button
            onClick={handleKnowledgeSearch}
            disabled={searching || !searchQuery.trim() || projectFiles.length === 0}
            className="btn-primary px-4"
            title={projectFiles.length === 0 ? "먼저 파일을 업로드해주세요" : "검색"}
          >
            {searching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <MagnifyingGlassIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          <span className="font-medium">검색 예시: </span>
          <button 
            onClick={() => setSearchQuery("주요 요구사항")}
            className="text-blue-600 hover:underline mx-1"
          >
            "주요 요구사항"
          </button>
          <button 
            onClick={() => setSearchQuery("핵심 개념")}
            className="text-blue-600 hover:underline mx-1"
          >
            "핵심 개념"
          </button>
          <button 
            onClick={() => setSearchQuery("구현 방법")}
            className="text-blue-600 hover:underline mx-1"
          >
            "구현 방법"
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      {searching && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">지식베이스를 검색하고 있습니다...</p>
        </div>
      )}

      {!searching && searchQuery && searchResults.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <MagnifyingGlassIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            검색 결과 ({searchResults.length}개)
          </h4>
          <div className="space-y-3">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                    관련도: {Math.round(result.relevance_score * 100)}%
                  </span>
                </div>
                
                <div className="text-sm text-gray-900 dark:text-gray-100 mb-3">
                  {result.content}
                </div>
                
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">출처: </span>
                  {result.source_files?.map((file: string, fileIndex: number) => (
                    <span 
                      key={fileIndex}
                      className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded mx-0.5"
                    >
                      {file.replace(/^project_[^_]+_/, '')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderEmbeddingsTab = () => (
    <div className="space-y-4">
      {/* 임베딩 개요 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          임베딩 상태
        </h4>
        <div className="flex items-center space-x-4 text-xs text-blue-800 dark:text-blue-300">
          <span>모델: text-embedding-004</span>
          <span>•</span>
          <span>벡터 검색 활성화</span>
        </div>
      </div>

      {/* 임베딩 통계 */}
      {loadingStats ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      ) : embeddingStats ? (
        <div>
          {/* 전체 통계 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                {embeddingStats.embedding_stats?.total_embeddings || 0}
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-300">총 임베딩</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-2 sm:p-3 rounded-lg text-center">
              <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                {embeddingStats.embedding_stats?.total_files || 0}
              </div>
              <div className="text-xs text-green-800 dark:text-green-300">파일 수</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-2 sm:p-3 rounded-lg text-center">
              <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(embeddingStats.embedding_stats?.avg_chunk_size || 0)}
              </div>
              <div className="text-xs text-purple-800 dark:text-purple-300">평균 청크</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 sm:p-3 rounded-lg text-center">
              <div className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round((embeddingStats.embedding_stats?.total_chars || 0) / 1000)}K
              </div>
              <div className="text-xs text-orange-800 dark:text-orange-300">총 문자</div>
            </div>
          </div>

          {/* 파일별 통계 */}
          {embeddingStats.file_stats && Object.keys(embeddingStats.file_stats).length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                파일별 임베딩 현황
              </h5>
              <div className="space-y-2">
                {Object.entries(embeddingStats.file_stats).map(([fileName, stats]: [string, any]) => (
                  <div
                    key={fileName}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(fileName)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {fileName}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{stats.chunks}개 청크</span>
                          <span>•</span>
                          <span>{Math.round(stats.total_chars / 1000)}K 문자</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        완료
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <div className="text-4xl mb-2">🧠</div>
          <p>임베딩 데이터가 없습니다</p>
        </div>
      )}
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 
                  transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 
                  text-left align-middle shadow-xl transition-all 
                  max-h-[85vh] sm:max-h-[90vh] flex flex-col"
              >
                {/* 고정 헤더 */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <Dialog.Title
                      as="h3"
                      className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate"
                    >
                      <span className="hidden sm:inline">프로젝트 설정: </span>
                      <span className="sm:hidden">설정: </span>
                      {name || projectId}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* 스크롤 가능한 컨텐츠 영역 */}
                <div className="flex-1 overflow-y-auto">
                  {/* 탭 네비게이션 */}
                  <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-600 z-5">
                    <nav className="flex space-x-2 sm:space-x-4 lg:space-x-6 overflow-x-auto scrollbar-hide">
                      {[
                        { id: 'settings', name: '설정' },
                        { id: 'files', name: '파일' },
                        { id: 'knowledge', name: '검색' },
                        { id: 'embeddings', name: '임베딩' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`py-2 px-2 sm:px-3 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          {tab.name}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* 탭 컨텐츠 */}
                  <div className="px-4 sm:px-6 py-4 min-h-[300px] sm:min-h-[350px]">
                    {activeTab === 'settings' && renderSettingsTab()}
                    {activeTab === 'files' && renderFilesTab()}
                    {activeTab === 'knowledge' && renderKnowledgeTab()}
                    {activeTab === 'embeddings' && renderEmbeddingsTab()}
                  </div>
                </div>

                {/* 고정 하단 버튼들 */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                  <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                    <button
                      onClick={handleDelete}
                      className="btn-danger flex items-center justify-center sm:justify-start w-full sm:w-auto"
                      disabled={isLoading}
                    >
                      <TrashIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">프로젝트 삭제</span>
                    </button>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                      <button
                        onClick={onClose}
                        className="btn-secondary flex-1 sm:flex-none text-sm sm:text-base"
                        disabled={isLoading}
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSave}
                        className="btn-primary flex-1 sm:flex-none text-sm sm:text-base"
                        disabled={isLoading || !name.trim()}
                      >
                        {isLoading ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ProjectSettingsModal;