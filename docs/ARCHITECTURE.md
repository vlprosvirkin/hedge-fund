# Hedge Fund Architecture

## Overview

This hedge fund system implements a multi-agent consensus framework for cryptocurrency trading decisions. The system combines fundamental, sentiment, and technical analysis through AI agents to generate trading signals and execute orders.

## Core Components

### 1. Orchestrator (`src/core/orchestrator.ts`)
The central coordinator that manages the entire trading pipeline:

- **Round Management**: Executes trading rounds every 12 hours (configurable via `roundInterval`)
- **Pipeline Coordination**: Orchestrates data collection, analysis, decision-making, and execution
- **Risk Management**: Implements kill switches and emergency procedures
- **Monitoring**: Tracks performance and sends notifications

### 2. Multi-Agent System (`src/agents/`)
Three specialized AI agents work together:

- **Fundamental Agent** (30% weight): Analyzes on-chain metrics, social sentiment, and market cap
- **Sentiment Agent** (30% weight): Processes news, social media, and market mood
- **Technical Agent** (40% weight): Evaluates technical indicators and price patterns

### 3. Data Adapters (`src/adapters/`)
External service integrations:

- **Binance Adapter**: Market data and order execution
- **Aspis Adapter**: Additional market intelligence
- **News Adapter**: Real-time news aggregation
- **PostgreSQL Adapter**: Data persistence and retrieval
- **Telegram Adapter**: Notifications and alerts

### 4. Services (`src/services/`)
Specialized business logic:

- **Market Data Service**: Real-time price and volume data
- **Trading Service**: Order management and execution
- **News Service**: News aggregation and sentiment analysis
- **Notifications Service**: Multi-channel alerts and reporting

## Trading Pipeline

### 1. Data Collection (Every 12 hours)
- Fetch universe of tradeable assets
- Collect market statistics and technical indicators
- Gather recent news and social sentiment
- Store all data in PostgreSQL

### 2. Evidence Creation
- Convert raw data into structured evidence
- Categorize by source (news, market, technical)
- Store with metadata for agent consumption

### 3. Agent Analysis
- Each agent processes evidence independently
- Generate claims with confidence scores
- Store claims in database for audit trail

### 4. Consensus Building
- Weight agent contributions (30/30/40)
- Calculate final signal strength (-1 to +1)
- Apply risk profile thresholds
- Generate trading decisions (BUY/SELL/HOLD)

### 5. Execution
- Calculate position sizes based on risk
- Execute orders through Binance
- Track performance and update positions
- Send notifications with results

## Configuration

### System Configuration (`src/core/config.ts`)
```typescript
export const DEFAULT_CONFIG: SystemConfig = {
  riskProfile: 'neutral', // 'averse' | 'neutral' | 'bold'
  roundInterval: 43200,   // 12 hours in seconds
  maxPositions: 10,       // Maximum concurrent positions
  // ... decision thresholds and technical parameters
};
```

### Risk Profiles
- **Averse**: Conservative thresholds, lower position sizes
- **Neutral**: Balanced approach (default)
- **Bold**: Aggressive thresholds, higher position sizes

## Data Flow

```
Market Data → Evidence → Agents → Claims → Consensus → Signal → Execution
     ↓           ↓         ↓        ↓         ↓         ↓         ↓
  Binance    PostgreSQL  OpenAI  PostgreSQL  Logic   Results   Orders
```

## Monitoring and Alerts

### Telegram Notifications
- Round start/completion
- Signal generation with interpretation
- Order execution status
- Emergency alerts and kill switches

### Performance Tracking
- Signal accuracy metrics
- Portfolio performance
- Risk metrics and drawdowns
- Agent contribution analysis

## Security and Risk Management

### Kill Switches
- Emergency stop functionality
- Automatic position closure
- API failure handling
- Risk limit violations

### Data Integrity
- PostgreSQL for reliable storage
- Audit trails for all decisions
- Evidence and claim tracking
- Performance history

## Deployment

### Docker Support
- Containerized application
- Environment-based configuration
- Health checks and monitoring
- Scalable architecture

### Environment Variables
- API keys and credentials
- Database configuration
- Risk parameters
- Notification settings

## Development

### Testing
- Unit tests for all components
- Integration tests for pipeline
- Mock services for development
- Performance benchmarks

### Logging
- Structured logging throughout
- Debug information for troubleshooting
- Performance metrics
- Error tracking and alerting
