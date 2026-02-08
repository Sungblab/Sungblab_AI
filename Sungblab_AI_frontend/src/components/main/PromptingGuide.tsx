import React, { useState, useCallback, useMemo } from "react";
import { promptingGuides } from "../../data/promptingGuideData";
import type { PromptingGuide, PromptExample } from "../../data/promptingGuideData";

// 복사 버튼 컴포넌트
interface CopyButtonProps {
  text: string;
  id: string;
  copied: boolean;
  onCopy: (text: string, id: string) => void;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = React.memo(({ text, id, copied, onCopy, className = "" }) => {
  const handleClick = useCallback(() => {
    onCopy(text, id);
  }, [text, id, onCopy]);

  return (
    <button
      onClick={handleClick}
      className={`text-xs px-2 py-1 rounded transition-colors duration-200 ${className}`}
      title={copied ? "복사됨!" : "클립보드에 복사"}
      aria-label={copied ? "복사됨!" : "클립보드에 복사"}
    >
      {copied ? "복사됨!" : "복사"}
    </button>
  );
});

// 예시 컴포넌트 분리
interface ExampleBoxProps {
  example: PromptExample;
  index: number;
  copiedStates: { [key: string]: boolean };
  onCopy: (text: string, id: string) => void;
}

const ExampleBox: React.FC<ExampleBoxProps> = React.memo(({ example, index, copiedStates, onCopy }) => {
  if ("bad" in example && example.bad && example.good) {
    return (
      <div className="space-y-3">
        {/* 나쁜 예시 */}
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-red-600 dark:text-red-400 font-medium">
              ❌ 나쁜 예시
            </div>
            <CopyButton
              text={example.bad}
              id={`bad-${index}`}
              copied={copiedStates[`bad-${index}`] || false}
              onCopy={onCopy}
              className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60"
            />
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-md font-mono">
            {example.bad}
          </div>
        </div>

        {/* 좋은 예시 */}
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✅ 좋은 예시
            </div>
            <CopyButton
              text={example.good}
              id={`good-${index}`}
              copied={copiedStates[`good-${index}`] || false}
              onCopy={onCopy}
              className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60"
            />
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-md font-mono">
            {example.good}
          </div>
        </div>

        {/* 설명 */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            💡 {example.explanation}
          </p>
        </div>
      </div>
    );
  }

  if ("subject" in example && example.subject && example.prompt) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            📚 {example.subject} 예시
          </div>
          <CopyButton
            text={example.prompt}
            id={`prompt-${index}`}
            copied={copiedStates[`prompt-${index}`] || false}
            onCopy={onCopy}
            className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60"
          />
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-md font-mono">
          {example.prompt}
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            💡 {example.explanation}
          </p>
        </div>
      </div>
    );
  }

  return null;
});

// 메인 프롬프팅 가이드 컴포넌트
const PromptingGuideSection: React.FC = () => {
  const [selectedGuide, setSelectedGuide] = useState(promptingGuides[0].id);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  }, []);

  const handleGuideChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGuide(e.target.value);
  }, []);

  const selectedGuideData = useMemo(() => {
    return promptingGuides.find(guide => guide.id === selectedGuide);
  }, [selectedGuide]);

  return (
    <div className="space-y-6 font-pretendard">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        프롬프팅 가이드
      </h2>

      {/* 가이드 메뉴 - 드롭다운 */}
      <div className="mb-6">
        <label htmlFor="guide-select" className="sr-only">
          가이드 선택
        </label>
        <select
          id="guide-select"
          value={selectedGuide}
          onChange={handleGuideChange}
          className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 font-pretendard focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        >
          {promptingGuides.map((guide) => (
            <option key={guide.id} value={guide.id} className="font-pretendard">
              {guide.title}
            </option>
          ))}
        </select>
      </div>

      {/* 선택된 가이드 내용 */}
      {selectedGuideData && (
        <div className="space-y-6 font-pretendard">
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            {selectedGuideData.description}
              </p>

          {selectedGuideData.sections.map((section, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4 font-pretendard"
                >
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">
                    {section.subtitle}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {section.content}
                  </p>

              {section.examples && section.examples.map((example, eidx) => (
                <ExampleBox
                  key={eidx}
                  example={example}
                  index={eidx}
                  copiedStates={copiedStates}
                  onCopy={handleCopy}
                />
                    ))}
                </div>
              ))}
            </div>
      )}
    </div>
  );
};

export default PromptingGuideSection;
