import { useState, useCallback, useRef, useEffect } from 'react';

// Pyodide 타입 정의
interface PyodideInterface {
  loadPackage: (packages: string | string[]) => Promise<void>;
  runPython: (code: string) => any;
  runPythonAsync: (code: string) => Promise<any>;
  globals: any;
  FS: any;
  _module: any;
  loadPackagesFromImports: (code: string) => Promise<void>;
}

// 전역 Pyodide 인스턴스와 초기화 상태를 관리
let globalPyodide: PyodideInterface | null = null;
let initializationPromise: Promise<PyodideInterface> | null = null;
let isInitializing = false;

declare global {
  interface Window {
    loadPyodide: (config?: {
      indexURL?: string;
      stdout?: (text: string) => void;
      stderr?: (text: string) => void;
    }) => Promise<PyodideInterface>;
  }
}

// matplotlib 백엔드 설정 코드
const MATPLOTLIB_BACKEND_SETUP = `
import sys
import io
import base64
from contextlib import redirect_stdout, redirect_stderr

# matplotlib 백엔드 설정
try:
    import matplotlib
    # 백엔드를 먼저 설정
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    
    # 기존 show 함수 저장
    _original_show = plt.show
    
    print("matplotlib 백엔드가 Agg로 설정되었습니다.")
except ImportError:
    print("matplotlib가 설치되지 않았습니다.")

# 전역 이미지 리스트
_pyodide_images = []

def show(*args, **kwargs):
    """matplotlib의 plt.show()를 오버라이드하여 이미지를 Base64로 저장"""
    import matplotlib.pyplot as plt
    import io
    import base64
    
    # 현재 figure 가져오기
    fig = plt.gcf()
    
    # 이미지를 메모리에 저장
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    _pyodide_images.append(img_base64)
    
    # figure 정리
    plt.close(fig)
    
    # DOM 요소 제거 (혹시 생성되었을 경우)
    try:
        import js
        # 기존 matplotlib div 요소들 제거
        js.document.querySelectorAll('.matplotlib-figure').forEach(lambda el: el.remove())
        js.document.querySelectorAll('[id^="matplotlib-"]').forEach(lambda el: el.remove())
        js.document.querySelectorAll('div[style*="matplotlib"]').forEach(lambda el: el.remove())
    except:
        pass

# plt.show를 커스텀 show 함수로 오버라이드
try:
    import matplotlib.pyplot as plt
    plt.show = show
    
    # 추가 backend 설정
    import matplotlib
    matplotlib.pyplot.switch_backend('Agg')
    
    # GUI 관련 설정 비활성화
    matplotlib.rcParams['figure.max_open_warning'] = 0
    matplotlib.rcParams['backend'] = 'Agg'
    
except Exception as e:
    print(f"matplotlib 설정 중 오류: {e}")
`;

// 패키지 설치 캐시
const installedPackages = new Set<string>();

export const usePyodideCanvas = () => {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(globalPyodide);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(!!globalPyodide);
  const [running, setRunning] = useState(false);

  // Pyodide 초기화 (싱글톤 패턴)
  const initPyodide = useCallback(async (): Promise<PyodideInterface> => {
    // 이미 초기화된 경우
    if (globalPyodide) {
      setPyodide(globalPyodide);
      setInitialized(true);
      return globalPyodide;
    }

    // 초기화 중인 경우 기다림
    if (initializationPromise) {
      try {
        const pyodideInstance = await initializationPromise;
        setPyodide(pyodideInstance);
        setInitialized(true);
        return pyodideInstance;
      } catch (err) {
        throw err;
      }
    }

    // 새로 초기화
    if (!isInitializing) {
      isInitializing = true;
      setLoading(true);
      setError(null);

      initializationPromise = new Promise<PyodideInterface>(async (resolve, reject) => {
        try {
          // Pyodide 스크립트 동적 로드
          if (!window.loadPyodide) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
            script.async = true;
            
            await new Promise<void>((resolveScript, rejectScript) => {
              script.onload = () => resolveScript();
              script.onerror = () => rejectScript(new Error('Pyodide 스크립트 로드 실패'));
              document.head.appendChild(script);
            });
          }

          // Pyodide 초기화
          const pyodideInstance = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
            stdout: (text: string) => {}, // stdout 무시
            stderr: (text: string) => {}, // stderr 무시
          });

          // matplotlib 백엔드 설정
          await pyodideInstance.runPythonAsync(MATPLOTLIB_BACKEND_SETUP);

          globalPyodide = pyodideInstance;
          setPyodide(pyodideInstance);
          setInitialized(true);
          setLoading(false);
          isInitializing = false;
          
          resolve(pyodideInstance);
        } catch (err) {
          console.error('Pyodide 초기화 실패:', err);
          setError(err instanceof Error ? err.message : '알 수 없는 오류');
          setLoading(false);
          isInitializing = false;
          initializationPromise = null;
          reject(err);
        }
      });

      return initializationPromise;
    }

    // 초기화 중인 경우 기다림
    if (initializationPromise) {
      return initializationPromise;
    }

    throw new Error('Pyodide 초기화 상태 오류');
  }, []);

  // 패키지 설치
  const installPackages = useCallback(async (packages: string[]): Promise<void> => {
    if (!globalPyodide) {
      throw new Error('Pyodide가 초기화되지 않았습니다.');
    }

    // 이미 설치된 패키지 필터링
    const packagesToInstall = packages.filter(pkg => !installedPackages.has(pkg));
    
    if (packagesToInstall.length === 0) {
      return;
    }

    try {
      await globalPyodide.loadPackage(packagesToInstall);
      
      // 설치된 패키지 캐시에 추가
      packagesToInstall.forEach(pkg => installedPackages.add(pkg));
    } catch (err) {
      console.error('패키지 설치 실패:', err);
      throw err;
    }
  }, []);

  // DOM 감시 및 matplotlib 요소 제거 함수
  const startMatplotlibObserver = useCallback(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // matplotlib 관련 요소 감지 및 제거
            if (
              element.classList?.contains('matplotlib-figure') ||
              element.id?.startsWith('matplotlib-') ||
              element.id?.startsWith('figure-') ||
              element.tagName === 'CANVAS' ||
              (element.style?.position === 'absolute' && 
               (element.style?.zIndex === '1000' || element.style?.zIndex === '1001'))
            ) {
              element.remove();
            }
            
            // 자식 요소들도 확인
            const matplotlibChildren = element.querySelectorAll?.(
              '.matplotlib-figure, [id^="matplotlib-"], [id^="figure-"], canvas'
            );
            matplotlibChildren?.forEach((child) => {
              child.remove();
            });
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return observer;
  }, []);

  // Python 코드 실행
  const runPython = useCallback(async (code: string) => {
    if (!initialized || !globalPyodide) {
      // 초기화되지 않은 경우 자동 초기화
      try {
        await initPyodide();
      } catch (err) {
        throw new Error('Pyodide 초기화 실패: ' + err);
      }
    }

    if (!globalPyodide) {
      throw new Error('Pyodide를 사용할 수 없습니다.');
    }

    setRunning(true);
    setError(null);

    // DOM 감시 시작
    const observer = startMatplotlibObserver();

    try {
      // import 문 파싱하여 필요한 패키지 자동 설치
      const imports = code.match(/(?:from\s+(\S+)|import\s+(\S+))/g);
      if (imports) {
        const packageNames = new Set<string>();
        imports.forEach(imp => {
          const match = imp.match(/(?:from\s+(\S+)|import\s+(\S+))/);
          if (match) {
            const pkgName = (match[1] || match[2]).split('.')[0];
            // 표준 라이브러리가 아닌 패키지만 추가
            if (!['sys', 'io', 'os', 'math', 'random', 'json', 'time', 'datetime', 'collections', 'itertools', 'functools', 're', 'string'].includes(pkgName)) {
              packageNames.add(pkgName);
            }
          }
        });

        if (packageNames.size > 0) {
          await installPackages(Array.from(packageNames));
        }
      }

      // 이미지 리스트 초기화
      await globalPyodide.runPythonAsync('_pyodide_images = []');

      // matplotlib 백엔드 강제 설정 및 stdout/stderr 캡처 설정
      const setupCode = `
import sys
import io

# matplotlib 백엔드 강제 재설정
try:
    import matplotlib
    import matplotlib.pyplot as plt
    
    # 백엔드를 Agg로 강제 설정
    matplotlib.use('Agg', force=True)
    matplotlib.pyplot.switch_backend('Agg')
    
    # 모든 figure를 닫고 정리
    plt.close('all')
    
    # GUI 관련 설정 완전 비활성화
    matplotlib.rcParams['backend'] = 'Agg'
    matplotlib.rcParams['figure.max_open_warning'] = 0
    matplotlib.rcParams['interactive'] = False
    
    # show 함수 재정의 확인
    if not hasattr(plt.show, '_pyodide_override'):
        def show(*args, **kwargs):
            import io
            import base64
            fig = plt.gcf()
            buf = io.BytesIO()
            fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            _pyodide_images.append(img_base64)
            plt.close(fig)
        
        plt.show = show
        plt.show._pyodide_override = True
    
    print("matplotlib 백엔드 재설정 완료")
except Exception as e:
    print(f"matplotlib 설정 오류: {e}")

_stdout = io.StringIO()
_stderr = io.StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
      `;
      await globalPyodide.runPythonAsync(setupCode);

      // 사용자 코드 실행
      await globalPyodide.runPythonAsync(code);

      // 출력 가져오기
      const output = await globalPyodide.runPythonAsync(`
_output = _stdout.getvalue()
_error = _stderr.getvalue()
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
(_output, _error, _pyodide_images)
      `);

      const [stdout, stderr, images] = output.toJs();

      // DOM에서 matplotlib 관련 요소 제거
      try {
        // matplotlib가 생성한 가능한 DOM 요소들 제거
        const elementsToRemove = [
          '.matplotlib-figure',
          '[id^="matplotlib-"]',
          '[id^="figure-"]',
          'div[style*="matplotlib"]',
          'canvas[style*="matplotlib"]',
          '.js-plotly-plot',
          '[id^="plotly-"]'
        ];
        
        elementsToRemove.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            el.remove();
          });
        });
        
        // body 끝에 추가된 요소들도 확인
        const bodyChildren = document.body.children;
        for (let i = bodyChildren.length - 1; i >= 0; i--) {
          const child = bodyChildren[i] as HTMLElement;
          if (child.style.position === 'absolute' && 
              (child.style.zIndex === '1000' || child.style.zIndex === '1001')) {
            child.remove();
          }
        }
             } catch (cleanupError) {
         console.warn('DOM 정리 중 오류:', cleanupError);
       }

      // DOM 감시 종료
      observer.disconnect();
      
      // 최종 정리 (추가 시간 대기)
      setTimeout(() => {
        try {
          const finalCleanup = document.querySelectorAll([
            '.matplotlib-figure',
            '[id^="matplotlib-"]',
            '[id^="figure-"]',
            'canvas:not([data-keep])',
            'div[style*="position: absolute"][style*="z-index"]'
          ].join(', '));
          
          finalCleanup.forEach(el => {
            el.remove();
          });
        } catch (e) {
          console.warn('최종 정리 중 오류:', e);
        }
      }, 500);

      setRunning(false);
      
      return {
        output: stdout || stderr || '',
        images: images as string[],
        error: stderr ? stderr : undefined
      };
    } catch (err) {
      // 오류 발생 시에도 DOM 감시 종료
      observer.disconnect();
      
      setRunning(false);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return {
        output: '',
        error: errorMessage
      };
    }
  }, [initialized, initPyodide, installPackages, startMatplotlibObserver]);

  // 초기화 리셋
  const reset = useCallback(() => {
    if (globalPyodide) {
      // Python 환경 초기화 (전역 변수 초기화)
      try {
        globalPyodide.runPython(`
import sys
# 사용자 정의 모듈 제거
for module in list(sys.modules.keys()):
    if not module.startswith(('_', 'pyodide')):
        del sys.modules[module]
        `);
      } catch (err) {
        console.error('Python 환경 초기화 오류:', err);
      }
    }
    setError(null);
  }, []);

  // 컴포넌트 마운트 시 전역 Pyodide가 있으면 사용
  useEffect(() => {
    if (globalPyodide && !pyodide) {
      setPyodide(globalPyodide);
      setInitialized(true);
    }
  }, [pyodide]);

  return {
    pyodide,
    loading,
    error,
    initialized,
    running,
    initPyodide,
    runPython,
    installPackages,
    reset
  };
}; 