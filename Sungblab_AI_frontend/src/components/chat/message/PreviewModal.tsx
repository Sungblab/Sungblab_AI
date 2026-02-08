import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import IframeRenderer from "./IframeRenderer";
import HtmlPreview from "../../html-editor/HtmlPreview";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  content: string;
  title: string;
  result?: string;
  pythonResult?: {
    output: string;
    images?: string[];
    error?: string;
  };
  css?: string;
  javascript?: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  type,
  content,
  title,
  result,
  pythonResult,
  css,
  javascript,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // SVG 요소 줌/팬 적용 (MermaidModal 방식과 동일)
  useEffect(() => {
    if (isOpen && type === "svg" && containerRef.current) {
      const applyZoomToSvg = () => {
        const svgElement = containerRef.current?.querySelector("svg");
        if (svgElement) {
          // 기본 SVG 설정
          if (
            !svgElement.getAttribute("viewBox") &&
            svgElement.getAttribute("width") &&
            svgElement.getAttribute("height")
          ) {
            const width = parseFloat(svgElement.getAttribute("width") || "0");
            const height = parseFloat(svgElement.getAttribute("height") || "0");

            if (width > 0 && height > 0) {
              svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
              svgElement.style.width = "100%";
              svgElement.style.height = "100%";
            }
          }

          svgElement.style.maxWidth = "100%";
          svgElement.style.maxHeight = "100%";
          svgElement.style.width = "auto";
          svgElement.style.height = "auto";
          
          // 줌/팬 적용
          svgElement.style.transform = `scale(${scale}) translate(${position.x}px, ${position.y}px)`;
          svgElement.style.transformOrigin = "center center";
          svgElement.style.transition = isDragging ? "none" : "transform 0.2s ease-out";
          return true;
        }
        return false;
      };

      // 즉시 시도
      if (!applyZoomToSvg()) {
        // SVG가 아직 없다면 MutationObserver로 기다리기
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  if (element.tagName === 'svg' || element.querySelector('svg')) {
                    if (applyZoomToSvg()) {
                      observer.disconnect();
                      return;
                    }
                  }
                }
              }
            }
          }
        });

        observer.observe(containerRef.current, {
          childList: true,
          subtree: true
        });

        // 최대 5초 후 observer 정리
        setTimeout(() => observer.disconnect(), 5000);

        return () => observer.disconnect();
      }
    }
  }, [isOpen, type, content, scale, position, isDragging]);

  // HTML/iframe 내부 콘텐츠 줌/팬 적용 (MermaidModal 방식)
  useEffect(() => {
    if (isOpen && (type === "html" || type === "composite") && containerRef.current) {
      const applyZoomToIframeContent = () => {
        const iframeElement = containerRef.current?.querySelector('iframe') as HTMLIFrameElement;
        if (iframeElement) {
          try {
            // iframe 내부 document에 접근
            const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document;
            if (iframeDoc && iframeDoc.body) {
              // iframe 내부 body에 transform 적용
              iframeDoc.body.style.transform = `scale(${scale}) translate(${position.x}px, ${position.y}px)`;
              iframeDoc.body.style.transformOrigin = "center center";
              iframeDoc.body.style.transition = isDragging ? "none" : "transform 0.2s ease-out";
              return true;
            }
          } catch (error) {
            console.warn('iframe 내부 콘텐츠 접근 실패:', error);
          }
        }
        return false;
      };

      // iframe 로드 완료 후 적용
      const applyAfterLoad = () => {
        const iframeElement = containerRef.current?.querySelector('iframe') as HTMLIFrameElement;
        if (iframeElement) {
          const onLoad = () => {
            setTimeout(() => applyZoomToIframeContent(), 100);
          };
          
          if (iframeElement.contentDocument?.readyState === 'complete') {
            onLoad();
          } else {
            iframeElement.addEventListener('load', onLoad, { once: true });
          }
        }
      };

      // 즉시 시도
      if (!applyZoomToIframeContent()) {
        // iframe이 아직 없거나 로드되지 않았다면 observer로 기다리기
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  if (element.tagName === 'IFRAME' || element.querySelector('iframe')) {
                    applyAfterLoad();
                    observer.disconnect();
                    return;
                  }
                }
              }
            }
          }
        });

        observer.observe(containerRef.current, {
          childList: true,
          subtree: true
        });

        // 5초 후 observer 정리
        setTimeout(() => observer.disconnect(), 5000);

        return () => observer.disconnect();
      }
    }
  }, [isOpen, type, scale, position, isDragging]);

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((type === "svg" || type === "html" || type === "composite") && scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    let mimeType = "text/plain";
    let extension = "txt";
    let downloadContent = content;

    if (type === "svg") {
      mimeType = "image/svg+xml";
      extension = "svg";
    } else if (type === "html") {
      mimeType = "text/html";
      extension = "html";
    } else if (type === "composite") {
      mimeType = "text/html";
      extension = "html";
      // 복합 아티팩트의 경우 CSS와 JavaScript가 이미 결합된 content 사용
      downloadContent = content;
    }

    const fileName = `${title.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.${extension}`;
    const blob = new Blob([downloadContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // 이미지 다운로드 함수
  const handleImageDownload = (imageBase64: string, index: number) => {
    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph_${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // 모든 이미지 순차 다운로드 함수
  const handleAllImagesDownload = () => {
    if (!pythonResult?.images || pythonResult.images.length === 0) return;

    // 각 이미지를 순차적으로 다운로드 (100ms 간격)
    pythonResult.images.forEach((image, index) => {
      setTimeout(() => handleImageDownload(image, index), index * 200);
    });
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/75 transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div
          className="flex-1 overflow-auto p-6 relative"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* 내부 줌 컨트롤 */}
          {(type === "svg" || type === "html" || type === "composite") && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 border border-gray-200 dark:border-gray-600">
              <button
                onClick={zoomOut}
                className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="축소"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[35px] text-center font-mono">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="확대"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              <button
                onClick={resetZoom}
                className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="원래 크기"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
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
              </button>
            </div>
          )}
          {type === "html" && (
            <div className="w-full h-full">
              <HtmlPreview
                content={content}
                showZoomControls={false}
                enableMathJax={true}
                className="w-full h-full"
                style={{
                  background: 'white',
                  overflow: 'auto',
                  width: '100%',
                  height: '100%'
                }}
                forceIframe={true}
              />
            </div>
          )}
          {type === "svg" && (
            <div className="w-full h-full min-h-[70vh]">
              <IframeRenderer
                content={content}
                type="svg"
                className="w-full h-full"
                onLoad={() => {
                  // iframe 로드 완료 시 추가 작업이 필요하면 여기에 추가
                }}
              />
            </div>
          )}
          {type === "composite" && (
            <div className="w-full h-full">
              <HtmlPreview
                content={content}
                showZoomControls={false}
                enableMathJax={true}
                className="w-full h-full"
                style={{
                  background: 'white',
                  overflow: 'auto',
                  width: '100%',
                  height: '100%'
                }}
                forceIframe={true}
              />
            </div>
          )}
          {(type === "python" || type === "python-result") && (
            <div className="python-content w-full h-full space-y-6">
              {/* 파이썬 코드 표시 */}
              {content && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    파이썬 코드
                  </h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
                    {content}
                  </pre>
                </div>
              )}
              
              {/* 파이썬 실행 결과 표시 */}
              {pythonResult && (
                <div className="space-y-4">
                  {/* 오류 표시 */}
                  {pythonResult.error && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        실행 오류
                      </h3>
                      <pre className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm overflow-x-auto border border-red-200 dark:border-red-600/50 text-red-800 dark:text-red-200">
                        {pythonResult.error}
                      </pre>
                    </div>
                  )}
                  
                  {/* 텍스트 출력 */}
                  {pythonResult.output && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        실행 결과
                      </h3>
                      <pre className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-sm overflow-x-auto border border-green-200 dark:border-green-600/50 text-gray-800 dark:text-gray-200">
                        {pythonResult.output}
                      </pre>
                    </div>
                  )}
                  
                  {/* 이미지 표시 */}
                  {pythonResult.images && pythonResult.images.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          생성된 그래프 ({pythonResult.images.length}개)
                        </h3>
                        {pythonResult.images.length > 1 && (
                          <button
                            onClick={handleAllImagesDownload}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="모든 이미지 다운로드"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            모두 다운로드
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {pythonResult.images.map((image, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                그래프 {index + 1}
                              </div>
                              <button
                                onClick={() => handleImageDownload(image, index)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                                title={`그래프 ${index + 1} 다운로드`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                PNG
                              </button>
                            </div>
                            <div className="flex justify-center">
                              <img
                                src={`data:image/png;base64,${image}`}
                                alt={`그래프 ${index + 1}`}
                                className="max-w-full h-auto rounded border border-gray-200 dark:border-gray-600"
                                style={{ maxHeight: '70vh' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 기존 result 처리 (하위 호환성) */}
              {result && !pythonResult && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    실행 결과
                  </h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
                    {result}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
          <div className="flex gap-2">
            {/* 파이썬 결과가 아닌 경우 기본 다운로드 버튼 */}
            {type !== "python-result" && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                다운로드
              </button>
            )}
            
            {/* 파이썬 결과인 경우 이미지 다운로드 버튼 */}
            {type === "python-result" && pythonResult?.images && pythonResult.images.length > 0 && (
              <button
                onClick={handleAllImagesDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                이미지 다운로드
              </button>
            )}
            
            {/* 코드 복사 버튼 - 파이썬 결과가 아닌 경우에만 */}
            {type !== "python-result" && (
              <button
                onClick={() => {
                  const copyContent = type === "composite" ? content : content;
                  navigator.clipboard.writeText(copyContent);
                  onClose();
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {type === "composite" ? "통합 HTML 복사" : "코드 복사"}
              </button>
            )}
            
            {/* 파이썬 결과인 경우 결과 텍스트 복사 버튼 */}
            {type === "python-result" && pythonResult?.output && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pythonResult.output);
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                결과 복사
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal; 