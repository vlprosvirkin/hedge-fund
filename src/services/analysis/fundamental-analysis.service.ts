import type {
    AssetMetadata,
    ComprehensiveAnalysis
} from '../../types/index.js';

export interface OnChainMetrics {
    networkActivity: number;
    transactionEfficiency: number;
    addressGrowth: number;
    utxoHealth: number;
    networkSecurity: number;
}

export interface SocialMetrics {
    socialVolume: number;
    socialEngagement: number;
    sentimentScore: number;
    communityHealth: number;
}

export interface RiskMetrics {
    volatilityScore: number;
    correlationScore: number;
    drawdownRisk: number;
    profitTakingPressure: number;
}

export interface FundamentalData {
    marketCap: number;
    supply: {
        circulating: number;
        total: number;
        max: number;
    };
    volume: {
        total24h: number;
        averageTransaction: number;
        largeTransactions: number;
    };
    onChain: {
        hashRate: number;
        transactionVolume: number;
        activeAddresses: number;
        newAddresses: number;
        utxoCreated: number;
        utxoSpent: number;
    };
    network: {
        blockHeight: number;
        difficulty: number;
        transactionRate: number;
        blockSizeMean: number;
    };
    social: {
        volume24h: number;
        tweets: number;
        interactions: number;
        galaxyscore: number;
    };
    fees: {
        total: number;
        mean: number;
        median: number;
    };
    risk: {
        volatility30: number;
        btcCorrelation30: number;
        priceDrawdown: number;
        sopr: number;
    };
}

import { Signals } from '../../adapters/signals-adapter.js';

export class FundamentalAnalysisService {
    private signals: Signals;

    constructor(signals?: Signals) {
        this.signals = signals || new Signals();
    }
    /**
     * Calculate on-chain health score
     */
    calculateOnChainHealth(onChainMetrics: OnChainMetrics): number {
        const {
            networkActivity,
            transactionEfficiency,
            addressGrowth,
            utxoHealth,
            networkSecurity
        } = onChainMetrics;

        // Weighted average of on-chain metrics
        const onChainHealth = (
            networkActivity * 0.25 +
            transactionEfficiency * 0.25 +
            addressGrowth * 0.20 +
            utxoHealth * 0.15 +
            networkSecurity * 0.15
        );

        return Math.max(0, Math.min(1, onChainHealth));
    }

    /**
     * Calculate social sentiment score
     */
    calculateSocialSentiment(socialMetrics: SocialMetrics): number {
        const {
            socialVolume,
            socialEngagement,
            sentimentScore,
            communityHealth
        } = socialMetrics;

        // Weighted average of social metrics
        const socialSentiment = (
            socialVolume * 0.20 +
            socialEngagement * 0.25 +
            sentimentScore * 0.35 +
            communityHealth * 0.20
        );

        return Math.max(0, Math.min(1, socialSentiment));
    }

    /**
     * Calculate risk adjustment factor
     */
    calculateRiskAdjustment(riskMetrics: RiskMetrics): number {
        const {
            volatilityScore,
            correlationScore,
            drawdownRisk,
            profitTakingPressure
        } = riskMetrics;

        // Risk adjustment factor (0.5 to 1.5)
        const riskAdjustment = (
            volatilityScore * 0.3 +
            correlationScore * 0.2 +
            drawdownRisk * 0.3 +
            profitTakingPressure * 0.2
        );

        // Convert to 0.5-1.5 range
        return 0.5 + (riskAdjustment * 1.0);
    }

    /**
     * Calculate correlation factor for diversification
     */
    calculateCorrelationFactor(riskMetrics: RiskMetrics): number {
        const { correlationScore } = riskMetrics;

        // Lower correlation = better diversification = higher factor
        // Range: 0.8 to 1.2
        return 0.8 + (correlationScore * 0.4);
    }

    /**
     * Calculate liquidity score from market data
     */
    calculateLiquidityScore(marketData: any): number {
        const volume = marketData.volume24h || 0;
        const spread = marketData.spread || 0;
        const price = marketData.price || 1;

        // Volume score (0-1)
        const volumeScore = Math.min(volume / 1000000, 1.0);

        // Liquidity score based on spread (0-1)
        const liquidityScore = Math.max(0, 1 - (spread / 100));

        // Volatility score (lower volatility = higher confidence)
        const volatilityScore = Math.max(0, 1 - (Math.abs(marketData.priceChange24h || 0) / 50));

        // Weighted average
        const liquidityScoreFinal = (
            volumeScore * 0.4 +
            liquidityScore * 0.3 +
            volatilityScore * 0.3
        );

        return Math.max(0, Math.min(1, liquidityScoreFinal));
    }

    /**
     * Calculate volume momentum
     */
    calculateVolumeMomentum(marketData: any): number {
        const volumeChange = marketData.volumeChange24h || 0;

        // Normalize volume change to -1 to 1 range
        const momentum = Math.max(-1, Math.min(1, volumeChange / 100));

        return momentum;
    }

    /**
     * Calculate market cap health
     */
    calculateMarketCapHealth(fundamentalData: FundamentalData): number {
        const { marketCap, supply } = fundamentalData;

        if (marketCap === 0 || supply.total === 0) return 0.5;

        // Market cap efficiency (higher is better)
        const marketCapEfficiency = Math.min(marketCap / (supply.total * 100000), 1.0);

        // Supply utilization (circulating vs total)
        const supplyUtilization = supply.circulating / supply.total;

        // Market cap health score
        const marketCapHealth = (marketCapEfficiency + supplyUtilization) / 2;

        return Math.max(0, Math.min(1, marketCapHealth));
    }

    /**
     * Calculate comprehensive fundamental score
     */
    calculateFundamentalScore(
        liquidityScore: number,
        volumeMomentum: number,
        trendStrength: number,
        marketCapHealth: number,
        onChainHealth: number,
        socialSentiment: number,
        riskAdjustment: number,
        correlationFactor: number
    ): number {
        // Enhanced fundamental score formula - weighted average instead of multiplication
        const weights = {
            liquidity: 0.25,
            momentum: 0.15,
            trend: 0.10,
            marketCap: 0.20,
            onChain: 0.15,
            social: 0.10,
            risk: 0.05
        };

        // Normalize momentum to 0-1 range
        const normalizedMomentum = Math.max(0, Math.min(1, Math.abs(volumeMomentum)));

        // Normalize trend strength to 0-1 range
        const normalizedTrend = Math.max(0, Math.min(1, trendStrength));

        const fundamentalScore = (
            liquidityScore * weights.liquidity +
            normalizedMomentum * weights.momentum +
            normalizedTrend * weights.trend +
            marketCapHealth * weights.marketCap +
            onChainHealth * weights.onChain +
            socialSentiment * weights.social +
            (riskAdjustment - 0.5) * 2 * weights.risk // Convert 0.5-1.5 range to 0-1
        );

        return Math.max(0, Math.min(1, fundamentalScore));
    }

    /**
     * Calculate confidence based on data quality
     */
    calculateConfidence(
        marketData: any,
        fundamentalData: FundamentalData,
        onChainMetrics: OnChainMetrics,
        socialMetrics: SocialMetrics
    ): number {
        let confidence = 0.5; // Base confidence

        // Data availability checks
        if (marketData && marketData.volume24h > 0) confidence += 0.1;
        if (fundamentalData.marketCap > 0) confidence += 0.1;
        if (onChainMetrics.networkActivity > 0) confidence += 0.1;
        if (socialMetrics.sentimentScore > 0) confidence += 0.1;

        // Data quality checks
        if (marketData && marketData.spread < 1) confidence += 0.1; // Low spread = high quality
        if (fundamentalData.onChain.activeAddresses > 1000) confidence += 0.1; // Active network
        if (socialMetrics.socialVolume > 1000) confidence += 0.1; // Social activity

        return Math.max(0.1, Math.min(1.0, confidence));
    }

    /**
     * Generate fundamental analysis summary for LLM
     */
    getFundamentalSummary(
        fundamentalData: FundamentalData,
        onChainMetrics: OnChainMetrics,
        socialMetrics: SocialMetrics,
        riskMetrics: RiskMetrics
    ): {
        liquidityStatus: string;
        networkStatus: string;
        socialStatus: string;
        riskStatus: string;
        overallHealth: string;
    } {
        // Liquidity Status
        let liquidityStatus = 'poor';
        if (fundamentalData.volume.total24h > 1000000000) liquidityStatus = 'excellent';
        else if (fundamentalData.volume.total24h > 100000000) liquidityStatus = 'good';
        else if (fundamentalData.volume.total24h > 10000000) liquidityStatus = 'moderate';

        // Network Status
        let networkStatus = 'weak';
        if (onChainMetrics.networkActivity > 0.7) networkStatus = 'strong';
        else if (onChainMetrics.networkActivity > 0.3) networkStatus = 'moderate';

        // Social Status
        let socialStatus = 'low';
        if (socialMetrics.sentimentScore > 0.7) socialStatus = 'high';
        else if (socialMetrics.sentimentScore > 0.4) socialStatus = 'moderate';

        // Risk Status
        let riskStatus = 'high';
        if (riskMetrics.volatilityScore > 0.7 && riskMetrics.correlationScore > 0.7) riskStatus = 'low';
        else if (riskMetrics.volatilityScore > 0.4 && riskMetrics.correlationScore > 0.4) riskStatus = 'moderate';

        // Overall Health
        const onChainHealth = this.calculateOnChainHealth(onChainMetrics);
        const socialSentiment = this.calculateSocialSentiment(socialMetrics);

        let overallHealth = 'poor';
        if (onChainHealth > 0.7 && socialSentiment > 0.7) overallHealth = 'excellent';
        else if (onChainHealth > 0.4 && socialSentiment > 0.4) overallHealth = 'good';
        else if (onChainHealth > 0.2 && socialSentiment > 0.2) overallHealth = 'moderate';

        return {
            liquidityStatus,
            networkStatus,
            socialStatus,
            riskStatus,
            overallHealth
        };
    }

    /**
     * Get all fundamental data for an asset
     */
    async getFundamentalDataForAsset(ticker: string, timeframe: string = '4h'): Promise<{
        fundamentalData: FundamentalData;
        onChainMetrics: OnChainMetrics;
        socialMetrics: SocialMetrics;
        riskMetrics: RiskMetrics;
        marketData: any;
    }> {
        try {
            // Get raw data from Signals adapter
            const rawData = await this.signals.getRawIndicatorsData(ticker, timeframe);

            // Process raw data into structured formats
            const fundamentalData = this.processRawDataToFundamentalData(rawData);
            const onChainMetrics = this.processRawDataToOnChainMetrics(rawData);
            const socialMetrics = this.processRawDataToSocialMetrics(rawData);
            const riskMetrics = this.processRawDataToRiskMetrics(rawData);

            return {
                fundamentalData,
                onChainMetrics,
                socialMetrics,
                riskMetrics,
                marketData: null // Will be passed separately from BinanceAdapter
            };
        } catch (error) {
            console.error(`Error getting fundamental data for ${ticker}:`, error);
            return {
                fundamentalData: this.getDefaultFundamentalData(),
                onChainMetrics: this.getDefaultOnChainMetrics(),
                socialMetrics: this.getDefaultSocialMetrics(),
                riskMetrics: this.getDefaultRiskMetrics(),
                marketData: null
            };
        }
    }

    /**
     * Process raw API data to FundamentalData structure
     */
    private processRawDataToFundamentalData(rawData: any): FundamentalData {
        return {
            marketCap: rawData.market_cap || rawData.market_cap_calc || 0,
            supply: {
                circulating: rawData.circulating_supply || rawData.circulating_supply_cmc || 0,
                total: rawData.total_supply || rawData.total_supply_cmc || 0,
                max: rawData.max_supply || 0,
            },
            volume: {
                total24h: rawData.total_value_traded || rawData["24h_vol_cmc"] || 0,
                averageTransaction: rawData.average_transaction_usd || 0,
                largeTransactions: rawData.large_tx_volume_usd || 0,
            },
            onChain: {
                hashRate: rawData.hash_rate || 0,
                transactionVolume: rawData.txs_volume_usd || 0,
                activeAddresses: rawData.addresses_active || 0,
                newAddresses: rawData.addresses_new || 0,
                utxoCreated: rawData.utxo_created || 0,
                utxoSpent: rawData.utxo_spent || 0,
            },
            network: {
                blockHeight: rawData.block_height || 0,
                difficulty: rawData.difficulty || 0,
                transactionRate: rawData.transaction_rate || 0,
                blockSizeMean: rawData.block_size_mean || 0,
            },
            social: {
                volume24h: rawData.social_volume_24h || 0,
                tweets: rawData.tweets || 0,
                interactions: rawData.interactions || 0,
                galaxyscore: rawData.galaxyscore || 0,
            },
            fees: {
                total: rawData.fees_total_usd || 0,
                mean: rawData.fees_mean_usd || 0,
                median: rawData.fees_median_usd || 0,
            },
            risk: {
                volatility30: rawData.volatility_30 || 0,
                btcCorrelation30: rawData.btc_correlation_30 || 0,
                priceDrawdown: rawData.price_drawdown || 0,
                sopr: rawData.sopr || 0,
            },
        };
    }

    /**
     * Process raw API data to OnChainMetrics structure
     */
    private processRawDataToOnChainMetrics(rawData: any): OnChainMetrics {
        // Network Activity Score (0-1)
        const networkActivity = Math.min(
            (rawData.addresses_active || 0) / 1000000, // Normalize by 1M active addresses
            1.0
        );

        // Transaction Efficiency Score (0-1)
        const transactionEfficiency = Math.min(
            (rawData.txs_volume_usd || 0) / (rawData.market_cap || 1), // Volume/Market Cap ratio
            1.0
        );

        // Address Growth Score (0-1)
        const addressGrowth = Math.min(
            (rawData.addresses_new || 0) / 10000, // Normalize by 10K new addresses
            1.0
        );

        // UTXO Health Score (0-1)
        const utxoHealth = Math.min(
            (rawData.utxo_created || 0) / (rawData.utxo_spent || 1), // UTXO creation/spending ratio
            1.0
        );

        // Network Security Score (0-1)
        const networkSecurity = Math.min(
            (rawData.hash_rate || 0) / 1e20, // Normalize by 100 EH/s
            1.0
        );

        return {
            networkActivity,
            transactionEfficiency,
            addressGrowth,
            utxoHealth,
            networkSecurity,
        };
    }

    /**
     * Process raw API data to SocialMetrics structure
     */
    private processRawDataToSocialMetrics(rawData: any): SocialMetrics {
        // Social Volume Score (0-1)
        const socialVolume = Math.min(
            (rawData.social_volume_24h || 0) / 100000, // Normalize by 100K social volume
            1.0
        );

        // Social Engagement Score (0-1)
        const socialEngagement = Math.min(
            (rawData.interactions || 0) / 1000000, // Normalize by 1M interactions
            1.0
        );

        // Sentiment Score (0-1)
        const sentimentScore = (rawData.sentiment || 50) / 100; // Normalize 0-100 to 0-1

        // Community Health Score (0-1)
        const communityHealth = Math.min(
            (rawData.galaxyscore || 0) / 100, // GalaxyScore is already 0-100
            1.0
        );

        return {
            socialVolume,
            socialEngagement,
            sentimentScore,
            communityHealth,
        };
    }

    /**
     * Process raw API data to RiskMetrics structure with improved validation
     */
    private processRawDataToRiskMetrics(rawData: any): RiskMetrics {
        // Volatility Score (0-1) - higher is more volatile
        const volatilityScore = this.normalizeRiskValue(
            rawData.volatility_30 || 0,
            'volatility',
            0,
            100
        );

        // Correlation Score (0-1) - higher means more correlated with BTC
        const correlationScore = this.normalizeRiskValue(
            Math.abs(rawData.btc_correlation_30 || 0),
            'correlation',
            0,
            1
        );

        // Drawdown Risk (0-1) - higher means higher risk of drawdown
        const drawdownRisk = this.normalizeRiskValue(
            Math.abs(rawData.price_drawdown || 0),
            'drawdown',
            0,
            1
        );

        // Profit Taking Pressure (0-1) - based on SOPR
        const sopr = rawData.sopr || 1.0;
        const profitTakingPressure = sopr > 1.1 ? 0.8 : sopr > 1.05 ? 0.6 : sopr > 1.0 ? 0.4 : 0.2;

        return {
            volatilityScore,
            correlationScore,
            drawdownRisk,
            profitTakingPressure
        };
    }

    /**
     * Normalize risk values to 0-1 range with validation
     */
    private normalizeRiskValue(value: number, type: string, min: number, max: number): number {
        // Handle invalid values
        if (!isFinite(value) || isNaN(value)) {
            console.warn(`⚠️ Invalid ${type} value: ${value}, using default`);
            return 0.5; // Default to medium risk
        }

        // Clamp to expected range
        const clampedValue = Math.max(min, Math.min(max, value));

        // Normalize to 0-1
        return (clampedValue - min) / (max - min);
    }

    /**
     * Generate risk flags based on actual metrics
     */
    private generateRiskFlags(
        fundamentalData: FundamentalData,
        onChainMetrics: OnChainMetrics,
        socialMetrics: SocialMetrics,
        riskMetrics: RiskMetrics
    ): string[] {
        const flags: string[] = [];

        // Liquidity risk
        if (fundamentalData.volume.total24h < 1000000) { // Less than 1M daily volume
            flags.push('low_liquidity');
        }

        // On-chain activity risk
        if (onChainMetrics.networkActivity < 0.1) {
            flags.push('low_onchain_activity');
        } else if (onChainMetrics.networkActivity < 0.3) {
            flags.push('moderate_onchain');
        }

        // Market cap health risk
        if (fundamentalData.marketCap < 100000000) { // Less than 100M market cap
            flags.push('low_market_cap');
        } else if (fundamentalData.marketCap < 1000000000) { // Less than 1B market cap
            flags.push('moderate_market_cap');
        }

        // Volatility risk
        if (riskMetrics.volatilityScore > 0.7) {
            flags.push('high_volatility');
        }

        // Correlation risk
        if (riskMetrics.correlationScore > 0.8) {
            flags.push('high_correlation');
        }

        // Drawdown risk
        if (riskMetrics.drawdownRisk > 0.6) {
            flags.push('high_drawdown_risk');
        }

        // Social sentiment risk
        if (socialMetrics.sentimentScore < 0.3) {
            flags.push('negative_sentiment');
        }

        // Network security risk
        if (onChainMetrics.networkSecurity < 0.2) {
            flags.push('low_network_security');
        }

        return flags;
    }

    /**
     * Get default FundamentalData structure
     */
    private getDefaultFundamentalData(): FundamentalData {
        return {
            marketCap: 0,
            supply: { circulating: 0, total: 0, max: 0 },
            volume: { total24h: 0, averageTransaction: 0, largeTransactions: 0 },
            onChain: { hashRate: 0, transactionVolume: 0, activeAddresses: 0, newAddresses: 0, utxoCreated: 0, utxoSpent: 0 },
            network: { blockHeight: 0, difficulty: 0, transactionRate: 0, blockSizeMean: 0 },
            social: { volume24h: 0, tweets: 0, interactions: 0, galaxyscore: 0 },
            fees: { total: 0, mean: 0, median: 0 },
            risk: { volatility30: 0, btcCorrelation30: 0, priceDrawdown: 0, sopr: 0 }
        };
    }

    /**
     * Get default OnChainMetrics structure
     */
    private getDefaultOnChainMetrics(): OnChainMetrics {
        return {
            networkActivity: 0,
            transactionEfficiency: 0,
            addressGrowth: 0,
            utxoHealth: 0,
            networkSecurity: 0
        };
    }

    /**
     * Get default SocialMetrics structure
     */
    private getDefaultSocialMetrics(): SocialMetrics {
        return {
            socialVolume: 0,
            socialEngagement: 0,
            sentimentScore: 0,
            communityHealth: 0
        };
    }

    /**
     * Get default RiskMetrics structure
     */
    private getDefaultRiskMetrics(): RiskMetrics {
        return {
            volatilityScore: 0,
            correlationScore: 0,
            drawdownRisk: 0,
            profitTakingPressure: 0
        };
    }

    /**
     * Create comprehensive fundamental analysis
     */
    createFundamentalAnalysis(
        fundamentalData: FundamentalData,
        onChainMetrics: OnChainMetrics,
        socialMetrics: SocialMetrics,
        riskMetrics: RiskMetrics,
        marketData: any
    ): {
        fundamentalScore: number;
        confidence: number;
        summary: any;
        signals: Array<{ name: string, value: number }>;
        riskFlags: string[];
    } {
        // Calculate component scores
        const liquidityScore = this.calculateLiquidityScore(marketData);
        const volumeMomentum = this.calculateVolumeMomentum(marketData);
        const marketCapHealth = this.calculateMarketCapHealth(fundamentalData);
        const onChainHealth = this.calculateOnChainHealth(onChainMetrics);
        const socialSentiment = this.calculateSocialSentiment(socialMetrics);
        const riskAdjustment = this.calculateRiskAdjustment(riskMetrics);
        const correlationFactor = this.calculateCorrelationFactor(riskMetrics);

        // Calculate final fundamental score
        const fundamentalScore = this.calculateFundamentalScore(
            liquidityScore,
            volumeMomentum,
            0.5, // Default trend strength (should come from technical analysis)
            marketCapHealth,
            onChainHealth,
            socialSentiment,
            riskAdjustment,
            correlationFactor
        );

        // Log intermediate calculations for debugging
        console.log(`🔍 FundamentalAnalysisService: Component scores:`, {
            liquidityScore,
            volumeMomentum,
            marketCapHealth,
            onChainHealth,
            socialSentiment,
            riskAdjustment,
            correlationFactor,
            fundamentalScore
        });

        // Calculate confidence
        const confidence = this.calculateConfidence(marketData, fundamentalData, onChainMetrics, socialMetrics);

        // Generate summary
        const summary = this.getFundamentalSummary(fundamentalData, onChainMetrics, socialMetrics, riskMetrics);

        // Generate signals
        const signals = [
            { name: 'liquidity_score', value: liquidityScore },
            { name: 'volume_momentum', value: volumeMomentum },
            { name: 'market_cap_health', value: marketCapHealth },
            { name: 'on_chain_health', value: onChainHealth },
            { name: 'social_sentiment', value: socialSentiment },
            { name: 'risk_adjustment', value: riskAdjustment },
            { name: 'correlation_factor', value: correlationFactor },
            { name: 'network_activity', value: onChainMetrics.networkActivity },
            { name: 'transaction_efficiency', value: onChainMetrics.transactionEfficiency },
            { name: 'address_growth', value: onChainMetrics.addressGrowth },
            { name: 'utxo_health', value: onChainMetrics.utxoHealth },
            { name: 'network_security', value: onChainMetrics.networkSecurity },
            { name: 'social_volume', value: socialMetrics.socialVolume },
            { name: 'social_engagement', value: socialMetrics.socialEngagement },
            { name: 'sentiment_score', value: socialMetrics.sentimentScore },
            { name: 'community_health', value: socialMetrics.communityHealth },
            { name: 'volatility_score', value: riskMetrics.volatilityScore },
            { name: 'correlation_score', value: riskMetrics.correlationScore },
            { name: 'drawdown_risk', value: riskMetrics.drawdownRisk },
            { name: 'profit_taking_pressure', value: riskMetrics.profitTakingPressure }
        ];

        // Generate risk flags
        const riskFlags = this.generateRiskFlags(fundamentalData, onChainMetrics, socialMetrics, riskMetrics);

        return {
            fundamentalScore,
            confidence,
            summary,
            signals,
            riskFlags
        };
    }
}
