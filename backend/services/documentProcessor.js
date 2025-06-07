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
        console.log(`Starting PDF conversion process: ${filePath}`);
        
        // Step 1: Validate file exists and is readable
        try {
          await fs.access(filePath, fs.constants.R_OK);
          const stats = await fs.stat(filePath);
          console.log(`PDF file stats: ${stats.size} bytes, modified: ${stats.mtime}`);
          
          if (stats.size === 0) {
            throw new Error('PDF file is empty (0 bytes)');
          }
          
          if (stats.size > 100 * 1024 * 1024) { // 100MB limit
            throw new Error('PDF file is too large (>100MB)');
          }
        } catch (accessError) {
          throw new Error(`Cannot access PDF file: ${accessError.message}`);
        }

        // Step 2: Parse PDF to Uint8Array with validation
        console.log(`Reading and validating PDF file...`);
        const pdfUint8Array = await this.parsePdfToUint8Array(filePath);
        
        // Step 3: Analyze PDF structure and handle encryption
        console.log(`Analyzing PDF structure...`);
        const pdfInfo = await this.analyzePdfFromUint8Array(pdfUint8Array, password);
        
        if (!pdfInfo.success) {
          throw new Error(`PDF analysis failed: ${pdfInfo.error}`);
        }
        
        if (pdfInfo.isEncrypted && !pdfInfo.password) {
          throw new Error('PDF is encrypted and requires a password. Please provide the correct password.');
        }

        // Step 4: Convert to images with enhanced error handling
        console.log(`Converting PDF to images (${pdfInfo.pageCount} pages)...`);
        const convertedImages = await this.convertPdfUint8ArrayToImages(pdfUint8Array, pdfInfo, filePath);
        images.push(...convertedImages);

        if (images.length === 0) {
          throw new Error('No pages could be converted from PDF - the PDF might be corrupted or contain no renderable content');
        }

        console.log(`Successfully converted PDF to ${images.length} images`);

      } else if (mimeType.startsWith('image/')) {
        // For image files, optimize and convert to JPEG if needed
        console.log(`Processing image file: ${filePath}`);
        const outputPath = await this.processImageFile(filePath);
        images.push(outputPath);

      } else if (mimeType.includes('document') || mimeType.includes('word')) {
        // For Word documents, we would need additional processing
        throw new Error('Word document processing not yet implemented. Please convert to PDF first.');
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      console.log(`Document conversion completed: ${images.length} image(s) generated`);
      return images;

    } catch (error) {
      console.error('Document conversion error:', error);
      
      // Clean up any partial images on error
      if (images.length > 0) {
        await this.cleanupImages(images);
      }
      
      throw new Error(`Failed to convert document: ${error.message}`);
    }
  }

  async processImageFile(filePath) {
    try {
      const outputPath = path.join(this.tempDir, `img_${Date.now()}.jpg`);
      
      // Validate image file
      const imageInfo = await sharp(filePath).metadata();
      console.log(`Image metadata:`, {
        format: imageInfo.format,
        width: imageInfo.width,
        height: imageInfo.height,
        channels: imageInfo.channels,
        density: imageInfo.density
      });
      
      // Process and optimize image
      await sharp(filePath)
        .jpeg({ quality: 90, progressive: true })
        .resize(2048, 2048, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .toFile(outputPath);
        
      console.log(`Image processed successfully: ${outputPath}`);
      return outputPath;
      
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  async parsePdfToUint8Array(filePath) {
    try {
      console.log(`Parsing PDF file to Uint8Array: ${filePath}`);
      
      // Read the entire PDF file into memory as a buffer
      const pdfBuffer = await fs.readFile(filePath);
      
      // Convert Buffer to Uint8Array
      const pdfUint8Array = new Uint8Array(pdfBuffer);
      
      console.log(`PDF Uint8Array created successfully: ${pdfUint8Array.length} bytes`);
      
      // Validate that it's actually a PDF
      if (!this.isPdfUint8Array(pdfUint8Array)) {
        throw new Error('File does not appear to be a valid PDF (missing PDF signature)');
      }
      
      // Additional validation - check for PDF version
      const pdfHeader = new TextDecoder().decode(pdfUint8Array.slice(0, 20));
      console.log(`PDF header: ${pdfHeader}`);
      
      if (!pdfHeader.includes('PDF-')) {
        throw new Error('Invalid PDF format - missing version information');
      }
      
      return pdfUint8Array;
    } catch (error) {
      console.error('Error parsing PDF to Uint8Array:', error);
      throw new Error(`Failed to parse PDF to Uint8Array: ${error.message}`);
    }
  }

  isPdfUint8Array(uint8Array) {
    // Check PDF magic number (starts with %PDF)
    const pdfSignature = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF in bytes
    
    if (uint8Array.length < 4) {
      return false;
    }
    
    // Compare first 4 bytes
    for (let i = 0; i < 4; i++) {
      if (uint8Array[i] !== pdfSignature[i]) {
        return false;
      }
    }
    
    return true;
  }

  async analyzePdfFromUint8Array(pdfUint8Array, providedPassword = null) {
    try {
      console.log(`Analyzing PDF from Uint8Array (${pdfUint8Array.length} bytes)...`);
      
      let pdfDocument = null;
      let password = null;
      let isEncrypted = false;
      
      // Try to load the PDF without password first
      try {
        pdfDocument = await pdfjsLib.getDocument({
          data: pdfUint8Array,
          password: '',
          verbosity: 0 // Reduce PDF.js logging
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
                data: pdfUint8Array,
                password: providedPassword,
                verbosity: 0
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
                  data: pdfUint8Array,
                  password: testPassword,
                  verbosity: 0
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
      
      if (pageCount === 0) {
        throw new Error('PDF contains no pages');
      }
      
      if (pageCount > 50) {
        console.warn(`PDF has many pages (${pageCount}). Processing may take a while.`);
      }
      
      // Get additional PDF metadata
      let metadata = null;
      try {
        metadata = await pdfDocument.getMetadata();
      } catch (metadataError) {
        console.warn('Could not read PDF metadata:', metadataError.message);
      }
      
      console.log(`PDF analysis complete:`, {
        pageCount,
        isEncrypted,
        hasPassword: !!password,
        title: metadata?.info?.Title || 'Unknown',
        author: metadata?.info?.Author || 'Unknown',
        creator: metadata?.info?.Creator || 'Unknown'
      });
      
      return {
        pageCount,
        isEncrypted,
        password,
        success: true,
        metadata: metadata?.info || {},
        pdfDocument // Keep reference for further processing
      };
      
    } catch (error) {
      console.error('PDF Uint8Array analysis error:', error);
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

  async convertPdfUint8ArrayToImages(pdfUint8Array, pdfInfo, originalFilePath) {
    const images = [];
    let tempPdfPath = null;
    
    try {
      console.log(`Converting PDF Uint8Array to images (${pdfInfo.pageCount} pages)...`);
      
      // Create a temporary file from Uint8Array for pdf2pic
      tempPdfPath = path.join(this.tempDir, `temp_pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`);
      
      // Convert Uint8Array back to Buffer for file writing
      const pdfBuffer = Buffer.from(pdfUint8Array);
      await fs.writeFile(tempPdfPath, pdfBuffer);
      
      // Verify the temporary file was written correctly
      const tempStats = await fs.stat(tempPdfPath);
      console.log(`Temporary PDF created: ${tempPdfPath} (${tempStats.size} bytes)`);
      
      if (tempStats.size !== pdfUint8Array.length) {
        throw new Error(`Temporary PDF size mismatch: expected ${pdfUint8Array.length}, got ${tempStats.size}`);
      }

      // Enhanced conversion options with better error handling
      const convertOptions = {
        density: 150,           // Reduced DPI for better compatibility
        saveFilename: `pdf_${Date.now()}`,
        savePath: this.tempDir,
        format: "png",          // Use PNG instead of JPEG for better compatibility
        width: 1600,           // Reduced size for better performance
        height: 1600,          // Reduced size for better performance
        quality: 85,           // Slightly reduced quality for better compatibility
        preserveAspectRatio: true,
        background: 'white'    // Set white background
      };

      // Add password if needed
      if (pdfInfo.password && pdfInfo.password !== '') {
        convertOptions.password = pdfInfo.password;
        console.log('Using password for PDF conversion');
      }

      console.log('PDF conversion options:', {
        ...convertOptions,
        password: convertOptions.password ? '[REDACTED]' : 'none'
      });

      const convert = fromPath(tempPdfPath, convertOptions);
      const pageCount = Math.min(pdfInfo.pageCount, 20); // Limit to 20 pages for performance

      console.log(`Converting ${pageCount} pages (limited from ${pdfInfo.pageCount})...`);

      // Convert pages with individual error handling
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        try {
          console.log(`Converting page ${pageNum}/${pageCount}...`);
          
          const result = await convert(pageNum, { 
            responseType: "image",
            timeout: 30000 // 30 second timeout per page
          });
          
          if (result && result.path) {
            // Verify the converted image exists and has content
            try {
              const imageStats = await fs.stat(result.path);
              if (imageStats.size === 0) {
                console.warn(`Page ${pageNum} converted to empty file, skipping`);
                continue;
              }
              
              // Validate image with sharp
              const imageInfo = await sharp(result.path).metadata();
              if (!imageInfo.width || !imageInfo.height) {
                console.warn(`Page ${pageNum} has invalid dimensions, skipping`);
                continue;
              }
              
              images.push(result.path);
              console.log(`Successfully converted page ${pageNum} to: ${result.path} (${imageStats.size} bytes, ${imageInfo.width}x${imageInfo.height})`);
              
            } catch (validationError) {
              console.warn(`Page ${pageNum} validation failed:`, validationError.message);
              continue;
            }
          } else {
            console.warn(`Page ${pageNum} conversion returned no result`);
          }
          
        } catch (pageError) {
          console.error(`Failed to convert page ${pageNum}:`, pageError.message);
          
          // Check for specific error types
          if (pageError.message.includes('Invalid page number') || 
              pageError.message.includes('page does not exist')) {
            console.log(`Reached end of document at page ${pageNum}`);
            break;
          } else if (pageError.message.includes('Insufficient image data')) {
            console.warn(`Page ${pageNum} has insufficient image data, trying alternative method...`);
            
            // Try with different settings for problematic pages
            try {
              const alternativeOptions = {
                ...convertOptions,
                density: 100,
                format: "jpeg",
                quality: 70
              };
              
              const alternativeConvert = fromPath(tempPdfPath, alternativeOptions);
              const alternativeResult = await alternativeConvert(pageNum, { responseType: "image" });
              
              if (alternativeResult && alternativeResult.path) {
                images.push(alternativeResult.path);
                console.log(`Page ${pageNum} converted with alternative settings: ${alternativeResult.path}`);
              }
            } catch (alternativeError) {
              console.warn(`Alternative conversion also failed for page ${pageNum}:`, alternativeError.message);
            }
          } else {
            console.warn(`Unexpected error on page ${pageNum}, continuing with next page...`);
          }
        }
      }
      
      console.log(`PDF conversion completed: ${images.length}/${pageCount} pages converted successfully`);
      
      if (images.length === 0) {
        throw new Error('No pages could be converted. The PDF might be corrupted, contain only vector graphics, or have compatibility issues with the conversion tool.');
      }
      
      return images;
      
    } catch (error) {
      console.error('Error converting PDF Uint8Array to images:', error);
      
      // Clean up any partial images
      if (images.length > 0) {
        await this.cleanupImages(images);
      }
      
      throw new Error(`Failed to convert PDF to images: ${error.message}`);
    } finally {
      // Clean up temporary PDF file
      if (tempPdfPath) {
        try {
          await fs.unlink(tempPdfPath);
          console.log(`Cleaned up temporary PDF file: ${tempPdfPath}`);
        } catch (cleanupError) {
          console.warn(`Failed to clean up temporary PDF file: ${tempPdfPath}`, cleanupError);
        }
      }
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