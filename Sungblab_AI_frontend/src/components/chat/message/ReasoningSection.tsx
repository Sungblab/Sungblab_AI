import React, { memo } from "react";

interface ReasoningSectionProps {
  reasoningContent: string;
  thoughtTime?: number;
  isReasoningOpen: boolean;
  onToggleReasoning: () => void;
  renderContent: (content: string) => React.ReactNode;
}

const ReasoningSection: React.FC<ReasoningSectionProps> = ({
  reasoningContent,
  thoughtTime,
  isReasoningOpen,
  onToggleReasoning,
  renderContent,
}) => {
  return (
    <div className="w-full mb-2 sm:mb-2.5">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-gray-800 dark:text-gray-200 border border-purple-200 dark:border-purple-600/50 px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-lg relative group transition-all duration-200 ease-in-out hover:shadow-xl">
        <div
          className="flex items-center gap-2 sm:gap-3 mb-2 text-sm font-medium text-purple-700 dark:text-purple-300 cursor-pointer select-none hover:text-purple-800 dark:hover:text-purple-200 transition-colors"
          onClick={onToggleReasoning}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transform transition-transform duration-300 ${
                isReasoningOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
            <div className="p-1 bg-purple-100 dark:bg-purple-800/50 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75a3.374 3.374 0 01-2.32-1.11l-.548-.547z"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold tracking-wide">사고 과정</span>
            {thoughtTime && (
              <span className="text-xs font-normal px-2 py-1 bg-purple-100 dark:bg-purple-800/50 rounded-full">
                {thoughtTime.toFixed(1)}s
              </span>
            )}
          </div>
        </div>
        {isReasoningOpen && (
          <div className="break-words leading-relaxed text-sm font-normal bg-white dark:bg-gray-700/50 p-2 sm:p-2.5 rounded-xl max-h-[350px] sm:max-h-[450px] overflow-y-auto custom-scrollbar tracking-wide border border-purple-100 dark:border-purple-600/30 shadow-sm">
            {renderContent(reasoningContent)}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ReasoningSection);