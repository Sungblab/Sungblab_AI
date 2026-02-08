/**
 * 초기 로딩 최적화 유틸리티
 */

interface LoadingCache {
  initialized: boolean;
  lastInitTime: number;
}

const CACHE_KEY = 'app_loading_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30분

export class LoadingOptimizer {
  /**
   * 앱이 최근에 초기화되었는지 확인
   */
  static isRecentlyInitialized(): boolean {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (!cache) return false;
      
      const { initialized, lastInitTime }: LoadingCache = JSON.parse(cache);
      const now = Date.now();
      
      // 30분 이내에 초기화되었으면 true
      return initialized && (now - lastInitTime) < CACHE_DURATION;
    } catch {
      return false;
    }
  }

  /**
   * 초기화 완료 표시
   */
  static markAsInitialized(): void {
    const cache: LoadingCache = {
      initialized: true,
      lastInitTime: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }

  /**
   * 초기화 캐시 클리어
   */
  static clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }

  /**
   * 프리페치 API 호출 (병렬 처리)
   */
  static async prefetchInitialData(token: string): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    
    // 중요한 API들을 병렬로 프리페치
    const prefetchPromises = [
      // 사용자 정보는 이미 로그인 시 가져옴
      // 채팅방 목록 프리페치
      fetch(`${apiUrl}/api/v1/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {}),
      
      // 프로젝트 목록 프리페치 (있다면)
      fetch(`${apiUrl}/api/v1/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    ];

    // 모든 프리페치 완료 대기 (실패해도 무시)
    await Promise.allSettled(prefetchPromises);
  }

  /**
   * 초기 로딩 시 페이지 새로고침 처리
   */
  static handleInitialLoad(): boolean {
    // URL에 refresh 파라미터가 있는지 확인
    const urlParams = new URLSearchParams(window.location.search);
    const hasRefreshed = urlParams.get('refreshed') === 'true';
    
    // 이미 새로고침했거나 최근에 초기화되었으면 스킵
    if (hasRefreshed || this.isRecentlyInitialized()) {
      // URL에서 refreshed 파라미터 제거
      if (hasRefreshed) {
        urlParams.delete('refreshed');
        const newUrl = urlParams.toString() 
          ? `${window.location.pathname}?${urlParams.toString()}` 
          : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      return false;
    }
    
    // 첫 로드인 경우 새로고침
    urlParams.set('refreshed', 'true');
    window.location.search = urlParams.toString();
    return true;
  }

  /**
   * 지연 로딩 처리
   */
  static async delayedLoad<T>(
    loader: () => Promise<T>, 
    delay: number = 100
  ): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, delay));
    return loader();
  }
}