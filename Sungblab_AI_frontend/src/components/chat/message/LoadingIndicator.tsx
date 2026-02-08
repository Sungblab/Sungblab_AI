import React, { memo } from "react";

interface LoadingIndicatorProps {
  isStreaming: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isStreaming }) => {
  if (!isStreaming) return null;

  return (
    <div className="flex items-center justify-start mb-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
      <span className="ml-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
        답변 생성 중...
      </span>
    </div>
  );
};

export default memo(LoadingIndicator);