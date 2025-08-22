import type { SystemConfig, RiskLimits } from './types/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API Configuration
export const API_CONFIG = {
  // Binance API
  binance: {
    apiKey: process.env.BINANCE_API_KEY || '',
    secretKey: process.env.BINANCE_SECRET_KEY || '',
    baseUrl: process.env.BINANCE_BASE_URL || 'https://api.binance.com',
    wsUrl: process.env.BINANCE_WS_URL || 'wss://stream.binance.com:9443/ws',
    timeout: parseInt(process.env.BINANCE_TIMEOUT || '10000'),
    rateLimit: parseInt(process.env.BINANCE_RATE_LIMIT || '1200') // requests per minute
  },

  // Aspis API
  aspis: {
    apiKey: process.env.ASPIS_API_KEY || '',
    vaultAddress: process.env.ASPIS_VAULT_ADDRESS || '',
    baseUrl: process.env.ASPIS_BASE_URL || 'https://trading-api.aspis.finance',
    wsUrl: process.env.ASPIS_WS_URL || 'wss://trading-api.aspis.finance/ws',
    timeout: parseInt(process.env.ASPIS_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.ASPIS_RETRY_ATTEMPTS || '3'),
    rateLimit: parseInt(process.env.ASPIS_RATE_LIMIT || '100') // requests per minute
  },

  // OpenAI API
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000')
  },

  // Technical Indicators API
  technicalIndicators: {
    baseUrl: process.env.TECHNICAL_INDICATORS_URL || 'http://63.176.129.185:8000',
    timeout: parseInt(process.env.TECHNICAL_INDICATORS_TIMEOUT || '10000'),
    retryAttempts: parseInt(process.env.TECHNICAL_INDICATORS_RETRY || '3'),
    rateLimit: parseInt(process.env.TECHNICAL_INDICATORS_RATE_LIMIT || '60') // requests per minute
  },

  // News API
  news: {
    baseUrl: process.env.NEWS_API_URL || 'http://3.79.47.238:4500',
    timeout: parseInt(process.env.NEWS_API_TIMEOUT || '30000'),
    sources: process.env.NEWS_SOURCES?.split(',') || ['coindesk', 'cointelegraph'],
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
  riskProfile: 'neutral',
  debateInterval: 3600, // 1 hour
  rebalanceInterval: 3600, // 1 hour
  maxPositions: 8,
  killSwitchEnabled: true,
  mockMode: false
};

// Risk limits by profile
export const RISK_LIMITS: Record<string, RiskLimits> = {
  averse: {
    maxPositionPercent: 0.15,
    maxLeverage: 1.0,
    maxTurnover: 0.5,
    maxDailyLoss: 0.02,
    maxDrawdown: 0.05,
    maxConcentration: 0.20
  },
  neutral: {
    maxPositionPercent: 0.20,
    maxLeverage: 1.5,
    maxTurnover: 1.0,
    maxDailyLoss: 0.05,
    maxDrawdown: 0.10,
    maxConcentration: 0.25
  },
  bold: {
    maxPositionPercent: 0.25,
    maxLeverage: 2.0,
    maxTurnover: 2.0,
    maxDailyLoss: 0.10,
    maxDrawdown: 0.15,
    maxConcentration: 0.30
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
  roles: ['fundamental', 'sentiment', 'valuation'] as const,
  maxClaimsPerRole: 10,
  minConfidence: 0.3,
  maxConfidence: 0.95,
  systemPrompts: {
    fundamental: `You are a fundamental analyst specializing in on-chain metrics, network activity, and institutional adoption. Focus on data-driven insights only.`,
    sentiment: `You are a sentiment analyst specializing in news sentiment, social media analysis, and market sentiment indicators.`,
    valuation: `You are a valuation analyst specializing in price-to-metrics ratios, technical analysis, and risk-adjusted returns.`
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
  riskProfile: (process.env.RISK_PROFILE as any) || DEFAULT_CONFIG.riskProfile,
  debateInterval: parseInt(process.env.DEBATE_INTERVAL || DEFAULT_CONFIG.debateInterval.toString()),
  rebalanceInterval: parseInt(process.env.REBALANCE_INTERVAL || DEFAULT_CONFIG.rebalanceInterval.toString()),
  maxPositions: parseInt(process.env.MAX_POSITIONS || DEFAULT_CONFIG.maxPositions.toString()),
  killSwitchEnabled: process.env.KILL_SWITCH_ENABLED !== 'false',
  mockMode: process.env.MOCK_MODE === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development'
};

// Load configuration from environment
export function loadConfig(): SystemConfig {
  return {
    riskProfile: SYSTEM_CONFIG.riskProfile,
    debateInterval: SYSTEM_CONFIG.debateInterval,
    rebalanceInterval: SYSTEM_CONFIG.rebalanceInterval,
    maxPositions: SYSTEM_CONFIG.maxPositions,
    killSwitchEnabled: SYSTEM_CONFIG.killSwitchEnabled,
    mockMode: SYSTEM_CONFIG.mockMode
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

  // Check required API keys for production mode
  if (!SYSTEM_CONFIG.mockMode) {
    if (!API_CONFIG.binance.apiKey || !API_CONFIG.binance.secretKey) {
      errors.push('Binance API credentials are required for production mode');
    }

    if (!API_CONFIG.aspis.apiKey) {
      errors.push('Aspis API key is required for production mode');
    }

    if (!API_CONFIG.openai.apiKey) {
      warnings.push('OpenAI API key is missing - agents will use mock data');
    }
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
      mockMode: SYSTEM_CONFIG.mockMode,
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
