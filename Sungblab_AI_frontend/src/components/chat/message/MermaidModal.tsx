import React, { useEffect, useRef, useState } from 'react';
import MermaidRenderer from './MermaidRenderer';

interface MermaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

const MermaidModal: React.FC<MermaidModalProps> = ({
  isOpen,
  onClose,
  content,
  title
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 줌/팬 상태
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 줌 기능
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // 드래그 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };


  // Mermaid SVG에 줌 적용 (MutationObserver로 SVG 로드 감지)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const applyZoomToSvg = () => {
        const svgElement = containerRef.current?.querySelector('svg');
        if (svgElement) {
          svgElement.style.transform = `scale(${scale}) translate(${position.x}px, ${position.y}px)`;
          svgElement.style.transformOrigin = 'center center';
          svgElement.style.transition = isDragging ? 'none' : 'transform 0.2s ease-out';
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
  }, [isOpen, scale, position, isDragging]);

  // ESC 키로 모달 닫기 및 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.ctrlKey || event.metaKey) {
        if (event.key === '=' || event.key === '+') {
          event.preventDefault();
          handleZoomIn();
        } else if (event.key === '-') {
          event.preventDefault();
          handleZoomOut();
        } else if (event.key === '0') {
          event.preventDefault();
          handleResetZoom();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 모달 외부 클릭 시 닫기
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // 다운로드 기능
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mermaid-diagram-${Date.now()}.mmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 클립보드 복사
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // 간단한 피드백 (토스트 메시지 등을 추가할 수 있음)
      console.log('Mermaid 코드가 클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-screen h-screen bg-white dark:bg-gray-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          
          <div className="flex items-center gap-2">
            {/* 줌 컨트롤 */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <button
                onClick={handleZoomOut}
                className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="축소 (Ctrl+-)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <span className="px-2 py-1 text-xs font-mono text-gray-600 dark:text-gray-300 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="확대 (Ctrl++)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              <button
                onClick={handleResetZoom}
                className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="원본 크기 (Ctrl+0)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>

            {/* 복사 버튼 */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="코드 복사"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              복사
            </button>

            {/* 다운로드 버튼 */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              title="파일 다운로드"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              다운로드
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="닫기 (ESC)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div 
          ref={containerRef}
          className="w-full h-[calc(100%-4rem)] overflow-hidden bg-gray-50 dark:bg-gray-900 relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="w-full h-full flex items-center justify-center p-4">
            <MermaidRenderer
              content={content}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* 키보드 단축키 힌트 */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-2 rounded shadow-sm border border-gray-200 dark:border-gray-600">
          <div className="space-y-1">
            <div><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">ESC</kbd> 닫기</div>
            <div><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Ctrl + +/-</kbd> 확대/축소</div>
            <div><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Ctrl + 0</kbd> 원본크기</div>
            <div><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">드래그</kbd> 이동</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MermaidModal;