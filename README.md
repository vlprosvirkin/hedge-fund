# 🤖 Hedge Fund MVP - AI-Powered Crypto Trading System

A sophisticated crypto hedge fund MVP featuring multi-agent consensus trading with real-time market data, news sentiment analysis, and automated portfolio management.

## 🎯 Overview

This system implements a complete crypto trading pipeline with:

- **Multi-Agent Consensus**: Three AI agents (Fundamental, Sentiment, Technical) analyze data and generate trading claims
- **Real-time Market Data**: Integration with Binance for live price feeds and order books  
- **Technical Analysis**: 45+ comprehensive technical indicators with signal analysis
- **News Sentiment Analysis**: Automated news ingestion and sentiment scoring for 170+ crypto assets
- **Risk Management**: Comprehensive risk controls and kill-switch functionality
- **Portfolio Optimization**: Automated rebalancing based on consensus scores
- **Execution Engine**: Integration with Aspis for professional order execution
- **Enhanced Signal Processing**: Multi-dimensional signal analysis with Kelly Criterion position sizing
- **Real-time Transparency**: Enhanced Telegram notifications with detailed AI reasoning and analysis
- **Database Integration**: Complete audit trail with PostgreSQL storage for claims, consensus, and orders

## 📖 Documentation

**[📚 Full Documentation →](docs/README.md)**

- **[Quick Start](docs/quickstart.md)** - Install, configure, and run the system
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and components
- **[AI Agents](docs/AGENTS.md)** - Multi-agent system documentation
- **[API Integration](docs/API_TYPES.md)** - All API types and interfaces
- **[Testing Guide](docs/TESTS_README.md)** - Testing procedures and examples

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

# Run CI tests (no API keys required)
npm test

# Run full test suite (requires API keys)
npm run test:all
```

### Docker Deployment

For AWS deployment with Docker, see **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed instructions.

**Quick deploy command:**
```bash
docker-compose up --build -d
```

### Environment Variables

Create a `.env` file with the variables as in env.example:

**Note:** For Aspis Trading API, you need to:
1. Visit [https://v2.aspis.finance/create-vault](https://v2.aspis.finance/create-vault)
2. Select **Agent Fund** option
3. Complete the vault creation process
4. Use the provided **API key** and **vault address** in your configuration
5. Both `ASPIS_API_KEY` and `ASPIS_VAULT_ADDRESS` are required environment variables

### Running the System

```bash
# Start production system (requires real API keys)
npm start

# Run CI tests (no API keys required)
npm test

# Run comprehensive integration tests (requires API keys)
npm run test:all

# Development mode with hot reload
npm run dev
```

## 🏗️ Architecture

### Multi-Agent System
- **Fundamental Agent**: Analyzes on-chain metrics, social sentiment, and market cap dynamics
- **Sentiment Agent**: Processes news sentiment with reflection/criticism methodology
- **Technical Analysis Agent**: Evaluates technical indicators and price action patterns
- **Consensus Engine**: Builds weighted consensus with risk profile adaptation

### Core Components
- **Orchestrator**: Main coordinator managing the entire trading pipeline
- **Agent Coordinator**: Multi-agent collaboration and debate management
- **Vault Controller**: Portfolio management and order conversion
- **Signal Processing**: Kelly Criterion position sizing and risk management
- **Database**: PostgreSQL with complete audit trail and performance tracking

## 🔧 Technology Stack

- **Backend**: Node.js, TypeScript
- **Database**: PostgreSQL, Redis
- **APIs**: Binance, CoinMarketCap, News APIs, Technical Indicators API
- **AI/ML**: OpenAI GPT models for agent reasoning
- **Notifications**: Telegram Bot API
- **Testing**: Jest, Supertest
- **Documentation**: GitBook, Markdown

## 📈 Performance Metrics

- **API Response Time**: < 100ms for cached data
- **Agent Processing**: < 5 seconds per agent
- **Consensus Generation**: < 10 seconds total
- **Database Queries**: < 50ms average
- **Uptime**: 99.9% target

## 🧪 Testing

### Test Suite

The system includes comprehensive testing with both CI/CD and full integration tests:

#### CI/CD Tests (No API Keys Required)
```bash
# Run CI tests that verify core functionality
npm test

# Tests include:
# ✅ Core services instantiation
# ✅ Type system validation
# ✅ Module imports and compilation
# ✅ Basic functionality without external APIs
```

#### Full Integration Tests (Requires API Keys)
```bash
# Run complete test suite with real APIs
npm run test:all

# Tests include:
# ✅ Technical Analysis Pipeline Test
# ✅ News API Integration Test  
# ✅ Multi-Agent System Test
# ✅ Full Decision-Execution Cycle Test
# ✅ Telegram Integration Test
# ✅ Database Integration Test
```

## 🚨 Disclaimer

This is a research and educational project. **Do not use with real money without proper testing and risk management.** Cryptocurrency trading involves substantial risk of loss.

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
- Ensure all tests pass: `npm test && npm run test:all`

## 📞 Support

For questions or issues:
- **Create an issue** on GitHub with detailed reproduction steps
- **Check the documentation** in the `docs/` folder for API references
- **Review the integration tests** in `src/tests/` for usage examples
- **Run the CI tests** with `npm test` for basic functionality verification

### Quick Links
- **[📚 Full Documentation](docs/README.md)**
- **[🚀 Quick Start Guide](docs/quickstart.md)**
- **[🏗️ Architecture Overview](docs/ARCHITECTURE.md)**
- **[🤖 AI Agents Guide](docs/AGENTS.md)**
- **[🧪 Testing Guide](docs/TESTS_README.md)**

---

**Built with ❤️ for the crypto trading community**

*Featuring real-time technical analysis, multi-source news sentiment, and professional-grade execution through Aspis trading infrastructure.*
