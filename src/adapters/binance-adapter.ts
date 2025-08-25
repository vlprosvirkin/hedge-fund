import type { MarketDataAdapter } from '../interfaces/adapters.js';
import type { Candle, OrderBook, MarketStats } from '../types/index.js';
import { API_CONFIG } from '../config.js';
import { addUSDTSuffixForBinance } from '../utils.js';
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
      // Convert clean ticker to Binance format (BTC -> BTCUSDT)
      const binanceSymbol = addUSDTSuffixForBinance(symbol);

      const response = await axios.get(`${this.baseUrl}/api/v3/klines`, {
        params: {
          symbol: binanceSymbol,
          interval: this.mapTimeframe(timeframe),
          startTime: start,
          endTime: end,
          limit: 1000
        }
      });

      return response.data.map((candle: any[]) => ({
        symbol: symbol.toUpperCase(), // Return clean ticker
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
    } catch (error) {
      throw new Error(`Failed to fetch OHLCV data for ${symbol}: ${error}`);
    }
  }

  async getOrderBook(symbol: string): Promise<OrderBook> {
    try {
      // Convert clean ticker to Binance format (BTC -> BTCUSDT)
      const binanceSymbol = addUSDTSuffixForBinance(symbol);

      const response = await axios.get(`${this.baseUrl}/api/v3/depth`, {
        params: {
          symbol: binanceSymbol,
          limit: 100
        }
      });

      return {
        symbol: symbol.toUpperCase(), // Return clean ticker
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
      throw new Error(`Failed to fetch order book for ${symbol}: ${error}`);
    }
  }

  async getMarketStats(symbol: string): Promise<MarketStats> {
    try {
      // Convert clean ticker to Binance format (BTC -> BTCUSDT)
      const binanceSymbol = addUSDTSuffixForBinance(symbol);
      console.log(`Fetching market stats for ${symbol} (Binance: ${binanceSymbol})`);

      const [tickerResponse, exchangeInfoResponse] = await Promise.all([
        axios.get(`${this.baseUrl}/api/v3/ticker/24hr`, {
          params: { symbol: binanceSymbol }
        }),
        axios.get(`${this.baseUrl}/api/v3/exchangeInfo`)
      ]);

      const ticker = tickerResponse.data;
      const symbolInfo = exchangeInfoResponse.data.symbols.find(
        (s: any) => s.symbol === binanceSymbol
      );

      const lotSizeFilter = symbolInfo?.filters?.find((f: any) => f.filterType === 'LOT_SIZE');
      const priceFilter = symbolInfo?.filters?.find((f: any) => f.filterType === 'PRICE_FILTER');

      // Calculate price change percentage
      const priceChange24h = parseFloat(ticker.priceChangePercent || '0');
      
      // Calculate volume change (estimate based on current vs average volume)
      const volume24h = parseFloat(ticker.volume);
      const avgVolume = parseFloat(ticker.quoteVolume || ticker.volume);
      const volumeChange24h = avgVolume > 0 ? ((volume24h - avgVolume) / avgVolume) * 100 : 0;

      return {
        symbol: symbol.toUpperCase(), // Return clean ticker
        volume24h: volume24h,
        volumeChange24h: volumeChange24h,
        priceChange24h: priceChange24h,
        spread: this.calculateSpread(ticker.bidPrice, ticker.askPrice),
        tickSize: parseFloat(priceFilter?.tickSize || '0.01'),
        stepSize: parseFloat(lotSizeFilter?.stepSize || '0.00001'),
        minQty: parseFloat(lotSizeFilter?.minQty || '0.00001'),
        maxQty: parseFloat(lotSizeFilter?.maxQty || '1000000')
      };
    } catch (error) {
      throw new Error(`Failed to fetch market stats for ${symbol}: ${error}`);
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
