import { useState, useRef, useCallback, useMemo } from 'react';
import { StreamingMessage } from '../types/chat';

export const useChatMessages = () => {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reasoningStates, setReasoningStates] = useState<{[key: number]: boolean}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleToggleReasoning = (messageId: number) => {
    setReasoningStates(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  const addMessage = useCallback((message: StreamingMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateLastMessage = useCallback((updater: (prev: StreamingMessage) => StreamingMessage) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = updater(updated[updated.length - 1]);
      return updated;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setReasoningStates({});
  }, []);

  const memoizedReturn = useMemo(() => ({
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    reasoningStates,
    messagesEndRef,
    handleToggleReasoning,
    scrollToBottom,
    addMessage,
    updateLastMessage,
    clearMessages,
  }), [
    messages,
    isLoading,
    reasoningStates,
    handleToggleReasoning,
    scrollToBottom,
    addMessage,
    updateLastMessage,
    clearMessages,
  ]);

  return memoizedReturn;
};