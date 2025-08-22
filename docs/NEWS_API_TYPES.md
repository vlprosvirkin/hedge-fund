# News API Types Documentation

This document describes the TypeScript types and Zod schemas used for the News API integration.

## Overview

The News API types are defined in `src/types/news.ts` and provide type safety for:
- News article data structures
- API response formats
- Sentiment analysis results
- Caching mechanisms

## Core Types

### DigestItem

Represents a single news article in the digest format.

```typescript
interface DigestItem {
  id: string;                    // Unique article identifier
  title: string;                 // Article headline
  description: string;           // Article summary
  significance: string;          // Market significance description
  implications: string;          // Trading implications
  assets: string[];             // Related cryptocurrency assets
  source: string;               // News source (e.g., "CoinDesk")
  url: string;                  // Article URL
  created_at: Date;             // Publication timestamp
  updated_at: Date;             // Last update timestamp
}
```

### DigestResponse

Container for multiple news articles.

```typescript
interface DigestResponse {
  items: DigestItem[];          // Array of news articles
  count: number;                // Total number of articles
  timestamp: Date;              // Response timestamp
}
```

### NewsItem

Simplified news item format for internal use.

```typescript
interface NewsItem {
  id: string;                   // Unique identifier
  title: string;                // Article title
  url: string;                  // Article URL
  source: string;               // News source
  publishedAt: number;          // Unix timestamp
  sentiment: number;            // Sentiment score (0.0 - 1.0)
  description?: string;         // Optional description
  assets?: string[];            // Optional related assets
}
```

### NewsSupportedTokensResponse

Response from the supported tokens endpoint.

```typescript
interface NewsSupportedTokensResponse {
  primary_assets: Array<{       // Main cryptocurrency assets
    text: string;               // Asset symbol (e.g., "BTC")
    callback_data: string;      // Internal callback identifier
  }>;
  additional_assets: Array<{    // Secondary cryptocurrency assets
    text: string;               // Asset symbol
    callback_data: string;      // Internal callback identifier
  }>;
  total_count: number;          // Total number of supported assets
  primary_count: number;        // Number of primary assets
  additional_count: number;     // Number of additional assets
  timestamp: string;            // Response timestamp
}
```

## Zod Schemas

### DigestItemSchema

```typescript
const DigestItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  significance: z.string(),
  implications: z.string(),
  assets: z.array(z.string()),
  source: z.string(),
  url: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});
```

### DigestResponseSchema

```typescript
const DigestResponseSchema = z.object({
  items: z.array(DigestItemSchema),
  count: z.number(),
  timestamp: z.date(),
});
```

### NewsItemSchema

```typescript
const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  publishedAt: z.number(),
  sentiment: z.number(),
  description: z.string().optional(),
  assets: z.array(z.string()).optional(),
});
```

### NewsSupportedTokensResponseSchema

```typescript
const NewsSupportedTokensResponseSchema = z.object({
  primary_assets: z.array(z.object({
    text: z.string(),
    callback_data: z.string(),
  })),
  additional_assets: z.array(z.object({
    text: z.string(),
    callback_data: z.string(),
  })),
  total_count: z.number(),
  primary_count: z.number(),
  additional_count: z.number(),
  timestamp: z.string(),
});
```

## Usage Examples

### Fetching News Digest

```typescript
import { NewsAPIAdapter } from '../adapters/news-adapter.js';
import type { DigestResponse } from '../types/index.js';

const adapter = new NewsAPIAdapter();
await adapter.connect();

const digest: DigestResponse = await adapter.getDigest();
console.log(`Found ${digest.count} news articles`);
```

### Getting Asset-Specific News

```typescript
import type { NewsItem } from '../types/index.js';

const btcNews: NewsItem[] = await adapter.search('Bitcoin', 10);
btcNews.forEach(news => {
  console.log(`${news.title} - Sentiment: ${news.sentiment}`);
});
```

### Working with Supported Tokens

```typescript
import type { NewsSupportedTokensResponse } from '../types/index.js';

const tokens: NewsSupportedTokensResponse = await adapter.getSupportedTokens();
console.log(`Supported assets: ${tokens.total_count}`);
console.log(`Primary: ${tokens.primary_assets.map(a => a.text).join(', ')}`);
```

## Sentiment Analysis

The News API includes automatic sentiment analysis that returns scores between 0.0 and 1.0:

- **0.0 - 0.3**: Negative sentiment
- **0.3 - 0.7**: Neutral sentiment  
- **0.7 - 1.0**: Positive sentiment

Sentiment is calculated based on keywords in the article's significance and implications fields.

## Caching

The News API adapter implements in-memory caching with configurable TTL:

- **Digest data**: 5 minutes cache
- **Supported tokens**: 1 hour cache
- **Asset-specific news**: 5 minutes cache

## Error Handling

All API calls include fallback mechanisms:

1. **Network errors**: Return mock data
2. **Authentication errors**: Use fallback token lists
3. **Rate limiting**: Implement exponential backoff
4. **Invalid responses**: Validate with Zod schemas

## Integration with Other Systems

### Technical Analysis Integration

News data is integrated with technical analysis to provide comprehensive market insights:

```typescript
const comprehensiveAnalysis = {
  technical: technicalData,
  metadata: assetMetadata,
  news: newsResults,           // NewsItem[] from News API
  signalStrength: sentimentScore,
  recommendation: 'BUY' | 'HOLD' | 'SELL'
};
```

### Agent System Integration

News data flows to the agent system for sentiment analysis:

```typescript
const sentimentClaim: Claim = {
  id: 'sentiment-claim-1',
  ticker: 'BTC',
  agentRole: 'sentiment',
  claim: `News sentiment for BTC is ${averageSentiment}`,
  confidence: averageSentiment,
  evidence: newsArticles.map(article => ({
    type: 'news_article',
    source: article.source,
    content: article.title,
    sentiment: article.sentiment
  })),
  timestamp: Date.now(),
  riskFlags: []
};
```

## Type Safety Benefits

1. **Compile-time validation** of API responses
2. **IntelliSense support** for all news-related operations
3. **Runtime validation** with Zod schemas
4. **Consistent data structures** across the application
5. **Easy refactoring** when API changes occur

## Best Practices

1. **Always use typed imports** from `../types/index.js`
2. **Validate API responses** with Zod schemas
3. **Handle optional fields** appropriately
4. **Use sentiment scores** for quantitative analysis
5. **Implement proper error handling** with fallbacks
