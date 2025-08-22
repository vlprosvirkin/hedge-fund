import type {
  Candle,
  TechnicalIndicator,
  IndicatorRequest,
  IndicatorResponse,
  StatsResponse,
  IndicatorData,
  TechnicalNewsItem,
  TechnicalNewsResult,
  IndicatorsResponse,
  SupportedTokensResponse,
  SignalStrength,
  AssetMetadata,
  ComprehensiveAnalysis,
  IndicatorInfo,
  AvailableIndicatorsResponse
} from '../types/index.js';
import { INDICATOR_THRESHOLDS, SIGNAL_WEIGHTS } from '../types/index.js';
import { API_CONFIG } from '../config.js';
import { addUSDSuffix } from '../utils.js';
import axios from 'axios';

export class TechnicalIndicatorsAdapter {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private isConnectedFlag = false;

  // Supported timeframes
  private readonly supportedTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_CONFIG.technicalIndicators.baseUrl;
    this.timeout = API_CONFIG.technicalIndicators.timeout;
    this.retryAttempts = API_CONFIG.technicalIndicators.retryAttempts;
  }

  async connect(): Promise<void> {
    // Simply mark as connected without testing endpoints
    // The actual API calls will handle connection errors
    this.isConnectedFlag = true;
    console.log('Connected to Technical Indicators API');
  }

  async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  /**
   * Validate timeframe format
   */
  private validateTimeframe(timeframe: string): void {
    // Normalize timeframe to lowercase for comparison
    const normalizedTimeframe = timeframe.toLowerCase();
    if (!this.supportedTimeframes.includes(normalizedTimeframe)) {
      throw new Error(
        `Unsupported timeframe: ${timeframe}. Supported timeframes: ${this.supportedTimeframes.join(', ')}`
      );
    }
  }

  /**
   * Get technical indicators from stats endpoint (real API)
   */
  async getTechnicalIndicators(asset: string, timeframe: string): Promise<IndicatorData> {
    try {
      // Validate timeframe
      this.validateTimeframe(timeframe);

      // Add USD suffix for technical analysis API
      const symbol = addUSDSuffix(asset);

      const response = await axios.post<StatsResponse>(`${this.baseUrl}/stats`, {
        symbol: symbol,
        timeframe: timeframe.toLowerCase(),
      });

      if (response.data?.data) {
        return response.data.data;
      }

      throw new Error(`Invalid response structure for ${asset} technical indicators`);
    } catch (error: any) {
      // If the API returns a 500 error, it might be because the asset is not supported
      if (error.response?.status === 500) {
        throw new Error(`Asset ${asset} is not supported for technical analysis`);
      }

      // For other errors, rethrow with more context
      throw new Error(`Failed to fetch technical indicators for ${asset}: ${error.message}`);
    }
  }

  /**
   * Get indicators from indicators endpoint (real API) - returns asset metadata
   */
  async getIndicators(asset: string, timeframe: string): Promise<any> {
    try {
      // Validate timeframe
      this.validateTimeframe(timeframe);

      // Add USD suffix for technical analysis API
      const symbol = addUSDSuffix(asset);

      const response = await axios.post(`${this.baseUrl}/indicators`, {
        symbol: symbol,
        timeframe: timeframe.toLowerCase(),
      });

      return response.data;
    } catch (error: any) {
      // If the API returns a 500 error, it might be because the asset is not supported
      if (error.response?.status === 500) {
        throw new Error(`Asset ${asset} is not supported for indicators`);
      }

      // For other errors, rethrow with more context
      throw new Error(`Failed to fetch indicators for ${asset}: ${error.message}`);
    }
  }

  /**
   * Get asset metadata (price, volume, market data)
   */
  async getAssetMetadata(asset: string, timeframe: string): Promise<AssetMetadata> {
    try {
      const data = await this.getIndicators(asset, timeframe);

      return {
        price: data.lp || 0,
        volume: data.volume || 0,
        change: data.ch || 0,
        changePercent: data.chp || 0,
        marketCap: data.market_cap_calc || 0,
        sentiment: data.sentiment || 50
      };
    } catch (error) {
      throw new Error(`Failed to get asset metadata for ${asset}: ${error}`);
    }
  }

  /**
   * Get technical indicator values (legacy method for compatibility)
   */
  async getIndicator(params: IndicatorRequest): Promise<IndicatorResponse> {
    try {
      // Asset is already clean ticker, no conversion needed
      const asset = params.symbol;
      const indicatorData = await this.getTechnicalIndicators(asset, params.timeframe);

      // Convert to legacy format
      const value = this.extractIndicatorValue(indicatorData, params.indicator);

      return {
        symbol: params.symbol,
        indicator: params.indicator,
        timeframe: params.timeframe,
        values: [{
          timestamp: Date.now(),
          value: value,
          parameters: params.parameters || {}
        }]
      };
    } catch (error: any) {
      throw new Error(`Failed to get indicator ${params.indicator}: ${error.message}`);
    }
  }

  /**
   * Get multiple indicators at once
   */
  async getMultipleIndicators(requests: IndicatorRequest[]): Promise<IndicatorResponse[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/indicators/batch`, {
        requests: requests.map(req => ({
          symbol: req.symbol.toUpperCase(),
          timeframe: req.timeframe,
          indicator: req.indicator,
          parameters: req.parameters || {},
          limit: req.limit || 100
        }))
      });

      return response.data.results;
    } catch (error: any) {
      throw new Error(`Failed to get multiple indicators: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get available indicators
   */
  async getAvailableIndicators(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/indicators/list`);
      return response.data.indicators;
    } catch (error: any) {
      throw new Error(`Failed to get available indicators: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get indicator description and parameters
   */
  async getIndicatorInfo(indicatorName: string): Promise<{
    name: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      default?: any;
      description?: string;
    }>;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/indicators/${indicatorName}/info`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get indicator info for ${indicatorName}: ${error.response?.data?.message || error.message}`);
    }
  }

  // Convenience methods for common indicators

  /**
   * Get RSI (Relative Strength Index)
   */
  async getRSI(symbol: string, timeframe: string, period: number = 14, limit: number = 100): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'rsi',
      parameters: { period },
      limit
    });
  }

  /**
   * Get MACD (Moving Average Convergence Divergence)
   */
  async getMACD(
    symbol: string,
    timeframe: string,
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'macd',
      parameters: { fastPeriod, slowPeriod, signalPeriod },
      limit
    });
  }

  /**
   * Get Bollinger Bands
   */
  async getBollingerBands(
    symbol: string,
    timeframe: string,
    period: number = 20,
    stdDev: number = 2,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'bollinger_bands',
      parameters: { period, stdDev },
      limit
    });
  }

  /**
   * Get Moving Average
   */
  async getMovingAverage(
    symbol: string,
    timeframe: string,
    period: number = 20,
    type: 'sma' | 'ema' | 'wma' = 'sma',
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'moving_average',
      parameters: { period, type },
      limit
    });
  }

  /**
   * Get Stochastic Oscillator
   */
  async getStochastic(
    symbol: string,
    timeframe: string,
    kPeriod: number = 14,
    dPeriod: number = 3,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'stochastic',
      parameters: { kPeriod, dPeriod },
      limit
    });
  }

  /**
   * Get Average True Range (ATR)
   */
  async getATR(
    symbol: string,
    timeframe: string,
    period: number = 14,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'atr',
      parameters: { period },
      limit
    });
  }

  /**
   * Get Williams %R
   */
  async getWilliamsR(
    symbol: string,
    timeframe: string,
    period: number = 14,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'williams_r',
      parameters: { period },
      limit
    });
  }

  /**
   * Get Commodity Channel Index (CCI)
   */
  async getCCI(
    symbol: string,
    timeframe: string,
    period: number = 20,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'cci',
      parameters: { period },
      limit
    });
  }

  /**
   * Get Parabolic SAR
   */
  async getParabolicSAR(
    symbol: string,
    timeframe: string,
    acceleration: number = 0.02,
    maximum: number = 0.2,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'parabolic_sar',
      parameters: { acceleration, maximum },
      limit
    });
  }

  /**
   * Get Average Directional Index (ADX)
   */
  async getADX(
    symbol: string,
    timeframe: string,
    period: number = 14,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'adx',
      parameters: { period },
      limit
    });
  }

  /**
   * Get Ichimoku Cloud
   */
  async getIchimoku(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'ichimoku',
      limit
    });
  }

  /**
   * Get Fibonacci Retracement levels
   */
  async getFibonacciRetracement(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'fibonacci_retracement',
      limit
    });
  }

  /**
   * Get Volume indicators
   */
  async getVolumeIndicators(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'volume_indicators',
      limit
    });
  }

  /**
   * Get support and resistance levels
   */
  async getSupportResistance(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'support_resistance',
      limit
    });
  }

  /**
   * Get pivot points
   */
  async getPivotPoints(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<IndicatorResponse> {
    return this.getIndicator({
      symbol,
      timeframe,
      indicator: 'pivot_points',
      limit
    });
  }

  /**
   * Get news for specific asset
   */
  async getNews(asset: string): Promise<TechnicalNewsResult> {
    try {
      // Add USD suffix for technical analysis API
      const symbol = addUSDSuffix(asset);

      const response = await axios.get<TechnicalNewsItem[]>(`${this.baseUrl}/news/${symbol}`);
      return { items: response.data };
    } catch (error: any) {
      throw new Error(`Failed to fetch news for ${asset}: ${error.message}`);
    }
  }

  /**
   * Get supported tokens for technical analysis
   */
  async getSupportedTokens(): Promise<string[]> {
    try {
      const response = await axios.get<string[]>(`${this.baseUrl}/supported-tokens`);
      // @ts-ignore - API returns { supported_tokens: string[] } but we expect string[]
      return response.data.supported_tokens || response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch supported tokens: ${error.message}`);
    }
  }

  /**
   * Get comprehensive technical analysis for an asset
   */
  async getComprehensiveAnalysis(asset: string, timeframe: string): Promise<ComprehensiveAnalysis> {
    try {
      const [technical, metadata, news, signalStrength] = await Promise.all([
        this.getTechnicalIndicators(asset, timeframe),
        this.getAssetMetadata(asset, timeframe),
        this.getNews(asset),
        this.getSignalStrength(asset, timeframe)
      ]);

      // Determine recommendation based on signal strength and sentiment
      let recommendation: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
      const sentimentScore = metadata.sentiment / 100; // Normalize to 0-1
      const combinedScore = (signalStrength.strength + sentimentScore) / 2;

      if (combinedScore > 0.3) {
        recommendation = 'BUY';
      } else if (combinedScore < -0.3) {
        recommendation = 'SELL';
      }

      return {
        technical,
        metadata,
        news,
        signalStrength: signalStrength.strength,
        recommendation
      };
    } catch (error) {
      throw new Error(`Failed to get comprehensive analysis for ${asset}: ${error}`);
    }
  }

  // Utility methods

  /**
   * Check if indicator is overbought/oversold
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
  private extractIndicatorValue(data: IndicatorData, indicatorName: string): number {
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
   * Get signal strength based on multiple indicators (using real API)
   */
  async getSignalStrength(symbol: string, timeframe: string): Promise<SignalStrength> {
    try {
      // Validate timeframe
      this.validateTimeframe(timeframe);

      // Convert symbol to clean ticker if needed (BTCUSDT -> BTC, BTCUSD -> BTC)
      const asset = symbol.replace(/USDT$/, '').replace(/USD$/, '');
      const indicatorData = await this.getTechnicalIndicators(asset, timeframe);

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
    } catch (error) {
      console.warn(`Failed to get signal strength for ${symbol}:`, error);
      // Return neutral signal if API fails
      return {
        strength: 0,
        signals: []
      };
    }
  }
}
