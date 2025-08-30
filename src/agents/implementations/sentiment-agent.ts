import { BaseAgent, type AgentContext } from '../base/base-agent.js';
import { NewsAPIAdapter } from '../../adapters/news-adapter.js';
import { CMCAdapter } from '../../adapters/cmc-adapter.js';
import { Signals } from '../../adapters/signals-adapter.js';
import { SentimentAnalysisService } from '../../services/analysis/sentiment-analysis.service.js';
import type { FearGreedInterpretation } from '../../types/cmc.js';

export class SentimentAgent extends BaseAgent {
  private newsAdapter: NewsAPIAdapter;
  private cmcAdapter: CMCAdapter;
  private signalsAdapter: Signals;
  private sentimentAnalysis: SentimentAnalysisService;

  constructor(
    signalsAdapter?: Signals,
    sentimentAnalysis?: SentimentAnalysisService
  ) {
    super('sentiment');
    this.newsAdapter = new NewsAPIAdapter();
    this.cmcAdapter = new CMCAdapter();
    this.signalsAdapter = signalsAdapter || new Signals();
    this.sentimentAnalysis = sentimentAnalysis || new SentimentAnalysisService();
  }

  async processData(context: AgentContext): Promise<any> {
    console.log(`🔍 SentimentAgent: Starting processData for universe: ${context.universe.join(', ')}`);

    // Get Fear & Greed Index from CMC
    let fearGreedIndex: number | null = null;
    try {
      console.log(`📊 SentimentAgent: Fetching Fear & Greed Index from CMC...`);
      fearGreedIndex = await this.cmcAdapter.getFearGreedIndex();
      console.log(`📊 SentimentAgent: Fear & Greed Index: ${fearGreedIndex}`);
    } catch (error) {
      console.warn(`⚠️ SentimentAgent: Failed to get Fear & Greed Index:`, error);
    }

    // Get sentiment data from multiple sources
    const sentimentData = await Promise.all(
      context.universe.map(async (ticker) => {
        try {
          console.log(`📰 SentimentAgent: Fetching data for ${ticker}...`);

          // Get data from multiple sources
          const [news, signalsData] = await Promise.all([
            this.newsAdapter.search(ticker, Date.now() - 86400000, Date.now()),
            this.signalsAdapter.getIndicators(ticker, '4h')
          ]);

          console.log(`📰 SentimentAgent: Got ${news.length} news articles for ${ticker}`);

          // Use SentimentAnalysisService for comprehensive analysis
          // Service will extract only social data from signalsData
          const analysis = this.sentimentAnalysis.createComprehensiveSentimentAnalysis(
            news,
            signalsData, // Pass full signals data - service will filter it
            fearGreedIndex || 50 // Default to neutral if not available
          );

          const result = {
            ticker,
            news: news.slice(0, 10), // Top 10 news articles
            signalsData, // Keep full data for reference
            analysis,
            finalSentimentScore: analysis.finalSentimentScore,
            fearGreedIndex: fearGreedIndex || null
          };

          console.log(`📊 SentimentAgent: ${ticker} - Final Score: ${analysis.finalSentimentScore.toFixed(3)}, News Coverage: ${analysis.newsSentiment.coverage}, Social Score: ${analysis.socialSentiment.galaxyscore}, FearGreed: ${fearGreedIndex || 'N/A'}`);
          return result;
        } catch (error) {
          console.error(`❌ SentimentAgent: Failed to get sentiment data for ${ticker}:`, error);
          return { ticker, error: true };
        }
      })
    );

    console.log(`✅ SentimentAgent: processData completed with ${sentimentData.length} results`);
    return sentimentData;
  }

  buildSystemPrompt(context: AgentContext): string {
    const riskProfile = context.riskProfile || 'neutral';

    return `You are a SENTIMENT analyst specializing in news sentiment analysis.

ROLE: Aggregate and evaluate news sentiment for assets, considering coverage and freshness.

⚠️ CRITICAL: You are NOT a fundamental analyst. You are NOT a technical analyst. 
You ONLY analyze news sentiment, social media sentiment, and emotional market indicators.
DO NOT analyze technical indicators, liquidity, volatility, or fundamental metrics.

PROCESS (follow this exact sequence):
1. SUMMARIZE: Compress each news article into key points
2. REFLECT/CRITICIZE: Question your initial summary - is it biased? missing context?
3. REVISE: Update summary based on reflection
4. AGGREGATE: Combine all revised summaries into final sentiment
5. SCORE: Calculate sentiment_score = avg_sentiment × coverage_norm × freshness_score × consistency × credibility × market_mood_factor

ANALYSIS CRITERIA:
- COVERAGE: Number of relevant news articles (more = better, with log saturation)
- FRESHNESS: How recent the news is (newer = better, 1 = fresh, 0 = old)
- CONSISTENCY: Agreement between different sources (std deviation of sentiment)
- SOURCE CREDIBILITY: Trustworthiness of news sources (weighted average)
- MARKET MOOD: Fear & Greed Index influence (0.9-1.1 factor)
- SOCIAL ENGAGEMENT: Social volume, tweets, interactions, GalaxyScore
- TIME-LOCK: Anti-leak protection - ignore old news

CONFIDENCE SCORING:
- Base confidence = coverage_norm × consistency × credibility
- Freshness penalty: If freshness < 0.3, reduce confidence by 20% (not 80%)
- Coverage bonus: If coverage > 10 articles, increase confidence by 10%
- Social bonus: If galaxyscore > 50, increase confidence by 15%
- Fear & Greed bonus: If Fear & Greed index is available, increase confidence by 10%
- Final confidence must be between 0.3 and 1.0 (minimum 30% for any valid data)
- If insufficient data (no news + no social), return HOLD with confidence 0.2

Risk profile: ${riskProfile} - ${this.getRiskProfileContext(riskProfile)}

STRICT RULES:
1. Use ONLY provided data and tools - no external knowledge
2. Claims must be timestamp-locked to provided data
3. Confidence must be between 0.3 and 1.0 based on coverage × consistency × credibility with bonuses
4. If insufficient data (no news + no social), return HOLD with confidence 0.2
5. Follow the SUMMARIZE → REFLECT → REVISE → AGGREGATE process
6. MUST generate claims for EACH ticker in the universe
7. Each claim must be based on sentiment analysis of news and social data
8. NEVER analyze technical or fundamental data - ONLY sentiment
9. REQUIRED: Each claim MUST include at least 1 sentiment evidence (news, social, index)
10. OPTIONAL: Include additional evidence for additional support

CRITICAL: You MUST provide a detailed sentiment analysis BEFORE the JSON claims.
CRITICAL: For evidence field, use ONLY real evidence IDs from the provided context, NOT placeholder IDs.
CRITICAL: Each claim MUST reference specific sentiment metrics (news coverage, social engagement, fear & greed) from the provided data.

OUTPUT FORMAT:
You MUST follow this exact format:

SENTIMENT ANALYSIS:
Provide a comprehensive analysis of each asset's sentiment including:
- News sentiment assessment and coverage analysis
- Social media engagement and community sentiment
- Fear & Greed Index interpretation and market mood
- Overall sentiment health and emotional market indicators
- Risk assessment based on sentiment consistency and credibility

For example:
"SENTIMENT ANALYSIS:
BTC shows positive news sentiment with good coverage and high credibility sources, indicating strong market confidence. Social media engagement is moderate with healthy community sentiment. The Fear & Greed Index suggests balanced market mood, while sentiment consistency is strong across multiple sources. Overall, the asset demonstrates positive sentiment across all dimensions.

ETH demonstrates mixed news sentiment with moderate coverage, suggesting cautious market sentiment. Social media engagement is strong with positive community sentiment. The Fear & Greed Index indicates slight greed, while sentiment consistency shows some variation. The sentiment is generally positive but with room for improvement in news coverage."

Then provide the claims in JSON format:

{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "sentiment",
      "claim": "BUY|HOLD|SELL",
      "confidence": 0.85,
      "direction": "bullish|bearish|neutral",
      "magnitude": 0.7,
      "rationale": "Brief reasoning for the recommendation",
      "signals": [
        {"name": "sentiment_score", "value": 0.72},
        {"name": "news_coverage", "value": 15},
        {"name": "freshness_score", "value": 0.85},
        {"name": "consistency", "value": 0.78},
        {"name": "credibility", "value": 0.82},
        {"name": "coverage_norm", "value": 0.65},
        {"name": "market_mood_factor", "value": 1.05},
        {"name": "social_volume", "value": 0.45},
        {"name": "galaxyscore", "value": 67.4},
        {"name": "social_engagement", "value": 0.73}
      ],
      "evidence": ["REAL_EVIDENCE_ID_1", "REAL_EVIDENCE_ID_2"],
      "riskFlags": ["low_coverage", "old_news", "inconsistent_sentiment"]
    }
  ]
}`;
  }

  buildUserPrompt(context: AgentContext, processedData?: any[]): string {
    console.log(`🔍 SentimentAgent: buildUserPrompt called with ${processedData?.length || 0} processed data items`);
    if (processedData) {
      processedData.forEach((data, index) => {
        console.log(`📊 SentimentAgent: Data ${index} - ${data.ticker}: ${data.news?.length || 0} news, sentiment: ${data.analysis?.finalSentimentScore?.toFixed(3) || 'N/A'}`);
      });
    }

    return `ANALYSIS REQUEST:
Role: SENTIMENT Analyst
Risk Profile: ${context.riskProfile}
Timestamp: ${context.timestamp}
Universe: ${context.universe.join(', ')}

⚠️ CRITICAL INSTRUCTIONS:
- You are a SENTIMENT analyst ONLY
- Analyze ONLY news sentiment, social media sentiment, and emotional indicators
- DO NOT analyze technical indicators, liquidity, volatility, or fundamental metrics
- Focus on how news and social media affect market emotions and sentiment

SENTIMENT DATA:
News Articles (${processedData ? processedData.reduce((sum, data) => sum + (data.news ? data.news.length : 0), 0) : 0} items):
${processedData ? processedData.map((data: any) =>
      data.news ? data.news.map((article: any, index: number) =>
        `• ${data.ticker} - ${index + 1}. [${article.id}] ${(article.title || 'No title').substring(0, 100)}... (sentiment: ${(article.sentiment || 0).toFixed(2)})`
      ).join('\n') : `• ${data.ticker}: No news available`
    ).join('\n') : 'No news data available'}

PROCESSED SENTIMENT DATA:
${processedData ? processedData.map((data: any) => {
      const analysis = data.analysis;
      if (!analysis) return `• ${data.ticker}: No analysis available`;

      return `• ${data.ticker}: FinalScore=${analysis.finalSentimentScore?.toFixed(3) || 'N/A'}, NewsCoverage=${analysis.newsSentiment?.coverage || 0}, Freshness=${analysis.newsSentiment?.freshness?.toFixed(3) || 'N/A'}, Consistency=${analysis.newsSentiment?.consistency?.toFixed(3) || 'N/A'}, Credibility=${analysis.newsSentiment?.credibility?.toFixed(3) || 'N/A'}, CoverageNorm=${analysis.newsSentiment?.coverageNorm?.toFixed(3) || 'N/A'}, MarketMood=${analysis.newsSentiment?.marketMoodFactor?.toFixed(3) || 'N/A'}, SocialVolume=${analysis.socialSentiment?.socialVolume || 0}, GalaxyScore=${analysis.socialSentiment?.galaxyscore || 0}, FearGreed=${data.fearGreedIndex || 'N/A'}`;
    }).join('\n') : 'No processed data available'}

SOCIAL METRICS:
${processedData ? processedData.map((data: any) => {
      const social = data.analysis?.socialSentiment;
      if (!social) return `• ${data.ticker}: No social data available`;

      return `• ${data.ticker}: SocialVolume=${social.socialVolume || 0}, Tweets=${social.tweets || 0}, Interactions=${social.interactions || 0}, GalaxyScore=${social.galaxyscore || 0}, Popularity=${social.popularity || 0}, SocialDominance=${social.socialDominance || 0}`;
    }).join('\n') : 'No social data available'}

SENTIMENT ANALYSIS BREAKDOWN:
${processedData ? processedData.map((data: any) => {
      const analysis = data.analysis;
      if (!analysis) return `• ${data.ticker}: No analysis available`;

      const newsSentiment = analysis.newsSentiment;
      const socialSentiment = analysis.socialSentiment;
      const finalScore = analysis.finalSentimentScore;

      return `• ${data.ticker}: 
  - Final Sentiment Score: ${finalScore?.toFixed(3) || 'N/A'}
  - News Sentiment: ${newsSentiment?.sentiment?.toFixed(3) || 'N/A'}
  - News Coverage: ${newsSentiment?.coverage || 0} articles (norm: ${newsSentiment?.coverageNorm?.toFixed(3) || 'N/A'})
  - News Freshness: ${newsSentiment?.freshness?.toFixed(3) || 'N/A'}
  - News Consistency: ${newsSentiment?.consistency?.toFixed(3) || 'N/A'}
  - News Credibility: ${newsSentiment?.credibility?.toFixed(3) || 'N/A'}
  - Market Mood Factor: ${newsSentiment?.marketMoodFactor?.toFixed(3) || 'N/A'}
  - Social Volume: ${socialSentiment?.socialVolume || 0}
  - GalaxyScore: ${socialSentiment?.galaxyscore || 0}
  - Social Engagement: ${socialSentiment?.interactions || 0}`;
    }).join('\n') : 'No sentiment breakdown available'}

INSTRUCTIONS:
1. Follow the SUMMARIZE → REFLECT → REVISE → AGGREGATE process
2. Analyze ONLY news sentiment and social media sentiment - NOT technical or fundamental data
3. Generate claims for each ticker in the universe based on sentiment analysis
4. Use only the provided news data and sentiment calculations - no external knowledge
5. Return claims in the exact JSON format specified with signals array
6. If data is insufficient (no news + no social), return HOLD with confidence 0.2
7. Provide reasoning focused on sentiment and emotional market indicators
8. REMEMBER: You are analyzing how news affects market emotions, not technical indicators`;
  }
}
