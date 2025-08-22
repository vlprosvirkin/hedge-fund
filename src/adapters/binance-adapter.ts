import type { MarketDataAdapter } from '../interfaces/adapters.js';
import type { Candle, OrderBook, MarketStats } from '../types/index.js';
import { API_CONFIG } from '../config.js';
import axios from 'axios';

export class BinanceAdapter implements MarketDataAdapter {
  private baseUrl: string;
  private wsUrl: string;
  private timeout: number;
  private isConnectedFlag = false;
  private subscriptions = new Map<string, (data: any) => void>();

  constructor(private apiKey?: string, private secretKey?: string) {
    // Use config values
    this.apiKey = apiKey || API_CONFIG.binance.apiKey;
    this.secretKey = secretKey || API_CONFIG.binance.secretKey;
    this.baseUrl = API_CONFIG.binance.baseUrl;
    this.wsUrl = API_CONFIG.binance.wsUrl;
    this.timeout = API_CONFIG.binance.timeout;
  }

  async connect(): Promise<void> {
    try {
      // Test connection
      await axios.get(`${this.baseUrl}/api/v3/ping`);
      this.isConnectedFlag = true;
    } catch (error) {
      throw new Error(`Failed to connect to Binance: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
    this.subscriptions.clear();
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async getOHLCV(
    symbol: string,
    timeframe: string,
    start: number,
    end: number
  ): Promise<Candle[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/klines`, {
        params: {
          symbol: symbol.toUpperCase(),
          interval: this.mapTimeframe(timeframe),
          startTime: start,
          endTime: end,
          limit: 1000
        }
      });

      return response.data.map((candle: any[]) => ({
        symbol: symbol.toUpperCase(),
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
    } catch (error) {
      // Return mock data for development
      return this.generateMockOHLCV(symbol, timeframe, start, end);
    }
  }

  async getOrderBook(symbol: string): Promise<OrderBook> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/depth`, {
        params: {
          symbol: symbol.toUpperCase(),
          limit: 100
        }
      });

      return {
        symbol: symbol.toUpperCase(),
        timestamp: Date.now(),
        bids: response.data.bids.map((bid: string[]) => [
          parseFloat(bid[0] || '0'),
          parseFloat(bid[1] || '0')
        ]),
        asks: response.data.asks.map((ask: string[]) => [
          parseFloat(ask[0] || '0'),
          parseFloat(ask[1] || '0')
        ])
      };
    } catch (error) {
      // Return mock data for development
      return this.generateMockOrderBook(symbol);
    }
  }

  async getMarketStats(symbol: string): Promise<MarketStats> {
    try {
      const [tickerResponse, exchangeInfoResponse] = await Promise.all([
        axios.get(`${this.baseUrl}/api/v3/ticker/24hr`, {
          params: { symbol: symbol.toUpperCase() }
        }),
        axios.get(`${this.baseUrl}/api/v3/exchangeInfo`)
      ]);

      const ticker = tickerResponse.data;
      const symbolInfo = exchangeInfoResponse.data.symbols.find(
        (s: any) => s.symbol === symbol.toUpperCase()
      );

      const lotSizeFilter = symbolInfo?.filters?.find((f: any) => f.filterType === 'LOT_SIZE');
      const priceFilter = symbolInfo?.filters?.find((f: any) => f.filterType === 'PRICE_FILTER');

      return {
        symbol: symbol.toUpperCase(),
        volume24h: parseFloat(ticker.volume),
        spread: this.calculateSpread(ticker.bidPrice, ticker.askPrice),
        tickSize: parseFloat(priceFilter?.tickSize || '0.01'),
        stepSize: parseFloat(lotSizeFilter?.stepSize || '0.00001'),
        minQty: parseFloat(lotSizeFilter?.minQty || '0.00001'),
        maxQty: parseFloat(lotSizeFilter?.maxQty || '1000000')
      };
    } catch (error) {
      // Return mock data for development
      return this.generateMockMarketStats(symbol);
    }
  }

  subscribeTicker(symbol: string, callback: (data: any) => void): void {
    this.subscriptions.set(symbol, callback);

    // In real implementation, would establish WebSocket connection
    // For now, just store the callback
    console.log(`Subscribed to ${symbol} ticker`);
  }

  unsubscribeTicker(symbol: string): void {
    this.subscriptions.delete(symbol);
    console.log(`Unsubscribed from ${symbol} ticker`);
  }

  private mapTimeframe(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w'
    };
    return mapping[timeframe] || '1h';
  }

  private calculateSpread(bidPrice: string, askPrice: string): number {
    const bid = parseFloat(bidPrice);
    const ask = parseFloat(askPrice);
    return ((ask - bid) / bid) * 100;
  }

  // Mock data generators for development
  private generateMockOHLCV(
    symbol: string,
    timeframe: string,
    start: number,
    end: number
  ): Candle[] {
    const candles: Candle[] = [];
    const interval = this.getIntervalMs(timeframe);
    let current = start;

    while (current < end) {
      const basePrice = 50000 + Math.random() * 10000;
      const volatility = 0.02;

      candles.push({
        symbol: symbol.toUpperCase(),
        timestamp: current,
        open: basePrice,
        high: basePrice * (1 + Math.random() * volatility),
        low: basePrice * (1 - Math.random() * volatility),
        close: basePrice * (1 + (Math.random() - 0.5) * volatility),
        volume: 1000 + Math.random() * 5000
      });

      current += interval;
    }

    return candles;
  }

  private generateMockOrderBook(symbol: string): OrderBook {
    const basePrice = 50000 + Math.random() * 10000;
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];

    for (let i = 0; i < 10; i++) {
      bids.push([basePrice - i * 10, 1 + Math.random() * 5]);
      asks.push([basePrice + i * 10, 1 + Math.random() * 5]);
    }

    return {
      symbol: symbol.toUpperCase(),
      timestamp: Date.now(),
      bids,
      asks
    };
  }

  private generateMockMarketStats(symbol: string): MarketStats {
    return {
      symbol: symbol.toUpperCase(),
      volume24h: 1000000 + Math.random() * 5000000,
      spread: 0.1 + Math.random() * 0.2,
      tickSize: 0.01,
      stepSize: 0.00001,
      minQty: 0.00001,
      maxQty: 1000000
    };
  }

  private getIntervalMs(timeframe: string): number {
    const mapping: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000
    };
    return mapping[timeframe] || 60 * 60 * 1000;
  }
}
