import type {
  IndicatorData,
  AssetMetadata,
  TechnicalNewsResult,
  SignalStrength,
  ComprehensiveAnalysis
} from '../types/index.js';
import { INDICATOR_THRESHOLDS, SIGNAL_WEIGHTS } from '../types/index.js';

export class TechnicalAnalysisService {
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

    const strength = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return { strength, signals };
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
}
