# Technical Analysis Service

## Overview

The `TechnicalAnalysisService` processes raw technical indicator data from the Signals API and provides comprehensive technical analysis for trading decisions.

## Key Features

### 1. Raw Data Processing
- **No Normalization**: Technical indicators are processed in their raw form without artificial normalization
- **Data Validation**: Only validates for invalid values (NaN, Infinity) but preserves original scale
- **Real Market Values**: Maintains actual market values for accurate analysis

### 2. Supported Indicators

#### Core Indicators
- **RSI (Relative Strength Index)**: 0-100 scale, overbought/oversold levels
- **MACD**: Raw values (can be hundreds/thousands), positive/negative signals
- **Stochastic**: 0-100 scale, momentum oscillator
- **Williams %R**: -100 to 0 scale, overbought/oversold
- **ADX (Average Directional Index)**: 0-100 scale, trend strength
- **CCI (Commodity Channel Index)**: Raw values, momentum indicator

#### Moving Averages
- **SMA20/50**: Simple Moving Averages
- **EMA20/50**: Exponential Moving Averages
- **HullMA9**: Hull Moving Average

#### Advanced Indicators
- **Bollinger Bands (BBPower)**: Raw values, price position relative to bands
- **Awesome Oscillator (AO)**: Raw values, momentum indicator
- **Ichimoku**: Raw values, trend and momentum

### 3. Signal Generation Logic

#### RSI Analysis
```typescript
// Overbought: > 70, Oversold: < 30
if (rsi > 70) signal = 'bearish';
else if (rsi < 30) signal = 'bullish';
```

#### MACD Analysis
```typescript
// Simple positive/negative signal
const signal = macdValue > 0 ? 'bullish' : 'bearish';
```

#### Bollinger Bands Analysis
```typescript
// BBPower > 1: Price above upper band (overbought)
// BBPower < 0: Price below lower band (oversold)
if (bbValue > 1) signal = 'bearish';
else if (bbValue < 0) signal = 'bullish';
```

#### ADX Trend Analysis
```typescript
// ADX > 25 indicates strong trend
if (adxValue > 25) {
  const diPlus = indicatorData['ADX+DI'] || 0;
  const diMinus = indicatorData['ADX-DI'] || 0;
  signal = diPlus > diMinus ? 'bullish' : 'bearish';
}
```

### 4. Signal Weights

```typescript
const SIGNAL_WEIGHTS = {
  RSI: 0.20,
  MACD: 0.25,
  STOCHASTIC: 0.15,
  WILLIAMS_R: 0.10,
  ADX: 0.15,
  BOLLINGER_BANDS: 0.15
};
```

### 5. Data Flow

1. **Raw Data Retrieval**: Get technical indicators from Signals API
2. **Data Validation**: Check for invalid values (NaN, Infinity)
3. **Signal Calculation**: Apply technical analysis logic to each indicator
4. **Weighted Aggregation**: Combine signals using predefined weights
5. **Final Score**: Generate overall technical score (-1 to 1)

### 6. Example Output

```typescript
{
  strength: 0.15, // Overall technical score
  signals: [
    {
      indicator: 'rsi',
      value: 38.61, // Raw RSI value
      signal: 'neutral',
      weight: 0.20
    },
    {
      indicator: 'macd',
      value: -394.2, // Raw MACD value
      signal: 'bearish',
      weight: 0.25
    },
    {
      indicator: 'bollinger_bands',
      value: -2955.5, // Raw BBPower value
      signal: 'bullish',
      weight: 0.15
    }
  ]
}
```

### 7. Integration with Agents

The service is used by the `TechnicalAnalysisAgent` to:
- Process raw technical data
- Generate trading signals
- Provide confidence scores
- Create comprehensive analysis summaries

### 8. Recent Improvements

#### Data Processing
- **Removed Artificial Normalization**: Values are now processed in their natural scale
- **Improved Validation**: Better handling of edge cases and invalid data
- **Real Market Values**: Preserves actual market conditions for accurate analysis

#### Signal Logic
- **Enhanced MACD Analysis**: Uses raw values for more accurate signals
- **Improved Bollinger Bands**: Better interpretation of BBPower values
- **Refined ADX Logic**: More sophisticated trend strength analysis

#### Risk Assessment
- **Better Risk Flags**: More accurate identification of technical risks
- **Improved Confidence**: More reliable confidence scoring
- **Enhanced Signal Strength**: Better weighted aggregation of indicators

#### Confidence Scoring Improvements
- **Higher Minimum Confidence**: 50% minimum (was lower)
- **RSI Bonus**: +15% confidence for extreme RSI values (<30 or >70)
- **MACD Bonus**: +10% confidence for strong MACD signals (>100 absolute)
- **Volatility Bonus**: +10% confidence for high volatility (>0.5)
- **Multiple Indicators Bonus**: +15% confidence for 3+ aligned indicators
- **Signal Strength Bonus**: +10% confidence for strong signals (>0.3 absolute)
- **Expected Results**: 50-90% confidence instead of 50%

## Usage

```typescript
import { TechnicalAnalysisService } from '../services/technical-analysis.service.js';

const technicalService = new TechnicalAnalysisService();
const analysis = await technicalService.getTechnicalDataForAsset('BTC', '4h');

// Get signal strength
const signalStrength = technicalService.calculateSignalStrength(analysis.technical);

// Get technical summary
const summary = technicalService.getTechnicalSummary(analysis.technical);
```

## Configuration

The service uses predefined thresholds and weights that can be adjusted in:
- `src/types/index.ts` - Indicator thresholds
- `src/services/technical-analysis.service.ts` - Signal weights and logic

## Monitoring

Key metrics to monitor:
- Signal strength distribution
- Indicator value ranges
- Confidence score accuracy
- Processing time performance
