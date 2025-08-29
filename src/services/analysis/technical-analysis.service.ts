import type {
  IndicatorData,
  AssetMetadata,
  TechnicalNewsResult,
  SignalStrength,
  ComprehensiveAnalysis,
  TargetLevels
} from '../../types/index.js';
import { INDICATOR_THRESHOLDS, SIGNAL_WEIGHTS } from '../../types/index.js';

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
      const value = data[key] as number;
      // Only validate for invalid values, don't normalize
      return isFinite(value) && !isNaN(value) ? value : 0;
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

  /**
   * Calculate target levels based on technical analysis and signal
   */
  calculateTargetLevels(
    currentPrice: number,
    signalDirection: 'BUY' | 'SELL' | 'HOLD',
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

    // Base confidence on signal strength and technical confirmation
    confidence = Math.min(0.95, Math.max(0.3, signalStrength * 1.2));

    if (signalDirection === 'BUY') {
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

    } else if (signalDirection === 'SELL') {
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
      target_price = signalDirection === 'BUY'
        ? currentPrice + (currentPrice * 0.01) // 1% target
        : currentPrice - (currentPrice * 0.01); // 1% target
      stop_loss = signalDirection === 'BUY'
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
    if (signalDirection === 'BUY') {
      stop_loss = Math.min(stop_loss, currentPrice * 0.99); // Stop loss below current price
      take_profit = Math.max(take_profit, target_price); // Take profit above target
    } else if (signalDirection === 'SELL') {
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
    const technicalDirection = technicalSignal.strength > 0.1 ? 'BUY' :
      technicalSignal.strength < -0.1 ? 'SELL' : 'HOLD';

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
      if (consensus.signal_direction === 'BUY') {
        baseLevels.stop_loss *= 0.95; // 5% wider stop
      } else if (consensus.signal_direction === 'SELL') {
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
