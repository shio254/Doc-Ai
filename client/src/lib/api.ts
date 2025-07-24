import { apiRequest } from "./queryClient";
import type { Document, ChatMessage } from "@shared/schema";

export const api = {
  // Documents
  getDocuments: async (): Promise<Document[]> => {
    const response = await fetch('/api/documents');
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }
    return response.json();
  },

  uploadDocument: async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload document');
    }
    
    return response.json();
  },

  deleteDocument: async (id: number): Promise<void> => {
    const response = await apiRequest('DELETE', `/api/documents/${id}`);
    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  },

  // Chat
  getChatMessages: async (): Promise<ChatMessage[]> => {
    const response = await fetch('/api/chat/messages');
    if (!response.ok) {
      throw new Error('Failed to fetch chat messages');
    }
    return response.json();
  },

  sendChatQuery: async (query: string): Promise<ChatMessage> => {
    const response = await apiRequest('POST', '/api/chat/query', { query });
    return response.json();
  },

  clearChatHistory: async (): Promise<void> => {
    const response = await apiRequest('DELETE', '/api/chat/messages');
    if (!response.ok) {
      throw new Error('Failed to clear chat history');
    }
  },
};
