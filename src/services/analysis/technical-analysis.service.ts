import type {
  IndicatorData,
  AssetMetadata,
  TechnicalNewsResult,
  SignalStrength,
  ComprehensiveAnalysis,
  TargetLevels
} from '../../types/index.js';
import { INDICATOR_THRESHOLDS, SIGNAL_WEIGHTS } from '../../types/index.js';
import { loadConfig } from '../../core/config.js';

import { Signals } from '../../adapters/signals-adapter.js';

export class TechnicalAnalysisService {
  private signals: Signals;

  constructor(signals?: Signals) {
    this.signals = signals || new Signals();
  }
  /**
   * Check if indicator is overbought
   */
  isOverbought(indicatorValue: number, indicatorName: string): boolean {
    const thresholds: Record<string, number> = {
      'rsi': INDICATOR_THRESHOLDS.RSI.overbought,
      'stochastic': INDICATOR_THRESHOLDS.STOCHASTIC.overbought,
      'williams_r': INDICATOR_THRESHOLDS.WILLIAMS_R.overbought,
      'cci': INDICATOR_THRESHOLDS.CCI.overbought
    };

    const threshold = thresholds[indicatorName.toLowerCase()];
    if (!threshold) return false;

    return indicatorName.toLowerCase() === 'williams_r'
      ? indicatorValue > threshold
      : indicatorValue > threshold;
  }

  /**
   * Check if indicator is oversold
   */
  isOversold(indicatorValue: number, indicatorName: string): boolean {
    const thresholds: Record<string, number> = {
      'rsi': INDICATOR_THRESHOLDS.RSI.oversold,
      'stochastic': INDICATOR_THRESHOLDS.STOCHASTIC.oversold,
      'williams_r': INDICATOR_THRESHOLDS.WILLIAMS_R.oversold,
      'cci': INDICATOR_THRESHOLDS.CCI.oversold
    };

    const threshold = thresholds[indicatorName.toLowerCase()];
    if (!threshold) return false;

    return indicatorName.toLowerCase() === 'williams_r'
      ? indicatorValue < threshold
      : indicatorValue < threshold;
  }

  /**
   * Extract indicator value from IndicatorData
   */
  extractIndicatorValue(data: IndicatorData, indicatorName: string): number {
    const mapping: Record<string, keyof IndicatorData> = {
      'rsi': 'RSI',
      'macd': 'MACD.macd',
      'macd_signal': 'MACD.signal',
      'macd_hist': 'MACD.hist',
      'adx': 'ADX',
      'stochastic': 'Stoch.K',
      'williams_r': 'W.R',
      'cci': 'CCI20',
      'sma_20': 'SMA20',
      'sma_50': 'SMA50',
      'ema_20': 'EMA20',
      'ema_50': 'EMA50',
      'bollinger_bands': 'BBPower',
      'bb_upper': 'BB.upper',
      'bb_lower': 'BB.lower',
      'bb_middle': 'BB.middle',
      'moving_average': 'SMA20', // Default to SMA20
      'atr': 'AO', // Using AO as approximation
      'ichimoku': 'Ichimoku.BLine'
    };

    const key = mapping[indicatorName.toLowerCase()];
    if (key && data[key] !== undefined) {
      const value = data[key] as number;
      // Only validate for invalid values, don't normalize
      return isFinite(value) && !isNaN(value) ? value : 0;
    }

    // Fallback to 0 if indicator not found
    return 0;
  }

  /**
   * Enhanced MACD analysis with signal cross and histogram slope
   */
  analyzeMACD(macd: number, signal: number, histogram: number): 'bullish' | 'bearish' | 'neutral' {
    // Primary signal: MACD line vs Signal line cross
    const macdCross = macd > signal ? 'bullish' : 'bearish';

    // Secondary signal: histogram slope (momentum)
    const histogramSlope = histogram > 0 ? 'bullish' : 'bearish';

    // Zero-line context: stronger signal when MACD is above/below zero
    const zeroLineContext = macd > 0 ? 'bullish' : 'bearish';

    // Combine signals with priority:
    // 1. Signal cross is primary (most reliable)
    // 2. Histogram slope confirms momentum
    // 3. Zero-line context provides additional confirmation

    // If signal cross and histogram agree, strong signal
    if (macdCross === histogramSlope) {
      return macdCross;
    }

    // If signal cross and zero-line context agree, use that
    if (macdCross === zeroLineContext) {
      return macdCross;
    }

    // If histogram and zero-line context agree, use that
    if (histogramSlope === zeroLineContext) {
      return histogramSlope;
    }

    // If all disagree, use signal cross as primary (most reliable)
    return macdCross;
  }

  /**
   * Determine market regime based on ADX value
   */
  determineMarketRegime(adx: number): 'trend' | 'range' {
    if (adx > 25) return 'trend';
    if (adx < 20) return 'range';
    return 'range'; // Default to range for moderate ADX
  }

  /**
   * Get dynamic weights based on market regime
   */
  getDynamicWeights(regime: 'trend' | 'range'): Record<string, number> {
    const config = loadConfig();
    return config.marketRegimeWeights[regime];
  }

  /**
   * Get technical data for multiple timeframes
   */
  async getMultiTimeframeData(symbol: string): Promise<{
    h1: IndicatorData;
    h4: IndicatorData;
    d1: IndicatorData;
  }> {
    try {
      // Get data for different timeframes
      const [h1Data, h4Data, d1Data] = await Promise.all([
        this.signals.getTechnicalIndicators(symbol, '1h'),
        this.signals.getTechnicalIndicators(symbol, '4h'),
        this.signals.getTechnicalIndicators(symbol, '1d')
      ]);

      return {
        h1: h1Data,
        h4: h4Data,
        d1: d1Data
      };
    } catch (error) {
      console.warn(`⚠️ Failed to get multi-timeframe data for ${symbol}:`, error);
      // Fallback to single timeframe
      const h1Data = await this.signals.getTechnicalIndicators(symbol, '1h');
      return {
        h1: h1Data,
        h4: h1Data, // Use H1 as fallback
        d1: h1Data  // Use H1 as fallback
      };
    }
  }

  /**
   * Calculate technical metadata for confidence calibration
   */
  calculateTechnicalMetadata(indicatorData: IndicatorData, signals: Array<{
    indicator: string;
    value: number;
    signal: 'bullish' | 'bearish' | 'neutral';
    weight: number;
  }>): {
    strength_raw: number;
    regime: 'trend' | 'range';
    alignment_count: number;
    quality_score: number;
    volatility_estimate: number;
    signal_consistency: number;
    data_freshness: number;
  } {
    // Raw strength (before any adjustments)
    const strength_raw = this.calculateRawSignalStrength(signals);

    // Market regime
    const adx = indicatorData.ADX || 0;
    const regime = this.determineMarketRegime(adx);

    // Alignment count (how many indicators agree)
    const directions = signals.map(s => s.signal);
    const bullishCount = directions.filter(d => d === 'bullish').length;
    const bearishCount = directions.filter(d => d === 'bearish').length;
    const alignment_count = Math.max(bullishCount, bearishCount);

    // Quality score based on data completeness
    const totalIndicators = 6; // RSI, MACD, Stochastic, Williams %R, ADX, BB
    const availableIndicators = signals.length;
    const quality_score = availableIndicators / totalIndicators;

    // Volatility estimate
    const volatility_estimate = this.calculateVolatilityEstimate(indicatorData);

    // Signal consistency (how consistent the signals are)
    const signal_consistency = alignment_count / signals.length;

    // Data freshness (assume fresh for now, could be enhanced with timestamps)
    const data_freshness = 1.0;

    return {
      strength_raw,
      regime,
      alignment_count,
      quality_score,
      volatility_estimate,
      signal_consistency,
      data_freshness
    };
  }

  /**
   * Calculate raw signal strength without any adjustments
   */
  calculateRawSignalStrength(signals: Array<{
    indicator: string;
    value: number;
    signal: 'bullish' | 'bearish' | 'neutral';
    weight: number;
  }>): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const signal of signals) {
      const signalValue = signal.signal === 'bullish' ? 1 : signal.signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * signal.weight;
      totalWeight += signal.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate calibrated confidence based on metadata
   */
  calculateCalibratedConfidence(metadata: {
    strength_raw: number;
    regime: 'trend' | 'range';
    alignment_count: number;
    quality_score: number;
    volatility_estimate: number;
    signal_consistency: number;
    data_freshness: number;
  }): number {
    let confidence = 0.5; // Base confidence

    // Signal strength bonus
    const strengthBonus = Math.abs(metadata.strength_raw) * 0.3;
    confidence += strengthBonus;

    // Alignment bonus (more agreeing indicators = higher confidence)
    const alignmentBonus = (metadata.alignment_count / 6) * 0.2;
    confidence += alignmentBonus;

    // Quality bonus (better data = higher confidence)
    const qualityBonus = metadata.quality_score * 0.15;
    confidence += qualityBonus;

    // Consistency bonus (more consistent signals = higher confidence)
    const consistencyBonus = metadata.signal_consistency * 0.1;
    confidence += consistencyBonus;

    // Freshness bonus (fresher data = higher confidence)
    const freshnessBonus = metadata.data_freshness * 0.05;
    confidence += freshnessBonus;

    // Regime adjustment (trending markets can be more confident)
    if (metadata.regime === 'trend') {
      confidence *= 1.1;
    }

    // Volatility penalty (higher volatility = lower confidence)
    const volatilityPenalty = metadata.volatility_estimate * 0.1;
    confidence -= volatilityPenalty;

    // Ensure confidence is within bounds
    return Math.min(0.95, Math.max(0.3, confidence));
  }

  /**
   * Calculate multi-timeframe signal strength
   */
  calculateMultiTimeframeStrength(timeframeData: {
    h1: IndicatorData;
    h4: IndicatorData;
    d1: IndicatorData;
  }): {
    strength: number;
    alignment: number; // 0-1, how many timeframes agree
    timeframes: {
      h1: { strength: number; regime: string };
      h4: { strength: number; regime: string };
      d1: { strength: number; regime: string };
    };
  } {
    // Calculate strength for each timeframe
    const h1Result = this.calculateSignalStrength(timeframeData.h1);
    const h4Result = this.calculateSignalStrength(timeframeData.h4);
    const d1Result = this.calculateSignalStrength(timeframeData.d1);

    // Get regimes for each timeframe
    const h1Regime = this.determineMarketRegime(timeframeData.h1.ADX || 0);
    const h4Regime = this.determineMarketRegime(timeframeData.h4.ADX || 0);
    const d1Regime = this.determineMarketRegime(timeframeData.d1.ADX || 0);

    // Multi-timeframe weights (H1: 0.2, H4: 0.5, D1: 0.3)
    const weights = { h1: 0.2, h4: 0.5, d1: 0.3 };

    // Calculate weighted strength
    const weightedStrength =
      h1Result.strength * weights.h1 +
      h4Result.strength * weights.h4 +
      d1Result.strength * weights.d1;

    // Calculate alignment (how many timeframes agree on direction)
    const directions = [
      Math.sign(h1Result.strength),
      Math.sign(h4Result.strength),
      Math.sign(d1Result.strength)
    ];

    const positiveCount = directions.filter(d => d > 0).length;
    const negativeCount = directions.filter(d => d < 0).length;
    const alignment = Math.max(positiveCount, negativeCount) / 3;

    return {
      strength: weightedStrength,
      alignment,
      timeframes: {
        h1: { strength: h1Result.strength, regime: h1Regime },
        h4: { strength: h4Result.strength, regime: h4Regime },
        d1: { strength: d1Result.strength, regime: d1Regime }
      }
    };
  }

  /**
   * Enhanced Bollinger Bands analysis with strict %B calculation
   */
  analyzeBollingerBands(bbPower: number, bbUpper?: number, bbLower?: number, bbMiddle?: number, close?: number): 'bullish' | 'bearish' | 'neutral' {
    // If we have all BB components, calculate strict %B
    if (bbUpper !== undefined && bbLower !== undefined && close !== undefined) {
      const bandWidth = bbUpper - bbLower;
      if (bandWidth > 0) {
        // Strict %B calculation: (price - lower) / (upper - lower)
        const percentB = (close - bbLower) / bandWidth;

        // %B interpretation:
        // %B > 1: Price above upper band (overbought)
        // %B < 0: Price below lower band (oversold)
        // 0 <= %B <= 1: Price within bands (normal)
        if (percentB > 1) return 'bearish';
        if (percentB < 0) return 'bullish';

        // Within bands: check position relative to middle
        if (bbMiddle !== undefined) {
          const middlePercentB = (bbMiddle - bbLower) / bandWidth;
          if (percentB > middlePercentB + 0.2) return 'bearish'; // Near upper
          if (percentB < middlePercentB - 0.2) return 'bullish'; // Near lower
        }

        return 'neutral';
      }
    }

    // Fallback to BBPower if strict calculation not possible
    // BBPower > 1: Price above upper band (overbought)
    // BBPower < 0: Price below lower band (oversold)
    if (bbPower > 1) return 'bearish';
    if (bbPower < 0) return 'bullish';

    return 'neutral';
  }

  /**
   * Calculate signal strength based on multiple indicators with dynamic weights
   */
  calculateSignalStrength(indicatorData: IndicatorData): SignalStrength {
    const signals: Array<{
      indicator: string;
      value: number;
      signal: 'bullish' | 'bearish' | 'neutral';
      weight: number;
    }> = [];

    let totalWeight = 0;
    let weightedSum = 0;

    // Determine market regime based on ADX
    const adx = indicatorData.ADX || 0;
    const regime = this.determineMarketRegime(adx);
    const dynamicWeights = this.getDynamicWeights(regime);

    // Log regime for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Market Regime: ${regime} (ADX: ${adx.toFixed(2)})`);
      console.log(`⚖️ Dynamic Weights:`, dynamicWeights);
    }

    // RSI Analysis
    if (indicatorData.RSI !== undefined) {
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (this.isOverbought(indicatorData.RSI, 'rsi')) signal = 'bearish';
      else if (this.isOversold(indicatorData.RSI, 'rsi')) signal = 'bullish';

      const rsiWeight = dynamicWeights.rsi || SIGNAL_WEIGHTS.RSI;
      signals.push({
        indicator: 'rsi',
        value: indicatorData.RSI,
        signal,
        weight: rsiWeight
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * rsiWeight;
      totalWeight += rsiWeight;
    }

    // MACD Analysis
    if (indicatorData['MACD.macd'] !== undefined) {
      const macdValue = indicatorData['MACD.macd'];
      const macdSignal = indicatorData['MACD.signal'] || 0;
      const macdHist = indicatorData['MACD.hist'] || (macdValue - macdSignal);

      // Enhanced MACD analysis with signal cross and histogram slope
      const signal = this.analyzeMACD(macdValue, macdSignal, macdHist);

      const macdWeight = dynamicWeights.macd || SIGNAL_WEIGHTS.MACD;
      signals.push({
        indicator: 'macd',
        value: macdValue,
        signal,
        weight: macdWeight
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * macdWeight;
      totalWeight += macdWeight;
    }

    // Stochastic Analysis
    if (indicatorData['Stoch.K'] !== undefined) {
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (this.isOverbought(indicatorData['Stoch.K'], 'stochastic')) signal = 'bearish';
      else if (this.isOversold(indicatorData['Stoch.K'], 'stochastic')) signal = 'bullish';

      const stochasticWeight = dynamicWeights.stochastic || SIGNAL_WEIGHTS.STOCHASTIC;
      signals.push({
        indicator: 'stochastic',
        value: indicatorData['Stoch.K'],
        signal,
        weight: stochasticWeight
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * stochasticWeight;
      totalWeight += stochasticWeight;
    }

    // Williams %R Analysis
    if (indicatorData['W.R'] !== undefined) {
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (this.isOverbought(indicatorData['W.R'], 'williams_r')) signal = 'bearish';
      else if (this.isOversold(indicatorData['W.R'], 'williams_r')) signal = 'bullish';

      const williamsRWeight = dynamicWeights.williamsR || SIGNAL_WEIGHTS.WILLIAMS_R;
      signals.push({
        indicator: 'williams_r',
        value: indicatorData['W.R'],
        signal,
        weight: williamsRWeight
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * williamsRWeight;
      totalWeight += williamsRWeight;
    }

    // ADX Analysis (Trend Strength)
    if (indicatorData.ADX !== undefined) {
      const adxValue = indicatorData.ADX;
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';

      // ADX > 25 indicates strong trend
      if (adxValue > 25) {
        // Check DI+ vs DI- for trend direction
        const diPlus = indicatorData['ADX+DI'] || 0;
        const diMinus = indicatorData['ADX-DI'] || 0;
        signal = diPlus > diMinus ? 'bullish' : 'bearish';
      }

      const adxWeight = dynamicWeights.adx || 0.15;
      signals.push({
        indicator: 'adx',
        value: adxValue,
        signal,
        weight: adxWeight
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * adxWeight;
      totalWeight += adxWeight;
    }

    // Bollinger Bands Analysis
    if (indicatorData.BBPower !== undefined) {
      const bbValue = indicatorData.BBPower;
      const bbUpper = indicatorData['BB.upper'];
      const bbLower = indicatorData['BB.lower'];
      const bbMiddle = indicatorData['BB.middle'];
      const close = indicatorData.close || 0;

      // Enhanced Bollinger Bands analysis with strict %B calculation
      const signal = this.analyzeBollingerBands(bbValue, bbUpper, bbLower, bbMiddle, close);

      const bbWeight = dynamicWeights.bollingerBands || 0.15;
      signals.push({
        indicator: 'bollinger_bands',
        value: bbValue,
        signal,
        weight: bbWeight
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * bbWeight;
      totalWeight += bbWeight;
    }

    const strength = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Calculate technical metadata for confidence calibration
    const metadata = this.calculateTechnicalMetadata(indicatorData, signals);

    return {
      strength,
      signals,
      metadata
    };
  }

  /**
   * Calculate trend strength based on moving averages
   */
  calculateTrendStrength(indicatorData: IndicatorData): number {
    const sma20 = indicatorData.SMA20 || 0;
    const sma50 = indicatorData.SMA50 || 0;
    const ema20 = indicatorData.EMA20 || 0;
    const ema50 = indicatorData.EMA50 || 0;
    const close = indicatorData.close || 0;

    if (close === 0) return 0;

    // Calculate trend strength based on price vs moving averages
    const priceVsSMA20 = (close - sma20) / sma20;
    const priceVsSMA50 = (close - sma50) / sma50;
    const priceVsEMA20 = (close - ema20) / ema20;
    const priceVsEMA50 = (close - ema50) / ema50;

    // Average trend strength (-1 to 1)
    const trendStrength = (priceVsSMA20 + priceVsSMA50 + priceVsEMA20 + priceVsEMA50) / 4;

    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, trendStrength));
  }

  /**
   * Calculate volatility estimate from technical indicators
   */
  calculateVolatilityEstimate(indicatorData: IndicatorData): number {
    // Use ADX as a proxy for volatility (higher ADX = higher volatility)
    const adx = indicatorData.ADX || 0;

    // Normalize ADX to 0-1 range (0-100 scale)
    const volatility = Math.min(adx / 100, 1.0);

    return volatility;
  }

  /**
   * Generate trading recommendation based on signal strength and sentiment
   */
  generateRecommendation(signalStrength: number, sentiment: number): 'buy' | 'hold' | 'sell' {
    const sentimentScore = sentiment / 100; // Normalize to 0-1
    const combinedScore = (signalStrength + sentimentScore) / 2;

    if (combinedScore > 0.3) {
      return 'buy';
    } else if (combinedScore < -0.3) {
      return 'sell';
    }

    return 'hold';
  }

  /**
   * Create comprehensive analysis from raw data
   */
  createComprehensiveAnalysis(
    technical: IndicatorData,
    metadata: AssetMetadata,
    news: TechnicalNewsResult
  ): ComprehensiveAnalysis {
    const signalStrength = this.calculateSignalStrength(technical);
    const recommendation = this.generateRecommendation(signalStrength.strength, metadata.sentiment);

    return {
      technical,
      metadata,
      news,
      signalStrength: signalStrength.strength,
      recommendation
    };
  }

  /**
   * Get technical indicators data for an asset
   */
  async getTechnicalDataForAsset(ticker: string, timeframe: string = '4h'): Promise<{
    technical: IndicatorData;
    metadata: AssetMetadata;
    price: number;
    news: TechnicalNewsResult;
  }> {
    try {
      // Get technical indicators from stats endpoint
      const technical = await this.signals.getTechnicalIndicators(ticker, timeframe);

      // Get raw indicators data for metadata
      const rawData = await this.signals.getRawIndicatorsData(ticker, timeframe);

      // Create metadata from raw data
      const metadata: AssetMetadata = {
        price: rawData.lp || 0,
        volume: rawData.volume || rawData["24h_vol_cmc"] || 0,
        change: rawData.ch || 0,
        changePercent: rawData.chp || 0,
        marketCap: rawData.market_cap_calc || rawData.market_cap || 0,
        sentiment: rawData.sentiment || 50
      };

      // Get news
      const news = await this.signals.getNews(ticker);

      return {
        technical,
        metadata,
        price: metadata.price,
        news
      };
    } catch (error) {
      console.error(`Error getting technical data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get technical analysis summary for LLM
   */
  getTechnicalSummary(indicatorData: IndicatorData): {
    rsiStatus: string;
    macdStatus: string;
    trendStatus: string;
    volatilityStatus: string;
    overallSignal: string;
  } {
    const rsi = indicatorData.RSI || 0;
    const macd = indicatorData['MACD.macd'] || 0;
    const adx = indicatorData.ADX || 0;
    const close = indicatorData.close || 0;
    const sma20 = indicatorData.SMA20 || 0;

    // RSI Status
    let rsiStatus = 'neutral';
    if (rsi > 70) rsiStatus = 'overbought';
    else if (rsi < 30) rsiStatus = 'oversold';

    // MACD Status
    let macdStatus = 'neutral';
    if (macd > 0) macdStatus = 'bullish';
    else if (macd < 0) macdStatus = 'bearish';

    // Trend Status
    let trendStatus = 'neutral';
    if (close > sma20 && adx > 25) trendStatus = 'bullish';
    else if (close < sma20 && adx > 25) trendStatus = 'bearish';

    // Volatility Status
    let volatilityStatus = 'low';
    if (adx > 50) volatilityStatus = 'high';
    else if (adx > 25) volatilityStatus = 'moderate';

    // Overall Signal
    const signalStrength = this.calculateSignalStrength(indicatorData);
    let overallSignal = 'neutral';
    if (signalStrength.strength > 0.3) overallSignal = 'bullish';
    else if (signalStrength.strength < -0.3) overallSignal = 'bearish';

    return {
      rsiStatus,
      macdStatus,
      trendStatus,
      volatilityStatus,
      overallSignal
    };
  }

  /**
   * Calculate target levels based on technical analysis and signal
   */
  calculateTargetLevels(
    currentPrice: number,
    signalDirection: 'buy' | 'sell' | 'hold',
    signalStrength: number,
    technicalData: IndicatorData,
    volatility: number = 0.02
  ): TargetLevels {
    // Validate inputs
    if (!currentPrice || currentPrice <= 0) {
      throw new Error('Invalid current price: must be positive number');
    }

    if (signalStrength < 0 || signalStrength > 1) {
      throw new Error('Invalid signal strength: must be between 0 and 1');
    }

    if (volatility < 0 || volatility > 1) {
      throw new Error('Invalid volatility: must be between 0 and 1');
    }
    // Base volatility calculation
    const atr = this.extractIndicatorValue(technicalData, 'atr') || (volatility * currentPrice);
    const rsi = this.extractIndicatorValue(technicalData, 'rsi') || 50;
    const macd = this.extractIndicatorValue(technicalData, 'macd') || 0;

    // Support and resistance levels
    const sma20 = this.extractIndicatorValue(technicalData, 'sma_20') || currentPrice;
    const sma50 = this.extractIndicatorValue(technicalData, 'sma_50') || currentPrice;

    // Bollinger Bands - use BBPower to estimate upper/lower bands
    const bbPower = technicalData.BBPower || 0;
    const bbUpper = currentPrice * (1 + Math.abs(bbPower) * 0.05); // Estimate upper band
    const bbLower = currentPrice * (1 - Math.abs(bbPower) * 0.05); // Estimate lower band

    let target_price: number;
    let stop_loss: number;
    let take_profit: number;
    let time_horizon: 'short' | 'medium' | 'long';
    let confidence: number;
    let reasoning: string = '';

    // Determine time horizon based on signal strength
    if (signalStrength > 0.7) {
      time_horizon = 'short';
    } else if (signalStrength > 0.4) {
      time_horizon = 'medium';
    } else {
      time_horizon = 'long';
    }

    // Calculate calibrated confidence using metadata
    const signalStrengthResult = this.calculateSignalStrength(technicalData);
    const metadata = signalStrengthResult.metadata;

    if (metadata) {
      confidence = this.calculateCalibratedConfidence(metadata);
    } else {
      // Fallback to old method
      confidence = Math.min(0.95, Math.max(0.3, signalStrength * 1.2));
    }

    if (signalDirection === 'buy') {
      // BUY signal logic
      const bullishFactors = [];

      // RSI oversold condition
      if (rsi < 30) {
        bullishFactors.push('RSI oversold');
        target_price = currentPrice * 1.05; // 5% target
        stop_loss = Math.min(currentPrice * 0.97, bbLower); // 3% stop or BB lower
      } else if (rsi < 50) {
        bullishFactors.push('RSI neutral-bullish');
        target_price = currentPrice * 1.03; // 3% target
        stop_loss = currentPrice * 0.98; // 2% stop
      } else {
        bullishFactors.push('RSI neutral');
        target_price = currentPrice * 1.02; // 2% target
        stop_loss = currentPrice * 0.99; // 1% stop
      }

      // MACD confirmation
      if (macd > 0) {
        bullishFactors.push('MACD bullish');
        target_price *= 1.02; // Increase target by 2%
        confidence *= 1.1; // Increase confidence
      }

      // Moving average support
      if (currentPrice > sma20 && sma20 > sma50) {
        bullishFactors.push('Uptrend confirmed');
        target_price *= 1.01; // Increase target by 1%
        stop_loss = Math.max(stop_loss, sma20 * 0.98); // Use SMA20 as support
      }

      // ATR-based adjustments (only if ATR is available) а касти
      if (atr > 0) {
        const atrMultiplier = Math.min(3, Math.max(1, signalStrength * 4)); // 1-3x ATR
        target_price = currentPrice + (atr * atrMultiplier);
        stop_loss = currentPrice - (atr * 1.5);
        take_profit = currentPrice + (atr * 4); // 4x ATR for take profit
      } else {
        // Volatility adjustment (fallback when ATR is not available)
        const volatilityMultiplier = 1 + (volatility * 5); // Reduced scaling
        target_price *= volatilityMultiplier;
        stop_loss = currentPrice - (currentPrice * volatility * 2); // Volatility-based stop
        take_profit = target_price * 1.5; // 50% above target
      }

      reasoning = `BUY signal based on: ${bullishFactors.join(', ')}. Target: ${((target_price / currentPrice - 1) * 100).toFixed(1)}% gain.`;

    } else if (signalDirection === 'sell') {
      // SELL signal logic
      const bearishFactors = [];

      // RSI overbought condition
      if (rsi > 70) {
        bearishFactors.push('RSI overbought');
        target_price = currentPrice * 0.95; // 5% target
        stop_loss = Math.max(currentPrice * 1.03, bbUpper); // 3% stop or BB upper
      } else if (rsi > 50) {
        bearishFactors.push('RSI neutral-bearish');
        target_price = currentPrice * 0.97; // 3% target
        stop_loss = currentPrice * 1.02; // 2% stop
      } else {
        bearishFactors.push('RSI neutral');
        target_price = currentPrice * 0.98; // 2% target
        stop_loss = currentPrice * 1.01; // 1% stop
      }

      // MACD confirmation
      if (macd < 0) {
        bearishFactors.push('MACD bearish');
        target_price *= 0.98; // Decrease target by 2%
        confidence *= 1.1; // Increase confidence
      }

      // Moving average resistance
      if (currentPrice < sma20 && sma20 < sma50) {
        bearishFactors.push('Downtrend confirmed');
        target_price *= 0.99; // Decrease target by 1%
        stop_loss = Math.min(stop_loss, sma20 * 1.02); // Use SMA20 as resistance
      }

      // ATR-based adjustments (only if ATR is available)
      if (atr > 0) {
        const atrMultiplier = Math.min(3, Math.max(1, signalStrength * 4));
        target_price = currentPrice - (atr * atrMultiplier);
        stop_loss = currentPrice + (atr * 1.5);
        take_profit = currentPrice - (atr * 4); // 4x ATR for take profit
      } else {
        // Volatility adjustment (fallback when ATR is not available)
        const volatilityMultiplier = 1 + (volatility * 5);
        target_price *= (2 - volatilityMultiplier); // Decrease target for high volatility
        stop_loss = currentPrice + (currentPrice * volatility * 2); // Volatility-based stop
        take_profit = target_price * 0.5; // 50% below target
      }

      reasoning = `SELL signal based on: ${bearishFactors.join(', ')}. Target: ${((1 - target_price / currentPrice) * 100).toFixed(1)}% decline.`;

    } else {
      // HOLD signal logic
      target_price = currentPrice;
      stop_loss = currentPrice * 0.95; // 5% stop loss
      take_profit = currentPrice * 1.05; // 5% take profit
      confidence = 0.5; // Lower confidence for HOLD
      reasoning = 'HOLD signal - insufficient directional conviction. Monitor for breakout opportunities.';
    }

    // Risk management adjustments
    if (signalStrength < 0.3) {
      // Weak signal - more conservative levels
      target_price = signalDirection === 'buy'
        ? currentPrice + (currentPrice * 0.01) // 1% target
        : currentPrice - (currentPrice * 0.01); // 1% target
      stop_loss = signalDirection === 'buy'
        ? currentPrice * 0.99 // 1% stop
        : currentPrice * 1.01; // 1% stop
      confidence *= 0.8; // Reduce confidence
      reasoning += ' Conservative levels due to weak signal.';
    }

    // Ensure reasonable levels with better validation
    const minPrice = currentPrice * 0.1; // Min 10% of current price
    const maxPrice = currentPrice * 5.0; // Max 500% of current price

    target_price = Math.max(minPrice, Math.min(maxPrice, target_price));
    stop_loss = Math.max(minPrice, Math.min(maxPrice, stop_loss));
    take_profit = Math.max(minPrice, Math.min(maxPrice, take_profit));

    // Ensure stop loss is on the correct side of current price
    if (signalDirection === 'buy') {
      stop_loss = Math.min(stop_loss, currentPrice * 0.99); // Stop loss below current price
      take_profit = Math.max(take_profit, target_price); // Take profit above target
    } else if (signalDirection === 'sell') {
      stop_loss = Math.max(stop_loss, currentPrice * 1.01); // Stop loss above current price
      take_profit = Math.min(take_profit, target_price); // Take profit below target
    }

    return {
      target_price: Math.round(target_price * 1000000) / 1000000, // Round to 6 decimal places
      stop_loss: Math.round(stop_loss * 1000000) / 1000000,
      take_profit: Math.round(take_profit * 1000000) / 1000000,
      time_horizon,
      confidence: Math.min(0.95, Math.max(0.3, confidence)),
      reasoning
    };
  }

  /**
   * Calculate target levels with conflict resolution
   */
  calculateTargetLevelsWithConflicts(
    consensus: any,
    technicalData: IndicatorData,
    marketData: any
  ): TargetLevels & { conflicts: string[] } {
    const conflicts: string[] = [];

    // Get technical signal direction
    const technicalSignal = this.calculateSignalStrength(technicalData);
    const technicalDirection = technicalSignal.strength > 0.1 ? 'buy' :
      technicalSignal.strength < -0.1 ? 'sell' : 'hold';

    // Check for conflicts
    if (technicalDirection !== consensus.signal_direction) {
      conflicts.push(`Technical analysis (${technicalDirection}) contradicts consensus (${consensus.signal_direction})`);
    }

    // Calculate base levels
    const baseLevels = this.calculateTargetLevels(
      marketData.price || 0,
      consensus.signal_direction,
      consensus.signal_strength,
      technicalData,
      marketData.volatility || 0.02
    );

    // Adjust levels based on conflicts
    if (conflicts.length > 0) {
      // Reduce confidence
      baseLevels.confidence *= 0.7;

      // Widen stop loss
      if (consensus.signal_direction === 'buy') {
        baseLevels.stop_loss *= 0.95; // 5% wider stop
      } else if (consensus.signal_direction === 'sell') {
        baseLevels.stop_loss *= 1.05; // 5% wider stop
      }

      // Add conflict warning to reasoning
      baseLevels.reasoning += ` Warning: ${conflicts.join(', ')}.`;
    }

    return {
      ...baseLevels,
      conflicts
    };
  }
}
