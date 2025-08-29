# Methodology & Decision-Making Framework

This document provides a comprehensive overview of the mathematical models, algorithms, and decision-making processes used in the hedge fund system.

## 🎯 Overview

The system implements a **multi-agent consensus framework** that combines fundamental analysis, sentiment analysis, and technical analysis to generate trading decisions. Each agent specializes in a specific domain and contributes to the final consensus through weighted aggregation.

## 📊 Agent Architecture & Weights

### Agent Distribution
```
📊 Fundamental Agent: 30% weight
📰 Sentiment Agent: 30% weight  
📈 Technical Agent: 40% weight
```

### Weight Rationale
- **Technical Agent (40%)**: Most reliable for short-term price movements
- **Fundamental Agent (30%)**: Important for long-term value assessment
- **Sentiment Agent (30%)**: Captures market psychology and news impact

## 🔬 Mathematical Models

### 1. Signal Calculation Framework

#### Base Signal Formula
```typescript
// Base signal from agent confidence and direction
const baseSignal = agentConfidence * directionMultiplier;

// Direction multipliers
const directionMultipliers = {
  'BUY': 1.0,
  'HOLD': 0.0, 
  'SELL': -1.0
};
```

#### Weighted Consensus Formula
```typescript
// Final consensus score
const finalScore = (
  fundamentalSignal * 0.30 +
  sentimentSignal * 0.30 + 
  technicalSignal * 0.40
);

// Decision thresholds
const decisionThresholds = {
  BUY: 0.3,    // Strong bullish signal
  SELL: -0.3,  // Strong bearish signal
  HOLD: [-0.3, 0.3] // Neutral zone
};
```

### 2. Confidence Scoring

#### Fundamental Agent Confidence
```typescript
// Confidence based on data quality and market conditions
const fundamentalConfidence = (
  volumeScore * 0.4 +
  liquidityScore * 0.3 +
  volatilityScore * 0.3
);

// Volume score (0-1)
const volumeScore = Math.min(marketVolume / 1000000, 1.0);

// Liquidity score (0-1) 
const liquidityScore = Math.max(0, 1 - (bidAskSpread / 100));

// Volatility score (0-1) - lower volatility = higher confidence
const volatilityScore = Math.max(0, 1 - (dailyVolatility / 50));
```

#### Sentiment Agent Confidence
```typescript
// Confidence based on news coverage and sentiment consistency
const sentimentConfidence = (
  coverageScore * 0.4 +
  consistencyScore * 0.3 +
  freshnessScore * 0.3
);

// Coverage score (0-1)
const coverageScore = Math.min(newsCount / 20, 1.0);

// Consistency score (0-1) - agreement across sources
const consistencyScore = 1 - sentimentStandardDeviation;

// Freshness score (0-1) - recent news weighted higher
const freshnessScore = Math.exp(-hoursSinceLatestNews / 24);
```

#### Technical Agent Confidence
```typescript
// Confidence based on indicator agreement and signal strength
const technicalConfidence = (
  indicatorAgreement * 0.4 +
  signalStrength * 0.3 +
  trendConsistency * 0.3
);

// Indicator agreement (0-1) - how many indicators agree
const indicatorAgreement = agreeingIndicators / totalIndicators;

// Signal strength (0-1) - magnitude of technical signals
const signalStrength = Math.abs(rsiSignal + macdSignal + bollingerSignal) / 3;

// Trend consistency (0-1) - consistency across timeframes
const trendConsistency = 1 - trendStandardDeviation;
```

### 3. Risk Assessment Models

#### Position Risk Score
```typescript
// Comprehensive risk assessment
const riskScore = (
  volatilityRisk * 0.3 +
  liquidityRisk * 0.25 +
  correlationRisk * 0.25 +
  concentrationRisk * 0.2
);

// Volatility risk (0-1)
const volatilityRisk = Math.min(dailyVolatility / 50, 1.0);

// Liquidity risk (0-1)
const liquidityRisk = Math.min(bidAskSpread / 5, 1.0);

// Correlation risk (0-1) - portfolio correlation penalty
const correlationRisk = portfolioCorrelation * 0.5;

// Concentration risk (0-1) - position size relative to portfolio
const concentrationRisk = positionValue / portfolioValue;
```

#### Kelly Criterion Position Sizing
```typescript
// Kelly Criterion: f = μ / σ²
// where μ = expected return, σ = volatility
const kellyFraction = expectedReturn / (volatility * volatility);

// Conservative Kelly (half Kelly for safety)
const conservativeKelly = kellyFraction * 0.5;

// Expected return calculation
const expectedReturn = signalStrength * maxExpectedReturn * confidenceMultiplier;

// Volatility estimation
const volatility = Math.max(
  historicalVolatility,
  impliedVolatility,
  minimumVolatility
);
```

## 📈 Technical Indicators

### 1. RSI (Relative Strength Index)
```typescript
// RSI calculation (14-period)
const rsi = 100 - (100 / (1 + (avgGain / avgLoss)));

// RSI signal interpretation
const rsiSignal = {
  'Extremely Oversold': rsi < 20,  // Strong buy signal
  'Oversold': rsi < 30,           // Moderate buy signal  
  'Neutral': rsi >= 30 && rsi <= 70, // No clear signal
  'Overbought': rsi > 70,         // Moderate sell signal
  'Extremely Overbought': rsi > 80 // Strong sell signal
};
```

### 2. MACD (Moving Average Convergence Divergence)
```typescript
// MACD calculation
const macd = ema12 - ema26;
const signalLine = ema(macd, 9);
const histogram = macd - signalLine;

// MACD signal interpretation
const macdSignal = {
  'Bullish': macd > signalLine && histogram > 0,
  'Bearish': macd < signalLine && histogram < 0,
  'Neutral': Math.abs(macd - signalLine) < threshold
};
```

### 3. Bollinger Bands
```typescript
// Bollinger Bands calculation
const middleBand = sma(20);
const upperBand = middleBand + (2 * standardDeviation);
const lowerBand = middleBand - (2 * standardDeviation);

// Bollinger Bands signal interpretation
const bollingerSignal = {
  'Oversold': price < lowerBand,
  'Overbought': price > upperBand,
  'Neutral': price >= lowerBand && price <= upperBand
};
```

## 🧠 Sentiment Analysis

### 1. News Sentiment Processing
```typescript
// Sentiment score calculation
const sentimentScore = (
  positiveNews * 1.0 +
  neutralNews * 0.5 +
  negativeNews * 0.0
) / totalNews;

// Sentiment classification
const sentimentClassification = {
  'Very Bullish': sentimentScore > 0.7,
  'Bullish': sentimentScore > 0.6,
  'Neutral': sentimentScore >= 0.4 && sentimentScore <= 0.6,
  'Bearish': sentimentScore < 0.4,
  'Very Bearish': sentimentScore < 0.3
};
```

### 2. Social Media Sentiment
```typescript
// Social sentiment aggregation
const socialSentiment = (
  twitterSentiment * 0.4 +
  redditSentiment * 0.3 +
  telegramSentiment * 0.3
);

// Volume-weighted sentiment
const volumeWeightedSentiment = 
  socialSentiment * Math.log(socialVolume + 1);
```

## 🔄 Consensus Building Process

### 1. Claim Aggregation
```typescript
// Weighted consensus calculation
const consensusScore = claims.reduce((score, claim) => {
  const weight = claim.confidence * getAgentWeight(claim.agentRole);
  return score + (claim.signal * weight);
}, 0) / totalWeight;

// Agent weights
const agentWeights = {
  fundamental: 0.30,
sentiment: 0.30,
technical: 0.40
};
```

### 2. Conflict Detection
```typescript
// Conflict detection algorithm
const detectConflicts = (claims) => {
  const conflicts = [];
  
  claims.forEach((claim1, i) => {
    claims.slice(i + 1).forEach(claim2 => {
      if (claim1.ticker === claim2.ticker) {
        const directionConflict = claim1.claim !== claim2.claim;
        const magnitudeConflict = Math.abs(claim1.confidence - claim2.confidence) > 0.3;
        
        if (directionConflict || magnitudeConflict) {
          conflicts.push({
            ticker: claim1.ticker,
            claim1: claim1.claim,
            claim2: claim2.claim,
            severity: directionConflict ? 'high' : 'medium'
          });
        }
      }
    });
  });
  
  return conflicts;
};
```

### 3. Final Decision Logic
```typescript
// Decision thresholds by risk profile
const decisionThresholds = {
  averse: {
    buy: 0.4,
    sell: -0.4,
    minConfidence: 0.7,
    maxRisk: 0.3
  },
  neutral: {
    buy: 0.3,
    sell: -0.3,
    minConfidence: 0.6,
    maxRisk: 0.5
  },
  bold: {
    buy: 0.2,
    sell: -0.2,
    minConfidence: 0.5,
    maxRisk: 0.7
  }
};

// Final decision algorithm
const makeDecision = (consensusScore, confidence, riskScore, riskProfile) => {
  const thresholds = decisionThresholds[riskProfile];
  
  // Check confidence threshold
  if (confidence < thresholds.minConfidence) {
    return 'HOLD';
  }
  
  // Check risk threshold
  if (riskScore > thresholds.maxRisk) {
    return 'HOLD';
  }
  
  // Check signal thresholds
  if (consensusScore > thresholds.buy) {
    return 'BUY';
  } else if (consensusScore < thresholds.sell) {
    return 'SELL';
  } else {
    return 'HOLD';
  }
};
```

## 📊 Performance Metrics

### 1. Signal Quality Assessment
```typescript
// Signal quality score
const signalQuality = (
  dataCompleteness * 0.3 +
  agentAgreement * 0.3 +
  confidenceCalibration * 0.4
);

// Data completeness (0-1)
const dataCompleteness = availableDataPoints / requiredDataPoints;

// Agent agreement (0-1)
const agentAgreement = 1 - standardDeviation(agentSignals);

// Confidence calibration (0-1)
const confidenceCalibration = 1 - Math.abs(confidence - historicalAccuracy);
```

### 2. Risk-Adjusted Returns
```typescript
// Sharpe Ratio
const sharpeRatio = (return - riskFreeRate) / volatility;

// Sortino Ratio
const sortinoRatio = (return - riskFreeRate) / downsideDeviation;

// Calmar Ratio
const calmarRatio = annualReturn / maxDrawdown;
```

### 3. Portfolio Optimization
```typescript
// Portfolio risk calculation
const portfolioRisk = Math.sqrt(
  weights.transpose() * covarianceMatrix * weights
);

// Maximum Sharpe Ratio portfolio
const maxSharpePortfolio = optimize(
  (weights) => sharpeRatio(weights),
  constraints: {
    sum(weights) = 1,
    weights >= 0,
    portfolioRisk <= maxRisk
  }
);
```

## 🎯 Decision Quality Framework

### 1. Signal Strength Classification
- **Strong Signals (|signal| > 0.4)**: Clear directional bias with high confidence
- **Moderate Signals (0.2 < |signal| < 0.4)**: Mixed indicators with moderate confidence
- **Weak Signals (|signal| < 0.2)**: Insufficient conviction for directional trade

### 2. Confidence Calibration
- **Overconfident**: Historical accuracy < confidence
- **Well Calibrated**: Historical accuracy ≈ confidence
- **Underconfident**: Historical accuracy > confidence

### 3. Risk Management
- **Position Limits**: Maximum position size based on risk profile
- **Portfolio Limits**: Maximum portfolio concentration
- **Correlation Limits**: Maximum correlation between positions
- **Volatility Limits**: Maximum portfolio volatility

## 🔬 Validation & Backtesting

### 1. Historical Performance
```typescript
// Backtesting framework
const backtestResults = {
  totalReturn: 0,
  sharpeRatio: 0,
  maxDrawdown: 0,
  winRate: 0,
  profitFactor: 0,
  averageWin: 0,
  averageLoss: 0
};

// Walk-forward analysis
const walkForwardAnalysis = (data, windowSize, stepSize) => {
  const results = [];
  
  for (let i = windowSize; i < data.length; i += stepSize) {
    const trainingData = data.slice(i - windowSize, i);
    const testData = data.slice(i, i + stepSize);
    
    const model = trainModel(trainingData);
    const predictions = model.predict(testData);
    const performance = calculatePerformance(predictions, testData);
    
    results.push(performance);
  }
  
  return aggregateResults(results);
};
```

### 2. Stress Testing
```typescript
// Stress test scenarios
const stressScenarios = [
  'Market Crash (-50% in 1 day)',
  'High Volatility (3x normal volatility)',
  'Liquidity Crisis (10x normal spreads)',
  'Correlation Breakdown (all assets move together)',
  'Flash Crash (-20% in 5 minutes)'
];

// Monte Carlo simulation
const monteCarloSimulation = (iterations, timeHorizon) => {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const scenario = generateRandomScenario();
    const performance = simulatePerformance(scenario, timeHorizon);
    results.push(performance);
  }
  
  return {
    mean: calculateMean(results),
    stdDev: calculateStdDev(results),
    var95: calculateVaR(results, 0.95),
    cvar95: calculateCVaR(results, 0.95)
  };
};
```

## 📈 Continuous Improvement

### 1. Model Validation
- **Out-of-Sample Testing**: Validate on unseen data
- **Cross-Validation**: K-fold cross-validation for robustness
- **Bootstrap Analysis**: Confidence intervals for model parameters

### 2. Adaptive Learning
```typescript
// Performance tracking
const performanceTracking = {
  agentAccuracy: {},
  signalQuality: {},
  confidenceCalibration: {},
  riskAdjustment: {}
};

// Dynamic weight adjustment
const adjustWeights = (performance, lookbackPeriod) => {
  const recentPerformance = performance.slice(-lookbackPeriod);
  const agentAccuracy = calculateAgentAccuracy(recentPerformance);
  
  return normalizeWeights(agentAccuracy);
};
```

### 3. Parameter Optimization
```typescript
// Bayesian optimization for hyperparameters
const optimizeParameters = (objectiveFunction, parameterSpace) => {
  const optimizer = new BayesianOptimizer(parameterSpace);
  
  return optimizer.maximize(objectiveFunction, {
    maxIterations: 100,
    acquisitionFunction: 'expectedImprovement'
  });
};
```

This methodology provides a robust, mathematically sound framework for making trading decisions while maintaining transparency and accountability throughout the process.
