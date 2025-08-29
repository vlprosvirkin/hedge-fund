import axios from 'axios';
import { API_CONFIG } from '../core/config.js';
import type {
    CMCQuote,
    CMCMarketData,
    CMCSentimentData,
    CMCKeyInfo,
    CMCResponse,
    FearGreedInterpretation,
    MarketSentimentInterpretation
} from '../types/cmc.js';
import { FearGreedLevel } from '../types/cmc.js';

export class CMCAdapter {
    private baseUrl = 'https://pro-api.coinmarketcap.com/v1';
    private apiKey: string;
    private isConnected = false;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || API_CONFIG.cmc?.apiKey || '';
        if (!this.apiKey) {
            throw new Error('CMC API key is required. Please set CMC_API_KEY environment variable.');
        }
    }

    async connect(): Promise<void> {
        try {
            // Test connection with key info endpoint
            await this.getKeyInfo();
            this.isConnected = true;
            console.log('✅ CMC Adapter connected successfully');
        } catch (error) {
            console.error('❌ Failed to connect to CMC API:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.isConnected = false;
    }

    isConnectedFlag(): boolean {
        return this.isConnected;
    }

    /**
     * Get API key information and usage limits
     */
    async getKeyInfo(): Promise<CMCKeyInfo> {
        try {
            const response = await axios.get<CMCKeyInfo>(`${this.baseUrl}/key/info`, {
                headers: {
                    'X-CMC_PRO_API_KEY': this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get CMC key info: ${error}`);
        }
    }

    /**
     * Get latest quotes for specific cryptocurrencies
     */
    async getQuotes(symbols: string[]): Promise<CMCQuote[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/cryptocurrency/quotes/latest`, {
                headers: {
                    'X-CMC_PRO_API_KEY': this.apiKey
                },
                params: {
                    symbol: symbols.join(','),
                    convert: 'USD'
                }
            });

            return Object.values(response.data.data);
        } catch (error) {
            throw new Error(`Failed to get CMC quotes for ${symbols.join(',')}: ${error}`);
        }
    }

    /**
     * Get latest listings (top cryptocurrencies)
     */
    async getLatestListings(limit: number = 100): Promise<any[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/cryptocurrency/listings/latest`, {
                headers: {
                    'X-CMC_PRO_API_KEY': this.apiKey
                },
                params: {
                    limit,
                    convert: 'USD'
                }
            });

            return response.data.data;
        } catch (error) {
            throw new Error(`Failed to get CMC latest listings: ${error}`);
        }
    }

    /**
     * Get market data for sentiment analysis
     */
    async getMarketData(symbols: string[]): Promise<CMCMarketData[]> {
        try {
            const quotes = await this.getQuotes(symbols);

            return quotes.map(quote => ({
                symbol: quote.symbol,
                price: quote.quote.USD.price,
                volume24h: quote.quote.USD.volume_24h,
                volumeChange24h: quote.quote.USD.volume_change_24h,
                priceChange1h: quote.quote.USD.percent_change_1h,
                priceChange24h: quote.quote.USD.percent_change_24h,
                priceChange7d: quote.quote.USD.percent_change_7d,
                marketCap: quote.quote.USD.market_cap,
                marketCapDominance: quote.quote.USD.market_cap_dominance,
                circulatingSupply: quote.circulating_supply,
                totalSupply: quote.total_supply,
                maxSupply: quote.max_supply,
                cmcRank: quote.cmc_rank,
                lastUpdated: quote.quote.USD.last_updated
            }));
        } catch (error) {
            throw new Error(`Failed to get CMC market data: ${error}`);
        }
    }

    /**
     * Calculate sentiment indicators from market data
     */
    async getSentimentData(symbols: string[]): Promise<CMCSentimentData[]> {
        try {
            const marketData = await this.getMarketData(symbols);

            return marketData.map(data => {
                // Calculate volatility index from price changes
                const volatilityIndex = this.calculateVolatilityIndex([
                    data.priceChange1h,
                    data.priceChange24h,
                    data.priceChange7d
                ]);

                // Calculate momentum index from price changes
                const momentumIndex = this.calculateMomentumIndex([
                    data.priceChange1h,
                    data.priceChange24h,
                    data.priceChange7d
                ]);

                // Calculate market sentiment from price and volume changes
                const marketSentiment = this.calculateMarketSentiment(data);

                return {
                    symbol: data.symbol,
                    marketSentiment,
                    volatilityIndex,
                    momentumIndex,
                    lastUpdated: data.lastUpdated
                };
            });
        } catch (error) {
            throw new Error(`Failed to get CMC sentiment data: ${error}`);
        }
    }

    /**
     * Get Fear & Greed Index approximation from market data
     * Note: CMC doesn't provide Fear & Greed Index directly, so we approximate it
     */
    async getFearGreedIndex(): Promise<number> {
        try {
            // Get top 10 cryptocurrencies for market-wide sentiment
            const topSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX', 'UNI', 'LINK', 'MATIC'];
            const sentimentData = await this.getSentimentData(topSymbols);

            // Calculate average market sentiment
            const avgSentiment = sentimentData.reduce((sum, data) => sum + data.marketSentiment, 0) / sentimentData.length;

            // Convert sentiment (-1 to 1) to Fear & Greed Index (0 to 100)
            // -1 (extreme fear) -> 0
            // 0 (neutral) -> 50
            // 1 (extreme greed) -> 100
            const fearGreedIndex = Math.max(0, Math.min(100, (avgSentiment + 1) * 50));

            return Math.round(fearGreedIndex);
        } catch (error) {
            console.warn('Failed to calculate Fear & Greed Index, using neutral value:', error);
            return 50; // Neutral
        }
    }

    /**
     * Get Fear & Greed Index with interpretation
     */
    async getFearGreedInterpretation(): Promise<FearGreedInterpretation> {
        const value = await this.getFearGreedIndex();
        return this.interpretFearGreedIndex(value);
    }

    /**
     * Interpret Fear & Greed Index value
     */
    private interpretFearGreedIndex(value: number): FearGreedInterpretation {
        let level: FearGreedLevel;
        let description: string;
        let moodFactor: number;

        if (value <= 25) {
            level = FearGreedLevel.EXTREME_FEAR;
            description = 'Extreme Fear - Market sentiment is very bearish';
            moodFactor = 0.9;
        } else if (value <= 45) {
            level = FearGreedLevel.FEAR;
            description = 'Fear - Market sentiment is bearish';
            moodFactor = 0.95;
        } else if (value <= 55) {
            level = FearGreedLevel.NEUTRAL;
            description = 'Neutral - Market sentiment is balanced';
            moodFactor = 1.0;
        } else if (value <= 75) {
            level = FearGreedLevel.GREED;
            description = 'Greed - Market sentiment is bullish';
            moodFactor = 1.05;
        } else {
            level = FearGreedLevel.EXTREME_GREED;
            description = 'Extreme Greed - Market sentiment is very bullish';
            moodFactor = 1.1;
        }

        return {
            value,
            level,
            description,
            moodFactor
        };
    }

    /**
     * Calculate volatility index from price changes
     */
    private calculateVolatilityIndex(priceChanges: number[]): number {
        const validChanges = priceChanges.filter(change => !isNaN(change));
        if (validChanges.length === 0) return 0;

        const mean = validChanges.reduce((sum, change) => sum + change, 0) / validChanges.length;
        const variance = validChanges.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / validChanges.length;
        const stdDev = Math.sqrt(variance);

        // Normalize to 0-1 range (higher = more volatile)
        return Math.min(1, stdDev / 10); // 10% std dev = max volatility
    }

    /**
     * Calculate momentum index from price changes
     */
    private calculateMomentumIndex(priceChanges: number[]): number {
        const validChanges = priceChanges.filter(change => !isNaN(change));
        if (validChanges.length === 0) return 0;

        // Weight recent changes more heavily
        const weights = [0.5, 0.3, 0.2]; // 1h, 24h, 7d
        const weightedSum = validChanges.reduce((sum, change, index) => {
            return sum + (change * (weights[index] || 0));
        }, 0);

        // Normalize to -1 to 1 range
        return Math.max(-1, Math.min(1, weightedSum / 100));
    }

    /**
     * Calculate market sentiment from price and volume data
     */
    private calculateMarketSentiment(data: CMCMarketData): number {
        // Combine price changes and volume changes for sentiment
        const priceSentiment = (data.priceChange24h + data.priceChange7d) / 200; // Normalize to -1 to 1
        const volumeSentiment = Math.tanh(data.volumeChange24h / 100); // Volume change impact

        // Weight price changes more heavily than volume
        const sentiment = (priceSentiment * 0.7) + (volumeSentiment * 0.3);

        return Math.max(-1, Math.min(1, sentiment));
    }
}
