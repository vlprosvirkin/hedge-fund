import { BaseAgent, type AgentContext } from './base-agent.js';
import { TechnicalIndicatorsAdapter } from '../adapters/technical-indicators-adapter.js';
import { TechnicalAnalysisService } from '../services/technical-analysis.service.js';

export class ValuationAgent extends BaseAgent {
  private technicalIndicators: TechnicalIndicatorsAdapter;
  private technicalAnalysis: TechnicalAnalysisService;

  constructor(
    technicalIndicators?: TechnicalIndicatorsAdapter,
    technicalAnalysis?: TechnicalAnalysisService
  ) {
    super('valuation');
    this.technicalIndicators = technicalIndicators || new TechnicalIndicatorsAdapter();
    this.technicalAnalysis = technicalAnalysis || new TechnicalAnalysisService();
  }

  async processData(context: AgentContext): Promise<any> {
    // Get technical data using TechnicalAnalysisService
    const technicalData = await Promise.all(
      context.universe.map(async (ticker) => {
        try {
          // Get technical data and create comprehensive analysis
          const [technical, metadata] = await Promise.all([
            this.technicalIndicators.getTechnicalIndicators(ticker, '4h'),
            this.technicalIndicators.getAssetMetadata(ticker, '4h')
          ]);

          // Use TechnicalAnalysisService to analyze the data
          const signalStrength = this.technicalAnalysis.calculateSignalStrength(technical);

          return {
            ticker,
            price: metadata?.price || 0,
            indicators: technical,
            rsi: technical?.RSI,
            macd: technical?.['MACD.macd'],
            bollingerBands: technical?.BBPower,
            stochastic: technical?.['Stoch.K'],
            signalStrength: signalStrength.strength,
            technicalSignals: signalStrength.signals,
            volatility: this.calculateVolatility(metadata?.price || 0),
            momentum: this.calculateMomentum(metadata?.price || 0)
          };
        } catch (error) {
          console.error(`Failed to get technical data for ${ticker}:`, error);
          return { ticker, error: true };
        }
      })
    );

    return technicalData;
  }

  private calculateVolatility(price: number): number {
    // TODO: Implement proper volatility calculation using historical price data
    // For now, return a conservative estimate based on market conditions
    // This should be replaced with actual historical volatility calculation
    return 0.3; // Conservative 30% volatility estimate
  }

  private calculateMomentum(price: number): number {
    // TODO: Implement proper momentum calculation using price changes over time
    // For now, return neutral momentum
    // This should be replaced with actual momentum calculation
    return 0.0; // Neutral momentum
  }

  buildSystemPrompt(context: AgentContext): string {
    const riskProfile = context.riskProfile || 'neutral';

    return `You are a VALUATION/TECHNICAL analyst specializing in technical indicators.

ROLE: Technical evaluation of assets using mathematical indicators and volatility calculations.

MATHEMATICAL TOOLS (use these calculations):
- VOLATILITY (σ): Calculate standard deviation of returns over 30-90 day windows
- RETURNS: Calculate price returns over different timeframes
- SHARPE-PROXY: Risk-adjusted returns (return/volatility)
- MOMENTUM: Price momentum indicators and mean-reversion signals
- SIGNAL STRENGTH: Weighted combination of technical indicators

TECHNICAL ANALYSIS CRITERIA:
- RSI: >70 = overbought (SELL), <30 = oversold (BUY), 30-70 = neutral
- MACD: Positive = bullish (BUY), Negative = bearish (SELL)
- Bollinger Bands: Price near upper band = overbought, near lower = oversold
- Stochastic: >80 = overbought, <20 = oversold
- Williams %R: >-20 = overbought, <-80 = oversold
- CCI: >100 = overbought, <-100 = oversold
- Signal Strength: Higher values = stronger technical signals
- Volatility: Higher volatility = more potential for large moves

CONFIDENCE SCORING:
- 0.9-1.0: Multiple strong technical signals aligned, clear mathematical evidence
- 0.7-0.8: Good technical signals with mathematical confirmation
- 0.5-0.6: Mixed technical signals, moderate mathematical evidence
- 0.3-0.4: Weak technical signals, limited mathematical evidence
- 0.1-0.2: Very weak signals, insufficient mathematical data

Risk profile: ${riskProfile} - ${this.getRiskProfileContext(riskProfile)}

STRICT RULES:
1. Use ONLY provided data and mathematical tools - no external knowledge
2. Claims must be timestamp-locked to provided data
3. Confidence must be between 0.1 and 1.0 based on technical signal strength
4. Return ONLY valid JSON array of claims
5. If insufficient data, return HOLD with confidence 0.2
6. Provide mathematical reasoning for each recommendation

OUTPUT FORMAT:
{
  "claims": [
    {
      "id": "unique_id",
      "ticker": "BTC",
      "agentRole": "valuation",
      "claim": "BUY|HOLD|SELL",
      "confidence": 0.85,
      "horizon": "days|weeks",
      "signals": [
        {"name": "rsi", "value": 38},
        {"name": "macd", "value": 0.15},
        {"name": "volatility_30d", "value": 0.45},
        {"name": "sharpe_proxy", "value": 1.2},
        {"name": "signal_strength", "value": 0.68}
      ],
      "evidence": ["evidence_id_1"],
      "timestamp": ${context.timestamp},
      "riskFlags": ["high_volatility", "weak_signals"],
      "notes": "Brief reasoning for the recommendation"
    }
  ]
}`;
  }

  buildUserPrompt(context: AgentContext, processedData?: any[]): string {
    return `ANALYSIS REQUEST:
Role: VALUATION/TECHNICAL Analyst
Risk Profile: ${context.riskProfile}
Timestamp: ${context.timestamp}
Universe: ${context.universe.join(', ')}

TECHNICAL DATA:
Market Statistics:
${context.marketStats.map((stat: any) =>
      `• ${stat.symbol}: Price=${stat.price}, Volume=${stat.volume24h}`
    ).join('\n')}

PROCESSED TECHNICAL DATA:
${processedData ? processedData.map((data: any) =>
      `• ${data.ticker}: Price=${data.price}, RSI=${data.rsi}, MACD=${data.macd}, BollingerBands=${data.bollingerBands}, Stochastic=${data.stochastic}, SignalStrength=${data.signalStrength}, Volatility=${data.volatility}, Momentum=${data.momentum}`
    ).join('\n') : 'No processed data available'}

TECHNICAL INDICATORS:
${processedData ? processedData.map((data: any) =>
      `• ${data.ticker}: ${data.technicalSignals ? data.technicalSignals.map((signal: any) => `${signal.indicator}=${signal.value}(${signal.signal})`).join(', ') : 'No signals'}`
    ).join('\n') : 'No signals available'}

INDICATOR VALUES:
${processedData ? processedData.map((data: any) =>
      `• ${data.ticker}: ${data.indicators ? Object.entries(data.indicators).slice(0, 5).map(([key, value]) => `${key}=${value}`).join(', ') : 'No indicators'}`
    ).join('\n') : 'No indicators available'}

MATHEMATICAL CALCULATIONS:
${processedData ? processedData.map((data: any) => {
      const signalStrength = data.signalStrength || 0;
      const volatility = data.volatility || 0;
      const sharpeProxy = volatility > 0 ? (signalStrength / volatility) : 0;
      
      return `• ${data.ticker}: 
  - Signal Strength: ${signalStrength.toFixed(3)}
  - Volatility (σ): ${volatility.toFixed(3)}
  - Sharpe Proxy: ${sharpeProxy.toFixed(3)}
  - Momentum: ${data.momentum ? data.momentum.toFixed(3) : 'N/A'}`;
    }).join('\n') : 'No mathematical data available'}

INSTRUCTIONS:
1. Analyze the provided data using your specialized expertise and mathematical tools
2. Generate claims for each ticker in the universe
3. Use only the provided data and calculations - no external knowledge
4. Return claims in the exact JSON format specified with signals array
5. If data is insufficient, return HOLD with confidence 0.2
6. Provide mathematical reasoning for each recommendation`;
  }
}
