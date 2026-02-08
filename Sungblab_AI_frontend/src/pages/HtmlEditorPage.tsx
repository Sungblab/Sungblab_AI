import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  DocumentArrowDownIcon,
  PencilSquareIcon,
  CodeBracketIcon,
  CheckIcon,
  ClipboardIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ViewColumnsIcon,
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  EyeIcon,
  CommandLineIcon,
  DocumentTextIcon,
  SparklesIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/react/24/outline";
import { useReport } from "../contexts/ReportContext";
import { Helmet } from "react-helmet-async";
import Modal from "../components/layout/common/Modal";

// 로컬 스토리지 키
const HTML_STORAGE_KEY = "html_editor_content";

// 도움말 모달 컴포넌트
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-[95vw] md:w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            HTML 편집기 사용 가이드
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 md:px-6 py-6 space-y-6">
          {/* 기본 사용법 섹션 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              기본 사용법
            </h3>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                HTML 편집기는 웹 문서를 쉽게 작성하고 편집할 수 있는 도구입니다.
                왼쪽에서 HTML 코드를 직접 편집하고, 오른쪽에서 실시간으로 결과를
                확인할 수 있습니다.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  주요 기능
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>분할 화면 모드: HTML 코드와 미리보기를 동시에 확인</li>
                  <li>자동 저장: 작업 내용이 자동으로 저장됨</li>
                  <li>PDF 저장: 작성한 HTML을 PDF로 변환하여 저장</li>
                  <li>수식 지원: MathJax를 사용한 수학 표현식 렌더링</li>
                  <li>실시간 미리보기: 코드 변경 시 즉시 반영</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 단축키 섹션 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              키보드 단축키
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    편집 단축키
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        Ctrl+S
                      </span>
                      : 저장
                    </li>
                    <li>
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        Ctrl+Z
                      </span>
                      : 실행 취소
                    </li>
                    <li>
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        Ctrl+Y
                      </span>
                      : 다시 실행
                    </li>
                    <li>
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        Ctrl+/
                      </span>
                      : 주석 토글
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    보기 단축키
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        Ctrl+1
                      </span>
                      : 코드 편집 모드
                    </li>
                    <li>
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        Ctrl+2
                      </span>
                      : 미리보기 모드
                    </li>
                    <li>
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        Ctrl+3
                      </span>
                      : 분할 화면 모드
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// 에디터 모드 타입 정의
type EditorMode = "code" | "preview" | "split";

// 코드 에디터 컴포넌트
interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, className = "" }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  // 라인 번호 업데이트
  useEffect(() => {
    const lines = value.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [value]);

  // 스크롤 동기화
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // 탭 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // 커서 위치 조정
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={`relative flex h-full ${className}`}>
      {/* 라인 번호 */}
      <div 
        ref={lineNumbersRef}
        className="flex-shrink-0 w-12 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="pt-4 px-2 text-xs text-gray-500 dark:text-gray-400 font-mono leading-6">
          {lineNumbers.map((num) => (
            <div key={num} className="text-right h-6">
              {num}
            </div>
          ))}
        </div>
      </div>
      
      {/* 코드 입력 영역 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        className="flex-1 w-full h-full p-4 font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-0 resize-none focus:outline-none focus:ring-0 leading-6 overflow-auto"
        placeholder="HTML 코드를 입력하세요..."
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        data-gramm="false"
      />
    </div>
  );
};

// 미리보기 컴포넌트
interface PreviewPaneProps {
  htmlContent: string;
  zoomLevel: number;
  className?: string;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ htmlContent, zoomLevel, className = "" }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // iframe 콘텐츠 업데이트
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        const fullHtml = `
          <!DOCTYPE html>
          <html lang="ko">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>미리보기</title>
              <!-- CSS 프레임워크 -->
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet">
              <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
              
              <!-- 차트 및 시각화 라이브러리 -->
              <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
              <script src="https://d3js.org/d3.v7.min.js"></script>
              <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
              
              <!-- 유틸리티 라이브러리 -->
              <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
              <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
              
              <!-- 수식 렌더링 -->
              <script>
                window.MathJax = {
                  tex: {
                    inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                    displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                    processEscapes: true,
                    processEnvironments: true
                  },
                  svg: {
                    fontCache: 'global'
                  }
                };
              </script>
              <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
              <style>
                body {
                  font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
                  line-height: 1.6;
                  color: #374151;
                  background-color: #ffffff;
                  margin: 0;
                  padding: 1rem;
                  transform: scale(${zoomLevel / 100});
                  transform-origin: top left;
                  width: ${100 / (zoomLevel / 100)}%;
                  height: ${100 / (zoomLevel / 100)}%;
                }
                
                .MathJax {
                  font-size: 1.1em !important;
                }
                
                /* 기본 스타일 초기화 */
                * {
                  box-sizing: border-box;
                }
                
                /* 링크 스타일 */
                a {
                  color: #2563eb;
                  text-decoration: none;
                }
                
                a:hover {
                  text-decoration: underline;
                }
                
                /* 이미지 반응형 */
                img {
                  max-width: 100%;
                  height: auto;
                }
                
                /* 테이블 스타일 */
                table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 1rem 0;
                }
                
                th, td {
                  border: 1px solid #d1d5db;
                  padding: 0.5rem;
                  text-align: left;
                }
                
                th {
                  background-color: #f9fafb;
                  font-weight: 600;
                }
                
                /* 코드 블록 스타일 */
                pre {
                  background-color: #f3f4f6;
                  padding: 1rem;
                  border-radius: 0.375rem;
                  overflow-x: auto;
                  font-family: 'Courier New', monospace;
                }
                
                code {
                  background-color: #f3f4f6;
                  padding: 0.125rem 0.25rem;
                  border-radius: 0.25rem;
                  font-family: 'Courier New', monospace;
                  font-size: 0.875em;
                }
                
                /* 인용문 스타일 */
                blockquote {
                  border-left: 4px solid #d1d5db;
                  padding-left: 1rem;
                  margin: 1rem 0;
                  font-style: italic;
                  color: #6b7280;
                }
              </style>
            </head>
            <body>
              ${htmlContent || '<div style="text-align: center; color: #9ca3af; padding: 2rem;">여기에 HTML 결과가 표시됩니다</div>'}
              <script>
                if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                  MathJax.typesetPromise().catch(function (err) {
                    console.log('MathJax 처리 오류:', err);
                  });
                }
              </script>
            </body>
          </html>
        `;
        
        doc.open();
        doc.write(fullHtml);
        doc.close();
      }
    }
  }, [htmlContent, zoomLevel]);

  return (
    <div className={`h-full bg-white dark:bg-gray-800 ${className}`}>
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="HTML 미리보기"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

const HtmlEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { reportState, setHtmlContent, setReportStep } = useReport();
  const [editorMode, setEditorMode] = useState<EditorMode>("split");
  const [htmlCode, setHtmlCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const [isHtmlSaved, setIsHtmlSaved] = useState(false);
  const [htmlTitle, setHtmlTitle] = useState("HTML 문서");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAutoSave, setIsAutoSave] = useState(true);

  // 자동 저장 타이머
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * 초기 로드 시 저장된 HTML 불러오기
   */
  useEffect(() => {
    const savedHtml = localStorage.getItem(HTML_STORAGE_KEY);
    if (savedHtml) {
      try {
        const parsedData = JSON.parse(savedHtml);
        setHtmlCode(parsedData.content || "");
        setHtmlTitle(parsedData.title || "HTML 문서");
        setHtmlContent(parsedData.content || "");
        setIsPrintReady(true);
        setIsHtmlSaved(true);
      } catch (error) {
        console.error("저장된 HTML 불러오기 오류:", error);
        toast.error("저장된 HTML을 불러오는 중 오류가 발생했습니다.");
        setDefaultHtml();
      }
    } else if (reportState.htmlContent) {
      setHtmlCode(reportState.htmlContent || "");
      setIsPrintReady(true);
      setIsHtmlSaved(true);
    } else {
      setDefaultHtml();
    }
  }, []); // Remove dependencies to prevent infinite loop

  /**
   * 기본 HTML 템플릿 설정
   */
  const setDefaultHtml = () => {
    const defaultHtml = `<div class="max-w-4xl mx-auto p-8 bg-white">
  <h1 class="text-3xl font-bold text-gray-900 mb-6">문서 제목</h1>
  
  <div class="prose prose-lg max-w-none">
    <p class="text-gray-700 mb-4">
      여기에 내용을 작성하세요. 이 에디터는 HTML을 직접 편집하고 실시간으로 미리보기를 제공합니다.
    </p>
    
    <h2 class="text-2xl font-semibold text-gray-800 mt-8 mb-4">예시 섹션</h2>
    
    <ul class="list-disc pl-6 mb-6">
      <li>목록 항목 1</li>
      <li>목록 항목 2</li>
      <li>목록 항목 3</li>
    </ul>
    
    <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
      <p class="text-gray-700">
        이것은 정보 박스입니다. 중요한 내용을 강조할 때 사용할 수 있습니다.
      </p>
      </div>
  </div>
</div>`;
    setHtmlCode(defaultHtml);
    setHtmlContent(defaultHtml);
  };

  /**
   * 자동 저장 처리
   */
  useEffect(() => {
    if (isAutoSave && htmlCode.trim()) {
      // 기존 타이머 클리어
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      // 새 타이머 설정 (2초 후 자동 저장)
      autoSaveTimer.current = setTimeout(() => {
        handleHtmlSave(false); // 자동 저장은 토스트 메시지 없이
      }, 2000);
    }
    
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [htmlCode, isAutoSave]);

  /**
   * HTML 저장 기능
   */
  const handleHtmlSave = (showToast: boolean = true) => {
    try {
      const trimmedHtmlCode = htmlCode?.trim() || "";
      const now = new Date();
      const dateStr = now.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const htmlData = {
        title: htmlTitle,
        content: trimmedHtmlCode,
        date: dateStr,
      };

      localStorage.setItem(HTML_STORAGE_KEY, JSON.stringify(htmlData));
      setHtmlContent(trimmedHtmlCode);
      setIsPrintReady(true);
      setIsHtmlSaved(true);

      if (showToast) {
      toast.success("HTML이 저장되었습니다.");
      }
    } catch (error) {
      console.error("HTML 저장 중 오류:", error);
      toast.error("HTML 저장에 실패했습니다.");
      setIsPrintReady(false);
      setIsHtmlSaved(false);
    }
  };

  /**
   * 키보드 단축키 처리
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
          handleHtmlSave();
            break;
          case '1':
            e.preventDefault();
            setEditorMode('code');
            break;
          case '2':
            e.preventDefault();
            setEditorMode('preview');
            break;
          case '3':
            e.preventDefault();
            setEditorMode('split');
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * 복사 기능
   */
  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("코드가 복사되었습니다.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
      toast.error("복사에 실패했습니다.");
    }
  };

  /**
   * 뒤로 가기
   */
  const handleBack = () => {
    setReportStep("content");
    navigate(-1);
  };

  /**
   * PDF 저장
   */
  const handlePdfDownload = () => {
    if (!isPrintReady || !htmlCode?.trim()) {
      toast.error("HTML을 먼저 저장해주세요.");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <title>${htmlTitle}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet">
          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true,
                processEnvironments: true
              },
              svg: { fontCache: 'global' },
              startup: {
                ready: () => {
                  MathJax.startup.defaultReady();
                  MathJax.typesetPromise().then(() => {
                    setTimeout(() => window.print(), 500);
                  });
                }
              }
            };
          </script>
          <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
          <style>
            @page { size: A4; margin: 15mm; }
            body {
              font-family: Pretendard, -apple-system, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 15mm;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              body { padding: 0; }
              .print-button { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-button" style="position: fixed; top: 1rem; right: 1rem; z-index: 1000;">
            <button onclick="window.print()" style="padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
              인쇄하기
            </button>
          </div>
            ${htmlCode?.trim() || "<div>내용이 없습니다.</div>"}
        </body>
      </html>
    `;

    const blob = new Blob([printContent], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");

    if (!printWindow) {
      toast.error("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      return;
    }

    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  // 확대/축소 기능들
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Helmet>
        <title>HTML 에디터 - Sungblab AI</title>
      </Helmet>

      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="뒤로 가기"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              HTML 에디터
            </h1>
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={htmlTitle}
                onChange={(e) => setHtmlTitle(e.target.value)}
                className="px-3 py-1 bg-transparent border-none text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                placeholder="문서 제목"
              />
          </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 자동 저장 토글 */}
            <button
              onClick={() => setIsAutoSave(!isAutoSave)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isAutoSave 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
              title="자동 저장"
            >
              {isAutoSave ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
              <span className="hidden sm:inline">자동저장</span>
            </button>

            {/* 저장 버튼 */}
                <button
              onClick={() => handleHtmlSave()}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="저장 (Ctrl+S)"
            >
              <CheckIcon className="w-4 h-4" />
              <span className="hidden sm:inline">저장</span>
                </button>

            {/* PDF 저장 */}
              <button
              onClick={handlePdfDownload}
              disabled={!isPrintReady || !isHtmlSaved}
              className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="PDF로 저장"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
              </button>

            {/* 복사 버튼 */}
              <button
              onClick={() => handleCopy(htmlCode)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="코드 복사"
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-green-600" />
              ) : (
                <ClipboardIcon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">복사</span>
            </button>

            {/* 도움말 */}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="도움말"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 툴바 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* 에디터 모드 선택 */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
              onClick={() => setEditorMode('code')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                editorMode === 'code' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title="코드 편집 모드 (Ctrl+1)"
            >
              <CodeBracketIcon className="w-4 h-4" />
              <span className="hidden sm:inline">코드</span>
                    </button>
                    <button
              onClick={() => setEditorMode('preview')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                editorMode === 'preview' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title="미리보기 모드 (Ctrl+2)"
            >
              <EyeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">미리보기</span>
                    </button>
                    <button
              onClick={() => setEditorMode('split')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                editorMode === 'split' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title="분할 화면 모드 (Ctrl+3)"
            >
              <ViewColumnsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">분할</span>
                    </button>
                  </div>

          <div className="flex items-center space-x-4">
            {/* 확대/축소 컨트롤 */}
            {(editorMode === 'preview' || editorMode === 'split') && (
              <div className="flex items-center space-x-2">
                    <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="축소"
                >
                  <MinusIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
                  {zoomLevel}%
                </span>
                    <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="확대"
                >
                  <PlusIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="원래 크기로"
                >
                  <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
            )}
                  </div>
                  </div>
                  </div>

      {/* 에디터 영역 */}
      <div className="flex-1 overflow-hidden">
        {editorMode === 'code' && (
          <CodeEditor
                    value={htmlCode}
            onChange={setHtmlCode}
            className="h-full"
          />
        )}
        
        {editorMode === 'preview' && (
          <PreviewPane
            htmlContent={htmlCode}
            zoomLevel={zoomLevel}
            className="h-full"
          />
        )}
        
        {editorMode === 'split' && (
          <div className="flex h-full">
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
              <CodeEditor
                value={htmlCode}
                onChange={setHtmlCode}
                className="h-full"
              />
            </div>
            <div className="w-1/2">
              <PreviewPane
                htmlContent={htmlCode}
                zoomLevel={zoomLevel}
                className="h-full"
              />
          </div>
                  </div>
        )}
                  </div>

      {/* 상태 표시줄 */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>라인: {htmlCode.split('\n').length}</span>
            <span>글자: {htmlCode.length}</span>
            {isAutoSave && (
              <span className="flex items-center space-x-1">
                <SparklesIcon className="w-4 h-4 text-green-500" />
                <span>자동 저장됨</span>
                      </span>
            )}
                  </div>
          <div className="flex items-center space-x-2">
            <span>HTML 에디터 v2.0</span>
                </div>
              </div>
      </div>

      {/* 도움말 모달 */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};

export default HtmlEditorPage;
