import { TelegramAdapter } from '../adapters/telegram-adapter.js';
import { NotificationsService } from '../services/notifications.service.js';
import type { Claim, ConsensusRec, Evidence, NewsItem } from '../types/index.js';

/**
 * Test class for Telegram message formatting without sending
 */
class TelegramFormattingTest {
  private telegram: TelegramAdapter;
  private notifications: NotificationsService;

  constructor() {
    // Create TelegramAdapter without actual bot token for testing
    this.telegram = new TelegramAdapter('test_token');
    this.notifications = new NotificationsService(this.telegram);
  }

  /**
   * Test agent analysis message formatting with real data
   */
  async testAgentAnalysisFormatting(): Promise<void> {
    console.log('🧪 Testing Agent Analysis Message Formatting...\n');

    // Real evidence data based on logs
    const mockEvidence: Evidence[] = [
      {
        id: 'BTC_3480_1756208748365',
        kind: 'news',
        source: 'CoinDesk',
        url: 'https://example.com/btc-news-1',
        snippet: 'Bitcoin reaches new all-time high',
        publishedAt: new Date().toISOString(),
        relevance: 0.85,
        impact: 0.8,
        confidence: 0.85,
        quote: 'Bitcoin reaches new all-time high',
        timestamp: Date.now(),
        newsItemId: 'news-1',
        ticker: 'BTC'
      },
      {
        id: 'BTC_3502_1756208748365',
        kind: 'news',
        source: 'CoinTelegraph',
        url: 'https://example.com/btc-news-2',
        snippet: 'BTC shows strong momentum',
        publishedAt: new Date().toISOString(),
        relevance: 0.72,
        impact: 0.6,
        confidence: 0.72,
        quote: 'BTC shows strong momentum',
        timestamp: Date.now(),
        newsItemId: 'news-2',
        ticker: 'BTC'
      },
      {
        id: 'ETH_3488_1756208748365',
        kind: 'news',
        source: 'Bloomberg',
        url: 'https://example.com/eth-news-1',
        snippet: "Tom Lee's Bitmine Acquires $2.2B in Ethereum",
        publishedAt: new Date().toISOString(),
        relevance: 0.78,
        impact: 0.7,
        confidence: 0.78,
        quote: "Tom Lee's Bitmine Acquires $2.2B in Ethereum",
        timestamp: Date.now(),
        newsItemId: 'news-3',
        ticker: 'ETH'
      },
      {
        id: 'ETH_3437_1756208748365',
        kind: 'news',
        source: 'Reuters',
        url: 'https://example.com/eth-news-2',
        snippet: 'BlackRock Sells $257.8M Worth of Ethereum in ETF',
        publishedAt: new Date().toISOString(),
        relevance: 0.65,
        impact: -0.3,
        confidence: 0.65,
        quote: 'BlackRock Sells $257.8M Worth of Ethereum in ETF',
        timestamp: Date.now(),
        newsItemId: 'news-4',
        ticker: 'ETH'
      }
    ];

    const mockNews: NewsItem[] = [
      {
        id: '3480',
        title: 'Bitcoin reaches new all-time high',
        url: 'https://example.com/btc-news-1',
        source: 'CoinDesk',
        publishedAt: 1756208748365,
        sentiment: 0.8,
        description: 'Bitcoin has reached a new all-time high...'
      },
      {
        id: '3502',
        title: 'BTC shows strong momentum',
        url: 'https://example.com/btc-news-2',
        source: 'Cointelegraph',
        publishedAt: 1756208748365,
        sentiment: 0.7,
        description: 'Bitcoin momentum continues...'
      },
      {
        id: '3488',
        title: "Tom Lee's Bitmine Acquires $2.2B in Ethereum",
        url: 'https://example.com/eth-news-1',
        source: "Ian's Intel",
        publishedAt: 1756208748365,
        sentiment: 0.6,
        description: 'Major acquisition in Ethereum...'
      },
      {
        id: '3437',
        title: 'BlackRock Sells $257.8M Worth of Ethereum in ETF',
        url: 'https://example.com/eth-news-2',
        source: 'Cointelegraph',
        publishedAt: 1756208748365,
        sentiment: 0.4,
        description: 'BlackRock reduces Ethereum position...'
      }
    ];

    // Test different agent types with real data
    const agents = [
      {
        role: 'fundamental',
        name: 'FUNDAMENTAL ANALYST',
        claims: [
          {
            id: 'claim_1',
            ticker: 'BTC',
            agentRole: 'fundamental' as const,
            claim: 'HOLD',
            confidence: 0.6,
            evidence: [mockEvidence[0]!],
            timestamp: Date.now(),
            riskFlags: ['low_signal_strength', 'low_trend_strength']
          },
          {
            id: 'claim_2',
            ticker: 'ETH',
            agentRole: 'fundamental' as const,
            claim: 'HOLD',
            confidence: 0.6,
            evidence: [mockEvidence[2]!],
            timestamp: Date.now(),
            riskFlags: ['low_signal_strength', 'low_trend_strength']
          }
        ],
        openaiResponse: `{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "fundamental",
      "claim": "HOLD",
      "confidence": 0.6,
      "horizon": "weeks",
      "signals": [
        {"name": "liquidity_score", "value": 1.0},
        {"name": "volatility", "value": 0.004},
        {"name": "trend_strength", "value": 0.1}
      ],
      "evidence": ["evidence_id_1"],
      "riskFlags": ["low_signal_strength"],
      "notes": "BTC has a high liquidity score and low volatility, which are positive signs. However, the trend strength and signal strength are low, indicating uncertainty in the market direction. The technical indicators are mixed with RSI being neutral, MACD bearish, and Stochastic and Williams %R indicating bullish. Therefore, it is recommended to hold until a clearer trend emerges."
    },
    {
      "ticker": "ETH",
      "agentRole": "fundamental",
      "claim": "HOLD",
      "confidence": 0.6,
      "horizon": "weeks",
      "signals": [
        {"name": "liquidity_score", "value": 1.0},
        {"name": "volatility", "value": 0.009},
        {"name": "trend_strength", "value": 0.1}
      ],
      "evidence": ["evidence_id_2"],
      "riskFlags": ["low_signal_strength"],
      "notes": "ETH also has a high liquidity score and moderate volatility. However, the trend strength and signal strength are low, indicating uncertainty in the market direction. The technical indicators are mixed with RSI being neutral, MACD bearish, and Stochastic and Williams %R indicating bullish. Therefore, it is recommended to hold until a clearer trend emerges."
    }
  ]
}`
      },
      {
        role: 'sentiment',
        name: 'SENTIMENT ANALYST',
        claims: [
          {
            id: 'claim_3',
            ticker: 'BTC',
            agentRole: 'sentiment' as const,
            claim: 'BUY',
            confidence: 0.75,
            evidence: [mockEvidence[0]!, mockEvidence[1]!],
            timestamp: Date.now(),
            riskFlags: []
          },
          {
            id: 'claim_4',
            ticker: 'ETH',
            agentRole: 'sentiment' as const,
            claim: 'BUY',
            confidence: 0.645,
            evidence: [mockEvidence[2]!, mockEvidence[3]!],
            timestamp: Date.now(),
            riskFlags: []
          }
        ],
        openaiResponse: `SUMMARIZE:
- BTC: The sentiment is generally positive with a score of 0.75. There is high coverage with 20 articles and the news is fresh.
- ETH: The sentiment is moderately positive with a score of 0.645. There is also high coverage with 20 articles and the news is fresh.

REFLECT/CRITICIZE:
- The sentiment analysis appears balanced and considers multiple factors.

AGGREGATE:
- BTC: Strong positive sentiment (0.75)
- ETH: Mixed sentiment (0.645)

{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "sentiment",
      "claim": "BUY",
      "confidence": 0.75,
      "horizon": "weeks",
      "signals": [
        {"name": "sentiment_score", "value": 0.75},
        {"name": "news_coverage", "value": 20},
        {"name": "freshness_score", "value": 1.0}
      ],
      "evidence": ["BTC - 1", "BTC - 2", "BTC - 3"],
      "riskFlags": [],
      "notes": "High sentiment score, high news coverage, and fresh news indicate a positive outlook for BTC."
    },
    {
      "ticker": "ETH",
      "agentRole": "sentiment",
      "claim": "BUY",
      "confidence": 0.645,
      "horizon": "weeks",
      "signals": [
        {"name": "sentiment_score", "value": 0.645},
        {"name": "news_coverage", "value": 20},
        {"name": "freshness_score", "value": 1.0}
      ],
      "evidence": ["ETH - 1", "ETH - 2", "ETH - 3"],
      "riskFlags": [],
      "notes": "Moderate sentiment score, high news coverage, and fresh news indicate a positive outlook for ETH."
    }
  ]
}`
      },
      {
        role: 'technical',
        name: 'TECHNICAL ANALYST',
        claims: [
          {
            id: 'claim_5',
            ticker: 'BTC',
            agentRole: 'technical' as const,
            claim: 'HOLD',
            confidence: 0.2,
            evidence: [mockEvidence[0]!],
            timestamp: Date.now(),
            riskFlags: ['high_volatility', 'weak_signals']
          },
          {
            id: 'claim_6',
            ticker: 'ETH',
            agentRole: 'technical' as const,
            claim: 'HOLD',
            confidence: 0.2,
            evidence: [mockEvidence[2]!],
            timestamp: Date.now(),
            riskFlags: ['high_volatility', 'weak_signals']
          }
        ],
        openaiResponse: `{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "valuation",
      "claim": "HOLD",
      "confidence": 0.2,
      "horizon": "days",
      "signals": [
        {"name": "rsi", "value": 32.34877702826559},
        {"name": "macd", "value": -1259.4859805748856},
        {"name": "volatility_30d", "value": 0.3},
        {"name": "sharpe_proxy", "value": 0.333},
        {"name": "signal_strength", "value": 0.1}
      ],
      "evidence": ["evidence_id_1"],
      "riskFlags": ["high_volatility", "weak_signals"],
      "notes": "BTC shows mixed signals with a bearish MACD and bullish stochastic and Williams %R. The RSI is neutral. The signal strength is low and the volatility is high, suggesting uncertainty in the market. Therefore, a HOLD recommendation is made with low confidence."
    },
    {
      "ticker": "ETH",
      "agentRole": "valuation",
      "claim": "HOLD",
      "confidence": 0.2,
      "horizon": "days",
      "signals": [
        {"name": "rsi", "value": 39.36930772573183},
        {"name": "macd", "value": -24.4441650626286},
        {"name": "volatility_30d", "value": 0.3},
        {"name": "sharpe_proxy", "value": 0.333},
        {"name": "signal_strength", "value": 0.1}
      ],
      "evidence": ["evidence_id_2"],
      "riskFlags": ["high_volatility", "weak_signals"],
      "notes": "ETH also shows mixed signals with a bearish MACD and bullish stochastic and Williams %R. The RSI is neutral. The signal strength is low and the volatility is high, suggesting uncertainty in the market. Therefore, a HOLD recommendation is made with low confidence."
    }
  ]
}`
      }
    ];

    for (const agent of agents) {
      console.log(`📊 Testing ${agent.name}...`);

      // Generate message text without sending
      const messageText = await this.generateAgentAnalysisText(
        'test_round_id',
        agent.role,
        agent.claims,
        2500,
        agent.openaiResponse,
        mockEvidence,
        mockNews
      );

      console.log(`📝 Generated message for ${agent.name}:`);
      console.log('─'.repeat(80));
      console.log(messageText);
      console.log('─'.repeat(80));
      console.log('\n');
    }
  }

  /**
   * Test consensus results message formatting
   */
  async testConsensusResultsFormatting(): Promise<void> {
    console.log('🧪 Testing Consensus Results Message Formatting...\n');

    const mockConsensus: ConsensusRec[] = [
      {
        ticker: 'BTC',
        avgConfidence: 0.485,
        coverage: 1.0,
        liquidity: 0.9,
        finalScore: 0.485,
        claims: ['claim_1', 'claim_3', 'claim_5']
      },
      {
        ticker: 'ETH',
        avgConfidence: 0.454,
        coverage: 1.0,
        liquidity: 0.8,
        finalScore: 0.454,
        claims: ['claim_2', 'claim_4', 'claim_6']
      }
    ];

    const mockConflicts = [
      {
        ticker: 'BTC',
        agent1: 'fundamental',
        claim1: 'HOLD',
        confidence1: 0.6,
        agent2: 'sentiment',
        claim2: 'BUY',
        confidence2: 0.75,
        severity: 'medium',
        resolution: 'Compromise: BUY'
      },
      {
        ticker: 'ETH',
        agent1: 'fundamental',
        claim1: 'HOLD',
        confidence1: 0.6,
        agent2: 'sentiment',
        claim2: 'BUY',
        confidence2: 0.645,
        severity: 'medium',
        resolution: 'Compromise: BUY'
      }
    ];

    const messageText = await this.generateConsensusResultsText(
      'test_round_id',
      mockConsensus,
      mockConflicts
    );

    console.log('📝 Generated Consensus Results message:');
    console.log('─'.repeat(80));
    console.log(messageText);
    console.log('─'.repeat(80));
    console.log('\n');
  }

  /**
   * Test agent debate message formatting
   */
  async testAgentDebateFormatting(): Promise<void> {
    console.log('🧪 Testing Agent Debate Message Formatting...\n');

    const mockConflicts = [
      {
        ticker: 'BTC',
        agent1: 'fundamental',
        claim1: 'HOLD',
        confidence1: 0.6,
        agent2: 'sentiment',
        claim2: 'BUY',
        confidence2: 0.75,
        severity: 'medium'
      },
      {
        ticker: 'ETH',
        agent1: 'fundamental',
        claim1: 'HOLD',
        confidence1: 0.6,
        agent2: 'sentiment',
        claim2: 'BUY',
        confidence2: 0.645,
        severity: 'medium'
      }
    ];

    const mockDebateRounds = [
      {
        agent: 'fundamental',
        argument: 'BTC shows mixed signals with low trend strength and signal strength. The technical indicators are conflicting, suggesting uncertainty in the market direction. A conservative HOLD approach is recommended.',
        confidence: 0.6
      },
      {
        agent: 'sentiment',
        argument: 'BTC has strong positive sentiment with high news coverage and fresh news. The sentiment score of 0.75 indicates bullish market psychology. This outweighs the technical uncertainty.',
        confidence: 0.75
      },
      {
        agent: 'technical',
        argument: 'Technical analysis shows mixed signals with bearish MACD but bullish stochastic. The low signal strength suggests waiting for clearer direction.',
        confidence: 0.2
      }
    ];

    const mockConsensus: ConsensusRec[] = [
      {
        ticker: 'BTC',
        avgConfidence: 0.485,
        coverage: 1.0,
        liquidity: 0.9,
        finalScore: 0.485,
        claims: ['claim_1', 'claim_3', 'claim_5']
      },
      {
        ticker: 'ETH',
        avgConfidence: 0.454,
        coverage: 1.0,
        liquidity: 0.8,
        finalScore: 0.454,
        claims: ['claim_2', 'claim_4', 'claim_6']
      }
    ];

    const messageText = await this.generateAgentDebateText(
      'test_round_id',
      mockConflicts,
      mockDebateRounds,
      mockConsensus
    );

    console.log('📝 Generated Agent Debate message:');
    console.log('─'.repeat(80));
    console.log(messageText);
    console.log('─'.repeat(80));
    console.log('\n');
  }

  /**
   * Generate agent analysis text without sending
   */
  private async generateAgentAnalysisText(
    roundId: string,
    agentRole: string,
    claims: Claim[],
    processingTime: number,
    openaiResponse: string,
    evidence?: Evidence[],
    newsItems?: NewsItem[]
  ): Promise<string> {
    // Use the existing method but capture the text instead of sending
    const originalSendMessage = this.telegram['sendMessage'].bind(this.telegram);

    let capturedText = '';
    this.telegram['sendMessage'] = async (message: any) => {
      capturedText = typeof message === 'string' ? message : message.text;
    };

    try {
      await this.notifications.postAgentAnalysis(
        roundId,
        agentRole,
        claims,
        processingTime,
        openaiResponse,
        undefined,
        evidence,
        newsItems
      );
    } finally {
      this.telegram['sendMessage'] = originalSendMessage;
    }

    return capturedText;
  }

  /**
   * Generate consensus results text without sending
   */
  private async generateConsensusResultsText(
    roundId: string,
    consensus: ConsensusRec[],
    conflicts: any[] = []
  ): Promise<string> {
    const originalSendMessage = this.telegram['sendMessage'].bind(this.telegram);

    let capturedText = '';
    this.telegram['sendMessage'] = async (message: any) => {
      capturedText = typeof message === 'string' ? message : message.text;
    };

    try {
      await this.notifications.postConsensusResults(roundId, consensus, conflicts);
    } finally {
      this.telegram['sendMessage'] = originalSendMessage;
    }

    return capturedText;
  }

  /**
   * Generate agent debate text without sending
   */
  private async generateAgentDebateText(
    roundId: string,
    conflicts: any[],
    debateRounds: any[],
    consensus: ConsensusRec[]
  ): Promise<string> {
    const originalSendMessage = this.telegram['sendMessage'].bind(this.telegram);

    let capturedText = '';
    this.telegram['sendMessage'] = async (message: any) => {
      capturedText = typeof message === 'string' ? message : message.text;
    };

    try {
      await this.notifications.postAgentDebateSummary(roundId, conflicts, debateRounds, consensus);
    } finally {
      this.telegram['sendMessage'] = originalSendMessage;
    }

    return capturedText;
  }

  /**
   * Run all formatting tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Telegram Message Formatting Tests...\n');
    console.log('='.repeat(80));
    console.log('🧪 TELEGRAM FORMATTING TEST SUITE');
    console.log('='.repeat(80));
    console.log('This test generates Telegram message texts without sending them.\n');

    try {
      await this.testAgentAnalysisFormatting();
      await this.testConsensusResultsFormatting();
      await this.testAgentDebateFormatting();

      console.log('✅ All Telegram formatting tests completed successfully!');
      console.log('📝 Messages were generated but not sent to avoid spam.');
    } catch (error) {
      console.error('❌ Error during Telegram formatting tests:', error);
    }
  }
}

/**
 * Main test runner
 */
async function runTelegramFormattingTest(): Promise<void> {
  const test = new TelegramFormattingTest();
  await test.runAllTests();
}

// Export for use in other tests
export { TelegramFormattingTest, runTelegramFormattingTest };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTelegramFormattingTest().catch(console.error);
}
