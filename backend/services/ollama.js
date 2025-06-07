import axios from 'axios';
import fs from 'fs/promises';

export class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.visionModel = 'qwen2.5vl:7b';
    this.analysisModel = 'deepseek-r1:8b';
    
    // Create axios instance with default configuration (no timeout)
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`Making request to: ${config.method?.toUpperCase()} ${config.url}`);
        if (config.data && config.data.model) {
          console.log(`Using model: ${config.data.model}`);
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('Response interceptor error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        // Transform axios errors to more meaningful messages
        if (error.code === 'ECONNREFUSED') {
          error.message = 'Cannot connect to Ollama server. Please ensure Ollama is running.';
        } else if (error.code === 'ETIMEDOUT') {
          error.message = 'Request to Ollama server timed out. The model might be processing a large request.';
        } else if (error.response?.status === 404) {
          error.message = 'Ollama endpoint not found. Please check if the correct models are installed.';
        } else if (error.response?.status === 500) {
          error.message = 'Ollama server error. Please check the server logs.';
        }
        
        return Promise.reject(error);
      }
    );
  }

  async extractDataFromImage(imagePath) {
    try {
      console.log(`Extracting data from image: ${imagePath}`);
      
      // Read image file and convert to base64
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

      const requestData = {
        model: this.visionModel,
        prompt: prompt,
        images: [base64Image],
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        }
      };

      const response = await this.axiosInstance.post('/api/generate', requestData);
      
      console.log('Raw Ollama vision response length:', response.data.response?.length);
      
      // Parse the JSON response from Ollama
      let extractedData;
      try {
        const responseText = response.data.response.trim();
        console.log('Vision response preview:', responseText.substring(0, 300) + '...');
        
        // Try multiple JSON extraction methods
        extractedData = this.parseJsonFromResponse(responseText);
        
      } catch (parseError) {
        console.error('Failed to parse Ollama vision response:', parseError);
        console.log('Full raw response:', response.data.response);
        
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
          rawResponse: response.data.response,
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
      
      // Handle specific axios errors
      if (error.response) {
        throw new Error(`Ollama API error: ${error.response.status} ${error.response.statusText} - ${error.response.data?.error || error.message}`);
      } else if (error.request) {
        throw new Error('No response from Ollama server. Please check if Ollama is running and accessible.');
      } else {
        throw new Error(`Failed to extract data from image: ${error.message}`);
      }
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

      const requestData = {
        model: this.analysisModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
          num_predict: 4000
        }
      };

      const response = await this.axiosInstance.post('/api/generate', requestData);
      
      console.log('Raw Ollama analysis response length:', response.data.response?.length);
      
      // Parse the JSON response
      let insights;
      try {
        const responseText = response.data.response.trim();
        console.log('Analysis response preview:', responseText.substring(0, 300) + '...');
        
        // Try multiple JSON extraction methods
        insights = this.parseJsonFromResponse(responseText);
        
      } catch (parseError) {
        console.error('Failed to parse insights response:', parseError);
        console.log('Full raw response:', response.data.response);
        
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
          rawResponse: response.data.response,
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
      
      // Handle specific axios errors
      if (error.response) {
        throw new Error(`Ollama API error: ${error.response.status} ${error.response.statusText} - ${error.response.data?.error || error.message}`);
      } else if (error.request) {
        throw new Error('No response from Ollama server. Please check if Ollama is running and accessible.');
      } else {
        throw new Error(`Failed to generate credit insights: ${error.message}`);
      }
    }
  }

  parseJsonFromResponse(responseText) {
    console.log('Starting JSON parsing with enhanced methods...');
    
    // Clean the response text first
    let cleanedText = responseText.trim();
    
    // Remove common prefixes that models sometimes add
    const prefixesToRemove = [
      'Here is the JSON response:',
      'Here\'s the JSON response:',
      'The JSON response is:',
      'JSON response:',
      'Response:',
      'Here is the analysis:',
      'Here\'s the analysis:',
      'Analysis:',
      'Result:',
      'Output:',
      'Based on the analysis:',
      'Based on the document analysis:',
      'After analyzing the document:',
      'The extracted data is:',
      'Extracted data:',
      'Document analysis result:',
      'Financial analysis result:',
      'Credit analysis result:'
    ];
    
    for (const prefix of prefixesToRemove) {
      if (cleanedText.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanedText = cleanedText.substring(prefix.length).trim();
        console.log(`Removed prefix: "${prefix}"`);
        break;
      }
    }
    
    // Remove common suffixes
    const suffixesToRemove = [
      'This completes the analysis.',
      'End of analysis.',
      'Analysis complete.',
      'That\'s the complete analysis.',
      'This is the final result.',
      'End of JSON response.',
      'End of response.'
    ];
    
    for (const suffix of suffixesToRemove) {
      if (cleanedText.toLowerCase().endsWith(suffix.toLowerCase())) {
        cleanedText = cleanedText.substring(0, cleanedText.length - suffix.length).trim();
        console.log(`Removed suffix: "${suffix}"`);
        break;
      }
    }
    
    // Method 1: Try to parse the cleaned text directly
    try {
      console.log('Method 1: Attempting direct JSON parse...');
      const parsed = JSON.parse(cleanedText);
      console.log('Method 1: Success - Direct JSON parse worked');
      return parsed;
    } catch (error) {
      console.log('Method 1: Failed -', error.message);
    }

    // Method 2: Extract JSON from code blocks (```json or ```)
    try {
      console.log('Method 2: Attempting code block extraction...');
      const codeBlockPatterns = [
        /```json\s*(\{[\s\S]*?\})\s*```/i,
        /```\s*(\{[\s\S]*?\})\s*```/i,
        /`(\{[\s\S]*?\})`/i
      ];
      
      for (const pattern of codeBlockPatterns) {
        const match = cleanedText.match(pattern);
        if (match && match[1]) {
          const jsonString = match[1].trim();
          console.log(`Method 2: Found code block, attempting parse...`);
          const parsed = JSON.parse(jsonString);
          console.log('Method 2: Success - Code block extraction worked');
          return parsed;
        }
      }
      console.log('Method 2: No code blocks found');
    } catch (error) {
      console.log('Method 2: Failed -', error.message);
    }

    // Method 3: Find the largest JSON-like structure
    try {
      console.log('Method 3: Attempting largest JSON structure extraction...');
      const jsonPattern = /\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}/g;
      const matches = cleanedText.match(jsonPattern);
      
      if (matches && matches.length > 0) {
        // Sort by length and try the longest ones first
        const sortedMatches = matches.sort((a, b) => b.length - a.length);
        
        for (let i = 0; i < Math.min(3, sortedMatches.length); i++) {
          try {
            const jsonString = sortedMatches[i].trim();
            console.log(`Method 3: Attempting to parse match ${i + 1} (length: ${jsonString.length})`);
            const parsed = JSON.parse(jsonString);
            console.log('Method 3: Success - Largest JSON structure worked');
            return parsed;
          } catch (error) {
            console.log(`Method 3: Match ${i + 1} failed -`, error.message);
            continue;
          }
        }
      }
      console.log('Method 3: No valid JSON structures found');
    } catch (error) {
      console.log('Method 3: Failed -', error.message);
    }

    // Method 4: Extract from first { to last }
    try {
      console.log('Method 4: Attempting first-to-last brace extraction...');
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonString = cleanedText.substring(firstBrace, lastBrace + 1);
        console.log(`Method 4: Extracted JSON from position ${firstBrace} to ${lastBrace}`);
        const parsed = JSON.parse(jsonString);
        console.log('Method 4: Success - First-to-last brace extraction worked');
        return parsed;
      }
      console.log('Method 4: No valid brace pair found');
    } catch (error) {
      console.log('Method 4: Failed -', error.message);
    }

    // Method 5: Try to fix common JSON issues
    try {
      console.log('Method 5: Attempting JSON repair...');
      let fixedJson = cleanedText;
      
      // Remove any text before first {
      const firstBrace = fixedJson.indexOf('{');
      if (firstBrace > 0) {
        fixedJson = fixedJson.substring(firstBrace);
        console.log('Method 5: Removed text before first brace');
      }
      
      // Remove any text after last }
      const lastBrace = fixedJson.lastIndexOf('}');
      if (lastBrace !== -1 && lastBrace < fixedJson.length - 1) {
        fixedJson = fixedJson.substring(0, lastBrace + 1);
        console.log('Method 5: Removed text after last brace');
      }
      
      // Fix common JSON issues
      fixedJson = fixedJson
        .replace(/,\s*}/g, '}')          // Remove trailing commas before }
        .replace(/,\s*]/g, ']')          // Remove trailing commas before ]
        .replace(/\n/g, ' ')             // Replace newlines with spaces
        .replace(/\r/g, ' ')             // Replace carriage returns
        .replace(/\t/g, ' ')             // Replace tabs
        .replace(/\s+/g, ' ')            // Normalize whitespace
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"')     // Replace single quotes with double quotes
        .trim();
      
      console.log('Method 5: Applied JSON fixes, attempting parse...');
      const parsed = JSON.parse(fixedJson);
      console.log('Method 5: Success - JSON repair worked');
      return parsed;
    } catch (error) {
      console.log('Method 5: Failed -', error.message);
    }

    // Method 6: Try line-by-line reconstruction
    try {
      console.log('Method 6: Attempting line-by-line reconstruction...');
      const lines = cleanedText.split('\n');
      let jsonLines = [];
      let inJson = false;
      let braceCount = 0;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.includes('{')) {
          inJson = true;
          braceCount += (trimmedLine.match(/\{/g) || []).length;
        }
        
        if (inJson) {
          jsonLines.push(trimmedLine);
        }
        
        if (trimmedLine.includes('}')) {
          braceCount -= (trimmedLine.match(/\}/g) || []).length;
          if (braceCount <= 0) {
            break;
          }
        }
      }
      
      if (jsonLines.length > 0) {
        const reconstructedJson = jsonLines.join(' ');
        console.log('Method 6: Reconstructed JSON from lines, attempting parse...');
        const parsed = JSON.parse(reconstructedJson);
        console.log('Method 6: Success - Line reconstruction worked');
        return parsed;
      }
      console.log('Method 6: No JSON lines found');
    } catch (error) {
      console.log('Method 6: Failed -', error.message);
    }

    // Method 7: Last resort - try to extract key-value pairs manually
    try {
      console.log('Method 7: Attempting manual key-value extraction...');
      const result = {};
      
      // Look for common patterns like "key": "value" or "key": number
      const patterns = [
        /"(\w+)":\s*"([^"]*)"/g,           // "key": "string value"
        /"(\w+)":\s*(\d+\.?\d*)/g,         // "key": number
        /"(\w+)":\s*(true|false|null)/g,   // "key": boolean/null
        /(\w+):\s*"([^"]*)"/g,             // key: "string value" (unquoted key)
        /(\w+):\s*(\d+\.?\d*)/g            // key: number (unquoted key)
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(cleanedText)) !== null) {
          const key = match[1];
          let value = match[2];
          
          // Convert value to appropriate type
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (value === 'null') value = null;
          else if (/^\d+\.?\d*$/.test(value)) value = parseFloat(value);
          
          result[key] = value;
        }
      }
      
      if (Object.keys(result).length > 0) {
        console.log('Method 7: Success - Manual extraction found', Object.keys(result).length, 'properties');
        return result;
      }
      console.log('Method 7: No key-value pairs found');
    } catch (error) {
      console.log('Method 7: Failed -', error.message);
    }

    // If all methods fail, log the problematic text and throw error
    console.error('All JSON parsing methods failed. Problematic text:');
    console.error('='.repeat(80));
    console.error(cleanedText.substring(0, 1000) + (cleanedText.length > 1000 ? '...' : ''));
    console.error('='.repeat(80));
    
    throw new Error(`No valid JSON found in response after trying all parsing methods. Response length: ${responseText.length}`);
  }

  async checkHealth() {
    try {
      const response = await this.axiosInstance.get('/api/tags');
      return true;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  async ensureModelsExist() {
    try {
      const response = await this.axiosInstance.get('/api/tags');
      
      const visionModelExists = response.data.models?.some(model => model.name.includes(this.visionModel));
      const analysisModelExists = response.data.models?.some(model => model.name.includes(this.analysisModel));
      
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