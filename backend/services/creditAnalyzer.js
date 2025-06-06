export class CreditAnalyzer {
  constructor() {
    this.scoringWeights = {
      revenue: 0.20,
      profitability: 0.15,
      assets: 0.15,
      liquidity: 0.15,
      debtRatio: 0.20,
      creditHistory: 0.10,
      managementQuality: 0.05
    };
  }

  async generateRecommendation(allExtractedData, ollamaInsights) {
    try {
      console.log('Generating comprehensive credit recommendation');

      // Use Ollama insights as primary recommendation
      const recommendation = {
        // Core recommendation from Ollama
        score: ollamaInsights.scoring?.creditScore || this.calculateFallbackScore(allExtractedData),
        recommendation: ollamaInsights.recommendation?.decision || 'decline',
        riskLevel: ollamaInsights.scoring?.riskRating?.toLowerCase() || 'high',
        creditLimit: ollamaInsights.scoring?.creditLimit || 0,
        interestRate: ollamaInsights.scoring?.interestRate || null,
        
        // Enhanced analysis
        businessOverview: ollamaInsights.businessOverview,
        financialAnalysis: ollamaInsights.financialAnalysis,
        creditRiskAssessment: ollamaInsights.creditRiskAssessment,
        
        // Insights and recommendations
        keyStrengths: ollamaInsights.insights?.keyStrengths || [],
        keyWeaknesses: ollamaInsights.insights?.keyWeaknesses || [],
        riskFactors: ollamaInsights.insights?.riskFactors || [],
        mitigationStrategies: ollamaInsights.insights?.mitigationStrategies || [],
        
        // Detailed reasoning
        reasons: this.extractReasons(ollamaInsights),
        conditions: ollamaInsights.recommendation?.conditions || [],
        
        // Summary and metadata
        executiveSummary: ollamaInsights.summary,
        confidenceLevel: ollamaInsights.scoring?.confidenceLevel || 0.5,
        analysisDate: new Date().toISOString(),
        documentsAnalyzed: allExtractedData.length,
        
        // Document breakdown
        documentSummary: this.generateDocumentSummary(allExtractedData),
        
        // Financial metrics
        financialMetrics: this.calculateFinancialMetrics(allExtractedData)
      };

      return recommendation;

    } catch (error) {
      console.error('Credit recommendation error:', error);
      throw new Error(`Failed to generate credit recommendation: ${error.message}`);
    }
  }

  extractReasons(insights) {
    const reasons = [];
    
    // Extract reasons from different sections
    if (insights.recommendation?.reasoning) {
      reasons.push(insights.recommendation.reasoning);
    }
    
    if (insights.businessOverview?.companyProfile) {
      reasons.push(`Business Profile: ${insights.businessOverview.companyProfile.substring(0, 100)}...`);
    }
    
    if (insights.financialAnalysis?.revenueAnalysis) {
      reasons.push(`Revenue Analysis: ${insights.financialAnalysis.revenueAnalysis.substring(0, 100)}...`);
    }
    
    if (insights.creditRiskAssessment?.overallCreditworthiness) {
      reasons.push(`Creditworthiness: ${insights.creditRiskAssessment.overallCreditworthiness.substring(0, 100)}...`);
    }
    
    return reasons.length > 0 ? reasons : ['Analysis completed based on available financial documents'];
  }

  calculateFallbackScore(allExtractedData) {
    // Fallback scoring if Ollama doesn't provide a score
    let score = 300; // Base score
    
    for (const data of allExtractedData) {
      // Revenue factor
      if (data.financialInfo?.profitLoss?.revenue) {
        const revenue = data.financialInfo.profitLoss.revenue;
        if (revenue > 1000000) score += 100;
        else if (revenue > 500000) score += 75;
        else if (revenue > 100000) score += 50;
        else if (revenue > 50000) score += 25;
      }
      
      // Profitability factor
      if (data.financialInfo?.profitLoss?.netIncome) {
        const netIncome = data.financialInfo.profitLoss.netIncome;
        if (netIncome > 0) score += 75;
        else score -= 50;
      }
      
      // Assets factor
      if (data.financialInfo?.balanceSheet?.totalAssets) {
        const assets = data.financialInfo.balanceSheet.totalAssets;
        if (assets > 500000) score += 75;
        else if (assets > 100000) score += 50;
        else if (assets > 50000) score += 25;
      }
      
      // Credit history factor
      if (data.financialInfo?.creditInfo?.creditScore) {
        const creditScore = data.financialInfo.creditInfo.creditScore;
        if (creditScore > 700) score += 100;
        else if (creditScore > 600) score += 50;
        else if (creditScore > 500) score += 25;
        else score -= 25;
      }
    }
    
    return Math.min(850, Math.max(300, score));
  }

  generateDocumentSummary(allExtractedData) {
    const summary = {
      totalDocuments: allExtractedData.length,
      documentTypes: [],
      companiesAnalyzed: new Set(),
      individualsIdentified: new Set(),
      timePeriodsAnalyzed: new Set()
    };
    
    for (const data of allExtractedData) {
      // Document types
      if (data.documentType && data.documentType !== 'Unknown') {
        summary.documentTypes.push(data.documentType);
      }
      
      // Companies
      if (data.companyInfo?.name) {
        summary.companiesAnalyzed.add(data.companyInfo.name);
      }
      
      // Individuals
      if (data.personalInfo?.individuals) {
        data.personalInfo.individuals.forEach(individual => {
          if (individual.name) {
            summary.individualsIdentified.add(individual.name);
          }
        });
      }
      
      // Time periods
      if (data.financialInfo?.profitLoss?.period) {
        summary.timePeriodsAnalyzed.add(data.financialInfo.profitLoss.period);
      }
      if (data.financialInfo?.balanceSheet?.asOfDate) {
        summary.timePeriodsAnalyzed.add(data.financialInfo.balanceSheet.asOfDate);
      }
    }
    
    return {
      totalDocuments: summary.totalDocuments,
      documentTypes: [...new Set(summary.documentTypes)],
      companiesAnalyzed: Array.from(summary.companiesAnalyzed),
      individualsIdentified: Array.from(summary.individualsIdentified),
      timePeriodsAnalyzed: Array.from(summary.timePeriodsAnalyzed)
    };
  }

  calculateFinancialMetrics(allExtractedData) {
    const metrics = {
      totalRevenue: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      netIncome: 0,
      operatingCashFlow: 0,
      debtToAssetRatio: 0,
      profitMargin: 0,
      returnOnAssets: 0
    };
    
    for (const data of allExtractedData) {
      // Revenue and income
      if (data.financialInfo?.profitLoss?.revenue) {
        metrics.totalRevenue += data.financialInfo.profitLoss.revenue;
      }
      if (data.financialInfo?.profitLoss?.netIncome) {
        metrics.netIncome += data.financialInfo.profitLoss.netIncome;
      }
      
      // Balance sheet items
      if (data.financialInfo?.balanceSheet?.totalAssets) {
        metrics.totalAssets += data.financialInfo.balanceSheet.totalAssets;
      }
      if (data.financialInfo?.balanceSheet?.totalLiabilities) {
        metrics.totalLiabilities += data.financialInfo.balanceSheet.totalLiabilities;
      }
      
      // Cash flow
      if (data.financialInfo?.cashFlow?.operatingCashFlow) {
        metrics.operatingCashFlow += data.financialInfo.cashFlow.operatingCashFlow;
      }
    }
    
    // Calculate ratios
    if (metrics.totalAssets > 0) {
      metrics.debtToAssetRatio = metrics.totalLiabilities / metrics.totalAssets;
      metrics.returnOnAssets = metrics.netIncome / metrics.totalAssets;
    }
    
    if (metrics.totalRevenue > 0) {
      metrics.profitMargin = metrics.netIncome / metrics.totalRevenue;
    }
    
    return metrics;
  }
}