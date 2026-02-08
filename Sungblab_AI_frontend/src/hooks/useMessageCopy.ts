import { useState, useCallback } from "react";

interface UseMessageCopyReturn {
  copiedStates: { [key: string]: boolean };
  handleCodeCopy: (code: string, blockId: string) => Promise<void>;
}

export const useMessageCopy = (): UseMessageCopyReturn => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCodeCopy = useCallback(async (code: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedStates((prev) => ({ ...prev, [blockId]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [blockId]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, []);

  return {
    copiedStates,
    handleCodeCopy,
  };
}; 