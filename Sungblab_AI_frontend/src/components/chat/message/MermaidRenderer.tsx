import React, { useRef, useEffect, useState, useCallback } from 'react';

interface MermaidRendererProps {
  content: string;
  className?: string;
}

// Mermaid 라이브러리 로딩 상태 관리
let mermaidInstance: any = null;
let mermaidLoading = false;

// Mermaid 라이브러리 로드 및 초기화
const loadMermaid = async (): Promise<any> => {
  if (mermaidInstance) {
    return mermaidInstance;
  }
  
  if (mermaidLoading) {
    // 로딩 중이면 대기
    await new Promise(resolve => {
      const checkLoaded = () => {
        if (mermaidInstance || !mermaidLoading) {
          resolve(void 0);
        } else {
          setTimeout(checkLoaded, 50);
        }
      };
      checkLoaded();
    });
    return mermaidInstance;
  }

  mermaidLoading = true;
  
  try {
    // 이미 로드된 경우
    if (typeof (window as any).mermaid !== 'undefined') {
      mermaidInstance = (window as any).mermaid;
    } else {
      // 스크립트 동적 로드
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.0.0/dist/mermaid.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Mermaid'));
        document.head.appendChild(script);
      });
      mermaidInstance = (window as any).mermaid;
    }

    // Mermaid 초기화
    mermaidInstance.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'cardinal'
      },
      mindmap: {
        useMaxWidth: true
      }
    });

    mermaidLoading = false;
    return mermaidInstance;
  } catch (error) {
    mermaidLoading = false;
    mermaidInstance = null;
    throw error;
  }
};

// Mermaid 문법 정리 및 수정
const processMermaidSyntax = (content: string): string => {
  let processed = content.trim();
  
  // 다이어그램 타입 확인
  const diagramType = getDiagramType(processed);
  
  switch (diagramType) {
    case 'flowchart':
      processed = processFlowchart(processed);
      break;
    case 'mindmap':
      processed = processMindmap(processed);
      break;
    case 'sequence':
      processed = processSequence(processed);
      break;
    case 'class':
      processed = processClass(processed);
      break;
    default:
      // 기본 처리
      processed = processGeneral(processed);
  }
  
  return processed;
};

// 다이어그램 타입 감지
const getDiagramType = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('sequencediagram') || lowerContent.includes('participant')) {
    return 'sequence';
  }
  if (lowerContent.includes('classdiagram') || lowerContent.includes('class ')) {
    return 'class';
  }
  if (lowerContent.includes('mindmap')) {
    return 'mindmap';
  }
  if (lowerContent.includes('graph') || lowerContent.includes('flowchart')) {
    return 'flowchart';
  }
  
  return 'unknown';
};

// 플로우차트 문법 처리 - 초안전 버전
const processFlowchart = (content: string): string => {
  console.log('Processing flowchart:', content);
  
  // 복잡한 처리 대신 확실히 작동하는 기본 형태로 변환
  try {
    let processed = content;
    
    // 모든 노드를 사각형으로 통일하고 텍스트만 정리
    processed = processed.replace(/\{[^}]*\}/g, (match) => {
      let text = match.slice(1, -1).replace(/<[^>]*>/g, ' ').replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim();
      if (text.length > 15) text = text.substring(0, 12) + '...';
      return `[${text}]`;
    });
    
    processed = processed.replace(/\[([^\]]*)\]/g, (match, innerText) => {
      let text = innerText.replace(/<[^>]*>/g, ' ').replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim();
      if (text.length > 20) text = text.substring(0, 17) + '...';
      return `[${text}]`;
    });
    
    processed = processed.replace(/\(([^)]*)\)/g, (match, innerText) => {
      let text = innerText.replace(/<[^>]*>/g, ' ').replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim();
      if (text.length > 15) text = text.substring(0, 12) + '...';
      return `(${text})`;
    });
    
    console.log('Processed flowchart:', processed);
    return processed;
    
  } catch (error) {
    console.error('Error processing flowchart:', error);
    return createSimplifiedFlowchart(content);
  }
};

// 복잡한 플로우차트를 간단하게 재작성
const createSimplifiedFlowchart = (originalContent: string): string => {
  console.log('Creating simplified flowchart from:', originalContent);
  
  // 가장 안전한 기본 플로우차트로 변환
  return `graph TD
    A[사용자 입력] --> B[토큰화]
    B --> C[임베딩]
    C --> D[트랜스포머 모델]
    D --> E[확률 계산]
    E --> F[텍스트 생성]
    F --> G[최종 출력]`;
};

// 마인드맵 문법 처리
const processMindmap = (content: string): string => {
  const lines = content.split('\n');
  const processedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // 첫 번째 라인은 그대로
    if (i === 0) {
      processedLines.push(line);
      continue;
    }
    
    // 들여쓰기 계산
    const indent = line.match(/^\s*/)?.[0] || '';
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      continue; // 빈 라인 건너뛰기
    }
    
    // 특수 문자 처리
    let processed = trimmedLine;
    
    // 이중 콜론으로 시작하는 아이콘 처리
    if (processed.startsWith('::icon')) {
      processed = processed.replace('::', '');
    }
    // 콜론으로 시작하는 설명 제거 (마인드맵에서 지원하지 않음)
    else if (processed.startsWith(':')) {
      continue; // 이 라인은 건너뛰기
    }
    // 볼드 텍스트 처리
    else if (processed.includes('**')) {
      processed = processed.replace(/\*\*([^*]+)\*\*/g, '$1');
    }
    
    // 너무 긴 텍스트는 줄임
    if (processed.length > 50) {
      processed = processed.substring(0, 47) + '...';
    }
    
    processedLines.push(indent + processed);
  }
  
  return processedLines.join('\n');
};

// 시퀀스 다이어그램 처리
const processSequence = (content: string): string => {
  console.log('Processing sequence diagram:', content);
  
  try {
    let processed = content;
    
    // 괄호 안의 복잡한 텍스트 정리
    processed = processed.replace(/:\s*([^(\n]*\([^)]*\)[^(\n]*)/g, (match, text) => {
      let cleanText = text.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanText.length > 15) cleanText = cleanText.substring(0, 12) + '...';
      return `: ${cleanText}`;
    });
    
    // 일반적인 메시지 텍스트 정리
    processed = processed.replace(/:\s*([^\n]+)/g, (match, text) => {
      let cleanText = text.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanText.length > 20) cleanText = cleanText.substring(0, 17) + '...';
      return `: ${cleanText}`;
    });
    
    console.log('Processed sequence:', processed);
    return processed;
    
  } catch (error) {
    console.error('Error processing sequence:', error);
    return createSimplifiedSequence();
  }
};

// 클래스 다이어그램 처리
const processClass = (content: string): string => {
  console.log('Processing class diagram:', content);
  
  try {
    let processed = content;
    
    // 클래스 이름과 메서드 정리
    processed = processed.replace(/class\s+(\w+)\s*\{([^}]*)\}/g, (match, className, body) => {
      let cleanBody = body.replace(/[^가-힣a-zA-Z0-9\s\-+()]/g, ' ').replace(/\s+/g, ' ').trim();
      return `class ${className} {\n      ${cleanBody}\n    }`;
    });
    
    console.log('Processed class:', processed);
    return processed;
    
  } catch (error) {
    console.error('Error processing class:', error);
    return createSimplifiedClass();
  }
};

// 간소화된 시퀀스 다이어그램
const createSimplifiedSequence = (): string => {
  return `sequenceDiagram
    participant A as 사용자
    participant B as 서버
    participant C as 데이터베이스
    
    A->>B: 요청
    B->>C: 조회
    C-->>B: 응답
    B-->>A: 결과`;
};

// 간소화된 클래스 다이어그램
const createSimplifiedClass = (): string => {
  return `classDiagram
    class Parent {
      +method()
    }
    class Child {
      +method()
    }
    Parent <|-- Child`;
};

// 일반적인 문법 처리
const processGeneral = (content: string): string => {
  let processed = content;
  
  // HTML 태그 제거
  processed = processed.replace(/<[^>]*>/g, '');
  
  // 특수 문자 이스케이프
  processed = processed.replace(/[<>]/g, '');
  
  return processed;
};

// 오류 발생 시 폴백 다이어그램 생성
const createFallbackDiagram = (originalContent: string, error: string): string => {
  const diagramType = getDiagramType(originalContent);
  
  switch (diagramType) {
    case 'sequence':
      return createSimplifiedSequence();
    case 'class':
      return createSimplifiedClass();
    case 'mindmap':
      return `mindmap
  root((오류 발생))
    원본 다이어그램을 렌더링할 수 없습니다
    오류 내용을 확인해주세요`;
    default:
      return `graph TD
    A[오류 발생] --> B[원본 다이어그램을 렌더링할 수 없습니다]
    B --> C[오류 내용을 확인해주세요]`;
  }
};

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null);

  const renderDiagram = useCallback(async (diagramContent: string, isRetry = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const mermaid = await loadMermaid();
      const processedContent = processMermaidSyntax(diagramContent);
      
      // 디버깅용 로그
      console.log('Original content:', diagramContent);
      console.log('Processed content:', processedContent);
      
      // 고유 ID 생성
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 다이어그램 렌더링
      const result = await mermaid.render(id, processedContent);
      setRenderedSvg(result.svg);
      setIsLoading(false);
      
    } catch (renderError: any) {
      console.error('Mermaid render error:', renderError);
      
      // 첫 번째 시도가 실패하고 재시도가 아닌 경우, 폴백 다이어그램으로 재시도
      if (!isRetry) {
        const fallbackContent = createFallbackDiagram(diagramContent, renderError.message || 'Unknown error');
        await renderDiagram(fallbackContent, true);
      } else {
        // 폴백도 실패한 경우
        setError(renderError.message || 'Failed to render diagram');
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (content.trim()) {
      renderDiagram(content);
    }
  }, [content, renderDiagram]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="flex flex-col items-center gap-3 text-gray-600 dark:text-gray-400">
          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">다이어그램 렌더링 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600/50 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="flex-1">
            <div className="font-medium text-red-800 dark:text-red-200">
              다이어그램 렌더링 실패
            </div>
            <div className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
            <details className="mt-3">
              <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-200">
                원본 코드 보기
              </summary>
              <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-x-auto text-red-800 dark:text-red-200 whitespace-pre-wrap">
                {content}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // 성공적으로 렌더링된 상태
  return (
    <div className={`mermaid-container ${className}`}>
      <div 
        ref={containerRef}
        className="mermaid-diagram bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-auto"
        dangerouslySetInnerHTML={{ __html: renderedSvg || '' }}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .mermaid-container {
            width: 100%;
          }
          
          .mermaid-diagram {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .mermaid-diagram svg {
            max-width: 100%;
            height: auto;
            background: transparent;
          }
          
          /* 다크 모드 지원 */
          @media (prefers-color-scheme: dark) {
            .mermaid-diagram svg {
              filter: invert(1) hue-rotate(180deg);
            }
            
            .mermaid-diagram svg text {
              fill: #f3f4f6;
            }
          }
        `
      }} />
    </div>
  );
};

export default MermaidRenderer;