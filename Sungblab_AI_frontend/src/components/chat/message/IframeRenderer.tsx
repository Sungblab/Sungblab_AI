import React, { useRef, useEffect, useState } from 'react';

interface IframeRendererProps {
  content: string;
  type: 'html' | 'svg';
  className?: string;
  onLoad?: () => void;
}

const IframeRenderer: React.FC<IframeRendererProps> = ({
  content,
  type,
  className = '',
  onLoad
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // iframe의 내용을 설정
    const setupIframe = () => {
      let htmlContent: string;

      if (type === 'svg') {
        // SVG의 경우 완전한 HTML 문서로 래핑
        htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVG Preview</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f9fafb;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    svg {
      max-width: 100%;
      max-height: 90vh;
      width: auto;
      height: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .svg-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1f2937;
        color: #f3f4f6;
      }
      
      svg {
        background: #ffffff;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      }
    }
  </style>
</head>
<body>
  <div class="svg-container">
    ${content}
  </div>
</body>
</html>`;
      } else {
        // HTML의 경우 기본 처리
        const hasHtmlStructure = content.includes('<html') || content.includes('<!DOCTYPE');
        
        if (hasHtmlStructure) {
          // 이미 완전한 HTML 구조가 있는 경우 그대로 사용
          htmlContent = content;
        } else {
          // HTML 구조가 없는 경우 기본 구조 추가
          htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Preview</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #ffffff;
    }
    
    * {
      box-sizing: border-box;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    
    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.75rem;
      text-align: left;
    }
    
    th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    
    pre {
      background-color: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
    }
    
    code {
      background-color: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-family: 'Monaco', 'Consolas', monospace;
    }
    
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1f2937;
        color: #f3f4f6;
      }
      
      th {
        background-color: #374151;
      }
      
      th, td {
        border-color: #4b5563;
      }
      
      pre, code {
        background-color: #374151;
      }
    }
  </style>
</head>
<body>
  ${content}
  
  <script>
    // 기본 스크립트 실행
    (function() {
      // 페이지 로드 완료 시 부모에게 알림
      window.addEventListener('load', function() {
        try {
          window.parent.postMessage({ type: 'iframe-loaded' }, '*');
        } catch (e) {
          console.log('PostMessage not available');
        }
      });
      
      // 에러 핸들링
      window.addEventListener('error', function(e) {
        console.error('iframe error:', e.error);
      });
    })();
  </script>
</body>
</html>`;
        }
      }

      // iframe에 내용 설정
      iframe.srcdoc = htmlContent;
    };

    // iframe 로드 이벤트 처리
    const handleLoad = () => {
      setIsLoaded(true);
      if (onLoad) {
        onLoad();
      }
    };

    iframe.addEventListener('load', handleLoad);

    // 초기 설정
    setupIframe();

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [content, type, onLoad]);

  // 메시지 이벤트 처리 (iframe에서 오는 이벤트)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'iframe-loaded') {
        setIsLoaded(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex flex-col items-center gap-3 text-gray-600 dark:text-gray-400">
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-center">
              <div className="text-sm font-medium">
                {type === 'html' ? 'HTML' : 'SVG'} 컨텐츠 로딩 중...
              </div>
            </div>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0 rounded-lg"
        sandbox="allow-scripts allow-same-origin"
        title={`${type} preview`}
        style={{ 
          minHeight: type === 'svg' ? '200px' : '300px',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </div>
  );
};

export default IframeRenderer; 