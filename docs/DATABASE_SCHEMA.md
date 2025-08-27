# Database Schema & Storage Architecture

This document describes the complete database schema and storage architecture for the hedge fund system.

## 🗄️ Overview

The system uses **PostgreSQL** as the primary database for all data storage. We intentionally removed Redis to simplify the architecture and ensure data consistency through ACID transactions.

## 📊 Database Schema

### Core Tables

#### 1. `news` - News Articles Storage
```sql
CREATE TABLE news (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  published_at TIMESTAMP NOT NULL,
  sentiment_score DECIMAL(3,2),
  relevance_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores news articles from 170+ crypto sources
- **Deduplication**: Uses `ON CONFLICT` for upsert operations
- **Indexing**: `published_at`, `source` for fast queries
- **Sentiment**: Pre-calculated sentiment scores (0.0-1.0)

#### 2. `evidence` - Trading Evidence (Discriminated Union)
```sql
CREATE TABLE evidence (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ticker VARCHAR(20) NOT NULL, -- BTC, ETH, SOL, GLOBAL (for market-wide news)
  kind VARCHAR(20) NOT NULL, -- 'news', 'market', 'tech'
  source VARCHAR(255) NOT NULL,
  relevance DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  impact DECIMAL(3,2), -- -1.0 to 1.0
  confidence DECIMAL(3,2), -- 0.0 to 1.0
  
  -- News-specific fields
  url TEXT,
  snippet TEXT,
  published_at TIMESTAMP,
  
  -- Market/Tech-specific fields  
  metric VARCHAR(100),
  value DECIMAL(20,8),
  observed_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores structured evidence for trading decisions using discriminated union pattern
- **Ticker**: Asset symbol (BTC, ETH, SOL) or **GLOBAL** for market-wide news
- **Kind**: Evidence type discriminator ('news', 'market', 'tech')
- **News Evidence**: URL, snippet, published_at for news articles
- **Market Evidence**: Metric, value, observed_at for market data (source: 'binance')
- **Tech Evidence**: Metric, value, observed_at for technical indicators (source: 'indicators')
- **GLOBAL Ticker**: Special value for news affecting entire crypto market
- **Indexing**: `ticker`, `kind`, `source`, `relevance` for fast queries

#### 3. `claims` - Agent Claims (Enhanced Structure)
```sql
CREATE TABLE claims (
  id VARCHAR(255) PRIMARY KEY,
  round_id VARCHAR(255) NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  agent_role VARCHAR(50) NOT NULL, -- 'fundamental', 'sentiment', 'valuation'
  claim_text TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  evidence_ids TEXT[] NOT NULL, -- Array of evidence IDs
  risk_flags TEXT[] NOT NULL,
  direction VARCHAR(20), -- 'bullish', 'bearish', 'neutral'
  magnitude DECIMAL(3,2), -- -1.0 to 1.0 (signal strength)
  rationale TEXT, -- Detailed reasoning
  thesis TEXT, -- Short thesis statement
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores AI agent analysis results with enhanced structure
- **Agent Roles**: `fundamental`, `sentiment`, `valuation`
- **Confidence**: Agent confidence score (0.0-1.0)
- **Direction**: Explicit signal direction ('bullish', 'bearish', 'neutral')
- **Magnitude**: Signal strength (-1.0 to 1.0)
- **Thesis**: Short, clear thesis statement
- **Rationale**: Detailed reasoning for the claim
- **Evidence**: Array of evidence IDs supporting the claim
- **Risk Flags**: Array of risk warnings

#### 4. `consensus` - Consensus Recommendations
```sql
CREATE TABLE consensus (
  id VARCHAR(255) PRIMARY KEY,
  round_id VARCHAR(255) NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  avg_confidence DECIMAL(3,2) NOT NULL,
  coverage DECIMAL(3,2) NOT NULL,
  liquidity DECIMAL(3,2) NOT NULL,
  final_score DECIMAL(3,2) NOT NULL,
  claim_ids TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Final trading recommendations after consensus building
- **Coverage**: How many agents covered this ticker (0.0-1.0)
- **Liquidity**: Liquidity score (0.0-1.0)
- **Final Score**: Weighted consensus score (0.0-1.0)

#### 5. `orders` - Trading Orders
```sql
CREATE TABLE orders (
  id VARCHAR(255) PRIMARY KEY,
  round_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  type VARCHAR(20) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8),
  status VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Tracks all trading orders
- **Side**: `buy` or `sell`
- **Type**: `market`, `limit`, `stop`
- **Status**: `pending`, `filled`, `cancelled`, `rejected`
- **Precision**: 20 digits, 8 decimal places for crypto amounts

#### 6. `positions` - Portfolio Positions
```sql
CREATE TABLE positions (
  id VARCHAR(255) PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  avg_price DECIMAL(20,8) NOT NULL,
  unrealized_pnl DECIMAL(20,8) NOT NULL,
  realized_pnl DECIMAL(20,8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Current portfolio positions
- **PnL Tracking**: Both unrealized and realized PnL
- **Updates**: `updated_at` for position changes
- **Precision**: High precision for crypto amounts

#### 7. `rounds` - Trading Rounds
```sql
CREATE TABLE rounds (
  id VARCHAR(255) PRIMARY KEY,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  claims_count INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  total_pnl DECIMAL(20,8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Tracks complete trading rounds
- **Status**: `running`, `completed`, `failed`, `cancelled`
- **Metrics**: Claims, orders, and PnL per round
- **Timing**: Start and end times for performance analysis

#### 8. `risk_violations` - Risk Management
```sql
CREATE TABLE risk_violations (
  id VARCHAR(255) PRIMARY KEY,
  round_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Tracks risk violations and warnings
- **Types**: `position_size`, `leverage`, `concentration`, `drawdown`
- **Severity**: `low`, `medium`, `high`, `critical`
- **Audit Trail**: Complete history of risk events

## 🔍 Indexes for Performance

```sql
-- News indexes
CREATE INDEX idx_news_published_at ON news(published_at);
CREATE INDEX idx_news_source ON news(source);

-- Evidence indexes
CREATE INDEX idx_evidence_ticker ON evidence(ticker);
CREATE INDEX idx_evidence_kind ON evidence(kind);
CREATE INDEX idx_evidence_source ON evidence(source);
CREATE INDEX idx_evidence_published_at ON evidence(published_at);
CREATE INDEX idx_evidence_observed_at ON evidence(observed_at);
CREATE INDEX idx_evidence_metric ON evidence(metric);
CREATE INDEX idx_evidence_relevance ON evidence(relevance);

-- Claims indexes
CREATE INDEX idx_claims_round_id ON claims(round_id);
CREATE INDEX idx_claims_ticker ON claims(ticker);

-- Consensus indexes
CREATE INDEX idx_consensus_round_id ON consensus(round_id);

-- Orders indexes
CREATE INDEX idx_orders_round_id ON orders(round_id);

-- Positions indexes
CREATE INDEX idx_positions_symbol ON positions(symbol);

-- Rounds indexes
CREATE INDEX idx_rounds_start_time ON rounds(start_time);
```

## 🏗️ Architecture Benefits

### ✅ **Why PostgreSQL Only?**

1. **ACID Transactions**: Critical for trading data integrity
2. **Complex Queries**: Advanced analytics and reporting
3. **Data Consistency**: Single source of truth
4. **Backup & Recovery**: Built-in reliability features
5. **Performance**: Proper indexing handles our load
6. **Simplicity**: Fewer moving parts, easier maintenance

### ❌ **Why No Redis?**

1. **Market Data**: Real-time via WebSocket, no caching needed
2. **Rate Limiting**: Can be implemented in PostgreSQL
3. **Session Data**: Not applicable for our use case
4. **Complexity**: Additional dependency without clear benefit

## 🏗️ Evidence & Claims Structure

### 📋 Evidence Types (Discriminated Union)

The system uses a discriminated union pattern for evidence, allowing different types of evidence to be stored in a single table while maintaining type safety.

#### 1. **News Evidence** (`kind: 'news'`)
```typescript
{
  id: string,
  ticker: string, // BTC, ETH, SOL, or GLOBAL
  kind: 'news',
  source: string, // coindesk.com, reuters.com, etc.
  url: string,
  snippet: string,
  publishedAt: string, // ISO datetime
  relevance: number, // 0.0-1.0
  impact?: number, // -1.0 to 1.0
  confidence?: number // 0.0-1.0
}
```

#### 2. **Market Evidence** (`kind: 'market'`)
```typescript
{
  id: string,
  ticker: string, // BTC, ETH, SOL
  kind: 'market',
  source: 'binance', // Fixed source
  metric: 'vol24h' | 'spread_bps' | 'ohlcv_close' | 'vwap' | 'liquidity_score',
  value: number,
  observedAt: string, // ISO datetime
  relevance: number, // 0.0-1.0
  impact?: number, // -1.0 to 1.0
  confidence?: number // 0.0-1.0
}
```

#### 3. **Technical Evidence** (`kind: 'tech'`)
```typescript
{
  id: string,
  ticker: string, // BTC, ETH, SOL
  kind: 'tech',
  source: 'indicators', // Fixed source
  metric: string, // RSI(14,1h), MACD(12,26,9,1h), etc.
  value: number,
  observedAt: string, // ISO datetime
  relevance: number, // 0.0-1.0
  impact?: number, // -1.0 to 1.0
  confidence?: number // 0.0-1.0
}
```

### 🎯 Claims Structure

Claims represent AI agent analysis results with enhanced structure for better decision-making.

```typescript
{
  id: string,
  ticker: string, // BTC, ETH, SOL
  agentRole: 'fundamental' | 'sentiment' | 'valuation',
  claim: string, // BUY, SELL, HOLD
  thesis: string, // Short thesis statement
  confidence: number, // 0.0-1.0
  evidence: Evidence[], // Array of evidence objects
  timestamp: number,
  direction: 'bullish' | 'bearish' | 'neutral',
  magnitude: number, // -1.0 to 1.0 (signal strength)
  riskFlags: string[] // Array of risk warnings
}
```

### 🌍 GLOBAL Ticker for Market-Wide News

For news that affects the entire crypto market (e.g., regulatory changes, macroeconomic events), use the special ticker `GLOBAL`:

```typescript
// Example: Federal Reserve policy change affecting all crypto
{
  id: "global-fed-policy-2024",
  ticker: "GLOBAL", // Special ticker for market-wide impact
  kind: "news",
  source: "reuters.com",
  url: "https://reuters.com/fed-policy-crypto",
  snippet: "Federal Reserve signals potential rate cuts, boosting crypto markets",
  publishedAt: "2024-01-15T10:00:00Z",
  relevance: 0.95,
  impact: 0.8,
  confidence: 0.9
}
```

**Usage in Claims:**
- GLOBAL evidence can be referenced by claims for any ticker
- Agents can consider market-wide factors when making individual asset recommendations
- Consensus building includes market-wide sentiment in scoring

### 🔍 Evidence Validation Rules

```sql
-- News evidence validation
ALTER TABLE evidence ADD CONSTRAINT chk_news_evidence 
  CHECK (kind != 'news' OR (url IS NOT NULL AND snippet IS NOT NULL AND published_at IS NOT NULL));

-- Market evidence validation  
ALTER TABLE evidence ADD CONSTRAINT chk_market_evidence 
  CHECK (kind != 'market' OR (metric IS NOT NULL AND value IS NOT NULL AND observed_at IS NOT NULL));

-- Tech evidence validation
ALTER TABLE evidence ADD CONSTRAINT chk_tech_evidence 
  CHECK (kind != 'tech' OR (metric IS NOT NULL AND value IS NOT NULL AND observed_at IS NOT NULL));
```

## 📈 Data Flow

```
📰 News API → news table
    ↓
🔍 Evidence Extraction → evidence table (with ticker/GLOBAL)
    ↓
🤖 Agent Analysis → claims table (enhanced structure)
    ↓
🎯 Consensus Building → consensus table
    ↓
📈 Order Execution → orders table
    ↓
💰 Position Updates → positions table
    ↓
📊 Round Tracking → rounds table
    ↓
⚠️ Risk Monitoring → risk_violations table
```

## 🧹 Data Retention & Cleanup

### Automatic Cleanup
```sql
-- Keep last 30 days of data
DELETE FROM risk_violations WHERE timestamp < $1;
DELETE FROM orders WHERE timestamp < $1;
DELETE FROM claims WHERE timestamp < $1;
DELETE FROM consensus WHERE created_at < $1;
DELETE FROM evidence WHERE timestamp < $1;
DELETE FROM news WHERE published_at < $1;
```

### Retention Policy
- **News & Evidence**: 30 days (for analysis)
- **Claims & Consensus**: 30 days (for audit)
- **Orders**: 30 days (for compliance)
- **Positions**: Current only (real-time)
- **Rounds**: 90 days (for performance analysis)
- **Risk Violations**: 90 days (for compliance)

## 🔧 Configuration

### Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hedge_fund
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

### Connection Pool Settings
```typescript
{
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000 // Connection timeout
}
```

## 📊 Analytics Queries

### Performance Analysis
```sql
-- Daily PnL
SELECT 
  DATE(start_time) as date,
  SUM(total_pnl) as daily_pnl,
  COUNT(*) as rounds
FROM rounds 
WHERE status = 'completed'
GROUP BY DATE(start_time)
ORDER BY date DESC;
```

### Agent Performance
```sql
-- Agent confidence by role
SELECT 
  agent_role,
  AVG(confidence) as avg_confidence,
  COUNT(*) as claims_count
FROM claims 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY agent_role;
```

### Risk Analysis
```sql
-- Risk violations by type
SELECT 
  type,
  severity,
  COUNT(*) as violation_count
FROM risk_violations 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY type, severity
ORDER BY violation_count DESC;
```

## 🚀 Performance Optimization

### Query Optimization
1. **Use Indexes**: All queries use indexed columns
2. **Batch Operations**: Bulk inserts for better performance
3. **Connection Pooling**: Reuse connections efficiently
4. **Transaction Management**: Proper BEGIN/COMMIT/ROLLBACK

### Monitoring
1. **Query Performance**: Monitor slow queries
2. **Connection Usage**: Track pool utilization
3. **Storage Growth**: Monitor table sizes
4. **Index Usage**: Ensure indexes are being used

## 🔒 Security Considerations

1. **Connection Security**: Use SSL for production
2. **Access Control**: Limit database user permissions
3. **Data Encryption**: Encrypt sensitive data at rest
4. **Audit Logging**: Track all database operations
5. **Backup Security**: Secure backup storage

## 📋 Testing

Run the database integration test:
```bash
npm run test:database
```

This test validates:
- ✅ Schema creation and initialization
- ✅ Data storage and retrieval
- ✅ Transaction safety
- ✅ Index performance
- ✅ Data integrity
- ✅ Cleanup operations

## 🎯 Key Benefits

1. **Data Integrity**: ACID transactions ensure consistency
2. **Performance**: Proper indexing for fast queries
3. **Scalability**: PostgreSQL handles our data volume
4. **Reliability**: Built-in backup and recovery
5. **Simplicity**: Single database, fewer dependencies
6. **Analytics**: Rich SQL for complex reporting
7. **Compliance**: Complete audit trail for trading decisions
