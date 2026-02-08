import React, { useState, useCallback } from "react";
import { usageGuides } from "../../data/usageGuideData";
import type { UsageGuide } from "../../data/usageGuideData";

const UsageGuideSection: React.FC = React.memo(() => {
  const [selectedGuide, setSelectedGuide] = useState<string>(() => {
    const savedGuide = localStorage.getItem("sungblab-selected-guide");
    return savedGuide || usageGuides[0].id;
  });

  const handleGuideSelect = useCallback((guideId: string) => {
    setSelectedGuide(guideId);
    localStorage.setItem("sungblab-selected-guide", guideId);
  }, []);

  const selectedGuideData = usageGuides.find(guide => guide.id === selectedGuide);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        이용 가이드
      </h2>

      {/* 가이드 메뉴 그리드 */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {usageGuides.map((guide) => (
          <button
            key={guide.id}
            onClick={() => handleGuideSelect(guide.id)}
            className={`p-3 rounded-lg text-center transition-colors duration-200
              focus:ring-2 focus:ring-primary-500 focus:outline-none
              ${
                selectedGuide === guide.id
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-2 border-primary-500"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            aria-pressed={selectedGuide === guide.id}
          >
            <span className="text-sm font-medium">{guide.title}</span>
          </button>
        ))}
      </div>

      {/* 선택된 가이드 내용 */}
      {selectedGuideData && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
              {selectedGuideData.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {selectedGuideData.content}
            </p>
            
            {selectedGuideData.details.map((detail, idx) => (
              <div key={idx} className="mt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {detail.subtitle}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {detail.description}
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {detail.points.map((point, pidx) => (
                    <li key={pidx}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

UsageGuideSection.displayName = 'UsageGuideSection';

export default UsageGuideSection; 