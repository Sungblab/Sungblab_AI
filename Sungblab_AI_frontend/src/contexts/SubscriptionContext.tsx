import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useApi } from '../utils/api';

// 구독 정보 타입 정의
interface SubscriptionInfo {
  plan: "FREE" | "BASIC" | "PREMIUM";
  status: "active" | "cancelled" | "expired";
  group_usage: {
    basic_chat: number;
    normal_analysis: number;
    advanced_analysis: number;
  };
  group_limits: {
    basic_chat: number;
    normal_analysis: number;
    advanced_analysis: number;
  };
  remaining_usage: {
    basic_chat: number;
    normal_analysis: number;
    advanced_analysis: number;
  };
  start_date?: string;
  end_date?: string;
  renewal_date?: string;
  days_remaining?: number;
  auto_renew?: boolean;
}

type ModelGroup = "basic_chat" | "normal_analysis" | "advanced_analysis";

// Context 인터페이스
interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  updateUsage: (modelGroup: ModelGroup) => void;
  refreshSubscription: () => Promise<void>;
}

// Context 생성
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Provider 컴포넌트
interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { fetchWithAuth } = useApi();

  // 구독 정보 조회
  const fetchSubscription = async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchWithAuth("/users/me/subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        // API 호출 실패 시 기본값 설정
        setSubscription({
          plan: "FREE",
          status: "active",
          group_usage: { basic_chat: 0, normal_analysis: 0, advanced_analysis: 0 },
          group_limits: { basic_chat: 10, normal_analysis: 5, advanced_analysis: 3 },
          remaining_usage: { basic_chat: 10, normal_analysis: 5, advanced_analysis: 3 },
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      // 에러 발생 시 기본값 설정
      setSubscription({
        plan: "FREE",
        status: "active",
        group_usage: { basic_chat: 0, normal_analysis: 0, advanced_analysis: 0 },
        group_limits: { basic_chat: 10, normal_analysis: 5, advanced_analysis: 3 },
        remaining_usage: { basic_chat: 10, normal_analysis: 5, advanced_analysis: 3 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 로컬 사용량 업데이트
  const updateUsage = (modelGroup: ModelGroup) => {
    if (!subscription) return;

    setSubscription(prev => {
      if (!prev) return null;
      return {
        ...prev,
        group_usage: {
          ...prev.group_usage,
          [modelGroup]: prev.group_usage[modelGroup] + 1
        },
        remaining_usage: {
          ...prev.remaining_usage,
          [modelGroup]: Math.max(0, prev.remaining_usage[modelGroup] - 1)
        }
      };
    });
  };

  // 구독 정보 새로고침
  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  // 인증 상태 변경 시 구독 정보 로드
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    } else {
      setSubscription(null);
    }
  }, [isAuthenticated]);

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    updateUsage,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook
export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}; 