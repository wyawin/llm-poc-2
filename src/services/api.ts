import { DocumentFile, CreditRecommendation } from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  async uploadDocuments(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.document_ids;
  }

  async processDocument(documentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/process/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Processing failed' }));
      throw new Error(errorData.error || `Processing failed: ${response.statusText}`);
    }
  }

  async getProcessingStatus(documentId: string): Promise<{
    document_id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    filename: string;
    error?: string;
    extracted_data?: any;
  }> {
    const response = await fetch(`${API_BASE_URL}/status/${documentId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async generateCreditRecommendation(documentIds: string[]): Promise<CreditRecommendation> {
    const response = await fetch(`${API_BASE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ document_ids: documentIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Recommendation failed' }));
      throw new Error(errorData.error || `Recommendation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    ollama?: string;
    models?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      return {
        status: 'Error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async getAllDocuments(): Promise<{
    documents: Array<{
      id: string;
      filename: string;
      status: string;
      progress: number;
      uploadedAt: string;
      error?: string;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/documents`);
    
    if (!response.ok) {
      throw new Error(`Failed to get documents: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const apiService = new ApiService();