import React from 'react';
import { User, DollarSign, CreditCard, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { DocumentFile, CreditRecommendation } from '../types';

interface AnalysisResultsProps {
  documents: DocumentFile[];
  recommendation: CreditRecommendation | null;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ documents, recommendation }) => {
  const completedDocs = documents.filter(doc => doc.status === 'completed');
  
  if (completedDocs.length === 0) {
    return null;
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'approve': return 'text-green-600 bg-green-100';
      case 'conditional': return 'text-yellow-600 bg-yellow-100';
      case 'decline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'approve': return <CheckCircle className="w-6 h-6" />;
      case 'conditional': return <AlertTriangle className="w-6 h-6" />;
      case 'decline': return <XCircle className="w-6 h-6" />;
      default: return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900">Analysis Results</h3>

      {/* Credit Recommendation Summary */}
      {recommendation && (
        <div className="bg-white rounded-xl p-6 shadow-lg border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {getRecommendationIcon(recommendation.recommendation)}
              <h4 className="text-xl font-semibold text-gray-900">Credit Decision</h4>
            </div>
            <div className={`px-4 py-2 rounded-full font-medium capitalize ${getRecommendationColor(recommendation.recommendation)}`}>
              {recommendation.recommendation}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700">Credit Score</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{recommendation.score}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-700">Risk Level</span>
              </div>
              <div className={`text-lg font-semibold capitalize ${getRiskColor(recommendation.riskLevel)}`}>
                {recommendation.riskLevel}
              </div>
            </div>

            {recommendation.creditLimit && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-700">Credit Limit</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  ${recommendation.creditLimit.toLocaleString()}
                </div>
              </div>
            )}

            {recommendation.interestRate && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-700">Interest Rate</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {recommendation.interestRate}%
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Reasons for Decision:</h5>
              <ul className="space-y-1">
                {recommendation.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {recommendation.conditions && recommendation.conditions.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Conditions:</h5>
                <ul className="space-y-1">
                  {recommendation.conditions.map((condition, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0" />
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extracted Data from Documents */}
      <div className="grid gap-6">
        {completedDocs.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl p-6 shadow-lg border">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Extracted Data from {doc.name}
            </h4>

            {doc.extractedData && (
              <div className="space-y-6">
                {/* Personal Information */}
                {doc.extractedData.personalInfo && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <h5 className="font-semibold text-gray-900">Personal Information</h5>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(doc.extractedData.personalInfo).map(([key, value]) => (
                        value && (
                          <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <span className="text-sm font-medium text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <div className="text-gray-900">{value}</div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Information */}
                {doc.extractedData.financialInfo && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h5 className="font-semibold text-gray-900">Financial Information</h5>
                    </div>

                    {/* Bank Statements */}
                    {doc.extractedData.financialInfo.bankStatements && (
                      <div className="mb-4">
                        <h6 className="font-medium text-gray-800 mb-2">Bank Statements</h6>
                        {doc.extractedData.financialInfo.bankStatements.map((statement, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Account: {statement.accountNumber}</span>
                              <span className="text-lg font-bold text-green-600">
                                ${statement.balance.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">Period: {statement.period}</p>
                            <p className="text-sm text-gray-600">
                              {statement.transactions.length} transactions
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Assets and Liabilities */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {doc.extractedData.financialInfo.assets && (
                        <div>
                          <h6 className="font-medium text-gray-800 mb-2">Assets</h6>
                          {doc.extractedData.financialInfo.assets.map((asset, index) => (
                            <div key={index} className="bg-green-50 rounded-lg p-3 mb-2">
                              <div className="flex justify-between">
                                <span className="font-medium">{asset.type}</span>
                                <span className="text-green-600 font-bold">
                                  ${asset.value.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{asset.description}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {doc.extractedData.financialInfo.liabilities && (
                        <div>
                          <h6 className="font-medium text-gray-800 mb-2">Liabilities</h6>
                          {doc.extractedData.financialInfo.liabilities.map((liability, index) => (
                            <div key={index} className="bg-red-50 rounded-lg p-3 mb-2">
                              <div className="flex justify-between">
                                <span className="font-medium">{liability.type}</span>
                                <span className="text-red-600 font-bold">
                                  ${liability.amount.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Monthly: ${liability.monthlyPayment.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">Creditor: {liability.creditor}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-4 border-t">
                  Document Type: {doc.extractedData.documentType} | 
                  Extracted: {new Date(doc.extractedData.extractionDate).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisResults;