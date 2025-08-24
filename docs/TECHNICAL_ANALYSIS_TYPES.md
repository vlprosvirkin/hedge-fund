# 📊 Technical Analysis Types

This document provides comprehensive type definitions for the Technical Analysis system in the Hedge Fund MVP.

## 📁 File Structure

The technical analysis types are organized in the following files:

- **`src/types/technical-analysis.ts`** - Core technical analysis types and schemas
- **`src/types/index.ts`** - Re-exports and core system types
- **`src/types/aspis.ts`** - Aspis API types for trading execution
- **`src/types/binance.ts`** - Binance API types for market data

## 🔧 Core Technical Analysis Types

### API Response Types

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

  // Additional metadata
  symbol?: string;
  timeframe?: string;
  timestamp?: number;
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

### Comprehensive Analysis Types

#### AssetMetadata
```typescript
export interface AssetMetadata {
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  marketCap: number;
  sentiment: number;
}
```

#### Recommendation
```typescript
export type Recommendation = 'BUY' | 'HOLD' | 'SELL';
```

#### ComprehensiveAnalysis
```typescript
export interface ComprehensiveAnalysis {
  technical: any; // Using the data from StatsResponse
  metadata: AssetMetadata;
  news: TechnicalNewsResult;
  signalStrength: number;
  recommendation: Recommendation;
}
```

### News Integration Types

#### TechnicalNewsItem
```typescript
export interface TechnicalNewsItem {
  title: string;
  paragraph: string;
  preview_image: string;
  author: string;
  comments_count: null;
  boosts_count: number;
  publication_datetime: Date;
  is_updated: boolean;
  idea_strategy: string;
}
```

#### TechnicalNewsResult
```typescript
export interface TechnicalNewsResult {
  items: TechnicalNewsItem[];
}
```

## 🔧 API Request Types

### IndicatorRequest
```typescript
export interface IndicatorRequest {
  symbol: string;
  timeframe: string;
  indicator: string;
  parameters?: Record<string, any>;
  limit?: number;
}
```

### BatchIndicatorRequest
```typescript
export interface BatchIndicatorRequest {
  requests: IndicatorRequest[];
}
```

## 📊 Constants

### Indicator Thresholds
```typescript
export const INDICATOR_THRESHOLDS = {
  RSI: { overbought: 70, oversold: 30 },
  STOCHASTIC: { overbought: 80, oversold: 20 },
  WILLIAMS_R: { overbought: -20, oversold: -80 },
  CCI: { overbought: 100, oversold: -100 },
} as const;
```

### Signal Weights
```typescript
export const SIGNAL_WEIGHTS = {
  RSI: 0.3,
  MACD: 0.3,
  STOCHASTIC: 0.2,
  WILLIAMS_R: 0.2,
} as const;
```

## 🔌 Integration with Other Type Systems

### Aspis API Types
The technical analysis system integrates with Aspis trading API through:

```typescript
// From src/types/aspis.ts
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

export interface AccountInfo {
  balances: BalanceItem[];
  totalValue: number;
  marginLevel?: number;
}
```

### Binance API Types
Market data integration through:

```typescript
// From src/types/binance.ts
export interface BinanceOHLCV extends Array<number | string> {
  0: number;  // Open time
  1: string;  // Open
  2: string;  // High
  3: string;  // Low
  4: string;  // Close
  5: string;  // Volume
  6: number;  // Close time
  7: string;  // Quote asset volume
  8: number;  // Number of trades
  9: string;  // Taker buy base asset volume
  10: string; // Taker buy quote asset volume
  11: string; // Ignore
}
```

## 🛠️ Usage Examples

### Creating Technical Analysis
```typescript
import { 
  TechnicalAnalysisService,
  type IndicatorData,
  type SignalStrength 
} from '../types/index.js';

const technicalAnalysis = new TechnicalAnalysisService();

// Analyze technical data
const technicalData: IndicatorData = {
  RSI: 65,
  'MACD.macd': 0.5,
  'MACD.signal': 0.3,
  'Stoch.K': 75,
  'Stoch.D': 70,
  BBPower: 0.2,
  close: 50000
};

const signalStrength: SignalStrength = technicalAnalysis.calculateSignalStrength(technicalData);
console.log(`Signal strength: ${signalStrength.strength}`);
```

### Working with API Responses
```typescript
import { 
  type StatsResponse,
  type IndicatorsResponse,
  StatsResponseSchema,
  IndicatorsResponseSchema 
} from '../types/technical-analysis.js';

// Validate API response
const response = await fetch('/api/stats');
const data = await response.json();
const validatedData = StatsResponseSchema.parse(data);

// Use validated data
const rsi = validatedData.data.RSI;
const macd = validatedData.data['MACD.macd'];
```

### Integration with Vault Controller
```typescript
import { 
  VaultController,
  type AccountInfo,
  type ExecuteOrderInput 
} from '../types/index.js';

// Portfolio management with technical analysis
const vaultController = new VaultController(tradingAdapter, marketDataAdapter);

// Get current price for technical analysis
const currentPrice = await vaultController.getCurrentPrice('BTC');

// Calculate position size based on technical signals
const positionSize = await vaultController.calculatePositionSize('BTC', signalStrength);
```

## 🔍 Type Safety Features

### Zod Schema Validation
All external API responses are validated using Zod schemas:

```typescript
import { z } from 'zod';

export const StatsResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    RSI: z.number(),
    "MACD.macd": z.number(),
    // ... other fields
  })
});

// Runtime validation
const validatedData = StatsResponseSchema.parse(apiResponse);
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

- **[Technical Indicators Guide](TECHNICAL_INDICATORS.md)** - Complete guide to technical indicators
- **[News API Types](NEWS_API_TYPES.md)** - News and sentiment analysis types
- **[Aspis API Methods](ASPIS_API_METHODS.md)** - Trading execution API reference
- **[Integration Tests](../src/tests/README.md)** - Testing documentation

## 🔧 Development

### Adding New Indicators
1. Add the indicator to `StatsResponseSchema` in `src/types/technical-analysis.ts`
2. Update the `INDICATOR_THRESHOLDS` constant if needed
3. Add analysis logic to `TechnicalAnalysisService`
4. Update integration tests
5. Update documentation

### Type Migration
When migrating from inline types to dedicated type files:

1. **Create type file**: `src/types/new-domain.ts`
2. **Define Zod schemas**: For runtime validation
3. **Export types**: Using `z.infer<typeof Schema>`
4. **Update imports**: In consuming files
5. **Update index**: Add re-export in `src/types/index.ts`

---

**Built with ❤️ for precise technical analysis**
