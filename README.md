# 🤖 Hedge Fund MVP - AI-Powered Crypto Trading System

A sophisticated crypto hedge fund MVP based on the BlackRock paper, featuring multi-agent consensus trading with real-time market data, news sentiment analysis, and automated portfolio management.

## 🎯 Overview

This system implements a complete crypto trading pipeline with:

- **Multi-Agent Consensus**: Three AI agents (Fundamental, Sentiment, Valuation) analyze data and generate trading claims
- **Real-time Market Data**: Integration with Binance for live price feeds and order books  
- **Technical Analysis**: 45+ comprehensive technical indicators with signal analysis ([Technical Indicators Guide](docs/TECHNICAL_INDICATORS.md))
- **News Sentiment Analysis**: Automated news ingestion and sentiment scoring for 170+ crypto assets ([News API Guide](docs/NEWS_API.md))
- **Risk Management**: Comprehensive risk controls and kill-switch functionality
- **Portfolio Optimization**: Automated rebalancing based on consensus scores
- **Execution Engine**: Integration with Aspis for professional order execution ([Aspis Setup Guide](docs/ASPIS_SETUP.md))

## 📖 Documentation

- **[Technical Analysis Types](docs/TECHNICAL_ANALYSIS_TYPES.md)** - Complete type definitions for technical indicators
- **[News API Types](docs/NEWS_API_TYPES.md)** - Type definitions for news and sentiment analysis
- **[Aspis API Methods](docs/ASPIS_API_METHODS.md)** - Trading execution API reference
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - PostgreSQL schema and storage architecture
- **[Decision Process](docs/DECISION_PROCESS.md)** - Complete decision-making process and Telegram integration
- **[Integration Tests](src/tests/README.md)** - Comprehensive testing documentation

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│  Scheduler  │───▶│ Agents       │───▶│ Verifier    │───▶│ Consensus       │───▶│ Execution   │
│             │    │ Service      │    │             │    │ Engine          │    │ Engine      │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────────┘    └─────────────┘
       │                   │                   │                    │                     │
       ▼                   ▼                   ▼                    ▼                     ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│ Market Data │◀───│ News Ingest  │◀───│ Fact Store  │◀───│ Evidence        │◀───│ Orders      │
│             │    │              │    │             │    │                 │    │             │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────────┘    └─────────────┘
```

### Core Services

1. **Market Data Service** (BinanceAdapter)
   - Live OHLCV data and order books
   - Market statistics and liquidity metrics
   - Real-time ticker subscriptions

2. **Technical Analysis Service** ([TechnicalIndicatorsAdapter](docs/TECHNICAL_INDICATORS.md))
   - 45+ comprehensive technical indicators (RSI, MACD, Stochastic, Bollinger Bands, etc.)
   - Signal strength analysis and trading recommendations
   - Asset metadata and market sentiment scoring
   - Real-time price and volume analysis
   - Supported timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w
   - **[View Technical Analysis Types →](docs/TECHNICAL_ANALYSIS_TYPES.md)**

3. **News & Sentiment Analysis** ([NewsAPIAdapter](docs/NEWS_API.md))
   - Automated news ingestion from multiple crypto sources
   - Real-time sentiment analysis with 0.0-1.0 scoring
   - Support for 170+ crypto assets with intelligent caching
   - News digest and asset-specific filtering
   - Time-lock validation for anti-leak protection
   - **[View News API Types →](docs/NEWS_API_TYPES.md)**

4. **AI Agents Service**
   - **Fundamental Agent**: Analyzes price, volume, volatility, and market cap data
   - **Sentiment Agent**: Processes news sentiment with confidence scoring
   - **Valuation Agent**: Uses real technical indicators for RSI, MACD, and signal analysis
   - Structured JSON claim generation with evidence-based analysis
   - Dynamic confidence scoring based on data quality

5. **Verification Engine**
   - Claim validation and timestamp checking
   - Source whitelist enforcement (CoinDesk, CoinTelegraph, etc.)
   - Risk flag detection and suspicious pattern analysis
   - Evidence relevance and freshness validation

6. **Consensus Engine**
   - Multi-agent claim aggregation with weighted scoring
   - Liquidity-weighted consensus building
   - Conflict detection and resolution between agents
   - Risk-adjusted recommendations (averse, neutral, bold profiles)

7. **Portfolio & Risk Management**
   - Dynamic position sizing and rebalancing (5% threshold)
   - Risk limit enforcement with real-time monitoring
   - Emergency stop functionality with kill-switch
   - Portfolio metrics tracking (PnL, margin levels, drawdown)

8. **Execution Gateway** ([AspisAdapter](docs/ASPIS_SETUP.md))
   - Professional order placement and management
   - Real-time fill event handling and position tracking
   - Account balance and portfolio metrics monitoring
   - Mock mode for safe testing and development
   - **[View Aspis API Methods →](docs/ASPIS_API_METHODS.md)**

9. **Data Storage & Analytics** ([PostgresAdapter](docs/DATABASE_SCHEMA.md))
   - PostgreSQL database with ACID transactions
   - Complete audit trail for all trading decisions
   - News, evidence, claims, and consensus storage
   - Round tracking and performance analytics
   - Risk violations and compliance logging
   - Automatic data cleanup and retention policies
   - **[View Database Schema →](docs/DATABASE_SCHEMA.md)**

10. **Transparency & Monitoring** ([TelegramAdapter](docs/DECISION_PROCESS.md))
    - Real-time Telegram notifications for all decisions
    - Complete process transparency from data to execution
    - Agent analysis reports with confidence scores
    - Risk assessment and violation alerts
    - Portfolio performance tracking and reporting
    - Emergency alerts and kill-switch notifications
    - **[View Decision Process →](docs/DECISION_PROCESS.md)**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for Binance, Aspis, and OpenAI (for production)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hedge-fund

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Build the project
npm run build

# Run mock pipeline (recommended for testing)
npm run mock
```

### Environment Variables

Create a `.env` file with the following variables:

**Note:** For Aspis Trading API, you need to:
1. Visit [https://v2.aspis.finance/create-vault](https://v2.aspis.finance/create-vault)
2. Select **Agent Fund** option
3. Complete the vault creation process
4. Use the provided API key in your configuration

```env
# API Keys
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
ASPIS_API_KEY=your_aspis_api_key
OPENAI_API_KEY=your_openai_api_key

# Configuration
LOG_LEVEL=info
RISK_PROFILE=neutral
DEBATE_INTERVAL=3600
MAX_POSITIONS=8
```

### Running the System

```bash
# Run mock pipeline (safe for testing)
npm run mock

# Start production system (requires real API keys)
npm start

# Run comprehensive integration tests
npm run test:integration    # Technical analysis pipeline
npm run test:news          # News API and sentiment analysis  
npm run test:services      # Multi-agent system
npm run test:decision      # Full decision-execution cycle
npm run test:telegram      # Telegram notifications and transparency
npm run test:database      # PostgreSQL database and storage

# Development mode with hot reload
npm run dev
```

## 📊 Trading Pipeline

### 1. Universe Selection
- Filters crypto pairs by liquidity, volume, and spread
- Maintains whitelist/blacklist of symbols
- Updates symbol mappings between exchanges

### 2. Data Collection
- Fetches real-time market data from Binance
- Ingests news from multiple sources
- Stores evidence with timestamps and relevance scores

### 3. Agent Analysis
Each agent specializes in different aspects with real data integration:

**Fundamental Agent:**
- Real-time price, volume, and volatility analysis
- Market cap calculations and liquidity assessment  
- Dynamic confidence scoring based on data quality
- Risk flag generation for market volatility

**Sentiment Agent:**
- Real-time news sentiment analysis (0.0-1.0 scoring)
- Processing 170+ crypto assets from multiple sources
- Sentiment consistency validation across articles
- News coverage and confidence correlation analysis

**Valuation Agent:**
- Live technical indicators: RSI, MACD, Bollinger Bands, Stochastic
- Signal strength calculation and trend analysis
- Technical recommendation generation (BUY/HOLD/SELL)
- Overbought/oversold condition detection with threshold validation

### 4. Claim Verification
- Validates claim format and evidence
- Checks timestamp locks (anti-leak)
- Enforces source whitelist
- Detects suspicious patterns

### 5. Consensus Building
- Aggregates claims by ticker
- Calculates confidence-weighted scores
- Applies liquidity adjustments
- Detects and resolves conflicts

### 6. Portfolio Construction
- Selects top-scoring assets
- Applies risk profile constraints
- Calculates target weights
- Determines rebalancing needs

### 7. Risk Management
- Position size limits
- Leverage controls
- Drawdown protection
- Emergency stop triggers

### 8. Order Execution
- Converts targets to orders
- Manages order lifecycle
- Handles fills and updates
- Implements kill-switch

## 🔧 Configuration

### Risk Profiles

```typescript
const riskProfiles = {
  averse: {
    maxPositions: 5,
    maxPositionSize: 0.15,
    maxLeverage: 1.0,
    maxDrawdown: 0.05
  },
  neutral: {
    maxPositions: 8,
    maxPositionSize: 0.20,
    maxLeverage: 1.5,
    maxDrawdown: 0.10
  },
  bold: {
    maxPositions: 12,
    maxPositionSize: 0.25,
    maxLeverage: 2.0,
    maxDrawdown: 0.15
  }
};
```

### Trading Parameters

- **Debate Interval**: How often agents analyze (default: 1 hour)
- **Rebalance Threshold**: Minimum weight change to trigger rebalancing (default: 5%)
- **Max Positions**: Maximum number of concurrent positions
- **Kill Switch**: Emergency stop for all trading activity

## 📈 Monitoring & Observability

### Logging
- Structured logging with Pino
- Different log levels (debug, info, warn, error)
- JSON format for easy parsing

### Metrics
- Trading round performance
- Agent claim generation stats
- Risk limit violations
- Order execution metrics

### Artifacts
Each trading round produces:
- `transcript.json`: Full agent conversation
- `verified_claims.json`: Validated trading claims
- `consensus.json`: Final consensus decisions
- `portfolio.json`: Target portfolio weights
- `orders.json`: Executed orders

## 🛡️ Risk Management

### Position Limits
- Maximum position size per asset
- Maximum portfolio concentration
- Minimum position thresholds

### Risk Controls
- Real-time PnL monitoring
- Maximum drawdown limits
- Volatility-based position sizing
- Correlation-based exposure limits

### Emergency Procedures
- Kill-switch for immediate stop
- Emergency position closure
- Order cancellation
- Alert notifications

## 🔌 API Integration

### Binance Integration
- REST API for market data
- WebSocket for real-time feeds
- Rate limiting and retry logic
- Symbol mapping and validation

### Aspis Integration
- Order placement and management
- Position tracking
- Fill event handling
- Account balance monitoring

### News APIs
- Multiple news source integration
- Sentiment analysis
- Deduplication and filtering
- Time-lock validation
- Real-time technical analysis (RSI, MACD, Bollinger Bands)
- Signal strength calculation
- Integration with valuation agent
- Crypto-focused news digest and sentiment analysis
- 170+ supported crypto assets
- Intelligent caching and fallback mechanisms

## 🧪 Testing

### Integration Test Suite

The system includes comprehensive integration tests that validate the entire pipeline:

**[Complete Testing Guide →](src/tests/README.md)**

#### Available Tests

```bash
# Technical Analysis Pipeline Test
npm run test:integration
# ✅ Tests 45+ technical indicators, signal analysis, and API integration
# ✅ Validates RSI, MACD, Bollinger Bands, and comprehensive analysis
# ✅ Covers supported timeframes and asset metadata

# News API Integration Test  
npm run test:news
# ✅ Tests news ingestion from 170+ crypto assets
# ✅ Validates sentiment analysis (0.0-1.0 scoring)
# ✅ Covers caching, search, and digest functionality

# Multi-Agent System Test
npm run test:services
# ✅ Tests all three agents with real data integration
# ✅ Validates consensus building and conflict resolution
# ✅ Covers claim verification and risk assessment

# Full Decision-Execution Cycle Test
npm run test:decision
# ✅ Tests complete pipeline: Agents → Consensus → Risk → Execution
# ✅ Validates order placement through AspisAdapter
# ✅ Covers portfolio rebalancing and position tracking
```

#### Mock Pipeline
The mock pipeline runs with simulated data for safe testing:
- Mock market data generation with realistic price movements
- Simulated news feeds with sentiment scoring
- Fake order execution with fill simulation
- Risk-free testing environment with portfolio tracking

#### Test Coverage
- **API Integration**: All external APIs (Technical Indicators, News, Aspis)
- **Data Flow**: Complete data pipeline from ingestion to execution
- **Agent Behavior**: All three agents with real data processing
- **Risk Management**: Position limits, drawdown protection, emergency stops
- **Order Execution**: Order placement, tracking, and portfolio management

## 📚 Development

### Project Structure
```
src/
├── adapters/                    # External API adapters
│   ├── binance-adapter.ts      # Market data integration
│   ├── technical-indicators-adapter.ts  # Technical analysis API
│   ├── news-adapter.ts         # News and sentiment analysis
│   └── aspis-adapter.ts        # Trading execution engine
├── services/                   # Core business logic
│   ├── agents.ts              # Multi-agent system (Fundamental, Sentiment, Valuation)
│   ├── consensus.ts           # Consensus building and conflict resolution
│   └── verifier.ts            # Claim verification and validation
├── types/                     # TypeScript type definitions
│   ├── index.ts              # Core system types
│   ├── technical-analysis.ts # Technical indicator types
│   └── news.ts               # News and sentiment types
├── tests/                     # Integration test suite
│   ├── technical-analysis-integration.ts  # Technical analysis pipeline test
│   ├── news-integration.ts               # News API integration test
│   ├── services-integration.ts           # Multi-agent system test
│   └── decision-execution-integration.ts # Full cycle test
├── interfaces/               # Service interfaces
├── orchestrator.ts          # Main orchestration logic
├── mock-pipeline.ts         # Mock testing pipeline
└── index.ts                # Application entry point

docs/                        # Comprehensive documentation
├── TECHNICAL_INDICATORS.md # Technical analysis guide
├── TECHNICAL_ANALYSIS_TYPES.md  # Type definitions
├── NEWS_API.md             # News API guide  
├── NEWS_API_TYPES.md       # News type definitions
├── ASPIS_SETUP.md          # Trading setup guide
└── ASPIS_API_METHODS.md    # API reference
```

### Adding New Features
1. **Define types** in `src/types/` with Zod schemas for runtime validation
2. **Create interfaces** in `src/interfaces/` for service contracts
3. **Implement adapters** in `src/adapters/` for external API integration
4. **Add business logic** in `src/services/` with proper error handling
5. **Update orchestrator** as needed for pipeline integration
6. **Add integration tests** in `src/tests/` to validate functionality
7. **Update documentation** in `docs/` with API references and guides

### Key Development Principles
- **Type Safety**: Full TypeScript coverage with strict mode
- **Real Data Integration**: All agents work with live API data
- **Comprehensive Testing**: Integration tests for all major components
- **Error Handling**: Graceful fallbacks and mock data when APIs unavailable
- **Documentation**: Complete API references and setup guides

### Code Style
- TypeScript with strict mode
- ESLint for code quality
- Prettier for formatting
- Conventional commits

## 🚨 Disclaimer

This is a research and educational project. **Do not use with real money without proper testing and risk management.** Cryptocurrency trading involves substantial risk of loss.

### Risk Warnings
- **Market Risk**: Cryptocurrency markets are highly volatile and can result in significant losses
- **Technical Risk**: Software bugs or API failures can cause unexpected behavior
- **Liquidity Risk**: Low liquidity markets may impact order execution
- **Operational Risk**: Always test thoroughly in mock mode before live trading

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper testing
4. Add integration tests for new functionality
5. Update documentation as needed
6. Submit a pull request with detailed description

### Contribution Guidelines
- Follow TypeScript strict mode standards
- Add comprehensive integration tests
- Update relevant documentation in `docs/`
- Ensure all tests pass: `npm run test:integration && npm run test:news && npm run test:services && npm run test:decision`

## 📞 Support

For questions or issues:
- **Create an issue** on GitHub with detailed reproduction steps
- **Check the documentation** in the `docs/` folder for API references
- **Review the integration tests** in `src/tests/` for usage examples
- **Run the mock pipeline** with `npm run mock` for safe testing

### Quick Links
- **[Technical Analysis Setup](docs/TECHNICAL_INDICATORS.md)**
- **[News API Configuration](docs/NEWS_API.md)**  
- **[Aspis Trading Setup](docs/ASPIS_SETUP.md)**
- **[Integration Testing Guide](src/tests/README.md)**

---

**Built with ❤️ for the crypto trading community**

*Featuring real-time technical analysis, multi-source news sentiment, and professional-grade execution through Aspis trading infrastructure.*
