import type {
    FearGreedInterpretation,
    MarketSentimentInterpretation,
    CMCSentimentData
} from '../../types/cmc.js';
import { FearGreedLevel } from '../../types/cmc.js';
import type {
    IndicatorsResponse
} from '../../types/signals.js';

export interface NewsSentimentData {
    sentiment: number; // 0-1
    coverage: number; // Number of articles
    freshness: number; // 0-1 (1 = fresh, 0 = old)
    consistency: number; // 0-1 (1 = consistent, 0 = inconsistent)
    credibility: number; // 0-1 (1 = credible, 0 = not credible)
    coverageNorm: number; // 0-1 (log-normalized coverage)
    marketMoodFactor: number; // 0.9-1.1 (Fear & Greed influence)
}

export interface SocialSentimentData {
    socialVolume: number; // From signals API
    tweets: number; // From signals API
    interactions: number; // From signals API
    galaxyscore: number; // From signals API
    popularity: number; // From signals API
    socialDominance: number; // From signals API
}

export interface ComprehensiveSentimentData {
    newsSentiment: NewsSentimentData;
    socialSentiment: SocialSentimentData;
    fearGreedIndex: number; // 0-100 from CMC
    marketSentiment: number; // -1 to 1 (derived)
    finalSentimentScore: number; // 0-1 (final calculated score)
}

export class SentimentAnalysisService {
    /**
     * Calculate news sentiment from news articles
     */
    calculateNewsSentiment(news: any[]): NewsSentimentData {
        if (news.length === 0) {
            return {
                sentiment: 0.5, // Neutral
                coverage: 0,
                freshness: 0,
                consistency: 1.0, // Perfect consistency when no news
                credibility: 0.5, // Neutral credibility
                coverageNorm: 0,
                marketMoodFactor: 1.0 // Neutral mood
            };
        }

        // Calculate average sentiment
        const totalSentiment = news.reduce((sum, article) => {
            return sum + (article.sentiment || 0.5);
        }, 0);
        const sentiment = totalSentiment / news.length;

        // Calculate freshness
        const now = Date.now();
        const avgAge = news.reduce((sum, article) => {
            const age = now - article.publishedAt;
            return sum + age;
        }, 0) / news.length;
        const hoursOld = avgAge / (1000 * 60 * 60);
        const freshness = Math.max(0, 1 - (hoursOld / 72)); // 72 hours = 3 days max

        // Calculate consistency (lower std dev = higher consistency)
        const sentiments = news.map(article => article.sentiment || 0.5);
        const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
        const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;
        const stdDev = Math.sqrt(variance);
        const consistency = Math.max(0.1, 1 - (stdDev * 2)); // Scale std dev to [0, 0.5] range

        // Calculate credibility based on source weights
        const sourceWeights: Record<string, number> = {
            'coindesk': 0.9,
            'cointelegraph': 0.85,
            'theblock': 0.88,
            'reuters': 0.95,
            'bloomberg': 0.95,
            'wsj': 0.95,
            'cnbc': 0.9,
            'bitcoin.com': 0.8,
            'decrypt.co': 0.8,
            'default': 0.6
        };

        const totalCredibility = news.reduce((sum, article) => {
            const source = article.source?.toLowerCase() || 'default';
            const weight = sourceWeights[source] || sourceWeights['default'];
            return sum + weight;
        }, 0);
        const credibility = totalCredibility / news.length;

        // Calculate coverage normalization (log-like saturation)
        const maxCoverage = 50; // Saturation point
        const coverageNorm = Math.log(1 + news.length) / Math.log(1 + maxCoverage);

        // Market mood factor (will be set by caller)
        const marketMoodFactor = 1.0; // Default neutral

        return {
            sentiment,
            coverage: news.length,
            freshness,
            consistency,
            credibility,
            coverageNorm,
            marketMoodFactor
        };
    }

    /**
     * Calculate social sentiment from signals API data
     */
    calculateSocialSentiment(signalsData: IndicatorsResponse): SocialSentimentData {
        return {
            socialVolume: signalsData.social_volume_24h || 0,
            tweets: signalsData.tweets || 0,
            interactions: signalsData.interactions || 0,
            galaxyscore: signalsData.galaxyscore || 0,
            popularity: signalsData.popularity || 0,
            socialDominance: signalsData.socialdominance || 0
        };
    }

    /**
     * Calculate Fear & Greed Index interpretation
     */
    calculateFearGreedInterpretation(fearGreedIndex: number): FearGreedInterpretation {
        let level: FearGreedLevel;
        let description: string;
        let moodFactor: number;

        if (fearGreedIndex <= 25) {
            level = FearGreedLevel.EXTREME_FEAR;
            description = 'Extreme Fear - Market sentiment is very negative';
            moodFactor = 0.9;
        } else if (fearGreedIndex <= 45) {
            level = FearGreedLevel.FEAR;
            description = 'Fear - Market sentiment is negative';
            moodFactor = 0.95;
        } else if (fearGreedIndex <= 55) {
            level = FearGreedLevel.NEUTRAL;
            description = 'Neutral - Market sentiment is balanced';
            moodFactor = 1.0;
        } else if (fearGreedIndex <= 75) {
            level = FearGreedLevel.GREED;
            description = 'Greed - Market sentiment is positive';
            moodFactor = 1.05;
        } else {
            level = FearGreedLevel.EXTREME_GREED;
            description = 'Extreme Greed - Market sentiment is very positive';
            moodFactor = 1.1;
        }

        return {
            value: fearGreedIndex,
            level,
            description,
            moodFactor
        };
    }

    /**
     * Calculate market sentiment from CMC data
     */
    calculateMarketSentiment(cmcData: CMCSentimentData): MarketSentimentInterpretation {
        // Extract available properties from CMCSentimentData
        const sentiment = cmcData.marketSentiment;
        const volatility = cmcData.volatilityIndex;
        const momentum = cmcData.momentumIndex;

        // Determine recommendation based on sentiment
        let recommendation: 'bullish' | 'bearish' | 'neutral';
        if (sentiment > 0.3) {
            recommendation = 'bullish';
        } else if (sentiment < -0.3) {
            recommendation = 'bearish';
        } else {
            recommendation = 'neutral';
        }

        // Calculate confidence based on volatility and momentum strength
        const confidence = Math.min(1.0, Math.abs(sentiment) + Math.abs(momentum) * 0.5);

        return {
            symbol: cmcData.symbol,
            sentiment,
            volatility,
            momentum,
            confidence,
            recommendation
        };
    }

    /**
     * Calculate final sentiment score using comprehensive formula
     */
    calculateFinalSentimentScore(
        newsSentiment: NewsSentimentData,
        socialSentiment: SocialSentimentData,
        fearGreedIndex: number
    ): number {
        // Update market mood factor based on Fear & Greed Index
        const fearGreedInterpretation = this.calculateFearGreedInterpretation(fearGreedIndex);
        newsSentiment.marketMoodFactor = fearGreedInterpretation.moodFactor;

        // Calculate social sentiment score (0-1)
        const socialScore = Math.min(1.0,
            (socialSentiment.galaxyscore / 100) * 0.4 +
            (Math.min(socialSentiment.socialVolume / 100000, 1.0)) * 0.3 +
            (Math.min(socialSentiment.interactions / 1000000, 1.0)) * 0.3
        );

        // Calculate news sentiment score using the formula from SentimentAgent
        const newsScore = newsSentiment.sentiment *
            newsSentiment.coverageNorm *
            newsSentiment.freshness *
            newsSentiment.consistency *
            newsSentiment.credibility *
            newsSentiment.marketMoodFactor;

        // Combine news and social sentiment (weighted average)
        const finalScore = (newsScore * 0.7) + (socialScore * 0.3);

        return Math.max(0, Math.min(1, finalScore));
    }

    /**
     * Create comprehensive sentiment analysis
     */
    createComprehensiveSentimentAnalysis(
        news: any[],
        signalsData: IndicatorsResponse,
        fearGreedIndex: number
    ): ComprehensiveSentimentData {
        const newsSentiment = this.calculateNewsSentiment(news);
        const socialSentiment = this.calculateSocialSentiment(signalsData);

        // Update market mood factor
        const fearGreedInterpretation = this.calculateFearGreedInterpretation(fearGreedIndex);
        newsSentiment.marketMoodFactor = fearGreedInterpretation.moodFactor;

        // Calculate market sentiment (derived from Fear & Greed Index)
        const marketSentiment = (fearGreedIndex - 50) / 50; // Convert 0-100 to -1 to 1

        // Calculate final sentiment score
        const finalSentimentScore = this.calculateFinalSentimentScore(
            newsSentiment,
            socialSentiment,
            fearGreedIndex
        );

        return {
            newsSentiment,
            socialSentiment,
            fearGreedIndex,
            marketSentiment,
            finalSentimentScore
        };
    }

    /**
     * Generate sentiment summary for LLM
     */
    getSentimentSummary(sentimentData: ComprehensiveSentimentData): {
        newsStatus: string;
        socialStatus: string;
        marketMood: string;
        overallSentiment: string;
    } {
        // News Status
        let newsStatus = 'low';
        if (sentimentData.newsSentiment.coverage > 20) newsStatus = 'high';
        else if (sentimentData.newsSentiment.coverage > 5) newsStatus = 'moderate';

        // Social Status
        let socialStatus = 'low';
        if (sentimentData.socialSentiment.galaxyscore > 70) socialStatus = 'high';
        else if (sentimentData.socialSentiment.galaxyscore > 40) socialStatus = 'moderate';

        // Market Mood
        let marketMood = 'neutral';
        if (sentimentData.fearGreedIndex > 75) marketMood = 'extreme_greed';
        else if (sentimentData.fearGreedIndex > 55) marketMood = 'greed';
        else if (sentimentData.fearGreedIndex < 25) marketMood = 'extreme_fear';
        else if (sentimentData.fearGreedIndex < 45) marketMood = 'fear';

        // Overall Sentiment
        let overallSentiment = 'neutral';
        if (sentimentData.finalSentimentScore > 0.7) overallSentiment = 'very_positive';
        else if (sentimentData.finalSentimentScore > 0.6) overallSentiment = 'positive';
        else if (sentimentData.finalSentimentScore < 0.3) overallSentiment = 'very_negative';
        else if (sentimentData.finalSentimentScore < 0.4) overallSentiment = 'negative';

        return {
            newsStatus,
            socialStatus,
            marketMood,
            overallSentiment
        };
    }
}
