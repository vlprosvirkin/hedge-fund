import { BaseAgent, type AgentContext } from '../base/base-agent.js';
import { Signals } from '../../adapters/signals-adapter.js';
import { TechnicalAnalysisService } from '../../services/analysis/technical-analysis.service.js';

export class TechnicalAnalysisAgent extends BaseAgent {
  private technicalIndicators: Signals;
  private technicalAnalysis: TechnicalAnalysisService;

  constructor(
    technicalIndicators?: Signals,
    technicalAnalysis?: TechnicalAnalysisService
  ) {
    super('technical');
    this.technicalIndicators = technicalIndicators || new Signals();
    this.technicalAnalysis = technicalAnalysis || new TechnicalAnalysisService();
  }

  async processData(context: AgentContext): Promise<any> {
    console.log(`🔍 Technical Analysis Agent: Processing data for universe: ${context.universe.join(', ')}`);

    // Get technical data using TechnicalAnalysisService
    const technicalData = await Promise.all(
      context.universe.map(async (ticker) => {
        try {
          console.log(`🔍 Technical Analysis Agent: Getting data for ${ticker}...`);

          // Get technical data using TechnicalAnalysisService
          const technicalData = await this.technicalAnalysis.getTechnicalDataForAsset(ticker, '4h');
          const technical = technicalData.technical;
          const metadata = technicalData.metadata;

          console.log(`🔍 Technical Analysis Agent: ${ticker} - Technical data received:`, !!technical);
          console.log(`🔍 Technical Analysis Agent: ${ticker} - Metadata received:`, !!metadata);

          // Use TechnicalAnalysisService to analyze the data
          const signalStrength = this.technicalAnalysis.calculateSignalStrength(technical);
          console.log(`🔍 Technical Analysis Agent: ${ticker} - Signal strength:`, signalStrength.strength);

          const result = {
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

          console.log(`🔍 Technical Analysis Agent: ${ticker} - Processed data:`, {
            price: result.price,
            rsi: result.rsi,
            macd: result.macd,
            signalStrength: result.signalStrength
          });

          return result;
        } catch (error) {
          console.error(`Failed to get technical data for ${ticker}:`, error);
          return { ticker, error: true };
        }
      })
    );

    console.log(`🔍 Technical Analysis Agent: Total processed data:`, technicalData.length);
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

    return `You are a TECHNICAL ANALYSIS analyst specializing in technical indicators.

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
- Base confidence = signal_strength (0.4 to 1.0)
- RSI bonus: If RSI < 30 or > 70, increase confidence by 15%
- MACD bonus: If MACD absolute value > 100, increase confidence by 10%
- Volatility bonus: If volatility > 0.5, increase confidence by 10%
- Multiple indicators bonus: If 3+ indicators aligned, increase confidence by 15%
- Signal strength bonus: If signal_strength absolute value > 0.3, increase confidence by 10%
- Final confidence must be between 0.5 and 1.0 (minimum 50% for any valid data)
- If insufficient data, return HOLD with confidence 0.2

IMPORTANT: Be more confident in your analysis. If you have clear technical data, use higher confidence scores (0.6-0.9). Only use low confidence (0.2-0.4) when indicators are truly conflicting or data is insufficient.

CALCULATE CONFIDENCE BASED ON:
- signal_strength: Use absolute value and direction
- RSI: Extreme values (>70 or <30) = higher confidence
- MACD: Strong positive/negative values = higher confidence
- Volatility: Higher = higher confidence (more decisive signals)
- Multiple indicators alignment: More aligned = higher confidence

TECHNICAL ANALYSIS SERVICE INTEGRATION:
- Use calculateSignalStrength() results for comprehensive analysis
- RSI thresholds: <30 (oversold), >70 (overbought)
- MACD analysis: Positive/negative values and crossovers
- Stochastic: <20 (oversold), >80 (overbought)
- Williams %R: <-80 (oversold), >-20 (overbought)
- Combine all indicators for weighted signal strength calculation

Risk profile: ${riskProfile} - ${this.getRiskProfileContext(riskProfile)}

STRICT RULES:
1. Use ONLY provided data and mathematical tools - no external knowledge
2. Claims must be timestamp-locked to provided data
3. Confidence must be between 0.1 and 1.0 based on technical signal strength
4. If insufficient data, return HOLD with confidence 0.2
5. Provide mathematical reasoning for each recommendation
6. REQUIRED: Each claim MUST include at least 1 technical evidence (RSI, MACD, BB, Stochastic) from indicators data
7. OPTIONAL: Include market evidence (volume, price) for additional context

CRITICAL: You MUST provide a detailed technical analysis BEFORE the JSON claims.
CRITICAL: For evidence field, use ONLY real evidence IDs from the provided context, NOT placeholder IDs like "evidence_id_1".
CRITICAL: Each claim MUST reference specific technical indicators (RSI, MACD, etc.) with exact values from the provided data.

OUTPUT FORMAT:
You MUST follow this exact format:

TECHNICAL ANALYSIS:
Provide a comprehensive technical analysis of each asset including:
- RSI interpretation (oversold/overbought levels)
- MACD signal analysis (bullish/bearish crossovers)
- Volatility assessment and risk implications
- Momentum indicators and trend strength
- Overall technical health and signal quality

For example:
"TECHNICAL ANALYSIS:
BTC shows neutral RSI at 35.17, indicating neither oversold nor overbought conditions. The MACD is bearish at -1251.71, suggesting downward momentum. Volatility is moderate at 0.3, indicating potential for significant moves. The signal strength is negative at -0.3, indicating weak technical momentum. Overall, the technical picture is mixed with bearish MACD but neutral RSI.

ETH displays neutral RSI at 45.26, suggesting balanced buying and selling pressure. The MACD is bearish at -25.05, indicating downward momentum. Volatility is moderate at 0.3, similar to BTC. The signal strength is negative at -0.3, indicating weak technical momentum. The technical indicators suggest a cautious approach with mixed signals.

Then provide the claims in JSON format:"

{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "technical",
      "claim": "BUY|HOLD|SELL",
      "confidence": 0.85,
      "direction": "bullish|bearish|neutral",
      "magnitude": 0.7,
      "rationale": "Brief reasoning for the recommendation",
      "signals": [
        {"name": "rsi", "value": 38},
        {"name": "macd", "value": 0.15},
        {"name": "volatility_30d", "value": 0.45},
        {"name": "sharpe_proxy", "value": 1.2},
        {"name": "signal_strength", "value": 0.68}
      ],
      "evidence": ["REAL_EVIDENCE_ID_1", "REAL_EVIDENCE_ID_2"],
      "riskFlags": ["high_volatility", "weak_signals"]
    }
  ]
}`;
  }

  buildUserPrompt(context: AgentContext, processedData?: any[]): string {
    console.log(`🔍 Technical Analysis Agent: Building prompt with ${processedData?.length || 0} processed data items`);
    console.log(`🔍 Technical Analysis Agent: Market stats count: ${context.marketStats?.length || 0}`);

    if (processedData) {
      processedData.forEach((data, index) => {
        console.log(`🔍 Technical Analysis Agent: Data ${index + 1} - ${data.ticker}:`, {
          hasError: data.error,
          price: data.price,
          rsi: data.rsi,
          macd: data.macd,
          signalStrength: data.signalStrength
        });
      });
    }

    return `ANALYSIS REQUEST:
Role: TECHNICAL ANALYSIS Analyst
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
