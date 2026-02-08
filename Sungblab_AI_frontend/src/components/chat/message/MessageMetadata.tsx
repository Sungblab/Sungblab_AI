import React, { memo } from "react";

interface MessageMetadataProps {
  createdAt?: string;
  updatedAt?: string;
}

const MessageMetadata: React.FC<MessageMetadataProps> = ({
  createdAt,
  updatedAt,
}) => {
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!createdAt && !updatedAt) return null;

  return (
    <div className="absolute -bottom-2.5 -left-0 z-10">
      <div className="text-xs bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-2 py-0.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
        {formatTime(updatedAt || createdAt)}
      </div>
    </div>
  );
};

export default memo(MessageMetadata);