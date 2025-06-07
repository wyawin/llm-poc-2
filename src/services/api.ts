import { DocumentFile, CreditRecommendation } from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  async uploadDocuments(files: File[]): Promise<string[]> {
    try {
      console.log(`Uploading ${files.length} files to backend...`);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
        console.log(`Added file to FormData: ${file.name} (${file.size} bytes)`);
      });

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log(`Upload response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Upload failed' };
        }
        
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload successful, received:', result);
      
      if (!result.document_ids || !Array.isArray(result.document_ids)) {
        throw new Error('Invalid response format: missing document_ids array');
      }
      
      return result.document_ids;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async processDocument(documentId: string): Promise<void> {
    try {
      console.log(`Starting processing for document ID: ${documentId}`);
      
      const response = await fetch(`${API_BASE_URL}/process/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Process response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Process error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Processing failed' };
        }
        
        throw new Error(errorData.error || `Processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Processing started successfully:', result);
    } catch (error) {
      console.error('Process document error:', error);
      throw error;
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
    try {
      const response = await fetch(`${API_BASE_URL}/status/${documentId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status check error response:', errorText);
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Validate response structure
      if (!result.document_id || !result.status) {
        console.error('Invalid status response:', result);
        throw new Error('Invalid status response format');
      }
      
      return result;
    } catch (error) {
      console.error('Get processing status error:', error);
      throw error;
    }
  }

  async generateCreditRecommendation(documentIds: string[]): Promise<CreditRecommendation> {
    try {
      console.log(`Generating credit recommendation for documents:`, documentIds);
      
      const response = await fetch(`${API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_ids: documentIds }),
      });

      console.log(`Recommendation response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Recommendation error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Recommendation failed' };
        }
        
        throw new Error(errorData.error || `Recommendation failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Credit recommendation received successfully');
      console.log('Recommendation structure:', {
        hasScore: !!result.score,
        hasRecommendation: !!result.recommendation,
        hasGroupedData: !!result.groupedFinancialData,
        hasTrends: !!result.financialTrends,
        hasMultiPeriod: !!result.multiPeriodAnalysis
      });
      
      // Validate recommendation structure
      if (!result.score && !result.recommendation) {
        console.error('Invalid recommendation response:', result);
        throw new Error('Invalid recommendation response format');
      }
      
      // Ensure required fields have fallback values
      const validatedResult: CreditRecommendation = {
        score: result.score || 500,
        recommendation: result.recommendation || 'decline',
        riskLevel: result.riskLevel || 'high',
        creditLimit: result.creditLimit || 0,
        interestRate: result.interestRate || null,
        
        businessOverview: result.businessOverview || null,
        financialAnalysis: result.financialAnalysis || null,
        creditRiskAssessment: result.creditRiskAssessment || null,
        
        keyStrengths: result.keyStrengths || [],
        keyWeaknesses: result.keyWeaknesses || [],
        riskFactors: result.riskFactors || [],
        mitigationStrategies: result.mitigationStrategies || [],
        
        reasons: result.reasons || [],
        conditions: result.conditions || [],
        
        executiveSummary: result.executiveSummary || null,
        confidenceLevel: result.confidenceLevel || 0.5,
        analysisDate: result.analysisDate || new Date().toISOString(),
        documentsAnalyzed: result.documentsAnalyzed || 0,
        
        documentSummary: result.documentSummary || null,
        financialMetrics: result.financialMetrics || null,
        
        // New fields
        groupedFinancialData: result.groupedFinancialData || null,
        financialTrends: result.financialTrends || null,
        multiPeriodAnalysis: result.multiPeriodAnalysis || null
      };
      
      return validatedResult;
    } catch (error) {
      console.error('Generate credit recommendation error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    ollama?: string;
    models?: string;
    error?: string;
  }> {
    try {
      console.log('Checking backend health...');
      
      const response = await fetch(`${API_BASE_URL}/health`);
      const result = await response.json();
      
      console.log('Health check result:', result);
      return result;
    } catch (error) {
      console.error('Health check error:', error);
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
    try {
      const response = await fetch(`${API_BASE_URL}/documents`);
      
      if (!response.ok) {
        throw new Error(`Failed to get documents: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get all documents error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();