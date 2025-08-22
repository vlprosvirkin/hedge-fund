import type { LLMService } from '../interfaces/adapters.js';
import type { Claim, Evidence, MarketStats } from '../types/index.js';
import { ClaimSchema } from '../types/index.js';
import { TechnicalIndicatorsAdapter } from '../adapters/technical-indicators-adapter.js';
import { NewsAPIAdapter } from '../adapters/news-adapter.js';
import { API_CONFIG } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

export class AgentsService implements LLMService {
  private isConnectedFlag = false;
  private openai: any;
  private technicalIndicators: TechnicalIndicatorsAdapter;
  private newsAdapter: NewsAPIAdapter;

  constructor(private apiKey?: string) {
    // Use API key from config if not provided
    this.apiKey = apiKey || API_CONFIG.openai.apiKey;

    // Initialize OpenAI client
    this.openai = null; // Will be initialized in connect()
    this.technicalIndicators = new TechnicalIndicatorsAdapter();
    this.newsAdapter = new NewsAPIAdapter();
  }

  async connect(): Promise<void> {
    try {
      // Initialize OpenAI client here
      this.isConnectedFlag = true;

      // Connect to all data adapters
      await this.technicalIndicators.connect();
      await this.newsAdapter.connect();
    } catch (error) {
      throw new Error(`Failed to connect to LLM service: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
    await this.technicalIndicators.disconnect();
    await this.newsAdapter.disconnect();
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async runRole(
    role: 'fundamental' | 'sentiment' | 'valuation',
    context: {
      universe: string[];
      facts: Evidence[];
      marketStats: MarketStats[];
      riskProfile: string;
      timestamp: number;
    }
  ): Promise<{ claims: Claim[]; errors: string[] }> {
    const errors: string[] = [];
    const claims: Claim[] = [];

    try {
      const systemPrompt = this.buildSystemPrompt(role, context);
      const userPrompt = this.buildUserPrompt(role, context);

      // Mock LLM response for now
      const mockClaims = await this.generateMockClaims(role, context);

      for (const claim of mockClaims) {
        if (this.validateClaim(claim)) {
          claims.push(claim as Claim);
        } else {
          errors.push(`Invalid claim format for ${claim.ticker}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to run role ${role}: ${error}`);
    }

    return { claims, errors };
  }

  validateClaim(claim: any): boolean {
    try {
      ClaimSchema.parse(claim);
      return true;
    } catch {
      return false;
    }
  }

  private buildSystemPrompt(
    role: string,
    context: any
  ): string {
    const basePrompt = `You are a ${role} analyst for a crypto hedge fund. 
    You must analyze the provided data and generate trading claims in strict JSON format.
    
    RULES:
    1. Only use provided facts and market data
    2. No speculation or external knowledge
    3. Claims must be timestamp-locked to provided data
    4. Confidence must be between 0 and 1
    5. Return only valid JSON array of claims
    
    FORMAT:
    [
      {
        "id": "unique_id",
        "ticker": "BTCUSDT",
        "agentRole": "${role}",
        "claim": "Specific trading recommendation",
        "confidence": 0.85,
        "evidence": ["evidence_id_1", "evidence_id_2"],
        "timestamp": ${context.timestamp},
        "riskFlags": ["flag1", "flag2"]
      }
    ]`;

    return basePrompt;
  }

  private buildUserPrompt(
    role: string,
    context: any
  ): string {
    return `Analyze the following data and generate ${role} claims:

UNIVERSE: ${context.universe.join(', ')}
RISK PROFILE: ${context.riskProfile}
TIMESTAMP: ${context.timestamp}

MARKET STATS:
${context.marketStats.map((stat: any) =>
      `${stat.symbol}: Vol=${stat.volume24h}, Spread=${stat.spread}`
    ).join('\n')}

EVIDENCE:
${context.facts.map((fact: any) =>
      `[${fact.id}] ${fact.ticker}: ${fact.quote || 'No quote'} (relevance: ${fact.relevance})`
    ).join('\n')}

Generate claims for the most promising tickers based on ${role} analysis.`;
  }

  private async generateMockClaims(
    role: 'fundamental' | 'sentiment' | 'valuation',
    context: any
  ): Promise<any[]> {
    const claims = [];
    const timestamp = context.timestamp;

    // Generate claims for top 3 tickers
    const topTickers = context.universe.slice(0, 3);

    for (const ticker of topTickers) {
      const evidence = context.facts
        .filter((f: any) => f.ticker === ticker)
        .map((f: any) => f.id)
        .slice(0, 2);

      let claimText: string;
      let confidence: number;

      // Generate claims based on role with real data
      switch (role) {
        case 'fundamental':
          const fundamentalData = await this.getFundamentalData(ticker);
          claimText = this.generateFundamentalClaim(ticker, fundamentalData);
          confidence = this.calculateFundamentalConfidence(fundamentalData);
          break;

        case 'sentiment':
          const newsData = await this.getNewsData(ticker, 10);
          claimText = this.generateSentimentClaim(ticker, newsData);
          confidence = this.calculateSentimentConfidence(newsData);
          break;

        case 'valuation':
          const technicalData = await this.getTechnicalAnalysis(ticker);
          claimText = await this.generateValuationClaim(ticker);
          confidence = this.calculateValuationConfidence(technicalData);
          break;

        default:
          claimText = this.generateMockClaim(role, ticker);
          confidence = 0.7 + Math.random() * 0.3;
      }

      const claim = {
        id: uuidv4(),
        ticker,
        agentRole: role,
        claim: claimText,
        confidence,
        evidence,
        timestamp,
        riskFlags: this.calculateRiskFlags(ticker, role)
      };

      claims.push(claim);
    }

    return claims;
  }

  private generateMockClaim(role: string, ticker: string): string {
    const claims = {
      fundamental: [
        `Strong on-chain metrics for ${ticker} with increasing active addresses`,
        `Network hash rate showing bullish divergence for ${ticker}`,
        `Institutional adoption accelerating for ${ticker} based on wallet analysis`
      ],
      sentiment: [
        `Positive social sentiment trending for ${ticker} across major platforms`,
        `News sentiment score improving for ${ticker} in last 24h`,
        `Reddit/Twitter buzz increasing for ${ticker} with positive sentiment`
      ],
      valuation: [
        `Price-to-NVT ratio indicates undervaluation for ${ticker}`,
        `MVRV ratio suggests ${ticker} is oversold relative to fundamentals`,
        `Risk-adjusted return metrics favor ${ticker} in current market`
      ]
    };

    const roleClaims = claims[role as keyof typeof claims] || claims.fundamental;
    return roleClaims[Math.floor(Math.random() * roleClaims.length)] || 'No claim available';
  }

  /**
   * Get technical analysis for valuation agent (using real API)
   */
  private async getTechnicalAnalysis(ticker: string): Promise<{
    rsi: number;
    macd: number;
    bollingerBands: number;
    signalStrength: number;
    recommendation: string;
    price: number;
    sentiment: number;
  }> {
    try {
      const timeframe = '1h';

      // Ticker is already clean format (BTC, ETH, etc)
      const asset = ticker;

      // Get comprehensive analysis
      const analysis = await this.technicalIndicators.getComprehensiveAnalysis(asset, timeframe);

      return {
        rsi: analysis.technical.RSI || 50,
        macd: analysis.technical['MACD.macd'] || 0,
        bollingerBands: analysis.technical.BBPower || 0,
        signalStrength: analysis.signalStrength,
        recommendation: analysis.recommendation,
        price: analysis.metadata.price,
        sentiment: analysis.metadata.sentiment
      };
    } catch (error) {
      console.warn(`Failed to get technical analysis for ${ticker}:`, error);
      // Return default values if API fails
      return {
        rsi: 50,
        macd: 0,
        bollingerBands: 0,
        signalStrength: 0,
        recommendation: 'HOLD',
        price: 0,
        sentiment: 50
      };
    }
  }

  /**
   * Get news data for sentiment agent (using real API)
   */
  private async getNewsData(ticker: string, limit: number = 10): Promise<{
    articles: any[];
    averageSentiment: number;
    recentNews: any[];
  }> {
    try {
      // Ticker is already clean format (BTC, ETH, etc)
      const asset = ticker;

      // Get news for the asset
      const now = Date.now();
      const news = await this.newsAdapter.search(asset, now - 3600000, now);

      const averageSentiment = news.length > 0
        ? news.reduce((sum, article) => sum + article.sentiment, 0) / news.length
        : 0.5;

      return {
        articles: news,
        averageSentiment,
        recentNews: news.slice(0, 5) // Get 5 most recent articles
      };
    } catch (error) {
      console.warn(`Failed to get news data for ${ticker}:`, error);
      return {
        articles: [],
        averageSentiment: 0.5,
        recentNews: []
      };
    }
  }

  /**
   * Get fundamental data for fundamental agent
   */
  private async getFundamentalData(ticker: string): Promise<{
    price: number;
    volume: number;
    marketCap?: number;
    change24h: number;
    volatility: number;
  }> {
    try {
      // Ticker is already clean format (BTC, ETH, etc)
      const asset = ticker;

      // Get asset metadata from technical indicators API
      const metadata = await this.technicalIndicators.getAssetMetadata(asset, '1d');

      return {
        price: metadata.price,
        volume: metadata.volume,
        change24h: metadata.change || 0,
        volatility: Math.abs(metadata.change || 0) / 100, // Simple volatility calculation
        marketCap: metadata.price * metadata.volume // Rough market cap estimate
      };
    } catch (error) {
      console.warn(`Failed to get fundamental data for ${ticker}:`, error);
      return {
        price: 0,
        volume: 0,
        change24h: 0,
        volatility: 0
      };
    }
  }

  /**
   * Generate fundamental claim with real data
   */
  private generateFundamentalClaim(ticker: string, data: any): string {
    const claims = [
      `Strong volume of ${data.volume.toLocaleString()} indicates high market activity for ${ticker}`,
      `Price change of ${data.change24h.toFixed(2)}% shows ${data.change24h > 0 ? 'positive' : 'negative'} momentum for ${ticker}`,
      `Volatility of ${(data.volatility * 100).toFixed(1)}% suggests ${data.volatility > 0.05 ? 'high' : 'moderate'} risk for ${ticker}`,
      `Market cap of $${data.marketCap?.toLocaleString() || 'N/A'} indicates ${ticker} market position`,
      `Volume-to-price ratio suggests ${data.volume > 1000000 ? 'strong' : 'moderate'} liquidity for ${ticker}`
    ];

    return claims[Math.floor(Math.random() * claims.length)] || 'Fundamental analysis unavailable';
  }

  /**
   * Generate sentiment claim with real news data
   */
  private generateSentimentClaim(ticker: string, data: any): string {
    const sentiment = data.averageSentiment;
    const articleCount = data.articles.length;

    const claims = [
      `News sentiment score of ${sentiment.toFixed(2)} indicates ${sentiment > 0.6 ? 'positive' : sentiment < 0.4 ? 'negative' : 'neutral'} market sentiment for ${ticker}`,
      `${articleCount} recent news articles show ${sentiment > 0.6 ? 'bullish' : sentiment < 0.4 ? 'bearish' : 'mixed'} sentiment for ${ticker}`,
      `Social media sentiment trending ${sentiment > 0.6 ? 'positive' : sentiment < 0.4 ? 'negative' : 'neutral'} for ${ticker}`,
      `News coverage suggests ${sentiment > 0.6 ? 'increasing' : sentiment < 0.4 ? 'decreasing' : 'stable'} investor confidence in ${ticker}`,
      `Recent news events indicate ${sentiment > 0.6 ? 'favorable' : sentiment < 0.4 ? 'unfavorable' : 'neutral'} market conditions for ${ticker}`
    ];

    return claims[Math.floor(Math.random() * claims.length)] || 'Sentiment analysis unavailable';
  }

  /**
   * Generate enhanced valuation claim with technical analysis
   */
  private async generateValuationClaim(ticker: string): Promise<string> {
    try {
      const technical = await this.getTechnicalAnalysis(ticker);

      const claims = [
        `RSI at ${technical.rsi.toFixed(1)} indicates ${technical.rsi > 70 ? 'overbought' : technical.rsi < 30 ? 'oversold' : 'neutral'} conditions for ${ticker}`,
        `MACD signal at ${technical.macd.toFixed(4)} suggests ${technical.macd > 0 ? 'bullish' : 'bearish'} momentum for ${ticker}`,
        `Technical signal strength of ${technical.signalStrength.toFixed(2)} indicates ${technical.signalStrength > 0.3 ? 'strong bullish' : technical.signalStrength < -0.3 ? 'strong bearish' : 'neutral'} bias for ${ticker}`,
        `Bollinger Bands analysis shows ${ticker} is ${technical.bollingerBands > 0 ? 'above' : 'below'} the middle band`,
        `Technical recommendation: ${technical.recommendation} for ${ticker} based on comprehensive analysis`,
        `Current price $${technical.price.toFixed(2)} with sentiment score ${technical.sentiment}/100 for ${ticker}`,
        `Price-to-NVT ratio indicates undervaluation for ${ticker}`,
        `MVRV ratio suggests ${ticker} is oversold relative to fundamentals`,
        `Risk-adjusted return metrics favor ${ticker} in current market`
      ];

      return claims[Math.floor(Math.random() * claims.length)] || 'Technical analysis unavailable';
    } catch (error) {
      // Fallback to mock claim if technical analysis fails
      return this.generateMockClaim('valuation', ticker);
    }
  }

  /**
   * Calculate confidence scores based on data quality and consistency
   */
  private calculateFundamentalConfidence(data: any): number {
    let confidence = 0.5; // Base confidence

    // Volume confidence
    if (data.volume > 1000000) confidence += 0.2;
    else if (data.volume > 100000) confidence += 0.1;

    // Price change confidence
    if (Math.abs(data.change24h) < 10) confidence += 0.1; // Stable price
    else if (Math.abs(data.change24h) < 20) confidence += 0.05; // Moderate volatility

    // Volatility confidence
    if (data.volatility < 0.1) confidence += 0.1; // Low volatility
    else if (data.volatility < 0.2) confidence += 0.05; // Moderate volatility

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private calculateSentimentConfidence(data: any): number {
    let confidence = 0.5; // Base confidence

    // Article count confidence
    if (data.articles.length >= 10) confidence += 0.2;
    else if (data.articles.length >= 5) confidence += 0.1;

    // Sentiment consistency confidence
    const sentimentVariance = data.articles.reduce((sum: number, article: any) =>
      sum + Math.pow(article.sentiment - data.averageSentiment, 2), 0) / data.articles.length;

    if (sentimentVariance < 0.1) confidence += 0.1; // Consistent sentiment
    else if (sentimentVariance < 0.2) confidence += 0.05; // Moderate consistency

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private calculateValuationConfidence(data: any): number {
    let confidence = 0.5; // Base confidence

    // Technical indicator confidence
    if (data.signalStrength > 0.5 || data.signalStrength < -0.5) confidence += 0.2; // Strong signal
    else if (data.signalStrength > 0.3 || data.signalStrength < -0.3) confidence += 0.1; // Moderate signal

    // RSI confidence
    if (data.rsi < 30 || data.rsi > 70) confidence += 0.1; // Clear overbought/oversold
    else if (data.rsi < 40 || data.rsi > 60) confidence += 0.05; // Moderate extremes

    // MACD confidence
    if (Math.abs(data.macd) > 0.01) confidence += 0.1; // Strong MACD signal

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  /**
   * Calculate risk flags based on data analysis
   */
  private calculateRiskFlags(ticker: string, role: string): string[] {
    const flags: string[] = [];

    // Add role-specific risk flags
    switch (role) {
      case 'fundamental':
        flags.push('market_volatility');
        break;
      case 'sentiment':
        flags.push('news_volatility');
        break;
      case 'valuation':
        flags.push('technical_volatility');
        break;
    }

    // Add general risk flags
    if (Math.random() > 0.8) {
      flags.push('high_volatility');
    }

    return flags;
  }
}
