# Technical Analysis Types Documentation

## Overview

This document describes the TypeScript types and Zod schemas for technical analysis functionality in the hedge fund project. All types are defined in `src/types/technical-analysis.ts` and re-exported from `src/types/index.ts`.

## Core Types

### StatsResponse
Response from the `/stats` endpoint containing comprehensive technical indicators.

```typescript
interface StatsResponse {
  status: string;
  data: IndicatorData;
}
```

### IndicatorData
Contains all technical indicators for an asset:

```typescript
interface IndicatorData {
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

  // Other indicators...
  close: number;
}
```

### AssetMetadata
Market data for an asset:

```typescript
interface AssetMetadata {
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  marketCap: number;
  sentiment: number; // 0-100
}
```

### SignalStrength
Analysis of multiple indicators to determine market sentiment:

```typescript
interface SignalStrength {
  strength: number; // -1 to 1 (bearish to bullish)
  signals: Signal[];
}

interface Signal {
  indicator: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  weight: number;
}
```

### ComprehensiveAnalysis
Complete analysis combining technical, fundamental, and sentiment data:

```typescript
interface ComprehensiveAnalysis {
  technical: IndicatorData;
  metadata: AssetMetadata;
  news: TechnicalNewsResult;
  signalStrength: number;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
}
```

## Request Types

### IndicatorRequest
Request for a specific technical indicator:

```typescript
interface IndicatorRequest {
  symbol: string;
  timeframe: string;
  indicator: string;
  parameters?: Record<string, any>;
  limit?: number;
}
```

### BatchIndicatorRequest
Request for multiple indicators:

```typescript
interface BatchIndicatorRequest {
  requests: IndicatorRequest[];
}
```

## Response Types

### IndicatorResponse
Response for a single indicator:

```typescript
interface IndicatorResponse {
  symbol: string;
  indicator: string;
  timeframe: string;
  values: IndicatorValue[];
}

interface IndicatorValue {
  timestamp: number;
  value: number;
  parameters?: Record<string, any>;
}
```

### TechnicalNewsResult
News data from technical analysis API:

```typescript
interface TechnicalNewsResult {
  items: TechnicalNewsItem[];
}

interface TechnicalNewsItem {
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

## API Response Types

### IndicatorsResponse
Response from `/indicators` endpoint:

```typescript
interface IndicatorsResponse {
  lp?: number; // Last price
  volume?: number;
  ch?: number; // Change
  chp?: number; // Change percent
  market_cap_calc?: number;
  sentiment?: number; // 0-100
  symbol?: string;
  timeframe?: string;
  timestamp?: number;
}
```

### SupportedTokensResponse
List of supported tokens:

```typescript
interface SupportedTokensResponse {
  supported_tokens: string[];
}
```

### IndicatorInfo
Information about a specific indicator:

```typescript
interface IndicatorInfo {
  name: string;
  description: string;
  parameters: IndicatorParameter[];
}

interface IndicatorParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
}
```

## Constants

### INDICATOR_THRESHOLDS
Thresholds for overbought/oversold conditions:

```typescript
const INDICATOR_THRESHOLDS = {
  RSI: { overbought: 70, oversold: 30 },
  STOCHASTIC: { overbought: 80, oversold: 20 },
  WILLIAMS_R: { overbought: -20, oversold: -80 },
  CCI: { overbought: 100, oversold: -100 },
} as const;
```

### SIGNAL_WEIGHTS
Weights for signal strength calculation:

```typescript
const SIGNAL_WEIGHTS = {
  RSI: 0.3,
  MACD: 0.3,
  STOCHASTIC: 0.2,
  WILLIAMS_R: 0.2,
} as const;
```

## Usage Examples

### Basic Technical Analysis

```typescript
import { TechnicalIndicatorsAdapter } from '../adapters/technical-indicators-adapter.js';
import type { IndicatorData, SignalStrength } from '../types/index.js';

const adapter = new TechnicalIndicatorsAdapter();
await adapter.connect();

// Get technical indicators
const technicalData: IndicatorData = await adapter.getTechnicalIndicators('BTC', '1D');
console.log('RSI:', technicalData.RSI);

// Get signal strength
const signalStrength: SignalStrength = await adapter.getSignalStrength('BTCUSD', '1D');
console.log('Market sentiment:', signalStrength.strength);
```

### Integration Testing

Run the integration test to verify the complete technical analysis pipeline:

```bash
npm run test:integration
```

This test validates:
- API connectivity and data retrieval
- Data quality and completeness
- Agent data interpretation
- Type safety throughout the pipeline
- Error handling and edge cases

### Comprehensive Analysis

```typescript
import type { ComprehensiveAnalysis } from '../types/index.js';

const analysis: ComprehensiveAnalysis = await adapter.getComprehensiveAnalysis('BTC', '1D');
console.log('Recommendation:', analysis.recommendation);
console.log('Signal Strength:', analysis.signalStrength);
```

### Batch Requests

```typescript
import type { IndicatorRequest } from '../types/index.js';

const requests: IndicatorRequest[] = [
  { symbol: 'BTCUSD', timeframe: '1D', indicator: 'rsi' },
  { symbol: 'BTCUSD', timeframe: '1D', indicator: 'macd' },
  { symbol: 'BTCUSD', timeframe: '1D', indicator: 'stochastic' }
];

const results = await adapter.getMultipleIndicators(requests);
```

## Validation

All types are validated using Zod schemas. You can validate API responses:

```typescript
import { StatsResponseSchema } from '../types/technical-analysis.js';

const response = await fetch('/api/stats');
const data = await response.json();
const validatedData = StatsResponseSchema.parse(data);
```

## Error Handling

The adapter includes comprehensive error handling for various scenarios:

- Asset not supported (500 error)
- Network timeouts
- Invalid responses
- API rate limits

All errors are wrapped with descriptive messages for easier debugging.
