# News API Integration

## Overview

The News API provides crypto-focused news digest and sentiment analysis. It's integrated with our sentiment agent to enhance trading decisions with real-time news analysis.

## API Endpoint

- **Base URL**: `http://3.79.47.238:4500`
- **Documentation**: [http://3.79.47.238:4500/docs](http://3.79.47.238:4500/docs)

## Available Endpoints

### Core Endpoints
- **GET /digest** - Get general news digest
- **GET /digest/{asset}/{limit}** - Get news digest for specific asset
- **GET /supported-tokens/eliza** - Get list of supported tokens/assets

## Usage Examples

### Basic Usage

```typescript
import { NewsAPIAdapter } from './adapters/news-adapter.js';

const newsApi = new NewsAPIAdapter();

// Connect to API
await newsApi.connect();

// Get general news digest
const digest = await newsApi.getDigest();
console.log('Latest news:', digest.items.length);

// Get news for specific asset
const btcNews = await newsApi.getDigestByAsset('BTC', 5);
console.log('BTC news:', btcNews.items);

// Get supported tokens
const tokens = await newsApi.getSupportedTokens();
console.log('Supported assets:', tokens.total_count);
```

### News Adapter Interface

The News API adapter implements the standard `NewsAdapter` interface:

```typescript
// Search for news by query
const searchResults = await newsApi.search('bitcoin institutional adoption', 10);

// Get latest news
const latestNews = await newsApi.getLatest(20);

// Get news for specific crypto tickers
const tickerNews = await newsApi.getNewsByTickers(['BTCUSDT', 'ETHUSDT'], 15);
```

### Integration with Sentiment Agent

```typescript
// The sentiment agent automatically uses the News API
const agents = new AgentsService();

// When the sentiment agent runs, it will:
// 1. Fetch latest news digest
// 2. Analyze sentiment from significance and implications
// 3. Generate claims based on news sentiment
// 4. Include news-based insights in trading decisions
```

## Data Structures

### DigestItem

```typescript
interface DigestItem {
  id: string;
  title: string;
  description: string;
  significance: string;        // Key significance of the news
  implications: string;        // Market implications
  assets: string[];           // Related crypto assets
  source: string;             // News source
  url: string;                // Original article URL
  created_at: Date;
  updated_at: Date;
}
```

### DigestResponse

```typescript
interface DigestResponse {
  items: DigestItem[];
  count: number;
  timestamp: Date;
}
```

### NewsItem (Adapter Interface)

```typescript
interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number;        // Unix timestamp
  sentiment: number;          // Calculated sentiment score (0-1)
  description?: string;
  assets?: string[];
}
```

## Configuration

Add to your `.env` file:

```env
# News API
NEWS_API_URL=http://3.79.47.238:4500
NEWS_API_KEY=your_news_api_key_here
NEWS_API_TIMEOUT=30000
NEWS_SOURCES=coindesk,cointelegraph,bitcoin.com,decrypt.co
```

## Features

### Intelligent Caching
- **Digest Cache**: 5 minutes TTL
- **Supported Tokens Cache**: 1 hour TTL
- **Memory-based caching** with automatic expiration

### Sentiment Analysis
- **Keyword-based sentiment** calculation
- **Significance + Implications** analysis
- **Bullish/Bearish indicators** detection
- **Numerical sentiment scores** (0.0 - 1.0)

### Asset Recognition
- **170+ supported crypto assets**
- **Ticker conversion** (BTCUSDT → BTC)
- **Multi-asset news** filtering
- **Primary vs additional assets** classification

### Error Handling
- **Graceful fallbacks** to mock data
- **Connection retry logic**
- **Comprehensive error logging**
- **API timeout handling**

## Supported Assets

### Primary Assets (Most Important)
- **BTC** (Bitcoin)
- **ETH** (Ethereum) 
- **SOL** (Solana)

### Additional Assets (170+ tokens)
Including: ADA, DOT, LINK, MATIC, AVAX, UNI, AAVE, DOGE, XRP, LTC, and many more...

## Advanced Usage

### Custom Sentiment Analysis

```typescript
const newsApi = new NewsAPIAdapter();

// Get news with custom sentiment analysis
const digest = await newsApi.getDigestByAsset('BTC', 10);

digest.items.forEach(item => {
  const sentiment = calculateCustomSentiment(item.significance, item.implications);
  console.log(`${item.title}: ${sentiment > 0.6 ? 'Bullish' : sentiment < 0.4 ? 'Bearish' : 'Neutral'}`);
});
```

### Multi-Asset News Monitoring

```typescript
const watchlist = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
const allNews = [];

for (const asset of watchlist) {
  const assetNews = await newsApi.getDigestByAsset(asset, 3);
  allNews.push(...assetNews.items);
}

// Sort by timestamp and get most recent
const recentNews = allNews
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 10);
```

### News-Based Trading Signals

```typescript
async function getNewsSignals(assets: string[]) {
  const signals = [];
  
  for (const asset of assets) {
    const news = await newsApi.getDigestByAsset(asset, 5);
    
    let bullishCount = 0;
    let bearishCount = 0;
    
    news.items.forEach(item => {
      const sentiment = calculateSentiment(item.significance, item.implications);
      if (sentiment > 0.6) bullishCount++;
      if (sentiment < 0.4) bearishCount++;
    });
    
    const signal = bullishCount > bearishCount ? 'BUY' : 
                  bearishCount > bullishCount ? 'SELL' : 'HOLD';
    
    signals.push({ asset, signal, confidence: Math.abs(bullishCount - bearishCount) / 5 });
  }
  
  return signals;
}
```

## Performance Considerations

- **Rate Limiting**: API may have rate limits
- **Caching Strategy**: Implemented with TTL-based expiration
- **Batch Processing**: Process multiple assets efficiently
- **Error Recovery**: Fallback to mock data when API fails

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if API server is running at `http://3.79.47.238:4500`
   - Verify network connectivity
   - Check API key if authentication is required

2. **Empty Results**
   - Verify asset symbol format (use 'BTC' not 'BTCUSDT')
   - Check if asset is in supported tokens list
   - Increase limit parameter

3. **Slow Response**
   - Check timeout configuration
   - Verify cache is working properly
   - Consider reducing request frequency

### Debug Mode

```typescript
// Enable detailed logging
const newsApi = new NewsAPIAdapter();

// Check connection status
console.log('Connected:', newsApi.isConnected());

// Verify supported tokens
const tokens = await newsApi.getSupportedTokens();
console.log('API supports', tokens.total_count, 'tokens');
```

## Mock Data Fallback

When the API is unavailable, the adapter automatically falls back to mock data:

```typescript
// Mock data includes:
// - Bitcoin institutional adoption news
// - Ethereum network upgrade news
// - Proper sentiment scores
// - Realistic timestamps
```

## Integration with Trading Pipeline

The News API is automatically integrated into the trading pipeline:

1. **News Ingestion**: Latest digest fetched every trading round
2. **Sentiment Analysis**: News items analyzed for market sentiment
3. **Evidence Generation**: News converted to evidence for agents
4. **Claim Generation**: Sentiment agent uses news to generate trading claims
5. **Consensus Building**: News-based claims weighted in final decisions

## Support

For News API issues:
- Check API documentation at [http://3.79.47.238:4500/docs](http://3.79.47.238:4500/docs)
- Verify API endpoint availability
- Contact API provider for authentication issues
- Use mock mode for development/testing
