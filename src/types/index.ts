export interface DocumentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedData?: ExtractedData;
  error?: string;
}

export interface ExtractedData {
  documentType: string;
  companyInfo: {
    name?: string;
    registrationNumber?: string;
    address?: string;
    industry?: string;
    establishmentDate?: string;
    legalStructure?: string;
  };
  personalInfo: {
    individuals: Array<{
      name: string;
      position: string;
      address?: string;
      phone?: string;
      email?: string;
      ownershipPercentage?: number;
    }>;
  };
  financialInfo: {
    profitLoss: {
      revenue?: number;
      expenses?: number;
      netIncome?: number;
      period?: string;
    };
    balanceSheet: {
      totalAssets?: number;
      totalLiabilities?: number;
      equity?: number;
      asOfDate?: string;
    };
    bankStatements: BankStatement[];
    creditInfo: {
      creditScore?: number;
      creditHistory: CreditEntry[];
    };
    cashFlow: {
      operatingCashFlow?: number;
      investingCashFlow?: number;
      financingCashFlow?: number;
      period?: string;
    };
  };
  extractionDate: string;
  confidence: number;
}

export interface BankStatement {
  accountNumber: string;
  accountType: string;
  balance: number;
  transactions: Transaction[];
  period: string;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

export interface CreditEntry {
  creditor: string;
  accountType: string;
  balance: number;
  paymentStatus: string;
  monthlyPayment?: number;
}

export interface GroupedFinancialData {
  profitLossStatements: ProfitLossStatement[];
  balanceSheets: BalanceSheetStatement[];
  bankStatements: BankStatementSummary[];
  creditReports: CreditReport[];
  cashFlowStatements: CashFlowStatement[];
  otherDocuments: OtherDocument[];
  summary: {
    totalDocuments: number;
    documentTypes: string[];
    periods: string[];
    companies: string[];
  };
}

export interface ProfitLossStatement {
  period: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  grossProfit: number;
  sourceFile: string;
  extractionDate: string;
  confidence: number;
  companyName: string;
}

export interface BalanceSheetStatement {
  asOfDate: string;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  netWorth: number;
  debtToAssetRatio: number;
  sourceFile: string;
  extractionDate: string;
  confidence: number;
  companyName: string;
}

export interface BankStatementSummary {
  period: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  transactionCount: number;
  totalCredits: number;
  totalDebits: number;
  averageBalance: number;
  sourceFile: string;
  extractionDate: string;
  confidence: number;
  companyName: string;
  transactions: Transaction[];
}

export interface CreditReport {
  reportDate: string;
  creditScore: number;
  creditHistory: CreditEntry[];
  totalCreditAccounts: number;
  totalCreditBalance: number;
  sourceFile: string;
  extractionDate: string;
  confidence: number;
  companyName: string;
}

export interface CashFlowStatement {
  period: string;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  sourceFile: string;
  extractionDate: string;
  confidence: number;
  companyName: string;
}

export interface OtherDocument {
  documentType: string;
  sourceFile: string;
  extractionDate: string;
  data: ExtractedData;
}

export interface FinancialTrend {
  trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  changePercent: number;
  periods: string[];
  firstValue?: number;
  lastValue?: number;
  label?: string;
}

export interface MultiPeriodAnalysis {
  periodsAnalyzed: string[];
  consistencyScore: number;
  dataQuality: 'excellent' | 'good' | 'limited';
  keyInsights: string[];
  recommendations: string[];
}

export interface CreditRecommendation {
  score: number;
  recommendation: 'approve' | 'conditional' | 'decline';
  riskLevel: 'low' | 'medium' | 'high';
  creditLimit?: number;
  interestRate?: number;
  
  // Enhanced analysis from Ollama
  businessOverview?: {
    companyProfile: string;
    industryAnalysis: string;
    managementAssessment: string;
    businessModelEvaluation: string;
  };
  financialAnalysis?: {
    revenueAnalysis: string;
    profitabilityAssessment: string;
    balanceSheetStrength: string;
    cashFlowAnalysis: string;
    debtCapacity: string;
  };
  creditRiskAssessment?: {
    paymentHistoryEvaluation: string;
    debtRatios: string;
    liquidityPosition: string;
    overallCreditworthiness: string;
  };
  
  // Insights and recommendations
  keyStrengths: string[];
  keyWeaknesses: string[];
  riskFactors: string[];
  mitigationStrategies: string[];
  
  // Detailed reasoning
  reasons: string[];
  conditions?: string[];
  
  // Summary and metadata
  executiveSummary?: string;
  confidenceLevel?: number;
  analysisDate: string;
  documentsAnalyzed: number;
  
  // Document breakdown
  documentSummary?: {
    totalDocuments: number;
    documentTypes: string[];
    companiesAnalyzed: string[];
    individualsIdentified: string[];
    timePeriodsAnalyzed: string[];
  };
  
  // Financial metrics
  financialMetrics?: {
    totalRevenue: number;
    totalAssets: number;
    totalLiabilities: number;
    netIncome: number;
    operatingCashFlow: number;
    debtToAssetRatio: number;
    profitMargin: number;
    returnOnAssets: number;
  };

  // NEW: Grouped financial data for table display
  groupedFinancialData?: GroupedFinancialData;
  
  // NEW: Financial trends analysis
  financialTrends?: {
    revenue: FinancialTrend;
    profitability: FinancialTrend;
    assets: FinancialTrend;
    liquidity: FinancialTrend;
  };
  
  // NEW: Multi-period analysis
  multiPeriodAnalysis?: MultiPeriodAnalysis;
}