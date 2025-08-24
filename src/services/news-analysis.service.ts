import type { NewsItem, DigestItem } from '../types/index.js';

export class NewsAnalysisService {
    /**
     * Calculate sentiment score from significance and implications
     */
    calculateSentiment(significance: string, implications: string): number {
        const text = (significance + ' ' + implications).toLowerCase();

        // Simple sentiment analysis based on keywords
        const positiveWords = ['bullish', 'positive', 'growth', 'increase', 'surge', 'rally', 'gain', 'up', 'rise', 'strong'];
        const negativeWords = ['bearish', 'negative', 'decline', 'decrease', 'drop', 'fall', 'crash', 'loss', 'down', 'weak'];

        let positiveCount = 0;
        let negativeCount = 0;

        positiveWords.forEach(word => {
            if (text.includes(word)) positiveCount++;
        });

        negativeWords.forEach(word => {
            if (text.includes(word)) negativeCount++;
        });

        if (positiveCount > negativeCount) {
            return 0.6 + (positiveCount - negativeCount) * 0.1;
        } else if (negativeCount > positiveCount) {
            return 0.4 - (negativeCount - positiveCount) * 0.1;
        } else {
            return 0.5; // Neutral
        }
    }

    /**
 * Convert digest items to news items with sentiment analysis
 */
    convertDigestToNewsItems(digestItems: DigestItem[]): NewsItem[] {
        return digestItems.map(item => {
            const sentiment = this.calculateSentiment(item.significance, item.implications);

            // Create the base news item with required fields
            const newsItem: NewsItem = {
                id: item.id,
                title: item.title,
                url: item.url,
                source: item.source,
                publishedAt: new Date(item.created_at).getTime(),
                sentiment
            };

            // Add optional fields conditionally
            if (item.description) {
                newsItem.description = item.description;
            }

            if (item.assets) {
                newsItem.assets = item.assets;
            }

            return newsItem;
        });
    }

    /**
     * Filter news items by asset/ticker
     */
    filterNewsByAsset(newsItems: NewsItem[], asset: string): NewsItem[] {
        return newsItems.filter(item =>
            item.assets?.some(a => a.toLowerCase().includes(asset.toLowerCase())) ||
            item.title.toLowerCase().includes(asset.toLowerCase())
        );
    }

    /**
     * Calculate limit based on time range
     */
    calculateLimitFromTimeRange(since: number, until: number): number {
        const timeRangeHours = Math.max(1, Math.floor((until - since) / (1000 * 60 * 60)));
        return Math.min(20, Math.max(5, timeRangeHours));
    }

    /**
     * Find matching assets in query
     */
    findMatchingAssets(query: string, allAssets: Array<{ text: string; callback_data: string }>): Array<{ text: string; callback_data: string }> {
        return allAssets.filter(asset =>
            query.toLowerCase().includes(asset.text.toLowerCase())
        );
    }

    /**
     * Sort news items by timestamp (most recent first)
     */
    sortNewsByTimestamp(newsItems: NewsItem[]): NewsItem[] {
        return newsItems.sort((a, b) => b.publishedAt - a.publishedAt);
    }

    /**
     * Merge and deduplicate news from multiple sources
     */
    mergeNewsItems(newsArrays: NewsItem[][]): NewsItem[] {
        const seen = new Set<string>();
        const merged: NewsItem[] = [];

        for (const newsArray of newsArrays) {
            for (const item of newsArray) {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    merged.push(item);
                }
            }
        }

        return merged;
    }

    /**
     * Calculate average sentiment for a collection of news items
     */
    calculateAverageSentiment(newsItems: NewsItem[]): number {
        if (newsItems.length === 0) return 0.5; // Neutral if no news

        const totalSentiment = newsItems.reduce((sum, item) => sum + item.sentiment, 0);
        return totalSentiment / newsItems.length;
    }

    /**
     * Get news sentiment trend (positive, negative, or neutral)
     */
    getSentimentTrend(newsItems: NewsItem[]): 'positive' | 'negative' | 'neutral' {
        const avgSentiment = this.calculateAverageSentiment(newsItems);

        if (avgSentiment > 0.6) return 'positive';
        if (avgSentiment < 0.4) return 'negative';
        return 'neutral';
    }

    /**
     * Get most significant news items (based on sentiment extremity)
     */
    getMostSignificantNews(newsItems: NewsItem[], limit: number = 5): NewsItem[] {
        return newsItems
            .sort((a, b) => {
                // Sort by how far sentiment is from neutral (0.5)
                const aDistance = Math.abs(a.sentiment - 0.5);
                const bDistance = Math.abs(b.sentiment - 0.5);
                return bDistance - aDistance;
            })
            .slice(0, limit);
    }
}
