import { useApi } from "../utils/api";
import { Project, ProjectChat, ProjectWithChats } from "../types/project";
import { ProjectCreate, ProjectUpdate } from "../types/project";
import { ProjectType } from "../types/project";

// 프로젝트 파일 타입 정의
export interface ProjectFile {
  file_id: string;
  original_name: string;
  display_name: string;
  uri: string;
  state: string;
  create_time: string | null;
  expire_time: string | null;
  mime_type?: string;
  size?: number;
  description?: string;
}

export interface KnowledgeSearchResult {
  content: string;
  relevance_score: number;
  source_files: string[];
}

export const createProjectApi = (fetchWithAuth: any) => ({
  // 프로젝트 생성
  createProject: async (data: {
    name: string;
    type: string;
    description?: string;
    system_instruction?: string;
    settings?: Record<string, any>;
  }): Promise<Project> => {
    const response = await fetchWithAuth("/projects/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // 프로젝트 목록 조회
  getProjects: async (): Promise<ProjectWithChats[]> => {
    const response = await fetchWithAuth("/projects/");
    return response.json();
  },

  // 프로젝트 삭제
  deleteProject: async (projectId: string): Promise<void> => {
    await fetchWithAuth(`/projects/${projectId}`, {
      method: "DELETE",
    });
  },

  // 프로젝트 채팅방 생성
  createProjectChat: async (
    projectId: string,
    chat: { name: string; type?: ProjectType }
  ): Promise<ProjectChat> => {
    const response = await fetchWithAuth(`/projects/${projectId}/chats`, {
      method: "POST",
      body: JSON.stringify(chat),
    });
    return response.json();
  },

  // 프로젝트 채팅방 삭제
  deleteProjectChat: async (
    projectId: string,
    chatId: string
  ): Promise<void> => {
    await fetchWithAuth(`/projects/${projectId}/chats/${chatId}`, {
      method: "DELETE",
    });
  },

  // 프로젝트 채팅방 이름 업데이트
  updateProjectChatName: async (
    projectId: string,
    chatId: string,
    name: string
  ): Promise<void> => {
    await fetchWithAuth(`/projects/${projectId}/chats/${chatId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  // 새로 추가된 메서드들
  getProjectChat: async (projectId: string, chatId: string) => {
    const response = await fetchWithAuth(
      `/projects/${projectId}/chats/${chatId}`
    );
    return response.json();
  },

  getProjectChatMessages: async (projectId: string, chatId: string) => {
    const response = await fetchWithAuth(
      `/projects/${projectId}/chats/${chatId}/messages`
    );
    return response.json();
  },

  createProjectChatMessage: async (
    projectId: string,
    chatId: string,
    data: {
      content: string;
      role: string;
      file?: {
        type: string;
        name: string;
        data: string;
      };
    }
  ) => {
    const response = await fetchWithAuth(
      `/projects/${projectId}/chats/${chatId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.json();
  },

  streamProjectChat: async (
    projectId: string,
    chatId: string,
    formData: FormData
  ) => {
    try {
      const response = await fetchWithAuth(
        `/projects/${projectId}/chats/${chatId}/chat`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to stream chat: ${errorText}`);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  // 🆕 파일 관리 API
  uploadProjectFiles: async (
    projectId: string,
    files: File[],
    description?: string
  ) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    if (description) {
      formData.append('description', description);
    }

    const response = await fetchWithAuth(`/projects/${projectId}/files/upload`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },

  getProjectFiles: async (projectId: string): Promise<ProjectFile[]> => {
    const response = await fetchWithAuth(`/projects/${projectId}/files`);
    const data = await response.json();
    return data.files || [];
  },

  deleteProjectFile: async (projectId: string, fileId: string) => {
    const response = await fetchWithAuth(`/projects/${projectId}/files/${fileId}`, {
      method: "DELETE",
    });
    return response.json();
  },

  // 🆕 지식베이스 검색 API
  searchProjectKnowledge: async (
    projectId: string,
    query: string,
    topK: number = 5
  ): Promise<KnowledgeSearchResult[]> => {
    const formData = new FormData();
    formData.append('query', query);
    formData.append('top_k', topK.toString());

    const response = await fetchWithAuth(`/projects/${projectId}/knowledge/search`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.results || [];
  },

  // 🆕 임베딩 통계 조회 API
  getEmbeddingStats: async (projectId: string) => {
    const response = await fetchWithAuth(`/projects/${projectId}/embeddings/stats`);
    return response.json();
  },

  // 🆕 임베딩 재생성 API
  regenerateEmbeddings: async (projectId: string, fileId?: string) => {
    const formData = new FormData();
    if (fileId) {
      formData.append('file_id', fileId);
    }

    const response = await fetchWithAuth(`/projects/${projectId}/embeddings/regenerate`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },
});

export const useProjectApi = () => {
  const { fetchWithAuth } = useApi();

  return {
    getProjects: async (): Promise<ProjectWithChats[]> => {
      const response = await fetchWithAuth("/projects/");
      return response.json();
    },

    getProject: async (projectId: string): Promise<ProjectWithChats> => {
      const response = await fetchWithAuth(`/projects/${projectId}`);
      return response.json();
    },

    createProject: async (
      project: ProjectCreate
    ): Promise<ProjectWithChats> => {
      const response = await fetchWithAuth("/projects/", {
        method: "POST",
        body: JSON.stringify(project),
      });
      return response.json();
    },

    updateProject: async (
      projectId: string,
      project: ProjectUpdate
    ): Promise<ProjectWithChats> => {
      const response = await fetchWithAuth(`/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(project),
      });
      return response.json();
    },

    deleteProject: async (projectId: string) => {
      const response = await fetchWithAuth(`/projects/${projectId}`, {
        method: "DELETE",
      });
      return response.json();
    },

    createProjectChat: async (
      projectId: string,
      chat: { name: string; type?: ProjectType }
    ): Promise<ProjectChat> => {
      const response = await fetchWithAuth(`/projects/${projectId}/chats`, {
        method: "POST",
        body: JSON.stringify(chat),
      });
      return response.json();
    },

    deleteProjectChat: async (projectId: string, chatId: string) => {
      const response = await fetchWithAuth(
        `/projects/${projectId}/chats/${chatId}`,
        {
          method: "DELETE",
        }
      );
      return response.json();
    },

    updateProjectChat: async (
      projectId: string,
      chatId: string,
      chat: { name: string }
    ) => {
      const response = await fetchWithAuth(
        `/projects/${projectId}/chats/${chatId}`,
        {
          method: "PATCH",
          body: JSON.stringify(chat),
        }
      );
      return response.json();
    },

    // 새로 추가된 메서드들
    getProjectChat: async (projectId: string, chatId: string) => {
      const response = await fetchWithAuth(
        `/projects/${projectId}/chats/${chatId}`
      );
      return response.json();
    },

    getProjectChatMessages: async (projectId: string, chatId: string) => {
      const response = await fetchWithAuth(
        `/projects/${projectId}/chats/${chatId}/messages`
      );
      return response.json();
    },

    createProjectChatMessage: async (
      projectId: string,
      chatId: string,
      data: {
        content: string;
        role: string;
        file?: {
          type: string;
          name: string;
          data: string;
        };
      }
    ) => {
      const response = await fetchWithAuth(
        `/projects/${projectId}/chats/${chatId}/messages`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return response.json();
    },

    streamProjectChat: async (
      projectId: string,
      chatId: string,
      formData: FormData
    ) => {
      try {
        const response = await fetchWithAuth(
          `/projects/${projectId}/chats/${chatId}/chat`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to stream chat: ${errorText}`);
        }

        return response;
      } catch (error) {
        throw error;
      }
    },

    // 🆕 파일 관리 API
    uploadProjectFiles: async (
      projectId: string, 
      files: File[], 
      description?: string
    ) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      if (description) {
        formData.append('description', description);
      }

      const response = await fetchWithAuth(`/projects/${projectId}/files/upload`, {
        method: "POST",
        body: formData,
      });
      return response.json();
    },

    getProjectFiles: async (projectId: string): Promise<ProjectFile[]> => {
      const response = await fetchWithAuth(`/projects/${projectId}/files`);
      const data = await response.json();
      return data.files || [];
    },

    deleteProjectFile: async (projectId: string, fileId: string) => {
      const response = await fetchWithAuth(`/projects/${projectId}/files/${fileId}`, {
        method: "DELETE",
      });
      return response.json();
    },

    // 🆕 지식베이스 검색 API
    searchProjectKnowledge: async (
      projectId: string,
      query: string,
      topK: number = 5
    ): Promise<KnowledgeSearchResult[]> => {
      const formData = new FormData();
      formData.append('query', query);
      formData.append('top_k', topK.toString());

      const response = await fetchWithAuth(`/projects/${projectId}/knowledge/search`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      return data.results || [];
    },

    // 🆕 임베딩 통계 조회 API
    getEmbeddingStats: async (projectId: string) => {
      const response = await fetchWithAuth(`/projects/${projectId}/embeddings/stats`);
      return response.json();
    },

    // 🆕 임베딩 재생성 API
    regenerateEmbeddings: async (projectId: string, fileId?: string) => {
      const formData = new FormData();
      if (fileId) {
        formData.append('file_id', fileId);
      }

      const response = await fetchWithAuth(`/projects/${projectId}/embeddings/regenerate`, {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
  };
};
