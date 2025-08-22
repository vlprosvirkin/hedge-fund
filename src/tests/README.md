# Integration Tests

This directory contains integration tests that verify the complete functionality of the hedge fund system.

## Available Tests

1. **Technical Analysis Integration Test** - Tests the technical indicators API and analysis pipeline
2. **News API Integration Test** - Tests the news API and sentiment analysis pipeline
3. **Services Integration Test** - Tests the services layer and data interpretation capabilities

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

## Services Integration Test

**File:** `services-integration.ts`

### Purpose

This integration test validates the complete services layer, ensuring that:

1. **Data Interpretation** - Services can properly interpret data from all adapters
2. **Agent Functionality** - All agent roles (fundamental, sentiment, valuation) work correctly
3. **Consensus Building** - Consensus service can process claims and build recommendations
4. **Verification System** - Verifier service can validate claims and evidence
5. **Type Safety** - All data flows maintain proper TypeScript typing throughout the pipeline

### Test Flow

The test follows this 10-step process:

1. **API Connections** - Establishes connections to all APIs and services
2. **Data Fetching** - Retrieves data from technical indicators and news adapters
3. **Technical Analysis** - Gets comprehensive technical analysis data
4. **News Data** - Retrieves news articles and sentiment analysis
5. **Test Data Preparation** - Prepares universe, market stats, and evidence for services
6. **Agent Testing** - Tests all three agent roles (fundamental, sentiment, valuation)
7. **Consensus Building** - Tests consensus service with generated claims
8. **Verification** - Tests verifier service with claims and evidence
9. **Data Quality Validation** - Verifies data completeness and validity
10. **Integration Verification** - Confirms all services work together

### Running the Test

```bash
# Run the services integration test
npm run test:services

# Or directly with tsx
npx tsx src/tests/services-integration.ts
```

### Expected Output

When successful, you should see:

```
🚀 Starting Services Integration Test...

🔌 Step 1: Connecting to APIs...
✅ All services connected successfully

📊 Step 2: Fetching data from adapters...
✅ Technical tokens: 58 supported
✅ News tokens: 170 supported
🎯 Using test asset: BTC

📈 Step 3: Getting technical analysis data...
✅ Technical data retrieved successfully
   RSI: 40.21
   MACD: -605.7065
   Price: $112386.90
   Volume: 10,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000
   Signal Strength: 0.10

📰 Step 4: Getting news data...
✅ News data retrieved successfully: 5 articles
   Average sentiment: 0.80
   Sample title: Hong Kong's Ming Shing Enters Agreement to Purchase 4,250 BT...

🤖 Step 6: Testing AgentsService...
   Testing fundamental agent...
   ✅ fundamental agent generated 3 claims
   Sample claim: Strong on-chain metrics for BTC with increasing active addresses...
   Confidence: 0.89
   Testing sentiment agent...
   ✅ sentiment agent generated 3 claims
   Sample claim: News sentiment score improving for BTC in last 24h...
   Confidence: 0.75
   Testing valuation agent...
   ✅ valuation agent generated 3 claims
   Sample claim: RSI at 41.6 indicates neutral conditions for BTC...
   Confidence: 0.96

🎯 Step 7: Testing ConsensusService...
✅ Consensus built successfully: 3 recommendations
   Top recommendation: ETH
   Final score: 0.895
   Average confidence: 0.928
   Coverage: 1.00
   Liquidity: 0.913
   Conflicts detected: 0
   Risk-adjusted recommendations: 3

🔍 Step 8: Testing VerifierService...
✅ Verification completed:
   Verified claims: 0
   Rejected claims: 9
   Violations: 11
   Evidence relevance valid: true
   Evidence freshness valid: false

🎉 Services Integration Test PASSED!

📊 Summary:
   - Technical data: Available
   - News data: 5 articles
   - Agent claims: 9 generated
   - Data quality: 6/6 checks passed
   - Integration: 4/4 checks passed
```

### Key Features Tested

- **Multi-Agent System** - All three agent roles generate claims with proper confidence scores
- **Technical Integration** - Valuation agent uses real technical analysis data
- **News Integration** - Sentiment agent processes news sentiment data
- **Consensus Algorithm** - Builds recommendations based on agent claims and market stats
- **Conflict Detection** - Identifies conflicting recommendations across agents
- **Risk Adjustments** - Applies different risk profiles to recommendations
- **Claim Verification** - Validates claims against evidence and time constraints
- **Evidence Validation** - Checks evidence relevance and freshness

### Service Architecture

The test validates the complete service architecture:

```
Adapters → Services → Integration
├── TechnicalIndicatorsAdapter → AgentsService → ConsensusService
├── NewsAPIAdapter → VerifierService
└── Data Flow: Raw Data → Claims → Consensus → Verification
```

This ensures that the entire pipeline from data ingestion to final recommendations works correctly.

## Running All Tests

To run all integration tests:

```bash
# Run all tests sequentially
npm run test:integration
npm run test:news
npm run test:services

# Or run them in parallel (if you have multiple terminals)
npm run test:integration & npm run test:news & npm run test:services
```

## Troubleshooting

### Common Issues

1. **API Connection Failures**
   - Check API keys in `.env` file
   - Verify network connectivity
   - Ensure API endpoints are accessible

2. **Data Validation Errors**
   - Check if API response format has changed
   - Verify TypeScript types match actual data
   - Ensure all required fields are present

3. **Service Integration Issues**
   - Check that all services are properly initialized
   - Verify data flow between adapters and services
   - Ensure proper error handling is in place

### Debug Mode

To run tests with more verbose output, you can modify the test files to include additional logging or run with Node.js debug flags:

```bash
# Run with debug logging
DEBUG=* npm run test:services

# Run with additional console output
NODE_ENV=development npm run test:services
```

## Continuous Integration

These integration tests are designed to be run in CI/CD pipelines to ensure:

- API endpoints remain functional
- Data schemas haven't changed unexpectedly
- Service integration continues to work
- Type safety is maintained across updates
- Error handling works correctly

The tests provide comprehensive coverage of the hedge fund system's core functionality and can be used to validate deployments and catch regressions early.
