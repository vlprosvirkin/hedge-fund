import { BaseAgent, type AgentContext } from './base-agent.js';
import { TechnicalIndicatorsAdapter } from '../adapters/technical-indicators-adapter.js';
import { TechnicalAnalysisService } from '../services/technical-analysis.service.js';

export class FundamentalAgent extends BaseAgent {
  private technicalIndicators: TechnicalIndicatorsAdapter;
  private technicalAnalysis: TechnicalAnalysisService;

  constructor(
    technicalIndicators?: TechnicalIndicatorsAdapter,
    technicalAnalysis?: TechnicalAnalysisService
  ) {
    super('fundamental');
    this.technicalIndicators = technicalIndicators || new TechnicalIndicatorsAdapter();
    this.technicalAnalysis = technicalAnalysis || new TechnicalAnalysisService();
  }

  async processData(context: AgentContext): Promise<any> {
    // Get fundamental data using TechnicalAnalysisService
    const fundamentalData = await Promise.all(
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
            volume: metadata?.volume || 0,
            volatility: metadata?.changePercent ? Math.abs(metadata.changePercent) / 100 : 0,
            marketCap: metadata?.marketCap || 0,
            signalStrength: signalStrength.strength,
            technicalSignals: signalStrength.signals
          };
        } catch (error) {
          console.error(`Failed to get fundamental data for ${ticker}:`, error);
          return { ticker, error: true };
        }
      })
    );

    return fundamentalData;
  }

  buildSystemPrompt(context: AgentContext): string {
    const riskProfile = context.riskProfile || 'neutral';

    return `You are a FUNDAMENTAL analyst specializing in crypto market fundamentals.

ROLE: Evaluate asset quality and trend sustainability based on on-chain/market fundamentals and liquidity.

ANALYSIS CRITERIA:
- LIQUIDITY: High volume = better liquidity, lower spreads, more stable pricing
- VOLATILITY: High volatility = higher risk, potential for larger moves
- MARKET CAP: Larger market cap = more stable, institutional interest
- SIGNAL STRENGTH: Technical indicators suggesting trend direction
- VOLUME: Higher volume = stronger price action confirmation
- TREND SUSTAINABILITY: Structural analysis of price movements

CONFIDENCE SCORING:
- 0.8-1.0: Strong positive signals (trend_strength > 0.5, high liquidity, low volatility)
- 0.6-0.7: Good positive signals (trend_strength > 0.2, adequate liquidity)
- 0.4-0.5: Mixed signals (trend_strength between -0.2 and 0.2, moderate confidence)
- 0.2-0.3: Weak negative signals (trend_strength < -0.2, low confidence)
- 0.1-0.2: Very weak signals (trend_strength < -0.5, minimal confidence)

IMPORTANT: Be more confident in your analysis. If you have clear data, use higher confidence scores (0.6-0.8). Only use low confidence (0.2-0.4) when data is truly insufficient or contradictory.

CALCULATE CONFIDENCE BASED ON:
- trend_strength: Use absolute value and direction
- liquidity_score: Higher = higher confidence
- volatility: Lower = higher confidence (for stability)
- volume: Higher = higher confidence

TECHNICAL ANALYSIS INTEGRATION:
- Use signal_strength from TechnicalAnalysisService for trend direction
- RSI values: <30 (oversold) = bullish, >70 (overbought) = bearish
- MACD values: Positive = bullish momentum, Negative = bearish momentum
- Volatility: Higher volatility = higher potential for large moves
- Combine fundamental data with technical signals for comprehensive analysis

Risk profile: ${riskProfile} - ${this.getRiskProfileContext(riskProfile)}

STRICT RULES:
1. Use ONLY provided data and tools - no external knowledge
2. Claims must be timestamp-locked to provided data
3. Confidence must be between 0.1 and 1.0 based on signal strength
4. If insufficient data, return HOLD with confidence 0.2
5. Provide specific reasoning for each recommendation
6. REQUIRED: Each claim MUST include at least 1 market evidence (vol24h, spread_bps, vwap) from Binance data
7. OPTIONAL: Include technical evidence (RSI, MACD) for additional support

CRITICAL: You MUST provide a detailed text analysis BEFORE the JSON claims.
CRITICAL: For evidence field, use ONLY real evidence IDs from the provided context, NOT placeholder IDs like "evidence_id_1".
CRITICAL: Each claim MUST reference specific market metrics (volume, spread, price) from the provided data.

OUTPUT FORMAT:
You MUST follow this exact format:

FUNDAMENTAL ANALYSIS:
Provide a comprehensive analysis of each asset's fundamentals including:
- Liquidity assessment and volume analysis
- Volatility patterns and risk assessment
- Market cap implications and institutional interest
- Trend sustainability and signal strength evaluation
- Overall fundamental health and investment thesis

For example:
"FUNDAMENTAL ANALYSIS:
BTC shows excellent liquidity with high volume and low volatility, indicating stable pricing and institutional interest. The market cap suggests strong fundamentals, but the negative trend strength indicates potential headwinds. Overall, the asset shows mixed signals with strong fundamentals but weak technical momentum.

ETH demonstrates good liquidity with moderate volatility, suggesting healthy market activity. The market cap indicates solid institutional backing, but the negative trend strength raises concerns about short-term direction. The fundamentals are sound but technical momentum is weak."

Then provide the claims in JSON format:

{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "fundamental",
      "claim": "BUY|HOLD|SELL",
      "confidence": 0.85,
      "direction": "bullish|bearish|neutral",
      "magnitude": 0.7,
      "rationale": "Brief reasoning for the recommendation",
      "signals": [
        {"name": "liquidity_score", "value": 0.72},
        {"name": "volatility", "value": 0.55},
        {"name": "trend_strength", "value": 0.68}
      ],
      "evidence": ["REAL_EVIDENCE_ID_1", "REAL_EVIDENCE_ID_2"],
      "riskFlags": ["high_volatility", "low_liquidity"]
    }
  ]
}`;
  }

  buildUserPrompt(context: AgentContext, processedData?: any[]): string {
    return `ANALYSIS REQUEST:
Role: FUNDAMENTAL Analyst
Risk Profile: ${context.riskProfile}
Timestamp: ${context.timestamp}
Universe: ${context.universe.join(', ')}

FUNDAMENTAL DATA:
Market Statistics:
${context.marketStats.map((stat: any) =>
      `• ${stat.symbol}: Volume=${stat.volume24h}, Price=${stat.price}, Volatility=${stat.volatility || 'N/A'}`
    ).join('\n')}

PROCESSED TECHNICAL DATA:
${processedData ? processedData.map((data: any) =>
      `• ${data.ticker}: Price=${data.price}, Volume=${data.volume}, Volatility=${data.volatility}, SignalStrength=${data.signalStrength}, MarketCap=${data.marketCap}`
    ).join('\n') : 'No processed data available'}

TECHNICAL SIGNALS:
${processedData ? processedData.map((data: any) =>
      `• ${data.ticker}: ${data.technicalSignals ? data.technicalSignals.map((signal: any) => `${signal.indicator}=${signal.value}(${signal.signal})`).join(', ') : 'No signals'}`
    ).join('\n') : 'No signals available'}

FUNDAMENTAL ANALYSIS BREAKDOWN:
${processedData ? processedData.map((data: any) => {
      const signalStrength = data.signalStrength || 0;
      const volatility = data.volatility || 0;
      const volume = data.volume || 0;
      const liquidityScore = volume > 0 ? Math.min(1, volume / 1000000) : 0; // Normalize volume
      const trendStrength = Math.abs(signalStrength);

      return `• ${data.ticker}: 
  - Signal Strength: ${signalStrength.toFixed(3)}
  - Volatility: ${volatility.toFixed(3)}
  - Liquidity Score: ${liquidityScore.toFixed(3)}
  - Trend Strength: ${trendStrength.toFixed(3)}
  - Volume: ${volume.toLocaleString()}`;
    }).join('\n') : 'No fundamental breakdown available'}

INSTRUCTIONS:
1. Analyze the provided data using your specialized expertise
2. Generate claims for each ticker in the universe
3. Use only the provided data and calculations - no external knowledge
4. If data is insufficient, return HOLD with confidence 0.2
5. Provide reasoning for each recommendation

CRITICAL: You MUST provide a detailed fundamental analysis in plain text BEFORE the JSON claims.
CRITICAL: Follow the exact format shown in the system prompt.`;
  }
}
