import { useApi } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { handleApiError } from "../utils/errorHandler";

export interface ChatRoom {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  role: string;
  room_id: number;
  created_at: string;
  updated_at?: string;
  file?: {
    type: string;
    name: string;
    data: string;
  };
}

export const useChatApi = () => {
  const { fetchWithAuth } = useApi();
  const { user } = useAuth();

  const getChatRooms = async () => {
    try {
      const response = await fetchWithAuth("/chat/rooms");
      if (!response.ok) {
        await handleApiError(response);
        return [];
      }
      const data = await response.json();
      return data.rooms as ChatRoom[];
    } catch (error) {
      await handleApiError(error);
      return [];
    }
  };

  const createChatRoom = async (name: string = "") => {
    if (!user) {
      const error = await handleApiError(new Error("로그인이 필요합니다."));
      throw error;
    }

    try {
      const response = await fetchWithAuth("/chat/rooms", {
        method: "POST",
        body: JSON.stringify({
          name,
          user_id: user.id.toString(),
        }),
      });
      
      if (!response.ok) {
        await handleApiError(response);
        return null;
      }
      
      return response.json() as Promise<ChatRoom>;
    } catch (error) {
      await handleApiError(error);
      return null;
    }
  };

  const deleteChatRoom = async (roomId: string) => {
    await fetchWithAuth(`/chat/rooms/${roomId}`, {
      method: "DELETE",
    });
  };

  const updateChatRoom = async (roomId: string, data: { title: string }) => {
    if (!user) {
      throw new Error("User must be authenticated to update a chat room");
    }

    const response = await fetchWithAuth(`/chat/rooms/${roomId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: data.title, // 백엔드에서는 name 필드 사용
      }),
    });
    return response.json() as Promise<ChatRoom>;
  };

  const getChatMessages = async (roomId: string) => {
    const response = await fetchWithAuth(`/chat/rooms/${roomId}/messages`);
    const data = await response.json();
    return data.messages as ChatMessage[];
  };

  const sendChatMessage = async (
    roomId: string,
    content: string,
    role: string = "user",
    file?: File
  ) => {
    const formData = new FormData();
    const request = {
      model: "gemini-2.5-flash",
      messages: [{ role, content }],
    };
    formData.append("request", JSON.stringify(request));
    if (file) {
      formData.append("file", file);
    }

    const response = await fetchWithAuth(`/chat/rooms/${roomId}/chat`, {
      method: "POST",
      body: formData,
    });

    return response;
  };

  const generatePrompt = async (data: {
    category: string;
    task_description: string;
    style: string;
    complexity: string;
    output_format: string;
    include_examples: boolean;
    include_constraints: boolean;
  }) => {
    const formData = new FormData();
    formData.append("category", data.category);
    formData.append("task_description", data.task_description);
    formData.append("style", data.style);
    formData.append("complexity", data.complexity);
    formData.append("output_format", data.output_format);
    formData.append("include_examples", data.include_examples.toString());
    formData.append("include_constraints", data.include_constraints.toString());

    const response = await fetchWithAuth("/chat/generate-prompt", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("프롬프트 생성에 실패했습니다");
    }

    return response.json();
  };

  const generateChatTitle = async (messages: ChatMessage[]) => {
    if (!user) {
      throw new Error("User must be authenticated to generate chat title");
    }

    const response = await fetchWithAuth("/chat/title/generate", {
      method: "POST",
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      }),
    });

    if (!response.ok) {
      throw new Error("채팅방 제목 생성에 실패했습니다");
    }

    return response.json();
  };

  return {
    getChatRooms,
    createChatRoom,
    deleteChatRoom,
    updateChatRoom,
    getChatMessages,
    sendChatMessage,
    generatePrompt,
    generateChatTitle,
  };
};
