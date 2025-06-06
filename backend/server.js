import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { OllamaService } from './services/ollama.js';
import { DocumentProcessor } from './services/documentProcessor.js';
import { CreditAnalyzer } from './services/creditAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
try {
  await fs.access(uploadsDir);
} catch {
  await fs.mkdir(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  }
});

// Initialize services
const ollamaService = new OllamaService();
const documentProcessor = new DocumentProcessor();
const creditAnalyzer = new CreditAnalyzer();

// In-memory storage for document processing status
const documentStatus = new Map();
const extractedData = new Map();

// Routes

// Health check
app.get('/health', async (req, res) => {
  try {
    const ollamaHealth = await ollamaService.checkHealth();
    await ollamaService.ensureModelsExist();
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      ollama: ollamaHealth ? 'Connected' : 'Disconnected',
      models: 'qwen2.5vl:7b, deepseek-r1:8b'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      timestamp: new Date().toISOString(),
      error: error.message 
    });
  }
});

// Upload multiple documents
app.post('/upload', upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const documentIds = req.files.map(file => {
      const documentId = uuidv4();
      documentStatus.set(documentId, {
        id: documentId,
        filename: file.originalname,
        filepath: file.path,
        mimetype: file.mimetype,
        status: 'pending',
        progress: 0,
        uploadedAt: new Date().toISOString()
      });
      return documentId;
    });

    res.json({
      message: 'Files uploaded successfully',
      document_ids: documentIds
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Process a specific document
app.post('/process/:id', async (req, res) => {
  try {
    const documentId = req.params.id;
    const docInfo = documentStatus.get(documentId);

    if (!docInfo) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (docInfo.status === 'processing') {
      return res.status(409).json({ error: 'Document is already being processed' });
    }

    // Update status to processing
    docInfo.status = 'processing';
    docInfo.progress = 10;
    documentStatus.set(documentId, docInfo);

    // Process document in background
    processDocumentAsync(documentId, docInfo);

    res.json({
      message: 'Document processing started',
      document_id: documentId,
      status: 'processing'
    });
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: 'Processing failed to start' });
  }
});

// Get processing status
app.get('/status/:id', (req, res) => {
  try {
    const documentId = req.params.id;
    const docInfo = documentStatus.get(documentId);

    if (!docInfo) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const response = {
      document_id: documentId,
      status: docInfo.status,
      progress: docInfo.progress,
      filename: docInfo.filename
    };

    if (docInfo.error) {
      response.error = docInfo.error;
    }

    if (docInfo.status === 'completed') {
      response.extracted_data = extractedData.get(documentId);
    }

    res.json(response);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Generate comprehensive credit recommendation with insights
app.post('/recommend', async (req, res) => {
  try {
    const { document_ids } = req.body;

    if (!document_ids || !Array.isArray(document_ids)) {
      return res.status(400).json({ error: 'document_ids array is required' });
    }

    // Get all extracted data for the documents
    const allExtractedData = [];
    for (const docId of document_ids) {
      const docInfo = documentStatus.get(docId);
      if (docInfo && docInfo.status === 'completed') {
        const data = extractedData.get(docId);
        if (data) {
          allExtractedData.push(data);
        }
      }
    }

    if (allExtractedData.length === 0) {
      return res.status(400).json({ error: 'No completed documents found for analysis' });
    }

    console.log('Generating comprehensive credit insights using deepseek-r1:8b...');

    // Generate comprehensive insights using deepseek-r1:8b
    const ollamaInsights = await ollamaService.generateCreditInsights(allExtractedData);

    // Generate final recommendation combining Ollama insights with traditional analysis
    const recommendation = await creditAnalyzer.generateRecommendation(allExtractedData, ollamaInsights);

    res.json(recommendation);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate recommendation: ' + error.message });
  }
});

// Get all documents status
app.get('/documents', (req, res) => {
  try {
    const documents = Array.from(documentStatus.values()).map(doc => ({
      id: doc.id,
      filename: doc.filename,
      status: doc.status,
      progress: doc.progress,
      uploadedAt: doc.uploadedAt,
      error: doc.error
    }));

    res.json({ documents });
  } catch (error) {
    console.error('Documents list error:', error);
    res.status(500).json({ error: 'Failed to get documents list' });
  }
});

// Async function to process document
async function processDocumentAsync(documentId, docInfo) {
  try {
    console.log(`Starting processing for document: ${docInfo.filename}`);
    
    // Update progress
    docInfo.progress = 20;
    documentStatus.set(documentId, docInfo);

    // Convert document to images if needed
    const images = await documentProcessor.convertToImages(docInfo.filepath, docInfo.mimetype);
    
    docInfo.progress = 40;
    documentStatus.set(documentId, docInfo);

    // Process each image with Ollama qwen2.5vl:7b
    const extractedResults = [];
    for (let i = 0; i < images.length; i++) {
      console.log(`Processing image ${i + 1}/${images.length} for document: ${docInfo.filename}`);
      
      const result = await ollamaService.extractDataFromImage(images[i]);
      extractedResults.push(result);
      
      // Update progress
      docInfo.progress = 40 + (50 * (i + 1) / images.length);
      documentStatus.set(documentId, docInfo);
    }

    // Combine and structure the extracted data
    const combinedData = documentProcessor.combineExtractedData(extractedResults, docInfo.filename);
    
    docInfo.progress = 95;
    documentStatus.set(documentId, docInfo);

    // Store extracted data
    extractedData.set(documentId, combinedData);

    // Mark as completed
    docInfo.status = 'completed';
    docInfo.progress = 100;
    docInfo.completedAt = new Date().toISOString();
    documentStatus.set(documentId, docInfo);

    console.log(`Completed processing for document: ${docInfo.filename}`);

    // Clean up temporary image files
    await documentProcessor.cleanupImages(images);

  } catch (error) {
    console.error(`Processing failed for document ${docInfo.filename}:`, error);
    
    docInfo.status = 'error';
    docInfo.error = error.message;
    docInfo.progress = 0;
    documentStatus.set(documentId, docInfo);
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('Required Ollama models: qwen2.5vl:7b, deepseek-r1:8b');
});