import React, { memo } from "react";
import { LinkIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

interface CitationsProps {
  citations?: Array<{
    url: string;
    title?: string;
  }>;
  isUser: boolean;
}

const Citations: React.FC<CitationsProps> = ({ citations, isUser }) => {
  if (!citations || citations.length === 0) return null;

  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  return (
    <div className={`mb-2 sm:mb-2.5 ${isUser ? "max-w-[70%]" : "w-full"}`}>
      <div
        className={`${
          isUser
            ? "bg-primary-600/90 text-white"
            : "w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-gray-900 dark:text-gray-100 border border-blue-200 dark:border-blue-600/50"
        } px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-lg relative transition-all duration-200 ease-in-out hover:shadow-xl`}
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2 text-sm font-medium">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={`p-1 ${
                isUser
                  ? "bg-primary-500"
                  : "bg-blue-100 dark:bg-blue-800/50"
              } rounded-full`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-3 w-3 ${
                  isUser
                    ? "text-white"
                    : "text-blue-600 dark:text-blue-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span
              className={`${
                isUser
                  ? "text-white"
                  : "text-blue-700 dark:text-blue-300"
              } font-semibold tracking-wide`}
            >
              참고 자료
            </span>
          </div>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          {citations.map((citation, index) => (
            <a
              key={index}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-start gap-2 ${
                isUser
                  ? "text-white/90 hover:text-white"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              } transition-colors duration-200 group`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {citation.url.includes(extractDomain(citation.url)) ? (
                  <GlobeAltIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                ) : (
                  <LinkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium leading-tight break-words">
                  {citation.title || extractDomain(citation.url)}
                </p>
                <p
                  className={`text-xs ${
                    isUser
                      ? "text-white/70"
                      : "text-gray-500 dark:text-gray-400"
                  } truncate`}
                >
                  {extractDomain(citation.url)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(Citations);