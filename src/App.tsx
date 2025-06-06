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
    addDocuments,
    removeDocument,
    processDocuments,
    resetAnalysis
  } = useDocumentProcessing();

  const hasResults = documents.some(doc => doc.status === 'completed') || recommendation;
  const isGeneratingRecommendation = isProcessing && documents.every(doc => 
    doc.status === 'completed' || doc.status === 'error'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header onReset={resetAnalysis} hasDocuments={documents.length > 0} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI-Powered Credit Analysis
            </h2>
            <p className="text-lg text-gray-600">
              Upload multiple documents for comprehensive credit assessment. Our AI analyzes 
              bank statements, tax returns, and other financial documents using advanced 
              vision models to provide instant credit recommendations.
            </p>
          </div>

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

          {/* Backend Integration Instructions */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-3">
              Backend Integration Instructions
            </h3>
            <div className="text-amber-700 space-y-2">
              <p><strong>API Endpoints needed:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>POST /upload</code> - Upload multiple documents</li>
                <li><code>POST /process/:id</code> - Process document with Ollama qwen2.5vl:7b</li>
                <li><code>GET /status/:id</code> - Check processing status</li>
                <li><code>POST /recommend</code> - Generate credit recommendation</li>
              </ul>
              <p className="mt-3">
                <strong>Note:</strong> This frontend is currently using mock data. 
                Update the API service to connect to your actual backend endpoints.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;