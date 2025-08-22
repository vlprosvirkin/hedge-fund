import { z } from 'zod';

// Re-export technical analysis types
export * from './technical-analysis.js';

// Re-export news types
export * from './news.js';

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
  volume24h: z.number(),
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
  sentiment: z.number().optional(), // -1 to 1
  content: z.string().optional(),
});

export const EvidenceSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  newsItemId: z.string(),
  relevance: z.number(), // 0 to 1
  timestamp: z.number(),
  source: z.string(),
  quote: z.string().optional(),
});

export type NewsItem = z.infer<typeof NewsItemSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;

// ===== Agent Types =====
export const ClaimSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  agentRole: z.enum(['fundamental', 'sentiment', 'valuation']),
  claim: z.string(),
  confidence: z.number(), // 0 to 1
  evidence: z.array(z.string()), // Evidence IDs
  timestamp: z.number(),
  riskFlags: z.array(z.string()).optional(),
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

// ===== System Types =====
export const SystemConfigSchema = z.object({
  riskProfile: RiskProfileSchema,
  debateInterval: z.number(), // seconds
  rebalanceInterval: z.number(), // seconds
  maxPositions: z.number(),
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

export type SystemConfig = z.infer<typeof SystemConfigSchema>;
export type PipelineArtifact = z.infer<typeof PipelineArtifactSchema>;
