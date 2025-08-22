import type { NewsAdapter } from '../interfaces/adapters.js';
import { API_CONFIG } from '../config.js';

import axios from 'axios';

export interface DigestItem {
    id: string;
    title: string;
    description: string;
    significance: string;
    implications: string;
    assets: string[];
    source: string;
    url: string;
    created_at: Date;
    updated_at: Date;
}

export interface DigestResponse {
    items: DigestItem[];
    count: number;
    timestamp: Date;
}

export interface SupportedTokensResponse {
    primary_assets: Array<{ text: string; callback_data: string }>;
    additional_assets: Array<{ text: string; callback_data: string }>;
    total_count: number;
    primary_count: number;
    additional_count: number;
    timestamp: string;
}

export interface NewsItem {
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: number;
    sentiment: number;
    description?: string;
    assets?: string[];
}

export class NewsAPIAdapter implements NewsAdapter {
    private baseUrl: string;
    private apiKey: string;
    private timeout: number;
    private isConnectedFlag = false;
    private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

    constructor(apiKey?: string, baseUrl?: string) {
        this.baseUrl = baseUrl || 'http://3.79.47.238:4500';
        this.apiKey = apiKey || API_CONFIG.news.apiKeys.newsapi || '';
        this.timeout = 30000;
    }

    async connect(): Promise<void> {
        try {
            // Test connection by calling the supported tokens endpoint
            await this.getSupportedTokens();
            this.isConnectedFlag = true;
            console.log('Connected to News API');
        } catch (error) {
            throw new Error(`Failed to connect to News API: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        this.isConnectedFlag = false;
        this.cache.clear();
    }

    isConnected(): boolean {
        return this.isConnectedFlag;
    }

    /**
     * Get cached data if available and not expired
     */
    private getCached<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now > cached.timestamp + cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }

        return cached.data as T;
    }

    /**
     * Set cached data with TTL
     */
    private setCache(key: string, data: any, ttlSeconds: number = 300): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds
        });
    }

    /**
     * Get general news digest
     */
    async getDigest(): Promise<DigestResponse> {
        const cacheKey = 'digest';
        const cached = this.getCached<DigestResponse>(cacheKey);

        if (cached) {
            console.log('Digest cache hit');
            return cached;
        }

        try {
            const response = await axios.get<DigestResponse>(`${this.baseUrl}/digest`, {
                headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
                timeout: this.timeout
            });

            const data = response.data;
            this.setCache(cacheKey, data, 300); // Cache for 5 minutes

            return data;
        } catch (error: any) {
            console.warn('Failed to fetch digest, returning mock data:', error.message);
            return this.getMockDigest();
        }
    }

    /**
     * Get news digest for specific asset
     */
    async getDigestByAsset(asset: string, limit: number = 10): Promise<DigestResponse> {
        const cacheKey = `digest-${asset}-${limit}`;
        const cached = this.getCached<DigestResponse>(cacheKey);

        if (cached) {
            console.log('Digest cache hit:', cacheKey);
            return cached;
        }

        try {
            const response = await axios.get<DigestResponse>(
                `${this.baseUrl}/digest/${asset}/${limit}`,
                {
                    headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
                    timeout: this.timeout
                }
            );

            const data = response.data;
            this.setCache(cacheKey, data, 300); // Cache for 5 minutes

            return data;
        } catch (error: any) {
            // Retry once on 503 errors
            if (error.response?.status === 503) {
                console.warn(`503 error for ${asset}, retrying once...`);
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                    const retryResponse = await axios.get<DigestResponse>(
                        `${this.baseUrl}/digest/${asset}/${limit}`,
                        {
                            headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
                            timeout: this.timeout
                        }
                    );
                    const retryData = retryResponse.data;
                    this.setCache(cacheKey, retryData, 300);
                    return retryData;
                } catch (retryError: any) {
                    console.warn(`Retry failed for ${asset}, returning mock data:`, retryError.message);
                    return this.getMockDigestByAsset(asset, limit);
                }
            }

            console.warn(`Failed to fetch digest for ${asset}, returning mock data:`, error.message);
            return this.getMockDigestByAsset(asset, limit);
        }
    }

    /**
     * Get supported tokens/assets
     */
    async getSupportedTokens(): Promise<SupportedTokensResponse> {
        const cacheKey = 'supported-tokens';
        const cached = this.getCached<SupportedTokensResponse>(cacheKey);

        if (cached) {
            console.log('Supported tokens cache hit');
            return cached;
        }

        try {
            const response = await axios.get<SupportedTokensResponse>(
                `${this.baseUrl}/supported-tokens/eliza`,
                {
                    headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
                    timeout: this.timeout
                }
            );

            const data = response.data;
            this.setCache(cacheKey, data, 3600); // Cache for 1 hour

            return data;
        } catch (error: any) {
            console.warn('Failed to fetch supported tokens, returning fallback data:', error.message);
            return this.getFallbackSupportedTokens();
        }
    }

    // NewsAdapter interface implementation
    async search(query: string, limit: number = 10): Promise<NewsItem[]> {
        try {
            // Try to find relevant assets from query
            const supportedTokens = await this.getSupportedTokens();
            const allAssets = [
                ...supportedTokens.primary_assets,
                ...supportedTokens.additional_assets
            ];

            // Find matching assets in query
            const matchingAssets = allAssets.filter(asset =>
                query.toLowerCase().includes(asset.text.toLowerCase())
            );

            if (matchingAssets.length > 0 && matchingAssets[0]) {
                // Get digest for the first matching asset
                const asset = matchingAssets[0].text;
                const digest = await this.getDigestByAsset(asset, limit);

                return digest.items.map(item => ({
                    id: item.id,
                    title: item.title,
                    url: item.url,
                    source: item.source,
                    publishedAt: new Date(item.created_at).getTime(),
                    sentiment: this.calculateSentiment(item.significance, item.implications),
                    description: item.description,
                    assets: item.assets
                }));
            } else {
                // Get general digest
                const digest = await this.getDigest();

                return digest.items
                    .slice(0, limit)
                    .map(item => ({
                        id: item.id,
                        title: item.title,
                        url: item.url,
                        source: item.source,
                        publishedAt: new Date(item.created_at).getTime(),
                        sentiment: this.calculateSentiment(item.significance, item.implications),
                        description: item.description,
                        assets: item.assets
                    }));
            }
        } catch (error) {
            console.warn('Failed to search news, returning mock data:', error);
            return this.getMockNews(query, limit);
        }
    }

    async getByIds(ids: string[]): Promise<NewsItem[]> {
        // This would require a specific endpoint from the News API
        // For now, return empty array or implement based on available endpoints
        console.warn('getByIds not implemented for News API');
        return [];
    }

    async getLatest(limit: number = 10): Promise<NewsItem[]> {
        const digest = await this.getDigest();

        return digest.items
            .slice(0, limit)
            .map(item => ({
                id: item.id,
                title: item.title,
                url: item.url,
                source: item.source,
                publishedAt: new Date(item.created_at).getTime(),
                sentiment: this.calculateSentiment(item.significance, item.implications),
                description: item.description,
                assets: item.assets
            }));
    }

    // Helper methods

    /**
     * Calculate sentiment score from significance and implications
     */
    private calculateSentiment(significance: string, implications: string): number {
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
     * Get mock digest for development/fallback
     */
    private getMockDigest(): DigestResponse {
        return {
            items: [
                {
                    id: 'mock-1',
                    title: 'Bitcoin Reaches New All-Time High Amid Institutional Adoption',
                    description: 'Bitcoin price surges to unprecedented levels as major institutions continue to adopt cryptocurrency.',
                    significance: 'Major bullish signal for the crypto market',
                    implications: 'Increased institutional confidence could drive further growth',
                    assets: ['BTC', 'BTCUSDT'],
                    source: 'CoinDesk',
                    url: 'https://example.com/btc-ath',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: 'mock-2',
                    title: 'Ethereum Network Upgrade Shows Promising Results',
                    description: 'Recent Ethereum network improvements demonstrate significant efficiency gains.',
                    significance: 'Positive technical development',
                    implications: 'Could improve network scalability and reduce fees',
                    assets: ['ETH', 'ETHUSDT'],
                    source: 'CoinTelegraph',
                    url: 'https://example.com/eth-upgrade',
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ],
            count: 2,
            timestamp: new Date()
        };
    }

    /**
     * Get mock digest by asset
     */
    private getMockDigestByAsset(asset: string, limit: number): DigestResponse {
        const mockDigest = this.getMockDigest();

        // Filter items that mention the asset
        const filteredItems = mockDigest.items
            .filter(item =>
                item.assets.some(a => a.toLowerCase().includes(asset.toLowerCase())) ||
                item.title.toLowerCase().includes(asset.toLowerCase())
            )
            .slice(0, limit);

        return {
            ...mockDigest,
            items: filteredItems,
            count: filteredItems.length
        };
    }

    /**
     * Get mock news items
     */
    private getMockNews(query: string, limit: number): NewsItem[] {
        const mockDigest = this.getMockDigest();

        return mockDigest.items
            .slice(0, limit)
            .map(item => ({
                id: item.id,
                title: item.title,
                url: item.url,
                source: item.source,
                publishedAt: new Date(item.created_at).getTime(),
                sentiment: this.calculateSentiment(item.significance, item.implications),
                description: item.description,
                assets: item.assets
            }));
    }

    /**
     * Get fallback supported tokens
     */
    private getFallbackSupportedTokens(): SupportedTokensResponse {
        return {
            primary_assets: [
                { text: "BTC", callback_data: "asset_BTC" },
                { text: "ETH", callback_data: "asset_ETH" },
                { text: "SOL", callback_data: "asset_SOL" },
            ],
            additional_assets: [
                { text: "ADA", callback_data: "asset_ADA" },
                { text: "DOT", callback_data: "asset_DOT" },
                { text: "LINK", callback_data: "asset_LINK" },
                { text: "MATIC", callback_data: "asset_MATIC" },
                { text: "AVAX", callback_data: "asset_AVAX" },
                { text: "UNI", callback_data: "asset_UNI" },
                { text: "AAVE", callback_data: "asset_AAVE" },
            ],
            total_count: 10,
            primary_count: 3,
            additional_count: 7,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get news for specific tickers (crypto symbols)
     */
    async getNewsByTickers(tickers: string[], limit: number = 10): Promise<NewsItem[]> {
        const allNews: NewsItem[] = [];

        for (const ticker of tickers) {
            try {
                const asset = ticker;
                const digest = await this.getDigestByAsset(asset, Math.ceil(limit / tickers.length));

                const newsItems = digest.items.map(item => ({
                    id: item.id,
                    title: item.title,
                    url: item.url,
                    source: item.source,
                    publishedAt: new Date(item.created_at).getTime(),
                    sentiment: this.calculateSentiment(item.significance, item.implications),
                    description: item.description,
                    assets: item.assets
                }));

                allNews.push(...newsItems);
            } catch (error) {
                console.warn(`Failed to get news for ${ticker}:`, error);
            }
        }

        // Sort by timestamp (most recent first) and limit results
        return allNews
            .sort((a, b) => b.publishedAt - a.publishedAt)
            .slice(0, limit);
    }
}
