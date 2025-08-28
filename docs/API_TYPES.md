# 🔌 API Types Documentation

This document provides comprehensive type definitions for all external API integrations in the Hedge Fund MVP.

## 📁 File Structure

The API types are organized in the following files:

- **`src/types/aspis.ts`** - Aspis Trading API types
- **`src/types/binance.ts`** - Binance Market Data API types
- **`src/types/telegram.ts`** - Telegram Bot API types
- **`src/types/news.ts`** - News and Sentiment Analysis types
- **`src/types/signals.ts`** - Technical Indicators API types
- **`src/types/cmc.ts`** - CoinMarketCap API types
- **`src/types/index.ts`** - Re-exports and core system types

## 🏦 Aspis Trading API Types

### Core Trading Types

#### ExecuteOrderInput
```typescript
export interface ExecuteOrderInput {
  chainId: string;
  vault: string;
  srcToken: string;
  dstToken: string;
  amountIn: string;
  exchange: string;
  slippage: string;
  srcTokenSymbol?: string;
  dstTokenSymbol?: string;
}
```

#### ExecuteOrderResponse
```typescript
export interface ExecuteOrderResponse {
  exchange: string;
  srcToken: string;
  dstToken: string;
  inputAmount: number;
  outputAmount: string;
  outputAmountScaled: string;
  status: string;
  tx_hash: string;
}
```

#### AccountInfo
```typescript
export interface AccountInfo {
  balances: BalanceItem[];
  totalValue: number;
  marginLevel?: number;
}

export interface BalanceItem {
  asset: string;
  free: number;
  locked: number;
}
```

### Portfolio Management Types

#### TradingFees
```typescript
export interface TradingFees {
  makerFee: number;
  takerFee: number;
  symbol?: string;
}
```

#### TradeHistoryItem
```typescript
export interface TradeHistoryItem {
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee: number;
  feeAsset: string;
  timestamp: number;
}
```

#### PortfolioMetrics
```typescript
export interface PortfolioMetrics {
  totalValue: number;
  availableBalance: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  unrealizedPnL: number;
  realizedPnL: number;
}
```

## 📊 Binance Market Data API Types

### Market Data Types

#### MarketStats
```typescript
export interface MarketStats {
  symbol: string;
  price: number;
  volume24h: number;
  volumeChange24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  spread: number;
  marketCap: number;
  marketCapDominance: number;
  volatility: number;
  liquidity: number;
}
```

#### Candle
```typescript
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

#### OrderBook
```typescript
export interface OrderBook {
  symbol: string;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
  timestamp: number;
}
```

## 📰 News API Types

### Core News Types

#### NewsItem
```typescript
export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number;
  sentiment: number; // -1 to 1
  description?: string;
  assets?: string[];
}
```

#### DigestItem
```typescript
export interface DigestItem {
  id: string;
  title: string;
  description: string;
  significance: string;
  implications: string;
  assets: string[];
  source: string;
  url: string;
  created_at: Date;
  updated_at: Date;
}
```

#### DigestResponse
```typescript
export interface DigestResponse {
  items: DigestItem[];
  count: number;
  timestamp: Date;
}
```

### Evidence Types

#### Evidence
```typescript
export interface Evidence {
  id: string;
  ticker: string;
  newsItemId: string;
  relevance: number; // 0 to 1
  timestamp: number;
  source: string;
  quote?: string;
}
```

## 📈 Technical Indicators API Types

### Core Technical Analysis Types

#### StatsResponse
```typescript
export interface StatsResponse {
  status: string;
  data: {
    // Core Technical Indicators
    RSI: number;
    "RSI[1]"?: number;

    // MACD
    "MACD.macd": number;
    "MACD.signal": number;

    // ADX
    ADX: number;
    "ADX+DI": number;
    "ADX-DI": number;
    "ADX+DI[1]"?: number;
    "ADX-DI[1]"?: number;

    // Moving Averages
    SMA10: number;
    SMA20: number;
    SMA30: number;
    SMA50: number;
    SMA100: number;
    SMA200: number;

    EMA10: number;
    EMA20: number;
    EMA30: number;
    EMA50: number;
    EMA100: number;
    EMA200: number;

    // Stochastic
    "Stoch.K": number;
    "Stoch.D": number;
    "Stoch.K[1]"?: number;
    "Stoch.D[1]"?: number;
    "Stoch.RSI.K"?: number;

    // Momentum
    Mom?: number;
    "Mom[1]"?: number;

    // Awesome Oscillator
    AO?: number;
    "AO[1]"?: number;
    "AO[2]"?: number;

    // Other Technical Indicators
    BBPower?: number;
    CCI20?: number;
    "CCI20[1]"?: number;
    HullMA9?: number;
    UO?: number;
    VWMA?: number;
    "W.R"?: number;

    // Ichimoku
    "Ichimoku.BLine"?: number;

    // Pivot Points
    "Pivot.M.Classic.Middle"?: number;
    "Pivot.M.Classic.R1"?: number;
    "Pivot.M.Classic.R2"?: number;
    "Pivot.M.Classic.R3"?: number;
    "Pivot.M.Classic.S1"?: number;
    "Pivot.M.Classic.S2"?: number;
    "Pivot.M.Classic.S3"?: number;

    // Recommendations
    "Recommend.All"?: number;
    "Recommend.MA"?: number;
    "Recommend.Other"?: number;
    "Rec.BBPower"?: number;
    "Rec.HullMA9"?: number;
    "Rec.Ichimoku"?: number;
    "Rec.Stoch.RSI"?: number;
    "Rec.UO"?: number;
    "Rec.VWMA"?: number;
    "Rec.WR"?: number;

    // Price Data
    close: number;
  };
}
```

#### IndicatorsResponse
```typescript
export interface IndicatorsResponse {
  // Price data
  lp?: number; // Last price
  volume?: number;
  ch?: number; // Change
  chp?: number; // Change percent
  market_cap_calc?: number;
  sentiment?: number; // 0-100

  // Market Cap & Supply
  market_cap?: number;
  market_cap_diluted_calc?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  cmc_rank?: number;

  // Volume & Trading
  total_value_traded?: number;
  average_transaction_usd?: number;
  transaction_size_mean?: number;
  large_tx_volume_usd?: number;
  large_tx_count?: number;

  // On-Chain Metrics
  hash_rate?: number;
  txs_volume?: number;
  txs_volume_usd?: number;
  txs_count?: number;
  addresses_active?: number;
  addresses_new?: number;
  addresses_total?: number;
  total_addresses_with_balance?: number;
  utxo_created?: number;
  utxo_spent?: number;
  utxo_value_created_total?: number;
  utxo_value_spent_total?: number;
  utxo_value_created_mean?: number;
  utxo_value_spent_mean?: number;
  utxo_value_created_median?: number;
  utxo_value_spent_median?: number;

  // Network Health
  block_height?: number;
  difficulty?: number;
  transaction_rate?: number;
  block_size_total?: number;
  block_size_mean?: number;
  block_interval_mean?: number;
  block_interval_median?: number;

  // Social & Sentiment
  social_volume_24h?: number;
  tweets?: number;
  interactions?: number;
  galaxyscore?: number;
  popularity?: number;
  popularity_rank?: number;
  socialdominance?: number;

  // Fees & Economics
  fees_total?: number;
  fees_total_usd?: number;
  fees_mean?: number;
  fees_mean_usd?: number;
  fees_median?: number;
  fees_median_usd?: number;

  // Market Structure
  market_pairs?: number;
  altrank?: number;
  price_drawdown?: number;
  sopr?: number; // Spent Output Profit Ratio

  // Additional Market Data
  all_time_high?: number;
  all_time_low?: number;
  price_52_week_high?: number;
  price_52_week_low?: number;
  price_percent_change_52_week?: number;
  price_percent_change_1_week?: number;

  // Community & Development
  contributorsactive?: number;
  contributorscreated?: number;
  postsactive?: number;
  postscreated?: number;

  // Liquidity & Depth
  receiving_addresses?: number;
  sending_addresses?: number;

  // Risk Metrics
  volatility_30?: number;
  btc_correlation_30?: number;
  btc_correlation_60?: number;

  // Additional Fields
  tvl?: number;
  rvtadj90_coinm?: number;
  supply_active_1year_ago?: number;
}
```

### Signal Analysis Types

#### SignalType
```typescript
export type SignalType = 'bullish' | 'bearish' | 'neutral';
```

#### Signal
```typescript
export interface Signal {
  indicator: string;
  value: number;
  signal: SignalType;
  weight: number;
}
```

#### SignalStrength
```typescript
export interface SignalStrength {
  strength: number; // -1 to 1 (bearish to bullish)
  signals: Signal[];
}
```

## 🪙 CoinMarketCap API Types

### Core CMC Types

#### CMCQuote
```typescript
export interface CMCQuote {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  market_cap: number;
  market_cap_dominance: number;
  fully_diluted_market_cap: number;
  price: number;
  volume_24h: number;
  volume_change_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_30d: number;
  percent_change_60d: number;
  percent_change_90d: number;
  market_cap_by_total_supply: number;
  avg_price_90d: number;
  market_cap_dominance_24h_percent_change: number;
  circulating_supply: number;
  self_reported_circulating_supply: number;
  self_reported_market_cap: number;
  total_supply: number;
  max_supply: number;
  infinite_supply: boolean;
  last_updated: string;
  date_added: string;
  tags: string[];
  platform: any;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      percent_change_60d: number;
      percent_change_90d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      market_cap_by_total_supply: number;
      avg_price_90d: number;
      market_cap_dominance_24h_percent_change: number;
      last_updated: string;
    };
  };
}
```

#### CMCMarketData
```typescript
export interface CMCMarketData {
  symbol: string;
  price: number;
  volume24h: number;
  volumeChange24h: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  marketCapDominance: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  cmcRank: number;
  lastUpdated: string;
}
```

#### CMCSentimentData
```typescript
export interface CMCSentimentData {
  symbol: string;
  fearGreedIndex?: number; // Not directly available from CMC, but we can derive
  marketSentiment: number; // Derived from price changes and volume
  socialVolume?: number; // Not available on free tier
  newsSentiment?: number; // Not available on free tier
  volatilityIndex: number; // Derived from price changes
  momentumIndex: number; // Derived from price changes
}
```

### Fear & Greed Index Types

#### FearGreedLevel
```typescript
export enum FearGreedLevel {
  EXTREME_FEAR = 'extreme_fear',
  FEAR = 'fear',
  NEUTRAL = 'neutral',
  GREED = 'greed',
  EXTREME_GREED = 'extreme_greed'
}
```

#### FearGreedInterpretation
```typescript
export interface FearGreedInterpretation {
  value: number; // 0-100
  level: FearGreedLevel;
  description: string;
  moodFactor: number; // 0.9-1.1 for sentiment calculations
}
```

#### MarketSentimentInterpretation
```typescript
export interface MarketSentimentInterpretation {
  symbol: string;
  sentiment: number; // -1 to 1
  volatility: number; // 0 to 1
  momentum: number; // -1 to 1
  confidence: number; // 0 to 1
  recommendation: 'bullish' | 'bearish' | 'neutral';
}
```

## 📱 Telegram Bot API Types

### Core Telegram Types

#### TelegramMessage
```typescript
export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: TelegramMessageEntity[];
}
```

#### TelegramUser
```typescript
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}
```

#### TelegramChat
```typescript
export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}
```

#### TelegramMessageEntity
```typescript
export interface TelegramMessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
  language?: string;
}
```

### Bot Response Types

#### TelegramResponse
```typescript
export interface TelegramResponse<T> {
  ok: boolean;
  result: T;
  error_code?: number;
  description?: string;
}
```

#### SendMessageResponse
```typescript
export interface SendMessageResponse {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text: string;
}
```

## 🔧 Zod Schemas

### Core Validation Schemas

#### NewsItemSchema
```typescript
export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  publishedAt: z.number(),
  sentiment: z.number().min(-1).max(1),
  description: z.string().optional(),
  assets: z.array(z.string()).optional(),
});
```

#### EvidenceSchema
```typescript
export const EvidenceSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  newsItemId: z.string(),
  relevance: z.number().min(0).max(1),
  timestamp: z.number(),
  source: z.string(),
  quote: z.string().optional(),
});
```

#### ClaimSchema
```typescript
export const ClaimSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  agentRole: z.enum(['fundamental', 'sentiment', 'technical']),
  claim: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(EvidenceSchema),
  timestamp: z.number(),
  riskFlags: z.array(z.string()).optional(),
  signals: z.array(z.object({
    name: z.string(),
    value: z.number()
  })).optional(),
  direction: z.enum(['bullish', 'bearish', 'neutral']).optional(),
  magnitude: z.number().optional(),
  rationale: z.string().optional(),
  thesis: z.string().optional(),
});
```

## 🚀 Usage Examples

### Creating a News Item
```typescript
import { NewsItemSchema, type NewsItem } from '../types/news.js';

const newsData = {
  id: 'news_123',
  title: 'Bitcoin Reaches New Highs',
  url: 'https://example.com/bitcoin-highs',
  source: 'CoinDesk',
  publishedAt: Date.now(),
  sentiment: 0.8,
  description: 'Bitcoin reaches new all-time highs...',
  assets: ['BTC']
};

const validatedNews = NewsItemSchema.parse(newsData);
```

### Creating a Claim
```typescript
import { ClaimSchema, type Claim } from '../types/index.js';

const claimData = {
  id: 'claim_456',
  ticker: 'BTC',
  agentRole: 'sentiment',
  claim: 'BUY',
  confidence: 0.85,
  evidence: [
    {
      id: 'evidence_1',
      ticker: 'BTC',
      newsItemId: 'news_123',
      relevance: 0.9,
      timestamp: Date.now(),
      source: 'CoinDesk',
      quote: 'Bitcoin reaches new highs'
    }
  ],
  timestamp: Date.now(),
  direction: 'bullish',
  magnitude: 0.7,
  rationale: 'Strong positive sentiment from recent news'
};

const validatedClaim = ClaimSchema.parse(claimData);
```

### Working with Technical Indicators
```typescript
import { StatsResponseSchema, type StatsResponse } from '../types/signals.js';

const technicalData = {
  status: 'ok',
  data: {
    RSI: 45.2,
    'MACD.macd': 0.15,
    ADX: 32.1,
    'Stoch.K': 65.4,
    SMA20: 50000,
    EMA50: 49500,
    close: 51000
  }
};

const validatedTechnical = StatsResponseSchema.parse(technicalData);
```

## 📋 Type Exports

All types are exported from their respective files and re-exported from `src/types/index.ts`:

```typescript
// Core system types
export type { Claim, Evidence, MarketStats } from './index.js';

// API-specific types
export type { NewsItem, DigestItem } from './news.js';
export type { StatsResponse, IndicatorsResponse } from './signals.js';
export type { CMCQuote, CMCMarketData } from './cmc.js';
export type { ExecuteOrderInput, ExecuteOrderResponse } from './aspis.js';
export type { TelegramMessage, TelegramResponse } from './telegram.js';
```

This comprehensive type system ensures type safety across all API integrations and provides clear interfaces for data exchange between different components of the system.
