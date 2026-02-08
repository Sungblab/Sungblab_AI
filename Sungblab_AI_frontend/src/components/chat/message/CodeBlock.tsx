import React, { memo } from "react";
import { PlayIcon, CheckIcon, ClipboardIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { Highlight, themes } from "prism-react-renderer";
import PythonPackageStatus from "./PythonPackageStatus";

interface CodeBlockProps {
  code: string;
  language: string;
  loading?: boolean;
  running?: boolean;
  copiedStates: { [key: string]: boolean };
  pythonResults: {
    [key: string]: {
      output: string;
      images?: string[];
      error?: string;
    };
  };
  installedPackages?: Set<string>;
  onRunPythonCode: (code: string, blockId: string) => void;
  onOpenPythonResultModal: (blockId: string) => void;
  onCodeCopy: (code: string, blockId: string) => void;
  blockId?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  loading = false,
  running = false,
  copiedStates,
  pythonResults,
  installedPackages = new Set(),
  onRunPythonCode,
  onOpenPythonResultModal,
  onCodeCopy,
  blockId: externalBlockId,
}) => {
  const blockId = externalBlockId || `code-${language}-${code
    .substring(0, 20)
    .replace(/\s+/g, "-")}`;

  // Python 결과가 있는 블록만 로깅
  if (language === 'python' && pythonResults[blockId]) {
    console.log("CodeBlock Python 결과 발견:", { 
      blockId, 
      hasPythonResult: !!pythonResults[blockId],
      pythonResult: pythonResults[blockId]
    });
  }

  return (
    <div>
      {language === "python" && (
        <PythonPackageStatus
          blockId={blockId}
          installedPackages={installedPackages}
          isLoading={loading}
          isRunning={running}
          error={pythonResults[blockId]?.error}
        />
      )}
      <Highlight
        theme={themes.nightOwl}
        code={code.trim()}
        language={language || "text"}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <div className="relative group">
            <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {language === "python" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRunPythonCode(code, blockId)}
                    className="p-1.5 rounded-lg bg-gray-700/80 hover:bg-gray-600 text-gray-200 transition-all duration-200 backdrop-blur-sm hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    title={loading ? "Pyodide 초기화 중..." : running ? "코드 실행 중..." : "파이썬 코드 실행"}
                    disabled={loading || running}
                  >
                    {loading || running ? (
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </button>
                  {pythonResults[blockId] && (
                    <button
                      onClick={() => onOpenPythonResultModal(blockId)}
                      className="p-1.5 rounded-lg bg-gray-700/80 hover:bg-gray-600 text-gray-200 transition-all duration-200 backdrop-blur-sm hover:scale-105"
                      title="실행 결과 전체 화면으로 보기"
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
                  )}
                  {loading && (
                    <span className="text-xs text-gray-400">
                      초기화 중...
                    </span>
                  )}
                  {running && (
                    <span className="text-xs text-gray-400">
                      실행 중...
                    </span>
                  )}
                </div>
              )}
            </div>
            <pre
              className="p-3 overflow-x-auto text-sm font-medium rounded-lg"
              style={style}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          </div>
        )}
      </Highlight>
      <div className="flex justify-end py-1.5 px-3 bg-gray-800 rounded-b-lg border-t border-gray-700">
        <button
          onClick={() => onCodeCopy(code, blockId)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-md transition-all duration-200"
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
      {language === "python" && pythonResults[blockId] && (
        <div className="mt-3">
          {pythonResults[blockId].error ? (
            <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-600/50 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-red-100 dark:bg-red-800/50 rounded-full">
                    <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    실행 오류
                  </span>
                </div>
                <button
                  onClick={() => onOpenPythonResultModal(blockId)}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  title="전체 화면으로 보기"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                  <span>전체 화면</span>
                </button>
              </div>
              <pre className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap overflow-x-auto bg-red-50 dark:bg-red-900/30 p-3 rounded-md border border-red-200/50 dark:border-red-600/30 max-h-48 overflow-y-auto">
                {pythonResults[blockId].error}
              </pre>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-600/50 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                    <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    실행 결과
                    {pythonResults[blockId].images && pythonResults[blockId].images!.length > 0 && (
                      <span className="ml-1 text-xs">
                        • 그래프 {pythonResults[blockId].images!.length}개
                      </span>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => onOpenPythonResultModal(blockId)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  title="전체 화면으로 보기"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                  <span>전체 화면</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {pythonResults[blockId].output && (
                  <div>
                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      출력
                    </div>
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto bg-white dark:bg-gray-800/50 p-3 rounded-md border border-blue-200/50 dark:border-blue-600/30 max-h-48 overflow-y-auto">
                      {pythonResults[blockId].output}
                    </pre>
                  </div>
                )}
                
                {pythonResults[blockId].images && pythonResults[blockId].images!.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                      <PhotoIcon className="w-3 h-3" />
                      생성된 그래프
                    </div>
                    <div className="space-y-2">
                      {pythonResults[blockId].images!.map((image, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800/50 p-2.5 rounded-md border border-blue-200/50 dark:border-blue-600/30">
                          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1.5 font-medium">
                            그래프 {index + 1}
                          </div>
                          <img
                            src={`data:image/png;base64,${image}`}
                            alt={`그래프 ${index + 1}`}
                            className="w-full h-auto rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => onOpenPythonResultModal(blockId)}
                            title="클릭하여 전체 화면으로 보기"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!pythonResults[blockId].output && (!pythonResults[blockId].images || pythonResults[blockId].images!.length === 0) && (
                  <div className="text-center py-3">
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">✓ 실행 완료</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      코드가 성공적으로 실행되었습니다. 출력 결과가 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(CodeBlock);