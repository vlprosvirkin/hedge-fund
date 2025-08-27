import { VerifierService } from '../services/verifier.js';
import { ConsensusService } from '../services/consensus.js';
import { exampleClaims, invalidClaim } from './example-claims.js';
import type { MarketStats } from '../types/index.js';

// Mock FactStore for testing
const mockFactStore = {
  getNewsByIds: async (ids: string[]) => {
    return ids.map(id => ({
      id,
      title: `Test news ${id}`,
      url: `https://example.com/${id}`,
      source: 'coindesk.com',
      publishedAt: Date.now() - 3600000, // 1 hour ago
      sentiment: 0.5,
      description: 'Test news description'
    }));
  }
};

// Mock market stats for testing
const mockMarketStats: MarketStats[] = [
  {
    symbol: 'SOL',
    timestamp: Date.now(),
    price: 150.0,
    volume24h: 1230000000,
    spread: 3.1,
    tickSize: 0.01,
    stepSize: 0.001,
    minQty: 0.001,
    maxQty: 1000
  },
  {
    symbol: 'BTC',
    timestamp: Date.now(),
    price: 45000.0,
    volume24h: 25000000000,
    spread: 5.2,
    tickSize: 0.01,
    stepSize: 0.001,
    minQty: 0.001,
    maxQty: 1000
  },
  {
    symbol: 'ETH',
    timestamp: Date.now(),
    price: 3000.0,
    volume24h: 8000000000,
    spread: 4.0,
    tickSize: 0.01,
    stepSize: 0.001,
    minQty: 0.001,
    maxQty: 1000
  }
];

async function testNewArchitecture() {
  console.log('🧪 Testing New Architecture with Discriminated Evidence\n');

  // 1. Test VerifierService with new Evidence structure
  console.log('1️⃣ Testing VerifierService...');
  const verifier = new VerifierService(mockFactStore as any);
  
  const cutoff = Date.now() - 300000; // 5 minutes ago
  
  const verificationResult = await verifier.verifyClaims(exampleClaims, cutoff);
  console.log(`✅ Verified: ${verificationResult.verified.length} claims`);
  console.log(`❌ Rejected: ${verificationResult.rejected.length} claims`);
  console.log(`⚠️  Violations: ${verificationResult.violations.length} total`);
  
  if (verificationResult.rejected.length > 0) {
    console.log('Rejected claims:');
    verificationResult.rejected.forEach(claim => {
      console.log(`  - ${claim.ticker}: ${claim.claim}`);
    });
  }

  // 2. Test invalid claim
  console.log('\n2️⃣ Testing invalid claim...');
  const invalidVerification = await verifier.verifyClaims([invalidClaim], cutoff);
  console.log(`Invalid claim verified: ${invalidVerification.verified.length > 0 ? '❌ FAIL' : '✅ PASS'}`);

  // 3. Test ConsensusService with new scoring formula
  console.log('\n3️⃣ Testing ConsensusService...');
  const consensus = new ConsensusService();
  
  const consensusResult = await consensus.buildConsensus(
    verificationResult.verified,
    mockMarketStats,
    5
  );
  
  console.log(`✅ Consensus built for ${consensusResult.length} positions`);
  
  // Show detailed consensus results
  consensusResult.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.ticker}:`);
    console.log(`   Score: ${rec.finalScore.toFixed(4)}`);
    console.log(`   Confidence: ${(rec.avgConfidence * 100).toFixed(1)}%`);
    console.log(`   Coverage: ${(rec.coverage * 100).toFixed(1)}%`);
    console.log(`   Liquidity: ${rec.liquidity.toFixed(3)}`);
    console.log(`   Claims: ${rec.claims.length}`);
  });

  // 4. Test evidence structure validation
  console.log('\n4️⃣ Testing Evidence structure...');
  const validEvidence = exampleClaims[0]?.evidence;
  if (!validEvidence) {
    console.log('❌ No evidence found in first claim');
    return;
  }
  console.log('Valid evidence structure:');
  validEvidence.forEach((evidence, i) => {
    console.log(`  ${i + 1}. ${evidence.kind}:`);
    if (evidence.kind === 'news') {
      console.log(`     Source: ${evidence.source}`);
      console.log(`     URL: ${evidence.url}`);
      console.log(`     Snippet: ${evidence.snippet.substring(0, 50)}...`);
    } else if (evidence.kind === 'market') {
      console.log(`     Source: ${evidence.source}`);
      console.log(`     Metric: ${evidence.metric}`);
      console.log(`     Value: ${evidence.value}`);
    } else if (evidence.kind === 'tech') {
      console.log(`     Source: ${evidence.source}`);
      console.log(`     Metric: ${evidence.metric}`);
      console.log(`     Value: ${evidence.value}`);
    }
  });

  // 5. Test claim structure
  console.log('\n5️⃣ Testing Claim structure...');
  const sampleClaim = exampleClaims[0];
  if (!sampleClaim) {
    console.log('❌ No sample claim found');
    return;
  }
  console.log('Sample claim structure:');
  console.log(`  ID: ${sampleClaim.id}`);
  console.log(`  Ticker: ${sampleClaim.ticker}`);
  console.log(`  Role: ${sampleClaim.agentRole}`);
  console.log(`  Claim: ${sampleClaim.claim}`);
  console.log(`  Thesis: ${sampleClaim.thesis}`);
  console.log(`  Confidence: ${sampleClaim.confidence}`);
  console.log(`  Direction: ${sampleClaim.direction}`);
  console.log(`  Magnitude: ${sampleClaim.magnitude}`);
  console.log(`  Evidence count: ${sampleClaim.evidence.length}`);

  // 6. Test scoring formula
  console.log('\n6️⃣ Testing scoring formula...');
  const solClaims = verificationResult.verified.filter(c => c.ticker === 'SOL');
  const solMarketStat = mockMarketStats.find(m => m.symbol === 'SOL');
  
  if (solClaims.length > 0 && solMarketStat) {
    const avgConfidence = solClaims.reduce((sum, c) => sum + c.confidence, 0) / solClaims.length;
    const roles = new Set(solClaims.map(c => c.agentRole));
    const coverage = roles.size / 3;
    const liquidity = Math.min(solMarketStat.volume24h / 1000000, 1) * 0.7 + 
                     Math.max(0, 1 - (solMarketStat.spread || 0) / 100) * 0.3;
    const finalScore = avgConfidence * coverage * liquidity;
    
    console.log('SOL scoring breakdown:');
    console.log(`  Avg Confidence: ${avgConfidence.toFixed(3)}`);
    console.log(`  Coverage: ${coverage.toFixed(3)} (${roles.size}/3 roles)`);
    console.log(`  Liquidity: ${liquidity.toFixed(3)}`);
    console.log(`  Final Score: ${finalScore.toFixed(4)}`);
  }

  console.log('\n🎉 New Architecture Test Completed!');
}

// Run the test
testNewArchitecture().catch(console.error);
