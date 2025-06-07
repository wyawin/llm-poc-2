import { useState, useCallback, useRef, useEffect } from 'react';
import { DocumentFile, CreditRecommendation } from '../types';
import { apiService } from '../services/api';

export const useDocumentProcessing = () => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [recommendation, setRecommendation] = useState<CreditRecommendation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendHealth, setBackendHealth] = useState<string>('checking');
  const processingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const documentIdMap = useRef<Map<string, string>>(new Map()); // Maps local ID to backend ID
  const completionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false); // Prevent duplicate processing

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      processingIntervals.current.forEach(interval => clearInterval(interval));
      if (completionCheckInterval.current) {
        clearInterval(completionCheckInterval.current);
      }
    };
  }, []);

  const checkBackendHealth = async () => {
    try {
      const health = await apiService.checkHealth();
      setBackendHealth(health.status === 'OK' ? 'connected' : 'error');
      if (health.error) {
        console.error('Backend health check failed:', health.error);
      }
    } catch (error) {
      setBackendHealth('disconnected');
      console.error('Backend connection failed:', error);
    }
  };

  const addDocuments = useCallback((files: File[]) => {
    const newDocuments: DocumentFile[] = files.map(file => ({
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    // Remove from ID mapping
    documentIdMap.current.delete(id);

    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const updateDocumentStatus = useCallback((id: string, updates: Partial<DocumentFile>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, ...updates } : doc
    ));
  }, []);

  const pollDocumentStatus = useCallback(async (localId: string, backendId: string) => {
    try {
      const status = await apiService.getProcessingStatus(backendId);
      
      updateDocumentStatus(localId, {
        status: status.status,
        progress: status.progress,
        error: status.error,
        extractedData: status.extracted_data
      });

      // If completed or error, stop polling
      if (status.status === 'completed' || status.status === 'error') {
        const interval = processingIntervals.current.get(localId);
        if (interval) {
          clearInterval(interval);
          processingIntervals.current.delete(localId);
        }
      }
    } catch (error) {
      console.error(`Failed to get status for document ${localId}:`, error);
      updateDocumentStatus(localId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Status check failed'
      });
      
      const interval = processingIntervals.current.get(localId);
      if (interval) {
        clearInterval(interval);
        processingIntervals.current.delete(localId);
      }
    }
  }, [updateDocumentStatus]);

  const processDocuments = useCallback(async () => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      console.log('Processing already in progress, skipping...');
      return;
    }

    if (backendHealth !== 'connected') {
      alert('Backend is not connected. Please check if the server is running and Ollama models are available.');
      return;
    }

    // Get pending documents at the start
    const currentDocs = documents.filter(doc => doc.status === 'pending');
    
    if (currentDocs.length === 0) {
      console.log('No pending documents to process');
      return;
    }

    // Set processing flags
    isProcessingRef.current = true;
    setIsProcessing(true);
    setRecommendation(null);

    console.log(`Starting to process ${currentDocs.length} documents...`);

    try {
      // Step 1: Upload documents
      console.log('Uploading documents...');
      const files = currentDocs.map(doc => doc.file);
      const backendIds = await apiService.uploadDocuments(files);

      console.log(`Uploaded ${backendIds.length} documents, received IDs:`, backendIds);

      // Map local IDs to backend IDs
      currentDocs.forEach((doc, index) => {
        documentIdMap.current.set(doc.id, backendIds[index]);
        console.log(`Mapped ${doc.name} (${doc.id}) to backend ID: ${backendIds[index]}`);
      });

      // Step 2: Start processing each document
      for (let i = 0; i < currentDocs.length; i++) {
        const doc = currentDocs[i];
        const backendId = backendIds[i];

        try {
          console.log(`Starting processing for ${doc.name} (${backendId})`);
          updateDocumentStatus(doc.id, { status: 'processing', progress: 0 });
          
          // Start processing on backend
          await apiService.processDocument(backendId);
          
          // Start polling for status updates
          const pollInterval = setInterval(() => {
            pollDocumentStatus(doc.id, backendId);
          }, 2000); // Poll every 2 seconds
          
          processingIntervals.current.set(doc.id, pollInterval);
          
        } catch (error) {
          console.error(`Failed to start processing for ${doc.name}:`, error);
          updateDocumentStatus(doc.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Processing failed to start'
          });
        }
      }

      // Step 3: Start checking for completion
      if (completionCheckInterval.current) {
        clearInterval(completionCheckInterval.current);
      }

      const processedDocIds = new Set(currentDocs.map(doc => doc.id));

      completionCheckInterval.current = setInterval(() => {
        setDocuments(latestDocs => {
          const processingDocs = latestDocs.filter(doc => processedDocIds.has(doc.id));
          
          const allCompleted = processingDocs.every(doc => 
            doc.status === 'completed' || doc.status === 'error'
          );
          
          const hasCompletedDocs = processingDocs.some(doc => doc.status === 'completed');

          if (allCompleted) {
            console.log('All documents completed processing');
            
            if (completionCheckInterval.current) {
              clearInterval(completionCheckInterval.current);
              completionCheckInterval.current = null;
            }
            
            if (hasCompletedDocs) {
              // Generate recommendation
              (async () => {
                try {
                  console.log('Generating credit recommendation...');
                  const completedBackendIds = processingDocs
                    .filter(doc => doc.status === 'completed')
                    .map(doc => documentIdMap.current.get(doc.id))
                    .filter(id => id) as string[];
                  
                  console.log('Completed backend IDs for recommendation:', completedBackendIds);
                  
                  const creditRec = await apiService.generateCreditRecommendation(completedBackendIds);
                  setRecommendation(creditRec);
                  console.log('Credit recommendation generated successfully');
                } catch (error) {
                  console.error('Failed to generate recommendation:', error);
                  alert(`Failed to generate recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                  setIsProcessing(false);
                  isProcessingRef.current = false;
                }
              })();
            } else {
              console.log('No completed documents for recommendation');
              setIsProcessing(false);
              isProcessingRef.current = false;
            }
          }

          return latestDocs;
        });
      }, 3000); // Check every 3 seconds

    } catch (error) {
      console.error('Processing failed:', error);
      alert(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [documents, backendHealth, pollDocumentStatus, updateDocumentStatus]);

  const resetAnalysis = useCallback(() => {
    // Clear processing flag
    isProcessingRef.current = false;
    
    // Clear all intervals
    processingIntervals.current.forEach(interval => clearInterval(interval));
    processingIntervals.current.clear();
    
    if (completionCheckInterval.current) {
      clearInterval(completionCheckInterval.current);
      completionCheckInterval.current = null;
    }
    
    // Clear ID mapping
    documentIdMap.current.clear();
    
    setDocuments([]);
    setRecommendation(null);
    setIsProcessing(false);
  }, []);

  return {
    documents,
    recommendation,
    isProcessing,
    backendHealth,
    addDocuments,
    removeDocument,
    processDocuments,
    resetAnalysis,
    checkBackendHealth
  };
};