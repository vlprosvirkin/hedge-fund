# Technical Analysis Service

## Overview

The technical analysis system consists of two main components:
- **`TechnicalAnalysisService`**: Core mathematical engine for technical calculations
- **`TechnicalAnalysisAgent`**: AI-powered analyst that interprets technical data and generates trading recommendations

## Architecture & Responsibilities

### TechnicalAnalysisService (Mathematical Engine)
**Role**: Pure mathematical calculations and data processing

#### Responsibilities:
- **Raw Data Processing**: Fetch and validate technical indicators from APIs
- **Signal Calculations**: Mathematical computation of signal strength using weighted indicators
- **Target Level Generation**: Calculate specific price targets, stop-loss, and take-profit levels
- **Data Validation**: Ensure data integrity and handle edge cases
- **No Decision Making**: Does NOT make trading decisions or recommendations

#### Key Methods:
```typescript
// Data retrieval
getTechnicalDataForAsset(ticker: string, timeframe: string)

// Mathematical calculations
calculateSignalStrength(indicatorData: IndicatorData): SignalStrength
calculateTargetLevels(currentPrice, signalDirection, signalStrength, technicalData, volatility): TargetLevels
calculateTrendStrength(indicatorData: IndicatorData): number
calculateVolatilityEstimate(indicatorData: IndicatorData): number

// Data validation and processing
isOverbought(indicatorValue: number, indicatorName: string): boolean
isOversold(indicatorValue: number, indicatorName: string): boolean
extractIndicatorValue(data: IndicatorData, indicatorName: string): number
```

### TechnicalAnalysisAgent (AI Analyst)
**Role**: AI-powered interpretation and decision making

#### Responsibilities:
- **Data Interpretation**: Analyze technical data using AI reasoning
- **Trading Recommendations**: Generate BUY/SELL/HOLD decisions with confidence scores
- **Risk Assessment**: Evaluate market conditions and identify risk factors
- **Evidence Integration**: Connect technical signals with market evidence
- **Contextual Analysis**: Consider market sentiment, news, and broader context

#### Key Capabilities:
```typescript
// Data processing and AI analysis
processData(context: AgentContext): Promise<any>
buildSystemPrompt(context: AgentContext): string
buildUserPrompt(context: AgentContext, processedData?: any[]): string

// AI-generated outputs
{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "technical",
      "claim": "BUY|HOLD|SELL",
      "confidence": 0.85,
      "direction": "bullish|bearish|neutral",
      "magnitude": 0.7,
      "rationale": "Detailed reasoning based on technical analysis",
      "signals": [
        {"name": "rsi", "value": 38},
        {"name": "macd", "value": 0.15},
        {"name": "signal_strength", "value": 0.68}
      ],
      "evidence": ["evidence_id_1", "evidence_id_2"],
      "riskFlags": ["high_volatility", "weak_signals"]
    }
  ]
}
```

## Data Flow & Decision Process

### 1. Data Collection Phase
```typescript
// TechnicalAnalysisService fetches raw data
const technicalData = await technicalAnalysis.getTechnicalDataForAsset('BTC', '4h');
const { technical, metadata, news } = technicalData;
```

### 2. Mathematical Analysis Phase
```typescript
// TechnicalAnalysisService performs calculations
const signalStrength = technicalAnalysis.calculateSignalStrength(technical);
const targetLevels = technicalAnalysis.calculateTargetLevels(
  metadata.price,
  'BUY',
  signalStrength.strength,
  technical,
  0.02
);
```

### 3. AI Interpretation Phase
```typescript
// TechnicalAnalysisAgent receives processed data
const processedData = await agent.processData(context);
// AI analyzes the data and generates recommendations
const aiRecommendations = await agent.generateClaims(processedData);
```

### 4. Decision Integration Phase
```typescript
// Orchestrator combines AI recommendations with mathematical levels
const finalDecision = {
  recommendation: aiRecommendations.claim, // AI decision
  confidence: aiRecommendations.confidence, // AI confidence
  targetLevels: targetLevels, // Mathematical levels
  reasoning: aiRecommendations.rationale // AI reasoning
};
```

## AI Decision Making Process

### Technical Analysis Agent Responsibilities

#### 1. **Comprehensive Data Analysis**
The AI agent must analyze:
- **Technical Indicators**: RSI, MACD, Stochastic, Bollinger Bands, etc.
- **Signal Strength**: Weighted combination of all indicators
- **Market Context**: Volume, price action, market sentiment
- **Risk Factors**: Volatility, trend strength, conflicting signals

#### 2. **Confidence Scoring Algorithm**
```typescript
// AI confidence calculation (implemented in agent prompt)
Base confidence = signal_strength (0.4 to 1.0)
+ RSI bonus: If RSI < 30 or > 70, +15%
+ MACD bonus: If MACD absolute value > 100, +10%
+ Volatility bonus: If volatility > 0.5, +10%
+ Multiple indicators bonus: If 3+ indicators aligned, +15%
+ Signal strength bonus: If signal_strength absolute value > 0.3, +10%
Final confidence must be between 0.5 and 1.0
```

#### 3. **Decision Criteria**
```typescript
// AI decision logic
if (signalStrength > 0.3 && confidence > 0.6) {
  return 'BUY';
} else if (signalStrength < -0.3 && confidence > 0.6) {
  return 'SELL';
} else {
  return 'HOLD';
}
```

#### 4. **Required Output Format**
The AI agent MUST provide:

**TECHNICAL ANALYSIS SECTION:**
```
TECHNICAL ANALYSIS:
BTC shows neutral RSI at 35.17, indicating neither oversold nor overbought conditions. 
The MACD is bearish at -1251.71, suggesting downward momentum. 
Volatility is moderate at 0.3, indicating potential for significant moves. 
The signal strength is negative at -0.3, indicating weak technical momentum. 
Overall, the technical picture is mixed with bearish MACD but neutral RSI.
```

**JSON CLAIMS SECTION:**
```json
{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "technical",
      "claim": "SELL",
      "confidence": 0.75,
      "direction": "bearish",
      "magnitude": 0.6,
      "rationale": "Bearish MACD signal at -1251.71 combined with neutral RSI suggests downward momentum. Moderate volatility indicates potential for significant moves.",
      "signals": [
        {"name": "rsi", "value": 35.17},
        {"name": "macd", "value": -1251.71},
        {"name": "signal_strength", "value": -0.3}
      ],
      "evidence": ["evidence_id_1", "evidence_id_2"],
      "riskFlags": ["mixed_signals", "moderate_volatility"]
    }
  ]
}
```

## Key Features

### 1. Raw Data Processing
- **No Normalization**: Technical indicators are processed in their raw form without artificial normalization
- **Data Validation**: Only validates for invalid values (NaN, Infinity) but preserves original scale
- **Real Market Values**: Maintains actual market values for accurate analysis

### 2. Supported Indicators

#### Core Indicators
- **RSI (Relative Strength Index)**: 0-100 scale, overbought/oversold levels
- **MACD**: Raw values (can be hundreds/thousands), positive/negative signals
- **Stochastic**: 0-100 scale, momentum oscillator
- **Williams %R**: -100 to 0 scale, overbought/oversold
- **ADX (Average Directional Index)**: 0-100 scale, trend strength
- **CCI (Commodity Channel Index)**: Raw values, momentum indicator

#### Moving Averages
- **SMA20/50**: Simple Moving Averages
- **EMA20/50**: Exponential Moving Averages
- **HullMA9**: Hull Moving Average

#### Advanced Indicators
- **Bollinger Bands (BBPower)**: Raw values, price position relative to bands
- **Awesome Oscillator (AO)**: Raw values, momentum indicator
- **Ichimoku**: Raw values, trend and momentum

### 3. Signal Generation Logic

#### RSI Analysis
```typescript
// Overbought: > 70, Oversold: < 30
if (rsi > 70) signal = 'bearish';
else if (rsi < 30) signal = 'bullish';
```

#### MACD Analysis
```typescript
// Simple positive/negative signal
const signal = macdValue > 0 ? 'bullish' : 'bearish';
```

#### Bollinger Bands Analysis
```typescript
// BBPower > 1: Price above upper band (overbought)
// BBPower < 0: Price below lower band (oversold)
if (bbValue > 1) signal = 'bearish';
else if (bbValue < 0) signal = 'bullish';
```

#### ADX Trend Analysis
```typescript
// ADX > 25 indicates strong trend
if (adxValue > 25) {
  const diPlus = indicatorData['ADX+DI'] || 0;
  const diMinus = indicatorData['ADX-DI'] || 0;
  signal = diPlus > diMinus ? 'bullish' : 'bearish';
}
```

### 4. Signal Weights

```typescript
const SIGNAL_WEIGHTS = {
  RSI: 0.20,
  MACD: 0.25,
  STOCHASTIC: 0.15,
  WILLIAMS_R: 0.10,
  ADX: 0.15,
  BOLLINGER_BANDS: 0.15
};
```

### 5. Data Flow

1. **Raw Data Retrieval**: Get technical indicators from Signals API
2. **Data Validation**: Check for invalid values (NaN, Infinity)
3. **Signal Calculation**: Apply technical analysis logic to each indicator
4. **Weighted Aggregation**: Combine signals using predefined weights
5. **Final Score**: Generate overall technical score (-1 to 1)
6. **AI Interpretation**: AI agent analyzes results and generates recommendations
7. **Target Level Generation**: Calculate specific price levels for execution

### 6. Example Output

```typescript
// TechnicalAnalysisService output
{
  strength: 0.15, // Overall technical score
  signals: [
    {
      indicator: 'rsi',
      value: 38.61, // Raw RSI value
      signal: 'neutral',
      weight: 0.20
    },
    {
      indicator: 'macd',
      value: -394.2, // Raw MACD value
      signal: 'bearish',
      weight: 0.25
    },
    {
      indicator: 'bollinger_bands',
      value: -2955.5, // Raw BBPower value
      signal: 'bullish',
      weight: 0.15
    }
  ]
}

// TechnicalAnalysisAgent output
{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "technical",
      "claim": "HOLD",
      "confidence": 0.65,
      "direction": "neutral",
      "magnitude": 0.15,
      "rationale": "Mixed technical signals: bearish MACD (-394.2) but bullish Bollinger Bands position. RSI neutral at 38.61 suggests balanced momentum.",
      "signals": [
        {"name": "rsi", "value": 38.61},
        {"name": "macd", "value": -394.2},
        {"name": "signal_strength", "value": 0.15}
      ],
      "evidence": ["evidence_id_1", "evidence_id_2"],
      "riskFlags": ["mixed_signals", "low_conviction"]
    }
  ]
}
```

### 7. Integration with Agents

The service is used by the `TechnicalAnalysisAgent` to:
- Process raw technical data
- Generate trading signals
- Provide confidence scores
- Create comprehensive analysis summaries

### 8. Recent Improvements

#### Data Processing
- **Removed Artificial Normalization**: Values are now processed in their natural scale
- **Improved Validation**: Better handling of edge cases and invalid data
- **Real Market Values**: Preserves actual market conditions for accurate analysis

#### Signal Logic
- **Enhanced MACD Analysis**: Uses raw values for more accurate signals
- **Improved Bollinger Bands**: Better interpretation of BBPower values
- **Refined ADX Logic**: More sophisticated trend strength analysis

#### Risk Assessment
- **Better Risk Flags**: More accurate identification of technical risks
- **Improved Confidence**: More reliable confidence scoring
- **Enhanced Signal Strength**: Better weighted aggregation of indicators

#### Confidence Scoring Improvements
- **Higher Minimum Confidence**: 50% minimum (was lower)
- **RSI Bonus**: +15% confidence for extreme RSI values (<30 or >70)
- **MACD Bonus**: +10% confidence for strong MACD signals (>100 absolute)
- **Volatility Bonus**: +10% confidence for high volatility (>0.5)
- **Multiple Indicators Bonus**: +15% confidence for 3+ aligned indicators
- **Signal Strength Bonus**: +10% confidence for strong signals (>0.3 absolute)
- **Expected Results**: 50-90% confidence instead of 50%

## 🎯 Target Levels Generation

### Overview
The Technical Analysis Service now includes comprehensive target level generation for trading signals, providing specific price targets, stop-loss levels, and take-profit points based on technical analysis.

### Target Level Calculation Logic

#### **BUY Signal Levels:**
```typescript
// RSI-based adjustments
if (rsi < 30) {
  target_price = currentPrice * 1.05; // 5% target for oversold
  stop_loss = Math.min(currentPrice * 0.97, bbLower); // 3% stop or BB lower
} else if (rsi < 50) {
  target_price = currentPrice * 1.03; // 3% target for neutral-bullish
  stop_loss = currentPrice * 0.98; // 2% stop
} else {
  target_price = currentPrice * 1.02; // 2% target for neutral
  stop_loss = currentPrice * 0.99; // 1% stop
}

// MACD confirmation
if (macd > 0) {
  target_price *= 1.02; // Increase target by 2%
  confidence *= 1.1; // Increase confidence
}

// Moving average support
if (currentPrice > sma20 && sma20 > sma50) {
  target_price *= 1.01; // Increase target by 1%
  stop_loss = Math.max(stop_loss, sma20 * 0.98); // Use SMA20 as support
}
```

#### **SELL Signal Levels:**
```typescript
// RSI-based adjustments
if (rsi > 70) {
  target_price = currentPrice * 0.95; // 5% target for overbought
  stop_loss = Math.max(currentPrice * 1.03, bbUpper); // 3% stop or BB upper
} else if (rsi > 50) {
  target_price = currentPrice * 0.97; // 3% target for neutral-bearish
  stop_loss = currentPrice * 1.02; // 2% stop
} else {
  target_price = currentPrice * 0.98; // 2% target for neutral
  stop_loss = currentPrice * 1.01; // 1% stop
}

// MACD confirmation
if (macd < 0) {
  target_price *= 0.98; // Decrease target by 2%
  confidence *= 1.1; // Increase confidence
}
```

#### **ATR-Based Adjustments:**
```typescript
// ATR-based target levels (when ATR is available)
if (atr > 0) {
  const atrMultiplier = Math.min(3, Math.max(1, signalStrength * 4)); // 1-3x ATR
  target_price = currentPrice + (atr * atrMultiplier); // For BUY
  stop_loss = currentPrice - (atr * 1.5);
  take_profit = currentPrice + (atr * 4); // 4x ATR for take profit
}
```

#### **Volatility Adjustments:**
```typescript
// Volatility-based adjustments (fallback when ATR unavailable)
const volatilityMultiplier = 1 + (volatility * 5); // Reduced scaling
target_price *= volatilityMultiplier;
stop_loss = currentPrice - (currentPrice * volatility * 2); // Volatility-based stop
```

### Time Horizon Classification

#### **Signal Strength Based:**
- **Short Term** (`signalStrength > 0.7`): 1-7 days
- **Medium Term** (`signalStrength > 0.4`): 1-4 weeks
- **Long Term** (`signalStrength <= 0.4`): 1-3 months

### Confidence Calculation

#### **Base Confidence:**
```typescript
confidence = Math.min(0.95, Math.max(0.3, signalStrength * 1.2));
```

#### **Confidence Adjustments:**
- **MACD Confirmation**: +10% confidence
- **Moving Average Support**: +5% confidence
- **Weak Signals**: -20% confidence
- **Conflict Resolution**: -30% confidence

### Risk Management Features

#### **Input Validation:**
- Price validation (must be positive)
- Signal strength validation (0-1 range)
- Volatility validation (0-1 range)

#### **Level Validation:**
- Minimum price: 10% of current price
- Maximum price: 500% of current price
- Stop loss positioning (correct side of current price)
- Take profit positioning (beyond target price)

#### **Conflict Resolution:**
```typescript
// Detect conflicts between technical and consensus
if (technicalDirection !== consensus.signal_direction) {
  conflicts.push(`Technical analysis (${technicalDirection}) contradicts consensus (${consensus.signal_direction})`);
  
  // Adjust levels based on conflicts
  baseLevels.confidence *= 0.7; // Reduce confidence
  baseLevels.stop_loss *= 0.95; // Widen stop loss for BUY
  baseLevels.reasoning += ` Warning: ${conflicts.join(', ')}.`;
}
```

### Integration with Trading Pipeline

#### **Results Storage:**
Target levels are stored in the `results` table with:
- `target_price`: Primary price target
- `stop_loss`: Risk management level
- `take_profit`: Profit taking level
- `time_horizon`: Expected holding period
- `confidence`: Confidence in the levels
- `reasoning`: Detailed explanation

#### **Execution Integration:**
- Levels are used for order placement
- Stop-loss orders are automatically set
- Take-profit orders are configured
- Risk management is enforced

### Example Usage

```typescript
// Generate target levels for a BUY signal
const targetLevels = technicalService.calculateTargetLevels(
  currentPrice: 50000,
  signalDirection: 'BUY',
  signalStrength: 0.8,
  technicalData: indicatorData,
  volatility: 0.02
);

console.log('Target Levels:', {
  target_price: targetLevels.target_price,
  stop_loss: targetLevels.stop_loss,
  take_profit: targetLevels.take_profit,
  time_horizon: targetLevels.time_horizon,
  confidence: targetLevels.confidence,
  reasoning: targetLevels.reasoning
});
```

## Usage

```typescript
import { TechnicalAnalysisService } from '../services/technical-analysis.service.js';
import { TechnicalAnalysisAgent } from '../agents/implementations/technical-agent.js';

// Initialize services
const technicalService = new TechnicalAnalysisService();
const technicalAgent = new TechnicalAnalysisAgent();

// Get technical data
const analysis = await technicalService.getTechnicalDataForAsset('BTC', '4h');

// Get mathematical signal strength
const signalStrength = technicalService.calculateSignalStrength(analysis.technical);

// Get AI-generated recommendations
const aiRecommendations = await technicalAgent.processData({
  universe: ['BTC'],
  marketStats: [],
  riskProfile: 'neutral'
});

// Get target levels for execution
const targetLevels = technicalService.calculateTargetLevels(
  analysis.metadata.price,
  aiRecommendations[0].claim,
  Math.abs(signalStrength.strength),
  analysis.technical,
  0.02
);
```

## Configuration

The service uses predefined thresholds and weights that can be adjusted in:
- `src/types/index.ts` - Indicator thresholds
- `src/services/technical-analysis.service.ts` - Signal weights and logic
- `src/agents/implementations/technical-agent.ts` - AI prompt configuration

## Monitoring

Key metrics to monitor:
- Signal strength distribution
- Indicator value ranges
- Confidence score accuracy
- Processing time performance
- AI recommendation quality
- Target level accuracy

## Critical Issues Fixed

### 1. **Mock/Simplified Logic Removed**
- **Volatility Calculation**: Removed hardcoded 0.3 volatility in agent
- **Momentum Calculation**: Removed hardcoded 0.0 momentum in agent
- **Signal Processing**: Enhanced to use real mathematical calculations

### 2. **AI Role Clarification**
- **Decision Making**: AI agent is responsible for BUY/SELL/HOLD decisions
- **Mathematical Engine**: Service provides calculations, not decisions
- **Confidence Scoring**: AI implements sophisticated confidence algorithm
- **Evidence Integration**: AI connects technical signals with market evidence

### 3. **Data Flow Improvements**
- **Clear Separation**: Mathematical calculations vs AI interpretation
- **Proper Integration**: Service provides data, agent makes decisions
- **Target Level Generation**: Mathematical engine calculates execution levels
- **Risk Management**: Both components contribute to risk assessment
