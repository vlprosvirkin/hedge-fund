# 📰 News API Types

This document provides comprehensive type definitions for the News and Sentiment Analysis system in the Hedge Fund MVP.

## 📁 File Structure

The news types are organized in the following files:

- **`src/types/news.ts`** - Core news and sentiment analysis types
- **`src/types/index.ts`** - Re-exports and core system types
- **`src/types/telegram.ts`** - Telegram notification types

## 🔧 Core News Types

### API Response Types

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

#### NewsSupportedTokensResponse
```typescript
export interface NewsSupportedTokensResponse {
  primary_assets: Array<{
    text: string;
    callback_data: string;
  }>;
  additional_assets: Array<{
    text: string;
    callback_data: string;
  }>;
  total_count: number;
  primary_count: number;
  additional_count: number;
  timestamp: string;
}
```

### News Item Types

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

## 🔧 Zod Schemas

### NewsItemSchema
```typescript
export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  publishedAt: z.number(),
  sentiment: z.number(),
  description: z.string().optional().or(z.undefined()),
  assets: z.array(z.string()).optional().or(z.undefined()),
});
```

### DigestItemSchema
```typescript
export const DigestItemSchema = z.object({
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
export const DigestResponseSchema = z.object({
  items: z.array(DigestItemSchema),
  count: z.number(),
  timestamp: z.date(),
});
```

## 🔌 Integration with Other Type Systems

### Telegram Notification Types
The news system integrates with Telegram notifications through:

```typescript
// From src/types/telegram.ts
export interface TradingAlert {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  data?: any;
}

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

### Agent Integration Types
News data integrates with the multi-agent system:

```typescript
// From src/types/index.ts
export interface Claim {
  id: string;
  ticker: string;
  agentRole: 'fundamental' | 'sentiment' | 'valuation';
  claim: string;
  confidence: number; // 0 to 1
  evidence: string[]; // Evidence IDs
  timestamp: number;
  riskFlags?: string[];
}
```

## 🛠️ Usage Examples

### Working with News Data
```typescript
import { 
  NewsAnalysisService,
  type NewsItem,
  type DigestItem 
} from '../types/index.js';

const newsAnalysis = new NewsAnalysisService();

// Convert digest items to news items
const digestItems: DigestItem[] = [
  {
    id: '1',
    title: 'Bitcoin reaches new highs',
    description: 'Bitcoin has reached new all-time highs',
    significance: 'High',
    implications: 'Positive for crypto market',
    assets: ['BTC'],
    source: 'test.com',
    url: 'https://test.com/1',
    created_at: new Date(),
    updated_at: new Date()
  }
];

const newsItems: NewsItem[] = newsAnalysis.convertDigestToNewsItems(digestItems);
console.log(`Converted ${newsItems.length} news items`);
```

### Sentiment Analysis
```typescript
import { NewsAnalysisService } from '../services/news-analysis.service.js';

const newsAnalysis = new NewsAnalysisService();

// Calculate sentiment from significance and implications
const sentiment = newsAnalysis.calculateSentiment('High', 'Positive for crypto market');
console.log(`Sentiment score: ${sentiment.toFixed(2)}`);

// Filter news by asset
const btcNews = newsAnalysis.filterNewsByAsset(newsItems, 'BTC');
console.log(`Found ${btcNews.length} BTC-related news items`);
```

### News API Integration
```typescript
import { 
  NewsAPIAdapter,
  type DigestResponse,
  type NewsItem 
} from '../types/index.js';

const newsAdapter = new NewsAPIAdapter();

// Get general news digest
const digest: DigestResponse = await newsAdapter.getDigest();
console.log(`Retrieved ${digest.items.length} news items`);

// Search for specific news
const now = Date.now();
const searchResults: NewsItem[] = await newsAdapter.search('Bitcoin', now - 3600000, now);
console.log(`Found ${searchResults.length} Bitcoin news items`);
```

## 🔍 Type Safety Features

### Strict TypeScript Configuration
The project uses strict TypeScript settings with `exactOptionalPropertyTypes: true`:

```typescript
// This ensures optional properties are explicitly undefined or present
const newsItem: NewsItem = {
  id: '1',
  title: 'Test News',
  url: 'https://test.com',
  source: 'test',
  publishedAt: Date.now(),
  sentiment: 0.5,
  // description and assets are explicitly optional
  description: undefined, // Must be explicitly undefined
  assets: undefined       // Must be explicitly undefined
};
```

### Zod Schema Validation
All external API responses are validated using Zod schemas:

```typescript
import { 
  DigestResponseSchema,
  NewsItemSchema 
} from '../types/news.js';

// Validate API response
const response = await fetch('/api/news/digest');
const data = await response.json();
const validatedDigest = DigestResponseSchema.parse(data);

// Validate individual news items
const validatedNewsItem = NewsItemSchema.parse(newsItemData);
```

## 📊 Sentiment Analysis

### Sentiment Scoring
The system uses a sentiment scoring system from -1 to 1:

- **-1.0 to -0.3**: Bearish sentiment
- **-0.3 to 0.3**: Neutral sentiment  
- **0.3 to 1.0**: Bullish sentiment

### Sentiment Calculation
```typescript
// From NewsAnalysisService
calculateSentiment(significance: string, implications: string): number {
  let score = 0.5; // Base neutral score
  
  // Significance scoring
  if (significance.toLowerCase().includes('high')) score += 0.2;
  if (significance.toLowerCase().includes('low')) score -= 0.2;
  
  // Implications scoring
  if (implications.toLowerCase().includes('positive')) score += 0.3;
  if (implications.toLowerCase().includes('negative')) score -= 0.3;
  
  return Math.max(-1, Math.min(1, score));
}
```

## 🔧 News Processing Features

### Asset Filtering
```typescript
// Filter news by specific assets
const btcNews = newsAnalysis.filterNewsByAsset(newsItems, 'BTC');
const ethNews = newsAnalysis.filterNewsByAsset(newsItems, 'ETH');

// Filter by multiple assets
const cryptoNews = newsAnalysis.filterNewsByAsset(newsItems, ['BTC', 'ETH', 'SOL']);
```

### Time-based Filtering
```typescript
// Calculate time range for news
const oneHourAgo = Date.now() - 3600000;
const oneDayAgo = Date.now() - 86400000;

// Get recent news
const recentNews = newsItems.filter(item => item.publishedAt > oneHourAgo);
const dailyNews = newsItems.filter(item => item.publishedAt > oneDayAgo);
```

### News Merging and Deduplication
```typescript
// Merge news from multiple sources
const mergedNews = newsAnalysis.mergeNewsItems(newsItems1, newsItems2);

// Sort by timestamp
const sortedNews = newsAnalysis.sortNewsByTimestamp(newsItems);

// Calculate average sentiment
const avgSentiment = newsAnalysis.calculateAverageSentiment(newsItems);
```

## 📚 Related Documentation

- **[News API Guide](NEWS_API.md)** - Complete guide to news API integration
- **[Technical Analysis Types](TECHNICAL_ANALYSIS_TYPES.md)** - Technical indicator types
- **[Aspis API Methods](ASPIS_API_METHODS.md)** - Trading execution API reference
- **[Integration Tests](../src/tests/README.md)** - Testing documentation

## 🔧 Development

### Adding New News Sources
1. Add source-specific types to `src/types/news.ts`
2. Create Zod schemas for validation
3. Update `NewsAnalysisService` with processing logic
4. Add integration tests
5. Update documentation

### Type Migration
When migrating from inline types to dedicated type files:

1. **Create type file**: `src/types/news.ts`
2. **Define Zod schemas**: For runtime validation
3. **Export types**: Using `z.infer<typeof Schema>`
4. **Update imports**: In consuming files
5. **Update index**: Add re-export in `src/types/index.ts`

### Error Handling
The news system includes comprehensive error handling:

```typescript
try {
  const digest = await newsAdapter.getDigest();
  // Process digest
} catch (error) {
  if (error instanceof Error) {
    console.error('News API error:', error.message);
    // Handle specific error types
  }
  // Fallback to cached data or throw
}
```

---

**Built with ❤️ for comprehensive news analysis**
