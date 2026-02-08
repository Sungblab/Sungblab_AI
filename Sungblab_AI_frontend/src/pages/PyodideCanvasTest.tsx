import React, { useState } from 'react';
import { usePyodideCanvas } from '../hooks/usePyodideCanvas';
import { PlayIcon, ArrowPathIcon, StopIcon } from '@heroicons/react/24/outline';

const EXAMPLE_CODES = [
  {
    name: "간단한 수학 계산",
    code: `# 간단한 계산
import math

x = 5
y = 3
print(f"{x} + {y} = {x + y}")
print(f"{x} * {y} = {x * y}")
print(f"sqrt({x}) = {math.sqrt(x):.2f}")
print(f"pi = {math.pi:.6f}")`,
    packages: []
  },
  {
    name: "Matplotlib 기본 그래프",
    code: `import matplotlib.pyplot as plt
import numpy as np

# 데이터 생성
x = np.linspace(0, 10, 100)
y = np.sin(x)

# 그래프 그리기
plt.figure(figsize=(8, 6))
plt.plot(x, y, label='sin(x)', color='blue', linewidth=2)
plt.plot(x, np.cos(x), label='cos(x)', color='red', linewidth=2)
plt.xlabel('x')
plt.ylabel('y')
plt.title('Sine and Cosine Functions')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()`,
    packages: ['matplotlib', 'numpy']
  },
  {
    name: "Pandas 데이터 분석",
    code: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 샘플 데이터 생성
np.random.seed(42)
df = pd.DataFrame({
    '날짜': pd.date_range('2024-01-01', periods=30),
    '매출': np.random.randint(100, 1000, 30),
    '고객수': np.random.randint(10, 100, 30)
})

# 데이터 정보 출력
print("데이터 정보:")
print(df.head())
print(f"\\n평균 매출: {df['매출'].mean():.2f}")
print(f"평균 고객수: {df['고객수'].mean():.2f}")

# 시각화
plt.figure(figsize=(10, 6))
plt.subplot(2, 1, 1)
plt.plot(df['날짜'], df['매출'], marker='o')
plt.title('일별 매출 추이')
plt.xticks(rotation=45)

plt.subplot(2, 1, 2)
plt.scatter(df['고객수'], df['매출'])
plt.xlabel('고객수')
plt.ylabel('매출')
plt.title('고객수 vs 매출')

plt.tight_layout()
plt.show()`,
    packages: ['pandas', 'numpy', 'matplotlib']
  },
  {
    name: "Seaborn 통계 시각화",
    code: `import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# 샘플 데이터 생성
np.random.seed(42)
data = pd.DataFrame({
    'x': np.random.randn(100),
    'y': np.random.randn(100),
    'category': np.random.choice(['A', 'B', 'C'], 100)
})

# 스타일 설정
sns.set_style("whitegrid")

# 시각화
plt.figure(figsize=(12, 8))

plt.subplot(2, 2, 1)
sns.histplot(data['x'], kde=True)
plt.title('Distribution of X')

plt.subplot(2, 2, 2)
sns.boxplot(x='category', y='y', data=data)
plt.title('Y by Category')

plt.subplot(2, 2, 3)
sns.scatterplot(x='x', y='y', hue='category', data=data)
plt.title('Scatter Plot')

plt.subplot(2, 2, 4)
sns.heatmap(data[['x', 'y']].corr(), annot=True, cmap='coolwarm', center=0)
plt.title('Correlation Heatmap')

plt.tight_layout()
plt.show()`,
    packages: ['seaborn', 'matplotlib', 'numpy', 'pandas']
  },
  {
    name: "3D 그래프",
    code: `import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# 3D 데이터 생성
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')

# 매개변수 설정
u = np.linspace(0, 2 * np.pi, 100)
v = np.linspace(0, np.pi, 100)
x = 10 * np.outer(np.cos(u), np.sin(v))
y = 10 * np.outer(np.sin(u), np.sin(v))
z = 10 * np.outer(np.ones(np.size(u)), np.cos(v))

# 3D 표면 그리기
ax.plot_surface(x, y, z, alpha=0.8, cmap='viridis')
ax.set_xlabel('X')
ax.set_ylabel('Y')
ax.set_zlabel('Z')
ax.set_title('3D Sphere')

plt.show()`,
    packages: ['numpy', 'matplotlib']
  }
];

export default function PyodideCanvasTest() {
  const { pyodide, loading, running, initPyodide, runPython, reset } = usePyodideCanvas();
  const [selectedExample, setSelectedExample] = useState(0);
  const [code, setCode] = useState(EXAMPLE_CODES[0].code);
  const [output, setOutput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleExampleChange = (index: number) => {
    setSelectedExample(index);
    setCode(EXAMPLE_CODES[index].code);
    setOutput('');
    setImages([]);
    setError(null);
  };

  const handleRunCode = async () => {
    if (!pyodide && !loading) {
      await initPyodide();
    }

    setOutput('');
    setImages([]);
    setError(null);

    try {
      const result = await runPython(code, EXAMPLE_CODES[selectedExample].packages);
      setOutput(result.output);
      if (result.images) {
        setImages(result.images);
      }
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(String(err));
    }
  };

  const handleReset = () => {
    reset();
    setOutput('');
    setImages([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Pyodide Canvas 테스트
          </h1>

          {/* 예제 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              예제 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_CODES.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleChange(index)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedExample === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>

          {/* 코드 에디터 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Python 코드
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 p-4 font-mono text-sm bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              spellCheck={false}
            />
          </div>

          {/* 실행 버튼 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={handleRunCode}
              disabled={loading || running}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Pyodide 로딩 중...</span>
                </>
              ) : running ? (
                <>
                  <StopIcon className="w-5 h-5" />
                  <span>실행 중...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5" />
                  <span>실행</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              리셋
            </button>
          </div>

          {/* 출력 */}
          {(output || error || images.length > 0) && (
            <div className="space-y-4">
              {/* 텍스트 출력 */}
              {output && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    출력
                  </h3>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg overflow-x-auto">
                    {output}
                  </pre>
                </div>
              )}

              {/* 에러 */}
              {error && (
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                    에러
                  </h3>
                  <pre className="p-4 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 rounded-lg overflow-x-auto">
                    {error}
                  </pre>
                </div>
              )}

              {/* 이미지 출력 */}
              {images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    그래프
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <img
                          src={`data:image/png;base64,${image}`}
                          alt={`Plot ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 