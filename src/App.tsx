import React from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ProcessingStatus from './components/ProcessingStatus';
import AnalysisResults from './components/AnalysisResults';
import { useDocumentProcessing } from './hooks/useDocumentProcessing';

function App() {
  const {
    documents,
    recommendation,
    isProcessing,
    backendHealth,
    addDocuments,
    removeDocument,
    processDocuments,
    resetAnalysis,
    checkBackendHealth
  } = useDocumentProcessing();

  const hasResults = documents.some(doc => doc.status === 'completed') || recommendation;
  const isGeneratingRecommendation = isProcessing && documents.every(doc => 
    doc.status === 'completed' || doc.status === 'error'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header 
        onReset={resetAnalysis} 
        hasDocuments={documents.length > 0}
        backendHealth={backendHealth}
        onHealthCheck={checkBackendHealth}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI-Powered Credit Analysis
            </h2>
            <p className="text-lg text-gray-600">
              Upload multiple business documents for comprehensive credit assessment. Our AI analyzes 
              financial statements, bank records, and corporate documents using advanced 
              vision models to provide instant credit recommendations with detailed insights.
            </p>
          </div>

          {/* Backend Status Warning */}
          {backendHealth !== 'connected' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Backend Connection Issue</h3>
                  <p className="text-yellow-700 text-sm">
                    {backendHealth === 'disconnected' 
                      ? 'Cannot connect to the backend server. Please ensure the server is running on port 8000.'
                      : 'Backend server encountered an error. Please check if Ollama is running and the required models are available.'
                    }
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Required: <code>ollama pull qwen2.5vl:7b</code> and <code>ollama pull deepseek-r1:8b</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <FileUpload
              documents={documents}
              onDocumentsAdd={addDocuments}
              onDocumentRemove={removeDocument}
              onProcess={processDocuments}
              isProcessing={isProcessing}
            />
          </div>

          {/* Processing Status */}
          <ProcessingStatus 
            documents={documents} 
            isGeneratingRecommendation={isGeneratingRecommendation}
          />

          {/* Analysis Results */}
          {hasResults && (
            <AnalysisResults 
              documents={documents} 
              recommendation={recommendation}
            />
          )}

          {/* Setup Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              System Requirements
            </h3>
            <div className="text-blue-700 space-y-2">
              <p><strong>Backend Server:</strong> Node.js server running on port 8000</p>
              <p><strong>Ollama Models Required:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>qwen2.5vl:7b</code> - For document vision processing</li>
                <li><code>deepseek-r1:8b</code> - For credit analysis and insights</li>
              </ul>
              <p className="mt-3">
                <strong>Setup Commands:</strong>
              </p>
              <div className="bg-blue-100 rounded p-2 font-mono text-sm">
                ollama pull qwen2.5vl:7b<br/>
                ollama pull deepseek-r1:8b<br/>
                npm run dev:full
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;