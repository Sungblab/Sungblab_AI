export type ProjectType = "assignment" | "record";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description?: string;
  system_instruction?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCreate {
  name: string;
  type: ProjectType;
  description?: string;
  system_instruction?: string;
  settings?: Record<string, any>;
}

export interface ProjectUpdate {
  name: string;
  type: ProjectType;
  description?: string;
  system_instruction?: string;
  settings?: Record<string, any>;
}

export interface ProjectChat {
  id: string;
  name: string;
  project_id: string;
  type: ProjectType;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithChats extends Project {
  chats: ProjectChat[];
}
