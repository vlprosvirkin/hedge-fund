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
import { addUSDSuffixForAPI } from '../utils.js';
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
      const symbol = addUSDSuffixForAPI(asset);

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
      // getIndicators already handles USD conversion, so pass the clean ticker
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
   * Get multiple indicators at once
   */
  async getMultipleIndicators(requests: IndicatorRequest[]): Promise<IndicatorResponse[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/indicators/batch`, {
        requests: requests.map(req => ({
          symbol: addUSDSuffixForAPI(req.symbol).toUpperCase(),
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



  /**
   * Get news for specific asset
   */
  async getNews(asset: string): Promise<TechnicalNewsResult> {
    try {
      // Add USD suffix for technical analysis API
      const symbol = addUSDSuffixForAPI(asset);

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
 * Get current price for a single asset
 */
  async getPrice(symbol: string): Promise<number> {
    try {
      // getIndicators already handles USD conversion, so pass the clean ticker
      const data = await this.getIndicators(symbol, '4h');
      return data.lp || 0;
    } catch (error: any) {
      throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
    }
  }



  /**
 * Get all asset data in one call (stats, indicators, price)
 */
  async getAllAssetData(asset: string, timeframe: string): Promise<{
    technical: IndicatorData;
    metadata: AssetMetadata;
    price: number;
    news: TechnicalNewsResult;
  }> {
    try {
      // Get all data using individual endpoints in parallel
      const [technical, metadata, price, news] = await Promise.all([
        this.getTechnicalIndicators(asset, timeframe),
        this.getAssetMetadata(asset, timeframe),
        this.getPrice(asset),
        this.getNews(asset)
      ]);

      return {
        technical,
        metadata,
        price,
        news
      };
    } catch (error: any) {
      throw new Error(`Failed to get all asset data for ${asset}: ${error.message}`);
    }
  }

}
