import { useState, useRef } from "react";

// Pyodide 타입 정의
declare global {
  interface Window {
    loadPyodide: () => Promise<any>;
    pyodide: any;
  }
}

interface PythonExecutionState {
  pyodideInstances: { [key: string]: any };
  pyodideLoading: { [key: string]: boolean };
  pythonRunning: { [key: string]: boolean };
  installedPackages: { [key: string]: Set<string> };
}

interface ExecutionResult {
  output: string;
  images?: string[];
  error?: string;
}

interface UsePythonExecutionReturn {
  pyodideInstances: { [key: string]: any };
  pyodideLoading: { [key: string]: boolean };
  pythonRunning: { [key: string]: boolean };
  loadPyodide: (blockId: string) => Promise<any>;
  runPythonCode: (code: string, blockId: string) => Promise<ExecutionResult>;
  installedPackages: { [key: string]: Set<string> };
}

export const usePythonExecution = (): UsePythonExecutionReturn => {
  const [pyodideInstances, setPyodideInstances] = useState<{
    [key: string]: any;
  }>({});
  const [pyodideLoading, setPyodideLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [pythonRunning, setPythonRunning] = useState<{
    [key: string]: boolean;
  }>({});
  const [installedPackages, setInstalledPackages] = useState<{
    [key: string]: Set<string>;
  }>({});

  // 자동으로 필요한 패키지를 감지하고 설치하는 함수
  const detectAndInstallPackages = async (code: string, pyodide: any, blockId: string): Promise<void> => {
    const packageMap: { [key: string]: string[] } = {
      'import matplotlib': ['matplotlib'],
      'import pandas': ['pandas'],
      'import numpy': ['numpy'],
      'import scipy': ['scipy'],
      'import sklearn': ['scikit-learn'],
      'import seaborn': ['seaborn'],
      'import plotly': ['plotly'],
      'import requests': ['requests'],
      'import beautifulsoup4': ['beautifulsoup4'],
      'from sklearn': ['scikit-learn'],
      'from pandas': ['pandas'],
      'from matplotlib': ['matplotlib'],
      'from scipy': ['scipy'],
      'from seaborn': ['seaborn'],
      'from plotly': ['plotly'],
      'import sympy': ['sympy'],
      'import statsmodels': ['statsmodels']
    };

    const currentPackages = installedPackages[blockId] || new Set();
    const packagesToInstall = new Set<string>();

    // 코드에서 import 구문 분석
    for (const [pattern, packages] of Object.entries(packageMap)) {
      if (code.includes(pattern)) {
        packages.forEach(pkg => {
          if (!currentPackages.has(pkg)) {
            packagesToInstall.add(pkg);
          }
        });
      }
    }

    // 새로운 패키지가 있으면 설치
    if (packagesToInstall.size > 0) {
      const packagesArray = Array.from(packagesToInstall);
      console.log(`Installing packages: ${packagesArray.join(', ')}`);
      
      try {
        await pyodide.loadPackage(packagesArray);
        
        // 설치된 패키지 목록 업데이트
        setInstalledPackages(prev => ({
          ...prev,
          [blockId]: new Set([...currentPackages, ...packagesToInstall])
        }));
      } catch (error) {
        console.warn(`Failed to install some packages: ${error}`);
        // 일부 패키지 설치에 실패해도 계속 진행
      }
    }
  };

  // 한글 폰트 및 matplotlib 설정 초기화
  const setupMatplotlib = async (pyodide: any): Promise<void> => {
    await pyodide.runPython(`
      import matplotlib
      import matplotlib.pyplot as plt
      import matplotlib.font_manager as fm
      import urllib.request
      import os
      
      # matplotlib 백엔드를 Agg로 설정 (이미지 생성용)
      matplotlib.use('Agg')
      
      # 한글 폰트 다운로드 및 설정
      def setup_korean_font():
          try:
              # Noto Sans CJK 폰트 URL (Google Fonts)
              font_url = "https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20HM.woff2"
              
              # 임시 폰트 파일 경로
              font_path = "/tmp/NotoSansKR.ttf"
              
              # 폰트가 이미 있는지 확인
              if not os.path.exists(font_path):
                  print("한글 폰트 다운로드 중...")
                  # 실제로는 웹 환경에서 폰트 다운로드가 제한적이므로
                  # 시스템에서 사용 가능한 폰트를 찾아 사용
                  pass
              
              # 사용 가능한 폰트 목록 확인
              available_fonts = [f.name for f in fm.fontManager.ttflist]
              print(f"사용 가능한 폰트 수: {len(available_fonts)}")
              
              # 한글 지원 가능한 폰트 우선순위
              korean_fonts = [
                  'Noto Sans CJK KR',
                  'Noto Sans KR', 
                  'Malgun Gothic',
                  'AppleGothic',
                  'Dotum',
                  'Gulim',
                  'UnDotum',
                  'Nanum Gothic',
                  'NanumBarunGothic',
                  'DejaVu Sans'
              ]
              
              # 실제 사용 가능한 한글 폰트 찾기
              selected_font = 'DejaVu Sans'  # 기본값
              for font in korean_fonts:
                  if font in available_fonts:
                      selected_font = font
                      print(f"한글 폰트 선택: {font}")
                      break
              
              return selected_font
              
          except Exception as e:
              print(f"한글 폰트 설정 중 오류: {e}")
              return 'DejaVu Sans'
      
      # 폰트 설정
      korean_font = setup_korean_font()
      
      # matplotlib 설정
      plt.rcParams['font.family'] = [korean_font, 'DejaVu Sans', 'Arial', 'sans-serif']
      plt.rcParams['font.size'] = 11
      plt.rcParams['axes.unicode_minus'] = False
      
      # 한글이 포함된 경우 특별 처리
      def set_korean_labels():
          # 축 레이블과 제목에서 한글 문제 해결을 위한 대안
          # 영어로 레이블을 설정하거나, 유니코드 이스케이프 사용
          pass
      
      # 그래프 해상도 설정
      plt.rcParams['figure.dpi'] = 100
      plt.rcParams['savefig.dpi'] = 150
      plt.rcParams['savefig.bbox'] = 'tight'
      plt.rcParams['savefig.facecolor'] = 'white'
      plt.rcParams['figure.figsize'] = (10, 6)
      
      # 컬러 설정
      plt.rcParams['axes.prop_cycle'] = plt.cycler('color', 
          ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
           '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'])
      
      # 경고 억제
      import warnings
      warnings.filterwarnings('ignore', category=UserWarning, module='matplotlib')
      
      print(f"Matplotlib 설정 완료 - 폰트: {korean_font}")
    `);
  };

  // Pyodide 로드 함수
  const loadPyodide = async (blockId: string) => {
    if (pyodideInstances[blockId]) {
      return pyodideInstances[blockId];
    }

    setPyodideLoading((prev) => ({ ...prev, [blockId]: true }));
    try {
      // Pyodide 스크립트 동적 로드
      if (!window.loadPyodide) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js";
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const pyodide = await window.loadPyodide();
      setPyodideInstances((prev) => ({ ...prev, [blockId]: pyodide }));
      setPyodideLoading((prev) => ({ ...prev, [blockId]: false }));
      return pyodide;
    } catch (err) {
      setPyodideLoading((prev) => ({ ...prev, [blockId]: false }));
      console.error("Pyodide 로드 실패:", err);
      throw err;
    }
  };

  // 파이썬 코드 실행 함수
  const runPythonCode = async (code: string, blockId: string): Promise<ExecutionResult> => {
    setPythonRunning((prev) => ({ ...prev, [blockId]: true }));

    try {
      const pyodide = await loadPyodide(blockId);

      // 필요한 패키지 자동 감지 및 설치
      await detectAndInstallPackages(code, pyodide, blockId);

      // matplotlib가 사용되는 경우 설정 초기화
      if (code.includes('matplotlib') || code.includes('plt.')) {
        await setupMatplotlib(pyodide);
      }

      // 출력 캡처 및 이미지 생성을 위한 환경 설정
      await pyodide.runPython(`
        import sys
        from io import StringIO, BytesIO
        import base64
        
        class CaptureOutput:
            def __init__(self):
                self.old_stdout = sys.stdout
                self.old_stderr = sys.stderr
                self.stdout = StringIO()
                self.stderr = StringIO()
                self.images = []
            
            def start(self):
                sys.stdout = self.stdout
                sys.stderr = self.stderr
            
            def end(self):
                sys.stdout = self.old_stdout
                sys.stderr = self.old_stderr
            
            def get_output(self):
                return self.stdout.getvalue() + self.stderr.getvalue()
            
            def capture_figure(self):
                try:
                    import matplotlib.pyplot as plt
                    if plt.get_fignums():  # 활성 figure가 있는지 확인
                        buf = BytesIO()
                        plt.savefig(buf, format='png', bbox_inches='tight', 
                                  facecolor='white', edgecolor='none', dpi=150)
                        buf.seek(0)
                        img_str = base64.b64encode(buf.read()).decode()
                        self.images.append(img_str)
                        plt.close('all')  # 모든 figure 닫기
                        buf.close()
                except Exception as e:
                    print(f"Figure capture error: {e}")
            
            def get_images(self):
                return self.images
        
        output_capturer = CaptureOutput()
      `);

      // 출력 캡처 시작
      pyodide.runPython("output_capturer.start()");

      // 코드 실행
      let result;
      let hasError = false;
      let errorMessage = "";
      
      try {
        result = pyodide.runPython(code);
        
        // matplotlib figure가 생성되었는지 확인하고 캡처
        pyodide.runPython("output_capturer.capture_figure()");
      } catch (err) {
        hasError = true;
        errorMessage = String(err);
      }

      // 출력 캡처 종료 및 결과 가져오기
      pyodide.runPython("output_capturer.end()");
      const output = pyodide.runPython("output_capturer.get_output()");
      const images = pyodide.runPython("output_capturer.get_images()").toJs();

      if (hasError) {
        setPythonRunning((prev) => ({ ...prev, [blockId]: false }));
        return {
          output: "",
          error: `${errorMessage}\n\n출력:\n${output}`
        };
      }

      // 결과 문자열 생성
      let resultStr = "";

      // 출력이 있으면 추가
      if (output && output.trim()) {
        resultStr += output;
      }

      // 반환값이 있고 undefined가 아니면 추가
      if (result !== undefined) {
        const resultValue =
          typeof result === "object"
            ? JSON.stringify(result, null, 2)
            : String(result);
        if (resultValue !== "undefined" && resultValue.trim()) {
          if (resultStr) resultStr += "\n\n반환값:\n";
          resultStr += resultValue;
        }
      }

      // 결과가 비어있으면 기본 메시지 설정
      if (!resultStr.trim() && images.length === 0) {
        resultStr = "(실행 완료, 출력 없음)";
      }

      setPythonRunning((prev) => ({ ...prev, [blockId]: false }));
      
      return {
        output: resultStr,
        images: images.length > 0 ? Array.from(images) : undefined
      };
    } catch (err) {
      setPythonRunning((prev) => ({ ...prev, [blockId]: false }));
      console.error("파이썬 코드 실행 실패:", err);
      return {
        output: "",
        error: String(err)
      };
    }
  };

  return {
    pyodideInstances,
    pyodideLoading,
    pythonRunning,
    loadPyodide,
    runPythonCode,
    installedPackages,
  };
}; 