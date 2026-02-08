import { useState, useEffect, useCallback, useMemo } from 'react';

const MODELS = {
  GEMINI_PRO: 'gemini-2.5-pro',
  GEMINI_FLASH: 'gemini-2.5-flash'
};

const ROOM_MODEL_KEY = (roomId: string) => `chat_room_${roomId}_model`;

interface ModelOption {
  value: string;
  name: string;
  description: string;
  logo?: string;
}

export const useModelSelection = (currentRoomId?: string, isAnonymousMode?: boolean) => {
  const [selectedModel, setSelectedModel] = useState(() => {
    if (currentRoomId) {
      const savedRoomModel = localStorage.getItem(ROOM_MODEL_KEY(currentRoomId));
      if (savedRoomModel) return savedRoomModel;
    }
    const savedModel = localStorage.getItem("selected_model");
    return savedModel || MODELS.GEMINI_FLASH;
  });

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const modelOptions = useMemo((): ModelOption[] => [
    {
      value: MODELS.GEMINI_PRO,
      name: "Gemini 2.5 Pro",
      description: "고급 추론 및 분석 기능, 멀티모달 지원",
      logo: "/Google.png",
    },
    {
      value: MODELS.GEMINI_FLASH,
      name: "Gemini 2.5 Flash",
      description: "빠른 응답과 정확한 답변 제공",
      logo: "/Google.png",
    },
  ], []);

  const multimodalModels = useMemo(() => [MODELS.GEMINI_PRO, MODELS.GEMINI_FLASH], []);

  // 익명 모드에서 Flash 모델로 강제 설정
  useEffect(() => {
    if (isAnonymousMode && selectedModel !== MODELS.GEMINI_FLASH) {
      setSelectedModel(MODELS.GEMINI_FLASH);
    }
  }, [isAnonymousMode, selectedModel]);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("selected_model", modelId);
    
    if (currentRoomId) {
      localStorage.setItem(ROOM_MODEL_KEY(currentRoomId), modelId);
    }
    
    setIsModelDropdownOpen(false);
  }, [currentRoomId]);

  return {
    selectedModel,
    setSelectedModel,
    isModelDropdownOpen,
    setIsModelDropdownOpen,
    modelOptions,
    multimodalModels,
    handleModelChange,
    MODELS,
  };
};