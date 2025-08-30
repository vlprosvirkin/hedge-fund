import { splitResponseIntoParts, extractClaimsFromJSON, extractClaimsFromText } from '../utils/json-parsing-utils.js';

/**
 * Simple test for JSON parsing utilities
 */
async function testJSONParsing() {
  console.log('🧪 Testing JSON Parsing Utilities\n');

  // Test 1: Valid JSON
  console.log('1️⃣ Testing valid JSON:');
  const validResponse = `ANALYSIS:
BTC shows strong fundamentals.

CLAIMS:
{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "fundamental",
      "claim": "BUY",
      "confidence": 0.8
    }
  ]
}`;

  const result1 = splitResponseIntoParts(validResponse);
  console.log(`   ✅ Has valid JSON: ${result1.hasValidJson}`);
  console.log(`   📊 Claims count: ${result1.jsonPart.claims?.length || 0}`);

  // Test 2: Incomplete JSON (missing closing brace)
  console.log('\n2️⃣ Testing incomplete JSON:');
  const incompleteResponse = `ANALYSIS:
BTC shows strong fundamentals.

CLAIMS:
{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "fundamental",
      "claim": "BUY",
      "confidence": 0.8
    }
  ]
  // Missing closing brace
`;

  const result2 = splitResponseIntoParts(incompleteResponse);
  console.log(`   ✅ Has valid JSON: ${result2.hasValidJson}`);
  console.log(`   📊 Claims count: ${result2.jsonPart.claims?.length || 0}`);

  // Test 3: No JSON in response
  console.log('\n3️⃣ Testing no JSON:');
  const noJsonResponse = `ANALYSIS:
BTC shows strong fundamentals.

No claims to make at this time.`;

  const result3 = splitResponseIntoParts(noJsonResponse);
  console.log(`   ✅ Has valid JSON: ${result3.hasValidJson}`);
  console.log(`   📝 Text part: ${result3.textPart.substring(0, 50)}...`);

  // Test 4: Claims extraction
  console.log('\n4️⃣ Testing claims extraction:');
  const context = {
    facts: [
      { id: 'BTC_news_1', ticker: 'BTC' },
      { id: 'ETH_news_2', ticker: 'ETH' }
    ],
    timestamp: Date.now(),
    universe: ['BTC', 'ETH']
  };

  if (result1.hasValidJson) {
    const claims = extractClaimsFromJSON(result1.jsonPart, context);
    console.log(`   📊 Extracted claims: ${claims.length}`);
    claims.forEach((claim, i) => {
      console.log(`      ${i + 1}. ${claim.ticker} - ${claim.claim} (${(claim.confidence * 100).toFixed(1)}%)`);
    });
  }

  // Test 5: Text extraction fallback
  console.log('\n5️⃣ Testing text extraction fallback:');
  const textClaims = extractClaimsFromText(result3.textPart, context);
  console.log(`   📊 Claims from text: ${textClaims.length}`);
  textClaims.forEach((claim, i) => {
    console.log(`      ${i + 1}. ${claim.ticker} - ${claim.claim} (${(claim.confidence * 100).toFixed(1)}%)`);
  });

  console.log('\n✅ JSON Parsing Tests Completed');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testJSONParsing();
}

export { testJSONParsing };
