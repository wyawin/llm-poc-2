import { useState, useCallback, useRef } from 'react';
import { DocumentFile, CreditRecommendation } from '../types';
import { apiService } from '../services/api';

export const useDocumentProcessing = () => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [recommendation, setRecommendation] = useState<CreditRecommendation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addDocuments = useCallback((files: File[]) => {
    const newDocuments: DocumentFile[] = files.map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
  }, []);

  const removeDocument = useCallback((id: string) => {
    // Clear any processing interval for this document
    const interval = processingIntervals.current.get(id);
    if (interval) {
      clearInterval(interval);
      processingIntervals.current.delete(id);
    }

    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const updateDocumentStatus = useCallback((id: string, updates: Partial<DocumentFile>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, ...updates } : doc
    ));
  }, []);

  const processDocuments = useCallback(async () => {
    setIsProcessing(true);
    setRecommendation(null);

    try {
      const pendingDocs = documents.filter(doc => doc.status === 'pending');
      
      // Start processing each document
      for (const doc of pendingDocs) {
        updateDocumentStatus(doc.id, { status: 'processing', progress: 0 });

        // Simulate progress updates
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 95) {
            clearInterval(progressInterval);
            processingIntervals.current.delete(doc.id);
            progress = 100;
          }
          updateDocumentStatus(doc.id, { progress: Math.min(progress, 100) });
        }, 500);

        processingIntervals.current.set(doc.id, progressInterval);

        // Process document (using mock API for now)
        try {
          const extractedData = await apiService.mockProcessDocument(doc.id);
          updateDocumentStatus(doc.id, {
            status: 'completed',
            progress: 100,
            extractedData
          });
        } catch (error) {
          updateDocumentStatus(doc.id, {
            status: 'error',
            progress: 0,
            error: error instanceof Error ? error.message : 'Processing failed'
          });
        }
      }

      // Generate credit recommendation after all documents are processed
      setTimeout(async () => {
        try {
          const completedDocs = documents.filter(doc => doc.status === 'completed');
          if (completedDocs.length > 0) {
            const creditRec = await apiService.mockGenerateCreditRecommendation();
            setRecommendation(creditRec);
          }
        } catch (error) {
          console.error('Failed to generate recommendation:', error);
        } finally {
          setIsProcessing(false);
        }
      }, 2000);

    } catch (error) {
      console.error('Processing failed:', error);
      setIsProcessing(false);
    }
  }, [documents, updateDocumentStatus]);

  const resetAnalysis = useCallback(() => {
    // Clear all intervals
    processingIntervals.current.forEach(interval => clearInterval(interval));
    processingIntervals.current.clear();
    
    setDocuments([]);
    setRecommendation(null);
    setIsProcessing(false);
  }, []);

  return {
    documents,
    recommendation,
    isProcessing,
    addDocuments,
    removeDocument,
    processDocuments,
    resetAnalysis
  };
};