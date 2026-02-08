import { toast } from "react-hot-toast";

// 에러 타입 정의
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  status?: number;
}

// 에러 코드별 사용자 친화적 메시지
const ERROR_MESSAGES: Record<string, string> = {
  // 네트워크 에러
  'NETWORK_ERROR': '네트워크 연결을 확인해주세요.',
  'TIMEOUT': '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  
  // 인증 에러
  'UNAUTHORIZED': '로그인이 필요합니다.',
  'FORBIDDEN': '접근 권한이 없습니다.',
  'TOKEN_EXPIRED': '로그인이 만료되었습니다. 다시 로그인해주세요.',
  
  // 서버 에러
  'INTERNAL_ERROR': '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  'SERVICE_UNAVAILABLE': '서비스가 일시적으로 이용 불가능합니다.',
  
  // 채팅 관련 에러
  'USAGE_LIMIT_EXCEEDED': '사용 한도를 초과했습니다. 플랜을 업그레이드하거나 다음 달을 기다려주세요.',
  'FILE_TOO_LARGE': '파일 크기가 너무 큽니다. 100MB 이하 파일을 업로드해주세요.',
  'INVALID_FILE_TYPE': '지원하지 않는 파일 형식입니다.',
  
  // 기본 에러
  'UNKNOWN_ERROR': '알 수 없는 오류가 발생했습니다.'
};

// HTTP 상태 코드를 에러 코드로 매핑
const mapStatusToErrorCode = (status: number): string => {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 408:
      return 'TIMEOUT';
    case 413:
      return 'FILE_TOO_LARGE';
    case 429:
      return 'USAGE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_ERROR';
    case 502:
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'UNKNOWN_ERROR';
  }
};

// Response에서 에러 정보 추출
export const extractApiError = async (response: Response): Promise<ApiError> => {
  let errorCode = mapStatusToErrorCode(response.status);
  let message = ERROR_MESSAGES[errorCode];
  let details: any = null;

  try {
    const data = await response.json();
    if (data.detail) {
      details = data.detail;
      // 서버에서 특정 에러 코드를 보냈다면 사용
      if (data.code && ERROR_MESSAGES[data.code]) {
        errorCode = data.code;
        message = ERROR_MESSAGES[data.code];
      }
    }
  } catch {
    // JSON 파싱 실패 시 기본 에러 사용
  }

  return {
    code: errorCode,
    message,
    details,
    status: response.status
  };
};

// 네트워크 에러 처리
export const handleNetworkError = (error: Error): ApiError => {
  if (error.name === 'AbortError') {
    return {
      code: 'TIMEOUT',
      message: ERROR_MESSAGES.TIMEOUT
    };
  }

  return {
    code: 'NETWORK_ERROR',
    message: ERROR_MESSAGES.NETWORK_ERROR,
    details: error.message
  };
};

// 에러 표시 (토스트)
export const showError = (error: ApiError, options?: { 
  duration?: number; 
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
}) => {
  toast.error(error.message, {
    duration: options?.duration || 4000,
    position: options?.position || 'top-center',
    style: {
      maxWidth: '500px'
    }
  });
};

// 표준화된 에러 핸들링 함수
export const handleApiError = async (
  error: unknown, 
  options?: { 
    showToast?: boolean; 
    customMessage?: string;
    onError?: (error: ApiError) => void;
  }
): Promise<ApiError> => {
  let apiError: ApiError;

  if (error instanceof Response) {
    // Fetch Response 에러
    apiError = await extractApiError(error);
  } else if (error instanceof Error) {
    // JavaScript 에러 (네트워크 등)
    apiError = handleNetworkError(error);
  } else {
    // 알 수 없는 에러
    apiError = {
      code: 'UNKNOWN_ERROR',
      message: options?.customMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
      details: error
    };
  }

  // 콜백 실행
  if (options?.onError) {
    options.onError(apiError);
  }

  // 토스트 표시 (기본값: true)
  if (options?.showToast !== false) {
    showError(apiError);
  }

  return apiError;
};

// 특정 에러 코드 확인
export const isErrorCode = (error: ApiError, code: string): boolean => {
  return error.code === code;
};

// 인증 관련 에러 확인
export const isAuthError = (error: ApiError): boolean => {
  return ['UNAUTHORIZED', 'FORBIDDEN', 'TOKEN_EXPIRED'].includes(error.code);
};

// 사용량 한도 에러 확인
export const isUsageLimitError = (error: ApiError): boolean => {
  return error.code === 'USAGE_LIMIT_EXCEEDED';
};