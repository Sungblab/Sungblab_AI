import React, { useState, useCallback } from "react";
import { modelGuides, modelMenus } from "../../data/modelGuideData";
import type { ModelGuide } from "../../data/modelGuideData";

interface ModelGuideSectionProps {
  onModelSelect?: (modelId: string) => void;
}

const ModelGuideSection: React.FC<ModelGuideSectionProps> = React.memo(({ onModelSelect }) => {
  const [selectedModel, setSelectedModel] = useState<string>(modelGuides[0].id);

  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModel(modelId);
  }, []);

  const handleModelChoose = useCallback((modelId: string) => {
    onModelSelect?.(modelId);
  }, [onModelSelect]);

  const selectedModelData = modelGuides.find(model => model.id === selectedModel);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        모델 선택 가이드
      </h2>
      
      {/* 모델 메뉴 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {modelMenus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => handleModelSelect(menu.id)}
            className={`flex items-center justify-center p-2 
              bg-gray-100 dark:bg-gray-700 
              rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200
              focus:ring-2 focus:ring-primary-500 focus:outline-none
              ${selectedModel === menu.id ? "border-2 border-primary-500" : ""}`}
            aria-pressed={selectedModel === menu.id}
          >
            <span className="text-sm font-pretendard">{menu.label}</span>
          </button>
        ))}
      </div>

      {/* 선택된 모델 정보 */}
      {selectedModelData && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img
                src={selectedModelData.logo}
                alt={`${selectedModelData.title} logo`}
                className="w-5 h-5 object-contain"
              />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                {selectedModelData.title}
              </h3>
            </div>
            <button
              onClick={() => handleModelChoose(selectedModelData.id)}
              className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 text-sm transition-colors duration-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              이 모델 선택
            </button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {selectedModelData.description}
          </p>
          
          <div className="space-y-3">
            <div>
              <strong className="text-gray-800 dark:text-gray-200">주요 용도:</strong>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                {selectedModelData.useCases.map((useCase, idx) => (
                  <li key={idx}>{useCase}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <strong className="text-gray-800 dark:text-gray-200">추천 상황:</strong>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedModelData.recommended}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ModelGuideSection.displayName = 'ModelGuideSection';

export default ModelGuideSection; 