import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';
import mammoth from 'mammoth';
import { generateEmbedding } from './gemini';
import { storage } from '../storage';
import type { Document, InsertDocumentChunk } from '@shared/schema';

export interface ProcessingResult {
  success: boolean;
  chunksCreated: number;
  error?: string;
}

export class DocumentProcessor {
  private readonly CHUNK_SIZE = 1000;
  private readonly CHUNK_OVERLAP = 200;

  async processDocument(document: Document): Promise<ProcessingResult> {
    try {
      // Update document status to processing
      await storage.updateDocument(document.id, { status: 'processing' });

      // Read file content
      const content = await this.readFileContent(document.filePath, document.mimeType);
      
      // Split into chunks
      const chunks = this.splitIntoChunks(content);
      
      // Process each chunk with embeddings
      let chunksCreated = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const embeddingResult = await generateEmbedding(chunk);
          
          const chunkData: InsertDocumentChunk = {
            documentId: document.id,
            content: chunk,
            embedding: embeddingResult.embedding,
            chunkIndex: i,
            metadata: {
              tokens: embeddingResult.usage.total_tokens,
              originalDocument: document.originalName
            }
          };
          
          await storage.createDocumentChunk(chunkData);
          chunksCreated++;
        } catch (error) {
          console.error(`Failed to process chunk ${i} for document ${document.id}:`, error);
        }
      }

      // Update document status to completed
      await storage.updateDocument(document.id, { 
        status: 'completed',
        chunks: chunksCreated,
        processedAt: new Date()
      });

      return { success: true, chunksCreated };
    } catch (error) {
      // Update document status to error
      await storage.updateDocument(document.id, { status: 'error' });
      
      return { 
        success: false, 
        chunksCreated: 0, 
        error: error.message 
      };
    }
  }

  private async readFileContent(filePath: string, mimeType: string): Promise<string> {
    if (mimeType === 'text/plain') {
      return fs.readFileSync(filePath, 'utf-8');
    }
    
    if (mimeType === 'application/pdf') {
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        let pdfText = '';
        
        pdfParser.on('pdfParser_dataError', (errData: any) => {
          console.error('PDF parsing error:', errData.parserError);
          reject(new Error('Failed to extract text from PDF file'));
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            // Extract text from all pages
            for (const page of pdfData.Pages) {
              for (const text of page.Texts) {
                for (const textItem of text.R) {
                  pdfText += decodeURIComponent(textItem.T) + ' ';
                }
              }
              pdfText += '\n'; // Add line break between pages
            }
            resolve(pdfText.trim());
          } catch (error) {
            console.error('PDF text extraction error:', error);
            reject(new Error('Failed to extract text from PDF file'));
          }
        });
        
        // Load and parse the PDF file
        pdfParser.loadPDF(filePath);
      });
    }
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        return result.value;
      } catch (error) {
        console.error('DOCX parsing error:', error);
        throw new Error('Failed to extract text from DOCX file');
      }
    }
    
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  private splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i += this.CHUNK_SIZE - this.CHUNK_OVERLAP) {
      const chunk = words.slice(i, i + this.CHUNK_SIZE).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }
}
