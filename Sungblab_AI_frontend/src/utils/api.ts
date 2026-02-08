import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import TokenManager from "./tokenManager";

export const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    // 환경변수에 URL이 있으면 /api/v1을 추가
    return `${envUrl}/api/v1`;
  }
  
  // 자동 감지: 현재 사이트가 HTTPS면 백엔드도 HTTPS 사용
  const isHttps = window.location.protocol === 'https:';
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDev) {
    // 로컬 개발 환경
    return "http://localhost:8000/api/v1";
  } else if (isHttps) {
    // 프로덕션 HTTPS 환경
    return "https://port-0-sungblab-ai-backend-m688zlzleba4329a.sel4.cloudtype.app/api/v1";
  } else {
    // 프로덕션 HTTP 환경 (fallback)
    return "http://port-0-sungblab-ai-backend-m688zlzleba4329a.sel4.cloudtype.app/api/v1";
  }
};

// 요청 타임아웃 설정
const REQUEST_TIMEOUT = 120000; // 120초 (2분) - 파일 업로드를 위해 늘림

const handleError = async (response: Response) => {
  const data = await response.json();
  return new Error(data.detail || "요청 처리 중 오류가 발생했습니다.");
};

export const useApi = () => {
  const auth = useAuth();
  const { logout, isLoading } = auth;
  const tokenManager = TokenManager.getInstance();

  const fetchWithAuth = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    // 인증 초기화 대기 최적화 (최대 3초)
    if (isLoading) {
      const maxWaitTime = 3000; // 3초 최대 대기
      const startTime = Date.now();
      
      await new Promise((resolve) => {
        const checkLoading = () => {
          if (!isLoading || Date.now() - startTime > maxWaitTime) {
            resolve(true);
          } else {
            setTimeout(checkLoading, 50); // 50ms마다 체크
          }
        };
        checkLoading();
      });
    }

    // TokenManager를 통해 유효한 토큰 획득
    const validToken = await tokenManager.getValidAccessToken();
    
    if (!validToken) {
      console.log("No valid token available, redirecting to login...");
      logout();
      throw new Error("인증이 필요합니다.");
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const headers = {
      ...(!(options.body instanceof FormData) && {
        "Content-Type": "application/json",
      }),
      Authorization: `Bearer ${validToken}`,
      ...options.headers,
    };

    // AbortController로 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          console.log("Authentication failed, attempting token refresh...");
          
          // 토큰 새로고침 시도
          const refreshSuccess = await tokenManager.refreshToken();
          if (refreshSuccess) {
            // 새로고침 성공시 원래 요청 재시도
            const newToken = await tokenManager.getValidAccessToken();
            if (newToken) {
              const retryResponse = await fetch(url, {
                ...options,
                headers: {
                  ...(!(options.body instanceof FormData) && {
                    "Content-Type": "application/json",
                  }),
                  Authorization: `Bearer ${newToken}`,
                  ...options.headers,
                },
              });
              
              if (retryResponse.ok) {
                return retryResponse;
              }
            }
          }
          
          // 새로고침 실패 또는 재시도 실패시 로그아웃
          console.log("Token refresh failed, logging out...");
          logout();
        }
        
        const errorText = await response.text();
        console.log("Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다.');
      }
      throw error;
    }
  };

  return { fetchWithAuth };
};

// Axios 인스턴스 생성 및 최적화
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인증 관련 API 함수들
export const auth = {
  signup: async (data: {
    email: string;
    full_name: string;
    password: string;
  }) => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  login: async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    const response = await apiClient.post('/auth/login-json', {
      email,
      password,
      remember_me: rememberMe,
    });
    return response.data;
  },

  getCurrentUser: async (token: string) => {
    const response = await apiClient.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  findId: async (full_name: string) => {
    const response = await apiClient.post('/auth/find-id', { full_name });
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await apiClient.post('/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token: string, new_password: string) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      new_password,
    });
    return response.data;
  },

  googleLogin: async (accessToken: string) => {
    const response = await apiClient.post('/auth/social/google', {
      provider: "GOOGLE",
      access_token: accessToken,
    });
    return response.data;
  },

  sendVerificationEmail: async (email: string) => {
    const response = await apiClient.post('/auth/send-verification', { email });
    return response.data;
  },

  verifyEmail: async (email: string, code: string) => {
    const response = await apiClient.post('/auth/verify-email', {
      email,
      verification_code: code,
    });
    return response.data;
  },
};
