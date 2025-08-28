import type {
  IndicatorData,
  AssetMetadata,
  TechnicalNewsResult,
  SignalStrength,
  ComprehensiveAnalysis
} from '../types/index.js';
import { INDICATOR_THRESHOLDS, SIGNAL_WEIGHTS } from '../types/index.js';

import { Signals } from '../adapters/signals-adapter.js';

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
      'adx': 'ADX',
      'stochastic': 'Stoch.K',
      'williams_r': 'W.R',
      'cci': 'CCI20',
      'sma_20': 'SMA20',
      'sma_50': 'SMA50',
      'ema_20': 'EMA20',
      'ema_50': 'EMA50',
      'bollinger_bands': 'BBPower',
      'moving_average': 'SMA20', // Default to SMA20
      'atr': 'AO', // Using AO as approximation
      'ichimoku': 'Ichimoku.BLine'
    };

    const key = mapping[indicatorName.toLowerCase()];
    if (key && data[key] !== undefined) {
      return data[key] as number;
    }

    // Fallback to 0 if indicator not found
    return 0;
  }

  /**
   * Calculate signal strength based on multiple indicators
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

    // RSI Analysis
    if (indicatorData.RSI !== undefined) {
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (this.isOverbought(indicatorData.RSI, 'rsi')) signal = 'bearish';
      else if (this.isOversold(indicatorData.RSI, 'rsi')) signal = 'bullish';

      signals.push({
        indicator: 'rsi',
        value: indicatorData.RSI,
        signal,
        weight: SIGNAL_WEIGHTS.RSI
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * SIGNAL_WEIGHTS.RSI;
      totalWeight += SIGNAL_WEIGHTS.RSI;
    }

    // MACD Analysis
    if (indicatorData['MACD.macd'] !== undefined) {
      const macdValue = indicatorData['MACD.macd'];
      const signal: 'bullish' | 'bearish' | 'neutral' = macdValue > 0 ? 'bullish' : 'bearish';

      signals.push({
        indicator: 'macd',
        value: macdValue,
        signal,
        weight: SIGNAL_WEIGHTS.MACD
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * SIGNAL_WEIGHTS.MACD;
      totalWeight += SIGNAL_WEIGHTS.MACD;
    }

    // Stochastic Analysis
    if (indicatorData['Stoch.K'] !== undefined) {
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (this.isOverbought(indicatorData['Stoch.K'], 'stochastic')) signal = 'bearish';
      else if (this.isOversold(indicatorData['Stoch.K'], 'stochastic')) signal = 'bullish';

      signals.push({
        indicator: 'stochastic',
        value: indicatorData['Stoch.K'],
        signal,
        weight: SIGNAL_WEIGHTS.STOCHASTIC
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * SIGNAL_WEIGHTS.STOCHASTIC;
      totalWeight += SIGNAL_WEIGHTS.STOCHASTIC;
    }

    // Williams %R Analysis
    if (indicatorData['W.R'] !== undefined) {
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (this.isOverbought(indicatorData['W.R'], 'williams_r')) signal = 'bearish';
      else if (this.isOversold(indicatorData['W.R'], 'williams_r')) signal = 'bullish';

      signals.push({
        indicator: 'williams_r',
        value: indicatorData['W.R'],
        signal,
        weight: SIGNAL_WEIGHTS.WILLIAMS_R
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * SIGNAL_WEIGHTS.WILLIAMS_R;
      totalWeight += SIGNAL_WEIGHTS.WILLIAMS_R;
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

      signals.push({
        indicator: 'adx',
        value: adxValue,
        signal,
        weight: 0.15 // Lower weight for trend strength
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * 0.15;
      totalWeight += 0.15;
    }

    // Bollinger Bands Analysis
    if (indicatorData.BBPower !== undefined) {
      const bbValue = indicatorData.BBPower;
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';

      // BBPower > 1 indicates price above upper band (overbought)
      // BBPower < 0 indicates price below lower band (oversold)
      if (bbValue > 1) signal = 'bearish';
      else if (bbValue < 0) signal = 'bullish';

      signals.push({
        indicator: 'bollinger_bands',
        value: bbValue,
        signal,
        weight: 0.15
      });

      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      weightedSum += signalValue * 0.15;
      totalWeight += 0.15;
    }

    const strength = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return { strength, signals };
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
  generateRecommendation(signalStrength: number, sentiment: number): 'BUY' | 'HOLD' | 'SELL' {
    const sentimentScore = sentiment / 100; // Normalize to 0-1
    const combinedScore = (signalStrength + sentimentScore) / 2;

    if (combinedScore > 0.3) {
      return 'BUY';
    } else if (combinedScore < -0.3) {
      return 'SELL';
    }

    return 'HOLD';
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
}
