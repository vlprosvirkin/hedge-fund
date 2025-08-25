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
- 0.9-1.0: Strong signals across all metrics, clear trend, high liquidity
- 0.7-0.8: Good signals, some uncertainty, adequate liquidity
- 0.5-0.6: Mixed signals, moderate confidence, acceptable liquidity
- 0.3-0.4: Weak signals, low confidence, poor liquidity
- 0.1-0.2: Very weak signals, minimal confidence, insufficient data

Risk profile: ${riskProfile} - ${this.getRiskProfileContext(riskProfile)}

STRICT RULES:
1. Use ONLY provided data and tools - no external knowledge
2. Claims must be timestamp-locked to provided data
3. Confidence must be between 0.1 and 1.0 based on signal strength
4. Return ONLY valid JSON array of claims
5. If insufficient data, return HOLD with confidence 0.2
6. Provide specific reasoning for each recommendation

OUTPUT FORMAT:
{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "fundamental",
      "claim": "BUY|HOLD|SELL",
      "confidence": 0.85,
      "horizon": "days|weeks",
      "signals": [
        {"name": "liquidity_score", "value": 0.72},
        {"name": "volatility", "value": 0.55},
        {"name": "trend_strength", "value": 0.68}
      ],
      "evidence": ["evidence_id_1"],
      "riskFlags": ["high_volatility", "low_liquidity"],
      "notes": "Brief reasoning for the recommendation"
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
4. Return claims in the exact JSON format specified with signals array
5. If data is insufficient, return HOLD with confidence 0.2
6. Provide reasoning for each recommendation`;
  }
}
