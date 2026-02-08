import { useState, useEffect } from 'react';
import { getBaseUrl } from '../utils/api';

interface AnonymousUsage {
  session_id: string;
  current_usage: number;
  limit: number;
  remaining: number;
  is_limit_exceeded: boolean;
}

export const useAnonymousChat = () => {
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [anonymousUsage, setAnonymousUsage] = useState<AnonymousUsage | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchAnonymousUsage = async (sessionId: string) => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/anonymous/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnonymousUsage(data);
      }
    } catch (error) {
      console.error('익명 사용자 사용량 조회 실패:', error);
    }
  };

  const initializeAnonymousSession = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/anonymous/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sessionId = data.session_id;
        setAnonymousSessionId(sessionId);
        localStorage.setItem('anonymous_session_id', sessionId);
        await fetchAnonymousUsage(sessionId);
      }
    } catch (error) {
      console.error('익명 세션 생성 실패:', error);
    }
  };

  const sendAnonymousMessage = async (message: string) => {
    if (!anonymousSessionId) {
      throw new Error('익명 세션이 없습니다.');
    }

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/anonymous/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: anonymousSessionId,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error('메시지 전송에 실패했습니다.');
    }

    return response;
  };

  return {
    isAnonymousMode,
    setIsAnonymousMode,
    anonymousSessionId,
    anonymousUsage,
    showLoginModal,
    setShowLoginModal,
    fetchAnonymousUsage,
    initializeAnonymousSession,
    sendAnonymousMessage,
  };
};