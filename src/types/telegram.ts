import { z } from 'zod';

// ===== Telegram Bot API Types =====

export const TelegramMessageSchema = z.object({
  text: z.string(),
  parseMode: z.enum(['Markdown', 'HTML']).optional(),
  disableWebPagePreview: z.boolean().optional(),
  disableNotification: z.boolean().optional(),
  replyToMessageId: z.number().optional(),
  replyMarkup: z.any().optional(),
});

export const TelegramSendMessageResponseSchema = z.object({
  ok: z.boolean(),
  result: z.object({
    message_id: z.number(),
    from: z.object({
      id: z.number(),
      is_bot: z.boolean(),
      first_name: z.string(),
      username: z.string(),
    }),
    chat: z.object({
      id: z.number(),
      first_name: z.string(),
      username: z.string().optional(),
      type: z.string(),
    }),
    date: z.number(),
    text: z.string(),
  }).optional(),
  error_code: z.number().optional(),
  description: z.string().optional(),
});

export const TelegramBotInfoSchema = z.object({
  id: z.number(),
  is_bot: z.boolean(),
  first_name: z.string(),
  username: z.string(),
  can_join_groups: z.boolean().optional(),
  can_read_all_group_messages: z.boolean().optional(),
  supports_inline_queries: z.boolean().optional(),
});

export const TelegramChatSchema = z.object({
  id: z.number(),
  type: z.enum(['private', 'group', 'supergroup', 'channel']),
  title: z.string().optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

// ===== Trading System Message Types =====

export const TradingAlertSchema = z.object({
  type: z.enum(['info', 'warning', 'error', 'success']),
  title: z.string(),
  message: z.string(),
  timestamp: z.number(),
  data: z.any().optional(),
});

export const ConsensusReportSchema = z.object({
  roundId: z.string(),
  timestamp: z.number(),
  recommendations: z.array(z.object({
    ticker: z.string(),
    confidence: z.number(),
    recommendation: z.enum(['BUY', 'SELL', 'HOLD']),
    reasoning: z.string(),
  })),
  conflicts: z.array(z.object({
    ticker: z.string(),
    conflictType: z.string(),
    description: z.string(),
  })),
});

export const RiskAlertSchema = z.object({
  type: z.enum(['limit_exceeded', 'drawdown_warning', 'volatility_alert', 'liquidity_warning']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  metrics: z.object({
    currentValue: z.number(),
    limit: z.number(),
    percentage: z.number(),
  }),
  timestamp: z.number(),
});

export const OrderExecutionReportSchema = z.object({
  roundId: z.string(),
  timestamp: z.number(),
  orders: z.array(z.object({
    id: z.string(),
    symbol: z.string(),
    side: z.enum(['buy', 'sell']),
    quantity: z.number(),
    price: z.number(),
    status: z.enum(['pending', 'filled', 'cancelled', 'rejected']),
    executionTime: z.number(),
  })),
  positions: z.array(z.object({
    symbol: z.string(),
    quantity: z.number(),
    avgPrice: z.number(),
    unrealizedPnL: z.number(),
  })),
});

export const PerformanceSummarySchema = z.object({
  roundId: z.string(),
  timestamp: z.number(),
  performance: z.object({
    totalValue: z.number(),
    change24h: z.number(),
    changePercent24h: z.number(),
    totalPnL: z.number(),
    realizedPnL: z.number(),
    unrealizedPnL: z.number(),
    winRate: z.number(),
    totalTrades: z.number(),
  }),
  topPerformers: z.array(z.object({
    symbol: z.string(),
    return: z.number(),
    volume: z.number(),
  })),
  riskMetrics: z.object({
    sharpeRatio: z.number(),
    maxDrawdown: z.number(),
    volatility: z.number(),
    var95: z.number(),
  }),
});

// ===== Type Exports =====

export type TelegramMessage = z.infer<typeof TelegramMessageSchema>;
export type TelegramSendMessageResponse = z.infer<typeof TelegramSendMessageResponseSchema>;
export type TelegramBotInfo = z.infer<typeof TelegramBotInfoSchema>;
export type TelegramChat = z.infer<typeof TelegramChatSchema>;
export type TradingAlert = z.infer<typeof TradingAlertSchema>;
export type ConsensusReport = z.infer<typeof ConsensusReportSchema>;
export type RiskAlert = z.infer<typeof RiskAlertSchema>;
export type OrderExecutionReport = z.infer<typeof OrderExecutionReportSchema>;
export type PerformanceSummary = z.infer<typeof PerformanceSummarySchema>;

// ===== Utility Types =====

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  baseUrl?: string;
  timeout?: number;
}

export interface TelegramNotificationOptions {
  parseMode?: 'Markdown' | 'HTML';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  replyToMessageId?: number;
}
