import { BaseAgent, type AgentContext } from './base-agent.js';
import { NewsAPIAdapter } from '../adapters/news-adapter.js';

export class SentimentAgent extends BaseAgent {
  private newsAdapter: NewsAPIAdapter;

  constructor() {
    super('sentiment');
    this.newsAdapter = new NewsAPIAdapter();
  }

  async processData(context: AgentContext): Promise<any> {
    console.log(`🔍 SentimentAgent: Starting processData for universe: ${context.universe.join(', ')}`);

    // Get sentiment data from NewsAPIAdapter
    const sentimentData = await Promise.all(
      context.universe.map(async (ticker) => {
        try {
          console.log(`📰 SentimentAgent: Fetching news for ${ticker}...`);
          const news = await this.newsAdapter.search(ticker, Date.now() - 86400000, Date.now());
          console.log(`📰 SentimentAgent: Got ${news.length} news articles for ${ticker}`);

          // Calculate actual sentiment from news data
          const sentiment = this.calculateSentimentFromNews(news);
          const freshness = this.calculateFreshness(news);

          const result = {
            ticker,
            news: news.slice(0, 10), // Top 10 news articles
            sentiment,
            coverage: news.length,
            freshness
          };

          console.log(`📊 SentimentAgent: ${ticker} - Sentiment: ${sentiment.toFixed(3)}, Coverage: ${news.length}, Freshness: ${freshness.toFixed(3)}`);
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

  private calculateSentimentFromNews(news: any[]): number {
    if (news.length === 0) return 0.5; // Neutral if no news

    // Calculate average sentiment from news articles
    const totalSentiment = news.reduce((sum, article) => {
      return sum + (article.sentiment || 0.5);
    }, 0);

    return totalSentiment / news.length;
  }

  private calculateFreshness(news: any[]): number {
    if (news.length === 0) return 0;

    const now = Date.now();
    const avgAge = news.reduce((sum, article) => {
      const age = now - article.publishedAt;
      return sum + age;
    }, 0) / news.length;

    // Convert to hours and normalize (0 = very fresh, 1 = very old)
    const hoursOld = avgAge / (1000 * 60 * 60);
    return Math.min(1, hoursOld / 72); // 72 hours = 3 days max
  }



  buildSystemPrompt(context: AgentContext): string {
    const riskProfile = context.riskProfile || 'neutral';

    return `You are a SENTIMENT analyst specializing in news sentiment analysis.

ROLE: Aggregate and evaluate news sentiment for assets, considering coverage and freshness.

PROCESS (follow this exact sequence):
1. SUMMARIZE: Compress each news article into key points
2. REFLECT/CRITICIZE: Question your initial summary - is it biased? missing context?
3. REVISE: Update summary based on reflection
4. AGGREGATE: Combine all revised summaries into final sentiment
5. SCORE: Calculate sentiment_score = coverage × freshness × consistency

ANALYSIS CRITERIA:
- COVERAGE: Number of relevant news articles (more = better)
- FRESHNESS: How recent the news is (newer = better)
- CONSISTENCY: Agreement between different sources
- SOURCE CREDIBILITY: Trustworthiness of news sources
- TIME-LOCK: Anti-leak protection - ignore old news

CONFIDENCE SCORING:
- 0.8-1.0: High coverage, fresh news, consistent sentiment, credible sources
- 0.6-0.7: Good coverage, recent news, mostly consistent
- 0.4-0.5: Moderate coverage, mixed sentiment, some uncertainty
- 0.2-0.3: Low coverage, old news, inconsistent sentiment
- 0.1-0.2: Very low coverage, very old news, insufficient data

Risk profile: ${riskProfile} - ${this.getRiskProfileContext(riskProfile)}

STRICT RULES:
1. Use ONLY provided data and tools - no external knowledge
2. Claims must be timestamp-locked to provided data
3. Confidence must be between 0.1 and 1.0 based on coverage × freshness × consistency
4. Return ONLY valid JSON - no explanations, no markdown, no additional text
5. If insufficient data, return HOLD with confidence 0.2
6. Follow the SUMMARIZE → REFLECT → REVISE → AGGREGATE process
7. DO NOT include any text before or after the JSON object

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
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
        {"name": "freshness_score", "value": 0.85}
      ],
      "evidence": [],
      "riskFlags": ["low_coverage", "old_news"]
    }
  ]
}

CRITICAL: Return ONLY the JSON object, no additional text, markdown, or explanations.`;
  }

  buildUserPrompt(context: AgentContext, processedData?: any[]): string {
    console.log(`🔍 SentimentAgent: buildUserPrompt called with ${processedData?.length || 0} processed data items`);
    if (processedData) {
      processedData.forEach((data, index) => {
        console.log(`📊 SentimentAgent: Data ${index} - ${data.ticker}: ${data.news?.length || 0} news, sentiment: ${data.sentiment?.toFixed(3) || 'N/A'}`);
      });
    }

    return `ANALYSIS REQUEST:
Role: SENTIMENT Analyst
Risk Profile: ${context.riskProfile}
Timestamp: ${context.timestamp}
Universe: ${context.universe.join(', ')}

SENTIMENT DATA:
News Articles (${processedData ? processedData.reduce((sum, data) => sum + (data.news ? data.news.length : 0), 0) : 0} items):
${processedData ? processedData.map((data: any) =>
      data.news ? data.news.map((article: any, index: number) =>
        `• ${data.ticker} - ${index + 1}. [${article.id}] ${(article.title || 'No title').substring(0, 100)}... (sentiment: ${(article.sentiment || 0).toFixed(2)})`
      ).join('\n') : `• ${data.ticker}: No news available`
    ).join('\n') : 'No news data available'}

PROCESSED SENTIMENT DATA:
${processedData ? processedData.map((data: any) =>
      `• ${data.ticker}: Sentiment=${data.sentiment}, Coverage=${data.coverage}, Freshness=${data.freshness}, NewsCount=${data.news ? data.news.length : 0}`
    ).join('\n') : 'No processed data available'}

NEWS DETAILS:
${processedData ? processedData.map((data: any) =>
      `• ${data.ticker}: ${data.news ? data.news.slice(0, 3).map((article: any) => `${article.title || 'No title'} (${article.timestamp})`).join(', ') : 'No news'}`
    ).join('\n') : 'No news available'}

SENTIMENT ANALYSIS BREAKDOWN:
${processedData ? processedData.map((data: any) => {
      const sentimentScore = data.sentiment || 0;
      const coverage = data.coverage || 0;
      const freshness = data.freshness || 0;
      const consistency = data.consistency || 0;
      const finalScore = sentimentScore * coverage * freshness * consistency;

      return `• ${data.ticker}: 
  - Raw Sentiment: ${sentimentScore.toFixed(3)}
  - Coverage: ${coverage} articles
  - Freshness: ${freshness.toFixed(3)}
  - Consistency: ${consistency.toFixed(3)}
  - Final Score: ${finalScore.toFixed(3)}`;
    }).join('\n') : 'No sentiment breakdown available'}

INSTRUCTIONS:
1. Follow the SUMMARIZE → REFLECT → REVISE → AGGREGATE process
2. Analyze the provided data using your specialized expertise
3. Generate claims for each ticker in the universe
4. Use only the provided data and calculations - no external knowledge
5. Return claims in the exact JSON format specified with signals array
6. If data is insufficient, return HOLD with confidence 0.2
7. Provide reasoning for each recommendation`;
  }
}
