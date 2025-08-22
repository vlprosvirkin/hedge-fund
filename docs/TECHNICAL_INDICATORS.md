# Technical Indicators API Integration

## Overview

The Technical Indicators API provides real-time technical analysis for crypto trading. It's integrated with our valuation agent to enhance trading decisions with technical analysis.

## API Endpoint

- **Base URL**: `http://63.176.129.185:8000`
- **Documentation**: [http://63.176.129.185:8000/docs](http://63.176.129.185:8000/docs)

## Available Indicators

### Trend Indicators
- **Moving Averages**: SMA, EMA, WMA
- **MACD**: Moving Average Convergence Divergence
- **Parabolic SAR**: Stop and Reverse
- **ADX**: Average Directional Index

### Momentum Indicators
- **RSI**: Relative Strength Index
- **Stochastic Oscillator**
- **Williams %R**
- **CCI**: Commodity Channel Index

### Volatility Indicators
- **Bollinger Bands**
- **ATR**: Average True Range

### Support & Resistance
- **Pivot Points**
- **Support/Resistance Levels**
- **Fibonacci Retracement**

### Volume Indicators
- **Volume-based analysis**

## Usage Examples

### Basic Usage

```typescript
import { TechnicalIndicatorsAdapter } from './adapters/technical-indicators-adapter.js';

const indicators = new TechnicalIndicatorsAdapter();

// Connect to API
await indicators.connect();

// Get RSI
const rsi = await indicators.getRSI('BTCUSDT', '1h', 14);
console.log('RSI:', rsi.values[0].value);

// Get MACD
const macd = await indicators.getMACD('BTCUSDT', '1h');
console.log('MACD:', macd.values[0].value);

// Get Bollinger Bands
const bb = await indicators.getBollingerBands('BTCUSDT', '1h');
console.log('Bollinger Bands:', bb.values[0].value);
```

### Multiple Indicators

```typescript
// Get multiple indicators at once
const results = await indicators.getMultipleIndicators([
  { symbol: 'BTCUSDT', timeframe: '1h', indicator: 'rsi' },
  { symbol: 'BTCUSDT', timeframe: '1h', indicator: 'macd' },
  { symbol: 'BTCUSDT', timeframe: '1h', indicator: 'stochastic' }
]);

results.forEach(result => {
  console.log(`${result.indicator}:`, result.values[0].value);
});
```

### Signal Strength Analysis

```typescript
// Get comprehensive signal strength
const signal = await indicators.getSignalStrength('BTCUSDT', '1h');

console.log('Signal Strength:', signal.strength); // -1 to 1
console.log('Signals:', signal.signals);

// signal.signals contains:
// [
//   { indicator: 'rsi', value: 65, signal: 'neutral', weight: 0.3 },
//   { indicator: 'macd', value: 0.5, signal: 'bullish', weight: 0.3 },
//   ...
// ]
```

### Overbought/Oversold Detection

```typescript
const rsi = await indicators.getRSI('BTCUSDT', '1h');
const rsiValue = rsi.values[0].value;

if (indicators.isOverbought(rsiValue, 'rsi')) {
  console.log('RSI indicates overbought conditions');
}

if (indicators.isOversold(rsiValue, 'rsi')) {
  console.log('RSI indicates oversold conditions');
}
```

## Integration with Valuation Agent

The Technical Indicators API is automatically integrated with our valuation agent:

```typescript
// The valuation agent now uses real technical analysis
const agents = new AgentsService(openaiKey);

// When the valuation agent runs, it will:
// 1. Get RSI, MACD, Bollinger Bands for each ticker
// 2. Calculate signal strength
// 3. Generate claims based on technical analysis
// 4. Include technical insights in trading decisions
```

## Configuration

Add to your `.env` file:

```env
# Technical Indicators API
TECHNICAL_INDICATORS_URL=http://63.176.129.185:8000
```

## Error Handling

The adapter includes robust error handling:

```typescript
try {
  const rsi = await indicators.getRSI('BTCUSDT', '1h');
} catch (error) {
  console.error('Failed to get RSI:', error.message);
  // Fallback to default values or mock data
}
```

## Performance Considerations

- **Rate Limiting**: The API may have rate limits
- **Caching**: Consider caching indicator values
- **Batch Requests**: Use `getMultipleIndicators()` for efficiency
- **Error Recovery**: Always handle API failures gracefully

## Available Timeframes

- `1m` - 1 minute
- `5m` - 5 minutes
- `15m` - 15 minutes
- `30m` - 30 minutes
- `1h` - 1 hour
- `4h` - 4 hours
- `1d` - 1 day
- `1w` - 1 week

## Indicator Parameters

### RSI
- `period`: Number of periods (default: 14)

### MACD
- `fastPeriod`: Fast EMA period (default: 12)
- `slowPeriod`: Slow EMA period (default: 26)
- `signalPeriod`: Signal line period (default: 9)

### Bollinger Bands
- `period`: Moving average period (default: 20)
- `stdDev`: Standard deviation multiplier (default: 2)

### Stochastic
- `kPeriod`: %K period (default: 14)
- `dPeriod`: %D period (default: 3)

### Moving Average
- `period`: Number of periods (default: 20)
- `type`: 'sma', 'ema', or 'wma' (default: 'sma')

## Example Trading Strategy

```typescript
async function analyzeTicker(symbol: string) {
  const indicators = new TechnicalIndicatorsAdapter();
  await indicators.connect();

  // Get comprehensive analysis
  const [rsi, macd, bb, signal] = await Promise.all([
    indicators.getRSI(symbol, '1h'),
    indicators.getMACD(symbol, '1h'),
    indicators.getBollingerBands(symbol, '1h'),
    indicators.getSignalStrength(symbol, '1h')
  ]);

  const rsiValue = rsi.values[0].value;
  const macdValue = macd.values[0].value;
  const signalStrength = signal.strength;

  // Trading logic
  if (signalStrength > 0.5 && rsiValue < 70) {
    console.log(`${symbol}: Strong bullish signal`);
    // Place buy order
  } else if (signalStrength < -0.5 && rsiValue > 30) {
    console.log(`${symbol}: Strong bearish signal`);
    // Place sell order
  } else {
    console.log(`${symbol}: Neutral signal`);
    // Hold or wait
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if the API server is running
   - Verify the URL is correct
   - Check network connectivity

2. **Invalid Symbol**
   - Ensure symbol format is correct (e.g., 'BTCUSDT')
   - Check if the symbol is supported

3. **Rate Limiting**
   - Implement delays between requests
   - Use batch requests when possible
   - Cache results when appropriate

### Debug Mode

```typescript
// Enable debug logging
const indicators = new TechnicalIndicatorsAdapter();
indicators.setDebugMode(true);
```

## Support

For Technical Indicators API issues:
- Check the API documentation at [http://63.176.129.185:8000/docs](http://63.176.129.185:8000/docs)
- Review the API health endpoint
- Contact the API provider
