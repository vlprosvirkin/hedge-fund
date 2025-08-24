# 🔌 API Types Documentation

This document provides comprehensive type definitions for all external API integrations in the Hedge Fund MVP.

## 📁 File Structure

The API types are organized in the following files:

- **`src/types/aspis.ts`** - Aspis Trading API types
- **`src/types/binance.ts`** - Binance Market Data API types
- **`src/types/telegram.ts`** - Telegram Bot API types
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

### Order Management Types

#### SymbolInfo
```typescript
export interface SymbolInfo {
  symbol: string;
  status: string;
  minQty: number;
  maxQty: number;
  stepSize: number;
  tickSize: number;
  minPrice: number;
  maxPrice: number;
}
```

#### ConditionalOrderParams
```typescript
export interface ConditionalOrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  type: 'stop_loss' | 'take_profit' | 'trailing_stop';
  triggerPrice: number;
  price?: number;
  trailingAmount?: number;
}
```

#### OrderValidationParams
```typescript
export interface OrderValidationParams {
  symbol: string;
  quantity: number;
  price?: number;
}

export interface OrderValidationResult {
  valid: boolean;
  errors: string[];
}
```

## 💰 Binance Market Data API Types

### Market Data Types

#### BinanceOHLCV
```typescript
export type BinanceOHLCV = [
  number,   // Open time
  string,   // Open
  string,   // High
  string,   // Low
  string,   // Close
  string,   // Volume
  number,   // Close time
  string,   // Quote asset volume
  number,   // Number of trades
  string,   // Taker buy base asset volume
  string,   // Taker buy quote asset volume
  string    // Ignore
];
```

#### BinanceOrderBook
```typescript
export interface BinanceOrderBook {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
}
```

#### BinanceTicker24hr
```typescript
export interface BinanceTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}
```

### Exchange Information Types

#### BinanceExchangeInfo
```typescript
export interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: any[];
  exchangeFilters: any[];
  symbols: BinanceSymbolInfo[];
}

export interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  quoteAssetPrecision: number;
  baseCommissionPrecision: number;
  quoteCommissionPrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: BinanceFilter[];
  permissions: string[];
}
```

#### BinanceFilter
```typescript
export interface BinanceFilter {
  filterType: string;
  minPrice?: string;
  maxPrice?: string;
  tickSize?: string;
  minQty?: string;
  maxQty?: string;
  stepSize?: string;
  minNotional?: string;
  applyToMarket?: boolean;
  avgPriceMins?: number;
  limit?: number;
  maxNumOrders?: number;
  maxNumAlgoOrders?: number;
}
```

## 📱 Telegram Bot API Types

### Core Bot Types

#### TelegramMessage
```typescript
export interface TelegramMessage {
  text: string;
  parseMode?: 'Markdown' | 'HTML';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  replyToMessageId?: number;
  replyMarkup?: any;
}
```

#### TelegramSendMessageResponse
```typescript
export interface TelegramSendMessageResponse {
  ok: boolean;
  result?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
    };
    chat: {
      id: number;
      first_name: string;
      username?: string;
      type: string;
    };
    date: number;
    text: string;
  };
  error_code?: number;
  description?: string;
}
```

#### TelegramBotInfo
```typescript
export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
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

### Trading System Message Types

#### TradingAlert
```typescript
export interface TradingAlert {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  data?: any;
}
```

#### ConsensusReport
```typescript
export interface ConsensusReport {
  roundId: string;
  timestamp: number;
  recommendations: Array<{
    ticker: string;
    confidence: number;
    recommendation: 'BUY' | 'SELL' | 'HOLD';
    reasoning: string;
  }>;
  conflicts: Array<{
    ticker: string;
    conflictType: string;
    description: string;
  }>;
}
```

#### RiskAlert
```typescript
export interface RiskAlert {
  type: 'limit_exceeded' | 'drawdown_warning' | 'volatility_alert' | 'liquidity_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: {
    currentValue: number;
    limit: number;
    percentage: number;
  };
  timestamp: number;
}
```

#### OrderExecutionReport
```typescript
export interface OrderExecutionReport {
  roundId: string;
  timestamp: number;
  orders: Array<{
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    status: 'pending' | 'filled' | 'cancelled' | 'rejected';
    executionTime: number;
  }>;
  positions: Array<{
    symbol: string;
    quantity: number;
    avgPrice: number;
    unrealizedPnL: number;
  }>;
}
```

#### PerformanceSummary
```typescript
export interface PerformanceSummary {
  roundId: string;
  timestamp: number;
  performance: {
    totalValue: number;
    change24h: number;
    changePercent24h: number;
    totalPnL: number;
    realizedPnL: number;
    unrealizedPnL: number;
    winRate: number;
    totalTrades: number;
  };
  topPerformers: Array<{
    symbol: string;
    return: number;
    volume: number;
  }>;
  riskMetrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
    var95: number;
  };
}
```

### Configuration Types

#### TelegramConfig
```typescript
export interface TelegramConfig {
  botToken: string;
  chatId: string;
  baseUrl?: string;
  timeout?: number;
}
```

#### TelegramNotificationOptions
```typescript
export interface TelegramNotificationOptions {
  parseMode?: 'Markdown' | 'HTML';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  replyToMessageId?: number;
}
```

## 🛠️ Usage Examples

### Aspis Trading API
```typescript
import { 
  AspisAdapter,
  type ExecuteOrderInput,
  type AccountInfo 
} from '../types/index.js';

const aspisAdapter = new AspisAdapter();

// Place an order
const orderInput: ExecuteOrderInput = {
  chainId: '42161',
  vault: '0x...',
  srcToken: 'USDT',
  dstToken: 'BTC',
  amountIn: '1000',
  exchange: 'ODOS',
  slippage: '10'
};

const orderId = await aspisAdapter.placeOrder({
  symbol: 'BTC',
  side: 'buy',
  quantity: 1000,
  type: 'market'
});

// Get account information
const accountInfo: AccountInfo = await aspisAdapter.getAccountInfo();
console.log(`Total value: $${accountInfo.totalValue}`);
```

### Binance Market Data API
```typescript
import { 
  BinanceAdapter,
  type BinanceOHLCV,
  type BinanceOrderBook 
} from '../types/index.js';

const binanceAdapter = new BinanceAdapter();

// Get OHLCV data
const ohlcv: BinanceOHLCV[] = await binanceAdapter.getOHLCV('BTCUSDT', '1h', 100);
const [openTime, open, high, low, close, volume] = ohlcv[0];

// Get order book
const orderBook: BinanceOrderBook = await binanceAdapter.getOrderBook('BTCUSDT');
console.log(`Best bid: ${orderBook.bids[0][0]}`);
console.log(`Best ask: ${orderBook.asks[0][0]}`);
```

### Telegram Notifications
```typescript
import { 
  TelegramAdapter,
  type TradingAlert,
  type ConsensusReport 
} from '../types/index.js';

const telegramAdapter = new TelegramAdapter();

// Send trading alert
const alert: TradingAlert = {
  type: 'success',
  title: 'Order Executed',
  message: 'BTC buy order filled at $50,000',
  timestamp: Date.now()
};

await telegramAdapter.sendMessage(alert.message);

// Send consensus report
const report: ConsensusReport = {
  roundId: 'round-123',
  timestamp: Date.now(),
  recommendations: [
    {
      ticker: 'BTC',
      confidence: 0.8,
      recommendation: 'BUY',
      reasoning: 'Strong technical signals'
    }
  ],
  conflicts: []
};

await telegramAdapter.sendConsensusReport(report);
```

## 🔍 Type Safety Features

### Zod Schema Validation
All API types include Zod schemas for runtime validation:

```typescript
import { 
  ExecuteOrderInputSchema,
  BinanceOHLCVSchema,
  TelegramMessageSchema 
} from '../types/index.js';

// Validate API requests
const validatedOrder = ExecuteOrderInputSchema.parse(orderInput);
const validatedOHLCV = BinanceOHLCVSchema.parse(ohlcvData);
const validatedMessage = TelegramMessageSchema.parse(messageData);
```

### Strict TypeScript Configuration
The project uses strict TypeScript settings:

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## 📚 Related Documentation

- **[Aspis Setup Guide](ASPIS_SETUP.md)** - Trading API setup and configuration
- **[Aspis API Methods](ASPIS_API_METHODS.md)** - Complete API reference
- **[Technical Analysis Types](TECHNICAL_ANALYSIS_TYPES.md)** - Technical indicator types
- **[News API Types](NEWS_API_TYPES.md)** - News and sentiment analysis types
- **[Integration Tests](../src/tests/README.md)** - Testing documentation

## 🔧 Development

### Adding New API Types
1. Create type file: `src/types/new-api.ts`
2. Define Zod schemas for validation
3. Export types using `z.infer<typeof Schema>`
4. Update imports in consuming files
5. Add re-export in `src/types/index.ts`
6. Update documentation

### Type Migration
When migrating from inline types to dedicated type files:

1. **Create type file**: `src/types/api-name.ts`
2. **Define Zod schemas**: For runtime validation
3. **Export types**: Using `z.infer<typeof Schema>`
4. **Update imports**: In consuming files
5. **Update index**: Add re-export in `src/types/index.ts`

### Error Handling
All API types include comprehensive error handling:

```typescript
try {
  const response = await apiCall();
  const validatedData = Schema.parse(response);
  // Process validated data
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation error:', error.errors);
  } else if (error instanceof Error) {
    console.error('API error:', error.message);
  }
  // Handle error appropriately
}
```

---

**Built with ❤️ for robust API integration**
