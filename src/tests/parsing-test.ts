import { AgentFactory } from '../agents/agent-factory.js';
import { BaseAgent } from '../agents/base-agent.js';
import { OpenAIService } from '../services/openai.service.js';
import { splitResponseIntoParts, extractClaimsFromJSON, extractClaimsFromText, testJSONParsing } from '../utils/json-parsing-utils.js';
import type { Claim } from '../types/index.js';

interface AgentResponse {
  claims: Claim[];
  textPart: string;
  jsonPart: any;
  openaiResponse: string;
}

async function testAgentParsing() {
  console.log('🧪 TESTING AGENT PARSING\n');

  const agentRoles = ['fundamental', 'sentiment', 'valuation'] as const;

  for (const role of agentRoles) {
    console.log(`\n📊 Testing ${role.toUpperCase()} agent parsing:`);
    console.log('─'.repeat(50));

    try {
      // Create agent
      const agent = await AgentFactory.createAgent(role);

      // Mock context
      const context = {
        universe: ['BTC', 'ETH'],
        facts: [
          {
            id: 'BTC_news_1',
            ticker: 'BTC',
            newsItemId: 'news_1',
            relevance: 0.8,
            timestamp: Date.now(),
            source: 'CoinDesk',
            quote: 'Bitcoin reaches new highs'
          },
          {
            id: 'ETH_news_2',
            ticker: 'ETH',
            newsItemId: 'news_2',
            relevance: 0.9,
            timestamp: Date.now(),
            source: 'Cointelegraph',
            quote: 'Ethereum upgrade successful'
          }
        ],
        marketStats: [
          {
            symbol: 'BTC',
            price: 50000,
            volume24h: 1000000,
            marketCap: 1000000000,
            volatility: 0.02,
            liquidity: 0.95
          },
          {
            symbol: 'ETH',
            price: 3000,
            volume24h: 800000,
            marketCap: 400000000,
            volatility: 0.03,
            liquidity: 0.90
          }
        ],
        riskProfile: 'neutral',
        timestamp: Date.now()
      };

      // Test parsing methods
      await testParsingMethods(agent, context, role);

    } catch (error) {
      console.error(`❌ Error testing ${role} agent:`, error);
    }
  }
}

async function testParsingMethods(agent: BaseAgent, context: any, role: string) {
  console.log(`\n🔍 Testing parsing methods for ${role} agent:`);

  // Test 1: Build prompts
  console.log('\n1️⃣ Testing prompt building:');
  try {
    const systemPrompt = (agent as any).buildSystemPrompt(context);
    const userPrompt = (agent as any).buildUserPrompt(context);

    console.log(`✅ System prompt length: ${systemPrompt.length} chars`);
    console.log(`✅ User prompt length: ${userPrompt.length} chars`);

    // Check for common issues
    if (systemPrompt.includes('undefined')) {
      console.log('⚠️  System prompt contains "undefined"');
    }
    if (userPrompt.includes('undefined')) {
      console.log('⚠️  User prompt contains "undefined"');
    }

  } catch (error) {
    console.error('❌ Error building prompts:', error);
  }

  // Test 2: Mock OpenAI response and test parsing
  console.log('\n2️⃣ Testing response parsing:');

  const mockResponses = [
    // Valid JSON response
    `ANALYSIS:
BTC shows strong fundamentals with high liquidity and low volatility. The market cap is substantial, indicating institutional interest.

CLAIMS:
{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "${role}",
      "claim": "BUY",
      "confidence": 0.8,
      "horizon": "weeks",
      "signals": [
        {"name": "liquidity_score", "value": 0.95},
        {"name": "volatility", "value": 0.02}
      ],
      "evidence": ["BTC_news_1"],
      "riskFlags": [],
      "notes": "Strong fundamentals with high liquidity"
    },
    {
      "ticker": "ETH",
      "agentRole": "${role}",
      "claim": "HOLD",
      "confidence": 0.6,
      "horizon": "weeks",
      "signals": [
        {"name": "liquidity_score", "value": 0.90},
        {"name": "volatility", "value": 0.03}
      ],
      "evidence": ["ETH_news_2"],
      "riskFlags": ["high_volatility"],
      "notes": "Moderate fundamentals with some volatility"
    }
  ]
}`,

    // Response with parse error (missing ticker)
    `ANALYSIS:
Mixed signals across assets.

CLAIMS:
{
  "claims": [
    {
      "agentRole": "${role}",
      "claim": "HOLD",
      "confidence": 0.5,
      "horizon": "weeks",
      "signals": [
        {"name": "liquidity_score", "value": 0.8}
      ],
      "evidence": [],
      "riskFlags": [],
      "notes": "Mixed signals"
    }
  ]
}`,

    // Response with invalid JSON
    `ANALYSIS:
BTC shows strong fundamentals.

CLAIMS:
{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "${role}",
      "claim": "BUY",
      "confidence": 0.8,
      "horizon": "weeks",
      "signals": [
        {"name": "liquidity_score", "value": 0.95}
      ],
      "evidence": ["BTC_news_1"],
      "riskFlags": [],
      "notes": "Strong fundamentals"
    }
  ]
  // Missing closing brace
`,

    // Response with UNKNOWN ticker
    `ANALYSIS:
Mixed market conditions.

CLAIMS:
{
  "claims": [
    {
      "ticker": "UNKNOWN",
      "agentRole": "${role}",
      "claim": "HOLD",
      "confidence": 0.2,
      "horizon": "weeks",
      "signals": [
        {"name": "sentiment_score", "value": 0.5}
      ],
      "evidence": [],
      "riskFlags": ["parse_error"],
      "notes": "Unable to determine specific asset"
    }
  ]
}`
  ];

  for (let i = 0; i < mockResponses.length; i++) {
    const response = mockResponses[i];
    console.log(`\n   Test ${i + 1}: ${i === 0 ? 'Valid JSON' : i === 1 ? 'Missing ticker' : i === 2 ? 'Invalid JSON' : 'UNKNOWN ticker'}`);

    try {
      // Test using real parsing functions
      const parsedResponse = splitResponseIntoParts(response || '');

      console.log(`   ✅ Parsed successfully`);
      console.log(`   📊 Has valid JSON: ${parsedResponse.hasValidJson}`);

      if (parsedResponse.hasValidJson) {
        const claims = extractClaimsFromJSON(parsedResponse.jsonPart, context);
        console.log(`   📊 Claims count: ${claims.length}`);

        if (claims.length > 0) {
          const firstClaim = claims[0];
          console.log(`   🎯 First claim: ${firstClaim.ticker} - ${firstClaim.claim} (${(firstClaim.confidence * 100).toFixed(1)}%)`);

          if (firstClaim.riskFlags && firstClaim.riskFlags.length > 0) {
            console.log(`   ⚠️  Risk flags: ${firstClaim.riskFlags.join(', ')}`);
          }

          if (firstClaim.ticker === 'UNKNOWN') {
            console.log(`   🚨 UNKNOWN ticker detected!`);
          }
        }
      } else {
        console.log(`   ⚠️  Parse errors: ${parsedResponse.parseErrors.join(', ')}`);
      }

    } catch (error) {
      console.log(`   ❌ Parse error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Test specific parsing issues
async function testSpecificParsingIssues() {
  console.log('\n\n🔧 TESTING SPECIFIC PARSING ISSUES');
  console.log('─'.repeat(50));

  // Test the splitResponseIntoParts method
  console.log('\n1️⃣ Testing splitResponseIntoParts:');

  const testResponses = [
    // Normal response
    `ANALYSIS:
BTC shows strong fundamentals.

CLAIMS:
{
  "claims": [
    {
      "ticker": "BTC",
      "claim": "BUY",
      "confidence": 0.8
    }
  ]
}`,

    // Response with no JSON
    `ANALYSIS:
BTC shows strong fundamentals.

No claims to make.`,

    // Response with malformed JSON
    `ANALYSIS:
BTC shows strong fundamentals.

CLAIMS:
{
  "claims": [
    {
      "ticker": "BTC",
      "claim": "BUY",
      "confidence": 0.8
    }
  ]
  // Missing closing brace
`,

    // Response with multiple JSON blocks
    `ANALYSIS:
BTC shows strong fundamentals.

CLAIMS:
{
  "claims": [
    {
      "ticker": "BTC",
      "claim": "BUY",
      "confidence": 0.8
    }
  ]
}

ADDITIONAL DATA:
{
  "extra": "data"
}`
  ];

  for (let i = 0; i < testResponses.length; i++) {
    console.log(`\n   Test ${i + 1}:`);
    try {
      const result = splitResponseIntoParts(testResponses[i] || '');
      console.log(`   📝 Response length: ${(testResponses[i] || '').length} chars`);
      console.log(`   ✅ Has valid JSON: ${result.hasValidJson}`);
      console.log(`   📊 JSON part keys: ${Object.keys(result.jsonPart).join(', ')}`);
      if (result.parseErrors.length > 0) {
        console.log(`   ⚠️  Parse errors: ${result.parseErrors.join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Test real agent responses from JSON files
async function testRealAgentResponses() {
  console.log('\n\n📄 TESTING REAL AGENT RESPONSES');
  console.log('─'.repeat(50));

  // Test with real responses from the JSON files
  const realResponses = [
    // Sentiment agent response that caused UNKNOWN ticker
    {
      name: 'Sentiment Agent - UNKNOWN ticker',
      content: `SUMMARIZE:
- BTC: The sentiment data for Bitcoin is mixed, with some positive news such as Sequans raising $200M to buy more Bitcoin and Metaplanet acquiring 103 BTC for $11.6M, but also negative news like Bitcoin falling below $110,000 amid economic uncertainty. The overall sentiment score is 0.71.
- ETH: The sentiment data for Ethereum is also mixed, with positive news such as ETHZilla authorizing a $250M buyback and Tom Lee's Bitmine acquiring $2.2B in Ethereum, but also negative news like BlackRock selling $257.8M worth of Ethereum in ETF. The overall sentiment score is 0.64.

REFLECT/CRITICIZE:
- The summaries seem to capture the main points of the news articles, but they might be oversimplifying the situation. The sentiment scores are averages, so they might not fully reflect the range of sentiments expressed in the articles.

REVISE:
- BTC: The sentiment data for Bitcoin shows a range of views, with some positive developments such as Sequans raising $200M to buy more Bitcoin and Metaplanet acquiring 103 BTC for $11.6M, but also concerns about Bitcoin's price falling below $110,000 amid economic uncertainty. The overall sentiment score of 0.71 suggests a slightly positive sentiment.
- ETH: The sentiment data for Ethereum also shows a range of views, with positive developments such as ETHZilla authorizing a $250M buyback and Tom Lee's Bitmine acquiring $2.2B in Ethereum, but also concerns about BlackRock selling $257.8M worth of Ethereum in ETF. The overall sentiment score of 0.64 suggests a slightly positive sentiment.

AGGREGATE:
- BTC: The overall sentiment for Bitcoin is slightly positive, with a sentiment score of 0.71, high coverage of 20 articles, and high freshness score of 1.0.
- ETH: The overall sentiment for Ethereum is also slightly positive, with a sentiment score of 0.64, high coverage of 20 articles, and high freshness score of 1.0.

SCORE:
- BTC: The sentiment score for Bitcoin is 0.71, multiplied by the coverage of 20 and the freshness of 1.0, gives a final score of 0.71.
- ETH: The sentiment score for Ethereum is 0.64, multiplied by the coverage of 20 and the freshness of 1.0, gives a final score of 0.64.

Based on these scores, the recommendation for both Bitcoin and Ethereum is to BUY, with a confidence of 0.71 for Bitcoin and 0.64 for Ethereum. The horizon for these recommendations is in the range of weeks. The main risk flag is the potential for market volatility. The reasoning for these recommendations is the overall positive sentiment in the news coverage, the high number of articles covering these assets, and the freshness of the news.`
    },

    // Fundamental agent response
    {
      name: 'Fundamental Agent - Valid JSON',
      content: `FUNDAMENTAL ANALYSIS:

BTC shows excellent liquidity with a score of 1.000, which is the highest possible score, indicating that there is a high volume of trading activity and low spreads, which contributes to more stable pricing. However, the signal strength is negative at -0.3, suggesting a bearish trend. The volatility is relatively low at 0.005, indicating that the price of BTC is relatively stable. The market cap is extremely large, suggesting strong institutional interest and stability. Despite the negative signal strength, the strong fundamentals suggest that BTC may be a good long-term investment.

ETH also shows excellent liquidity with a score of 1.000, indicating high trading activity and low spreads. The signal strength is positive at 0.3, suggesting a bullish trend. The volatility is extremely low at 0.001, indicating that the price of ETH is very stable. The market cap is large but significantly smaller than that of BTC, suggesting solid institutional backing but less so than BTC. The positive signal strength and strong fundamentals suggest that ETH may be a good investment.

CLAIMS:

{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "fundamental",
      "claim": "HOLD",
      "confidence": 0.7,
      "horizon": "weeks",
      "signals": [
        {
          "name": "liquidity_score",
          "value": 1
        },
        {
          "name": "volatility",
          "value": 0.005
        },
        {
          "name": "trend_strength",
          "value": -0.3
        }
      ],
      "evidence": [
        "1756293318545"
      ],
      "riskFlags": [
        "negative_signal_strength"
      ],
      "notes": "BTC has excellent liquidity and low volatility, but the negative signal strength suggests potential headwinds."
    },
    {
      "ticker": "ETH",
      "agentRole": "fundamental",
      "claim": "BUY",
      "confidence": 0.8,
      "horizon": "weeks",
      "signals": [
        {
          "name": "liquidity_score",
          "value": 1
        },
        {
          "name": "volatility",
          "value": 0.001
        },
        {
          "name": "trend_strength",
          "value": 0.3
        }
      ],
      "evidence": [
        "1756293318545"
      ],
      "riskFlags": [],
      "notes": "ETH has excellent liquidity, low volatility, and a positive signal strength, suggesting a bullish trend."
    }
  ]
}`
    }
  ];

  for (const response of realResponses) {
    console.log(`\n📋 Test: ${response.name}`);
    console.log('─'.repeat(40));

    try {
      const result = splitResponseIntoParts(response.content);

      console.log(`✅ Has valid JSON: ${result.hasValidJson}`);
      console.log(`📝 Text part length: ${result.textPart.length} chars`);

      const mockContext = {
        facts: [
          { id: 'BTC_news_1', ticker: 'BTC' },
          { id: 'ETH_news_2', ticker: 'ETH' }
        ],
        timestamp: Date.now(),
        universe: ['BTC', 'ETH']
      };

      let claims;
      if (result.hasValidJson) {
        claims = extractClaimsFromJSON(result.jsonPart, mockContext);
        console.log(`📊 Claims from JSON: ${claims.length}`);
      } else {
        // Try to extract claims from text
        claims = extractClaimsFromText(result.textPart, mockContext);
        console.log(`📊 Claims from text: ${claims.length}`);
      }

      if (claims.length > 0) {
        claims.forEach((claim, i) => {
          console.log(`   Claim ${i + 1}: ${claim.ticker} - ${claim.claim} (${(claim.confidence * 100).toFixed(1)}%)`);
          if (claim.riskFlags && claim.riskFlags.length > 0) {
            console.log(`   ⚠️  Risk flags: ${claim.riskFlags.join(', ')}`);
          }
        });
      } else {
        console.log(`⚠️  No claims extracted`);
      }

    } catch (error) {
      console.error(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Run the tests
async function runParsingTests() {
  try {
    // Test JSON parsing utilities
    testJSONParsing();

    // Test agent parsing
    await testAgentParsing();

    // Test specific parsing issues
    await testSpecificParsingIssues();

    // Test real agent responses
    await testRealAgentResponses();

    console.log('\n\n✅ PARSING TESTS COMPLETED');
    console.log('\n📋 SUMMARY:');
    console.log('• Tested JSON parsing utilities');
    console.log('• Tested all agent types (fundamental, sentiment, valuation)');
    console.log('• Tested various JSON parsing scenarios');
    console.log('• Tested real agent responses');
    console.log('• Identified potential parsing issues');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runParsingTests();
}

export { runParsingTests, testAgentParsing, testSpecificParsingIssues };
