import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth } from "../utils/api";
import { LoadingOptimizer } from "../utils/loadingOptimizer";
import TokenManager from "../utils/tokenManager";

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  auth_provider: string;
  profile_image?: string;
}

// TokenData는 이제 TokenManager에서 관리

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, userData: User, expiresIn: number) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const tokenManager = TokenManager.getInstance();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    return await tokenManager.refreshToken();
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authResult = await tokenManager.initializeAuth();
        
        if (!authResult.isAuthenticated || !authResult.accessToken) {
          setIsLoading(false);
          return;
        }

        // 사용자 정보 가져오기
        try {
          const userData = await auth.getCurrentUser(authResult.accessToken);
          if (userData) {
            setToken(authResult.accessToken);
            setUser(userData);
            setIsAuthenticated(true);
            
            // 백그라운드에서 프리페치
            LoadingOptimizer.prefetchInitialData(authResult.accessToken).then(() => {
              LoadingOptimizer.markAsInitialized();
            });
          } else {
            handleAuthFailure();
          }
        } catch (error) {
          console.error("사용자 정보 조회 실패:", error);
          handleAuthFailure();
        }
      } catch (error) {
        console.error("인증 초기화 실패:", error);
        handleAuthFailure();
      } finally {
        setIsLoading(false);
      }
    };

    const handleAuthFailure = () => {
      console.log("인증 실패, 로그아웃 처리");
      tokenManager.clearTokens();
      LoadingOptimizer.clearCache();
      setToken(null);
      setUser(null);  
      setIsAuthenticated(false);
    };

    initializeAuth();

    // 토큰 갱신 성공 이벤트 리스너
    const handleTokenRefreshed = (event: CustomEvent) => {
      setToken(event.detail.accessToken);
      console.log('토큰이 자동 갱신되었습니다.');
    };

    // 토큰 갱신 실패 이벤트 리스너
    const handleTokenRefreshFailed = () => {
      console.log('토큰 갱신 실패, 로그아웃 처리');
      handleAuthFailure();
    };

    // 이벤트 리스너 등록
    window.addEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
    window.addEventListener('tokenRefreshFailed', handleTokenRefreshFailed);

    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
      window.removeEventListener('tokenRefreshFailed', handleTokenRefreshFailed);
    };
  }, []);

  const login = useCallback(async (accessToken: string, refreshToken: string, userData: User, expiresIn: number) => {
    // TokenManager를 통해 토큰 저장 및 자동 갱신 스케줄링
    tokenManager.setTokens(accessToken, refreshToken, expiresIn);
    
    setToken(accessToken);
    setUser(userData);
    
    // 백그라운드에서 초기 데이터 프리페치
    LoadingOptimizer.prefetchInitialData(accessToken).then(() => {
      LoadingOptimizer.markAsInitialized();
    });
    
    // 사용자 정보 안정화를 위해 약간의 지연 후 인증 상태 설정
    setTimeout(() => {
      setIsAuthenticated(true);
    }, 50);
  }, []);

  const logout = useCallback(() => {
    tokenManager.clearTokens();
    LoadingOptimizer.clearCache(); 
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, isLoading, isAuthenticated, login, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
