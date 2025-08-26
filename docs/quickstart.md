---
hidden: true
---

# 🚀 Quick Start Guide

## Prerequisites

* Node.js 18+
* npm or yarn

## Installation & Setup

1.  **Install dependencies:**

    ```bash
    npm install
    ```
2.  **Build the project:**

    ```bash
    npm run build
    ```
3.  **Run mock pipeline (safe for testing):**

    ```bash
    npm run mock
    ```

## What the Mock Pipeline Does

The mock pipeline demonstrates the complete trading workflow:

1. **Connects to services** (mock implementations)
2. **Generates trading universe** (BTC, ETH, ADA, DOT, LINK)
3. **Fetches market data** (simulated)
4. **Ingests news** (mock news items)
5. **AI agents analyze** and generate trading claims
6. **Claims are verified** for validity
7. **Consensus is built** across agent opinions
8. **Portfolio weights** are calculated
9. **Risk checks** are performed
10. **Mock orders** are placed (if risk passes)

## Project Structure

```
src/
├── adapters/          # External API adapters
│   ├── binance-adapter.ts  # Market data from Binance
│   └── aspis-adapter.ts    # Trading execution via Aspis
├── services/          # Core business logic
│   ├── agents.ts      # AI agents (Fundamental, Sentiment, Valuation)
│   ├── verifier.ts    # Claim verification
│   └── consensus.ts   # Consensus building
├── types/            # TypeScript type definitions
├── interfaces/       # Service interfaces
├── orchestrator.ts   # Main orchestration logic
├── mock-pipeline.ts  # Mock testing pipeline
├── config.ts         # Configuration
└── index.ts          # Application entry point
```

## Key Features

* **Multi-Agent Consensus**: 3 AI agents analyze data independently
* **Risk Management**: Comprehensive risk controls and kill-switch
* **Real-time Data**: Market data and news ingestion
* **Portfolio Optimization**: Automated rebalancing
* **Mock Mode**: Safe testing environment

## Next Steps

1. **Review the code** in `src/` directory
2. **Check configuration** in `src/config.ts`
3. **Run mock pipeline** to see it in action
4. **Add real API keys** for production use
5. **Customize risk parameters** as needed

## Production Setup

For production use, you'll need:

* Binance API keys
* Aspis API key (from [https://v2.aspis.finance/create-vault](https://v2.aspis.finance/create-vault))
* OpenAI API key
* Database setup (PostgreSQL/Redis)

See `README.md` for detailed production setup instructions.
