export interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "admin";
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export interface Project {
  id: string;
  name: string;
  type: "general" | "assignment" | "student-record";
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  content: string;
  role: "user" | "assistant";
  created_at: string;
  room_id: number;
}
