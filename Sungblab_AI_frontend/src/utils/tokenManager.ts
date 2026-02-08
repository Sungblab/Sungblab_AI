/**
 * 토큰 관리 및 자동 갱신 시스템
 */

interface TokenData {
  access_token: string;
  refresh_token: string;
  expiresAt: number;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly TOKEN_KEY = 'token_data';
  private readonly REFRESH_THRESHOLD = 10 * 60 * 1000; // 10분 전에 갱신

  static getInstance(): TokenManager {
    if (!this.instance) {
      this.instance = new TokenManager();
    }
    return this.instance;
  }

  /**
   * 토큰 저장
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const tokenData: TokenData = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiresAt: Date.now() + (expiresIn * 1000)
    };

    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
    this.scheduleTokenRefresh(expiresIn * 1000);
  }

  /**
   * 토큰 조회
   */
  getTokens(): TokenData | null {
    const stored = localStorage.getItem(this.TOKEN_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      this.clearTokens();
      return null;
    }
  }

  /**
   * 토큰 삭제
   */
  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * 토큰 만료 확인
   */
  isTokenExpired(tokenData: TokenData = this.getTokens()): boolean {
    if (!tokenData) return true;
    return Date.now() >= tokenData.expiresAt;
  }

  /**
   * 토큰 갱신 필요 여부 확인
   */
  shouldRefreshToken(tokenData: TokenData = this.getTokens()): boolean {
    if (!tokenData) return false;
    return Date.now() >= (tokenData.expiresAt - this.REFRESH_THRESHOLD);
  }

  /**
   * 자동 토큰 갱신 스케줄링
   */
  private scheduleTokenRefresh(expiresInMs: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // 만료 10분 전에 갱신
    const refreshTime = Math.max(expiresInMs - this.REFRESH_THRESHOLD, 60000); // 최소 1분
    
    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('자동 토큰 갱신 실패:', error);
        // 실패 시 사용자에게 재로그인 요청
        window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
      }
    }, refreshTime);
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(): Promise<boolean> {
    // 이미 갱신 중이면 기존 프로미스 반환
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * 실제 토큰 갱신 수행
   */
  private async performTokenRefresh(): Promise<boolean> {
    const tokenData = this.getTokens();
    if (!tokenData?.refresh_token) {
      return false;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: tokenData.refresh_token
        })
      });

      if (!response.ok) {
        throw new Error(`토큰 갱신 실패: ${response.status}`);
      }

      const data: RefreshResponse = await response.json();
      
      // 새 토큰 저장 및 스케줄링
      this.setTokens(data.access_token, data.refresh_token, data.expires_in);
      
      // 갱신 성공 이벤트 발송
      window.dispatchEvent(new CustomEvent('tokenRefreshed', {
        detail: { accessToken: data.access_token }
      }));

      return true;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      return false;
    }
  }

  /**
   * API 요청 시 유효한 토큰 보장
   */
  async getValidAccessToken(): Promise<string | null> {
    const tokenData = this.getTokens();
    if (!tokenData) return null;

    // 토큰이 만료되었으면
    if (this.isTokenExpired(tokenData)) {
      const refreshed = await this.refreshToken();
      if (!refreshed) return null;
      
      const newTokenData = this.getTokens();
      return newTokenData?.access_token || null;
    }

    // 곧 만료될 예정이면 백그라운드에서 갱신
    if (this.shouldRefreshToken(tokenData)) {
      // 비동기로 갱신 (응답을 기다리지 않음)
      this.refreshToken().catch(console.error);
    }

    return tokenData.access_token;
  }

  /**
   * 로그인 유지 체크 (페이지 로드 시)
   */
  async initializeAuth(): Promise<{
    isAuthenticated: boolean;
    accessToken: string | null;
    needsRefresh: boolean;
  }> {
    const tokenData = this.getTokens();
    
    if (!tokenData) {
      return { isAuthenticated: false, accessToken: null, needsRefresh: false };
    }

    // 토큰이 완전히 만료된 경우
    if (this.isTokenExpired(tokenData)) {
      const refreshSuccess = await this.refreshToken();
      if (refreshSuccess) {
        const newTokenData = this.getTokens();
        return {
          isAuthenticated: true,
          accessToken: newTokenData?.access_token || null,
          needsRefresh: false
        };
      } else {
        this.clearTokens();
        return { isAuthenticated: false, accessToken: null, needsRefresh: false };
      }
    }

    // 토큰이 유효한 경우
    const needsRefresh = this.shouldRefreshToken(tokenData);
    if (needsRefresh) {
      // 백그라운드에서 갱신
      this.refreshToken().catch(console.error);
    }

    return {
      isAuthenticated: true,
      accessToken: tokenData.access_token,
      needsRefresh
    };
  }

  /**
   * 네트워크 재연결 시 토큰 상태 복구
   */
  async handleNetworkReconnect(): Promise<void> {
    const tokenData = this.getTokens();
    if (!tokenData) return;

    // 네트워크 재연결 시 토큰 갱신 재시도
    if (this.shouldRefreshToken(tokenData) || this.isTokenExpired(tokenData)) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('네트워크 재연결 후 토큰 갱신 실패:', error);
      }
    }
  }
}

// 네트워크 상태 모니터링
if (typeof window !== 'undefined') {
  const tokenManager = TokenManager.getInstance();
  
  window.addEventListener('online', () => {
    tokenManager.handleNetworkReconnect();
  });

  // 페이지 포커스 시 토큰 상태 확인
  window.addEventListener('focus', () => {
    const tokenData = tokenManager.getTokens();
    if (tokenData && tokenManager.shouldRefreshToken(tokenData)) {
      tokenManager.refreshToken().catch(console.error);
    }
  });
}

export default TokenManager;