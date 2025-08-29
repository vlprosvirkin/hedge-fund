import { z } from 'zod';

// ===== Technical Indicators API Response Types =====

// Base response structure for stats endpoint (technical indicators)
export const StatsResponseSchema = z.object({
    status: z.string(),
    data: z.object({
        // ADX (Trend Strength)
        "ADX+DI[1]": z.number(),
        "ADX+DI": z.number(),
        "ADX-DI[1]": z.number(),
        "ADX-DI": z.number(),
        ADX: z.number(),

        // Awesome Oscillator
        "AO[1]": z.number(),
        "AO[2]": z.number(),
        AO: z.number(),

        // Bollinger Bands
        BBPower: z.number(),
        "BB.upper": z.number(), // Upper Bollinger Band
        "BB.lower": z.number(), // Lower Bollinger Band
        "BB.middle": z.number(), // Middle Bollinger Band (SMA20)

        // CCI (Commodity Channel Index)
        "CCI20[1]": z.number(),
        CCI20: z.number(),

        // Exponential Moving Averages
        EMA100: z.number(),
        EMA10: z.number(),
        EMA200: z.number(),
        EMA20: z.number(),
        EMA30: z.number(),
        EMA50: z.number(),

        // Hull Moving Average
        HullMA9: z.number(),

        // Ichimoku
        "Ichimoku.BLine": z.number(),

        // MACD
        "MACD.macd": z.number(),
        "MACD.signal": z.number(),
        "MACD.hist": z.number(), // MACD histogram (MACD - Signal)

        // Momentum
        "Mom[1]": z.number(),
        Mom: z.number(),

        // Pivot Points - Camarilla
        "Pivot.M.Camarilla.Middle": z.number(),
        "Pivot.M.Camarilla.R1": z.number(),
        "Pivot.M.Camarilla.R2": z.number(),
        "Pivot.M.Camarilla.R3": z.number(),
        "Pivot.M.Camarilla.S1": z.number(),
        "Pivot.M.Camarilla.S2": z.number(),
        "Pivot.M.Camarilla.S3": z.number(),

        // Pivot Points - Classic
        "Pivot.M.Classic.Middle": z.number(),
        "Pivot.M.Classic.R1": z.number(),
        "Pivot.M.Classic.R2": z.number(),
        "Pivot.M.Classic.R3": z.number(),
        "Pivot.M.Classic.S1": z.number(),
        "Pivot.M.Classic.S2": z.number(),
        "Pivot.M.Classic.S3": z.number(),

        // Pivot Points - Demark
        "Pivot.M.Demark.Middle": z.number(),
        "Pivot.M.Demark.R1": z.number(),
        "Pivot.M.Demark.S1": z.number(),

        // Pivot Points - Fibonacci
        "Pivot.M.Fibonacci.Middle": z.number(),
        "Pivot.M.Fibonacci.R1": z.number(),
        "Pivot.M.Fibonacci.R2": z.number(),
        "Pivot.M.Fibonacci.R3": z.number(),
        "Pivot.M.Fibonacci.S1": z.number(),
        "Pivot.M.Fibonacci.S2": z.number(),
        "Pivot.M.Fibonacci.S3": z.number(),

        // Pivot Points - Woodie
        "Pivot.M.Woodie.Middle": z.number(),
        "Pivot.M.Woodie.R1": z.number(),
        "Pivot.M.Woodie.R2": z.number(),
        "Pivot.M.Woodie.R3": z.number(),
        "Pivot.M.Woodie.S1": z.number(),
        "Pivot.M.Woodie.S2": z.number(),
        "Pivot.M.Woodie.S3": z.number(),

        // RSI
        "RSI[1]": z.number(),
        RSI: z.number(),

        // Recommendations
        "Rec.BBPower": z.number(),
        "Rec.HullMA9": z.number(),
        "Rec.Ichimoku": z.number(),
        "Rec.Stoch.RSI": z.number(),
        "Rec.UO": z.number(),
        "Rec.VWMA": z.number(),
        "Rec.WR": z.number(),
        "Recommend.All": z.number(),
        "Recommend.MA": z.number(),
        "Recommend.Other": z.number(),

        // Simple Moving Averages
        SMA100: z.number(),
        SMA10: z.number(),
        SMA200: z.number(),
        SMA20: z.number(),
        SMA30: z.number(),
        SMA50: z.number(),

        // Stochastic
        "Stoch.D[1]": z.number(),
        "Stoch.D": z.number(),
        "Stoch.K[1]": z.number(),
        "Stoch.K": z.number(),
        "Stoch.RSI.K": z.number(),

        // Ultimate Oscillator
        UO: z.number(),

        // Volume Weighted Moving Average
        VWMA: z.number(),

        // Williams %R
        "W.R": z.number(),

        // Current Price
        close: z.number(),
    }),
});

// Indicators endpoint response (raw API data)
export const IndicatorsResponseSchema = z.object({
    // Basic price data
    lp: z.number().optional(), // Last price
    volume: z.number().optional(),
    ch: z.number().optional(), // Change
    chp: z.number().optional(), // Change percent
    market_cap_calc: z.number().optional(),
    sentiment: z.number().optional(), // 0-100

    // Metadata
    symbol: z.string().optional(),
    timeframe: z.string().optional(),
    timestamp: z.number().optional(),

    // Market data
    market_cap: z.number().optional(),
    circulating_supply: z.number().optional(),
    total_supply: z.number().optional(),
    max_supply: z.number().optional(),
    total_value_traded: z.number().optional(),
    average_transaction_usd: z.number().optional(),
    large_tx_volume_usd: z.number().optional(),

    // On-chain metrics
    hash_rate: z.number().optional(),
    txs_volume_usd: z.number().optional(),
    addresses_active: z.number().optional(),
    addresses_new: z.number().optional(),
    utxo_created: z.number().optional(),
    utxo_spent: z.number().optional(),
    block_height: z.number().optional(),
    difficulty: z.number().optional(),
    transaction_rate: z.number().optional(),
    block_size_mean: z.number().optional(),

    // Social metrics
    social_volume_24h: z.number().optional(),
    tweets: z.number().optional(),
    interactions: z.number().optional(),
    galaxyscore: z.number().optional(),

    // Fee metrics
    fees_total_usd: z.number().optional(),
    fees_mean_usd: z.number().optional(),
    fees_median_usd: z.number().optional(),

    // Risk metrics
    price_drawdown: z.number().optional(),
    sopr: z.number().optional(),
    volatility_30: z.number().optional(),
    btc_correlation_30: z.number().optional(),

    // Additional fields from actual API response
    description: z.string().optional(),
    exchange: z.string().optional(),
    currency_code: z.string().optional(),
    lp_time: z.number().optional(),
    prev_close_price: z.number().optional(),
    open_price: z.number().optional(),
    high_price: z.number().optional(),
    low_price: z.number().optional(),
    popularity: z.number().optional(),
    cmc_rank: z.number().optional(),
    altrank: z.number().optional(),
    tvl: z.number().optional(),
    market_pairs: z.number().optional(),
    socialdominance: z.number().optional(),
    txs_count: z.number().optional(),
    transaction_size_mean: z.number().optional(),
    block_interval_mean: z.number().optional(),
    block_interval_median: z.number().optional(),
    utxo_value_created_mean: z.number().optional(),
    utxo_value_created_total: z.number().optional(),
    utxo_value_spent_mean: z.number().optional(),
    utxo_value_spent_total: z.number().optional(),
    utxo_value_created_median: z.number().optional(),
    utxo_value_spent_median: z.number().optional(),
    large_tx_count: z.number().optional(),
    total_addresses_with_balance: z.number().optional(),
    receiving_addresses: z.number().optional(),
    sending_addresses: z.number().optional(),
    addresses_active_7d_coinm: z.number().optional(),
    addresses_balance_1m_usd_coinm: z.number().optional(),
    addresses_balance_100k_usd_coinm: z.number().optional(),
    addresses_balance_1k_usd_coinm: z.number().optional(),
    addresses_balance_1_usd_coinm: z.number().optional(),
    supply_addresses_balance_1_coinm: z.number().optional(),
    supply_addresses_balance_1_in_1b_coinm: z.number().optional(),
    supply_addresses_balance_1k_coinm: z.number().optional(),
    supply_addresses_balance_1_in_1k_coinm: z.number().optional(),
    supply_addresses_balance_100k_usd_coinm: z.number().optional(),
    supply_addresses_balance_1m_usd_coinm: z.number().optional(),
    supply_addresses_balance_1_in_1m_coinm: z.number().optional(),
    supply_addresses_balance_0001_coinm: z.number().optional(),
    supply_addresses_balance_1_usd_coinm: z.number().optional(),
    addresses_supply_1_in_1m_coinm: z.number().optional(),
    addresses_supply_1_in_1k_coinm: z.number().optional(),
    addresses_supply_1_in_1b_coinm: z.number().optional(),
    addresses_new_coinm: z.number().optional(),
    addresses_active_coinm: z.number().optional(),
    total_addresses_with_balance_coinm: z.number().optional(),
    txs_volume_coinm: z.number().optional(),
    txs_count_coinm: z.number().optional(),
    txs_volume_usd_coinm: z.number().optional(),
    large_tx_volume_usd_coinm: z.number().optional(),
    large_tx_count_coinm: z.number().optional(),
    fees_total: z.number().optional(),
    fees_mean: z.number().optional(),
    fees_median: z.number().optional(),
    fees_usd_coinm: z.number().optional(),
    market_cap_ff_coinm: z.number().optional(),
    market_cap_real_coinm: z.number().optional(),
    market_cap_sply_coinm: z.number().optional(),
    market_cap_diluted_calc: z.number().optional(),
    circulating_supply_cmc: z.number().optional(),
    total_supply_cmc: z.number().optional(),
    total_shares_outstanding: z.number().optional(),
    total_shares_diluted: z.number().optional(),
    active_supply_1y_coinm: z.number().optional(),
    ser_coinm: z.number().optional(),
    rvtadj90_coinm: z.number().optional(),
    supply_active_1year_ago: z.number().optional(),
    postscreated: z.number().optional(),
    postsactive: z.number().optional(),
    contributorsactive: z.number().optional(),
    contributorscreated: z.number().optional(),
    blocks_mined: z.number().optional(),
    block_size_total: z.number().optional(),
    transaction_size_total: z.number().optional(),
    "24h_vol_cmc": z.number().optional(),
    "24h_vol_change_cmc": z.number().optional(),
    price_percent_change_1_week: z.number().optional(),
    price_percent_change_52_week: z.number().optional(),
    price_52_week_high: z.number().optional(),
    price_52_week_low: z.number().optional(),
    all_time_high: z.number().optional(),
    all_time_low: z.number().optional(),
    all_time_high_day: z.number().optional(),
    all_time_low_day: z.number().optional(),
    all_time_open: z.number().optional(),
    popularity_rank: z.number().optional(),
    local_popularity: z.record(z.number()).optional(),
    local_popularity_rank: z.record(z.number()).optional(),
    crypto_rank: z.number().optional(),
    crypto_total_rank: z.number().optional(),
    crypto_categories: z.string().optional(),
    crypto_common_categories: z.array(z.string()).optional(),
    crypto_blockchain_ecosystems: z.array(z.string()).optional(),
    crypto_consensus_algorithms: z.array(z.string()).optional(),
    crypto_asset: z.string().optional(),
    asset_type: z.string().optional(),
    chains: z.string().optional(),
    community: z.array(z.string()).optional(),
    website: z.array(z.string()).optional(),
    explorer: z.array(z.string()).optional(),
    explorer_cmc: z.string().optional(),
    source_code_cmc: z.string().optional(),
    technical_doc_cmc: z.string().optional(),
    website_cmc: z.string().optional(),
    message_board_cmc: z.string().optional(),
    reddit_cmc: z.string().optional(),
    twitter_cmc: z.string().optional(),
    facebook_cmc: z.string().optional(),
    chat_cmc: z.string().optional(),
    announcement_cmc: z.string().optional(),
    reddit: z.array(z.string()).optional(),
    twitter: z.array(z.string()).optional(),
    facebook: z.array(z.string()).optional(),
    telegram: z.array(z.string()).optional(),
    chat: z.array(z.string()).optional(),
    announcement: z.array(z.string()).optional(),
    forum: z.array(z.string()).optional(),
    doc: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
    github_commits: z.number().optional(),
    github_commits_itb: z.number().optional(),
    news_langs: z.array(z.string()).optional(),
    daily_summary_ast: z.string().optional(),
    update_mode: z.string().optional(),
    type: z.string().optional(),
    short_name: z.string().optional(),
    pro_name: z.string().optional(),
    original_name: z.string().optional(),
    symbol_fullname: z.string().optional(),
    symbol_proname: z.string().optional(),
    base_name: z.array(z.string()).optional(),
    base_currency: z.string().optional(),
    base_currency_id: z.string().optional(),
    currency_id: z.string().optional(),
    exchange_listed_name: z.string().optional(),
    exchange_traded_name: z.string().optional(),
    listed_exchange: z.string().optional(),
    exchange_listed: z.string().optional(),
    exchange_traded: z.string().optional(),
    provider_id: z.string().optional(),
    source_id: z.string().optional(),
    feed: z.string().optional(),
    feed_ticker: z.string().optional(),
    series_key: z.string().optional(),
    session_id: z.string().optional(),
    subsession_id: z.string().optional(),
    session_regular: z.string().optional(),
    session_extended: z.string().optional(),
    session_display: z.string().optional(),
    session_regular_display: z.string().optional(),
    session_extended_display: z.string().optional(),
    current_session: z.string().optional(),
    trading_by: z.string().optional(),
    measure: z.string().optional(),
    adjustment: z.string().optional(),
    allowed_adjustment: z.string().optional(),
    variable_tick_size: z.string().optional(),
    max_precision: z.number().optional(),
    min_contract: z.number().optional(),
    minmov: z.number().optional(),
    minmovement2: z.number().optional(),
    minmove2: z.number().optional(),
    pricescale: z.number().optional(),
    pointvalue: z.number().optional(),
    rt_update_period: z.number().optional(),
    rt_loaded: z.boolean().optional(),
    rt_lag: z.string().optional(),
    rt_update_time: z.string().optional(),
    minute_loaded: z.boolean().optional(),
    trade_loaded: z.boolean().optional(),
    fundamental_data: z.boolean().optional(),
    is_tradable: z.boolean().optional(),
    is_replayable: z.boolean().optional(),
    is_tickbars_available: z.boolean().optional(),
    has_no_bbo: z.boolean().optional(),
    has_no_realtime: z.boolean().optional(),
    has_no_volume: z.boolean().optional(),
    has_intraday: z.boolean().optional(),
    has_dwm: z.boolean().optional(),
    has_adjustment: z.boolean().optional(),
    has_price_snapshot: z.boolean().optional(),
    has_depth: z.boolean().optional(),
    feed_has_intraday: z.boolean().optional(),
    feed_has_dwm: z.boolean().optional(),
    fractional: z.boolean().optional(),
    timezone: z.string().optional(),
    first_bar_time_1s: z.number().optional(),
    first_bar_time_1m: z.number().optional(),
    first_bar_time_1d: z.number().optional(),
    open_time: z.number().optional(),
    regular_close_time: z.number().optional(),
    daily_bar: z.any().optional(),
    prev_daily_bar: z.any().optional(),
    minute_bar: z.any().optional(),
    trade: z.any().optional(),
    market_status: z.any().optional(),
    perms: z.any().optional(),
    source2: z.any().optional(),
    internal_study_inputs: z.any().optional(),
    internal_study_id: z.string().optional(),
    group: z.string().optional(),
    history_tag: z.string().optional(),
    pro_perm: z.string().optional(),
    source_logoid: z.string().optional(),
    base_currency_logoid: z.string().optional(),
    currency_logoid: z.string().optional(),
    dex_currency_logoid: z.string().optional(),
    source_id_alt: z.string().optional(),
    base_currency_id_alt: z.string().optional(),
    currency_id_alt: z.string().optional(),
    exchange_listed_symbol: z.string().optional(),
    exchange_traded_symbol: z.string().optional(),
    subsessions: z.array(z.any()).optional(),
    contracts: z.array(z.any()).optional(),
    broker_names: z.record(z.any()).optional(),
    typespecs: z.array(z.string()).optional(),
    visible_plots_set: z.string().optional(),
    variable_tick_size_alt: z.string().optional(),
    days_to_maturity: z.number().optional(),
    avg_balance: z.number().optional(),
    avg_balance_itb: z.number().optional(),
    profit_addresses: z.number().optional(),
    profit_addresses_itb: z.number().optional(),
    profit_addresses_percentage: z.number().optional(),
    profit_addresses_percentage_itb: z.number().optional(),
    break_even_addresses: z.number().optional(),
    break_even_addresses_itb: z.number().optional(),
    break_even_addresses_percentage: z.number().optional(),
    break_even_addresses_percentage_itb: z.number().optional(),
    in_the_money_addresses_percentage: z.number().optional(),
    in_the_money_addresses_percentage_itb: z.number().optional(),
    at_the_money_addresses_percentage: z.number().optional(),
    at_the_money_addresses_percentage_itb: z.number().optional(),
    out_the_money_addresses_percentage: z.number().optional(),
    out_the_money_addresses_percentage_itb: z.number().optional(),
    in_out_money_in: z.number().optional(),
    in_out_money_in_itb: z.number().optional(),
    in_out_money_out: z.number().optional(),
    in_out_money_out_itb: z.number().optional(),
    in_out_money_between: z.number().optional(),
    in_out_money_between_itb: z.number().optional(),
    losses_addresses: z.number().optional(),
    losses_addresses_itb: z.number().optional(),
    losses_addresses_percentage: z.number().optional(),
    losses_addresses_percentage_itb: z.number().optional(),
    addresses_zero_balance: z.number().optional(),
    addresses_zero_balance_itb: z.number().optional(),
    addresses_total: z.number().optional(),
    addresses_total_itb: z.number().optional(),
    active_addresses_ratio: z.number().optional(),
    active_addresses_ratio_itb: z.number().optional(),
    addresses_active_itb: z.number().optional(),
    addresses_new_itb: z.number().optional(),
    total_addresses_with_balance_itb: z.number().optional(),
    txs_volume_itb: z.number().optional(),
    txs_count_itb: z.number().optional(),
    txs_volume_usd_itb: z.number().optional(),
    large_tx_volume_itb: z.number().optional(),
    large_tx_count_itb: z.number().optional(),
    average_transaction_itb: z.number().optional(),
    average_transaction_usd_itb: z.number().optional(),
    circulating_supply_itb: z.number().optional(),
    total_supply_itb: z.number().optional(),
    max_supply_itb: z.number().optional(),
    market_cap_itb: z.number().optional(),
    market_cap_calc_itb: z.number().optional(),
    market_cap_diluted_calc_itb: z.number().optional(),
    market_cap_ff_itb: z.number().optional(),
    market_cap_real_itb: z.number().optional(),
    market_cap_sply_itb: z.number().optional(),
    total_value_traded_itb: z.number().optional(),
    large_tx_volume_usd_itb: z.number().optional(),
    fees_total_itb: z.number().optional(),
    fees_mean_itb: z.number().optional(),
    fees_median_itb: z.number().optional(),
    fees_usd_itb: z.number().optional(),
    hash_rate_itb: z.number().optional(),
    hashrate_itb: z.number().optional(),
    block_height_itb: z.number().optional(),
    difficulty_itb: z.number().optional(),
    transaction_rate_itb: z.number().optional(),
    block_size_mean_itb: z.number().optional(),
    block_size_total_itb: z.number().optional(),
    block_interval_mean_itb: z.number().optional(),
    block_interval_median_itb: z.number().optional(),
    blocks_mined_itb: z.number().optional(),
    transaction_size_mean_itb: z.number().optional(),
    transaction_size_total_itb: z.number().optional(),
    utxo_created_itb: z.number().optional(),
    utxo_spent_itb: z.number().optional(),
    utxo_value_created_mean_itb: z.number().optional(),
    utxo_value_created_total_itb: z.number().optional(),
    utxo_value_created_median_itb: z.number().optional(),
    utxo_value_spent_mean_itb: z.number().optional(),
    utxo_value_spent_total_itb: z.number().optional(),
    utxo_value_spent_median_itb: z.number().optional(),
    social_volume_24h_itb: z.number().optional(),
    tweets_itb: z.number().optional(),
    interactions_itb: z.number().optional(),
    galaxyscore_itb: z.number().optional(),
    sentiment_itb: z.number().optional(),
    postscreated_itb: z.number().optional(),
    postsactive_itb: z.number().optional(),
    contributorsactive_itb: z.number().optional(),
    contributorscreated_itb: z.number().optional(),
    volatility_30_itb: z.number().optional(),
    btc_correlation_30_itb: z.number().optional(),
    btc_correlation_60: z.number().optional(),
    btc_correlation_60_itb: z.number().optional(),
    price_drawdown_itb: z.number().optional(),
    sopr_itb: z.number().optional(),
    market_value_to_realized_value: z.number().optional(),
    network_value_to_transaction: z.number().optional(),
    circulating_supply_glassnode: z.number().optional(),
    bid: z.number().optional(),
    ask: z.number().optional(),
    bid_size: z.number().optional(),
    ask_size: z.number().optional(),
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

// ===== Basic Analysis Types =====

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
    metadata: z.object({
        strength_raw: z.number(),
        regime: z.enum(['trend', 'range']),
        alignment_count: z.number(),
        quality_score: z.number(),
        volatility_estimate: z.number(),
        signal_consistency: z.number(),
        data_freshness: z.number(),
    }).optional(),
});

// ===== Asset Metadata Types =====

export const AssetMetadataSchema = z.object({
    price: z.number(),
    volume: z.number(),
    change: z.number(),
    changePercent: z.number(),
    marketCap: z.number(),
    sentiment: z.number(),
});

export const RecommendationSchema = z.enum(['buy', 'hold', 'sell']);

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
