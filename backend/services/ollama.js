export class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.visionModel = 'qwen2.5vl:7b';
    this.analysisModel = 'deepseek-r1:8b';
  }

  async extractDataFromImage(imagePath) {
    try {
      console.log(`Extracting data from image: ${imagePath}`);
      
      // Read image file and convert to base64
      const fs = await import('fs/promises');
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const prompt = `You are a financial document analysis expert. Analyze this document image and extract all relevant financial and business information in a structured JSON format.

This document could be one of the following types:
- Profit and Loss Statement
- Balance Sheet
- Bank Statement
- Credit History Report
- Deed of Establishment
- Director and Shareholder List
- Tax Returns
- Financial Reports

Please extract the following information if available:
1. Document Type: Identify the specific type of document
2. Company Information: name, registration number, address, industry
3. Personal Information: names, positions, addresses, contact details
4. Financial Data: revenues, expenses, assets, liabilities, cash flows, account balances
5. Credit Information: credit scores, payment history, outstanding debts
6. Ownership Structure: directors, shareholders, ownership percentages
7. Business Operations: business activities, establishment date, legal structure

IMPORTANT: For financial statements with multiple periods, extract ALL periods found in the document.

Return ONLY a valid JSON object with this exact structure:
{
  "documentType": "string (specific document type)",
  "companyInfo": {
    "name": "string or null",
    "registrationNumber": "string or null",
    "address": "string or null",
    "industry": "string or null",
    "establishmentDate": "string or null",
    "legalStructure": "string or null"
  },
  "personalInfo": {
    "individuals": [
      {
        "name": "string",
        "position": "string",
        "address": "string or null",
        "phone": "string or null",
        "email": "string or null",
        "ownershipPercentage": "number or null"
      }
    ]
  },
  "financialInfo": {
    "profitLoss": {
      "revenue": "number or null",
      "expenses": "number or null",
      "netIncome": "number or null",
      "period": "string or null"
    },
    "balanceSheet": {
      "totalAssets": "number or null",
      "totalLiabilities": "number or null",
      "equity": "number or null",
      "asOfDate": "string or null"
    },
    "bankStatements": [
      {
        "accountNumber": "string",
        "accountType": "string",
        "balance": "number",
        "transactions": [
          {
            "date": "string",
            "description": "string", 
            "amount": "number",
            "type": "credit or debit"
          }
        ],
        "period": "string"
      }
    ],
    "creditInfo": {
      "creditScore": "number or null",
      "creditHistory": [
        {
          "creditor": "string",
          "accountType": "string",
          "balance": "number",
          "paymentStatus": "string",
          "monthlyPayment": "number or null"
        }
      ]
    },
    "cashFlow": {
      "operatingCashFlow": "number or null",
      "investingCashFlow": "number or null",
      "financingCashFlow": "number or null",
      "period": "string or null"
    }
  },
  "extractionDate": "ISO date string",
  "confidence": "number (0-1)"
}

Only return valid JSON. If information is not available, use null for strings/numbers and empty arrays for arrays.`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.visionModel,
          prompt: prompt,
          images: [base64Image],
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Raw Ollama vision response length:', result.response?.length);
      
      // Parse the JSON response from Ollama
      let extractedData;
      try {
        const responseText = result.response.trim();
        console.log('Vision response preview:', responseText.substring(0, 300) + '...');
        
        // Try multiple JSON extraction methods
        extractedData = this.parseJsonFromResponse(responseText);
        
      } catch (parseError) {
        console.error('Failed to parse Ollama vision response:', parseError);
        console.log('Full raw response:', result.response);
        
        // Return a default structure if parsing fails
        extractedData = {
          documentType: "Unknown",
          companyInfo: {},
          personalInfo: { individuals: [] },
          financialInfo: {
            profitLoss: {},
            balanceSheet: {},
            bankStatements: [],
            creditInfo: { creditHistory: [] },
            cashFlow: {}
          },
          extractionDate: new Date().toISOString(),
          confidence: 0.1,
          rawResponse: result.response,
          parseError: parseError.message
        };
      }

      // Ensure required fields are set
      if (!extractedData.extractionDate) {
        extractedData.extractionDate = new Date().toISOString();
      }

      if (typeof extractedData.confidence !== 'number') {
        extractedData.confidence = 0.5;
      }

      console.log(`Successfully extracted data from image: ${imagePath}`);
      return extractedData;

    } catch (error) {
      console.error('Ollama extraction error:', error);
      throw new Error(`Failed to extract data from image: ${error.message}`);
    }
  }

  async generateCreditInsights(allExtractedData, groupedFinancialData) {
    try {
      console.log('Generating comprehensive credit insights using deepseek-r1:8b');

      const prompt = `You are a senior credit analyst and financial expert. Analyze the following comprehensive business and financial data to provide detailed credit insights and recommendations.

EXTRACTED DATA FROM MULTIPLE DOCUMENTS:
${JSON.stringify(allExtractedData, null, 2)}

GROUPED FINANCIAL DATA BY TYPE AND PERIOD:
${JSON.stringify(groupedFinancialData, null, 2)}

Please provide a comprehensive analysis that includes:

1. BUSINESS OVERVIEW
   - Company profile and industry analysis
   - Management team assessment
   - Business model evaluation

2. FINANCIAL ANALYSIS
   - Revenue trends and profitability analysis (use grouped P&L data)
   - Balance sheet strength assessment (use grouped balance sheet data)
   - Cash flow analysis (use bank statements and cash flow data)
   - Debt capacity evaluation
   - Multi-period trend analysis

3. CREDIT RISK ASSESSMENT
   - Payment history evaluation
   - Debt-to-income/revenue ratios
   - Liquidity position
   - Overall creditworthiness

4. INSIGHTS AND RECOMMENDATIONS
   - Key strengths and weaknesses
   - Risk factors and mitigation strategies
   - Credit decision recommendation
   - Suggested credit terms (if applicable)

5. SCORING AND METRICS
   - Overall credit score (300-850)
   - Risk rating (Low/Medium/High)
   - Recommended credit limit
   - Interest rate suggestion

Pay special attention to:
- Multi-period financial trends from grouped data
- Consistency across different document types
- Quality and completeness of financial information
- Business stability indicators

Return ONLY a valid JSON object with this exact structure:
{
  "businessOverview": {
    "companyProfile": "string",
    "industryAnalysis": "string",
    "managementAssessment": "string",
    "businessModelEvaluation": "string"
  },
  "financialAnalysis": {
    "revenueAnalysis": "string",
    "profitabilityAssessment": "string",
    "balanceSheetStrength": "string",
    "cashFlowAnalysis": "string",
    "debtCapacity": "string"
  },
  "creditRiskAssessment": {
    "paymentHistoryEvaluation": "string",
    "debtRatios": "string",
    "liquidityPosition": "string",
    "overallCreditworthiness": "string"
  },
  "insights": {
    "keyStrengths": ["string"],
    "keyWeaknesses": ["string"],
    "riskFactors": ["string"],
    "mitigationStrategies": ["string"]
  },
  "recommendation": {
    "decision": "approve",
    "reasoning": "string",
    "conditions": ["string"]
  },
  "scoring": {
    "creditScore": 650,
    "riskRating": "Medium",
    "creditLimit": 100000000,
    "interestRate": 12.5,
    "confidenceLevel": 0.8
  },
  "summary": "string",
  "analysisDate": "2024-01-01T00:00:00.000Z"
}

Provide detailed, professional analysis based on the available data. If certain information is missing, note the limitations and provide recommendations based on available data.`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.analysisModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9,
            num_predict: 4000
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Raw Ollama analysis response length:', result.response?.length);
      
      // Parse the JSON response
      let insights;
      try {
        const responseText = result.response.trim();
        console.log('Analysis response preview:', responseText.substring(0, 300) + '...');
        
        // Try multiple JSON extraction methods
        insights = this.parseJsonFromResponse(responseText);
        
      } catch (parseError) {
        console.error('Failed to parse insights response:', parseError);
        console.log('Full raw response:', result.response);
        
        // Return a fallback structure
        insights = {
          businessOverview: {
            companyProfile: "Analysis could not be completed due to parsing error",
            industryAnalysis: "Unable to analyze",
            managementAssessment: "Unable to assess",
            businessModelEvaluation: "Unable to evaluate"
          },
          financialAnalysis: {
            revenueAnalysis: "Unable to analyze",
            profitabilityAssessment: "Unable to assess",
            balanceSheetStrength: "Unable to assess",
            cashFlowAnalysis: "Unable to analyze",
            debtCapacity: "Unable to evaluate"
          },
          creditRiskAssessment: {
            paymentHistoryEvaluation: "Unable to evaluate",
            debtRatios: "Unable to calculate",
            liquidityPosition: "Unable to assess",
            overallCreditworthiness: "Unable to determine"
          },
          insights: {
            keyStrengths: ["Analysis incomplete"],
            keyWeaknesses: ["Unable to determine"],
            riskFactors: ["Analysis incomplete"],
            mitigationStrategies: ["Unable to recommend"]
          },
          recommendation: {
            decision: "decline",
            reasoning: "Insufficient data for proper analysis",
            conditions: []
          },
          scoring: {
            creditScore: 500,
            riskRating: "High",
            creditLimit: 0,
            interestRate: 0,
            confidenceLevel: 0.1
          },
          summary: "Credit analysis could not be completed due to technical issues.",
          analysisDate: new Date().toISOString(),
          rawResponse: result.response,
          parseError: parseError.message
        };
      }

      if (!insights.analysisDate) {
        insights.analysisDate = new Date().toISOString();
      }

      console.log('Successfully generated credit insights');
      return insights;

    } catch (error) {
      console.error('Credit insights generation error:', error);
      throw new Error(`Failed to generate credit insights: ${error.message}`);
    }
  }

  parseJsonFromResponse(responseText) {
    // Method 1: Try to find JSON object directly
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const jsonString = jsonMatch[0];
        console.log('Attempting to parse JSON (method 1):', jsonString.substring(0, 200) + '...');
        return JSON.parse(jsonString);
      } catch (error) {
        console.log('Method 1 failed:', error.message);
      }
    }

    // Method 2: Try to extract from code blocks
    const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        const jsonString = codeBlockMatch[1];
        console.log('Attempting to parse JSON (method 2):', jsonString.substring(0, 200) + '...');
        return JSON.parse(jsonString);
      } catch (error) {
        console.log('Method 2 failed:', error.message);
      }
    }

    // Method 3: Try to find the largest JSON-like structure
    const jsonMatches = responseText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      // Sort by length and try the longest one first
      const sortedMatches = jsonMatches.sort((a, b) => b.length - a.length);
      
      for (const match of sortedMatches) {
        try {
          console.log('Attempting to parse JSON (method 3):', match.substring(0, 200) + '...');
          return JSON.parse(match);
        } catch (error) {
          console.log('Method 3 attempt failed:', error.message);
          continue;
        }
      }
    }

    // Method 4: Try to clean and parse the entire response
    try {
      // Remove any text before the first { and after the last }
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const cleanedJson = responseText.substring(firstBrace, lastBrace + 1);
        console.log('Attempting to parse JSON (method 4):', cleanedJson.substring(0, 200) + '...');
        return JSON.parse(cleanedJson);
      }
    } catch (error) {
      console.log('Method 4 failed:', error.message);
    }

    // Method 5: Try to fix common JSON issues
    try {
      let fixedJson = responseText;
      
      // Remove any text before first {
      const firstBrace = fixedJson.indexOf('{');
      if (firstBrace > 0) {
        fixedJson = fixedJson.substring(firstBrace);
      }
      
      // Remove any text after last }
      const lastBrace = fixedJson.lastIndexOf('}');
      if (lastBrace !== -1) {
        fixedJson = fixedJson.substring(0, lastBrace + 1);
      }
      
      // Fix common issues
      fixedJson = fixedJson
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/\n/g, ' ')     // Replace newlines with spaces
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();
      
      console.log('Attempting to parse JSON (method 5):', fixedJson.substring(0, 200) + '...');
      return JSON.parse(fixedJson);
    } catch (error) {
      console.log('Method 5 failed:', error.message);
    }

    throw new Error('No valid JSON found in response after trying all parsing methods');
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  async ensureModelsExist() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      
      const visionModelExists = data.models?.some(model => model.name.includes(this.visionModel));
      const analysisModelExists = data.models?.some(model => model.name.includes(this.analysisModel));
      
      const missingModels = [];
      if (!visionModelExists) missingModels.push(this.visionModel);
      if (!analysisModelExists) missingModels.push(this.analysisModel);
      
      if (missingModels.length > 0) {
        const modelList = missingModels.join(', ');
        console.log(`Models not found: ${modelList}. Please pull them using: ollama pull <model_name>`);
        throw new Error(`Models not available: ${modelList}. Please run: ${missingModels.map(m => `ollama pull ${m}`).join(' && ')}`);
      }
      
      return true;
    } catch (error) {
      console.error('Model check failed:', error);
      throw error;
    }
  }
}