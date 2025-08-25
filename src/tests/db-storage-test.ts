import { PostgresAdapter } from '../adapters/postgres-adapter.js';
import type { Claim, Evidence, NewsItem, ConsensusRec, Order } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

async function testDatabaseStorage() {
  console.log('🧪 Testing Database Storage');
  console.log('============================');

  const postgresAdapter = new PostgresAdapter();

  try {
    // Connect to database
    await postgresAdapter.connect();
    console.log('✅ Connected to PostgreSQL');

    const roundId = `test-round-${Date.now()}`;
    console.log(`📊 Testing with round ID: ${roundId}`);

    // Test 1: Store news
    console.log('\n📰 Test 1: Storing news...');
    const mockNews: NewsItem[] = [
      {
        id: uuidv4(),
        title: 'Bitcoin reaches new highs',
        description: 'Bitcoin price surges to new all-time high',
        url: 'https://example.com/btc-news',
        source: 'CoinDesk',
        publishedAt: Date.now(),
        sentiment: 0.8
      }
    ];
    await postgresAdapter.putNews(mockNews);
    console.log('✅ News stored successfully');

    // Test 2: Store evidence
    console.log('\n🔍 Test 2: Storing evidence...');
    const mockEvidence: Evidence[] = [
      {
        id: uuidv4(),
        ticker: 'BTC',
        newsItemId: mockNews[0]!.id,
        relevance: 0.9,
        quote: 'Bitcoin shows strong momentum',
        timestamp: Date.now(),
        source: 'CoinDesk'
      }
    ];
    await postgresAdapter.putEvidence(mockEvidence);
    console.log('✅ Evidence stored successfully');

    // Test 3: Start round
    console.log('\n🔄 Test 3: Starting round...');
    await postgresAdapter.startRound(roundId);
    console.log('✅ Round started successfully');

    // Test 4: Store claims
    console.log('\n📋 Test 4: Storing claims...');
    const mockClaims: Claim[] = [
      {
        id: uuidv4(),
        ticker: 'BTC',
        agentRole: 'fundamental',
        claim: 'BUY - Strong fundamentals',
        confidence: 0.8,
        evidence: [mockEvidence[0]!.id],
        timestamp: Date.now(),
        riskFlags: []
      }
    ];
    await postgresAdapter.storeClaims(mockClaims, roundId);
    console.log('✅ Claims stored successfully');

    // Test 5: Store consensus
    console.log('\n🎯 Test 5: Storing consensus...');
    const mockConsensus: ConsensusRec[] = [
      {
        ticker: 'BTC',
        avgConfidence: 0.8,
        coverage: 0.9,
        liquidity: 0.95,
        finalScore: 0.85,
        claims: [mockClaims[0]!.id]
      }
    ];
    await postgresAdapter.storeConsensus(mockConsensus, roundId);
    console.log('✅ Consensus stored successfully');

    // Test 6: Store orders
    console.log('\n📈 Test 6: Storing orders...');
    const mockOrders: Order[] = [
      {
        id: uuidv4(),
        symbol: 'BTC',
        side: 'buy',
        type: 'market',
        quantity: 0.1,
        price: 50000,
        status: 'filled',
        timestamp: Date.now()
      }
    ];
    await postgresAdapter.storeOrders(mockOrders, roundId);
    console.log('✅ Orders stored successfully');

    // Test 7: End round
    console.log('\n🏁 Test 7: Ending round...');
    await postgresAdapter.endRound(roundId, 'completed', 1, 1, 100);
    console.log('✅ Round ended successfully');

    // Test 8: Verify data retrieval
    console.log('\n🔍 Test 8: Verifying data retrieval...');

    const retrievedClaims = await postgresAdapter.getClaimsByRound(roundId);
    console.log(`✅ Retrieved ${retrievedClaims.length} claims`);

    const retrievedNews = await postgresAdapter.getNewsByIds([mockNews[0]!.id]);
    console.log(`✅ Retrieved ${retrievedNews.length} news items`);

    console.log('\n🎉 All database storage tests passed!');
    console.log('📊 Summary:');
    console.log(`   - News: ${mockNews.length} items`);
    console.log(`   - Evidence: ${mockEvidence.length} items`);
    console.log(`   - Claims: ${mockClaims.length} items`);
    console.log(`   - Consensus: ${mockConsensus.length} items`);
    console.log(`   - Orders: ${mockOrders.length} items`);
    console.log(`   - Round: ${roundId}`);

  } catch (error) {
    console.error('❌ Database storage test failed:', error);
    throw error;
  } finally {
    await postgresAdapter.disconnect();
    console.log('✅ Disconnected from PostgreSQL');
  }
}

// Run the test
testDatabaseStorage().catch(console.error);
