import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const useFileUpload = (multimodalModels: string[], selectedModel: string) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const isMultimodalSupported = multimodalModels.includes(selectedModel);

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / (1024 * 1024)}MB까지 업로드 가능합니다.`);
      return false;
    }
    return true;
  }, []);

  const processFiles = useCallback((files: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    });
    return validFiles;
  }, [validateFile]);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!isMultimodalSupported) {
      toast.error("현재 선택된 모델은 파일 업로드를 지원하지 않습니다.");
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const validFiles = processFiles(files);
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  }, [isMultimodalSupported, processFiles]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMultimodalSupported) {
      toast.error("현재 선택된 모델은 파일 업로드를 지원하지 않습니다.");
      return;
    }

    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles = processFiles(files);
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
    e.target.value = '';
  }, [isMultimodalSupported, processFiles]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  return {
    dragActive,
    uploadedFiles,
    setUploadedFiles,
    handleDrag,
    handleDrop,
    handleFileSelect,
    removeFile,
    clearFiles,
    isMultimodalSupported,
  };
};