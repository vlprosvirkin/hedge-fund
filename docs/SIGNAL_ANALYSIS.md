# Signal Analysis & Decision Making

## Understanding Low Scores

### Current Signal Analysis

В вашем раунде система показала следующие результаты:

```
🎯 FINAL DECISIONS:
1. ⏸️ ETH: -2.7% score
   🟡 51.9% confidence
2. ⏸️ BTC: -4.7% score
   🟡 55.3% confidence
```

### Why No Orders Were Executed

Система не выполнила ордера по следующим причинам:

#### 1. **Слабые сигналы**
- **ETH: -2.7%** - очень слабый медвежий сигнал
- **BTC: -4.7%** - слабый медвежий сигнал
- Пороговые значения для выполнения ордеров:
  - **BUY**: > +10% (для neutral risk profile)
  - **SELL**: < -10% (для neutral risk profile)

#### 2. **Недостаточная уверенность**
- **ETH: 51.9%** - ниже минимального порога 60%
- **BTC: 55.3%** - ниже минимального порога 60%
- Система требует минимум 60% уверенности для neutral risk profile

#### 3. **Фильтрация в buildTargetWeights**
```typescript
const qualifiedSignals = signalAnalyses
  .filter(signal => signal.recommendation !== 'HOLD' && signal.confidence >= 0.3)
  .slice(0, maxPositions);
```

### Risk Profile Thresholds

#### **Neutral Profile (текущий)**
```typescript
neutral: {
  buy: 0.1,     // BUY signal requires 10% positive score
  sell: -0.1,   // SELL signal requires 10% negative score
  minConfidence: 0.6,  // Minimum 60% confidence required
  maxRisk: 0.5   // Maximum 50% risk score allowed
}
```

#### **Conservative Profile**
```typescript
averse: {
  buy: 0.15,    // BUY signal requires 15% positive score
  sell: -0.15,  // SELL signal requires 15% negative score
  minConfidence: 0.7,  // Minimum 70% confidence required
  maxRisk: 0.3   // Maximum 30% risk score allowed
}
```

#### **Aggressive Profile**
```typescript
bold: {
  buy: 0.05,    // BUY signal requires 5% positive score
  sell: -0.05,  // SELL signal requires 5% negative score
  minConfidence: 0.5,  // Minimum 50% confidence required
  maxRisk: 0.7   // Maximum 70% risk score allowed
}
```

### Signal Strength Classification

| Score Range | Classification | Action |
|-------------|----------------|---------|
| +15% to +100% | Strong Bullish | BUY |
| +10% to +15% | Moderate Bullish | BUY (neutral profile) |
| +5% to +10% | Weak Bullish | HOLD (neutral), BUY (bold) |
| -5% to +5% | Neutral | HOLD |
| -10% to -5% | Weak Bearish | HOLD (neutral), SELL (bold) |
| -15% to -10% | Moderate Bearish | SELL (neutral profile) |
| -100% to -15% | Strong Bearish | SELL |

### Why Signals Are Weak

#### 1. **Market Conditions**
- Низкая волатильность
- Смешанные сигналы от агентов
- Неопределенность в рыночных условиях

#### 2. **Agent Disagreement**
- Агенты могут давать противоречивые сигналы
- Фундаментальный анализ: нейтральный
- Технический анализ: слабо медвежий
- Сентимент анализ: нейтральный

#### 3. **Data Quality**
- Недостаточно свежих новостей
- Слабые технические индикаторы
- Низкая ликвидность

### Improving Signal Quality

#### 1. **Adjust Risk Profile**
```typescript
// В config.ts измените riskProfile на 'bold' для более агрессивной торговли
riskProfile: 'bold'
```

#### 2. **Lower Confidence Thresholds**
```typescript
// Временное снижение порогов для тестирования
neutral: {
  buy: 0.05,     // Снизить с 0.1 до 0.05
  sell: -0.05,   // Снизить с -0.1 до -0.05
  minConfidence: 0.5,  // Снизить с 0.6 до 0.5
  maxRisk: 0.5
}
```

#### 3. **Improve Data Sources**
- Добавить больше источников новостей
- Улучшить технические индикаторы
- Увеличить частоту обновления данных

### Monitoring Signal Quality

#### **Signal Quality Metrics**
```typescript
const signalQuality = {
  dataCompleteness: 0.8,    // 80% данных доступно
  agentAgreement: 0.6,      // 60% согласия между агентами
  confidenceCalibration: 0.7, // 70% точность исторических прогнозов
  overallQuality: 0.7       // Общее качество сигнала
};
```

#### **Agent Contribution Analysis**
```typescript
const agentContributions = {
  fundamental: {
    signal: 0.1,      // Слабый бычий сигнал
    confidence: 0.6,  // 60% уверенность
    reasoning: "Stable fundamentals, moderate growth"
  },
  sentiment: {
    signal: -0.05,    // Слабый медвежий сигнал
    confidence: 0.5,  // 50% уверенность
    reasoning: "Mixed news sentiment"
  },
  technical: {
    signal: -0.1,     // Умеренный медвежий сигнал
    confidence: 0.7,  // 70% уверенность
    reasoning: "RSI oversold, MACD bearish crossover"
  }
};
```

### Next Steps

1. **Monitor for stronger signals** - система будет ждать более сильных сигналов
2. **Consider adjusting risk profile** - переключиться на 'bold' для более активной торговли
3. **Improve data quality** - добавить больше источников данных
4. **Review agent performance** - проанализировать качество работы агентов

### Expected Behavior

- **HOLD decisions** - нормальное поведение при слабых сигналах
- **No orders executed** - система защищает от убыточных сделок
- **Portfolio preservation** - консервативный подход сохраняет капитал
