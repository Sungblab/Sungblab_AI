import React, { memo } from "react";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import IframeRenderer from "./IframeRenderer";
import HtmlPreview from "../../html-editor/HtmlPreview";
import MermaidRenderer from "./MermaidRenderer";

interface ArtifactRendererProps {
  artifacts?: Array<{
    type: string;
    content: string;
    title?: string;
    result?: string;
  }>;
  copiedStates: { [key: string]: boolean };
  onCodeCopy: (code: string, blockId: string) => void;
  onOpenPreviewModal: (
    type: string,
    content: string,
    title: string,
    result?: string
  ) => void;
}

const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({
  artifacts,
  copiedStates,
  onCodeCopy,
  onOpenPreviewModal,
}) => {
  if (!artifacts || artifacts.length === 0) return null;

  return (
    <div className="w-full mb-3 space-y-3">
      {artifacts.map((artifact, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-md"
        >
          {artifact.title && (
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {artifact.title}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onOpenPreviewModal(
                      artifact.type,
                      artifact.content,
                      artifact.title ||
                        `${artifact.type.toUpperCase()} 미리보기`,
                      artifact.result
                    )
                  }
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
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
                  onClick={() =>
                    onCodeCopy(artifact.content, `artifact-${index}`)
                  }
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                  title="코드 복사"
                >
                  {copiedStates[`artifact-${index}`] ? (
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
          )}
          <div className="p-3">
            {artifact.type === "html" && (
              <HtmlPreview
                content={artifact.content}
                showZoomControls={true}
                enableMathJax={true}
                className="max-h-[500px] border border-gray-200 dark:border-gray-600 rounded"
              />
            )}
            {artifact.type === "svg" && (
              <div className="artifact-container border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 overflow-hidden max-h-[500px]">
                <IframeRenderer
                  content={artifact.content}
                  type="svg"
                  className="w-full h-full min-h-[300px]"
                />
              </div>
            )}
            {artifact.type === "python" && (
              <div className="artifact-container border border-gray-200 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 overflow-auto max-h-[500px]">
                <div className="mb-3">
                  <div className="font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    파이썬 코드:
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                    {artifact.content}
                  </pre>
                </div>
                {artifact.result && (
                  <div>
                    <div className="font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      실행 결과:
                    </div>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                      {artifact.result}
                    </pre>
                  </div>
                )}
              </div>
            )}
            {artifact.type === "mermaid" && (
              <div className="artifact-container max-h-[500px] overflow-auto">
                <MermaidRenderer
                  content={artifact.content}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default memo(ArtifactRenderer);