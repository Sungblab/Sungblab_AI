import React, { useState, useCallback } from "react";
import { useChatApi } from "../../api/chatApi";

// 옵션 타입 정의
interface PromptOptions {
  category: string;
  task_description: string;
  style: string;
  complexity: string;
  output_format: string;
  include_examples: boolean;
  include_constraints: boolean;
}

const PromptGeneratorSection: React.FC = React.memo(() => {
  const [options, setOptions] = useState<PromptOptions>({
    category: "일반",
    task_description: "",
    style: "친근한",
    complexity: "중간",
    output_format: "자유형식",
    include_examples: true,
    include_constraints: false,
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { generatePrompt } = useChatApi();

  // 옵션 데이터
  const categories = [
    { value: "일반", label: "일반", icon: "💬" },
    { value: "학습", label: "학습", icon: "📚" },
    { value: "창작", label: "창작", icon: "🎨" },
    { value: "분석", label: "분석", icon: "📊" },
    { value: "번역", label: "번역", icon: "🌐" },
    { value: "코딩", label: "코딩", icon: "💻" },
    { value: "비즈니스", label: "비즈니스", icon: "💼" },
  ];

  const styles = [
    { value: "친근한", label: "친근한", desc: "자연스럽고 접근하기 쉬운" },
    { value: "전문적", label: "전문적", desc: "정확하고 신뢰성 있는" },
    { value: "창의적", label: "창의적", desc: "혁신적이고 영감을 주는" },
    { value: "간결한", label: "간결한", desc: "명확하고 효율적인" },
  ];

  const complexities = [
    { value: "간단", label: "간단", desc: "초보자도 쉽게 이해" },
    { value: "중간", label: "중간", desc: "기본 지식 바탕" },
    { value: "고급", label: "고급", desc: "전문적 지식 필요" },
  ];

  const outputFormats = [
    { value: "자유형식", label: "자유형식", desc: "유연한 텍스트" },
    { value: "단계별", label: "단계별", desc: "순차적 단계" },
    { value: "표형식", label: "표형식", desc: "체계적 정리" },
    { value: "리스트", label: "리스트", desc: "명확한 목록" },
  ];

  const handlePromptGenerate = useCallback(async () => {
    if (!options.task_description.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const data = await generatePrompt(options);
      setGeneratedPrompt(data.generated_prompt);
    } catch (error) {
      setError(
        "로그인 후 이용할 수 있는 기능입니다. 로그인 후 다시 시도해 주세요."
      );
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [options, generatePrompt]);

  const handleClear = useCallback(() => {
    if (window.confirm("모든 설정과 생성된 프롬프트가 초기화됩니다. 계속하시겠습니까?")) {
      setGeneratedPrompt("");
      setOptions({
        category: "일반",
        task_description: "",
        style: "친근한",
        complexity: "중간",
        output_format: "자유형식",
        include_examples: true,
        include_constraints: false,
      });
    }
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }, [generatedPrompt]);

  const updateOption = useCallback((key: keyof PromptOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-6 font-pretendard">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          고급 프롬프트 생성기
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          AI를 위한 최적화된 프롬프트를 생성합니다. 카테고리별 전문 템플릿과 다양한 스타일 옵션을 제공합니다.
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          * 생성된 프롬프트는 바로 복사해서 사용할 수 있습니다. (하루에 10번 사용 가능)
        </p>
      </div>

      {/* 카테고리 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          📂 카테고리
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => updateOption("category", cat.value)}
              className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                options.category === cat.value
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <div className="text-lg">{cat.icon}</div>
              <div className="text-xs mt-1">{cat.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 작업 설명 */}
      <div className="space-y-2">
        <label htmlFor="task-description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          📝 작업 설명
        </label>
        <textarea
          id="task-description"
          value={options.task_description}
          onChange={(e) => updateOption("task_description", e.target.value)}
          placeholder="예시: 과학 실험 보고서 작성을 위한 체계적인 가이드"
          className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
            bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 
            placeholder-gray-400 dark:placeholder-gray-500
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-colors duration-200"
          disabled={isLoading}
        />
      </div>

      {/* 기본 설정 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 스타일 선택 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🎨 스타일
          </label>
          <select
            value={options.style}
            onChange={(e) => updateOption("style", e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
              bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
              focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {styles.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label} - {style.desc}
              </option>
            ))}
          </select>
        </div>

        {/* 복잡도 선택 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            📊 복잡도
          </label>
          <select
            value={options.complexity}
            onChange={(e) => updateOption("complexity", e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
              bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
              focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {complexities.map((complexity) => (
              <option key={complexity.value} value={complexity.value}>
                {complexity.label} - {complexity.desc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 고급 설정 토글 */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          <span>{showAdvanced ? "🔽" : "▶️"}</span>
          고급 설정
        </button>
      </div>

      {/* 고급 설정 */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* 출력 형식 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              📋 출력 형식
            </label>
            <div className="grid grid-cols-2 gap-2">
              {outputFormats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => updateOption("output_format", format.value)}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    options.output_format === format.value
                      ? "bg-primary-500 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <div className="font-medium">{format.label}</div>
                  <div className="text-xs opacity-75">{format.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 추가 옵션 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="include-examples"
                checked={options.include_examples}
                onChange={(e) => updateOption("include_examples", e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="include-examples" className="text-sm text-gray-700 dark:text-gray-300">
                💡 사용 예시 포함
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="include-constraints"
                checked={options.include_constraints}
                onChange={(e) => updateOption("include_constraints", e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="include-constraints" className="text-sm text-gray-700 dark:text-gray-300">
                ⚠️ 제약사항 포함
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-2">
        <button
          onClick={handlePromptGenerate}
          disabled={!options.task_description.trim() || isLoading}
          className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all duration-200
            focus:ring-2 focus:ring-primary-500 focus:outline-none
            ${
              isLoading || !options.task_description.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary-500 hover:bg-primary-600 hover:shadow-md"
            }`}
        >
          {isLoading ? "🔄 생성 중..." : "✨ 프롬프트 생성하기"}
        </button>
        {generatedPrompt && (
          <button
            onClick={handleClear}
            className="px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 
              border border-gray-300 dark:border-gray-600 hover:bg-gray-100 
              dark:hover:bg-gray-700 transition-colors duration-200
              focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            🗑️ 초기화
          </button>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div
          className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 
          dark:text-red-400 rounded-lg text-sm border border-red-300 dark:border-red-600"
          role="alert"
        >
          ❌ {error}
        </div>
      )}

      {/* 생성된 프롬프트 */}
      {generatedPrompt && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              ✅ 생성된 프롬프트
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({options.category} • {options.style} • {options.complexity})
              </span>
            </h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm px-4 py-2 bg-primary-100 dark:bg-primary-900/30 
                text-primary-600 dark:text-primary-400 rounded-lg 
                hover:bg-primary-200 dark:hover:bg-primary-900/50
                transition-colors duration-200
                focus:ring-2 focus:ring-primary-500 focus:outline-none"
              title={isCopied ? "복사됨!" : "클립보드에 복사"}
            >
              {isCopied ? "✅ 복사됨!" : "📋 복사"}
            </button>
          </div>
          <div
            className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg 
            text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap
            border border-gray-200 dark:border-gray-600 shadow-sm
            max-h-96 overflow-y-auto overflow-x-hidden"
          >
            {generatedPrompt}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 이 프롬프트를 복사해서 AI 채팅에 바로 사용하세요!
          </div>
        </div>
      )}
    </div>
  );
});

PromptGeneratorSection.displayName = 'PromptGeneratorSection';

export default PromptGeneratorSection; 