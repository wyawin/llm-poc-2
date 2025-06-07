import React from 'react';
import { User, DollarSign, CreditCard, TrendingUp, AlertTriangle, CheckCircle, XCircle, Building, Users, FileText, BarChart3 } from 'lucide-react';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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

  // Helper function to render financial data in table format
  const renderFinancialTable = (data: any, title: string, type: 'profitLoss' | 'balanceSheet' | 'cashFlow') => {
    if (!data || Object.keys(data).length === 0) return null;

    const getTableHeaders = () => {
      switch (type) {
        case 'profitLoss':
          return ['Item', 'Amount', 'Period'];
        case 'balanceSheet':
          return ['Item', 'Amount', 'As of Date'];
        case 'cashFlow':
          return ['Item', 'Amount', 'Period'];
        default:
          return ['Item', 'Value'];
      }
    };

    const getTableRows = () => {
      const rows = [];
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          const displayKey = key.replace(/([A-Z])/g, ' $1').trim()
            .replace(/^./, str => str.toUpperCase());
          
          if (type === 'profitLoss') {
            if (key === 'period') return;
            rows.push([
              displayKey,
              typeof value === 'number' ? formatCurrency(value) : value,
              data.period || 'N/A'
            ]);
          } else if (type === 'balanceSheet') {
            if (key === 'asOfDate') return;
            rows.push([
              displayKey,
              typeof value === 'number' ? formatCurrency(value) : value,
              data.asOfDate || 'N/A'
            ]);
          } else if (type === 'cashFlow') {
            if (key === 'period') return;
            rows.push([
              displayKey,
              typeof value === 'number' ? formatCurrency(value) : value,
              data.period || 'N/A'
            ]);
          } else {
            rows.push([
              displayKey,
              typeof value === 'number' ? formatCurrency(value) : value
            ]);
          }
        }
      });
      
      return rows;
    };

    const headers = getTableHeaders();
    const rows = getTableRows();

    if (rows.length === 0) return null;

    return (
      <div className="mb-6">
        <h6 className="font-medium text-gray-800 mb-3">{title}</h6>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900 border-b">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Helper function to render bank statements table
  const renderBankStatementsTable = (statements: any[]) => {
    if (!statements || statements.length === 0) return null;

    return (
      <div className="mb-6">
        <h6 className="font-medium text-gray-800 mb-3">Bank Statements</h6>
        <div className="space-y-4">
          {statements.map((statement, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900">Account: {statement.accountNumber}</span>
                    <span className="ml-4 text-sm text-gray-600">Type: {statement.accountType}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      Balance: {formatCurrency(statement.balance)}
                    </div>
                    <div className="text-sm text-gray-600">Period: {statement.period}</div>
                  </div>
                </div>
              </div>
              
              {statement.transactions && statement.transactions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {statement.transactions.slice(0, 10).map((transaction: any, txIndex: number) => (
                        <tr key={txIndex} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{transaction.date}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{transaction.description}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'credit' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-medium">
                            <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {statement.transactions.length > 10 && (
                    <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                      Showing 10 of {statement.transactions.length} transactions
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to render credit history table
  const renderCreditHistoryTable = (creditHistory: any[]) => {
    if (!creditHistory || creditHistory.length === 0) return null;

    return (
      <div className="mb-6">
        <h6 className="font-medium text-gray-800 mb-3">Credit History</h6>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creditor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {creditHistory.map((credit, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{credit.creditor}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{credit.accountType}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(credit.balance)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      credit.paymentStatus?.toLowerCase().includes('current') || credit.paymentStatus?.toLowerCase().includes('good')
                        ? 'bg-green-100 text-green-800'
                        : credit.paymentStatus?.toLowerCase().includes('late') || credit.paymentStatus?.toLowerCase().includes('overdue')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {credit.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {credit.monthlyPayment ? formatCurrency(credit.monthlyPayment) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
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

          {/* Key Metrics */}
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
                  {formatCurrency(recommendation.creditLimit)}
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

          {/* Executive Summary */}
          {recommendation.executiveSummary && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-semibold text-gray-900 mb-2">Executive Summary</h5>
              <p className="text-gray-700">{recommendation.executiveSummary}</p>
            </div>
          )}

          {/* Enhanced Analysis Sections */}
          {recommendation.businessOverview && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-5 h-5 text-blue-600" />
                <h5 className="font-semibold text-gray-900">Business Overview</h5>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h6 className="font-medium text-gray-800 mb-1">Company Profile</h6>
                  <p className="text-sm text-gray-700">{recommendation.businessOverview.companyProfile}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h6 className="font-medium text-gray-800 mb-1">Industry Analysis</h6>
                  <p className="text-sm text-gray-700">{recommendation.businessOverview.industryAnalysis}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h6 className="font-medium text-gray-800 mb-1">Management Assessment</h6>
                  <p className="text-sm text-gray-700">{recommendation.businessOverview.managementAssessment}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h6 className="font-medium text-gray-800 mb-1">Business Model</h6>
                  <p className="text-sm text-gray-700">{recommendation.businessOverview.businessModelEvaluation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Analysis */}
          {recommendation.financialAnalysis && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <h5 className="font-semibold text-gray-900">Financial Analysis</h5>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h6 className="font-medium text-gray-800 mb-1">Revenue Analysis</h6>
                  <p className="text-sm text-gray-700">{recommendation.financialAnalysis.revenueAnalysis}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h6 className="font-medium text-gray-800 mb-1">Profitability</h6>
                  <p className="text-sm text-gray-700">{recommendation.financialAnalysis.profitabilityAssessment}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h6 className="font-medium text-gray-800 mb-1">Balance Sheet</h6>
                  <p className="text-sm text-gray-700">{recommendation.financialAnalysis.balanceSheetStrength}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h6 className="font-medium text-gray-800 mb-1">Cash Flow</h6>
                  <p className="text-sm text-gray-700">{recommendation.financialAnalysis.cashFlowAnalysis}</p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Metrics */}
          {recommendation.financialMetrics && (
            <div className="mb-6">
              <h5 className="font-semibold text-gray-900 mb-3">Key Financial Metrics</h5>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(recommendation.financialMetrics.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(recommendation.financialMetrics.totalAssets)}
                  </div>
                  <div className="text-sm text-gray-600">Total Assets</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {(recommendation.financialMetrics.profitMargin * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Profit Margin</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {(recommendation.financialMetrics.debtToAssetRatio * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Debt-to-Asset</div>
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Key Strengths
              </h5>
              <ul className="space-y-1">
                {recommendation.keyStrengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                Areas of Concern
              </h5>
              <ul className="space-y-1">
                {recommendation.keyWeaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk Factors and Mitigation */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Risk Factors
              </h5>
              <ul className="space-y-1">
                {recommendation.riskFactors.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Mitigation Strategies
              </h5>
              <ul className="space-y-1">
                {recommendation.mitigationStrategies.map((strategy, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    {strategy}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Conditions */}
          {recommendation.conditions && recommendation.conditions.length > 0 && (
            <div className="mb-6">
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

          {/* Document Summary */}
          {recommendation.documentSummary && (
            <div className="pt-4 border-t">
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                Document Analysis Summary
              </h5>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Documents Analyzed:</span>
                  <div className="text-gray-600">{recommendation.documentSummary.totalDocuments}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Document Types:</span>
                  <div className="text-gray-600">{recommendation.documentSummary.documentTypes.join(', ')}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Companies:</span>
                  <div className="text-gray-600">{recommendation.documentSummary.companiesAnalyzed.join(', ')}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Confidence:</span>
                  <div className="text-gray-600">{((recommendation.confidenceLevel || 0) * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          )}
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
                {/* Company Information */}
                {doc.extractedData.companyInfo && Object.keys(doc.extractedData.companyInfo).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="w-5 h-5 text-blue-600" />
                      <h5 className="font-semibold text-gray-900">Company Information</h5>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.entries(doc.extractedData.companyInfo).map(([key, value]) => (
                            value && (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{value}</td>
                              </tr>
                            )
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Personal Information */}
                {doc.extractedData.personalInfo?.individuals && doc.extractedData.personalInfo.individuals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <h5 className="font-semibold text-gray-900">Key Personnel</h5>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ownership %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {doc.extractedData.personalInfo.individuals.map((individual, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{individual.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{individual.position || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{individual.address || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-700">
                                {individual.ownershipPercentage ? `${individual.ownershipPercentage}%` : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

                    {/* Profit & Loss Table */}
                    {renderFinancialTable(
                      doc.extractedData.financialInfo.profitLoss,
                      'Profit & Loss Statement',
                      'profitLoss'
                    )}

                    {/* Balance Sheet Table */}
                    {renderFinancialTable(
                      doc.extractedData.financialInfo.balanceSheet,
                      'Balance Sheet',
                      'balanceSheet'
                    )}

                    {/* Cash Flow Table */}
                    {renderFinancialTable(
                      doc.extractedData.financialInfo.cashFlow,
                      'Cash Flow Statement',
                      'cashFlow'
                    )}

                    {/* Bank Statements Table */}
                    {renderBankStatementsTable(doc.extractedData.financialInfo.bankStatements)}

                    {/* Credit Information */}
                    {doc.extractedData.financialInfo.creditInfo && (
                      <div className="mb-6">
                        {doc.extractedData.financialInfo.creditInfo.creditScore && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                            <h6 className="font-medium text-gray-800 mb-2">Credit Score</h6>
                            <div className="text-2xl font-bold text-blue-600">
                              {doc.extractedData.financialInfo.creditInfo.creditScore}
                            </div>
                          </div>
                        )}
                        
                        {renderCreditHistoryTable(doc.extractedData.financialInfo.creditInfo.creditHistory)}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-4 border-t">
                  Document Type: {doc.extractedData.documentType} | 
                  Confidence: {(doc.extractedData.confidence * 100).toFixed(0)}% |
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