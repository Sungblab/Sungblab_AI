import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import {
  DocumentIcon,
  ClipboardIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import * as math from "mathjs";

// 분리된 컴포넌트와 훅들 import
import PreviewModal from "./message/PreviewModal";
import MermaidModal from "./message/MermaidModal";
import IframeRenderer from "./message/IframeRenderer";
import CodeBlock from "./message/CodeBlock";
import ReasoningSection from "./message/ReasoningSection";
import LoadingIndicator from "./message/LoadingIndicator";
import MessageMetadata from "./message/MessageMetadata";
import ArtifactRenderer from "./message/ArtifactRenderer";
import FileAttachments from "./message/FileAttachments";
import Citations from "./message/Citations";
import HtmlPreview from "../html-editor/HtmlPreview";
import MermaidRenderer from "./message/MermaidRenderer";
import CompositeArtifactRenderer from "./message/CompositeArtifactRenderer";
import { usePyodideCanvas } from "../../hooks/usePyodideCanvas";
import { usePythonExecution } from "../../hooks/usePythonExecution";
import { useMessageCopy } from "../../hooks/useMessageCopy";
import { combineArtifacts } from "../../utils/messageUtils";
import initializeMessageStyles from "./message/MessageStyles";

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
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
  messageId: number | string;
  isReasoningOpen: boolean;
  onToggleReasoning: (messageId: number | string) => void;
  artifacts?: Array<{
    type: string; // 'html', 'svg', 'python' 등
    content: string;
    title?: string;
    result?: string; // 파이썬 코드 실행 결과
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// Pyodide 타입 정의는 이미 훅에서 처리됨

const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  isUser,
  isStreaming,
  files,
  citations,
  reasoningContent,
  thoughtTime,
  messageId,
  isReasoningOpen,
  onToggleReasoning,
  artifacts,
  createdAt,
  updatedAt,
}): JSX.Element => {
  // 분리된 훅들 사용
  const { copiedStates, handleCodeCopy } = useMessageCopy();
  const {
    pyodide,
    loading,
    running,
    initialized,
    initPyodide,
    runPython,
  } = usePyodideCanvas();

  // 새로운 Python 실행 훅 사용
  const {
    pyodideLoading,
    pythonRunning,
    runPythonCode: executeEnhancedPython,
    installedPackages,
  } = usePythonExecution();

  const messageRef = useRef<HTMLDivElement>(null);
  const codeBlockIndexRef = useRef(0);
  const [localArtifacts, setLocalArtifacts] = useState<
    Array<{
      type: string;
      content: string;
      title?: string;
      result?: string;
    }>
  >(artifacts || []);
  const messageIdRef = useRef(`message-${messageId}`).current;

  // 스타일 초기화
  useEffect(() => {
    initializeMessageStyles();
  }, []);

  // 전역 matplotlib DOM 정리 함수
  useEffect(() => {
    const cleanupMatplotlib = () => {
      const elementsToRemove = document.querySelectorAll([
        '.matplotlib-figure',
        '[id^="matplotlib-"]',
        '[id^="figure-"]',
        'div[style*="matplotlib"]',
        'canvas[style*="matplotlib"]',
        '.js-plotly-plot',
        '[id^="plotly-"]',
        'div[style*="position: absolute"][style*="z-index: 1000"]',
        'div[style*="position: absolute"][style*="z-index: 1001"]'
      ].join(', '));
      
      elementsToRemove.forEach(el => {
        el.remove();
      });
    };

    // 컴포넌트 마운트 시 기존 matplotlib 요소 정리
    cleanupMatplotlib();
    
    // 주기적으로 정리 (5초마다)
    const interval = setInterval(cleanupMatplotlib, 5000);
    
    return () => {
      clearInterval(interval);
      cleanupMatplotlib(); // 컴포넌트 언마운트 시에도 정리
    };
  }, []);

  // Python 코드가 있을 때만 Pyodide를 초기화
  useEffect(() => {
    // content에 Python 코드 블록이 있는지 확인
    const hasPythonCode = content.includes('```python') || 
                         content.includes('```py') || 
                         localArtifacts.some(a => a.type === 'python');
    
    if (hasPythonCode && !initialized && !loading && !pyodide) {
      // 비동기로 초기화하여 UI 블로킹 방지
      const initializeAsync = async () => {
        try {
          await initPyodide();
        } catch (error) {
          console.error("Pyodide 초기화 실패:", error);
        }
      };
      initializeAsync();
    }
  }, [content, localArtifacts, initialized, loading, pyodide, initPyodide]);

  // 파이썬 코드 실행 결과 상태 관리
  const [pythonResults, setPythonResults] = useState<{
    [key: string]: {
      output: string;
      images?: string[];
      error?: string;
    };
  }>({});

  // 모달 상태 관리
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    type: string;
    content: string;
    title: string;
    result: string | undefined;
    pythonResult: { output: string; images?: string[]; error?: string } | undefined;
    css: string | undefined;
    javascript: string | undefined;
  }>({
    type: "",
    content: "",
    title: "",
    result: undefined,
    pythonResult: undefined,
    css: undefined,
    javascript: undefined,
  });

  // Mermaid 전용 모달 상태
  const [mermaidModalOpen, setMermaidModalOpen] = useState(false);
  const [mermaidModalContent, setMermaidModalContent] = useState<{
    content: string;
    title: string;
  }>({
    content: "",
    title: "",
  });

  // 파이썬 코드 실행 함수 - 새로운 훅 사용
  const handleRunPythonCode = async (code: string, blockId: string) => {
    try {
      // 새로운 usePythonExecution 훅을 사용하여 향상된 실행
      const result = await executeEnhancedPython(code, blockId);
      
      // 결과를 기존 형식과 호환되도록 설정
      const newResult = {
        output: result.output || "실행 완료",
        images: result.images || [],
        error: result.error,
      };
      
      setPythonResults((prev) => ({
        ...prev,
        [blockId]: newResult,
      }));
    } catch (error) {
      console.error("파이썬 코드 실행 오류:", error);
      setPythonResults((prev) => ({
        ...prev,
        [blockId]: {
          output: "",
          images: [],
          error: `오류: ${error}`,
        },
      }));
    }
  };

  // 파이썬 결과 모달 열기 함수
  const openPythonResultModal = (blockId: string) => {
    const result = pythonResults[blockId];
    if (!result) return;
    
    setModalContent({
      type: "python-result",
      content: "", // 파이썬 코드는 별도로 전달
      title: "파이썬 실행 결과",
      result: undefined,
      pythonResult: result,
      css: undefined,
      javascript: undefined,
    });
    setModalOpen(true);
  };


  // 미리보기 모달 열기 함수 수정
  const openPreviewModal = useCallback((
    type: string,
    content: string,
    title: string,
    css?: string,
    javascript?: string,
    result?: string
  ) => {
    // Mermaid는 전용 모달로 리다이렉트
    if (type === "mermaid") {
      openMermaidModal(content, title);
      return;
    }
    
    setModalContent({
      type,
      content,
      title,
      result,
      pythonResult: undefined,
      css,
      javascript,
    });
    setModalOpen(true);
  }, []);

  // Mermaid 전용 모달 열기 함수
  const openMermaidModal = useCallback((content: string, title: string) => {
    setMermaidModalContent({
      content,
      title,
    });
    setMermaidModalOpen(true);
  }, []);


  const renderMarkdown = useCallback((text: string) => {
    // 새로운 렌더링 시작 시 코드블록 인덱스 리셋
    codeBlockIndexRef.current = 0;
    
    return (
      <ReactMarkdown
        components={{
          // 단락 처리 - 코드 블록이나 블록 요소가 포함된 경우 처리
          p: ({ children, ...props }) => {
            // 텍스트 콘텐츠 확인
            const textContent = React.Children.toArray(children)
              .map(child => {
                if (typeof child === 'string') return child;
                if (React.isValidElement(child) && child.props?.children) {
                  return typeof child.props.children === 'string' ? child.props.children : '';
                }
                return '';
              })
              .join('');

            // 코드 블록 마커가 있는지 확인
            if (textContent.includes('```')) {
              return <>{children}</>;
            }

            // 자식 요소 중에 블록 레벨 요소가 있는지 확인
            const hasBlockElements = React.Children.toArray(children).some(
              (child) => {
                if (React.isValidElement(child)) {
                  // 코드 블록인지 확인
                  const isCodeBlock = child.type === 'code' && 
                    child.props?.className?.includes('language-');
                  
                  // 블록 레벨 요소 확인
                  const isBlockElement = typeof child.type === 'string' && 
                    ['div', 'pre', 'blockquote', 'ul', 'ol', 'table', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type);
                  
                  return isBlockElement || isCodeBlock;
                }
                return false;
              }
            );
            
            if (hasBlockElements) {
              return <div className="my-2">{children}</div>;
            }
            
            return <p className={`my-2 leading-relaxed ${isUser ? 'text-white' : ''}`} {...props}>{children}</p>;
          },
          
          // 코드 블록 처리
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            
            // 블록 코드인 경우에만 인덱스 증가
            let codeIndex = 0;
            if (!inline && className) {
              codeIndex = codeBlockIndexRef.current++;
            }
            
            // 메시지 ID와 인덱스 기반으로 고유한 블록 ID 생성
            const codeString = String(children);
            const blockId = `code-${language}-${messageId}-${codeIndex}`;

            // 블록 코드인 경우
            if (!inline && className) {
              return (
                <div className="relative rounded-lg bg-gray-900 dark:bg-gray-950 group my-3 shadow-lg overflow-hidden w-full max-w-full block">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-gray-700 dark:bg-gray-600 rounded-full">
                        <DocumentIcon className="w-3 h-3 text-gray-300" />
                      </div>
                      <span className="text-xs font-medium text-gray-300 capitalize">
                        {language || "text"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {language === "svg" && (
                        <button
                          onClick={() =>
                            openPreviewModal(
                              "svg",
                              String(children),
                              "SVG 미리보기",
                              undefined,
                              undefined,
                              undefined
                            )
                          }
                          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-md transition-all duration-200"
                          title="SVG 미리보기"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span>미리보기</span>
                        </button>
                      )}
                      {language === "html" && (
                        <button
                          onClick={() =>
                            openPreviewModal(
                              "html",
                              String(children),
                              "HTML 미리보기",
                              undefined,
                              undefined,
                              undefined
                            )
                          }
                          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-md transition-all duration-200"
                          title="HTML 미리보기"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span>미리보기</span>
                        </button>
                      )}
                      {language === "mermaid" && (
                        <button
                          onClick={() =>
                            openPreviewModal(
                              "mermaid",
                              String(children),
                              "Mermaid 다이어그램 미리보기",
                              undefined,
                              undefined,
                              undefined
                            )
                          }
                          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-md transition-all duration-200"
                          title="Mermaid 다이어그램 미리보기"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span>미리보기</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCodeCopy(String(children), blockId);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-md transition-all duration-200"
                        title="코드 복사"
                      >
                        {copiedStates[blockId] ? (
                          <>
                            <CheckIcon className="w-3.5 h-3.5" />
                            <span>복사됨</span>
                          </>
                        ) : (
                          <>
                            <ClipboardIcon className="w-3.5 h-3.5" />
                            <span>복사</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <CodeBlock 
                    code={String(children)} 
                    language={language}
                    loading={pyodideLoading[blockId] || false}
                    running={pythonRunning[blockId] || false}
                    copiedStates={copiedStates}
                    pythonResults={pythonResults}
                    installedPackages={installedPackages[blockId] || new Set()}
                    onRunPythonCode={handleRunPythonCode}
                    onOpenPythonResultModal={openPythonResultModal}
                    onCodeCopy={handleCodeCopy}
                    blockId={blockId}
                  />
                  {/* Mermaid 코드 블록 미리보기 */}
                  {language === "mermaid" && (
                    <div className="mt-3 border-t border-gray-700 dark:border-gray-600">
                      <div className="px-3 py-2 bg-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-300">미리보기</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-600 overflow-hidden min-h-[200px]">
                          <MermaidRenderer
                            content={String(children)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            
            // 인라인 코드인 경우
            return (
              <code
                className={`px-2 py-0.5 rounded-lg text-sm font-medium border shadow-sm max-w-full break-all overflow-wrap-anywhere inline-block ${
                  isUser 
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-pink-600 dark:text-pink-400 border-gray-200 dark:border-gray-600'
                }`}
                style={{ 
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  maxWidth: '100%',
                  whiteSpace: 'pre-wrap'
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // 나머지 components는 그대로 유지
          h1: ({ children }) => (
            <h1 className={`text-2xl font-bold mt-6 mb-4 ${isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-xl font-semibold mt-5 mb-3 ${isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-lg font-medium mt-4 mb-2 ${isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className={`list-disc list-outside my-2 space-y-1 pl-2 ${isUser ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={`list-decimal list-outside my-2 space-y-1 pl-2 ${isUser ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={`leading-relaxed ml-2 ${isUser ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className={`border-l-3 pl-3 my-3 py-2 rounded-r ${isUser ? 'border-white/40 text-white bg-white/10' : 'border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50'}`}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className={`overflow-x-auto my-4 rounded-lg shadow-sm ${isUser ? 'border border-white/40' : 'border border-gray-200 dark:border-gray-700'}`}>
              <table className={`min-w-full ${isUser ? 'divide-y divide-white/20' : 'divide-y divide-gray-200 dark:divide-gray-700'}`}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={isUser ? 'bg-white/10' : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700'}>{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className={`${isUser ? 'bg-white/5 divide-y divide-white/10' : 'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'}`}>
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr className={isUser ? 'hover:bg-white/10 transition-colors' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'}>{children}</tr>,
          th: ({ children }) => (
            <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isUser ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={`px-4 sm:px-6 py-3 sm:py-4 text-sm ${isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className={`font-semibold ${isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {children}
            </strong>
          ),
          em: ({ children }) => {
            // 중지 메시지 스타일링
            if (typeof children === 'string' && children.includes('[응답이 중지되었습니다]')) {
              return (
                <em className="not-italic inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 px-2 py-1 rounded-lg border border-orange-200 dark:border-orange-600/30 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {children}
                </em>
              );
            }
            if (typeof children === 'string' && children.includes('[검색이 중지되었습니다]')) {
              return (
                <em className="not-italic inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-600/30 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {children}
                </em>
              );
            }
            return (
              <em className={`italic ${isUser ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {children}
              </em>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline underline-offset-2 hover:underline-offset-4 transition-all duration-200 ${isUser ? 'text-white hover:text-white/80' : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'}`}
            >
              {children}
            </a>
          ),
        }}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {text}
      </ReactMarkdown>
    );
  }, [loading, running, copiedStates, pythonResults, handleRunPythonCode, openPythonResultModal, handleCodeCopy, openPreviewModal]);

  // 수식 처리를 위한 유틸리티 함수 추가
  const processMathExpression = (expression: string) => {
    try {
      // LaTeX 문법을 mathjs가 이해할 수 있는 형식으로 변환
      const cleanExpression = expression
        .replace(/\\frac{([^}]*)}{([^}]*)}/, "($1)/($2)")
        .replace(/\\cdot/g, "*")
        .replace(/\\times/g, "*");

      // 수식 계산
      const result = math.evaluate(cleanExpression);

      // 결과를 LaTeX 형식으로 반환
      return {
        result,
        latex: math.parse(result.toString()).toTex(),
        error: null,
      };
    } catch (error) {
      console.error("Math processing error:", error);
      return {
        result: null,
        latex: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // 코드 블록을 감지하고 처리하는 함수
  const renderContent = (text: string) => {
    // 텍스트를 토큰으로 분할하는 함수
    const tokenize = (content: string) => {
      const tokens = [];
      let currentText = "";
      let i = 0;

      while (i < content.length) {
        if (content.startsWith("\\[", i)) {
          const endIndex = content.indexOf("\\]", i);
          if (endIndex !== -1) {
            if (currentText) {
              tokens.push({ type: "text", content: currentText });
              currentText = "";
            }
            const mathContent = content.slice(i + 2, endIndex).trim();
            const processedMath = processMathExpression(mathContent);
            tokens.push({
              type: "math-block",
              content: mathContent,
              result: processedMath.result,
              latex: processedMath.latex,
            });
            i = endIndex + 2;
            continue;
          }
        } else if (content.startsWith("```latex", i)) {
          // LaTeX 코드 블록을 수식 블록으로 처리
          const endIndex = content.indexOf("```", i + 3);
          if (endIndex !== -1) {
            if (currentText) {
              tokens.push({ type: "text", content: currentText });
              currentText = "";
            }
            tokens.push({
              type: "math-block",
              content: content.slice(i + 8, endIndex).trim(),
            });
            i = endIndex + 3;
            continue;
          } else if (content.startsWith("```html", i)) {
            // HTML 코드 블록 처리
            const endIndex = content.indexOf("```", i + 7);
            if (endIndex !== -1) {
              if (currentText) {
                tokens.push({ type: "text", content: currentText });
                currentText = "";
              }
              tokens.push({
                type: "html-artifact",
                content: content.slice(i + 7, endIndex).trim(),
              });
              i = endIndex + 3;
              continue;
            }
          } else if (content.startsWith("```svg", i)) {
            // SVG 코드 블록 처리
            const endIndex = content.indexOf("```", i + 6);
            if (endIndex !== -1) {
              if (currentText) {
                tokens.push({ type: "text", content: currentText });
                currentText = "";
              }
              tokens.push({
                type: "svg-artifact",
                content: content.slice(i + 6, endIndex).trim(),
              });
              i = endIndex + 3;
              continue;
            }
          } else if (content.startsWith("```mermaid", i)) {
            // Mermaid 다이어그램 처리
            const endIndex = content.indexOf("```", i + 10);
            if (endIndex !== -1) {
              if (currentText) {
                tokens.push({ type: "text", content: currentText });
                currentText = "";
              }
              tokens.push({
                type: "mermaid-diagram",
                content: content.slice(i + 10, endIndex).trim(),
              });
              i = endIndex + 3;
              continue;
            }
          } else if (content.startsWith("```css", i)) {
            // CSS 코드 블록 처리 (아티팩트로)
            const endIndex = content.indexOf("```", i + 6);
            if (endIndex !== -1) {
              if (currentText) {
                tokens.push({ type: "text", content: currentText });
                currentText = "";
              }
              const cssContent = content.slice(i + 6, endIndex).trim();
              if (cssContent.length > 50) { // 최소 50자 이상일 때만 아티팩트로 처리
                tokens.push({
                  type: "css-artifact",
                  content: cssContent,
                });
              } else {
                tokens.push({
                  type: "code",
                  language: "css",
                  content: cssContent,
                });
              }
              i = endIndex + 3;
              continue;
            }
          } else if (content.startsWith("```javascript", i) || content.startsWith("```js", i)) {
            // JavaScript 코드 블록 처리 (아티팩트로)
            const langLength = content.startsWith("```javascript", i) ? 13 : 5;
            const endIndex = content.indexOf("```", i + langLength);
            if (endIndex !== -1) {
              if (currentText) {
                tokens.push({ type: "text", content: currentText });
                currentText = "";
              }
              const jsContent = content.slice(i + langLength, endIndex).trim();
              if (jsContent.length > 50) { // 최소 50자 이상일 때만 아티팩트로 처리
                tokens.push({
                  type: "js-artifact",
                  content: jsContent,
                });
              } else {
                tokens.push({
                  type: "code",
                  language: "javascript",
                  content: jsContent,
                });
              }
              i = endIndex + 3;
              continue;
            }
          } else if (content.startsWith("```", i)) {
            const endIndex = content.indexOf("```", i + 3);
            if (endIndex !== -1) {
              if (currentText) {
                tokens.push({ type: "text", content: currentText });
                currentText = "";
              }
              // 언어 식별자 처리
              const firstNewline = content.indexOf("\n", i + 3);
              const language =
                firstNewline !== -1
                  ? content.slice(i + 3, firstNewline).trim()
                  : "";
              const codeContent =
                firstNewline !== -1
                  ? content.slice(firstNewline + 1, endIndex)
                  : content.slice(i + 3, endIndex);

              tokens.push({
                type: "code",
                language,
                content: codeContent,
              });
              i = endIndex + 3;
              continue;
            }
          } else if (content.startsWith("---", i)) {
            // 구분선 처리
            if (currentText) {
              tokens.push({ type: "text", content: currentText });
              currentText = "";
            }
            tokens.push({ type: "divider" });
            i += 3;
            continue;
          } else if (content.startsWith("### ", i)) {
            // h3 헤더 처리
            if (currentText) {
              tokens.push({ type: "text", content: currentText });
              currentText = "";
            }
            const lineEnd = content.indexOf("\n", i);
            const headerContent =
              lineEnd === -1
                ? content.slice(i + 4)
                : content.slice(i + 4, lineEnd);
            tokens.push({
              type: "header3",
              content: headerContent,
            });
            i = lineEnd === -1 ? content.length : lineEnd + 1;
            continue;
          } else if (content.startsWith("$$", i)) {
            // 블록 수식 처리
            const endIndex = content.indexOf("$$", i + 2);
            if (endIndex !== -1) {
              if (currentText) {
                tokens.push({ type: "text", content: currentText });
                currentText = "";
              }
              tokens.push({
                type: "math-block",
                content: content.slice(i + 2, endIndex),
              });
              i = endIndex + 2;
              continue;
            }
          } else if (
            content.startsWith("$", i) &&
            !content.startsWith("$$", i)
          ) {
            // 인라인 수식 처리
            const endIndex = content.indexOf("$", i + 1);
            if (endIndex !== -1) {
              if (currentText) {
                tokens.push({ type: "text", content: currentText });
                currentText = "";
              }
              const mathContent = content.slice(i + 1, endIndex);
              const processedMath = processMathExpression(mathContent);
              tokens.push({
                type: "math-inline",
                content: mathContent,
                result: processedMath.result,
                latex: processedMath.latex,
              });
              i = endIndex + 1;
              continue;
            }
          } else if (content.startsWith("## ", i)) {
            // 헤더 처리
            if (currentText) {
              tokens.push({ type: "text", content: currentText });
              currentText = "";
            }
            const lineEnd = content.indexOf("\n", i);
            const lineContent =
              lineEnd === -1
                ? content.slice(i + 3)
                : content.slice(i + 3, lineEnd);
            tokens.push({
              type: "header",
              content: lineContent,
            });
            i = lineEnd === -1 ? content.length : lineEnd + 1;
            continue;
          } else if (content.startsWith("**", i)) {
            // 볼드 텍스트 처리 개선
            const endIndex = content.indexOf("**", i + 2);
            if (endIndex !== -1) {
              // 현재 텍스트에서 마지막 공백 제거
              if (currentText.trim()) {
                tokens.push({ type: "text", content: currentText.trimEnd() });
              }
              currentText = "";

              // 볼드 콘텐츠 처리
              const boldContent = content.slice(i + 2, endIndex);
              tokens.push({
                type: "bold",
                content: boldContent,
              });

              i = endIndex + 2;
              continue;
            }
          } else if (content.startsWith("[", i)) {
            // 인용 번호 처리
            const match = content.slice(i).match(/^\[(\d+)\]/);
            if (match) {
              if (currentText) {
                tokens.push({ type: "text", content: currentText });
                currentText = "";
              }
              tokens.push({
                type: "citation",
                number: parseInt(match[1]),
              });
              i += match[0].length;
              continue;
            }
          }
        }
        currentText += content[i];
        i++;
      }

      if (currentText) {
        tokens.push({ type: "text", content: currentText });
      }

      return tokens;
    };

    const renderToken = (token: any, index: number) => {
      switch (token.type) {
        case "math-inline":
          return (
            <span key={`math-inline-${index}`} className="mx-1">
              <InlineMath math={token.content} />
              {token.result && (
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  = <InlineMath math={token.latex || token.result.toString()} />
                </span>
              )}
            </span>
          );
        case "math-block":
          return (
            <div key={`math-block-${index}`} className="my-2">
              <BlockMath math={token.content} />
              {token.result && (
                <div className="mt-2 text-gray-500 dark:text-gray-400">
                  = <BlockMath math={token.latex || token.result.toString()} />
                </div>
              )}
            </div>
          );
        case "html-artifact":
          return (
            <div key={`html-artifact-${index}`} className="my-4 w-full max-w-full">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-md w-full">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <DocumentIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      HTML
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        openPreviewModal(
                          "html",
                          token.content,
                          "HTML 미리보기",
                          undefined,
                          undefined,
                          undefined
                        )
                      }
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                      title="전체 화면 미리보기"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                        />
                      </svg>
                      <span>전체 화면</span>
                    </button>
                    <button
                      onClick={() =>
                        handleCodeCopy(token.content, `html-${index}`)
                      }
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                      title="HTML 코드 복사"
                    >
                      {copiedStates[`html-${index}`] ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>복사됨</span>
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="w-3.5 h-3.5" />
                          <span>복사</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <HtmlPreview
                    content={token.content}
                    showZoomControls={true}
                    enableMathJax={true}
                    className="max-h-[500px] border border-gray-200 dark:border-gray-600 rounded"
                  />
                </div>
              </div>
            </div>
          );
        case "svg-artifact":
          return (
            <div key={`svg-artifact-${index}`} className="my-4 w-full max-w-full">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-md w-full">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <DocumentIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      SVG
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCodeCopy(token.content, `svg-${index}`)
                    }
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                    title="SVG 코드 복사"
                  >
                    {copiedStates[`svg-${index}`] ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>복사됨</span>
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="w-3.5 h-3.5" />
                        <span>복사</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3">
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      미리보기:
                    </span>
                  </div>
                  <div className="artifact-container border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 overflow-hidden max-h-[500px]">
                    <IframeRenderer
                      content={token.content}
                      type="svg"
                      className="w-full h-full min-h-[300px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          );

        case "mermaid-diagram":
          return (
            <div key={`mermaid-diagram-${index}`} className="my-4 w-full max-w-full">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-md w-full">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Mermaid 다이어그램
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        openPreviewModal(
                          "mermaid",
                          token.content,
                          "Mermaid 다이어그램 미리보기",
                          undefined,
                          undefined,
                          undefined
                        )
                      }
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                      title="전체 화면 미리보기"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                        />
                      </svg>
                      <span>전체 화면</span>
                    </button>
                    <button
                      onClick={() =>
                        handleCodeCopy(token.content, `mermaid-${index}`)
                      }
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                      title="Mermaid 코드 복사"
                    >
                      {copiedStates[`mermaid-${index}`] ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>복사됨</span>
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="w-3.5 h-3.5" />
                          <span>복사</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      다이어그램:
                    </span>
                  </div>
                  <div className="artifact-container border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 overflow-hidden min-h-[200px]">
                    {/* Mermaid 다이어그램이 유효한지 확인 */}
                    {token.content && token.content.trim() ? (
                      <MermaidRenderer
                        content={token.content}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-sm">Mermaid 다이어그램 내용이 없습니다.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

        case "code":
          return (
            <div
              key={`code-${index}`}
              className="relative my-2 rounded-lg bg-gray-800 dark:bg-gray-900 group w-full max-w-full"
            >
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <DocumentIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-400">
                    {token.language || "text"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {token.language === "svg" && (
                    <button
                      onClick={() =>
                        openPreviewModal(
                          "svg",
                          token.content,
                          "SVG 미리보기",
                          undefined,
                          undefined,
                          undefined
                        )
                      }
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200"
                      title="SVG 미리보기"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>미리보기</span>
                    </button>
                  )}
                  {token.language === "html" && (
                    <button
                      onClick={() =>
                        openPreviewModal(
                          "html",
                          token.content,
                          "HTML 미리보기",
                          undefined,
                          undefined,
                          undefined
                        )
                      }
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200"
                      title="HTML 미리보기"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>미리보기</span>
                    </button>
                  )}
                  {token.language === "mermaid" && (
                    <button
                      onClick={() =>
                        openPreviewModal(
                          "mermaid",
                          token.content,
                          "Mermaid 다이어그램 미리보기",
                          undefined,
                          undefined,
                          undefined
                        )
                      }
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200"
                      title="Mermaid 다이어그램 미리보기"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>미리보기</span>
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleCodeCopy(
                        token.content.trim(),
                        `${token.language}-${index}`
                      )
                    }
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200"
                    title="코드 복사"
                  >
                    {copiedStates[`${token.language}-${index}`] ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>복사됨</span>
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="w-3.5 h-3.5" />
                        <span>복사</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <CodeBlock 
                code={token.content} 
                language={token.language}
                loading={pyodideLoading[`code-${token.language}-${messageId}-${index}`] || false}
                running={pythonRunning[`code-${token.language}-${messageId}-${index}`] || false}
                copiedStates={copiedStates}
                pythonResults={pythonResults}
                installedPackages={installedPackages[`code-${token.language}-${messageId}-${index}`] || new Set()}
                onRunPythonCode={handleRunPythonCode}
                onOpenPythonResultModal={openPythonResultModal}
                onCodeCopy={handleCodeCopy}
                blockId={`code-${token.language}-${messageId}-${index}`}
              />
            </div>
          );

        case "header":
          return (
            <h2 key={`header-${index}`} className="text-xl font-semibold my-2">
              {token.content}
            </h2>
          );

        case "bold":
          return (
            <strong key={`bold-${index}`} className="font-bold">
              {token.content}
            </strong>
          );

        case "citation":
          if (citations && citations[token.number - 1]) {
            const citation = citations[token.number - 1];
            const url = typeof citation === "string" ? citation : citation.url;

            return (
              <a
                key={`citation-${index}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mx-1 px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 no-underline"
                style={{ color: "inherit" }}
              >
                [{token.number}]
              </a>
            );
          }
          return <span key={`citation-${index}`}>[{token.number}]</span>;

        case "header3":
          return (
            <h3
              key={`header3-${index}`}
              className="text-lg font-semibold my-1.5"
            >
              {token.content}
            </h3>
          );

        case "divider":
          return (
            <hr
              key={`divider-${index}`}
              className="border-gray-200 dark:border-gray-600 m-0"
            />
          );

        case "css-artifact":
          return (
            <div key={`css-artifact-${index}`} className="my-4 w-full max-w-full">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-md w-full">
                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      CSS 스타일시트
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCodeCopy(token.content, `css-${index}`)
                    }
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                    title="CSS 코드 복사"
                  >
                    {copiedStates[`css-${index}`] ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>복사됨</span>
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="w-3.5 h-3.5" />
                        <span>복사</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3">
                  <pre className="text-sm overflow-x-auto bg-gray-100 dark:bg-gray-800 p-3 rounded border max-h-60">
                    <code className="language-css">{token.content}</code>
                  </pre>
                </div>
              </div>
            </div>
          );

        case "js-artifact":
          return (
            <div key={`js-artifact-${index}`} className="my-4 w-full max-w-full">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-md w-full">
                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-500 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      JavaScript
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCodeCopy(token.content, `js-${index}`)
                    }
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                    title="JavaScript 코드 복사"
                  >
                    {copiedStates[`js-${index}`] ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>복사됨</span>
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="w-3.5 h-3.5" />
                        <span>복사</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3">
                  <pre className="text-sm overflow-x-auto bg-gray-100 dark:bg-gray-800 p-3 rounded border max-h-60">
                    <code className="language-javascript">{token.content}</code>
                  </pre>
                </div>
              </div>
            </div>
          );

        case "composite-artifact":
          return (
            <CompositeArtifactRenderer
              key={`composite-artifact-${index}`}
              content={token.content}
              css={token.css}
              javascript={token.javascript}
              components={token.components}
              copiedStates={copiedStates}
              onCodeCopy={handleCodeCopy}
              onOpenPreviewModal={openPreviewModal}
              index={index}
            />
          );

        case "text":
        default:
          return <span key={`text-${index}`}>{token.content}</span>;
      }
    };

    const tokens = tokenize(text);
    const combinedTokens = combineArtifacts(tokens);
    return (
      <div className="whitespace-pre-wrap">
        {combinedTokens.map((token, index) => renderToken(token, index))}
      </div>
    );
  };

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.style.height = "auto";
      messageRef.current.style.height = `${messageRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    if (artifacts) {
      setLocalArtifacts(artifacts);
    }
  }, [artifacts]);


  // 사고과정 토글 함수
  const handleToggleReasoning = useCallback(() => {
    onToggleReasoning(messageId);
  }, [messageId, onToggleReasoning]);


  return (
    <div
      className={`flex flex-col ${
        isUser ? "items-end" : "items-start"
      } mb-2 sm:mb-3 w-full`}
    >
      {!isUser && <Citations citations={citations} isUser={isUser} />}
      {!isUser && (
        <ArtifactRenderer
          artifacts={localArtifacts}
          copiedStates={copiedStates}
          onCodeCopy={handleCodeCopy}
          onOpenPreviewModal={openPreviewModal}
        />
      )}
      <FileAttachments files={files} isUser={isUser} />
      {!isUser && <LoadingIndicator isStreaming={isStreaming || false} />}
      {reasoningContent && !isUser && (
        <ReasoningSection
          reasoningContent={reasoningContent}
          thoughtTime={thoughtTime}
          isReasoningOpen={isReasoningOpen}
          onToggleReasoning={handleToggleReasoning}
          renderContent={renderContent}
        />
      )}
      {content && (
        <div className={`relative ${!isUser ? "w-full" : "max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%]"}`}>
          <div
            className={`${
              isUser
                ? "bg-primary-600 text-white px-2 py-1 sm:px-2.5 sm:py-1.5"
                : "w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-600 px-2.5 py-1.5 sm:px-3 sm:py-2"
            } ${
              files ? "rounded-b-2xl rounded-2xl" : "rounded-2xl"
            } shadow-md hover:shadow-lg relative transition-all duration-200 ease-in-out`}
          >
            <div className={`break-words break-all leading-relaxed w-full ${isUser ? 'text-white' : ''}`}>
              {renderMarkdown(content)}
            </div>
          </div>
          {!isUser && (
            <>
              <div className="absolute -bottom-2.5 -right-0 z-10">
                <button
                  onClick={() => handleCodeCopy(content, messageIdRef)}
                  className="text-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                  title="메시지 복사"
                >
                  {copiedStates[messageIdRef] ? (
                    <>
                      <CheckIcon className="w-3 h-3" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-3 h-3" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
              <MessageMetadata createdAt={createdAt} updatedAt={updatedAt} />
            </>
          )}
        </div>
      )}

      {/* 미리보기 모달 */}
      <PreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalContent.type}
        content={modalContent.content}
        title={modalContent.title}
        result={modalContent.result}
        pythonResult={modalContent.pythonResult}
      />

      {/* Mermaid 전용 모달 */}
      <MermaidModal
        isOpen={mermaidModalOpen}
        onClose={() => setMermaidModalOpen(false)}
        content={mermaidModalContent.content}
        title={mermaidModalContent.title}
      />
    </div>
  );
};

// 메모이제이션을 적용하여 불필요한 리렌더링 방지
const MemoizedMessageBubble = memo(MessageBubble, (prevProps, nextProps) => {
  // 기본 프로퍼티 비교
  if (
    prevProps.content !== nextProps.content ||
    prevProps.isStreaming !== nextProps.isStreaming ||
    prevProps.isUser !== nextProps.isUser ||
    prevProps.messageId !== nextProps.messageId ||
    prevProps.isReasoningOpen !== nextProps.isReasoningOpen ||
    prevProps.reasoningContent !== nextProps.reasoningContent ||
    prevProps.thoughtTime !== nextProps.thoughtTime ||
    prevProps.createdAt !== nextProps.createdAt ||
    prevProps.updatedAt !== nextProps.updatedAt
  ) {
    return false;
  }

  // 배열 길이 먼저 비교
  if (prevProps.files?.length !== nextProps.files?.length ||
      prevProps.citations?.length !== nextProps.citations?.length ||
      prevProps.artifacts?.length !== nextProps.artifacts?.length) {
    return false;
  }

  // 빈 배열 처리
  if (!prevProps.files && !nextProps.files &&
      !prevProps.citations && !nextProps.citations &&
      !prevProps.artifacts && !nextProps.artifacts) {
    return true;
  }

  // 파일 비교 (얕은 비교)
  if (prevProps.files && nextProps.files) {
    for (let i = 0; i < prevProps.files.length; i++) {
      if (prevProps.files[i].name !== nextProps.files[i].name ||
          prevProps.files[i].type !== nextProps.files[i].type) {
        return false;
      }
    }
  }

  return true;
});

export default MemoizedMessageBubble;
