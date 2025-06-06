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
  personalInfo: {
    name?: string;
    dateOfBirth?: string;
    address?: string;
    phone?: string;
    email?: string;
    employmentStatus?: string;
    income?: string;
  };
  financialInfo: {
    bankStatements?: BankStatement[];
    creditHistory?: CreditEntry[];
    assets?: Asset[];
    liabilities?: Liability[];
  };
  documentType: string;
  extractionDate: string;
}

export interface BankStatement {
  accountNumber: string;
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
  amount: number;
  status: 'current' | 'overdue' | 'paid';
  paymentHistory: string;
}

export interface Asset {
  type: string;
  value: number;
  description: string;
}

export interface Liability {
  type: string;
  amount: number;
  monthlyPayment: number;
  creditor: string;
}

export interface CreditRecommendation {
  score: number;
  recommendation: 'approve' | 'conditional' | 'decline';
  reasons: string[];
  conditions?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  creditLimit?: number;
  interestRate?: number;
}