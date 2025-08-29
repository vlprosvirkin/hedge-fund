import { z } from 'zod';

// Re-export technical analysis types
export * from './signals.js';

// Re-export news types
export * from './news.js';

// Re-export aspis types
export * from './aspis.js';

// Re-export binance types
export * from './binance.js';

// Re-export telegram types
export * from './telegram.js';

// Re-export results types
export * from './results.js';

// ===== Market Data Types =====
export const CandleSchema = z.object({
  symbol: z.string(),
  timestamp: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

export const OrderBookSchema = z.object({
  symbol: z.string(),
  timestamp: z.number(),
  bids: z.array(z.tuple([z.number(), z.number()])), // [price, quantity]
  asks: z.array(z.tuple([z.number(), z.number()])), // [price, quantity]
});

export const MarketStatsSchema = z.object({
  symbol: z.string(),
  timestamp: z.number(), // Add missing timestamp
  price: z.number().optional(), // Current price
  volume24h: z.number(),
  volumeChange24h: z.number().optional(),
  priceChange24h: z.number().optional(),
  spread: z.number(),
  tickSize: z.number(),
  stepSize: z.number(),
  minQty: z.number(),
  maxQty: z.number(),
});

export type Candle = z.infer<typeof CandleSchema>;
export type OrderBook = z.infer<typeof OrderBookSchema>;
export type MarketStats = z.infer<typeof MarketStatsSchema>;

// ===== News Types =====
export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  publishedAt: z.number(),
  sentiment: z.number(), // -1 to 1
  description: z.string().optional(),
  assets: z.array(z.string()).optional(),
});

// ===== Evidence Types (Discriminated Union) =====
export const NewsEvidenceSchema = z.object({
  id: z.string(), // Add missing id
  ticker: z.string(), // BTC, ETH, etc.
  kind: z.literal('news'),
  source: z.string(),
  url: z.string().url(),
  snippet: z.string(),
  publishedAt: z.string().datetime(),
  relevance: z.number(), // 0 to 1
  impact: z.number().optional(), // -1 to 1
  confidence: z.number().optional(), // 0 to 1
  // Legacy properties for backward compatibility
  quote: z.string().optional(),
  timestamp: z.number().optional(),
  newsItemId: z.string().optional(),
});

export const MarketEvidenceSchema = z.object({
  id: z.string(), // Add missing id
  ticker: z.string(), // BTC, ETH, etc.
  kind: z.literal('market'),
  source: z.literal('binance'),
  metric: z.enum(['vol24h', 'spread_bps', 'ohlcv_close', 'vwap', 'liquidity_score']),
  value: z.number().finite(),
  observedAt: z.string().datetime(),
  relevance: z.number(), // 0 to 1
  impact: z.number().optional(), // -1 to 1
  confidence: z.number().optional(), // 0 to 1
  // Legacy properties for backward compatibility
  quote: z.string().optional(),
  timestamp: z.number().optional(),
  newsItemId: z.string().optional(),
});

export const TechEvidenceSchema = z.object({
  id: z.string(), // Add missing id
  ticker: z.string(), // BTC, ETH, etc.
  kind: z.literal('tech'),
  source: z.literal('indicators'),
  metric: z.string().min(2), // RSI(14,1h), MACD(12,26,9,1h), etc.
  value: z.number().finite(),
  observedAt: z.string().datetime(),
  relevance: z.number(), // 0 to 1
  impact: z.number().optional(), // -1 to 1
  confidence: z.number().optional(), // 0 to 1
  // Legacy properties for backward compatibility
  quote: z.string().optional(),
  timestamp: z.number().optional(),
  newsItemId: z.string().optional(),
});

export const OnChainEvidenceSchema = z.object({
  id: z.string(),
  ticker: z.string(), // BTC, ETH, etc.
  kind: z.literal('onchain'),
  source: z.literal('indicators'),
  metric: z.string().min(2), // active_addresses, txs_volume_usd, hash_rate, etc.
  value: z.number().finite(),
  observedAt: z.string().datetime(),
  relevance: z.number(), // 0 to 1
  impact: z.number().optional(), // -1 to 1
  confidence: z.number().optional(), // 0 to 1
  // Legacy properties for backward compatibility
  quote: z.string().optional(),
  timestamp: z.number().optional(),
  newsItemId: z.string().optional(),
});

export const SocialEvidenceSchema = z.object({
  id: z.string(),
  ticker: z.string(), // BTC, ETH, etc.
  kind: z.literal('social'),
  source: z.literal('indicators'),
  metric: z.string().min(2), // social_volume_24h, galaxyscore, tweets, etc.
  value: z.number().finite(),
  observedAt: z.string().datetime(),
  relevance: z.number(), // 0 to 1
  impact: z.number().optional(), // -1 to 1
  confidence: z.number().optional(), // 0 to 1
  // Legacy properties for backward compatibility
  quote: z.string().optional(),
  timestamp: z.number().optional(),
  newsItemId: z.string().optional(),
});

export const IndexEvidenceSchema = z.object({
  id: z.string(),
  ticker: z.string(), // BTC, ETH, etc. or 'GLOBAL' for market-wide indices
  kind: z.literal('index'),
  source: z.string(), // 'fear_greed', 'google_trends', etc.
  name: z.string(), // 'fear_greed', 'google_trends_SOL', etc.
  value: z.number().finite(),
  observedAt: z.string().datetime(),
  relevance: z.number(), // 0 to 1
  impact: z.number().optional(), // -1 to 1
  confidence: z.number().optional(), // 0 to 1
  // Legacy properties for backward compatibility
  quote: z.string().optional(),
  timestamp: z.number().optional(),
  newsItemId: z.string().optional(),
});

export const EvidenceSchema = z.discriminatedUnion('kind', [
  NewsEvidenceSchema,
  MarketEvidenceSchema,
  TechEvidenceSchema,
  OnChainEvidenceSchema,
  SocialEvidenceSchema,
  IndexEvidenceSchema
]);

// ===== Claim Types (Updated) =====
export const ClaimSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  agentRole: z.enum(['fundamental', 'sentiment', 'technical']),
  claim: z.string(),
  confidence: z.number(), // 0 to 1
  evidence: z.array(EvidenceSchema), // Use structured evidence directly
  timestamp: z.number(),
  riskFlags: z.array(z.string()).optional(),
  signals: z.array(z.object({
    name: z.string(),
    value: z.number()
  })).optional(),

  // Только действительно полезные поля
  direction: z.enum(['bullish', 'bearish', 'neutral']).optional(), // Явное направление
  magnitude: z.number().optional(), // -1 to 1 (сила сигнала)
  rationale: z.string().optional(), // Подробное обоснование

  // New fields for better structure
  thesis: z.string().optional(), // Short thesis statement
});

export const ConsensusRecSchema = z.object({
  ticker: z.string(),
  avgConfidence: z.number(),
  coverage: z.number(), // 0 to 1 (how many agents covered this ticker)
  liquidity: z.number(),
  finalScore: z.number(),
  claims: z.array(z.string()), // Claim IDs
});

export type Claim = z.infer<typeof ClaimSchema>;
export type ConsensusRec = z.infer<typeof ConsensusRecSchema>;

// ===== Portfolio Types =====
export const PositionSchema = z.object({
  symbol: z.string(),
  quantity: z.number(),
  avgPrice: z.number(),
  unrealizedPnL: z.number(),
  realizedPnL: z.number(),
  timestamp: z.number(),
});

export const TargetWeightSchema = z.object({
  symbol: z.string(),
  weight: z.number(), // 0 to 1
  quantity: z.number(),
  side: z.enum(['buy', 'sell', 'hold']),
});

export type Position = z.infer<typeof PositionSchema>;
export type TargetWeight = z.infer<typeof TargetWeightSchema>;

// ===== Trading Types =====
export const OrderSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit', 'stop']),
  quantity: z.number(),
  price: z.number().optional(),
  status: z.enum(['pending', 'filled', 'cancelled', 'rejected']),
  timestamp: z.number(),
});

export const FillEventSchema = z.object({
  orderId: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  quantity: z.number(),
  price: z.number(),
  timestamp: z.number(),
  fee: z.number(),
});

export type Order = z.infer<typeof OrderSchema>;
export type FillEvent = z.infer<typeof FillEventSchema>;

// ===== Risk Types =====
export const RiskProfileSchema = z.enum(['averse', 'neutral', 'bold']);

export const RiskLimitsSchema = z.object({
  maxPositionPercent: z.number(),
  maxLeverage: z.number(),
  maxTurnover: z.number(),
  maxDailyLoss: z.number(),
  maxDrawdown: z.number(),
  maxConcentration: z.number(),
  minCashBuffer: z.number().optional(), // Minimum cash buffer to maintain
});

export const RiskViolationSchema = z.object({
  type: z.enum(['position', 'leverage', 'turnover', 'loss', 'drawdown', 'concentration']),
  current: z.number(),
  limit: z.number(),
  severity: z.enum(['warning', 'critical']),
});

export type RiskProfile = z.infer<typeof RiskProfileSchema>;
export type RiskLimits = z.infer<typeof RiskLimitsSchema>;
export type RiskViolation = z.infer<typeof RiskViolationSchema>;

// ===== Universe Types =====
export const SymbolMappingSchema = z.object({
  binanceSymbol: z.string(),
  aspisSymbol: z.string(),
  tickSize: z.number(),
  stepSize: z.number(),
  minQty: z.number(),
  maxQty: z.number(),
  isActive: z.boolean(),
});

export const UniverseFilterSchema = z.object({
  minVolume24h: z.number(),
  maxSpread: z.number(),
  minLiquidity: z.number(),
  whitelist: z.array(z.string()).optional(),
  blacklist: z.array(z.string()).optional(),
});

export type SymbolMapping = z.infer<typeof SymbolMappingSchema>;
export type UniverseFilter = z.infer<typeof UniverseFilterSchema>;

// ===== Decision Thresholds Types =====
export const DecisionThresholdsSchema = z.object({
  buy: z.number(),
  sell: z.number(),
  minConfidence: z.number(),
  maxRisk: z.number(),
});

export const RiskProfileDecisionThresholdsSchema = z.object({
  averse: DecisionThresholdsSchema,
  neutral: DecisionThresholdsSchema,
  bold: DecisionThresholdsSchema,
});

// ===== System Types =====
export const SystemConfigSchema = z.object({
  riskProfile: RiskProfileSchema,
  debateInterval: z.number(), // seconds
  rebalanceInterval: z.number(), // seconds
  maxPositions: z.number(),
  decisionThresholds: RiskProfileDecisionThresholdsSchema,
  killSwitchEnabled: z.boolean(),
});

export const PipelineArtifactSchema = z.object({
  roundId: z.string(),
  timestamp: z.number(),
  claims: z.array(ClaimSchema),
  consensus: z.array(ConsensusRecSchema),
  targetWeights: z.array(TargetWeightSchema),
  orders: z.array(OrderSchema),
  riskViolations: z.array(RiskViolationSchema),
});

// ===== Signal Processing Types =====
export const SignalAnalysisSchema = z.object({
  ticker: z.string(),
  overallSignal: z.number(), // -1 to 1 (sell to buy)
  confidence: z.number(), // 0 to 1
  volatility: z.number(), // 0 to 1
  momentum: z.number(), // -1 to 1
  sentiment: z.number(), // -1 to 1
  fundamental: z.number(), // -1 to 1
  technical: z.number(), // -1 to 1
  riskScore: z.number(), // 0 to 1 (higher = more risky)
  recommendation: z.enum(['BUY', 'HOLD', 'SELL']),
  rationale: z.string(),
  timeHorizon: z.enum(['short', 'medium', 'long']),
  positionSize: z.number() // 0 to 1 (recommended position size)
});

export const SignalMetricsSchema = z.object({
  signalStrength: z.number(), // -1 to 1
  confidence: z.number(), // 0 to 1
  volatility: z.number(), // 0 to 1
  momentum: z.number(), // -1 to 1
  riskAdjustedReturn: z.number(), // Sharpe-like ratio
  maxDrawdown: z.number(), // 0 to 1
  correlation: z.number(), // -1 to 1 (with market)
  liquidity: z.number() // 0 to 1
});

export type SignalAnalysis = z.infer<typeof SignalAnalysisSchema>;
export type SignalMetrics = z.infer<typeof SignalMetricsSchema>;

export type SystemConfig = z.infer<typeof SystemConfigSchema>;
export type PipelineArtifact = z.infer<typeof PipelineArtifactSchema>;

export type NewsItem = z.infer<typeof NewsItemSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type NewsEvidence = z.infer<typeof NewsEvidenceSchema>;
export type MarketEvidence = z.infer<typeof MarketEvidenceSchema>;
export type TechEvidence = z.infer<typeof TechEvidenceSchema>;
