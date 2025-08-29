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
import { API_CONFIG } from '../core/config.js';
import { addUSDSuffixForAPI } from '../utils.js';
import axios from 'axios';

export class Signals {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_CONFIG.technicalIndicators.baseUrl;
    this.timeout = API_CONFIG.technicalIndicators.timeout;
  }

  /**
   * Validate timeframe format
   */
  private validateTimeframe(timeframe: string): void {
    const supportedTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
    const normalizedTimeframe = timeframe.toLowerCase();
    if (!supportedTimeframes.includes(normalizedTimeframe)) {
      throw new Error(
        `Unsupported timeframe: ${timeframe}. Supported timeframes: ${supportedTimeframes.join(', ')}`
      );
    }
  }

  /**
   * Get technical indicators from /stats endpoint
   */
  async getTechnicalIndicators(asset: string, timeframe: string): Promise<IndicatorData> {
    try {
      this.validateTimeframe(timeframe);
      const symbol = addUSDSuffixForAPI(asset);

      const response = await axios.post<StatsResponse>(`${this.baseUrl}/stats`, {
        symbol: symbol,
        timeframe: timeframe.toLowerCase(),
      });

      if (response.data?.data) {
        return response.data.data;
      }

      throw new Error(`Invalid response structure for ${asset} technical indicators`);
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error(`Asset ${asset} is not supported for technical analysis`);
      }
      throw new Error(`Failed to fetch technical indicators for ${asset}: ${error.message}`);
    }
  }

  /**
   * Get indicators data from /indicators endpoint
   */
  async getIndicators(asset: string, timeframe: string): Promise<any> {
    try {
      this.validateTimeframe(timeframe);
      const symbol = addUSDSuffixForAPI(asset);

      const response = await axios.post(`${this.baseUrl}/indicators`, {
        symbol: symbol,
        timeframe: timeframe.toLowerCase(),
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error(`Asset ${asset} is not supported for indicators`);
      }
      throw new Error(`Failed to fetch indicators for ${asset}: ${error.message}`);
    }
  }

  /**
   * Get raw indicators data from API
   */
  async getRawIndicatorsData(asset: string, timeframe: string): Promise<any> {
    try {
      return await this.getIndicators(asset, timeframe);
    } catch (error) {
      throw new Error(`Failed to get raw indicators data for ${asset}: ${error}`);
    }
  }


  /**
   * Get news for specific asset
   */
  async getNews(asset: string): Promise<TechnicalNewsResult> {
    try {
      const symbol = addUSDSuffixForAPI(asset);
      const response = await axios.get<TechnicalNewsItem[]>(`${this.baseUrl}/news/${symbol}`);
      return { items: response.data };
    } catch (error: any) {
      throw new Error(`Failed to fetch news for ${asset}: ${error.message}`);
    }
  }

  /**
   * Get supported tokens
   */
  async getSupportedTokens(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/supported-tokens`);
      return (response.data as any).supported_tokens || response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch supported tokens: ${error.message}`);
    }
  }

  /**
   * Get current price for a single asset
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      const data = await this.getIndicators(symbol, '4h');
      return data.lp || 0;
    } catch (error: any) {
      throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
    }
  }

}
