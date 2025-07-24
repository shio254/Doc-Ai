# Doc-Ai
# Internal Documentation Q&A Assistant

AI-powered document Q&A assistant. Upload PDFs/DOCX/TXT files and chat with your documents using natural language.

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd internal-doc-qa-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

## 📁 How It Works

1. **Upload Documents** - Drag and drop PDF, DOCX, or TXT files
2. **Wait for Processing** - Documents are automatically chunked and indexed
3. **Ask Questions** - Chat naturally about your document content
4. **Get Answers** - Receive contextual responses with source references

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js
- **AI:** Google Gemini API
- **Document Processing:** pdf2json, mammoth
- **Database:** Drizzle ORM (PostgreSQL ready)

## 📝 Supported File Types

- **PDF** (.pdf) - Up to 50MB
- **Word Documents** (.docx) - Up to 50MB  
- **Text Files** (.txt) - Up to 50MB

## 🔧 Configuration

### Environment Variables
- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `DATABASE_URL` - PostgreSQL connection string (optional, uses in-memory by default)

### API Endpoints
- `POST /api/documents/upload` - Upload documents
- `GET /api/documents` - List uploaded documents
- `DELETE /api/documents/:id` - Delete documents
- `POST /api/chat` - Chat with documents
- `GET /api/chat/messages` - Get chat history

## 🏗 Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── uploads/         # Document storage
└── README.md
```

## 🚀 Deployment

The app is ready for deployment on any Node.js hosting platform. For production:

1. Set `NODE_ENV=production`
2. Configure PostgreSQL database
3. Set required environment variables
4. Run `npm run build && npm start`

## 📄 License

MIT License - feel free to use for your team's internal documentation needs.
