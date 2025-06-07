import React from 'react';
import { User, DollarSign, CreditCard, TrendingUp, AlertTriangle, CheckCircle, XCircle, Building, Users, FileText, BarChart3, Calendar, TrendingDown } from 'lucide-react';
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <BarChart3 className="w-4 h-4 text-blue-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600 bg-green-50';
      case 'decreasing': return 'text-red-600 bg-red-50';
      case 'stable': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
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

          {/* Financial Trends Analysis */}
          {recommendation.financialTrends && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h5 className="font-semibold text-gray-900">Financial Trends Analysis</h5>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(recommendation.financialTrends).map(([key, trend]) => (
                  <div key={key} className={`p-3 rounded-lg ${getTrendColor(trend.trend)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {getTrendIcon(trend.trend)}
                      <span className="font-medium text-sm capitalize">{trend.label || key}</span>
                    </div>
                    <div className="text-lg font-bold">
                      {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                    </div>
                    <div className="text-xs opacity-75 capitalize">{trend.trend}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Period Analysis Summary */}
          {recommendation.multiPeriodAnalysis && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h5 className="font-semibold text-gray-900">Multi-Period Analysis</h5>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700">Periods Analyzed</div>
                  <div className="text-lg font-bold text-purple-600">
                    {recommendation.multiPeriodAnalysis.periodsAnalyzed.length}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700">Data Quality</div>
                  <div className="text-lg font-bold text-purple-600 capitalize">
                    {recommendation.multiPeriodAnalysis.dataQuality}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700">Consistency Score</div>
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(recommendation.multiPeriodAnalysis.consistencyScore * 100)}%
                  </div>
                </div>
              </div>
              {recommendation.multiPeriodAnalysis.keyInsights.length > 0 && (
                <div className="mt-3">
                  <h6 className="font-medium text-gray-800 mb-2">Key Insights:</h6>
                  <ul className="space-y-1">
                    {recommendation.multiPeriodAnalysis.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Grouped Financial Data Tables */}
          {recommendation.groupedFinancialData && (
            <div className="mb-6">
              <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Financial Statements Summary
              </h5>

              {/* Profit & Loss Statements Table */}
              {recommendation.groupedFinancialData.profitLossStatements.length > 0 && (
                <div className="mb-6">
                  <h6 className="font-medium text-gray-800 mb-3">Profit & Loss Statements</h6>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Period</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Revenue</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Expenses</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Net Income</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Gross Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendation.groupedFinancialData.profitLossStatements.map((statement, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-900">{statement.period}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(statement.revenue)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(statement.expenses)}</td>
                            <td className={`px-4 py-2 text-sm text-right font-medium ${statement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(statement.netIncome)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(statement.grossProfit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Balance Sheets Table */}
              {recommendation.groupedFinancialData.balanceSheets.length > 0 && (
                <div className="mb-6">
                  <h6 className="font-medium text-gray-800 mb-3">Balance Sheets</h6>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">As of Date</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total Assets</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total Liabilities</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Equity</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Net Worth</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Debt Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendation.groupedFinancialData.balanceSheets.map((sheet, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-900">{sheet.asOfDate}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(sheet.totalAssets)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(sheet.totalLiabilities)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(sheet.equity)}</td>
                            <td className={`px-4 py-2 text-sm text-right font-medium ${sheet.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(sheet.netWorth)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{(sheet.debtToAssetRatio * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bank Statements Summary */}
              {recommendation.groupedFinancialData.bankStatements.length > 0 && (
                <div className="mb-6">
                  <h6 className="font-medium text-gray-800 mb-3">Bank Statements Summary</h6>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Period</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Account</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Balance</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total Credits</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total Debits</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendation.groupedFinancialData.bankStatements.map((statement, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-900">{statement.period}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{statement.accountNumber}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{statement.accountType}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(statement.balance)}</td>
                            <td className="px-4 py-2 text-sm text-green-600 text-right">{formatCurrency(statement.totalCredits)}</td>
                            <td className="px-4 py-2 text-sm text-red-600 text-right">{formatCurrency(statement.totalDebits)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{statement.transactionCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(doc.extractedData.companyInfo).map(([key, value]) => (
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

                {/* Personal Information */}
                {doc.extractedData.personalInfo?.individuals && doc.extractedData.personalInfo.individuals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <h5 className="font-semibold text-gray-900">Key Personnel</h5>
                    </div>
                    <div className="grid gap-4">
                      {doc.extractedData.personalInfo.individuals.map((individual, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-gray-900">{individual.name}</div>
                            <div className="text-sm text-gray-600">{individual.position}</div>
                          </div>
                          {individual.ownershipPercentage && (
                            <div className="text-sm text-gray-600">
                              Ownership: {individual.ownershipPercentage}%
                            </div>
                          )}
                        </div>
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

                    {/* Profit & Loss */}
                    {doc.extractedData.financialInfo.profitLoss && Object.keys(doc.extractedData.financialInfo.profitLoss).length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-medium text-gray-800 mb-2">Profit & Loss</h6>
                        <div className="grid md:grid-cols-3 gap-4">
                          {Object.entries(doc.extractedData.financialInfo.profitLoss).map(([key, value]) => (
                            value && (
                              <div key={key} className="bg-green-50 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-600 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  {typeof value === 'number' ? formatCurrency(value) : value}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Balance Sheet */}
                    {doc.extractedData.financialInfo.balanceSheet && Object.keys(doc.extractedData.financialInfo.balanceSheet).length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-medium text-gray-800 mb-2">Balance Sheet</h6>
                        <div className="grid md:grid-cols-3 gap-4">
                          {Object.entries(doc.extractedData.financialInfo.balanceSheet).map(([key, value]) => (
                            value && (
                              <div key={key} className="bg-blue-50 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-600 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="text-lg font-bold text-blue-600">
                                  {typeof value === 'number' ? formatCurrency(value) : value}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bank Statements */}
                    {doc.extractedData.financialInfo.bankStatements && doc.extractedData.financialInfo.bankStatements.length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-medium text-gray-800 mb-2">Bank Statements</h6>
                        {doc.extractedData.financialInfo.bankStatements.map((statement, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Account: {statement.accountNumber}</span>
                              <span className="text-lg font-bold text-green-600">
                                {formatCurrency(statement.balance)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">Type: {statement.accountType}</p>
                            <p className="text-sm text-gray-600">Period: {statement.period}</p>
                            <p className="text-sm text-gray-600">
                              {statement.transactions.length} transactions
                            </p>
                          </div>
                        ))}
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