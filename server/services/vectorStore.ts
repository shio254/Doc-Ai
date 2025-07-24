import { storage } from '../storage';
import { generateEmbedding } from './gemini';
import type { DocumentChunk } from '@shared/schema';

export interface SearchResult {
  chunks: DocumentChunk[];
  contexts: string[];
  sources: Array<{
    documentName: string;
    chunkIndex: number;
  }>;
}

export class VectorStore {
  async searchSimilarChunks(query: string, limit: number = 5): Promise<SearchResult> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);
      
      // Search for similar chunks
      const similarChunks = await storage.searchChunksByEmbedding(
        queryEmbedding.embedding, 
        limit
      );
      
      // Get document information for each chunk
      const contexts: string[] = [];
      const sources: Array<{ documentName: string; chunkIndex: number }> = [];
      
      for (const chunk of similarChunks) {
        const document = await storage.getDocument(chunk.documentId);
        if (document) {
          contexts.push(chunk.content);
          sources.push({
            documentName: document.originalName,
            chunkIndex: chunk.chunkIndex
          });
        }
      }
      
      return {
        chunks: similarChunks,
        contexts,
        sources
      };
    } catch (error) {
      console.error('Vector search failed:', error);
      return {
        chunks: [],
        contexts: [],
        sources: []
      };
    }
  }
}

export const vectorStore = new VectorStore();
