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

      // Validate inputs
      if (!ollamaInsights) {
        throw new Error('Ollama insights are required for recommendation generation');
      }

      if (!allExtractedData || allExtractedData.length === 0) {
        throw new Error('No extracted data available for recommendation');
      }

      // Use Ollama insights as primary recommendation with fallbacks
      const recommendation = {
        // Core recommendation from Ollama with fallbacks
        score: this.getValidScore(ollamaInsights.scoring?.creditScore) || this.calculateFallbackScore(allExtractedData),
        recommendation: this.getValidRecommendation(ollamaInsights.recommendation?.decision) || 'decline',
        riskLevel: this.getValidRiskLevel(ollamaInsights.scoring?.riskRating) || 'high',
        creditLimit: this.getValidNumber(ollamaInsights.scoring?.creditLimit) || 0,
        interestRate: this.getValidNumber(ollamaInsights.scoring?.interestRate) || null,
        
        // Enhanced analysis with fallbacks
        businessOverview: this.getValidBusinessOverview(ollamaInsights.businessOverview),
        financialAnalysis: this.getValidFinancialAnalysis(ollamaInsights.financialAnalysis),
        creditRiskAssessment: this.getValidCreditRiskAssessment(ollamaInsights.creditRiskAssessment),
        
        // Insights and recommendations with fallbacks
        keyStrengths: this.getValidArray(ollamaInsights.insights?.keyStrengths) || ['Financial documents provided'],
        keyWeaknesses: this.getValidArray(ollamaInsights.insights?.keyWeaknesses) || ['Limited analysis available'],
        riskFactors: this.getValidArray(ollamaInsights.insights?.riskFactors) || ['Insufficient data for comprehensive assessment'],
        mitigationStrategies: this.getValidArray(ollamaInsights.insights?.mitigationStrategies) || ['Provide additional financial documentation'],
        
        // Detailed reasoning
        reasons: this.extractReasons(ollamaInsights),
        conditions: this.getValidArray(ollamaInsights.recommendation?.conditions) || [],
        
        // Summary and metadata
        executiveSummary: this.getValidString(ollamaInsights.summary) || 'Credit analysis completed based on available financial documents',
        confidenceLevel: this.getValidNumber(ollamaInsights.scoring?.confidenceLevel) || 0.5,
        analysisDate: new Date().toISOString(),
        documentsAnalyzed: allExtractedData.length,
        
        // Document breakdown
        documentSummary: this.generateDocumentSummary(allExtractedData),
        
        // Enhanced financial metrics with grouped data
        financialMetrics: this.calculateFinancialMetrics(allExtractedData),
        
        // NEW: Grouped financial data for table display
        groupedFinancialData: groupedFinancialData || null,
        
        // NEW: Financial trends analysis
        financialTrends: groupedFinancialData ? this.analyzeFinancialTrends(groupedFinancialData) : null,
        
        // NEW: Multi-period analysis
        multiPeriodAnalysis: groupedFinancialData ? this.generateMultiPeriodAnalysis(groupedFinancialData) : null
      };

      console.log('Credit recommendation generated successfully:', {
        score: recommendation.score,
        recommendation: recommendation.recommendation,
        riskLevel: recommendation.riskLevel,
        hasGroupedData: !!recommendation.groupedFinancialData,
        hasTrends: !!recommendation.financialTrends
      });

      return recommendation;

    } catch (error) {
      console.error('Credit recommendation error:', error);
      throw new Error(`Failed to generate credit recommendation: ${error.message}`);
    }
  }

  // Validation helper methods
  getValidScore(score) {
    const numScore = Number(score);
    return (numScore >= 300 && numScore <= 850) ? numScore : null;
  }

  getValidRecommendation(decision) {
    const validDecisions = ['approve', 'conditional', 'decline'];
    return validDecisions.includes(decision) ? decision : null;
  }

  getValidRiskLevel(riskRating) {
    const validRisks = ['low', 'medium', 'high'];
    const normalized = riskRating?.toLowerCase();
    return validRisks.includes(normalized) ? normalized : null;
  }

  getValidNumber(value) {
    const num = Number(value);
    return !isNaN(num) && isFinite(num) ? num : null;
  }

  getValidString(value) {
    return (typeof value === 'string' && value.trim().length > 0) ? value.trim() : null;
  }

  getValidArray(value) {
    return Array.isArray(value) && value.length > 0 ? value : null;
  }

  getValidBusinessOverview(overview) {
    if (!overview || typeof overview !== 'object') {
      return {
        companyProfile: 'Company profile analysis not available',
        industryAnalysis: 'Industry analysis not available',
        managementAssessment: 'Management assessment not available',
        businessModelEvaluation: 'Business model evaluation not available'
      };
    }

    return {
      companyProfile: this.getValidString(overview.companyProfile) || 'Company profile analysis not available',
      industryAnalysis: this.getValidString(overview.industryAnalysis) || 'Industry analysis not available',
      managementAssessment: this.getValidString(overview.managementAssessment) || 'Management assessment not available',
      businessModelEvaluation: this.getValidString(overview.businessModelEvaluation) || 'Business model evaluation not available'
    };
  }

  getValidFinancialAnalysis(analysis) {
    if (!analysis || typeof analysis !== 'object') {
      return {
        revenueAnalysis: 'Revenue analysis not available',
        profitabilityAssessment: 'Profitability assessment not available',
        balanceSheetStrength: 'Balance sheet analysis not available',
        cashFlowAnalysis: 'Cash flow analysis not available',
        debtCapacity: 'Debt capacity evaluation not available'
      };
    }

    return {
      revenueAnalysis: this.getValidString(analysis.revenueAnalysis) || 'Revenue analysis not available',
      profitabilityAssessment: this.getValidString(analysis.profitabilityAssessment) || 'Profitability assessment not available',
      balanceSheetStrength: this.getValidString(analysis.balanceSheetStrength) || 'Balance sheet analysis not available',
      cashFlowAnalysis: this.getValidString(analysis.cashFlowAnalysis) || 'Cash flow analysis not available',
      debtCapacity: this.getValidString(analysis.debtCapacity) || 'Debt capacity evaluation not available'
    };
  }

  getValidCreditRiskAssessment(assessment) {
    if (!assessment || typeof assessment !== 'object') {
      return {
        paymentHistoryEvaluation: 'Payment history evaluation not available',
        debtRatios: 'Debt ratio analysis not available',
        liquidityPosition: 'Liquidity assessment not available',
        overallCreditworthiness: 'Overall creditworthiness assessment not available'
      };
    }

    return {
      paymentHistoryEvaluation: this.getValidString(assessment.paymentHistoryEvaluation) || 'Payment history evaluation not available',
      debtRatios: this.getValidString(assessment.debtRatios) || 'Debt ratio analysis not available',
      liquidityPosition: this.getValidString(assessment.liquidityPosition) || 'Liquidity assessment not available',
      overallCreditworthiness: this.getValidString(assessment.overallCreditworthiness) || 'Overall creditworthiness assessment not available'
    };
  }

  analyzeFinancialTrends(groupedData) {
    const trends = {
      revenue: { trend: 'stable', changePercent: 0, periods: [], label: 'Revenue' },
      profitability: { trend: 'stable', changePercent: 0, periods: [], label: 'Profitability' },
      assets: { trend: 'stable', changePercent: 0, periods: [], label: 'Assets' },
      liquidity: { trend: 'stable', changePercent: 0, periods: [], label: 'Liquidity' }
    };

    try {
      // Analyze P&L trends
      if (groupedData.profitLossStatements && groupedData.profitLossStatements.length >= 2) {
        const sortedPL = [...groupedData.profitLossStatements].sort((a, b) => 
          this.comparePeriods(a.period, b.period)
        );

        // Revenue trend
        const revenueData = sortedPL.map(pl => ({ period: pl.period, value: pl.revenue || 0 }));
        trends.revenue = this.calculateTrend(revenueData, 'Revenue');

        // Profitability trend
        const profitData = sortedPL.map(pl => ({ period: pl.period, value: pl.netIncome || 0 }));
        trends.profitability = this.calculateTrend(profitData, 'Profitability');
      }

      // Analyze Balance Sheet trends
      if (groupedData.balanceSheets && groupedData.balanceSheets.length >= 2) {
        const sortedBS = [...groupedData.balanceSheets].sort((a, b) => 
          this.comparePeriods(a.asOfDate, b.asOfDate)
        );

        // Assets trend
        const assetsData = sortedBS.map(bs => ({ period: bs.asOfDate, value: bs.totalAssets || 0 }));
        trends.assets = this.calculateTrend(assetsData, 'Assets');
      }

      // Analyze Bank Statement trends
      if (groupedData.bankStatements && groupedData.bankStatements.length >= 2) {
        const sortedBank = [...groupedData.bankStatements].sort((a, b) => 
          this.comparePeriods(a.period, b.period)
        );

        // Liquidity trend (average balance)
        const liquidityData = sortedBank.map(bs => ({ period: bs.period, value: bs.balance || 0 }));
        trends.liquidity = this.calculateTrend(liquidityData, 'Liquidity');
      }
    } catch (error) {
      console.error('Error analyzing financial trends:', error);
    }

    return trends;
  }

  calculateTrend(data, label) {
    if (!data || data.length < 2) {
      return { trend: 'insufficient_data', changePercent: 0, periods: [], label };
    }

    const validData = data.filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value));
    
    if (validData.length < 2) {
      return { trend: 'insufficient_data', changePercent: 0, periods: [], label };
    }

    const firstValue = validData[0].value || 0;
    const lastValue = validData[validData.length - 1].value || 0;
    
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
      periods: validData.map(d => d.period),
      firstValue,
      lastValue,
      label
    };
  }

  generateMultiPeriodAnalysis(groupedData) {
    const analysis = {
      periodsAnalyzed: [],
      consistencyScore: 0,
      dataQuality: 'limited',
      keyInsights: [],
      recommendations: []
    };

    try {
      const periodsSet = new Set();

      // Collect all periods
      if (groupedData.profitLossStatements) {
        groupedData.profitLossStatements.forEach(pl => {
          if (pl.period && pl.period !== 'Unknown Period') {
            periodsSet.add(pl.period);
          }
        });
      }

      if (groupedData.balanceSheets) {
        groupedData.balanceSheets.forEach(bs => {
          if (bs.asOfDate && bs.asOfDate !== 'Unknown Date') {
            periodsSet.add(bs.asOfDate);
          }
        });
      }

      if (groupedData.bankStatements) {
        groupedData.bankStatements.forEach(bank => {
          if (bank.period && bank.period !== 'Unknown Period') {
            periodsSet.add(bank.period);
          }
        });
      }

      if (groupedData.cashFlowStatements) {
        groupedData.cashFlowStatements.forEach(cf => {
          if (cf.period && cf.period !== 'Unknown Period') {
            periodsSet.add(cf.period);
          }
        });
      }

      analysis.periodsAnalyzed = Array.from(periodsSet);

      // Calculate consistency score
      const totalStatements = (groupedData.profitLossStatements?.length || 0) + 
                             (groupedData.balanceSheets?.length || 0) + 
                             (groupedData.cashFlowStatements?.length || 0);
      
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
      if (groupedData.profitLossStatements && groupedData.profitLossStatements.length >= 2) {
        analysis.keyInsights.push('Multiple profit & loss statements available for trend analysis');
      }
      
      if (groupedData.balanceSheets && groupedData.balanceSheets.length >= 2) {
        analysis.keyInsights.push('Multiple balance sheets enable asset and liability trend evaluation');
      }

      if (groupedData.bankStatements && groupedData.bankStatements.length >= 3) {
        analysis.keyInsights.push('Comprehensive banking history provides strong cash flow insights');
      }

      // Generate recommendations
      if (analysis.periodsAnalyzed.length < 2) {
        analysis.recommendations.push('Request additional historical financial statements for better trend analysis');
      }

      if (!groupedData.cashFlowStatements || groupedData.cashFlowStatements.length === 0) {
        analysis.recommendations.push('Cash flow statements would enhance liquidity assessment');
      }

      if (!groupedData.creditReports || groupedData.creditReports.length === 0) {
        analysis.recommendations.push('Credit history report would improve risk assessment accuracy');
      }
    } catch (error) {
      console.error('Error generating multi-period analysis:', error);
      analysis.keyInsights.push('Error occurred during multi-period analysis');
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
    
    try {
      // Extract reasons from different sections
      if (insights.recommendation?.reasoning) {
        reasons.push(insights.recommendation.reasoning);
      }
      
      if (insights.businessOverview?.companyProfile) {
        const profile = insights.businessOverview.companyProfile;
        if (profile.length > 100) {
          reasons.push(`Business Profile: ${profile.substring(0, 100)}...`);
        } else {
          reasons.push(`Business Profile: ${profile}`);
        }
      }
      
      if (insights.financialAnalysis?.revenueAnalysis) {
        const revenue = insights.financialAnalysis.revenueAnalysis;
        if (revenue.length > 100) {
          reasons.push(`Revenue Analysis: ${revenue.substring(0, 100)}...`);
        } else {
          reasons.push(`Revenue Analysis: ${revenue}`);
        }
      }
      
      if (insights.creditRiskAssessment?.overallCreditworthiness) {
        const creditworthiness = insights.creditRiskAssessment.overallCreditworthiness;
        if (creditworthiness.length > 100) {
          reasons.push(`Creditworthiness: ${creditworthiness.substring(0, 100)}...`);
        } else {
          reasons.push(`Creditworthiness: ${creditworthiness}`);
        }
      }
    } catch (error) {
      console.error('Error extracting reasons:', error);
    }
    
    return reasons.length > 0 ? reasons : ['Analysis completed based on available financial documents'];
  }

  calculateFallbackScore(allExtractedData) {
    // Fallback scoring if Ollama doesn't provide a score
    let score = 300; // Base score
    
    try {
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
    } catch (error) {
      console.error('Error calculating fallback score:', error);
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
    
    try {
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
    } catch (error) {
      console.error('Error generating document summary:', error);
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
    
    try {
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
    } catch (error) {
      console.error('Error calculating financial metrics:', error);
    }
    
    return metrics;
  }
}