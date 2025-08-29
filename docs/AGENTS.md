# AI Agents Documentation

## 🤖 Overview

The Hedge Fund AI Trading System uses three specialized AI agents, each focusing on a specific domain of analysis. Each agent combines mathematical calculations with LLM-based reasoning to generate comprehensive trading insights.

## 🎯 Agent Architecture

### **Agent vs Service Pattern**

Each agent follows a clear separation of concerns:

- **Agent**: Uses LLM for analysis and generates claims
- **Service**: Performs pure mathematical calculations

```typescript
// Agent Pattern
class SomeAgent extends BaseAgent {
  private someService: SomeService; // Mathematical calculations
  
  async processData() // Gets data
  buildSystemPrompt() // LLM prompt
  buildUserPrompt() // Data for LLM
  run() // Generates claims via LLM
}

// Service Pattern
class SomeService {
  calculateMetrics() // Pure math
  processData() // Pure math
  // NO LLM usage
}
```

## 📊 Fundamental Agent

### **Purpose**
Analyzes fundamental metrics including on-chain data, social sentiment, market cap dynamics, and institutional factors.

### **Data Sources**
- **Signals API** (`/indicators` endpoint) - Fundamental data
- **Binance API** - Market data
- **CoinMarketCap API** - Market cap and supply data

### **Analysis Focus**
- **On-chain metrics**: Network activity, transaction volume, addresses
- **Social sentiment**: GalaxyScore, social volume, community engagement
- **Market cap**: Circulating supply, market dominance, institutional data
- **Liquidity**: Volume analysis, bid-ask spreads, trading activity
- **Risk factors**: Volatility, correlation, drawdown analysis

### **Service: FundamentalAnalysisService**
```typescript
// Mathematical calculations only
- calculateOnChainHealth() // Network activity, transaction efficiency
- calculateSocialSentiment() // Social volume, engagement, community health
- calculateRiskAdjustment() // Volatility, correlation, drawdown risk
- calculateCorrelationFactor() // Diversification benefit
- calculateLiquidityScore() // Volume, spread, price change
- calculateVolumeMomentum() // Volume change momentum
- calculateMarketCapHealth() // Market cap efficiency and supply utilization
- createFundamentalAnalysis() // Comprehensive fundamental score
```

### **Enhanced Fundamental Score Formula**
```typescript
fundamental_score = liquidity_score × volume_momentum × trend_strength × 
                   market_cap_health × on_chain_health × social_sentiment × 
                   risk_adjustment × correlation_factor
```

### **API Endpoints**
```typescript
// /indicators endpoint - Fundamental data
{
  // Market Cap & Supply
  market_cap: number,
  circulating_supply: number,
  total_supply: number,
  max_supply: number,
  
  // Volume & Trading
  total_value_traded: number,
  average_transaction_usd: number,
  large_tx_volume_usd: number,
  
  // On-Chain Metrics
  hash_rate: number,
  txs_volume_usd: number,
  addresses_active: number,
  addresses_new: number,
  utxo_created: number,
  utxo_spent: number,
  
  // Network Health
  block_height: number,
  difficulty: number,
  transaction_rate: number,
  block_size_mean: number,
  
  // Social & Sentiment
  social_volume_24h: number,
  tweets: number,
  interactions: number,
  galaxyscore: number,
  
  // Fees & Economics
  fees_total_usd: number,
  fees_mean_usd: number,
  fees_median_usd: number,
  
  // Risk Metrics
  volatility_30: number,
  btc_correlation_30: number,
  price_drawdown: number,
  sopr: number
}
```

## 📰 Sentiment Agent

### **Purpose**
Analyzes news sentiment, social media sentiment, and market mood indicators to understand emotional factors affecting asset prices.

### **Data Sources**
- **NewsAPI** - News articles and sentiment
- **Signals API** (`/indicators` endpoint) - Social metrics
- **CoinMarketCap API** - Fear & Greed Index

### **Analysis Focus**
- **News sentiment**: Article analysis, freshness, consistency, credibility
- **Social metrics**: GalaxyScore, social volume, tweets, interactions
- **Fear & Greed Index**: Market mood from CoinMarketCap
- **Market mood**: Comprehensive emotional factor analysis

### **Service: SentimentAnalysisService**
```typescript
// Mathematical calculations only
- calculateNewsSentiment() // News sentiment, freshness, consistency, credibility
- calculateSocialSentiment() // Social volume, GalaxyScore, interactions
- calculateFearGreedInterpretation() // Fear & Greed Index analysis
- calculateMarketSentiment() // Market sentiment from CMC data
- createComprehensiveSentimentAnalysis() // Final sentiment score
- getSentimentSummary() // LLM-friendly summary
```

### **Comprehensive Sentiment Score Formula**
```typescript
sentiment_score = (news_score × 0.7) + (social_score × 0.3)

where:
news_score = sentiment × coverage_norm × freshness × consistency × credibility × market_mood_factor
social_score = (galaxyscore/100 × 0.4) + (social_volume_norm × 0.3) + (interactions_norm × 0.3)
```

### **API Endpoints**
```typescript
// NewsAPI
{
  title: string,
  content: string,
  publishedAt: string,
  sentiment: number,
  source: string
}

// CoinMarketCap API (Fear & Greed)
{
  fearGreedIndex: number // 0-100
}

// /indicators endpoint (Social metrics)
{
  social_volume_24h: number,
  tweets: number,
  interactions: number,
  galaxyscore: number,
  popularity: number,
  socialdominance: number
}
```

## 📈 Technical Analysis Agent

### **Purpose**
Analyzes technical indicators and price action patterns to identify trading opportunities and market trends.

### **Data Sources**
- **Signals API** (`/stats` endpoint) - Technical indicators
- **Signals API** (`/indicators` endpoint) - Price and volume data

### **Analysis Focus**
- **Technical indicators**: RSI, MACD, ADX, Stochastic, Bollinger Bands
- **Moving averages**: SMA/EMA (10,20,30,50,100,200 periods)
- **Support & Resistance**: Pivot Points, price levels
- **Signal strength**: Combined technical signal analysis
- **Volatility**: ADX-based volatility estimation

### **Service: TechnicalAnalysisService**
```typescript
// Mathematical calculations only
- calculateSignalStrength() // RSI, MACD, ADX, Stochastic
- calculateTrendStrength() // Moving Averages
- calculateVolatilityEstimate() // ADX-based volatility
- getTechnicalSummary() // LLM-friendly summary
```

### **Technical Score Formula**
```typescript
technical_score = signal_strength × trend_strength × volatility_factor
```

### **API Endpoints**
```typescript
// /stats endpoint - Technical indicators
{
  RSI: number,
  "MACD.macd": number,
  ADX: number,
  "Stoch.K": number,
  SMA20: number,
  EMA50: number,
  "BBPower": number,
  "W.R": number,
  "CCI20": number
}

// /indicators endpoint - Price data
{
  lp: number, // price
  volume: number,
  change: number,
  changePercent: number,
  market_cap_calc: number,
  sentiment: number
}
```

## 🔄 Data Flow

### **Fundamental Agent Flow**
```
Signals.getFundamentalData()
→ FundamentalAnalysisService.createFundamentalAnalysis()
→ LLM → Fundamental claims
```

### **Sentiment Agent Flow**
```
NewsAPI + CMC API + Signals.getIndicators()
→ SentimentAnalysisService.createComprehensiveSentimentAnalysis()
→ LLM → Sentiment claims
```

### **Technical Analysis Agent Flow**
```
Signals.getTechnicalIndicators()
→ TechnicalAnalysisService.calculateSignalStrength()
→ LLM → Technical claims
```

## 📊 Consensus Calculation

### **Agent Weights**
```typescript
const weights = { 
  fundamental: 0.30, 
  sentiment: 0.30, 
  technical: 0.40 
};
```

### **Final Consensus Score**
```typescript
final_score = (fundamental_score × 0.30) + 
              (sentiment_score × 0.30) + 
              (technical_score × 0.40)
```

## 🎯 Key Principles

### **Clear Separation of Responsibilities**
- **Technical Analysis Agent**: Only technical indicators
- **Fundamental Agent**: Only fundamental metrics
- **Sentiment Agent**: Only news, sentiment, and social metrics

### **Service-Based Architecture**
- **Services**: Only mathematical calculations
- **LLM**: Only for generating claims and explanations

### **Enhanced Data Utilization**
- **Technical**: 45+ technical indicators from `/stats`
- **Fundamental**: 50+ metrics from `/indicators`
- **Social**: News + Fear & Greed Index + social metrics

## 🔧 Configuration

### **Agent Factory**
```typescript
class AgentFactory {
  static async createAgent(
    role: 'fundamental' | 'sentiment' | 'technical',
    technicalIndicators?: Signals,
    technicalAnalysis?: TechnicalAnalysisService,
    fundamentalAnalysis?: FundamentalAnalysisService,
    sentimentAnalysis?: SentimentAnalysisService
  ): Promise<BaseAgent>
}
```

### **Service Dependencies**
- **Fundamental Agent**: `FundamentalAnalysisService` + `Signals` + `BinanceAdapter` + `CMCAdapter`
- **Sentiment Agent**: `SentimentAnalysisService` + `Signals` + `NewsAPIAdapter` + `CMCAdapter`
- **Technical Analysis Agent**: `TechnicalAnalysisService` + `Signals`

## 📈 Performance Considerations

### **API Rate Limits**
- **Technical Indicators API**: 60 requests/minute
- **CoinMarketCap API**: 30 requests/day (free tier)
- **News API**: Varies by plan

### **Caching Strategy**
- **Technical Data**: Cache for 5-15 minutes
- **Fundamental Data**: Cache for 1-5 minutes
- **Social Data**: Cache for 1-2 minutes

### **Error Handling**
- **Graceful Degradation**: Each agent can work with partial data
- **Fallback Mechanisms**: Use cached data when APIs fail
- **Confidence Scoring**: Lower confidence when data is incomplete

## 🚀 Benefits

### **1. Clear Separation of Concerns**
Each agent specializes in its domain, reducing overlap and improving accuracy.

### **2. Service Reusability**
Mathematical calculations are separated into services that can be tested independently.

### **3. Enhanced Data Sources**
Each agent uses multiple data sources for comprehensive analysis.

### **4. Improved Maintainability**
Modular architecture allows independent updates and testing.

### **5. Better Performance**
Services work quickly, LLM is used only for final analysis and claims generation.

This agent architecture provides a robust foundation for scalable, maintainable, and accurate cryptocurrency analysis with clear separation of responsibilities and enhanced data utilization.
