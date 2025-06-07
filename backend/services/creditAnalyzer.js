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

  async generateRecommendation(allExtractedData, ollamaInsights, groupedFinancialData) {
    try {
      console.log('Generating comprehensive credit recommendation with grouped financial data');

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
        
        // Enhanced financial metrics with grouped data
        financialMetrics: this.calculateFinancialMetrics(allExtractedData),
        
        // NEW: Grouped financial data for table display
        groupedFinancialData: groupedFinancialData,
        
        // NEW: Financial trends analysis
        financialTrends: this.analyzeFinancialTrends(groupedFinancialData),
        
        // NEW: Multi-period analysis
        multiPeriodAnalysis: this.generateMultiPeriodAnalysis(groupedFinancialData)
      };

      return recommendation;

    } catch (error) {
      console.error('Credit recommendation error:', error);
      throw new Error(`Failed to generate credit recommendation: ${error.message}`);
    }
  }

  analyzeFinancialTrends(groupedData) {
    const trends = {
      revenue: { trend: 'stable', changePercent: 0, periods: [] },
      profitability: { trend: 'stable', changePercent: 0, periods: [] },
      assets: { trend: 'stable', changePercent: 0, periods: [] },
      liquidity: { trend: 'stable', changePercent: 0, periods: [] }
    };

    // Analyze P&L trends
    if (groupedData.profitLossStatements.length >= 2) {
      const sortedPL = [...groupedData.profitLossStatements].sort((a, b) => 
        this.comparePeriods(a.period, b.period)
      );

      // Revenue trend
      const revenueData = sortedPL.map(pl => ({ period: pl.period, value: pl.revenue }));
      trends.revenue = this.calculateTrend(revenueData, 'Revenue');

      // Profitability trend
      const profitData = sortedPL.map(pl => ({ period: pl.period, value: pl.netIncome }));
      trends.profitability = this.calculateTrend(profitData, 'Net Income');
    }

    // Analyze Balance Sheet trends
    if (groupedData.balanceSheets.length >= 2) {
      const sortedBS = [...groupedData.balanceSheets].sort((a, b) => 
        this.comparePeriods(a.asOfDate, b.asOfDate)
      );

      // Assets trend
      const assetsData = sortedBS.map(bs => ({ period: bs.asOfDate, value: bs.totalAssets }));
      trends.assets = this.calculateTrend(assetsData, 'Total Assets');
    }

    // Analyze Bank Statement trends
    if (groupedData.bankStatements.length >= 2) {
      const sortedBank = [...groupedData.bankStatements].sort((a, b) => 
        this.comparePeriods(a.period, b.period)
      );

      // Liquidity trend (average balance)
      const liquidityData = sortedBank.map(bs => ({ period: bs.period, value: bs.balance }));
      trends.liquidity = this.calculateTrend(liquidityData, 'Bank Balance');
    }

    return trends;
  }

  calculateTrend(data, label) {
    if (data.length < 2) {
      return { trend: 'insufficient_data', changePercent: 0, periods: [], label };
    }

    const firstValue = data[0].value || 0;
    const lastValue = data[data.length - 1].value || 0;
    
    let changePercent = 0;
    let trend = 'stable';

    if (firstValue !== 0) {
      changePercent = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
      
      if (changePercent > 10) {
        trend = 'increasing';
      } else if (changePercent < -10) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }
    } else if (lastValue > 0) {
      trend = 'increasing';
      changePercent = 100;
    }

    return {
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
      periods: data.map(d => d.period),
      firstValue,
      lastValue,
      label
    };
  }

  generateMultiPeriodAnalysis(groupedData) {
    const analysis = {
      periodsAnalyzed: new Set(),
      consistencyScore: 0,
      dataQuality: 'good',
      keyInsights: [],
      recommendations: []
    };

    // Collect all periods
    groupedData.profitLossStatements.forEach(pl => analysis.periodsAnalyzed.add(pl.period));
    groupedData.balanceSheets.forEach(bs => analysis.periodsAnalyzed.add(bs.asOfDate));
    groupedData.bankStatements.forEach(bank => analysis.periodsAnalyzed.add(bank.period));
    groupedData.cashFlowStatements.forEach(cf => analysis.periodsAnalyzed.add(cf.period));

    analysis.periodsAnalyzed = Array.from(analysis.periodsAnalyzed).filter(p => p !== 'Unknown Period' && p !== 'Unknown Date');

    // Calculate consistency score
    const totalStatements = groupedData.profitLossStatements.length + 
                           groupedData.balanceSheets.length + 
                           groupedData.cashFlowStatements.length;
    
    if (totalStatements >= 6) {
      analysis.consistencyScore = 0.9;
      analysis.dataQuality = 'excellent';
    } else if (totalStatements >= 3) {
      analysis.consistencyScore = 0.7;
      analysis.dataQuality = 'good';
    } else {
      analysis.consistencyScore = 0.4;
      analysis.dataQuality = 'limited';
    }

    // Generate insights
    if (groupedData.profitLossStatements.length >= 2) {
      analysis.keyInsights.push('Multiple profit & loss statements available for trend analysis');
    }
    
    if (groupedData.balanceSheets.length >= 2) {
      analysis.keyInsights.push('Multiple balance sheets enable asset and liability trend evaluation');
    }

    if (groupedData.bankStatements.length >= 3) {
      analysis.keyInsights.push('Comprehensive banking history provides strong cash flow insights');
    }

    // Generate recommendations
    if (analysis.periodsAnalyzed.length < 2) {
      analysis.recommendations.push('Request additional historical financial statements for better trend analysis');
    }

    if (groupedData.cashFlowStatements.length === 0) {
      analysis.recommendations.push('Cash flow statements would enhance liquidity assessment');
    }

    if (groupedData.creditReports.length === 0) {
      analysis.recommendations.push('Credit history report would improve risk assessment accuracy');
    }

    return analysis;
  }

  comparePeriods(periodA, periodB) {
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