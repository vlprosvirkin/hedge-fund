# Integration Tests

This directory contains integration tests that verify the complete functionality of the hedge fund system.

## Available Tests

1. **Technical Analysis Integration Test** - Tests the technical indicators API and analysis pipeline
2. **News API Integration Test** - Tests the news API and sentiment analysis pipeline

## Technical Analysis Integration Test

**File:** `technical-analysis-integration.ts`

### Purpose

This integration test validates the complete technical analysis pipeline, ensuring that:

1. **API Integration** - Technical indicators API is accessible and returns valid data
2. **Data Quality** - All required indicators and metadata are present and valid
3. **Agent Integration** - Data can be properly formatted for agent consumption
4. **Type Safety** - All data flows maintain proper TypeScript typing
5. **Error Handling** - System gracefully handles various error scenarios

### Test Flow

The test follows this 10-step process:

1. **API Connection** - Establishes connection to technical indicators API
2. **Technical Indicators** - Retrieves and validates RSI, MACD, Stochastic, and other indicators
3. **Asset Metadata** - Gets price, volume, change, and sentiment data
4. **Signal Analysis** - Calculates overall market sentiment from multiple indicators
5. **News Data** - Retrieves relevant news articles for the asset
6. **Comprehensive Analysis** - Combines all data for final recommendation
7. **Agent Claims** - Creates test claims that agents can process
8. **Evidence Creation** - Generates evidence objects for claim validation
9. **Data Quality Validation** - Verifies data completeness and validity
10. **Integration Verification** - Confirms all systems work together

### Running the Test

```bash
# Run the integration test
npm run test:integration

# Or directly with tsx
npx tsx src/tests/technical-analysis-integration.ts
```

### Expected Output

When successful, you should see:

```
🚀 Starting Technical Analysis Integration Test...

✅ Connected to Technical Indicators API

📊 Step 1: Getting technical indicators for BTC...
✅ Technical indicators received successfully
   RSI: 45.23
   MACD: 0.0012
   Stochastic K: 65.4
   Close Price: 43250.50

💰 Step 2: Getting asset metadata...
✅ Asset metadata received successfully
   Price: $43,250.50
   Volume: 1,234,567
   Change %: 2.45%
   Sentiment: 65/100

📈 Step 3: Getting signal strength analysis...
✅ Signal strength analysis completed
   Overall Strength: 0.234
   Number of signals: 4
   - rsi: 45.23 (neutral) - weight: 0.3
   - macd: 0.0012 (bullish) - weight: 0.3
   - stochastic: 65.40 (neutral) - weight: 0.2
   - williams_r: -45.67 (neutral) - weight: 0.2

...

🎉 Technical Analysis Integration Test PASSED!

📊 Summary:
   - Technical indicators: 45 data points
   - Asset metadata: Complete
   - Signal analysis: 4 signals
   - News items: 12 articles
   - Agent claims: 3 generated
   - Data quality: 5/5 checks passed
```

### Error Handling

The test includes comprehensive error handling for:

- **API Connection Failures** - Network issues, authentication problems
- **Data Validation Errors** - Missing or invalid indicators
- **Type Safety Issues** - TypeScript compilation errors
- **Agent Integration Problems** - Data format issues

### Integration with Agents

The test creates sample claims and evidence that demonstrate how technical analysis data flows to the agent system:

```typescript
const testClaims: Claim[] = [
  {
    id: 'test-claim-1',
    ticker: 'BTC',
    agentRole: 'fundamental',
    claim: 'BTC technical analysis shows RSI at 45.23, indicating neutral conditions',
    confidence: 0.234,
    evidence: [],
    timestamp: Date.now(),
    riskFlags: []
  }
  // ... more claims
];
```

This ensures that the technical analysis data is properly formatted for consumption by the fundamental, sentiment, and valuation agents.

### Continuous Integration

This test can be integrated into CI/CD pipelines to ensure that:

- API endpoints remain functional
- Data schemas haven't changed unexpectedly
- Agent integration continues to work
- Type safety is maintained across updates

### Troubleshooting

If the test fails, check:

1. **API Configuration** - Verify API keys and endpoints in `config.ts`
2. **Network Connectivity** - Ensure internet access to external APIs
3. **Data Format Changes** - Check if API response format has changed
4. **Type Definitions** - Verify that types match actual API responses

## News API Integration Test

**File:** `news-integration.ts`

### Purpose

This integration test validates the complete news API pipeline, ensuring that:

1. **API Integration** - News API is accessible and returns valid data
2. **Data Quality** - News articles are properly formatted and contain required fields
3. **Sentiment Analysis** - Sentiment scoring works accurately
4. **Caching System** - News caching functionality works properly
5. **Error Handling** - System gracefully handles various error scenarios

### Test Flow

The test follows this 10-step process:

1. **API Connection** - Establishes connection to news API
2. **Supported Tokens** - Fetches list of supported news assets
3. **General News Digest** - Gets general news feed
4. **News Search** - Tests search functionality with "Bitcoin" query
5. **Asset-Specific News** - Gets news for specific assets (BTC/ETH)
6. **Latest News** - Retrieves most recent news items
7. **Ticker News** - Gets news for multiple tickers
8. **Caching Test** - Verifies caching functionality
9. **Data Quality Validation** - Verifies data integrity and sentiment analysis
10. **Error Handling** - Tests error handling with invalid requests
11. **Integration Verification** - Ensures all components work together

### Running the Test

```bash
# Run the news integration test
npm run test:news

# Or directly with tsx
npx tsx src/tests/news-integration.ts
```

### Expected Output

When successful, you should see:

```
🚀 Starting News API Integration Test...

✅ Connected to News API

🪙 Step 1: Getting supported tokens...
✅ Supported tokens received successfully
   Primary assets: 3
   Additional assets: 167
   Total count: 170
   Primary assets: BTC, ETH, SOL

📰 Step 2: Getting general news digest...
✅ General digest received successfully
   News items: 10
   Total count: 10
   Latest news: Kanye West's YZY Token Launches on Solana with Extreme Volatility...
   Source: Decrypt
   Assets: SOL

🔍 Step 3: Testing news search...
✅ News search completed successfully
   Search results: 5 items
   First result: Kanye West's YZY Token Launches on Solana with Extreme Volatility...
   Sentiment: 0.50
   Published: 8/21/2025, 5:22:21 AM

...

🎉 News API Integration Test PASSED!

📊 Summary:
   - Supported tokens: 170 total
   - General news: 10 items
   - Search results: 5 items
   - Latest news: 5 items
   - Ticker news: 5 items
   - Data quality: 6/6 checks passed
```

### Features Tested

- **News Retrieval** - General digest, asset-specific news, search functionality
- **Sentiment Analysis** - Automatic sentiment scoring based on content analysis
- **Caching System** - In-memory caching with TTL for performance optimization
- **Error Handling** - Graceful fallback to mock data when API is unavailable
- **Data Quality** - Validation of news article structure and content

### Integration with Sentiment Analysis

The test validates that sentiment analysis works correctly:

```typescript
// Sentiment calculation based on significance and implications
const sentiment = calculateSentiment(significance, implications);
// Returns value between 0.0 (negative) and 1.0 (positive)
```

### Troubleshooting

If the news test fails, check:

1. **API Key Configuration** - Verify `NEWS_API_KEY` in `.env` file
2. **Network Connectivity** - Ensure internet access to news API
3. **Rate Limiting** - Check if API rate limits are exceeded
4. **Data Format** - Verify news article structure matches expected schema
