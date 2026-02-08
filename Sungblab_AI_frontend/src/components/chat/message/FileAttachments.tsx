import React, { memo } from "react";
import { DocumentIcon, PhotoIcon } from "@heroicons/react/24/outline";

interface FileAttachmentsProps {
  files?: Array<{
    type: string;
    data: string;
    name: string;
  }>;
  isUser: boolean;
}

const FileAttachments: React.FC<FileAttachmentsProps> = ({ files, isUser }) => {
  if (!files || files.length === 0) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
    return <DocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  return (
    <div className="flex flex-row items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 max-w-full overflow-x-auto hide-scrollbar">
      {files.map((file, index) => (
        <div
          key={index}
          className={`px-2 py-1 sm:px-2.5 sm:py-1.5 ${
            isUser
              ? "bg-primary-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          } rounded-xl shadow-md flex items-center gap-2 shrink-0 max-w-[180px] sm:max-w-[200px]`}
        >
          {getFileIcon(file.type)}
          <span className="text-sm truncate">{file.name}</span>
        </div>
      ))}
    </div>
  );
};

export default memo(FileAttachments);