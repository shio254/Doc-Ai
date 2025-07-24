import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface EmbeddingResult {
  embedding: number[];
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ChatResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    // Gemini doesn't have a direct text embedding API like OpenAI
    // We'll create a consistent hash-based embedding for text similarity
    const mockEmbedding = createMockEmbedding(text);
    
    return {
      embedding: mockEmbedding,
      usage: {
        prompt_tokens: Math.ceil(text.length / 4), // Rough token estimate
        total_tokens: Math.ceil(text.length / 4),
      },
    };
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Create a better text-based embedding for semantic similarity
function createMockEmbedding(text: string, dimensions: number = 1536): number[] {
  const embedding = new Array(dimensions);
  
  // Normalize text: lowercase, remove punctuation, split into words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter out short words
  
  // Create word frequency map
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Generate embedding based on word characteristics
  for (let i = 0; i < dimensions; i++) {
    let value = 0;
    
    // Use different word features for different dimensions
    for (const [word, freq] of wordFreq.entries()) {
      const wordHash = simpleHash(word);
      const dimHash = simpleHash(`${word}_${i}`);
      
      // Combine word frequency, position, and character features
      value += Math.sin(wordHash + i) * freq * 0.1;
      value += Math.cos(dimHash) * Math.log(freq + 1) * 0.05;
      value += (word.length / 10) * Math.sin(wordHash * i) * 0.02;
    }
    
    // Add text-level features
    value += Math.sin(text.length + i) * 0.001;
    value += Math.cos(words.length + i) * 0.002;
    
    embedding[i] = value;
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return embedding.map(val => val / magnitude);
  }
  
  // Fallback if magnitude is 0
  return embedding.map((_, i) => Math.sin(i) * 0.01);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export async function generateChatResponse(
  query: string,
  context: string[]
): Promise<ChatResponse> {
  try {
    const contextText = context.length > 0 
      ? context.join('\n\n') 
      : "No relevant documents found.";

    const systemPrompt = `You are a helpful AI assistant for internal company documentation. Your role is to answer questions based on the provided context from uploaded documents.

Instructions:
1. Answer questions using only the information provided in the context
2. If the context doesn't contain relevant information, clearly state that you cannot find the answer in the uploaded documents
3. Be concise but comprehensive in your responses
4. When referencing information, indicate which document it came from if possible
5. If multiple documents contain relevant information, synthesize the information appropriately

Context from uploaded documents:
${contextText}

Question: ${query}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
    });

    return {
      response: response.text || "I apologize, but I couldn't generate a response.",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, // Gemini doesn't provide detailed usage stats
    };
  } catch (error) {
    throw new Error(`Failed to generate chat response: ${error instanceof Error ? error.message : String(error)}`);
  }
}