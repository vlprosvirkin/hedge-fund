import { z } from 'zod';

// ===== Technical Indicators API Response Types =====

// Base response structure for stats endpoint
export const StatsResponseSchema = z.object({
    status: z.string(),
    data: z.object({
        // Core Technical Indicators
        RSI: z.number(),
        "RSI[1]": z.number().optional(),

        // MACD
        "MACD.macd": z.number(),
        "MACD.signal": z.number(),

        // ADX
        ADX: z.number(),
        "ADX+DI": z.number(),
        "ADX-DI": z.number(),
        "ADX+DI[1]": z.number().optional(),
        "ADX-DI[1]": z.number().optional(),

        // Moving Averages
        SMA10: z.number(),
        SMA20: z.number(),
        SMA30: z.number(),
        SMA50: z.number(),
        SMA100: z.number(),
        SMA200: z.number(),

        EMA10: z.number(),
        EMA20: z.number(),
        EMA30: z.number(),
        EMA50: z.number(),
        EMA100: z.number(),
        EMA200: z.number(),

        // Stochastic
        "Stoch.K": z.number(),
        "Stoch.D": z.number(),
        "Stoch.K[1]": z.number().optional(),
        "Stoch.D[1]": z.number().optional(),
        "Stoch.RSI.K": z.number().optional(),

        // Momentum
        Mom: z.number().optional(),
        "Mom[1]": z.number().optional(),

        // Awesome Oscillator
        AO: z.number().optional(),
        "AO[1]": z.number().optional(),
        "AO[2]": z.number().optional(),

        // Other Technical Indicators
        BBPower: z.number().optional(),
        CCI20: z.number().optional(),
        "CCI20[1]": z.number().optional(),
        HullMA9: z.number().optional(),
        UO: z.number().optional(),
        VWMA: z.number().optional(),
        "W.R": z.number().optional(),

        // Ichimoku
        "Ichimoku.BLine": z.number().optional(),

        // Pivot Points
        "Pivot.M.Classic.Middle": z.number().optional(),
        "Pivot.M.Classic.R1": z.number().optional(),
        "Pivot.M.Classic.R2": z.number().optional(),
        "Pivot.M.Classic.R3": z.number().optional(),
        "Pivot.M.Classic.S1": z.number().optional(),
        "Pivot.M.Classic.S2": z.number().optional(),
        "Pivot.M.Classic.S3": z.number().optional(),

        // Recommendations
        "Recommend.All": z.number().optional(),
        "Recommend.MA": z.number().optional(),
        "Recommend.Other": z.number().optional(),
        "Rec.BBPower": z.number().optional(),
        "Rec.HullMA9": z.number().optional(),
        "Rec.Ichimoku": z.number().optional(),
        "Rec.Stoch.RSI": z.number().optional(),
        "Rec.UO": z.number().optional(),
        "Rec.VWMA": z.number().optional(),
        "Rec.WR": z.number().optional(),

        // Price Data
        close: z.number(),
    }),
});

// Indicators endpoint response (asset metadata)
export const IndicatorsResponseSchema = z.object({
    // Price data
    lp: z.number().optional(), // Last price
    volume: z.number().optional(),
    ch: z.number().optional(), // Change
    chp: z.number().optional(), // Change percent
    market_cap_calc: z.number().optional(),
    sentiment: z.number().optional(), // 0-100

    // Additional metadata
    symbol: z.string().optional(),
    timeframe: z.string().optional(),
    timestamp: z.number().optional(),
});

// Technical Analysis News API response
export const TechnicalNewsItemSchema = z.object({
    title: z.string(),
    paragraph: z.string(),
    preview_image: z.string(),
    author: z.string(),
    comments_count: z.null(),
    boosts_count: z.number(),
    publication_datetime: z.date(),
    is_updated: z.boolean(),
    idea_strategy: z.string(),
});

export const TechnicalNewsResultSchema = z.object({
    items: z.array(TechnicalNewsItemSchema),
});

// Supported tokens response
export const SupportedTokensResponseSchema = z.object({
    supported_tokens: z.array(z.string()),
});

// ===== Request Types =====

export const IndicatorRequestSchema = z.object({
    symbol: z.string(),
    timeframe: z.string(),
    indicator: z.string(),
    parameters: z.record(z.any()).optional(),
    limit: z.number().optional(),
});

export const BatchIndicatorRequestSchema = z.object({
    requests: z.array(IndicatorRequestSchema),
});

// ===== Response Types for Legacy API =====

export const IndicatorValueSchema = z.object({
    timestamp: z.number(),
    value: z.number(),
    parameters: z.record(z.any()).optional(),
});

export const IndicatorResponseSchema = z.object({
    symbol: z.string(),
    indicator: z.string(),
    timeframe: z.string(),
    values: z.array(IndicatorValueSchema),
});

export const BatchIndicatorResponseSchema = z.object({
    results: z.array(IndicatorResponseSchema),
});

// ===== Signal Analysis Types =====

export const SignalTypeSchema = z.enum(['bullish', 'bearish', 'neutral']);

export const SignalSchema = z.object({
    indicator: z.string(),
    value: z.number(),
    signal: SignalTypeSchema,
    weight: z.number(),
});

export const SignalStrengthSchema = z.object({
    strength: z.number(), // -1 to 1 (bearish to bullish)
    signals: z.array(SignalSchema),
});

// ===== Comprehensive Analysis Types =====

export const AssetMetadataSchema = z.object({
    price: z.number(),
    volume: z.number(),
    change: z.number(),
    changePercent: z.number(),
    marketCap: z.number(),
    sentiment: z.number(),
});

export const RecommendationSchema = z.enum(['BUY', 'HOLD', 'SELL']);

export const ComprehensiveAnalysisSchema = z.object({
    technical: z.any(), // Using the data from StatsResponseSchema
    metadata: AssetMetadataSchema,
    news: TechnicalNewsResultSchema,
    signalStrength: z.number(),
    recommendation: RecommendationSchema,
});

// ===== Indicator Info Types =====

export const IndicatorParameterSchema = z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    default: z.any().optional(),
    description: z.string().optional(),
});

export const IndicatorInfoSchema = z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.array(IndicatorParameterSchema),
});

// ===== Available Indicators Response =====

export const AvailableIndicatorsResponseSchema = z.object({
    indicators: z.array(z.string()),
});

// ===== Type Exports =====

export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type IndicatorData = z.infer<typeof StatsResponseSchema>['data'];
export type IndicatorsResponse = z.infer<typeof IndicatorsResponseSchema>;
export type TechnicalNewsItem = z.infer<typeof TechnicalNewsItemSchema>;
export type TechnicalNewsResult = z.infer<typeof TechnicalNewsResultSchema>;
export type SupportedTokensResponse = z.infer<typeof SupportedTokensResponseSchema>;
export type IndicatorRequest = z.infer<typeof IndicatorRequestSchema>;
export type BatchIndicatorRequest = z.infer<typeof BatchIndicatorRequestSchema>;
export type IndicatorValue = z.infer<typeof IndicatorValueSchema>;
export type IndicatorResponse = z.infer<typeof IndicatorResponseSchema>;
export type BatchIndicatorResponse = z.infer<typeof BatchIndicatorResponseSchema>;
export type SignalType = z.infer<typeof SignalTypeSchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type SignalStrength = z.infer<typeof SignalStrengthSchema>;
export type AssetMetadata = z.infer<typeof AssetMetadataSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type ComprehensiveAnalysis = z.infer<typeof ComprehensiveAnalysisSchema>;
export type IndicatorParameter = z.infer<typeof IndicatorParameterSchema>;
export type IndicatorInfo = z.infer<typeof IndicatorInfoSchema>;
export type AvailableIndicatorsResponse = z.infer<typeof AvailableIndicatorsResponseSchema>;

// ===== Utility Types =====

export interface TechnicalIndicator {
    name: string;
    value: number;
    timestamp: number;
    parameters?: Record<string, any>;
}

// ===== Constants =====

export const INDICATOR_THRESHOLDS = {
    RSI: { overbought: 70, oversold: 30 },
    STOCHASTIC: { overbought: 80, oversold: 20 },
    WILLIAMS_R: { overbought: -20, oversold: -80 },
    CCI: { overbought: 100, oversold: -100 },
} as const;

export const SIGNAL_WEIGHTS = {
    RSI: 0.3,
    MACD: 0.3,
    STOCHASTIC: 0.2,
    WILLIAMS_R: 0.2,
} as const;
