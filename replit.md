# Internal Document Q&A Assistant

## Overview

This is an internal tool that allows team members to query company documentation using natural language. Instead of manually searching through PDFs, handbooks, or lengthy onboarding docs, users can ask questions in plain English and get AI-powered answers from uploaded content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

This application follows a full-stack architecture with clear separation between frontend, backend, and data layers:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api` prefix
- **File Handling**: Multer for multipart form uploads
- **Development**: Custom Vite integration for hot reloading

### Database & Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon Database (serverless PostgreSQL)
- **Vector Storage**: Embeddings stored as JSON arrays in database
- **File Storage**: Local filesystem with uploads directory

## Key Components

### Document Processing Pipeline
1. **Upload Handling**: Supports PDF, TXT, and DOCX files up to 50MB
2. **Text Extraction**: DocumentProcessor service extracts text content
3. **Chunking**: Documents split into 1000-character chunks with 200-character overlap
4. **Embedding Generation**: Hash-based mock embeddings create vector representations
5. **Storage**: Chunks and embeddings stored in PostgreSQL

### AI Integration
- **Provider**: Google Gemini models for chat completion (gemini-2.5-flash)
- **Embedding Model**: Hash-based mock embeddings for document vectorization
- **Vector Search**: Cosine similarity search through database embeddings
- **Context Assembly**: Retrieved chunks combined for LLM context

### User Interface
- **Chat Interface**: Real-time conversation with document context
- **Document Sidebar**: Upload, view, and manage documents
- **Upload Modal**: Drag-and-drop file upload with progress tracking
- **Status Indicators**: Document processing states (uploading, processing, completed, error)

## Data Flow

### Document Upload Flow
1. User selects files in UploadModal
2. Files validated for type and size
3. Multer processes multipart upload
4. DocumentProcessor extracts text content
5. Text chunked and sent to OpenAI for embeddings
6. Chunks and embeddings stored in database
7. Document status updated to "completed"

### Query Processing Flow
1. User submits question in ChatInterface
2. Question converted to embedding via OpenAI
3. Vector similarity search finds relevant document chunks
4. Retrieved chunks assembled as context
5. OpenAI generates response using context and question
6. Response displayed with source document references

## External Dependencies

### Core Services
- **Google Gemini API**: AI chat completions and document understanding
- **Neon Database**: Serverless PostgreSQL hosting
- **File System**: Local storage for uploaded documents

### Development Tools
- **Replit Integration**: Development environment with cartographer plugin
- **Vite Plugins**: Runtime error overlay and development tooling

### UI Libraries
- **Radix UI**: Headless component primitives
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant styling
- **React Hook Form**: Form validation and handling

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations manage schema changes

### Environment Configuration
- **Development**: tsx for TypeScript execution with hot reload
- **Production**: Compiled JavaScript with NODE_ENV=production
- **Database**: DATABASE_URL environment variable required

### File Structure
- `client/`: React frontend application
- `server/`: Express backend with API routes
- `shared/`: Common TypeScript types and database schema
- `uploads/`: Local file storage directory
- `migrations/`: Database migration files

### Scalability Considerations
- In-memory storage implementation provided for development
- Database storage ready for production deployment
- Vector search optimized for PostgreSQL with JSON embeddings
- File upload size limits prevent resource exhaustion