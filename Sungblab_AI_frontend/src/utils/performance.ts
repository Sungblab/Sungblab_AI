// 성능 최적화 유틸리티들

// 1. 디바운싱
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 2. 쓰로틀링
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  return (...args: Parameters<T>) => {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// 3. 메모이제이션
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    // 캐시 크기 제한 (메모리 누수 방지)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

// 4. 가상 스크롤링을 위한 유틸리티
export class VirtualScrollManager {
  private itemHeight: number;
  private containerHeight: number;
  private scrollTop = 0;
  
  constructor(itemHeight: number, containerHeight: number) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
  }
  
  getVisibleRange(totalItems: number): { start: number; end: number } {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const start = Math.floor(this.scrollTop / this.itemHeight);
    const end = Math.min(start + visibleCount + 2, totalItems); // 2개 버퍼
    
    return { start: Math.max(0, start - 2), end }; // 위쪽에도 2개 버퍼
  }
  
  updateScrollTop(scrollTop: number) {
    this.scrollTop = scrollTop;
  }
  
  getTotalHeight(totalItems: number): number {
    return totalItems * this.itemHeight;
  }
  
  getOffsetY(start: number): number {
    return start * this.itemHeight;
  }
}

// 5. 이미지 지연 로딩
export class LazyImageLoader {
  private observer: IntersectionObserver;
  
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.onload = () => {
                img.classList.add('loaded');
              };
              img.onerror = () => {
                img.classList.add('error');
              };
              
              this.observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
  }
  
  observe(img: HTMLImageElement) {
    this.observer.observe(img);
  }
  
  disconnect() {
    this.observer.disconnect();
  }
}

// 6. 번들 크기 최적화를 위한 동적 import
export const loadComponent = (componentPath: string) => {
  return import(componentPath);
};

// 7. 로컬 스토리지 최적화
export class OptimizedStorage {
  private static readonly COMPRESSION_THRESHOLD = 1024; // 1KB
  
  static setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      
      // 데이터가 큰 경우 압축 (실제로는 LZ-string 같은 라이브러리 사용)
      if (serialized.length > this.COMPRESSION_THRESHOLD) {
        console.log(`Large data stored: ${key} (${serialized.length} chars)`);
      }
      
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Storage error:', error);
      // 용량 초과 시 오래된 데이터 정리
      this.cleanup();
    }
  }
  
  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage parse error:', error);
      localStorage.removeItem(key);
      return null;
    }
  }
  
  static cleanup(): void {
    // 임시 데이터나 오래된 캐시 정리
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('temp_') || key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// 8. API 요청 최적화
export class RequestOptimizer {
  private static pendingRequests = new Map<string, Promise<any>>();
  
  // 중복 요청 방지
  static async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }
    
    const promise = requestFn();
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
  
  // 배치 요청
  static createBatcher<T, R>(
    batchFn: (items: T[]) => Promise<R[]>,
    delay: number = 10
  ) {
    let batch: { item: T; resolve: (value: R) => void; reject: (error: any) => void }[] = [];
    let timeout: NodeJS.Timeout;
    
    return (item: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        batch.push({ item, resolve, reject });
        
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          const currentBatch = batch;
          batch = [];
          
          try {
            const items = currentBatch.map(b => b.item);
            const results = await batchFn(items);
            
            currentBatch.forEach((b, index) => {
              b.resolve(results[index]);
            });
          } catch (error) {
            currentBatch.forEach(b => b.reject(error));
          }
        }, delay);
      });
    };
  }
}

// 9. 성능 모니터링
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  
  static startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      const durations = this.metrics.get(label)!;
      durations.push(duration);
      
      // 최근 100개만 유지
      if (durations.length > 100) {
        durations.shift();
      }
      
      // 평균이 임계값을 넘으면 경고
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (avg > 1000) { // 1초
        console.warn(`Performance warning: ${label} average: ${avg.toFixed(2)}ms`);
      }
    };
  }
  
  static getMetrics(label: string) {
    const durations = this.metrics.get(label) || [];
    if (durations.length === 0) return null;
    
    const sorted = [...durations].sort((a, b) => a - b);
    return {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      count: durations.length
    };
  }
}

// 10. 메모리 사용량 모니터링
export class MemoryMonitor {
  static checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1048576; // MB
      const total = memory.totalJSHeapSize / 1048576; // MB
      
      if (used > 100) { // 100MB 이상
        console.warn(`High memory usage: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`);
      }
    }
  }
  
  static startMonitoring(interval: number = 30000): () => void {
    const intervalId = setInterval(this.checkMemoryUsage, interval);
    return () => clearInterval(intervalId);
  }
} 