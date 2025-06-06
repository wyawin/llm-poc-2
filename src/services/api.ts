import { DocumentFile, CreditRecommendation } from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://34.101.179.14:3001';

class ApiService {
  async uploadDocuments(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`document_${index}`, file);
    });

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.document_ids;
  }

  async processDocument(documentId: string): Promise<DocumentFile['extractedData']> {
    const response = await fetch(`${API_BASE_URL}/process/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getProcessingStatus(documentId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/status/${documentId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async generateCreditRecommendation(documentIds: string[]): Promise<CreditRecommendation> {
    const response = await fetch(`${API_BASE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ document_ids: documentIds }),
    });

    if (!response.ok) {
      throw new Error(`Recommendation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Mock API for development/testing
  async mockUploadDocuments(files: File[]): Promise<string[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return files.map((_, index) => `doc_${Date.now()}_${index}`);
  }

  async mockProcessDocument(documentId: string): Promise<DocumentFile['extractedData']> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      personalInfo: {
        name: "John Doe",
        dateOfBirth: "1985-03-15",
        address: "123 Main St, Anytown, ST 12345",
        phone: "(555) 123-4567",
        email: "john.doe@email.com",
        employmentStatus: "Full-time",
        income: "$75,000/year"
      },
      financialInfo: {
        bankStatements: [{
          accountNumber: "****1234",
          balance: 15000,
          transactions: [
            { date: "2024-01-15", description: "Salary Deposit", amount: 3500, type: 'credit' },
            { date: "2024-01-10", description: "Rent Payment", amount: -1200, type: 'debit' },
            { date: "2024-01-08", description: "Grocery Store", amount: -150, type: 'debit' }
          ],
          period: "January 2024"
        }],
        assets: [
          { type: "Savings Account", value: 15000, description: "Primary savings" },
          { type: "Investment Portfolio", value: 25000, description: "Mixed portfolio" }
        ],
        liabilities: [
          { type: "Credit Card", amount: 3500, monthlyPayment: 150, creditor: "Chase Bank" },
          { type: "Auto Loan", amount: 12000, monthlyPayment: 350, creditor: "Wells Fargo" }
        ]
      },
      documentType: "Bank Statement",
      extractionDate: new Date().toISOString()
    };
  }

  async mockGenerateCreditRecommendation(): Promise<CreditRecommendation> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      score: 720,
      recommendation: 'approve',
      reasons: [
        "Strong employment history with stable income",
        "Good payment history on existing credit accounts",
        "Debt-to-income ratio within acceptable range",
        "Sufficient liquid assets for emergency coverage"
      ],
      riskLevel: 'low',
      creditLimit: 25000,
      interestRate: 14.99
    };
  }
}

export const apiService = new ApiService();