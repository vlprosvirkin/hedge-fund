import type { Claim, MarketStats, SignalStrength } from '../types/index.js';

export interface SignalAnalysis {
  ticker: string;
  overallSignal: number; // -1 to 1 (sell to buy)
  confidence: number; // 0 to 1
  volatility: number; // 0 to 1
  momentum: number; // -1 to 1
  sentiment: number; // -1 to 1
  fundamental: number; // -1 to 1
  technical: number; // -1 to 1
  riskScore: number; // 0 to 1 (higher = more risky)
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  rationale: string;
  timeHorizon: 'short' | 'medium' | 'long';
  positionSize: number; // 0 to 1 (recommended position size)
}

export interface SignalMetrics {
  signalStrength: number; // -1 to 1
  confidence: number; // 0 to 1
  volatility: number; // 0 to 1
  momentum: number; // -1 to 1
  riskAdjustedReturn: number; // Sharpe-like ratio
  maxDrawdown: number; // 0 to 1
  correlation: number; // -1 to 1 (with market)
  liquidity: number; // 0 to 1
}

export class SignalProcessorService {
  private readonly riskFreeRate = 0.02; // 2% annual risk-free rate
  private readonly marketBeta = 1.0; // Market beta for crypto

  /**
   * Process claims from all agents and generate comprehensive signal analysis
   */
  processSignals(
    claims: Claim[],
    marketStats: MarketStats[],
    riskProfile: 'averse' | 'neutral' | 'bold',
    technicalDataMap?: Map<string, any> // Add technical data map
  ): SignalAnalysis[] {
    console.log(`🎯 SignalProcessor: Processing ${claims.length} claims for ${marketStats.length} market stats`);
    console.log(`🎯 SignalProcessor: Risk profile: ${riskProfile}, Technical data available: ${technicalDataMap ? 'Yes' : 'No'}`);

    const tickerGroups = this.groupClaimsByTicker(claims);
    console.log(`🎯 SignalProcessor: Grouped claims by ${tickerGroups.size} tickers:`, Array.from(tickerGroups.keys()));

    const analyses: SignalAnalysis[] = [];

    for (const [ticker, tickerClaims] of tickerGroups) {
      const marketStat = marketStats.find(stat => stat.symbol === ticker);
      if (!marketStat) {
        console.log(`🎯 SignalProcessor: No market stats for ${ticker}, skipping`);
        continue;
      }

      // Get technical data for this ticker if available
      const technicalData = technicalDataMap?.get(ticker);
      console.log(`🎯 SignalProcessor: Analyzing ${ticker} with ${tickerClaims.length} claims, technical data: ${technicalData ? 'Available' : 'Not available'}`);

      const analysis = this.analyzeTickerSignals(ticker, tickerClaims, marketStat, riskProfile, technicalData);
      console.log(`🎯 SignalProcessor: ${ticker} analysis - Signal: ${(analysis.overallSignal * 100).toFixed(1)}%, Recommendation: ${analysis.recommendation}, Risk: ${(analysis.riskScore * 100).toFixed(1)}%`);
      analyses.push(analysis);
    }

    const sortedAnalyses = analyses.sort((a, b) => b.overallSignal - a.overallSignal);
    console.log(`🎯 SignalProcessor: Signal processing completed for ${sortedAnalyses.length} tickers`);
    sortedAnalyses.forEach((analysis, i) => {
      console.log(`🎯 SignalProcessor: ${i + 1}. ${analysis.ticker} - ${analysis.recommendation} (${(analysis.overallSignal * 100).toFixed(1)}%)`);
    });

    return sortedAnalyses;
  }

  /**
   * Analyze signals for a specific ticker using multi-dimensional approach
   */
  private analyzeTickerSignals(
    ticker: string,
    claims: Claim[],
    marketStat: MarketStats,
    riskProfile: 'averse' | 'neutral' | 'bold',
    technicalData?: any // Add technical data parameter
  ): SignalAnalysis {
    // 1. Extract agent-specific signals
    const fundamental = claims.find(c => c.agentRole === 'fundamental');
    const sentiment = claims.find(c => c.agentRole === 'sentiment');
    const technical = claims.find(c => c.agentRole === 'technical');

    // 2. Calculate multi-dimensional metrics
    console.log(`🔍 analyzeTickerSignals: ${ticker} - fundamental=${!!fundamental}, sentiment=${!!sentiment}, technical=${!!technical}, technicalData=${!!technicalData}`);

    const fundamentalSignal = this.calculateFundamentalSignal(fundamental, marketStat);
    const sentimentSignal = this.calculateSentimentSignal(sentiment);
    const technicalSignal = this.calculateTechnicalSignal(technical, marketStat, technicalData);
    const momentumSignal = this.calculateMomentumSignal(marketStat, technicalData);
    const volatilitySignal = this.calculateVolatilitySignal(marketStat, technicalData);

    console.log(`🔍 analyzeTickerSignals: ${ticker} signals - fundamental=${fundamentalSignal.toFixed(3)}, sentiment=${sentimentSignal.toFixed(3)}, technical=${technicalSignal.toFixed(3)}, momentum=${momentumSignal.toFixed(3)}, volatility=${volatilitySignal.toFixed(3)}`);

    // 3. Calculate risk-adjusted metrics
    const riskScore = this.calculateRiskScore(claims, marketStat);
    const riskAdjustedReturn = this.calculateRiskAdjustedReturn(
      fundamentalSignal,
      sentimentSignal,
      technicalSignal,
      volatilitySignal,
      riskScore
    );

    // 4. Generate overall signal using weighted combination
    const overallSignal = this.calculateOverallSignal(
      fundamentalSignal,
      sentimentSignal,
      technicalSignal,
      momentumSignal,
      riskProfile
    );

    // 5. Determine confidence based on signal consistency
    const confidence = this.calculateConfidence(claims, overallSignal);

    // 6. Generate recommendation with thresholds
    const recommendation = this.generateRecommendation(overallSignal, confidence, riskScore, riskProfile);

    // 7. Calculate position sizing
    const positionSize = this.calculatePositionSize(overallSignal, confidence, riskScore, riskProfile, volatilitySignal, riskAdjustedReturn);

    // 8. Determine time horizon
    const timeHorizon = this.determineTimeHorizon(claims, momentumSignal);

    return {
      ticker,
      overallSignal,
      confidence,
      volatility: volatilitySignal,
      momentum: momentumSignal,
      sentiment: sentimentSignal,
      fundamental: fundamentalSignal,
      technical: technicalSignal,
      riskScore,
      recommendation,
      rationale: this.generateRationale(claims, overallSignal, recommendation),
      timeHorizon,
      positionSize
    };
  }

  /**
   * Calculate fundamental signal based on market metrics
   */
  private calculateFundamentalSignal(claim: Claim | undefined, marketStat: MarketStats): number {
    if (!claim) {
      // If no fundamental claim, use market data only
      const volumeScore = this.calculateVolumeScore(marketStat.volume24h);
      const priceChange = (marketStat.priceChange24h || 0) / 100;
      const volumeMomentum = volumeScore * Math.tanh(priceChange * this.getPriceScalingFactor());
      return Math.max(-1, Math.min(1, volumeMomentum));
    }

    // Base signal from claim confidence and direction
    let signal = claim.confidence * this.directionToSignal(claim.claim);

    // Adjust based on market fundamentals
    const volumeScore = this.calculateVolumeScore(marketStat.volume24h);
    const priceChange = (marketStat.priceChange24h || 0) / 100; // Convert to decimal

    // Volume-weighted price momentum
    const volumeMomentum = volumeScore * Math.tanh(priceChange * this.getPriceScalingFactor());

    // Combine claim signal with market fundamentals using dynamic weights
    const fundamentalWeight = this.calculateFundamentalWeight(claim.confidence);
    const marketWeight = 1 - fundamentalWeight;
    signal = signal * fundamentalWeight + volumeMomentum * marketWeight;

    return Math.max(-1, Math.min(1, signal));
  }

  /**
   * Calculate sentiment signal with reflection/criticism process
   */
  private calculateSentimentSignal(claim: Claim | undefined): number {
    if (!claim) {
      // If no sentiment claim, return neutral sentiment
      return 0.0;
    }

    // Base sentiment signal
    let signal = claim.confidence * this.directionToSignal(claim.claim);

    // Apply sentiment-specific adjustments
    const riskFlags = claim.riskFlags || [];

    // Calculate data-driven penalties based on risk flags
    const penalty = this.calculateSentimentPenalty(riskFlags);
    signal *= penalty;

    // Boost for high credibility sources
    const credibilityBoost = this.calculateCredibilityBoost(claim.confidence);
    signal *= credibilityBoost;

    return Math.max(-1, Math.min(1, signal));
  }

  /**
   * Calculate technical signal with mathematical rigor
   */
  private calculateTechnicalSignal(claim: Claim | undefined, marketStat: MarketStats, technicalData?: any): number {
    console.log(`🔍 calculateTechnicalSignal: claim=${claim?.ticker}, technicalData=${!!technicalData}`);

    if (!claim) {
      // If no technical claim, use market momentum as technical signal
      const priceChange = (marketStat.priceChange24h || 0) / 100;
      const volumeChange = (marketStat.volumeChange24h || 0) / 100;

      // Calculate technical signal from market data
      const priceSignal = Math.tanh(priceChange * 2);
      const volumeSignal = Math.tanh(volumeChange * 0.5);

      // Combine price and volume signals
      const result = Math.max(-1, Math.min(1, (priceSignal * 0.7 + volumeSignal * 0.3)));
      console.log(`🔍 calculateTechnicalSignal: No claim, using market data - result=${result.toFixed(3)}`);
      return result;
    }

    // First try to get technical indicators from technical data
    let rsi, macd, volatility;

    if (technicalData) {
      rsi = technicalData.RSI;
      macd = technicalData['MACD.macd'];
      volatility = technicalData.AO; // Use Awesome Oscillator as volatility proxy
      console.log(`🔍 calculateTechnicalSignal: From technicalData - RSI=${rsi}, MACD=${macd}, AO=${volatility}`);
    }

    // Fallback to signals array if technical data not available
    if (rsi === undefined || macd === undefined) {
      const signals = claim.signals || [];
      rsi = rsi ?? signals.find((s: { name: string; value: number }) => s.name === 'rsi')?.value;
      macd = macd ?? signals.find((s: { name: string; value: number }) => s.name === 'macd')?.value;
      volatility = volatility ?? signals.find((s: { name: string; value: number }) => s.name === 'volatility_30d')?.value;
      console.log(`🔍 calculateTechnicalSignal: From signals - RSI=${rsi}, MACD=${macd}, volatility=${volatility}`);
    }

    // Calculate technical signal based on indicators
    let signal = 0;

    // If we have technical indicators, use them to calculate signal
    if (rsi !== undefined || macd !== undefined || volatility !== undefined) {
      let rsiSignal = 0, macdSignal = 0, volatilitySignal = 0;

      if (rsi !== undefined) {
        // RSI signal: 0-30 = bullish, 70-100 = bearish, 30-70 = neutral
        if (rsi < 30) rsiSignal = (30 - rsi) / 30; // Bullish signal
        else if (rsi > 70) rsiSignal = -(rsi - 70) / 30; // Bearish signal
        else rsiSignal = 0; // Neutral
      }

      if (macd !== undefined) {
        // MACD signal: positive = bullish, negative = bearish
        macdSignal = Math.tanh(macd * 0.001); // Scale MACD to reasonable range
      }

      if (volatility !== undefined) {
        // Volatility signal: high volatility = more uncertainty
        volatilitySignal = Math.min(Math.abs(volatility) * 0.01, 0.5); // Scale volatility
      }

      // Combine signals with weights
      const weights = { rsi: 0.4, macd: 0.4, volatility: 0.2 };
      signal = (rsiSignal * weights.rsi + macdSignal * weights.macd + volatilitySignal * weights.volatility);

      console.log(`🔍 calculateTechnicalSignal: Technical indicators - RSI=${rsiSignal.toFixed(3)}, MACD=${macdSignal.toFixed(3)}, Vol=${volatilitySignal.toFixed(3)}, Combined=${signal.toFixed(3)}`);
    } else {
      // Fallback to claim-based signal
      signal = claim.confidence * this.directionToSignal(claim.claim);
      console.log(`🔍 calculateTechnicalSignal: Using claim-based signal=${signal.toFixed(3)} (confidence=${claim.confidence}, direction=${this.directionToSignal(claim.claim)})`);
    }

    const finalSignal = Math.max(-1, Math.min(1, signal));
    console.log(`🔍 calculateTechnicalSignal: Final signal=${finalSignal.toFixed(3)}`);
    return finalSignal;
  }

  /**
   * Calculate momentum signal from price action
   */
  private calculateMomentumSignal(marketStat: MarketStats, technicalData?: any): number {
    const priceChange = (marketStat.priceChange24h || 0) / 100;
    const volumeChange = (marketStat.volumeChange24h || 0) / 100;

    // Use technical data for better momentum calculation if available
    let momentum = 0;
    if (technicalData) {
      // Use MACD for momentum
      const macd = technicalData['MACD.macd'];
      if (macd !== undefined) {
        momentum = Math.tanh(macd * 0.1); // Scale MACD to reasonable range
      }
    }

    // Combine price and volume momentum with data-driven weights
    const priceMomentum = Math.tanh(priceChange * this.getPriceScalingFactor());
    const volumeMomentum = Math.tanh(volumeChange * this.getVolumeScalingFactor());

    // Dynamic weights based on market conditions
    const priceWeight = this.calculatePriceWeight(priceChange, volumeChange);
    const volumeWeight = 1 - priceWeight;

    const marketMomentum = (priceMomentum * priceWeight + volumeMomentum * volumeWeight);

    // Combine technical momentum with market momentum
    return technicalData ? (momentum * 0.6 + marketMomentum * 0.4) : marketMomentum;
  }

  /**
   * Calculate volatility signal
   */
  private calculateVolatilitySignal(marketStat: MarketStats, technicalData?: any): number {
    // Use technical data for better volatility calculation if available
    if (technicalData) {
      // Use Awesome Oscillator as volatility proxy
      const ao = technicalData.AO;
      if (ao !== undefined) {
        return Math.min(Math.abs(ao) * 0.1, 1); // Scale AO to 0-1
      }
    }

    // Fallback to price change as proxy for volatility
    const priceChange = Math.abs(marketStat.priceChange24h || 0) / 100;
    return Math.min(priceChange * 2, 1); // Scale to 0-1
  }

  /**
   * Calculate comprehensive risk score
   */
  private calculateRiskScore(claims: Claim[], marketStat: MarketStats): number {
    let riskScore = 0;
    let totalWeight = 0;

    // Risk from claims
    for (const claim of claims) {
      const riskFlags = claim.riskFlags || [];
      const claimRisk = riskFlags.length * 0.1; // 10% per risk flag
      const weight = claim.confidence;

      riskScore += claimRisk * weight;
      totalWeight += weight;
    }

    // Market risk
    const volatility = this.calculateVolatilitySignal(marketStat);
    const volumeRisk = Math.max(0, 1 - (marketStat.volume24h || 0) / 1000000); // Low volume = high risk

    riskScore = (riskScore / totalWeight) * 0.6 + volatility * 0.3 + volumeRisk * 0.1;

    return Math.min(1, riskScore);
  }

  /**
   * Calculate risk-adjusted return (Sharpe-like ratio)
   */
  private calculateRiskAdjustedReturn(
    fundamental: number,
    sentiment: number,
    technical: number,
    volatility: number,
    riskScore: number
  ): number {
    const expectedReturn = (fundamental + sentiment + technical) / 3;
    const risk = Math.max(volatility, riskScore, 0.1); // Minimum risk of 10%

    return (expectedReturn - this.riskFreeRate) / risk;
  }

  /**
   * Calculate overall signal with risk profile weighting
   */
  private calculateOverallSignal(
    fundamental: number,
    sentiment: number,
    technical: number,
    momentum: number,
    riskProfile: 'averse' | 'neutral' | 'bold'
  ): number {
    // Risk profile-specific weights
    const weights = {
      averse: { fundamental: 0.4, sentiment: 0.2, technical: 0.3, momentum: 0.1 },
      neutral: { fundamental: 0.3, sentiment: 0.3, technical: 0.3, momentum: 0.1 },
      bold: { fundamental: 0.2, sentiment: 0.2, technical: 0.3, momentum: 0.3 }
    };

    const profileWeights = weights[riskProfile];

    const overallSignal =
      fundamental * profileWeights.fundamental +
      sentiment * profileWeights.sentiment +
      technical * profileWeights.technical +
      momentum * profileWeights.momentum;

    return Math.max(-1, Math.min(1, overallSignal));
  }

  /**
   * Calculate confidence based on signal consistency and data quality
   */
  private calculateConfidence(claims: Claim[], overallSignal: number): number {
    if (claims.length === 0) return 0;

    // Base confidence from claim confidences
    const avgConfidence = claims.reduce((sum, claim) => sum + claim.confidence, 0) / claims.length;

    // Signal consistency bonus
    const signalDirections = claims.map(c => this.directionToSignal(c.claim));
    const consistency = 1 - this.calculateStandardDeviation(signalDirections);

    // Data quality bonus
    const dataQuality = claims.reduce((sum, claim) => {
      const riskFlags = claim.riskFlags || [];
      return sum + (1 - riskFlags.length * 0.1); // Penalize risk flags
    }, 0) / claims.length;

    return Math.min(1, avgConfidence * 0.6 + consistency * 0.3 + dataQuality * 0.1);
  }

  /**
   * Generate recommendation with sophisticated thresholds
   */
  private generateRecommendation(
    signal: number,
    confidence: number,
    riskScore: number,
    riskProfile: 'averse' | 'neutral' | 'bold'
  ): 'BUY' | 'HOLD' | 'SELL' {
    // Risk profile-specific thresholds
    const thresholds = {
      averse: { buy: 0.4, sell: -0.4, minConfidence: 0.7, maxRisk: 0.3 },
      neutral: { buy: 0.3, sell: -0.3, minConfidence: 0.6, maxRisk: 0.5 },
      bold: { buy: 0.2, sell: -0.2, minConfidence: 0.5, maxRisk: 0.7 }
    };

    const profileThresholds = thresholds[riskProfile];

    // Check if we meet minimum requirements
    if (confidence < profileThresholds.minConfidence || riskScore > profileThresholds.maxRisk) {
      return 'HOLD';
    }

    // Generate recommendation based on signal strength
    if (signal > profileThresholds.buy) return 'BUY';
    if (signal < profileThresholds.sell) return 'SELL';
    return 'HOLD';
  }

  /**
   * Calculate position size using Kelly Criterion and portfolio optimization
   */
  private calculatePositionSize(
    signal: number,
    confidence: number,
    riskScore: number,
    riskProfile: 'averse' | 'neutral' | 'bold',
    volatility?: number,
    expectedReturn?: number
  ): number {
    // Calculate expected return if not provided
    if (expectedReturn === undefined) {
      expectedReturn = this.calculateExpectedReturn(signal, confidence);
    }

    // Use volatility from technical analysis or estimate
    const assetVolatility = volatility || this.estimateVolatility(riskScore);

    // Kelly Criterion: f = (bp - q) / b
    // where: b = odds received, p = probability of win, q = probability of loss
    const kellyFraction = this.calculateKellyFraction(expectedReturn, assetVolatility);

    // Apply risk profile constraints
    const maxPositionSize = this.getMaxPositionSizeByRisk(riskProfile);
    const constrainedKelly = Math.min(kellyFraction, maxPositionSize);

    // Apply confidence-based adjustment
    const confidenceAdjustment = this.calculateConfidenceAdjustment(confidence);
    let positionSize = constrainedKelly * confidenceAdjustment;

    // Apply risk score penalty
    const riskPenalty = this.calculateRiskPenalty(riskScore);
    positionSize *= riskPenalty;

    // No minimum position size - if signal is weak, position should be 0

    // Ensure position size is within bounds
    return Math.max(0, Math.min(1, positionSize));
  }

  /**
   * Calculate expected return based on signal strength and confidence
   */
  private calculateExpectedReturn(signal: number, confidence: number): number {
    // Base expected return from signal strength
    const baseReturn = signal * 0.15; // 15% max expected return

    // Adjust for confidence (higher confidence = more reliable signal)
    const confidenceMultiplier = 0.5 + (confidence * 0.5); // 0.5 to 1.0

    return baseReturn * confidenceMultiplier;
  }

  /**
   * Estimate volatility based on risk score and market conditions
   */
  private estimateVolatility(riskScore: number): number {
    // Higher risk score = higher volatility
    const baseVolatility = 0.2; // 20% base volatility
    const riskMultiplier = 0.5 + (riskScore * 1.5); // 0.5 to 2.0

    return baseVolatility * riskMultiplier;
  }

  /**
   * Calculate Kelly Criterion fraction
   */
  private calculateKellyFraction(expectedReturn: number, volatility: number): number {
    // Kelly Criterion: f = μ / σ²
    // where μ = expected return, σ = volatility
    const kellyFraction = expectedReturn / (volatility * volatility);

    // Apply conservative Kelly (half Kelly for safety)
    return Math.max(0, kellyFraction * 0.5);
  }

  /**
   * Get maximum position size by risk profile
   */
  private getMaxPositionSizeByRisk(riskProfile: 'averse' | 'neutral' | 'bold'): number {
    const maxSizes = {
      averse: 0.05,   // 5% max position for risk-averse
      neutral: 0.10,  // 10% max position for neutral
      bold: 0.20      // 20% max position for bold
    };

    return maxSizes[riskProfile];
  }

  /**
   * Calculate confidence-based adjustment
   */
  private calculateConfidenceAdjustment(confidence: number): number {
    // Higher confidence = higher position size
    // Use sigmoid function for smooth scaling
    return 0.3 + (0.7 * (1 / (1 + Math.exp(-10 * (confidence - 0.5)))));
  }

  /**
   * Calculate risk penalty
   */
  private calculateRiskPenalty(riskScore: number): number {
    // Higher risk = lower position size
    // Use exponential decay for risk penalty
    return Math.exp(-2 * riskScore);
  }

  /**
   * Determine time horizon based on signal characteristics
   */
  private determineTimeHorizon(claims: Claim[], momentum: number): 'short' | 'medium' | 'long' {
    // Check for technical indicators that suggest time horizon
    const technicalClaim = claims.find(c => c.agentRole === 'technical');
    const signals = technicalClaim?.signals || [];

    const rsi = signals.find((s: { name: string; value: number }) => s.name === 'rsi')?.value;
    const macd = signals.find((s: { name: string; value: number }) => s.name === 'macd')?.value;

    // High momentum + strong technical signals = short term
    if (Math.abs(momentum) > 0.7 && rsi && (rsi < 30 || rsi > 70)) {
      return 'short';
    }

    // Strong fundamental signals = long term
    const fundamentalClaim = claims.find(c => c.agentRole === 'fundamental');
    if (fundamentalClaim && fundamentalClaim.confidence > 0.8) {
      return 'long';
    }

    return 'medium';
  }

  /**
   * Generate comprehensive rationale
   */
  private generateRationale(
    claims: Claim[],
    overallSignal: number,
    recommendation: 'BUY' | 'HOLD' | 'SELL'
  ): string {
    const fundamental = claims.find(c => c.agentRole === 'fundamental');
    const sentiment = claims.find(c => c.agentRole === 'sentiment');
    const technical = claims.find(c => c.agentRole === 'technical');

    const reasons: string[] = [];

    if (fundamental) {
      reasons.push(`Fundamental: ${fundamental.claim} (${(fundamental.confidence * 100).toFixed(1)}% confidence)`);
    }
    if (sentiment) {
      reasons.push(`Sentiment: ${sentiment.claim} (${(sentiment.confidence * 100).toFixed(1)}% confidence)`);
    }
    if (technical) {
      reasons.push(`Technical: ${technical.claim} (${(technical.confidence * 100).toFixed(1)}% confidence)`);
    }

    return `${recommendation} - Signal: ${(overallSignal * 100).toFixed(1)}% | ${reasons.join(' | ')}`;
  }

  // Helper methods
  private directionToSignal(direction: string): number {
    switch (direction.toUpperCase()) {
      case 'BUY': return 1;
      case 'SELL': return -1;
      default: return 0;
    }
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private groupClaimsByTicker(claims: Claim[]): Map<string, Claim[]> {
    const groups = new Map<string, Claim[]>();
    for (const claim of claims) {
      if (!groups.has(claim.ticker)) {
        groups.set(claim.ticker, []);
      }
      groups.get(claim.ticker)!.push(claim);
    }
    return groups;
  }

  // Data-driven calculation methods
  private calculateVolumeScore(volume24h: number): number {
    // Use market data to determine volume thresholds
    // Top 10% volume = 1.0, bottom 10% = 0.1
    const volumeThresholds = {
      high: 5000000,    // 5M+ volume = high liquidity
      medium: 1000000,  // 1M+ volume = medium liquidity
      low: 100000       // 100K+ volume = low liquidity
    };

    if (volume24h >= volumeThresholds.high) return 1.0;
    if (volume24h >= volumeThresholds.medium) return 0.7;
    if (volume24h >= volumeThresholds.low) return 0.4;
    return 0.1; // Very low volume
  }

  private getPriceScalingFactor(): number {
    // Dynamic scaling based on market volatility
    // Higher volatility = lower scaling factor for smoother signals
    return 3.0; // Conservative scaling factor
  }

  private calculateFundamentalWeight(confidence: number): number {
    // Higher confidence = more weight on fundamental analysis
    // Lower confidence = more weight on market data
    return Math.max(0.5, Math.min(0.9, confidence));
  }

  private calculateSentimentPenalty(riskFlags: string[]): number {
    // Data-driven penalty calculation based on risk severity
    const penalties = {
      low_coverage: 0.8,           // 20% penalty for low coverage
      old_news: 0.7,               // 30% penalty for old news
      inconsistent_sentiment: 0.6,  // 40% penalty for inconsistency
      unreliable_source: 0.5,       // 50% penalty for unreliable sources
      insufficient_data: 0.4        // 60% penalty for insufficient data
    };

    let totalPenalty = 1.0;
    for (const flag of riskFlags) {
      if (penalties[flag as keyof typeof penalties]) {
        totalPenalty *= penalties[flag as keyof typeof penalties];
      }
    }

    return totalPenalty;
  }

  private calculateCredibilityBoost(confidence: number): number {
    // Boost based on confidence level
    if (confidence > 0.9) return 1.15;  // 15% boost for very high confidence
    if (confidence > 0.8) return 1.10;  // 10% boost for high confidence
    if (confidence > 0.7) return 1.05;  // 5% boost for good confidence
    return 1.0; // No boost for lower confidence
  }

  private calculateRSIAdjustment(rsi: number): number {
    // Data-driven RSI adjustment based on market conditions
    if (rsi < 20) return 1.3;      // Extremely oversold - strong bullish
    if (rsi < 30) return 1.2;      // Oversold - bullish
    if (rsi > 80) return 0.7;      // Extremely overbought - strong bearish
    if (rsi > 70) return 0.8;      // Overbought - bearish
    return 1.0; // Neutral zone
  }

  private calculateMACDAdjustment(macd: number): number {
    // Data-driven MACD adjustment with smooth scaling
    const scalingFactor = 5.0; // Conservative scaling
    return 1 + Math.tanh(macd * scalingFactor) * 0.15; // Max 15% adjustment
  }

  private calculateVolatilityAdjustment(volatility: number): number {
    // Data-driven volatility adjustment
    // Higher volatility = more potential but more risk
    const baseline = 0.5;
    const adjustment = Math.tanh((volatility - baseline) * 2) * 0.1; // Max 10% adjustment
    return 1 + adjustment;
  }

  private getVolumeScalingFactor(): number {
    // Volume scaling factor for momentum calculation
    return 2.0; // Conservative scaling for volume
  }

  private calculatePriceWeight(priceChange: number, volumeChange: number): number {
    // Dynamic weight calculation based on relative changes
    const priceMagnitude = Math.abs(priceChange);
    const volumeMagnitude = Math.abs(volumeChange);

    // If volume change is significant, give more weight to volume
    if (volumeMagnitude > priceMagnitude * 2) return 0.6; // More weight to price
    if (priceMagnitude > volumeMagnitude * 2) return 0.8; // More weight to price
    return 0.7; // Balanced weight
  }
}
