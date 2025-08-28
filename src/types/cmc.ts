/**
 * CoinMarketCap API Types
 * 
 * These types represent the structure of data returned by the CoinMarketCap API.
 * Documentation: https://coinmarketcap.com/api/documentation/v1/
 */

/**
 * Raw quote data from CMC API
 */
export interface CMCQuote {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    cmc_rank: number;
    market_cap: number;
    market_cap_dominance: number;
    fully_diluted_market_cap: number;
    price: number;
    volume_24h: number;
    volume_change_24h: number;
    percent_change_1h: number;
    percent_change_24h: number;
    percent_change_7d: number;
    percent_change_30d: number;
    percent_change_60d: number;
    percent_change_90d: number;
    market_cap_by_total_supply: number;
    avg_price_90d: number;
    market_cap_dominance_24h_percent_change: number;
    circulating_supply: number;
    self_reported_circulating_supply: number;
    self_reported_market_cap: number;
    total_supply: number;
    max_supply: number;
    infinite_supply: boolean;
    last_updated: string;
    date_added: string;
    tags: string[];
    platform: any;
    quote: {
        USD: {
            price: number;
            volume_24h: number;
            volume_change_24h: number;
            percent_change_1h: number;
            percent_change_24h: number;
            percent_change_7d: number;
            percent_change_30d: number;
            percent_change_60d: number;
            percent_change_90d: number;
            market_cap: number;
            market_cap_dominance: number;
            fully_diluted_market_cap: number;
            market_cap_by_total_supply: number;
            avg_price_90d: number;
            market_cap_dominance_24h_percent_change: number;
            last_updated: string;
        };
    };
}

/**
 * Processed market data for internal use
 */
export interface CMCMarketData {
    symbol: string;
    price: number;
    volume24h: number;
    volumeChange24h: number;
    priceChange1h: number;
    priceChange24h: number;
    priceChange7d: number;
    marketCap: number;
    marketCapDominance: number;
    circulatingSupply: number;
    totalSupply: number;
    maxSupply: number;
    cmcRank: number;
    lastUpdated: string;
}

/**
 * Sentiment indicators calculated from market data
 */
export interface CMCSentimentData {
    symbol: string;
    fearGreedIndex?: number; // Not directly available from CMC, but we can derive
    marketSentiment: number; // Derived from price changes and volume
    socialVolume?: number; // Not available on free tier
    newsSentiment?: number; // Not available on free tier
    volatilityIndex: number; // Derived from price changes
    momentumIndex: number; // Derived from price changes
}

/**
 * API key information and usage limits
 */
export interface CMCKeyInfo {
    status: {
        timestamp: string;
        error_code: number;
        error_message: string | null;
        elapsed: number;
        credit_count: number;
        notice: string | null;
    };
    data: {
        plan: {
            credit_limit_monthly: number;
            credit_limit_monthly_reset: string;
            credit_limit_monthly_reset_timestamp: string;
            rate_limit_minute: number;
        };
        usage: {
            current_minute: {
                requests_made: number;
                requests_left: number;
            };
            current_day: {
                requests_made: number;
                requests_left: number;
            };
            current_month: {
                requests_made: number;
                requests_left: number;
            };
        };
    };
}

/**
 * Standard CMC API response wrapper
 */
export interface CMCResponse<T> {
    status: {
        timestamp: string;
        error_code: number;
        error_message: string | null;
        elapsed: number;
        credit_count: number;
        notice: string | null;
    };
    data: T;
}

/**
 * Fear & Greed Index levels
 */
export enum FearGreedLevel {
    EXTREME_FEAR = 'extreme_fear',
    FEAR = 'fear',
    NEUTRAL = 'neutral',
    GREED = 'greed',
    EXTREME_GREED = 'extreme_greed'
}

/**
 * Fear & Greed Index interpretation
 */
export interface FearGreedInterpretation {
    value: number; // 0-100
    level: FearGreedLevel;
    description: string;
    moodFactor: number; // 0.9-1.1 for sentiment calculations
}

/**
 * Market sentiment interpretation
 */
export interface MarketSentimentInterpretation {
    symbol: string;
    sentiment: number; // -1 to 1
    volatility: number; // 0 to 1
    momentum: number; // -1 to 1
    confidence: number; // 0 to 1
    recommendation: 'bullish' | 'bearish' | 'neutral';
}
