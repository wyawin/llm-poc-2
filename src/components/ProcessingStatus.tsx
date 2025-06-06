import React from 'react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DocumentFile } from '../types';

interface ProcessingStatusProps {
  documents: DocumentFile[];
  isGeneratingRecommendation: boolean;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ 
  documents, 
  isGeneratingRecommendation 
}) => {
  const processingDocs = documents.filter(doc => doc.status === 'processing');
  const completedDocs = documents.filter(doc => doc.status === 'completed');
  const errorDocs = documents.filter(doc => doc.status === 'error');
  
  if (processingDocs.length === 0 && !isGeneratingRecommendation) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <h3 className="text-lg font-semibold text-gray-900">Processing Status</h3>
      </div>

      <div className="space-y-4">
        {/* Document Processing Status */}
        {processingDocs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="font-medium text-gray-900">Processing {doc.name}</span>
            </div>
            <div className="text-sm text-blue-600 font-medium">{Math.round(doc.progress)}%</div>
          </div>
        ))}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Processing</span>
            </div>
            <div className="text-lg font-bold text-blue-600">{processingDocs.length}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Completed</span>
            </div>
            <div className="text-lg font-bold text-green-600">{completedDocs.length}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Errors</span>
            </div>
            <div className="text-lg font-bold text-red-600">{errorDocs.length}</div>
          </div>
        </div>

        {/* Recommendation Generation Status */}
        {isGeneratingRecommendation && (
          <div className="flex items-center justify-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <Loader2 className="w-5 h-5 text-green-600 animate-spin mr-3" />
            <span className="font-medium text-gray-900">Generating credit recommendation...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingStatus;