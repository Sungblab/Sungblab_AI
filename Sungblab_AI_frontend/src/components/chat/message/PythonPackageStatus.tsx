import React from 'react';
import { CheckIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PythonPackageStatusProps {
  blockId: string;
  installedPackages: Set<string>;
  isLoading: boolean;
  isRunning: boolean;
  error?: string;
}

const PythonPackageStatus: React.FC<PythonPackageStatusProps> = ({
  blockId,
  installedPackages,
  isLoading,
  isRunning,
  error
}) => {
  if (!isLoading && !isRunning && installedPackages.size === 0 && !error) {
    return null;
  }

  return (
    <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600/50 rounded-lg">
      <div className="flex items-center gap-2 text-sm">
        {isLoading && (
          <>
            <ClockIcon className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-blue-700 dark:text-blue-300">
              Pyodide 초기화 중...
            </span>
          </>
        )}
        
        {isRunning && !isLoading && (
          <>
            <div className="w-4 h-4">
              <svg className="animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <span className="text-blue-700 dark:text-blue-300">
              코드 실행 중...
            </span>
          </>
        )}

        {error && (
          <>
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            <span className="text-red-700 dark:text-red-300">
              패키지 설치 오류: {error}
            </span>
          </>
        )}

        {!isLoading && !isRunning && installedPackages.size > 0 && (
          <>
            <CheckIcon className="w-4 h-4 text-green-500" />
            <span className="text-green-700 dark:text-green-300">
              설치된 패키지: {Array.from(installedPackages).join(', ')}
            </span>
          </>
        )}
      </div>

      {installedPackages.size > 0 && (
        <div className="mt-1">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            💡 필요한 라이브러리가 자동으로 감지되어 설치되었습니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default PythonPackageStatus;