import { useState, useCallback } from "react";
import { Message } from "../types";
import { useApi } from "../utils/api";
import { generateId } from "../utils/helpers";

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchWithAuth } = useApi();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: generateId(),
        content: content.trim(),
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await fetchWithAuth("/chat", {
          method: "POST",
          body: JSON.stringify({ message: content }),
        });
        const data = await response.json();

        const aiMessage: Message = {
          id: generateId(),
          content: data.message || "안녕하세요! 무엇을 도와드릴까요?",
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  return {
    messages,
    loading,
    sendMessage,
  };
};
