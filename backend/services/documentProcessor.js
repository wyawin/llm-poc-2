import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

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
        // Convert PDF to images using pdf-poppler
        const pdf = await import('pdf-poppler');
        const options = {
          format: 'jpeg',
          out_dir: this.tempDir,
          out_prefix: `pdf_${Date.now()}`,
          page: null // Convert all pages
        };

        const pdfPages = await pdf.convert(filePath, options);
        
        // pdf-poppler returns an array of page info, but files are saved to disk
        // We need to find the generated files
        const files = await fs.readdir(this.tempDir);
        const pdfFiles = files.filter(file => file.startsWith(options.out_prefix));
        
        for (const file of pdfFiles) {
          const imagePath = path.join(this.tempDir, file);
          images.push(imagePath);
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

      console.log(`Converted document to ${images.length} image(s)`);
      return images;

    } catch (error) {
      console.error('Document conversion error:', error);
      throw new Error(`Failed to convert document: ${error.message}`);
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
        } catch (error) {
          console.warn(`Failed to delete temporary image: ${imagePath}`, error);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}