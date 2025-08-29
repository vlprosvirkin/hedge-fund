import { BaseAgent, type AgentContext } from '../base/base-agent.js';
import { FundamentalAnalysisService } from '../../services/analysis/fundamental-analysis.service.js';
import { BinanceAdapter } from '../../adapters/binance-adapter.js';
import { CMCAdapter } from '../../adapters/cmc-adapter.js';

export class FundamentalAgent extends BaseAgent {
  private fundamentalAnalysis: FundamentalAnalysisService;
  private binanceAdapter: BinanceAdapter;
  private cmcAdapter: CMCAdapter;

  constructor(fundamentalAnalysis?: FundamentalAnalysisService) {
    super('fundamental');
    this.fundamentalAnalysis = fundamentalAnalysis || new FundamentalAnalysisService();
    this.binanceAdapter = new BinanceAdapter();
    this.cmcAdapter = new CMCAdapter();
  }

  async processData(context: AgentContext): Promise<any> {
    console.log(`🔍 FundamentalAgent: Processing data for universe: ${context.universe.join(', ')}`);

    // Get comprehensive fundamental data
    const fundamentalData = await Promise.all(
      context.universe.map(async (ticker) => {
        try {
          console.log(`🔍 FundamentalAgent: Step 1 - Starting analysis for ${ticker}`);

          // Step 2: Get fundamental data from FundamentalAnalysisService
          console.log(`🔍 FundamentalAgent: Step 2 - Getting fundamental data for ${ticker}`);

          const fundamentalDataResult = await this.fundamentalAnalysis.getFundamentalDataForAsset(ticker, '4h');

          // Step 3: Get market data from Binance
          console.log(`🔍 FundamentalAgent: Step 3 - Getting market data for ${ticker}`);

          const [marketDataResult, cmcDataResult] = await Promise.allSettled([
            this.binanceAdapter.getMarketStats(ticker),
            this.cmcAdapter.getQuotes([ticker])
          ]);

          const marketData = marketDataResult.status === 'fulfilled' ? marketDataResult.value : null;
          const cmcData = cmcDataResult.status === 'fulfilled' ? cmcDataResult.value : null;

          console.log(`🔍 FundamentalAgent: ${ticker} - Data collected:`, {
            fundamentalData: !!fundamentalDataResult,
            marketData: !!marketData,
            cmcData: !!cmcData
          });

          // Step 4: Run fundamental analysis
          console.log(`🔍 FundamentalAgent: Step 4 - Running fundamental analysis for ${ticker}`);

          const analysis = this.fundamentalAnalysis.createFundamentalAnalysis(
            fundamentalDataResult.fundamentalData,
            fundamentalDataResult.onChainMetrics,
            fundamentalDataResult.socialMetrics,
            fundamentalDataResult.riskMetrics,
            marketData
          );

          console.log(`🔍 FundamentalAgent: ${ticker} - Analysis completed:`, {
            fundamentalScore: analysis.fundamentalScore,
            confidence: analysis.confidence,
            liquidityStatus: analysis.summary.liquidityStatus,
            networkStatus: analysis.summary.networkStatus,
            socialStatus: analysis.summary.socialStatus
          });

          const result = {
            ticker,
            fundamentalData: fundamentalDataResult.fundamentalData,
            onChainMetrics: fundamentalDataResult.onChainMetrics,
            socialMetrics: fundamentalDataResult.socialMetrics,
            riskMetrics: fundamentalDataResult.riskMetrics,
            marketData,
            cmcData,
            analysis,
            fundamentalScore: analysis.fundamentalScore,
            confidence: analysis.confidence,
            summary: analysis.summary,
            signals: analysis.signals
          };

          return result;
        } catch (error) {
          console.error(`❌ FundamentalAgent: Failed to get fundamental data for ${ticker}:`, error);
          return { ticker, error: true };
        }
      })
    );

    console.log(`✅ FundamentalAgent: processData completed with ${fundamentalData.length} results`);
    return fundamentalData;
  }

  buildSystemPrompt(context: AgentContext): string {
    const riskProfile = context.riskProfile || 'neutral';

    return `You are a FUNDAMENTAL analyst specializing in crypto market fundamentals.

ROLE: Evaluate asset quality and trend sustainability based on on-chain/market fundamentals, liquidity, and network health.

⚠️ CRITICAL: You are NOT a technical analyst. You are NOT a sentiment analyst.
You ONLY analyze fundamental metrics: liquidity, on-chain activity, social engagement, market cap health, and risk factors.
DO NOT analyze technical indicators (RSI, MACD, etc.) or news sentiment.

ANALYSIS CRITERIA:
- LIQUIDITY: High volume = better liquidity, lower spreads, more stable pricing
- ON-CHAIN HEALTH: Network activity, transaction volume, address growth, UTXO health
- SOCIAL ENGAGEMENT: Social volume, community health, sentiment scores
- MARKET CAP HEALTH: Market cap efficiency, supply utilization, institutional interest
- RISK FACTORS: Volatility, correlation, drawdown risk, profit-taking pressure
- NETWORK SECURITY: Hash rate, difficulty, transaction rate

CONFIDENCE SCORING:
- Base confidence = fundamental_score (0.3 to 1.0)
- Liquidity bonus: If liquidity_score > 0.7, increase confidence by 10%
- On-chain bonus: If on_chain_health > 0.6, increase confidence by 10%
- Social bonus: If social_sentiment > 0.7, increase confidence by 10%
- Market cap bonus: If market_cap_health > 0.8, increase confidence by 10%
- Risk penalty: If risk_adjustment < 0.5, reduce confidence by 15%
- Final confidence must be between 0.4 and 1.0 (minimum 40% for any valid data)
- If insufficient data, return HOLD with confidence 0.2

Risk profile: ${riskProfile} - ${this.getRiskProfileContext(riskProfile)}

STRICT RULES:
1. Use ONLY provided fundamental data - no technical indicators or news sentiment
2. Claims must be timestamp-locked to provided data
3. Confidence must be between 0.1 and 1.0 based on fundamental score
4. If insufficient data, return HOLD with confidence 0.2
5. Provide specific reasoning for each recommendation
6. REQUIRED: Each claim MUST include at least 1 fundamental evidence (liquidity, on-chain, social)
7. OPTIONAL: Include market evidence (volume, market cap) for additional support

CRITICAL: You MUST provide a detailed fundamental analysis BEFORE the JSON claims.
CRITICAL: For evidence field, use ONLY real evidence IDs from the provided context, NOT placeholder IDs.
CRITICAL: Each claim MUST reference specific fundamental metrics (liquidity, on-chain activity, social engagement) from the provided data.

OUTPUT FORMAT:
You MUST follow this exact format:

FUNDAMENTAL ANALYSIS:
Provide a comprehensive analysis of each asset's fundamentals including:
- Liquidity assessment and volume analysis
- On-chain activity and network health evaluation
- Social engagement and community health
- Market cap analysis and institutional interest
- Risk assessment and correlation analysis
- Overall fundamental health and investment thesis

For example:
"FUNDAMENTAL ANALYSIS:
BTC shows excellent liquidity with high volume and strong on-chain activity, indicating robust network health. The social engagement is moderate with good community health. Market cap analysis suggests strong institutional backing, while risk factors are well-managed with low correlation and moderate volatility. Overall, the asset demonstrates strong fundamentals across all dimensions.

ETH demonstrates good liquidity with moderate on-chain activity, suggesting healthy network usage. Social engagement is strong with high community health scores. Market cap analysis indicates solid fundamentals, but risk factors show moderate volatility and correlation. The fundamentals are sound with room for improvement in risk management."

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
        {"name": "liquidity_score", "value": 0.92},
        {"name": "on_chain_health", "value": 0.87},
        {"name": "social_sentiment", "value": 0.78},
        {"name": "market_cap_health", "value": 0.91},
        {"name": "risk_adjustment", "value": 0.85},
        {"name": "network_activity", "value": 0.89},
        {"name": "transaction_efficiency", "value": 0.76},
        {"name": "address_growth", "value": 0.83},
        {"name": "utxo_health", "value": 0.79},
        {"name": "network_security", "value": 0.94},
        {"name": "social_volume", "value": 0.81},
        {"name": "social_engagement", "value": 0.75},
        {"name": "sentiment_score", "value": 0.82},
        {"name": "community_health", "value": 0.88},
        {"name": "volatility_score", "value": 0.73},
        {"name": "correlation_score", "value": 0.67},
        {"name": "drawdown_risk", "value": 0.85},
        {"name": "profit_taking_pressure", "value": 0.91}
      ],
      "evidence": ["REAL_EVIDENCE_ID_1", "REAL_EVIDENCE_ID_2"],
      "riskFlags": ["high_volatility", "low_liquidity", "weak_onchain"]
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

⚠️ CRITICAL INSTRUCTIONS:
- You are a FUNDAMENTAL analyst ONLY
- Analyze ONLY fundamental metrics: liquidity, on-chain activity, social engagement, market cap health
- DO NOT analyze technical indicators (RSI, MACD, etc.) or news sentiment
- Focus on network health, community engagement, and institutional fundamentals

FUNDAMENTAL DATA:
Market Statistics:
${context.marketStats.map((stat: any) =>
      `• ${stat.symbol}: Volume=${stat.volume24h}, Price=${stat.price}, Volatility=${stat.volatility || 'N/A'}`
    ).join('\n')}

PROCESSED FUNDAMENTAL DATA:
${processedData ? processedData.map((data: any) =>
      `• ${data.ticker}: FundamentalScore=${data.fundamentalScore?.toFixed(3) || 'N/A'}, Confidence=${data.confidence?.toFixed(3) || 'N/A'}, LiquidityStatus=${data.summary?.liquidityStatus || 'N/A'}, NetworkStatus=${data.summary?.networkStatus || 'N/A'}, SocialStatus=${data.summary?.socialStatus || 'N/A'}, RiskStatus=${data.summary?.riskStatus || 'N/A'}, OverallHealth=${data.summary?.overallHealth || 'N/A'}`
    ).join('\n') : 'No processed data available'}

FUNDAMENTAL SIGNALS:
${processedData ? processedData.map((data: any) =>
      `• ${data.ticker}: ${data.signals ? data.signals.map((signal: any) => `${signal.name}=${signal.value.toFixed(3)}`).join(', ') : 'No signals'}`
    ).join('\n') : 'No signals available'}

ON-CHAIN METRICS:
${processedData ? processedData.map((data: any) => {
      const onChain = data.onChainMetrics || {};
      return `• ${data.ticker}: NetworkActivity=${onChain.networkActivity?.toFixed(3) || 'N/A'}, TransactionEfficiency=${onChain.transactionEfficiency?.toFixed(3) || 'N/A'}, AddressGrowth=${onChain.addressGrowth?.toFixed(3) || 'N/A'}, UTXOHealth=${onChain.utxoHealth?.toFixed(3) || 'N/A'}, NetworkSecurity=${onChain.networkSecurity?.toFixed(3) || 'N/A'}`;
    }).join('\n') : 'No on-chain data available'}

SOCIAL METRICS:
${processedData ? processedData.map((data: any) => {
      const social = data.socialMetrics || {};
      return `• ${data.ticker}: SocialVolume=${social.socialVolume?.toFixed(3) || 'N/A'}, SocialEngagement=${social.socialEngagement?.toFixed(3) || 'N/A'}, SentimentScore=${social.sentimentScore?.toFixed(3) || 'N/A'}, CommunityHealth=${social.communityHealth?.toFixed(3) || 'N/A'}`;
    }).join('\n') : 'No social data available'}

RISK METRICS:
${processedData ? processedData.map((data: any) => {
      const risk = data.riskMetrics || {};
      return `• ${data.ticker}: VolatilityScore=${risk.volatilityScore?.toFixed(3) || 'N/A'}, CorrelationScore=${risk.correlationScore?.toFixed(3) || 'N/A'}, DrawdownRisk=${risk.drawdownRisk?.toFixed(3) || 'N/A'}, ProfitTakingPressure=${risk.profitTakingPressure?.toFixed(3) || 'N/A'}`;
    }).join('\n') : 'No risk data available'}

FUNDAMENTAL ANALYSIS BREAKDOWN:
${processedData ? processedData.map((data: any) => {
      const fundamentalScore = data.fundamentalScore || 0;
      const confidence = data.confidence || 0;
      const liquidityScore = data.signals?.find((s: any) => s.name === 'liquidity_score')?.value || 0;
      const onChainHealth = data.signals?.find((s: any) => s.name === 'on_chain_health')?.value || 0;
      const socialSentiment = data.signals?.find((s: any) => s.name === 'social_sentiment')?.value || 0;
      const marketCapHealth = data.signals?.find((s: any) => s.name === 'market_cap_health')?.value || 0;

      return `• ${data.ticker}: 
  - Fundamental Score: ${fundamentalScore.toFixed(3)}
  - Confidence: ${confidence.toFixed(3)}
  - Liquidity Score: ${liquidityScore.toFixed(3)}
  - On-Chain Health: ${onChainHealth.toFixed(3)}
  - Social Sentiment: ${socialSentiment.toFixed(3)}
  - Market Cap Health: ${marketCapHealth.toFixed(3)}`;
    }).join('\n') : 'No fundamental breakdown available'}

INSTRUCTIONS:
1. Analyze the provided fundamental data using your specialized expertise
2. Generate claims for each ticker in the universe based on fundamental analysis
3. Use only the provided fundamental data and calculations - no technical indicators or news sentiment
4. If data is insufficient, return HOLD with confidence 0.2
5. Provide reasoning focused on fundamentals: liquidity, on-chain activity, social engagement, market cap health
6. REMEMBER: You are analyzing network health, community engagement, and institutional fundamentals, not technical indicators`;
  }
}
