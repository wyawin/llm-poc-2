import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { fromPath } from 'pdf2pic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DocumentProcessor {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async convertToImages(filePath, mimeType) {
    const images = [];

    try {
      if (mimeType === 'application/pdf') {
        // Convert PDF to images using pdf2pic
        console.log(`Converting PDF to images: ${filePath}`);
        
        const convert = fromPath(filePath, {
          density: 200,           // Output DPI (higher = better quality)
          saveFilename: `pdf_${Date.now()}`,
          savePath: this.tempDir,
          format: "jpeg",         // Output format
          width: 2048,           // Max width
          height: 2048,          // Max height
          quality: 90            // JPEG quality
        });

        // Get the number of pages first
        const pdfInfo = await this.getPdfPageCount(filePath);
        const pageCount = pdfInfo || 10; // Fallback to 10 if we can't determine

        console.log(`PDF has ${pageCount} pages, converting...`);

        // Convert all pages
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          try {
            const result = await convert(pageNum, { responseType: "image" });
            
            if (result && result.path) {
              images.push(result.path);
              console.log(`Converted page ${pageNum} to: ${result.path}`);
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

  async getPdfPageCount(filePath) {
    try {
      // Try to get page count by attempting to convert page 1 and checking metadata
      const convert = fromPath(filePath, {
        density: 72,
        saveFilename: `temp_count_${Date.now()}`,
        savePath: this.tempDir,
        format: "jpeg"
      });

      // Try converting increasingly higher page numbers until we fail
      let pageCount = 1;
      for (let i = 1; i <= 100; i++) { // Reasonable upper limit
        try {
          await convert(i, { responseType: "image" });
          pageCount = i;
        } catch (error) {
          if (error.message.includes('Invalid page number') || 
              error.message.includes('page does not exist')) {
            break;
          }
          // For other errors, continue trying
        }
      }

      return pageCount;
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