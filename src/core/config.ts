import type { SystemConfig, RiskLimits } from '../types/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API Configuration
export const API_CONFIG = {
  // Binance API
  binance: {
    apiKey: process.env.BINANCE_API_KEY || '',
    secretKey: process.env.BINANCE_SECRET_KEY || '',
    baseUrl: 'https://api.binance.com',
    wsUrl: 'wss://stream.binance.com:9443/ws',
    timeout: 10000,
    rateLimit: 1200 // requests per minute
  },

  // Aspis API
  aspis: {
    apiKey: process.env.ASPIS_API_KEY || '',
    vaultAddress: process.env.ASPIS_VAULT_ADDRESS || '',
    baseUrl: 'https://trading-api.aspis.finance',
    wsUrl: 'wss://trading-api.aspis.finance/ws',
    timeout: 30000,
    retryAttempts: 3,
    rateLimit: 100 // requests per minute
  },

  // OpenAI API
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 30000
  },

  // Technical Indicators API
  technicalIndicators: {
    baseUrl: 'http://63.176.129.185:8000',
    timeout: 10000,
    retryAttempts: 3,
    rateLimit: 60 // requests per minute
  },

  // CoinMarketCap API
  cmc: {
    apiKey: process.env.CMC_API_KEY,
    baseUrl: 'https://pro-api.coinmarketcap.com/v1',
    timeout: 10000,
    rateLimit: 30 // requests per day on free tier
  },

  // News API
  news: {
    baseUrl: 'http://3.79.47.238:4500',
    timeout: 30000,
    sources: ['coindesk', 'cointelegraph', 'bitcoin.com', 'decrypt.co'],
    apiKeys: {
      newsapi: process.env.NEWS_API_KEY || '',
      alpha_vantage: process.env.ALPHA_VANTAGE_KEY || '',
      polygon: process.env.POLYGON_API_KEY || ''
    }
  },

  // Telegram Bot API
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    enableNotifications: process.env.TELEGRAM_NOTIFICATIONS === 'true',
    notificationLevel: process.env.TELEGRAM_NOTIFICATION_LEVEL || 'all' // all, important, errors
  }
};

// Default system configuration
export const DEFAULT_CONFIG: SystemConfig = {
  // Risk profile options:
  // - 'averse': Conservative strategy, max 15% per position, 5% max daily loss
  // - 'neutral': Balanced strategy, max 20% per position, 10% max daily loss  
  // - 'bold': Aggressive strategy, max 25% per position, 15% max daily loss
  riskProfile: 'neutral',

  // Trading intervals (in seconds)
  // - 1800: 30 minutes (for testing)
  // - 3600: 1 hour (recommended for development)
  // - 7200: 2 hours (for production)
  debateInterval: 3600, // 1 hour

  // Rebalancing interval (in seconds)
  // - 1800: 30 minutes (frequent rebalancing)
  // - 3600: 1 hour (balanced)
  // - 7200: 2 hours (less frequent)
  rebalanceInterval: 3600, // 1 hour

  // Maximum number of concurrent positions
  // - 5: Conservative (fewer positions, more focused)
  // - 8: Balanced (recommended)
  // - 12: Aggressive (more positions, more diversified)
  maxPositions: 8,

  // Decision thresholds for trading signals
  // These thresholds determine when to generate BUY/SELL/HOLD decisions
  decisionThresholds: {
    // Conservative thresholds (higher confidence required)
    averse: {
      buy: 0.15,    // BUY signal requires 15% positive score
      sell: -0.15,  // SELL signal requires 15% negative score
      minConfidence: 0.7,  // Minimum 70% confidence required
      maxRisk: 0.3   // Maximum 30% risk score allowed
    },
    // Balanced thresholds (recommended)
    neutral: {
      buy: 0.1,     // BUY signal requires 10% positive score
      sell: -0.1,   // SELL signal requires 10% negative score
      minConfidence: 0.6,  // Minimum 60% confidence required
      maxRisk: 0.5   // Maximum 50% risk score allowed
    },
    // Aggressive thresholds (lower confidence required)
    bold: {
      buy: 0.05,    // BUY signal requires 5% positive score
      sell: -0.05,  // SELL signal requires 5% negative score
      minConfidence: 0.5,  // Minimum 50% confidence required
      maxRisk: 0.7   // Maximum 70% risk score allowed
    }
  },

  // Technical indicator thresholds (industry standard)
  technicalThresholds: {
    rsi: { overbought: 70, oversold: 30 },
    stochastic: { overbought: 80, oversold: 20 },
    williamsR: { overbought: -20, oversold: -80 },
    adx: { strongTrend: 25 },
    bollingerBands: {
      overbought: 1,
      oversold: 0,
      nearUpper: 0.2,
      nearLower: 0.2
    }
  },

  // Market regime weights (adaptive based on ADX)
  marketRegimeWeights: {
    trend: {
      rsi: 0.1,        // Lower weight in trending markets
      macd: 0.25,      // Higher weight for trend following
      stochastic: 0.1, // Lower weight in trending markets
      williamsR: 0.1,  // Lower weight in trending markets
      adx: 0.15,       // Trend strength indicator
      bollingerBands: 0.15,
      movingAverages: 0.15
    },
    range: {
      rsi: 0.2,        // Higher weight in ranging markets
      macd: 0.15,      // Lower weight for mean reversion
      stochastic: 0.2, // Higher weight in ranging markets
      williamsR: 0.2,  // Higher weight in ranging markets
      adx: 0.05,       // Lower weight in ranging markets
      bollingerBands: 0.15,
      movingAverages: 0.05
    }
  },

  killSwitchEnabled: true
};

// Risk limits by profile
export const RISK_LIMITS: Record<string, RiskLimits> = {
  averse: {
    maxPositionPercent: 0.15,
    maxLeverage: 1.0, // No leverage
    maxTurnover: 0.5,
    maxDailyLoss: 0.02,
    maxDrawdown: 0.05,
    maxConcentration: 0.20,
    minCashBuffer: 0.05 // Keep 5% cash buffer
  },
  neutral: {
    maxPositionPercent: 0.20,
    maxLeverage: 1.0, // No leverage
    maxTurnover: 1.0,
    maxDailyLoss: 0.05,
    maxDrawdown: 0.10,
    maxConcentration: 0.25,
    minCashBuffer: 0.02 // Keep 2% cash buffer
  },
  bold: {
    maxPositionPercent: 0.25,
    maxLeverage: 1.0, // No leverage
    maxTurnover: 2.0,
    maxDailyLoss: 0.10,
    maxDrawdown: 0.15,
    maxConcentration: 0.30,
    minCashBuffer: 0.00 // No cash buffer requirement
  }
};

// Trading universe configuration
export const UNIVERSE_CONFIG = {
  minVolume24h: 1000000, // $1M minimum 24h volume
  maxSpread: 0.5, // 0.5% maximum spread
  minLiquidity: 0.1, // Minimum liquidity score
  whitelist: [
    'BTC', 'ETH', 'ADA', 'DOT', 'LINK',
    'BNB', 'SOL', 'MATIC', 'AVAX', 'UNI'
  ],
  blacklist: [
    'LUNA', 'UST' // Example blacklisted tokens
  ]
};

// Market data configuration
export const MARKET_DATA_CONFIG = {
  timeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
  defaultTimeframe: '1h',
  cacheTimeout: 60000, // 1 minute cache
  maxRetries: 3,
  retryDelay: 1000 // 1 second
};

// News configuration
export const NEWS_CONFIG = {
  sources: [
    'coindesk.com',
    'cointelegraph.com',
    'bitcoin.com',
    'decrypt.co',
    'theblock.co',
    'reuters.com',
    'bloomberg.com',
    'cnbc.com',
    'wsj.com'
  ],
  searchQueries: [
    'crypto bitcoin ethereum',
    'blockchain technology',
    'digital assets',
    'cryptocurrency market'
  ],
  maxAgeHours: 24,
  minRelevance: 0.3
};

// Agent configuration
export const AGENT_CONFIG = {
  roles: ['fundamental', 'sentiment', 'technical'] as const,
  maxClaimsPerRole: 10,
  minConfidence: 0.3,
  maxConfidence: 0.95,
  systemPrompts: {
    fundamental: `You are a fundamental analyst specializing in on-chain metrics, social sentiment, and market cap analysis.`,
    sentiment: `You are a sentiment analyst specializing in news analysis, social media sentiment, and market mood indicators.`,
    technical: `You are a technical analyst specializing in technical indicators, volatility analysis, and price action patterns.`
  }
};

// Consensus configuration
export const CONSENSUS_CONFIG = {
  minCoverage: 0.33, // At least 1 out of 3 agents must cover a ticker
  liquidityWeight: 0.3,
  confidenceWeight: 0.7,
  riskPenalty: 0.1, // 10% penalty per risk flag
  conflictThreshold: 0.2 // Confidence difference threshold for conflicts
};

// Execution configuration
export const EXECUTION_CONFIG = {
  orderTypes: ['market', 'limit'] as const,
  defaultOrderType: 'market',
  maxSlippage: 0.01, // 1% maximum slippage
  rebalanceThreshold: 0.05, // 5% weight change threshold
  pacingDelay: 1000, // 1 second between orders
  maxOrderRetries: 3
};

// Database configuration
export const DATABASE_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL !== 'false' // Default to true for AWS RDS
};

// Logging configuration
export const LOGGING_CONFIG = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  destination: process.env.LOG_FILE || 'stdout',
  maxFiles: 10,
  maxSize: '10m'
};

// Monitoring configuration
export const MONITORING_CONFIG = {
  metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
  healthCheckInterval: 30000, // 30 seconds
  alertThresholds: {
    maxLatency: 5000, // 5 seconds
    maxErrorRate: 0.05, // 5%
    maxMemoryUsage: 0.8, // 80%
    maxCpuUsage: 0.8 // 80%
  }
};

// System Configuration from Environment
export const SYSTEM_CONFIG = {
  // Risk profile is now set in DEFAULT_CONFIG with detailed comments
  riskProfile: DEFAULT_CONFIG.riskProfile,

  // Trading intervals are now set in DEFAULT_CONFIG with detailed comments
  debateInterval: DEFAULT_CONFIG.debateInterval,
  rebalanceInterval: DEFAULT_CONFIG.rebalanceInterval,

  // Max positions is now set in DEFAULT_CONFIG with detailed comments
  maxPositions: DEFAULT_CONFIG.maxPositions,

  // Decision thresholds are now set in DEFAULT_CONFIG
  decisionThresholds: DEFAULT_CONFIG.decisionThresholds,

  // Technical thresholds are now set in DEFAULT_CONFIG
  technicalThresholds: DEFAULT_CONFIG.technicalThresholds,

  // Market regime weights are now set in DEFAULT_CONFIG
  marketRegimeWeights: DEFAULT_CONFIG.marketRegimeWeights,

  killSwitchEnabled: process.env.KILL_SWITCH_ENABLED !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development',
  roles: ['fundamental', 'sentiment', 'technical'] as const,
  agentDescriptions: {
    fundamental: `You are a fundamental analyst specializing in on-chain metrics, social sentiment, and market cap analysis.`,
    sentiment: `You are a sentiment analyst specializing in news analysis, social media sentiment, and market mood indicators.`,
    technical: `You are a technical analyst specializing in technical indicators, volatility analysis, and price action patterns.`
  }
} as const;

// Debug logging for environment variables
console.log('🔧 Environment variables debug:', {
  NODE_ENV: process.env.NODE_ENV
});

console.log('🔧 SYSTEM_CONFIG loaded:', {
  debateInterval: SYSTEM_CONFIG.debateInterval,
  rebalanceInterval: SYSTEM_CONFIG.rebalanceInterval,
  riskProfile: SYSTEM_CONFIG.riskProfile,
  environment: SYSTEM_CONFIG.environment
});

// Load configuration from environment
export function loadConfig(): SystemConfig {
  return {
    riskProfile: SYSTEM_CONFIG.riskProfile,
    debateInterval: SYSTEM_CONFIG.debateInterval,
    rebalanceInterval: SYSTEM_CONFIG.rebalanceInterval,
    maxPositions: SYSTEM_CONFIG.maxPositions,
    decisionThresholds: SYSTEM_CONFIG.decisionThresholds,
    technicalThresholds: SYSTEM_CONFIG.technicalThresholds,
    marketRegimeWeights: SYSTEM_CONFIG.marketRegimeWeights,
    killSwitchEnabled: SYSTEM_CONFIG.killSwitchEnabled
  };
}

// Validate configuration
export function validateConfig(config: SystemConfig): string[] {
  const errors: string[] = [];

  if (!['averse', 'neutral', 'bold'].includes(config.riskProfile)) {
    errors.push('Invalid risk profile');
  }

  if (config.debateInterval < 60) {
    errors.push('Debate interval must be at least 60 seconds');
  }

  if (config.maxPositions < 1 || config.maxPositions > 20) {
    errors.push('Max positions must be between 1 and 20');
  }

  return errors;
}

// Validate API configuration
export function validateAPIConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required API keys
  if (!API_CONFIG.binance.apiKey || !API_CONFIG.binance.secretKey) {
    errors.push('Binance API credentials are required');
  }

  if (!API_CONFIG.aspis.apiKey) {
    errors.push('Aspis API key is required');
  }

  if (!API_CONFIG.openai.apiKey) {
    warnings.push('OpenAI API key is missing - agents will use mock data');
  }

  // Check API URLs
  try {
    new URL(API_CONFIG.binance.baseUrl);
  } catch {
    errors.push('Invalid Binance base URL');
  }

  try {
    new URL(API_CONFIG.aspis.baseUrl);
  } catch {
    errors.push('Invalid Aspis base URL');
  }

  try {
    new URL(API_CONFIG.technicalIndicators.baseUrl);
  } catch {
    errors.push('Invalid Technical Indicators API URL');
  }

  // Check timeouts
  if (API_CONFIG.binance.timeout < 1000) {
    warnings.push('Binance timeout is very low (< 1s)');
  }

  if (API_CONFIG.aspis.timeout < 5000) {
    warnings.push('Aspis timeout is very low (< 5s)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Get configuration summary
export function getConfigSummary() {
  return {
    system: {
      environment: SYSTEM_CONFIG.environment,
      riskProfile: SYSTEM_CONFIG.riskProfile,
      logLevel: SYSTEM_CONFIG.logLevel
    },
    apis: {
      binance: {
        configured: !!(API_CONFIG.binance.apiKey && API_CONFIG.binance.secretKey),
        baseUrl: API_CONFIG.binance.baseUrl
      },
      aspis: {
        configured: !!API_CONFIG.aspis.apiKey,
        baseUrl: API_CONFIG.aspis.baseUrl
      },
      openai: {
        configured: !!API_CONFIG.openai.apiKey,
        model: API_CONFIG.openai.model
      },
      technicalIndicators: {
        baseUrl: API_CONFIG.technicalIndicators.baseUrl
      },
      news: {
        configured: !!API_CONFIG.news.apiKeys.newsapi,
        baseUrl: API_CONFIG.news.baseUrl
      }
    },
    trading: {
      maxPositions: SYSTEM_CONFIG.maxPositions,
      debateInterval: SYSTEM_CONFIG.debateInterval,
      killSwitchEnabled: SYSTEM_CONFIG.killSwitchEnabled
    }
  };
}
