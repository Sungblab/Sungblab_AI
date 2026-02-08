/**
 * 향상된 세션 관리 시스템
 */

interface SessionData {
  userId: number;
  loginTime: number;
  lastActivity: number;
  deviceId: string;
  sessionId: string;
}

interface SecurityConfig {
  maxInactiveTime: number; // 최대 비활성 시간 (ms)
  maxSessionTime: number;  // 최대 세션 시간 (ms)
  activityCheckInterval: number; // 활동 체크 간격 (ms)
}

class SessionManager {
  private static instance: SessionManager;
  private sessionData: SessionData | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private config: SecurityConfig;
  private readonly SESSION_KEY = 'session_data';

  constructor() {
    this.config = {
      maxInactiveTime: 30 * 60 * 1000, // 30분
      maxSessionTime: 12 * 60 * 60 * 1000, // 12시간
      activityCheckInterval: 5 * 60 * 1000 // 5분마다 체크
    };
  }

  static getInstance(): SessionManager {
    if (!this.instance) {
      this.instance = new SessionManager();
    }
    return this.instance;
  }

  /**
   * 세션 시작
   */
  startSession(userId: number): void {
    const now = Date.now();
    const deviceId = this.getOrCreateDeviceId();
    
    this.sessionData = {
      userId,
      loginTime: now,
      lastActivity: now,
      deviceId,
      sessionId: this.generateSessionId()
    };

    this.saveSession();
    this.startActivityMonitoring();
    this.setupActivityListeners();
  }

  /**
   * 세션 종료
   */
  endSession(): void {
    this.sessionData = null;
    localStorage.removeItem(this.SESSION_KEY);
    this.stopActivityMonitoring();
    this.removeActivityListeners();
  }

  /**
   * 세션 유효성 검사
   */
  isSessionValid(): boolean {
    if (!this.sessionData) {
      this.loadSession();
    }

    if (!this.sessionData) return false;

    const now = Date.now();
    const { lastActivity, loginTime } = this.sessionData;

    // 최대 비활성 시간 초과 체크
    if (now - lastActivity > this.config.maxInactiveTime) {
      console.log('세션 만료: 비활성 시간 초과');
      this.endSession();
      return false;
    }

    // 최대 세션 시간 초과 체크
    if (now - loginTime > this.config.maxSessionTime) {
      console.log('세션 만료: 최대 세션 시간 초과');
      this.endSession();
      return false;
    }

    return true;
  }

  /**
   * 활동 업데이트
   */
  updateActivity(): void {
    if (!this.sessionData) return;

    this.sessionData.lastActivity = Date.now();
    this.saveSession();
  }

  /**
   * 세션 정보 조회
   */
  getSessionInfo(): SessionData | null {
    if (this.isSessionValid()) {
      return this.sessionData;
    }
    return null;
  }

  /**
   * 디바이스 ID 생성 또는 조회
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * 디바이스 ID 생성
   */
  private generateDeviceId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    const userAgent = navigator.userAgent;
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    
    return btoa(`${timestamp}-${random}-${userAgent}-${screenInfo}`).substr(0, 32);
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  /**
   * 세션 저장
   */
  private saveSession(): void {
    if (this.sessionData) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.sessionData));
    }
  }

  /**
   * 세션 로드
   */
  private loadSession(): void {
    const stored = localStorage.getItem(this.SESSION_KEY);
    if (stored) {
      try {
        this.sessionData = JSON.parse(stored);
      } catch {
        localStorage.removeItem(this.SESSION_KEY);
      }
    }
  }

  /**
   * 활동 모니터링 시작
   */
  private startActivityMonitoring(): void {
    this.stopActivityMonitoring(); // 기존 타이머 정리

    this.activityTimer = setInterval(() => {
      if (!this.isSessionValid()) {
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      }
    }, this.config.activityCheckInterval);
  }

  /**
   * 활동 모니터링 중지
   */
  private stopActivityMonitoring(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * 사용자 활동 리스너 설정
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, { passive: true });
    });

    // 페이지 포커스/블러 처리
    window.addEventListener('focus', this.handlePageFocus);
    window.addEventListener('blur', this.handlePageBlur);
  }

  /**
   * 사용자 활동 리스너 제거
   */
  private removeActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity);
    });

    window.removeEventListener('focus', this.handlePageFocus);
    window.removeEventListener('blur', this.handlePageBlur);
  }

  /**
   * 사용자 활동 처리
   */
  private handleUserActivity = (): void => {
    this.updateActivity();
  };

  /**
   * 페이지 포커스 처리
   */
  private handlePageFocus = (): void => {
    if (!this.isSessionValid()) {
      window.dispatchEvent(new CustomEvent('sessionExpired'));
    } else {
      this.updateActivity();
    }
  };

  /**
   * 페이지 블러 처리
   */
  private handlePageBlur = (): void => {
    this.updateActivity();
  };

  /**
   * 보안 설정 업데이트
   */
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 활동 모니터링 재시작
    if (this.sessionData) {
      this.startActivityMonitoring();
    }
  }

  /**
   * 세션 연장 (remember me 기능용)
   */
  extendSession(): void {
    if (this.sessionData) {
      // 최대 세션 시간을 30일로 확장
      this.config.maxSessionTime = 30 * 24 * 60 * 60 * 1000; // 30일
      this.config.maxInactiveTime = 7 * 24 * 60 * 60 * 1000; // 7일 비활성
      this.updateActivity();
    }
  }

  /**
   * 다중 탭 세션 동기화
   */
  syncWithOtherTabs(): void {
    // 다른 탭에서 세션이 종료되었을 때 현재 탭도 동기화
    window.addEventListener('storage', (event) => {
      if (event.key === this.SESSION_KEY) {
        if (!event.newValue) {
          // 다른 탭에서 세션이 종료됨
          this.endSession();
          window.dispatchEvent(new CustomEvent('sessionExpired'));
        } else {
          // 다른 탭에서 세션이 업데이트됨
          this.loadSession();
        }
      }
    });
  }

  /**
   * 보안 위험 감지
   */
  detectSecurityRisk(): boolean {
    if (!this.sessionData) return false;

    const currentDeviceId = this.getOrCreateDeviceId();
    
    // 디바이스 ID 변경 감지
    if (this.sessionData.deviceId !== currentDeviceId) {
      console.warn('보안 위험 감지: 디바이스 ID 불일치');
      return true;
    }

    return false;
  }
}

export default SessionManager;