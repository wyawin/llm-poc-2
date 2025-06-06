# Comprehensive Credit Analysis Platform with Ollama Integration

A sophisticated AI-powered credit analysis platform that processes multiple types of financial documents using Ollama's vision and language models for comprehensive business credit assessment.

## Features

- **Multi-Document Processing**: Support for various financial documents including:
  - Profit and Loss Statements
  - Balance Sheets
  - Bank Statements
  - Credit History Reports
  - Deed of Establishment
  - Director and Shareholder Lists
  - Tax Returns and Financial Reports

- **Dual AI Model Integration**:
  - **qwen2.5vl:7b**: Vision model for document data extraction
  - **deepseek-r1:8b**: Language model for comprehensive credit analysis and insights

- **Comprehensive Analysis**: 
  - Business overview and industry analysis
  - Financial performance assessment
  - Credit risk evaluation
  - Management team assessment
  - Detailed recommendations and insights

- **Advanced Processing**: 
  - PDF to image conversion for vision model compatibility
  - Multi-page document handling
  - Data aggregation across related documents
  - Real-time processing status updates

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Ollama** installed and running
3. **Required Ollama models**:
   - `qwen2.5vl:7b` (for document vision processing)
   - `deepseek-r1:8b` (for credit analysis and insights)

### Setting up Ollama

1. Install Ollama from [https://ollama.ai](https://ollama.ai)
2. Pull the required models:
   ```bash
   ollama pull qwen2.5vl:7b
   ollama pull deepseek-r1:8b
   ```
3. Verify Ollama is running:
   ```bash
   ollama list
   ```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration:
   ```env
   OLLAMA_URL=http://localhost:11434
   PORT=8000
   VITE_REACT_APP_API_URL=http://localhost:8000
   ```

## Running the Application

### Development Mode (Both Frontend and Backend)
```bash
npm run dev:full
```

This will start:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:8000`

### Individual Services

**Frontend only:**
```bash
npm run dev
```

**Backend only:**
```bash
npm run server
```

## API Endpoints

### Document Management
- `POST /upload` - Upload multiple documents
- `POST /process/:id` - Process a specific document with qwen2.5vl:7b
- `GET /status/:id` - Get processing status
- `GET /documents` - List all documents

### Credit Analysis
- `POST /recommend` - Generate comprehensive credit recommendation using deepseek-r1:8b

### Health Check
- `GET /health` - Server and Ollama connectivity status

## Document Processing Flow

1. **Upload**: Multiple financial documents uploaded via web interface
2. **Conversion**: PDFs converted to individual images using pdf-poppler
3. **Vision Analysis**: Each image processed by qwen2.5vl:7b for data extraction
4. **Data Aggregation**: Multi-page and multi-document data combined
5. **Credit Analysis**: deepseek-r1:8b generates comprehensive insights and recommendations
6. **Final Report**: Complete credit assessment with detailed analysis

## Supported Document Types

- **Profit and Loss Statements**: Revenue, expenses, net income analysis
- **Balance Sheets**: Assets, liabilities, equity assessment
- **Bank Statements**: Cash flow, transaction patterns, account balances
- **Credit History**: Payment history, existing credit obligations
- **Deed of Establishment**: Company formation, legal structure
- **Director/Shareholder Lists**: Management team, ownership structure
- **Tax Returns**: Income verification, compliance history
- **Financial Reports**: Comprehensive financial performance data

## Credit Analysis Features

The system provides comprehensive analysis including:

### Business Overview
- Company profile and industry analysis
- Management team assessment
- Business model evaluation
- Legal structure analysis

### Financial Analysis
- Revenue trends and profitability
- Balance sheet strength
- Cash flow analysis
- Debt capacity evaluation

### Credit Risk Assessment
- Payment history evaluation
- Debt-to-income/revenue ratios
- Liquidity position analysis
- Overall creditworthiness determination

### Insights and Recommendations
- Key strengths and weaknesses identification
- Risk factors and mitigation strategies
- Credit decision with detailed reasoning
- Suggested credit terms and conditions

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for development and building

### Backend
- Node.js with Express
- Multer for file uploads
- Sharp for image processing
- pdf-poppler for PDF conversion
- Dual Ollama model integration

## Configuration

### Environment Variables

- `OLLAMA_URL`: Ollama server URL (default: http://localhost:11434)
- `PORT`: Backend server port (default: 8000)
- `VITE_REACT_APP_API_URL`: Frontend API URL (default: http://localhost:8000)

### File Upload Limits

- Maximum file size: 50MB
- Maximum files per upload: 10
- Supported formats: PDF, JPG, PNG, DOC, DOCX

## Troubleshooting

### Common Issues

1. **Ollama Connection Error**
   - Ensure Ollama is running: `ollama serve`
   - Check if models are available: `ollama list`
   - Verify OLLAMA_URL in .env file

2. **Model Not Found Error**
   - Pull required models: `ollama pull qwen2.5vl:7b && ollama pull deepseek-r1:8b`
   - Restart Ollama service

3. **PDF Processing Error**
   - Ensure pdf-poppler dependencies are installed
   - Check file permissions in uploads directory

4. **Memory Issues**
   - Monitor system resources during processing
   - Consider processing documents in smaller batches
   - Ensure adequate RAM for model operations

### Performance Optimization

- **Model Loading**: Models are loaded on-demand to conserve memory
- **Image Processing**: Images are optimized before sending to vision model
- **Cleanup**: Temporary files are automatically cleaned up after processing
- **Batch Processing**: Documents can be processed individually or in batches

## Development

### Project Structure
```
├── backend/
│   ├── services/
│   │   ├── ollama.js          # Dual model Ollama integration
│   │   ├── documentProcessor.js # Enhanced document processing
│   │   └── creditAnalyzer.js   # Comprehensive credit analysis
│   ├── uploads/               # Uploaded files storage
│   ├── temp/                  # Temporary image files
│   └── server.js              # Express server with enhanced endpoints
├── src/
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # Frontend API services
│   └── types/                 # TypeScript type definitions
└── package.json
```

### Adding New Document Types

1. Update file filter in `backend/server.js`
2. Add conversion logic in `documentProcessor.js`
3. Update vision model prompt in `ollama.js`
4. Enhance credit analysis logic in `creditAnalyzer.js`

### Customizing Analysis

Modify the analysis prompts and scoring logic in:
- `ollama.js`: Vision extraction and insight generation prompts
- `creditAnalyzer.js`: Scoring weights and recommendation logic

## License

This project is licensed under the MIT License.