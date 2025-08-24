import { z } from 'zod';

// ===== Binance API Response Types =====

export const BinanceOHLCVSchema = z.array(z.tuple([
  z.number(), // Open time
  z.string(), // Open
  z.string(), // High
  z.string(), // Low
  z.string(), // Close
  z.string(), // Volume
  z.number(), // Close time
  z.string(), // Quote asset volume
  z.number(), // Number of trades
  z.string(), // Taker buy base asset volume
  z.string(), // Taker buy quote asset volume
  z.string(), // Ignore
]));

export const BinanceOrderBookSchema = z.object({
  lastUpdateId: z.number(),
  bids: z.array(z.tuple([z.string(), z.string()])), // [price, quantity]
  asks: z.array(z.tuple([z.string(), z.string()])), // [price, quantity]
});

export const BinanceTicker24hrSchema = z.object({
  symbol: z.string(),
  priceChange: z.string(),
  priceChangePercent: z.string(),
  weightedAvgPrice: z.string(),
  prevClosePrice: z.string(),
  lastPrice: z.string(),
  lastQty: z.string(),
  bidPrice: z.string(),
  bidQty: z.string(),
  askPrice: z.string(),
  askQty: z.string(),
  openPrice: z.string(),
  highPrice: z.string(),
  lowPrice: z.string(),
  volume: z.string(),
  quoteVolume: z.string(),
  openTime: z.number(),
  closeTime: z.number(),
  firstId: z.number(),
  lastId: z.number(),
  count: z.number(),
});

export const BinanceExchangeInfoSchema = z.object({
  timezone: z.string(),
  serverTime: z.number(),
  rateLimits: z.array(z.any()),
  exchangeFilters: z.array(z.any()),
  symbols: z.array(z.object({
    symbol: z.string(),
    status: z.string(),
    baseAsset: z.string(),
    baseAssetPrecision: z.number(),
    quoteAsset: z.string(),
    quotePrecision: z.number(),
    quoteAssetPrecision: z.number(),
    baseCommissionPrecision: z.number(),
    quoteCommissionPrecision: z.number(),
    orderTypes: z.array(z.string()),
    icebergAllowed: z.boolean(),
    ocoAllowed: z.boolean(),
    isSpotTradingAllowed: z.boolean(),
    isMarginTradingAllowed: z.boolean(),
    filters: z.array(z.any()),
    permissions: z.array(z.string()),
  })),
});

// ===== Filter Types =====

export const BinanceFilterSchema = z.object({
  filterType: z.string(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  tickSize: z.string().optional(),
  minQty: z.string().optional(),
  maxQty: z.string().optional(),
  stepSize: z.string().optional(),
  minNotional: z.string().optional(),
  applyToMarket: z.boolean().optional(),
  avgPriceMins: z.number().optional(),
  limit: z.number().optional(),
  maxNumOrders: z.number().optional(),
  maxNumAlgoOrders: z.number().optional(),
});

// ===== Subscription Types =====

export const BinanceSubscriptionSchema = z.object({
  symbol: z.string(),
  callback: z.function().args(z.any()).returns(z.void()),
});

// ===== Type Exports =====

export type BinanceOHLCV = z.infer<typeof BinanceOHLCVSchema>;
export type BinanceOrderBook = z.infer<typeof BinanceOrderBookSchema>;
export type BinanceTicker24hr = z.infer<typeof BinanceTicker24hrSchema>;
export type BinanceExchangeInfo = z.infer<typeof BinanceExchangeInfoSchema>;
export type BinanceFilter = z.infer<typeof BinanceFilterSchema>;
export type BinanceSubscription = z.infer<typeof BinanceSubscriptionSchema>;

// ===== Utility Types =====

export interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  filters: BinanceFilter[];
}

export interface BinanceTimeframe {
  interval: string;
  milliseconds: number;
}
