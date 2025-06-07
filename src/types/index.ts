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
}