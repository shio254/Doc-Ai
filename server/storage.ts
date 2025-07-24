import { users, documents, documentChunks, chatMessages, type User, type InsertUser, type Document, type InsertDocument, type DocumentChunk, type InsertDocumentChunk, type ChatMessage, type InsertChatMessage } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Document chunk methods
  getDocumentChunks(documentId: number): Promise<DocumentChunk[]>;
  createDocumentChunk(chunk: InsertDocumentChunk): Promise<DocumentChunk>;
  deleteDocumentChunks(documentId: number): Promise<boolean>;
  searchChunksByEmbedding(embedding: number[], limit?: number): Promise<DocumentChunk[]>;
  
  // Chat message methods
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private documentChunks: Map<number, DocumentChunk>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentDocumentId: number;
  private currentChunkId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.documentChunks = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentChunkId = 1;
    this.currentMessageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      uploadedAt: new Date(),
      processedAt: null,
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    // Also delete associated chunks
    await this.deleteDocumentChunks(id);
    return this.documents.delete(id);
  }

  async getDocumentChunks(documentId: number): Promise<DocumentChunk[]> {
    return Array.from(this.documentChunks.values())
      .filter(chunk => chunk.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async createDocumentChunk(insertChunk: InsertDocumentChunk): Promise<DocumentChunk> {
    const id = this.currentChunkId++;
    const chunk: DocumentChunk = { ...insertChunk, id };
    this.documentChunks.set(id, chunk);
    return chunk;
  }

  async deleteDocumentChunks(documentId: number): Promise<boolean> {
    const chunks = Array.from(this.documentChunks.entries())
      .filter(([_, chunk]) => chunk.documentId === documentId);
    
    chunks.forEach(([id, _]) => this.documentChunks.delete(id));
    return true;
  }

  async searchChunksByEmbedding(embedding: number[], limit: number = 5): Promise<DocumentChunk[]> {
    // Simple cosine similarity for in-memory storage
    const chunks = Array.from(this.documentChunks.values())
      .filter(chunk => chunk.embedding)
      .map(chunk => ({
        chunk,
        similarity: this.cosineSimilarity(embedding, chunk.embedding as number[])
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.chunk);
    
    return chunks;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).sort((a, b) => 
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async clearChatMessages(): Promise<boolean> {
    this.chatMessages.clear();
    return true;
  }
}

export const storage = new MemStorage();
