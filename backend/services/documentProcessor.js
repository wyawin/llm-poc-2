import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { fromPath } from 'pdf2pic';
import * as pdfjsLib from 'pdfjs-dist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DocumentProcessor {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
    
    // Common passwords to try for encrypted PDFs
    this.commonPasswords = [
      '', // Empty password
      '123456',
      'password',
      '12345',
      'admin',
      'user',
      '000000',
      'qwerty',
      'abc123',
      '123123',
      'password123',
      '1234567890'
    ];
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async convertToImages(filePath, mimeType, password = null) {
    const images = [];

    try {
      if (mimeType === 'application/pdf') {
        // Step 1: Parse PDF to buffer first
        console.log(`Reading PDF file to buffer: ${filePath}`);
        const pdfBuffer = await this.parsePdfToBuffer(filePath);
        
        // Step 2: Analyze PDF with buffer
        console.log(`Analyzing PDF from buffer...`);
        const pdfInfo = await this.analyzePdfFromBuffer(pdfBuffer, password);
        
        if (pdfInfo.isEncrypted && !pdfInfo.password) {
          throw new Error('PDF is encrypted and requires a password. Please provide the password or try common passwords.');
        }

        // Step 3: Convert buffer-based PDF to images
        console.log(`Converting PDF buffer to images...`);
        const convertedImages = await this.convertPdfBufferToImages(pdfBuffer, pdfInfo);
        images.push(...convertedImages);

        if (images.length === 0) {
          throw new Error('No pages could be converted from PDF');
        }

      } else if (mimeType.startsWith('image/')) {
        // For image files, optimize and convert to JPEG if needed
        const outputPath = path.join(this.tempDir, `img_${Date.now()}.jpg`);
        
        await sharp(filePath)
          .jpeg({ quality: 90 })
          .resize(2048, 2048, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .toFile(outputPath);
          
        images.push(outputPath);

      } else if (mimeType.includes('document') || mimeType.includes('word')) {
        // For Word documents, we would need additional processing
        // For now, throw an error as this requires more complex conversion
        throw new Error('Word document processing not yet implemented. Please convert to PDF first.');
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      console.log(`Successfully converted document to ${images.length} image(s)`);
      return images;

    } catch (error) {
      console.error('Document conversion error:', error);
      throw new Error(`Failed to convert document: ${error.message}`);
    }
  }

  async parsePdfToBuffer(filePath) {
    try {
      console.log(`Parsing PDF file to buffer: ${filePath}`);
      
      // Read the entire PDF file into memory as a buffer
      const pdfBuffer = await fs.readFile(filePath);
      
      console.log(`PDF buffer created successfully: ${pdfBuffer.length} bytes`);
      
      // Validate that it's actually a PDF
      if (!this.isPdfBuffer(pdfBuffer)) {
        throw new Error('File does not appear to be a valid PDF');
      }
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error parsing PDF to buffer:', error);
      throw new Error(`Failed to parse PDF to buffer: ${error.message}`);
    }
  }

  isPdfBuffer(buffer) {
    // Check PDF magic number (starts with %PDF)
    const pdfSignature = Buffer.from('%PDF');
    return buffer.length >= 4 && buffer.subarray(0, 4).equals(pdfSignature);
  }

  async analyzePdfFromBuffer(pdfBuffer, providedPassword = null) {
    try {
      console.log(`Analyzing PDF from buffer (${pdfBuffer.length} bytes)...`);
      
      let pdfDocument = null;
      let password = null;
      let isEncrypted = false;
      
      // Try to load the PDF without password first
      try {
        pdfDocument = await pdfjsLib.getDocument({
          data: pdfBuffer,
          password: ''
        }).promise;
        console.log('PDF loaded successfully without password');
      } catch (error) {
        if (error.name === 'PasswordException') {
          isEncrypted = true;
          console.log('PDF is encrypted, attempting to unlock...');
          
          // Try provided password first
          if (providedPassword) {
            try {
              pdfDocument = await pdfjsLib.getDocument({
                data: pdfBuffer,
                password: providedPassword
              }).promise;
              password = providedPassword;
              console.log('PDF unlocked with provided password');
            } catch (passwordError) {
              console.log('Provided password failed, trying common passwords...');
            }
          }
          
          // If provided password failed or not provided, try common passwords
          if (!pdfDocument) {
            for (const testPassword of this.commonPasswords) {
              try {
                pdfDocument = await pdfjsLib.getDocument({
                  data: pdfBuffer,
                  password: testPassword
                }).promise;
                password = testPassword;
                console.log(`PDF unlocked with password: "${testPassword === '' ? '(empty)' : testPassword}"`);
                break;
              } catch (passwordError) {
                // Continue trying other passwords
                continue;
              }
            }
          }
          
          if (!pdfDocument) {
            throw new Error('Could not unlock encrypted PDF with common passwords. Please provide the correct password.');
          }
        } else {
          throw error;
        }
      }
      
      const pageCount = pdfDocument.numPages;
      
      // Get additional PDF metadata
      const metadata = await pdfDocument.getMetadata();
      
      console.log(`PDF analysis complete:`, {
        pageCount,
        isEncrypted,
        hasPassword: !!password,
        title: metadata.info?.Title || 'Unknown',
        author: metadata.info?.Author || 'Unknown',
        creator: metadata.info?.Creator || 'Unknown'
      });
      
      return {
        pageCount,
        isEncrypted,
        password,
        success: true,
        metadata: metadata.info,
        pdfDocument // Keep reference for further processing
      };
      
    } catch (error) {
      console.error('PDF buffer analysis error:', error);
      return {
        pageCount: null,
        isEncrypted: false,
        password: null,
        success: false,
        error: error.message,
        pdfDocument: null
      };
    }
  }

  async convertPdfBufferToImages(pdfBuffer, pdfInfo) {
    const images = [];
    
    try {
      console.log(`Converting PDF buffer to images (${pdfInfo.pageCount} pages)...`);
      
      // Create a temporary file from buffer for pdf2pic
      const tempPdfPath = path.join(this.tempDir, `temp_pdf_${Date.now()}.pdf`);
      await fs.writeFile(tempPdfPath, pdfBuffer);
      
      try {
        // Use pdf2pic for conversion with password support
        const convertOptions = {
          density: 200,           // Output DPI (higher = better quality)
          saveFilename: `pdf_${Date.now()}`,
          savePath: this.tempDir,
          format: "jpeg",         // Output format
          width: 2048,           // Max width
          height: 2048,          // Max height
          quality: 90            // JPEG quality
        };

        // Add password if needed
        if (pdfInfo.password) {
          convertOptions.password = pdfInfo.password;
        }

        const convert = fromPath(tempPdfPath, convertOptions);
        const pageCount = pdfInfo.pageCount || 10; // Fallback to 10 if we can't determine

        console.log(`Converting ${pageCount} pages with${pdfInfo.password ? ' password' : 'out password'}...`);

        // Convert all pages
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          try {
            const result = await convert(pageNum, { responseType: "image" });
            
            if (result && result.path) {
              images.push(result.path);
              console.log(`Converted page ${pageNum}/${pageCount} to: ${result.path}`);
            }
          } catch (pageError) {
            console.warn(`Failed to convert page ${pageNum}:`, pageError.message);
            // If we can't convert a page, we might have reached the end
            if (pageError.message.includes('Invalid page number') || 
                pageError.message.includes('page does not exist')) {
              break;
            }
          }
        }
        
      } finally {
        // Clean up temporary PDF file
        try {
          await fs.unlink(tempPdfPath);
          console.log(`Cleaned up temporary PDF file: ${tempPdfPath}`);
        } catch (cleanupError) {
          console.warn(`Failed to clean up temporary PDF file: ${tempPdfPath}`, cleanupError);
        }
      }
      
      console.log(`Successfully converted PDF buffer to ${images.length} images`);
      return images;
      
    } catch (error) {
      console.error('Error converting PDF buffer to images:', error);
      throw new Error(`Failed to convert PDF buffer to images: ${error.message}`);
    }
  }

  async analyzePdf(filePath, providedPassword = null) {
    try {
      // Use the new buffer-based approach
      const pdfBuffer = await this.parsePdfToBuffer(filePath);
      return await this.analyzePdfFromBuffer(pdfBuffer, providedPassword);
    } catch (error) {
      console.error('PDF analysis error:', error);
      return {
        pageCount: null,
        isEncrypted: false,
        password: null,
        success: false,
        error: error.message
      };
    }
  }

  async getPdfPageCount(filePath) {
    try {
      // Use the new analyzePdf method
      const pdfInfo = await this.analyzePdf(filePath);
      return pdfInfo.pageCount;
    } catch (error) {
      console.warn('Could not determine PDF page count:', error.message);
      return null;
    }
  }

  combineExtractedData(extractedResults, filename) {
    // Combine data from multiple pages/images into a single structure
    const combined = {
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
      sourceFile: filename,
      pageCount: extractedResults.length,
      confidence: 0
    };

    // Merge company info (take first non-null values)
    for (const result of extractedResults) {
      if (result.companyInfo) {
        Object.keys(result.companyInfo).forEach(key => {
          if (!combined.companyInfo[key] && result.companyInfo[key]) {
            combined.companyInfo[key] = result.companyInfo[key];
          }
        });
      }
    }

    // Merge personal info (combine all individuals)
    for (const result of extractedResults) {
      if (result.personalInfo?.individuals) {
        combined.personalInfo.individuals.push(...result.personalInfo.individuals);
      }
    }

    // Merge financial info
    for (const result of extractedResults) {
      if (result.financialInfo) {
        // Profit & Loss
        if (result.financialInfo.profitLoss) {
          Object.keys(result.financialInfo.profitLoss).forEach(key => {
            if (!combined.financialInfo.profitLoss[key] && result.financialInfo.profitLoss[key]) {
              combined.financialInfo.profitLoss[key] = result.financialInfo.profitLoss[key];
            }
          });
        }

        // Balance Sheet
        if (result.financialInfo.balanceSheet) {
          Object.keys(result.financialInfo.balanceSheet).forEach(key => {
            if (!combined.financialInfo.balanceSheet[key] && result.financialInfo.balanceSheet[key]) {
              combined.financialInfo.balanceSheet[key] = result.financialInfo.balanceSheet[key];
            }
          });
        }

        // Bank Statements
        if (result.financialInfo.bankStatements) {
          combined.financialInfo.bankStatements.push(...result.financialInfo.bankStatements);
        }

        // Credit Info
        if (result.financialInfo.creditInfo) {
          if (result.financialInfo.creditInfo.creditScore && !combined.financialInfo.creditInfo.creditScore) {
            combined.financialInfo.creditInfo.creditScore = result.financialInfo.creditInfo.creditScore;
          }
          if (result.financialInfo.creditInfo.creditHistory) {
            combined.financialInfo.creditInfo.creditHistory.push(...result.financialInfo.creditInfo.creditHistory);
          }
        }

        // Cash Flow
        if (result.financialInfo.cashFlow) {
          Object.keys(result.financialInfo.cashFlow).forEach(key => {
            if (!combined.financialInfo.cashFlow[key] && result.financialInfo.cashFlow[key]) {
              combined.financialInfo.cashFlow[key] = result.financialInfo.cashFlow[key];
            }
          });
        }
      }
    }

    // Determine document type (take the most specific one)
    const documentTypes = extractedResults
      .map(r => r.documentType)
      .filter(type => type && type !== "Unknown");
    
    if (documentTypes.length > 0) {
      combined.documentType = documentTypes[0];
    }

    // Calculate average confidence
    const confidences = extractedResults
      .map(r => r.confidence || 0)
      .filter(c => c > 0);
    
    if (confidences.length > 0) {
      combined.confidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }

    // Remove duplicates from arrays
    combined.financialInfo.bankStatements = this.removeDuplicateStatements(combined.financialInfo.bankStatements);
    combined.financialInfo.creditInfo.creditHistory = this.removeDuplicateCreditHistory(combined.financialInfo.creditInfo.creditHistory);
    combined.personalInfo.individuals = this.removeDuplicateIndividuals(combined.personalInfo.individuals);

    return combined;
  }

  // New method to group and structure financial data across multiple documents
  groupFinancialDocuments(allExtractedData) {
    console.log('Grouping financial documents by type and period...');
    
    const groupedData = {
      profitLossStatements: [],
      balanceSheets: [],
      bankStatements: [],
      creditReports: [],
      cashFlowStatements: [],
      otherDocuments: [],
      summary: {
        totalDocuments: allExtractedData.length,
        documentTypes: new Set(),
        periods: new Set(),
        companies: new Set()
      }
    };

    // Process each document
    for (const data of allExtractedData) {
      // Add to summary
      groupedData.summary.documentTypes.add(data.documentType);
      if (data.companyInfo?.name) {
        groupedData.summary.companies.add(data.companyInfo.name);
      }

      // Group by document type
      switch (data.documentType.toLowerCase()) {
        case 'profit and loss statement':
        case 'profit & loss':
        case 'income statement':
        case 'p&l statement':
          this.addProfitLossData(groupedData.profitLossStatements, data);
          break;

        case 'balance sheet':
        case 'statement of financial position':
          this.addBalanceSheetData(groupedData.balanceSheets, data);
          break;

        case 'bank statement':
        case 'bank statements':
          this.addBankStatementData(groupedData.bankStatements, data);
          break;

        case 'credit history report':
        case 'credit report':
        case 'credit history':
          this.addCreditReportData(groupedData.creditReports, data);
          break;

        case 'cash flow statement':
        case 'statement of cash flows':
          this.addCashFlowData(groupedData.cashFlowStatements, data);
          break;

        default:
          groupedData.otherDocuments.push({
            documentType: data.documentType,
            sourceFile: data.sourceFile,
            extractionDate: data.extractionDate,
            data: data
          });
      }
    }

    // Convert sets to arrays for JSON serialization
    groupedData.summary.documentTypes = Array.from(groupedData.summary.documentTypes);
    groupedData.summary.periods = Array.from(groupedData.summary.periods);
    groupedData.summary.companies = Array.from(groupedData.summary.companies);

    // Sort financial statements by period
    groupedData.profitLossStatements.sort((a, b) => this.comparePeriods(a.period, b.period));
    groupedData.balanceSheets.sort((a, b) => this.comparePeriods(a.asOfDate, b.asOfDate));
    groupedData.cashFlowStatements.sort((a, b) => this.comparePeriods(a.period, b.period));

    console.log(`Grouped data summary:`, {
      profitLoss: groupedData.profitLossStatements.length,
      balanceSheets: groupedData.balanceSheets.length,
      bankStatements: groupedData.bankStatements.length,
      creditReports: groupedData.creditReports.length,
      cashFlow: groupedData.cashFlowStatements.length,
      other: groupedData.otherDocuments.length
    });

    return groupedData;
  }

  addProfitLossData(statements, data) {
    if (data.financialInfo?.profitLoss && Object.keys(data.financialInfo.profitLoss).length > 0) {
      const statement = {
        period: data.financialInfo.profitLoss.period || 'Unknown Period',
        revenue: data.financialInfo.profitLoss.revenue || 0,
        expenses: data.financialInfo.profitLoss.expenses || 0,
        netIncome: data.financialInfo.profitLoss.netIncome || 0,
        grossProfit: (data.financialInfo.profitLoss.revenue || 0) - (data.financialInfo.profitLoss.expenses || 0),
        sourceFile: data.sourceFile,
        extractionDate: data.extractionDate,
        confidence: data.confidence,
        companyName: data.companyInfo?.name || 'Unknown Company'
      };

      // Add to periods summary
      if (statement.period !== 'Unknown Period') {
        this.addToPeriodsSummary(statement.period);
      }

      statements.push(statement);
    }
  }

  addBalanceSheetData(sheets, data) {
    if (data.financialInfo?.balanceSheet && Object.keys(data.financialInfo.balanceSheet).length > 0) {
      const sheet = {
        asOfDate: data.financialInfo.balanceSheet.asOfDate || 'Unknown Date',
        totalAssets: data.financialInfo.balanceSheet.totalAssets || 0,
        totalLiabilities: data.financialInfo.balanceSheet.totalLiabilities || 0,
        equity: data.financialInfo.balanceSheet.equity || 0,
        netWorth: (data.financialInfo.balanceSheet.totalAssets || 0) - (data.financialInfo.balanceSheet.totalLiabilities || 0),
        debtToAssetRatio: data.financialInfo.balanceSheet.totalAssets > 0 ? 
          (data.financialInfo.balanceSheet.totalLiabilities || 0) / data.financialInfo.balanceSheet.totalAssets : 0,
        sourceFile: data.sourceFile,
        extractionDate: data.extractionDate,
        confidence: data.confidence,
        companyName: data.companyInfo?.name || 'Unknown Company'
      };

      // Add to periods summary
      if (sheet.asOfDate !== 'Unknown Date') {
        this.addToPeriodsSummary(sheet.asOfDate);
      }

      sheets.push(sheet);
    }
  }

  addBankStatementData(statements, data) {
    if (data.financialInfo?.bankStatements && data.financialInfo.bankStatements.length > 0) {
      for (const bankStatement of data.financialInfo.bankStatements) {
        const statement = {
          period: bankStatement.period || 'Unknown Period',
          accountNumber: bankStatement.accountNumber || 'Unknown Account',
          accountType: bankStatement.accountType || 'Unknown Type',
          balance: bankStatement.balance || 0,
          transactionCount: bankStatement.transactions?.length || 0,
          totalCredits: this.calculateTotalCredits(bankStatement.transactions || []),
          totalDebits: this.calculateTotalDebits(bankStatement.transactions || []),
          averageBalance: bankStatement.balance || 0,
          sourceFile: data.sourceFile,
          extractionDate: data.extractionDate,
          confidence: data.confidence,
          companyName: data.companyInfo?.name || 'Unknown Company',
          transactions: bankStatement.transactions || []
        };

        // Add to periods summary
        if (statement.period !== 'Unknown Period') {
          this.addToPeriodsSummary(statement.period);
        }

        statements.push(statement);
      }
    }
  }

  addCreditReportData(reports, data) {
    if (data.financialInfo?.creditInfo) {
      const report = {
        reportDate: data.extractionDate,
        creditScore: data.financialInfo.creditInfo.creditScore || 0,
        creditHistory: data.financialInfo.creditInfo.creditHistory || [],
        totalCreditAccounts: data.financialInfo.creditInfo.creditHistory?.length || 0,
        totalCreditBalance: this.calculateTotalCreditBalance(data.financialInfo.creditInfo.creditHistory || []),
        sourceFile: data.sourceFile,
        extractionDate: data.extractionDate,
        confidence: data.confidence,
        companyName: data.companyInfo?.name || 'Unknown Company'
      };

      reports.push(report);
    }
  }

  addCashFlowData(statements, data) {
    if (data.financialInfo?.cashFlow && Object.keys(data.financialInfo.cashFlow).length > 0) {
      const statement = {
        period: data.financialInfo.cashFlow.period || 'Unknown Period',
        operatingCashFlow: data.financialInfo.cashFlow.operatingCashFlow || 0,
        investingCashFlow: data.financialInfo.cashFlow.investingCashFlow || 0,
        financingCashFlow: data.financialInfo.cashFlow.financingCashFlow || 0,
        netCashFlow: (data.financialInfo.cashFlow.operatingCashFlow || 0) + 
                     (data.financialInfo.cashFlow.investingCashFlow || 0) + 
                     (data.financialInfo.cashFlow.financingCashFlow || 0),
        sourceFile: data.sourceFile,
        extractionDate: data.extractionDate,
        confidence: data.confidence,
        companyName: data.companyInfo?.name || 'Unknown Company'
      };

      // Add to periods summary
      if (statement.period !== 'Unknown Period') {
        this.addToPeriodsSummary(statement.period);
      }

      statements.push(statement);
    }
  }

  addToPeriodsSummary(period) {
    // This would be called with a reference to the summary periods set
    // Implementation depends on how we want to track periods
  }

  calculateTotalCredits(transactions) {
    return transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  calculateTotalDebits(transactions) {
    return transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  calculateTotalCreditBalance(creditHistory) {
    return creditHistory.reduce((sum, credit) => sum + (credit.balance || 0), 0);
  }

  comparePeriods(periodA, periodB) {
    // Simple period comparison - can be enhanced for better date parsing
    if (!periodA || !periodB) return 0;
    
    // Try to extract year from period strings
    const yearA = this.extractYear(periodA);
    const yearB = this.extractYear(periodB);
    
    if (yearA && yearB) {
      return yearA - yearB;
    }
    
    // Fallback to string comparison
    return periodA.localeCompare(periodB);
  }

  extractYear(period) {
    const yearMatch = period.match(/\b(20\d{2})\b/);
    return yearMatch ? parseInt(yearMatch[1]) : null;
  }

  removeDuplicateStatements(statements) {
    const seen = new Set();
    return statements.filter(statement => {
      const key = `${statement.accountNumber}-${statement.period}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  removeDuplicateCreditHistory(creditHistory) {
    const seen = new Set();
    return creditHistory.filter(credit => {
      const key = `${credit.creditor}-${credit.accountType}-${credit.balance}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  removeDuplicateIndividuals(individuals) {
    const seen = new Set();
    return individuals.filter(individual => {
      const key = `${individual.name}-${individual.position}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async cleanupImages(imagePaths) {
    try {
      for (const imagePath of imagePaths) {
        try {
          await fs.unlink(imagePath);
          console.log(`Cleaned up temporary image: ${imagePath}`);
        } catch (error) {
          console.warn(`Failed to delete temporary image: ${imagePath}`, error);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}