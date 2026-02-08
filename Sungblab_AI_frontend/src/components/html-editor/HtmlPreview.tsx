import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface HtmlPreviewProps {
  content: string;
  className?: string;
  showZoomControls?: boolean;
  enableMathJax?: boolean;
  initialZoomLevel?: number;
  onZoomChange?: (zoomLevel: number) => void;
  style?: React.CSSProperties;
  forceIframe?: boolean; // 강제로 iframe 사용
  'data-html-preview'?: string; // PreviewModal에서 사용하는 속성
  externalZoom?: number; // 외부에서 제어하는 zoom 레벨
}

// 외부 리소스를 감지하는 함수
const detectExternalResources = (htmlContent: string): boolean => {
  const externalPatterns = [
    /src\s*=\s*["']https?:\/\//i,           // 외부 script src
    /href\s*=\s*["']https?:\/\//i,          // 외부 link href
    /<script[^>]*src\s*=\s*["'](?!data:)/i, // script 태그
    /@import\s+url\(/i,                     // CSS @import
    /cdn\./i,                               // CDN 참조
    /googleapis\.com/i,                     // Google APIs
    /jsdelivr\.net/i,                       // jsdelivr CDN
    /unpkg\.com/i,                          // unpkg CDN
    /cdnjs\.cloudflare\.com/i,             // cdnjs
  ];
  
  return externalPatterns.some(pattern => pattern.test(htmlContent));
};

const HtmlPreview: React.FC<HtmlPreviewProps> = ({
  content,
  className = '',
  showZoomControls = false,
  enableMathJax = true,
  initialZoomLevel = 100,
  onZoomChange,
  style,
  forceIframe = false,
  'data-html-preview': dataHtmlPreview,
  externalZoom
}) => {
  const [zoomLevel, setZoomLevel] = useState(initialZoomLevel);
  const [useIframe, setUseIframe] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [mathJaxLoaded, setMathJaxLoaded] = useState(false);

  // 외부 리소스 감지 및 iframe 사용 여부 결정
  useEffect(() => {
    const hasExternalResources = detectExternalResources(content);
    setUseIframe(forceIframe || hasExternalResources);
  }, [content, forceIframe]);

  // MathJax 초기화 (iframe 모드가 아닐 때만)
  useEffect(() => {
    if (!enableMathJax || useIframe) return;

    const configureMathJax = () => {
      window.MathJax = {
        tex: {
          inlineMath: [
            ['$', '$'],
            ['\\(', '\\)']
          ],
          displayMath: [
            ['$$', '$$'],
            ['\\[', '\\]']
          ],
          processEscapes: true,
          processEnvironments: true
        },
        svg: {
          fontCache: 'global'
        }
      };
    };

    const loadMathJax = () => {
      if (document.getElementById('MathJax-script')) return;
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
      script.async = true;
      script.id = 'MathJax-script';
      document.head.appendChild(script);

      script.onload = () => {
        setMathJaxLoaded(true);
        if (window.MathJax) {
          window.MathJax.typesetPromise?.()?.catch((err: any) => {
            console.error('MathJax 처리 중 오류:', err);
          });
        }
      };
    };

    configureMathJax();
    loadMathJax();
  }, [enableMathJax, useIframe]);

  // MathJax 렌더링 (iframe 모드가 아닐 때만)
  useEffect(() => {
    if (!enableMathJax || !mathJaxLoaded || useIframe) return;

    const timer = setTimeout(() => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise?.()?.catch((err: any) => {
          console.error('MathJax 렌더링 중 오류:', err);
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [content, enableMathJax, mathJaxLoaded, useIframe]);

  // 확대/축소 함수들
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 10, 200);
    setZoomLevel(newZoom);
    onZoomChange?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 10, 50);
    setZoomLevel(newZoom);
    onZoomChange?.(newZoom);
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    onZoomChange?.(100);
  };

  // 외부에서 줌 레벨 변경 시 동기화
  useEffect(() => {
    if (initialZoomLevel !== zoomLevel) {
      setZoomLevel(initialZoomLevel);
    }
  }, [initialZoomLevel]);

  // iframe 렌더링 컴포넌트 (동적 import 사용)
  const IframeRenderer = React.lazy(() => import('../chat/message/IframeRenderer'));

  return (
    <div className={`html-preview-container ${className}`} style={{...style, display: 'block'}} data-html-preview={dataHtmlPreview}>
      {/* 줌 컨트롤 */}
      {showZoomControls && (
        <div className="zoom-controls flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded mb-2" style={{flexShrink: 0}}>
          <button
            onClick={handleZoomOut}
            className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="축소"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[40px] text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="확대"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="원래 크기로"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </button>
          {/* 외부 리소스 감지 표시 */}
          {useIframe && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded">
              <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-blue-600 dark:text-blue-400">외부 리소스</span>
            </div>
          )}
        </div>
      )}

      {/* 미리보기 영역 */}
      <div 
        className="preview-content bg-white dark:bg-gray-800" 
        style={{
          height: showZoomControls ? 'calc(100% - 60px)' : '100%',
          overflow: 'auto',
          position: 'relative',
          display: 'block'
        }}
      >
        <div 
          className="preview-wrapper"
          style={{ 
            transform: showZoomControls && !externalZoom ? `scale(${zoomLevel / 100})` : externalZoom ? `scale(${externalZoom})` : 'none',
            transformOrigin: 'top left',
            width: showZoomControls && !externalZoom ? `${100 / (zoomLevel / 100)}%` : externalZoom ? `${100 / externalZoom}%` : '100%',
            height: showZoomControls && !externalZoom ? `${100 / (zoomLevel / 100)}%` : externalZoom ? `${100 / externalZoom}%` : '100%',
            minHeight: '300px',
            display: 'block'
          }}
        >
          {useIframe ? (
            // 외부 리소스가 있을 때는 iframe 사용
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
              </div>
            }>
              <IframeRenderer
                content={content}
                type="html"
                className="w-full h-full"
              />
            </React.Suspense>
          ) : (
            // 일반적인 HTML은 직접 렌더링
            <>
              <style>
                {`
                  .MathJax {
                    font-size: 1.1em !important;
                  }
                  
                  .preview-wrapper {
                    display: block !important;
                  }
                  
                  .html-preview-content {
                    width: 100%;
                    padding: 1rem;
                    box-sizing: border-box;
                    min-height: 300px;
                    display: block !important;
                    overflow: visible !important;
                  }
                  
                  .html-preview-content * {
                    max-width: 100%;
                  }
                  
                  .html-preview-content img {
                    max-width: 100%;
                    height: auto;
                  }
                  
                  .html-preview-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1rem 0;
                  }
                  
                  .html-preview-content th,
                  .html-preview-content td {
                    border: 1px solid #e5e7eb;
                    padding: 0.75rem;
                    text-align: left;
                  }
                  
                  .html-preview-content th {
                    background-color: #f9fafb;
                    font-weight: 600;
                  }
                  
                  .html-preview-content pre {
                    background-color: #f3f4f6;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                  }
                  
                  .html-preview-content code {
                    background-color: #f3f4f6;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-family: 'Monaco', 'Consolas', monospace;
                  }
                  
                  /* 부모 컨테이너의 flex 속성 무력화 */
                  .html-preview-container,
                  .html-preview-container * {
                    flex: none !important;
                  }
                  
                  .dark .html-preview-content {
                    color: #f3f4f6;
                  }
                  
                  .dark .html-preview-content th {
                    background-color: #374151;
                  }
                  
                  .dark .html-preview-content th,
                  .dark .html-preview-content td {
                    border-color: #4b5563;
                  }
                  
                  .dark .html-preview-content pre,
                  .dark .html-preview-content code {
                    background-color: #374151;
                  }
                `}
              </style>
              <div
                ref={previewRef}
                className="html-preview-content"
                dangerouslySetInnerHTML={{
                  __html: content?.trim() || '<div class="text-gray-500 dark:text-gray-400">내용이 없습니다.</div>'
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// TypeScript 타입 선언
declare global {
  interface Window {
    MathJax: any;
  }
}

export default HtmlPreview; 