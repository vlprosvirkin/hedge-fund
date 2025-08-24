# 🧪 Integration Testing Guide

This document provides comprehensive information about the testing infrastructure for the Hedge Fund MVP system.

## 📋 Test Overview

The system includes two types of tests:

1. **CI/CD Tests** - Run without external API dependencies
2. **Full Integration Tests** - Require API keys and test real external services

## 🚀 Quick Start

### Running Tests

```bash
# Run CI tests (no API keys required)
npm test

# Run full test suite (requires API keys)
npm run test:all

# Run individual tests
npm run test:technical-analysis
npm run test:news
npm run test:services
npm run test:decision
npm run test:telegram
npm run test:database

# Run with test script (smart API key detection)
./scripts/run-tests.sh
```

## 🔧 CI/CD Tests

### Purpose
CI/CD tests verify core functionality without requiring external API access. They are designed to run in automated environments like GitHub Actions.

### What They Test
- ✅ **Core Services**: TechnicalAnalysisService, NewsAnalysisService, ConsensusService
- ✅ **Type System**: All type imports and instantiation
- ✅ **Module Imports**: All services and adapters can be imported
- ✅ **Basic Functionality**: Core business logic without external dependencies

### Running CI Tests
```bash
npm test
# or
npm run test:ci
```

### Example Output
```
🚀 Starting CI/CD Integration Tests
====================================
These tests verify core functionality without external API dependencies

📝 Testing Basic Imports (CI Mode)
==================================
🔍 Testing module imports...
✅ All service imports successful
✅ All adapter imports successful
✅ Types import successful
🎉 All Basic Imports tests passed!

🧪 Testing Core Services (CI Mode)
===================================
📈 Testing Technical Analysis Service...
✅ Technical Analysis Service tests passed
   RSI overbought (75): true
   RSI oversold (25): true

📰 Testing News Analysis Service...
✅ News Analysis Service tests passed
   Calculated sentiment: 0.75

🎯 Testing Consensus Service...
✅ Consensus Service tests passed
   Consensus recommendations: 1

🎉 All Core Services tests passed!

🎉 All CI/CD Integration Tests Passed!
✅ Core functionality is working correctly
✅ All modules can be imported
✅ Services can be instantiated
```

## 🔌 Full Integration Tests

### Purpose
Full integration tests validate the complete system with real external APIs. They require API keys and test actual data flows.

### Required Environment Variables
```bash
# Technical Indicators API
TECHNICAL_INDICATORS_API_KEY=your_key_here

# News API
NEWS_API_KEY=your_key_here

# Binance API
BINANCE_API_KEY=your_key_here
BINANCE_SECRET_KEY=your_secret_here

# Aspis Trading API
ASPIS_API_KEY=your_key_here
ASPIS_VAULT_ADDRESS=your_vault_address

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id

# PostgreSQL Database
DATABASE_URL=postgresql://user:password@localhost:5432/hedge_fund
```

### Available Tests

#### 1. Technical Analysis Integration Test
**File**: `src/tests/technical-analysis-integration.ts`

Tests the complete technical analysis pipeline:
- ✅ 45+ technical indicators (RSI, MACD, Stochastic, Bollinger Bands, etc.)
- ✅ Real-time price data via `/prices` endpoint
- ✅ Unified data fetching via `/all-data` endpoint
- ✅ Signal strength analysis and trading recommendations
- ✅ Asset metadata and market sentiment scoring
- ✅ Supported timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w

**Run**: `npm run test:technical-analysis`

#### 2. News API Integration Test
**File**: `src/tests/news-integration.ts`

Tests the complete news and sentiment analysis pipeline:
- ✅ News ingestion from 170+ crypto assets
- ✅ Real-time sentiment analysis (0.0-1.0 scoring)
- ✅ News digest and asset-specific filtering
- ✅ Time-lock validation for anti-leak protection
- ✅ Intelligent caching and fallback mechanisms

**Run**: `npm run test:news`

#### 3. Services Integration Test
**File**: `src/tests/services-integration.ts`

Tests the multi-agent system and consensus building:
- ✅ All three agents (Fundamental, Sentiment, Valuation) with real data
- ✅ Consensus building and conflict resolution
- ✅ Claim verification and risk assessment
- ✅ Agent claim generation with evidence-based analysis

**Run**: `npm run test:services`

#### 4. Decision Execution Integration Test
**File**: `src/tests/decision-execution-integration.ts`

Tests the complete trading pipeline:
- ✅ Complete pipeline: Agents → Consensus → Risk → Execution
- ✅ Order placement through AspisAdapter
- ✅ Portfolio rebalancing and position tracking
- ✅ Real trading execution with Aspis infrastructure

**Run**: `npm run test:decision`

#### 5. Telegram Integration Test
**File**: `src/tests/telegram-integration.ts`

Tests the transparency and monitoring system:
- ✅ Real-time Telegram notifications
- ✅ Complete process transparency
- ✅ Agent analysis reports with confidence scores
- ✅ Risk assessment and violation alerts

**Run**: `npm run test:telegram`

#### 6. Database Integration Test
**File**: `src/tests/database-integration.ts`

Tests the data storage and analytics system:
- ✅ PostgreSQL database with ACID transactions
- ✅ Complete audit trail for all trading decisions
- ✅ News, evidence, claims, and consensus storage
- ✅ Round tracking and performance analytics

**Run**: `npm run test:database`

## 🛠️ Test Scripts

### Main Test Runner
**File**: `scripts/run-tests.sh`

A smart test runner that detects API keys and runs appropriate tests:

```bash
# Run with smart API key detection
./scripts/run-tests.sh

# Run with verbose output
./scripts/run-tests.sh --verbose

# Show help
./scripts/run-tests.sh --help
```

**Features**:
- ✅ Automatically detects API keys in environment
- ✅ Runs CI tests if no API keys are available
- ✅ Runs full integration tests if API keys are present
- ✅ Colored output and progress tracking
- ✅ Comprehensive test summary

### Package.json Scripts
```json
{
  "test": "tsx src/tests/ci-integration.ts",
  "test:technical-analysis": "tsx src/tests/technical-analysis-integration.ts",
  "test:news": "tsx src/tests/news-integration.ts",
  "test:services": "tsx src/tests/services-integration.ts",
  "test:decision": "tsx src/tests/decision-execution-integration.ts",
  "test:telegram": "tsx src/tests/telegram-integration.ts",
  "test:database": "tsx src/tests/database-integration.ts",
  "test:all": "./scripts/run-tests.sh"
}
```

## 📊 Test Coverage

### API Integration Coverage
- **Technical Indicators API**: 45+ indicators, price data, metadata
- **News API**: 170+ assets, sentiment analysis, caching
- **Binance API**: Market data, order books, real-time feeds
- **Aspis API**: Order execution, position tracking, portfolio management
- **Telegram API**: Notifications, transparency, monitoring
- **PostgreSQL**: Data storage, audit trail, analytics

### Data Flow Coverage
- **Data Ingestion**: Market data, news, technical indicators
- **Agent Processing**: Fundamental, sentiment, valuation analysis
- **Consensus Building**: Multi-agent claim aggregation
- **Risk Management**: Position limits, drawdown protection
- **Order Execution**: Portfolio rebalancing, order placement
- **Monitoring**: Real-time notifications, performance tracking

### Error Handling Coverage
- **API Failures**: Graceful handling of external API errors
- **Network Issues**: Retry logic and fallback mechanisms
- **Data Validation**: Zod schema validation for all external data
- **Type Safety**: Strict TypeScript checking with `exactOptionalPropertyTypes: true`

## 🔍 Debugging Tests

### Common Issues

#### 1. API Key Errors
```
Error: Failed to fetch digest: Request failed with status code 401
```
**Solution**: Ensure all required API keys are set in environment variables.

#### 2. Network Timeouts
```
Error: Request timeout after 30000ms
```
**Solution**: Check network connectivity and API endpoint availability.

#### 3. Type Errors
```
Type 'undefined' is not assignable to type 'string'
```
**Solution**: Check TypeScript configuration and ensure `exactOptionalPropertyTypes: true`.

### Debug Mode
```bash
# Run tests with verbose output
./scripts/run-tests.sh --verbose

# Run individual test with debug logging
DEBUG=* npm run test:technical-analysis
```

### Test Logs
All tests use structured logging with Pino. Logs include:
- Test progress and status
- API request/response details
- Error messages and stack traces
- Performance metrics

## 🚀 CI/CD Integration

### GitHub Actions
The tests are designed to work in CI/CD environments:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test  # CI tests (no API keys required)
      # Full tests run only on main branch with secrets
      - run: npm run test:all
        if: github.ref == 'refs/heads/main'
        env:
          TECHNICAL_INDICATORS_API_KEY: ${{ secrets.TECHNICAL_INDICATORS_API_KEY }}
          NEWS_API_KEY: ${{ secrets.NEWS_API_KEY }}
          # ... other API keys
```

### Environment Variables in CI
- **CI Tests**: No environment variables required
- **Full Tests**: All API keys must be set as GitHub secrets

## 📈 Performance Testing

### Test Performance Metrics
- **CI Tests**: ~5-10 seconds
- **Full Integration Tests**: ~30-60 seconds (depending on API response times)
- **Individual Tests**: ~5-15 seconds each

### Performance Monitoring
Tests include performance metrics:
- API response times
- Data processing speed
- Memory usage
- Error rates

## 🔧 Customizing Tests

### Adding New Tests
1. Create test file in `src/tests/`
2. Follow naming convention: `*-integration.ts`
3. Add to package.json scripts
4. Update `scripts/run-tests.sh` if needed
5. Add to documentation

### Test Structure
```typescript
async function testFeature() {
    console.log('🧪 Testing Feature...');
    
    try {
        // Test implementation
        console.log('✅ Feature test passed');
    } catch (error) {
        console.error('❌ Feature test failed:', error);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting Feature Tests');
    
    try {
        await testFeature();
        console.log('🎉 All Feature Tests Passed!');
    } catch (error) {
        console.error('❌ Feature Tests Failed!');
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
```

## 📚 Additional Resources

- **[Technical Analysis Guide](docs/TECHNICAL_INDICATORS.md)**
- **[News API Guide](docs/NEWS_API.md)**
- **[Aspis Setup Guide](docs/ASPIS_SETUP.md)**
- **[Database Schema](docs/DATABASE_SCHEMA.md)**
- **[Decision Process](docs/DECISION_PROCESS.md)**

---

**Built with ❤️ for reliable crypto trading systems**
