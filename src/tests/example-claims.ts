import type { Claim } from '../types/index.js';

// Example Claims following the new structure
export const exampleClaims: Claim[] = [
    // Fundamental claim for SOL
    {
        id: "FUND-1:SOLUSDT",
        ticker: "SOL",
        agentRole: "fundamental",
        claim: "BUY",
        thesis: "vol24h↑, spread_bps↓ → легче набрать позицию без ценового удара",
        confidence: 0.68,
        evidence: [
            {
                id: "market-1",
                ticker: "SOL",
                kind: "market",
                source: "binance",
                metric: "vol24h",
                value: 1230000000,
                observedAt: "2025-08-27T09:58:00Z",
                relevance: 0.9
            },
            {
                id: "market-2",
                ticker: "SOL",
                kind: "market",
                source: "binance",
                metric: "spread_bps",
                value: 3.1,
                observedAt: "2025-08-27T09:58:00Z",
                relevance: 0.8
            }
        ],
        timestamp: Date.now(),
        direction: "bullish",
        magnitude: 0.4,
        riskFlags: []
    },

    // Sentiment claim for SOL
    {
        id: "SENT-1:SOLUSDT",
        ticker: "SOL",
        agentRole: "sentiment",
        claim: "BUY",
        thesis: "апдейты экосистемы, положительные обзоры",
        confidence: 0.62,
        evidence: [
            {
                id: "news-1",
                ticker: "SOL",
                kind: "news",
                source: "coindesk.com",
                url: "https://example.com/sol-update",
                snippet: "Major ecosystem update announced by Solana Foundation",
                publishedAt: "2025-08-27T08:10:00Z",
                relevance: 0.8
            }
        ],
        timestamp: Date.now(),
        direction: "bullish",
        magnitude: 0.3,
        riskFlags: []
    },

    // Valuation/Tech claim for SOL
    {
        id: "VAL-1:SOLUSDT",
        ticker: "SOL",
        agentRole: "valuation",
        claim: "BUY",
        thesis: "есть апсайд без явного перегрева",
        confidence: 0.6,
        evidence: [
            {
                id: "tech-1",
                ticker: "SOL",
                kind: "tech",
                source: "indicators",
                metric: "RSI(14,4h)",
                value: 56.0,
                observedAt: "2025-08-27T09:56:00Z",
                relevance: 0.85
            }
        ],
        timestamp: Date.now(),
        direction: "bullish",
        magnitude: 0.25,
        riskFlags: []
    },

    // Fundamental claim for BTC
    {
        id: "FUND-1:BTCUSDT",
        ticker: "BTC",
        agentRole: "fundamental",
        claim: "HOLD",
        thesis: "высокая ликвидность, но спред расширился",
        confidence: 0.55,
        evidence: [
            {
                id: "market-3",
                ticker: "BTC",
                kind: "market",
                source: "binance",
                metric: "vol24h",
                value: 25000000000,
                observedAt: "2025-08-27T09:58:00Z",
                relevance: 0.95
            },
            {
                id: "market-4",
                ticker: "BTC",
                kind: "market",
                source: "binance",
                metric: "spread_bps",
                value: 5.2,
                observedAt: "2025-08-27T09:58:00Z",
                relevance: 0.7
            }
        ],
        timestamp: Date.now(),
        direction: "neutral",
        magnitude: 0.1,
        riskFlags: ["high_spread"]
    },

    // Sentiment claim for BTC
    {
        id: "SENT-1:BTCUSDT",
        ticker: "BTC",
        agentRole: "sentiment",
        claim: "BUY",
        thesis: "позитивные новости о регуляторных решениях",
        confidence: 0.72,
        evidence: [
            {
                id: "news-2",
                ticker: "BTC",
                kind: "news",
                source: "reuters.com",
                url: "https://example.com/btc-regulation",
                snippet: "Regulatory clarity improves for Bitcoin adoption",
                publishedAt: "2025-08-27T07:30:00Z",
                relevance: 0.9
            }
        ],
        timestamp: Date.now(),
        direction: "bullish",
        magnitude: 0.5,
        riskFlags: []
    },

    // Valuation claim for BTC
    {
        id: "VAL-1:BTCUSDT",
        ticker: "BTC",
        agentRole: "valuation",
        claim: "BUY",
        thesis: "RSI показывает умеренный бычий импульс",
        confidence: 0.65,
        evidence: [
            {
                id: "tech-2",
                ticker: "BTC",
                kind: "tech",
                source: "indicators",
                metric: "RSI(14,1h)",
                value: 58.5,
                observedAt: "2025-08-27T09:56:00Z",
                relevance: 0.8
            },
            {
                id: "tech-3",
                ticker: "BTC",
                kind: "tech",
                source: "indicators",
                metric: "MACD(12,26,9,1h)",
                value: 0.15,
                observedAt: "2025-08-27T09:56:00Z",
                relevance: 0.75
            }
        ],
        timestamp: Date.now(),
        direction: "bullish",
        magnitude: 0.35,
        riskFlags: []
    }
];

// Example of rejected claim (with invalid evidence)
export const invalidClaim: Claim = {
    id: "INVALID-1:ETHUSDT",
    ticker: "ETH",
    agentRole: "fundamental",
    claim: "BUY",
    thesis: "invalid claim without proper evidence",
    confidence: 0.8,
    evidence: [
        {
            id: "market-5",
            ticker: "ETH",
            kind: "market",
            source: "binance", // Valid source but will be rejected by other validation
            metric: "vol24h",
            value: 1000000,
            observedAt: "2025-08-27T09:58:00Z",
            relevance: 0.5
        }
    ],
    timestamp: Date.now(),
    direction: "bullish",
    magnitude: 0.6,
    riskFlags: []
};
