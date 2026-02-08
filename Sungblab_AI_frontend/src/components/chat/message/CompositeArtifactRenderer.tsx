import React, { memo } from "react";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import HtmlPreview from "../../html-editor/HtmlPreview";

interface CompositeArtifactRendererProps {
  content: string;
  css?: string;
  javascript?: string;
  components: number;
  copiedStates: { [key: string]: boolean };
  onCodeCopy: (code: string, blockId: string) => void;
  onOpenPreviewModal: (
    type: string,
    content: string,
    title: string,
    css?: string,
    javascript?: string
  ) => void;
  index: number;
}

const CompositeArtifactRenderer: React.FC<CompositeArtifactRendererProps> = ({
  content,
  css = "",
  javascript = "",
  components,
  copiedStates,
  onCodeCopy,
  onOpenPreviewModal,
  index
}) => {
  // 복합 아티팩트 HTML 생성
  const generateCompositeHTML = (): string => {
    let htmlContent = content;

    // HTML에 CSS와 JavaScript 삽입
    if (css || javascript) {
      // head 태그 찾기
      const headMatch = htmlContent.match(/<head[^>]*>/i);
      if (headMatch) {
        let headContent = "";
        
        if (css) {
          headContent += `\n<style>\n${css}\n</style>`;
        }
        
        const headInsertPoint = headMatch.index! + headMatch[0].length;
        htmlContent = 
          htmlContent.slice(0, headInsertPoint) + 
          headContent + 
          htmlContent.slice(headInsertPoint);
      } else {
        // head 태그가 없으면 body 전에 삽입
        const bodyMatch = htmlContent.match(/<body[^>]*>/i);
        if (bodyMatch) {
          let headSection = "<head>\n";
          if (css) {
            headSection += `<style>\n${css}\n</style>\n`;
          }
          headSection += "</head>\n";
          
          htmlContent = htmlContent.replace(bodyMatch[0], headSection + bodyMatch[0]);
        }
      }

      // JavaScript는 body 끝에 삽입
      if (javascript) {
        const bodyEndMatch = htmlContent.match(/<\/body>/i);
        if (bodyEndMatch) {
          const scriptContent = `\n<script>\n${javascript}\n</script>\n`;
          htmlContent = htmlContent.replace(bodyEndMatch[0], scriptContent + bodyEndMatch[0]);
        } else {
          // body 태그가 없으면 끝에 추가
          htmlContent += `\n<script>\n${javascript}\n</script>`;
        }
      }
    }

    return htmlContent;
  };

  const compositeHTML = generateCompositeHTML();
  const blockId = `composite-artifact-${index}`;

  const getArtifactTitle = (): string => {
    const parts = [];
    if (content) parts.push("HTML");
    if (css) parts.push("CSS");
    if (javascript) parts.push("JavaScript");
    return `${parts.join(" + ")} 복합 아티팩트`;
  };

  const getComponentBadges = () => {
    const badges = [];
    if (content) badges.push({ label: "HTML", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300" });
    if (css) badges.push({ label: "CSS", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" });
    if (javascript) badges.push({ label: "JS", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" });
    return badges;
  };

  return (
    <div className="w-full mb-3">
      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-md">
        {/* 헤더 */}
        <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.586V5L8 4z" />
              </svg>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {getArtifactTitle()}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  {getComponentBadges().map((badge, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onOpenPreviewModal(
                    "composite",
                    compositeHTML,
                    getArtifactTitle(),
                    css,
                    javascript
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                title="전체 화면으로 보기"
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
                onClick={() => onCodeCopy(compositeHTML, blockId)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                title="통합 HTML 복사"
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
        </div>

        {/* 미리보기 */}
        <div className="p-4">
          <div className="mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              미리보기 ({components}개 컴포넌트 결합):
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <HtmlPreview
              content={compositeHTML}
              showZoomControls={false}
              enableMathJax={true}
              className="max-h-[400px]"
              forceIframe={true} // 복합 아티팩트는 항상 iframe 사용
            />
          </div>
        </div>

        {/* 개별 컴포넌트 정보 */}
        <div className="px-4 pb-4">
          <details className="text-sm">
            <summary className="text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none">
              개별 컴포넌트 보기
            </summary>
            <div className="mt-3 space-y-3">
              {content && (
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    HTML ({content.length} 문자)
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto max-h-32">
                    {content.substring(0, 200)}
                    {content.length > 200 && "..."}
                  </pre>
                </div>
              )}
              {css && (
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    CSS ({css.length} 문자)
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto max-h-32">
                    {css.substring(0, 200)}
                    {css.length > 200 && "..."}
                  </pre>
                </div>
              )}
              {javascript && (
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    JavaScript ({javascript.length} 문자)
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto max-h-32">
                    {javascript.substring(0, 200)}
                    {javascript.length > 200 && "..."}
                  </pre>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default memo(CompositeArtifactRenderer);