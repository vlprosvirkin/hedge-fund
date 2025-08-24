import { z } from 'zod';

// ===== Aspis API Request Types =====

export const ExecuteOrderInputSchema = z.object({
  chainId: z.string(),
  vault: z.string(),
  srcToken: z.string(),
  dstToken: z.string(),
  amountIn: z.string(),
  exchange: z.string(),
  slippage: z.string(),
  srcTokenSymbol: z.string().optional(),
  dstTokenSymbol: z.string().optional(),
});

// ===== Aspis API Response Types =====

export const ExecuteOrderResponseSchema = z.object({
  exchange: z.string(),
  srcToken: z.string(),
  dstToken: z.string(),
  inputAmount: z.number(),
  outputAmount: z.string(),
  outputAmountScaled: z.string(),
  status: z.string(),
  tx_hash: z.string(),
});

export const GetBalanceResponseSchema = z.record(z.object({
  scaled: z.string(),
  non_scaled: z.string(),
}));

export const GetVaultByApiKeyResponseSchema = z.object({
  apiKey: z.string(),
  tgId: z.string(),
  vaultAddress: z.string(),
});

// ===== Trading Fee Types =====

export const TradingFeesSchema = z.object({
  makerFee: z.number(),
  takerFee: z.number(),
  symbol: z.string().optional(),
});

// ===== Trade History Types =====

export const TradeHistoryItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  quantity: z.number(),
  price: z.number(),
  fee: z.number(),
  feeAsset: z.string(),
  timestamp: z.number(),
});

// ===== Symbol Info Types =====

export const SymbolInfoSchema = z.object({
  symbol: z.string(),
  status: z.string(),
  minQty: z.number(),
  maxQty: z.number(),
  stepSize: z.number(),
  tickSize: z.number(),
  minPrice: z.number(),
  maxPrice: z.number(),
});

// ===== Conditional Order Types =====

export const ConditionalOrderParamsSchema = z.object({
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  quantity: z.number(),
  type: z.enum(['stop_loss', 'take_profit', 'trailing_stop']),
  triggerPrice: z.number(),
  price: z.number().optional(),
  trailingAmount: z.number().optional(),
});

// ===== Portfolio Metrics Types =====

export const PortfolioMetricsSchema = z.object({
  totalValue: z.number(),
  availableBalance: z.number(),
  usedMargin: z.number(),
  freeMargin: z.number(),
  marginLevel: z.number(),
  unrealizedPnL: z.number(),
  realizedPnL: z.number(),
});

// ===== Order Validation Types =====

export const OrderValidationParamsSchema = z.object({
  symbol: z.string(),
  quantity: z.number(),
  price: z.number().optional(),
});

export const OrderValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
});

// ===== Account Info Types =====

export const BalanceItemSchema = z.object({
  asset: z.string(),
  free: z.number(),
  locked: z.number(),
});

export const AccountInfoSchema = z.object({
  balances: z.array(BalanceItemSchema),
  totalValue: z.number(),
  marginLevel: z.number().optional(),
});

// ===== Type Exports =====

export type ExecuteOrderInput = z.infer<typeof ExecuteOrderInputSchema>;
export type ExecuteOrderResponse = z.infer<typeof ExecuteOrderResponseSchema>;
export type GetBalanceResponse = z.infer<typeof GetBalanceResponseSchema>;
export type GetVaultByApiKeyResponse = z.infer<typeof GetVaultByApiKeyResponseSchema>;
export type TradingFees = z.infer<typeof TradingFeesSchema>;
export type TradeHistoryItem = z.infer<typeof TradeHistoryItemSchema>;
export type SymbolInfo = z.infer<typeof SymbolInfoSchema>;
export type ConditionalOrderParams = z.infer<typeof ConditionalOrderParamsSchema>;
export type PortfolioMetrics = z.infer<typeof PortfolioMetricsSchema>;
export type OrderValidationParams = z.infer<typeof OrderValidationParamsSchema>;
export type OrderValidationResult = z.infer<typeof OrderValidationResultSchema>;
export type BalanceItem = z.infer<typeof BalanceItemSchema>;
export type AccountInfo = z.infer<typeof AccountInfoSchema>;
