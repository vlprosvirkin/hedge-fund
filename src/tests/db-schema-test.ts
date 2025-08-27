import { PostgresAdapter } from '../adapters/postgres-adapter.js';

// Simple test to verify the new DB schema works
async function testNewDBSchema() {
    console.log('🧪 Testing New DB Schema\n');

    // Create adapter (uses DATABASE_CONFIG from config.ts)
    const adapter = new PostgresAdapter();

    try {
        await adapter.connect();
        console.log('✅ Connected to database');

        // Test storing different types of evidence
        const testEvidence = [
            {
                id: 'test-news-1',
                kind: 'news',
                source: 'coindesk.com',
                url: 'https://example.com/test-news',
                snippet: 'Test news article about Bitcoin',
                publishedAt: new Date().toISOString(),
                relevance: 0.9,
                impact: 0.8,
                confidence: 0.85
            },
            {
                id: 'test-market-1',
                kind: 'market',
                source: 'binance',
                metric: 'vol24h',
                value: 25000000000,
                observedAt: new Date().toISOString(),
                relevance: 0.95,
                impact: 0.0,
                confidence: 0.95
            },
            {
                id: 'test-tech-1',
                kind: 'tech',
                source: 'indicators',
                metric: 'RSI(14,4h)',
                value: 58.5,
                observedAt: new Date().toISOString(),
                relevance: 0.85,
                impact: 0.3,
                confidence: 0.9
            }
        ];

        console.log('📝 Storing test evidence...');
        await adapter.storeEvidence(testEvidence);
        console.log('✅ Evidence stored successfully');

        // Test retrieving evidence
        console.log('🔍 Retrieving evidence...');
        const retrievedEvidence = await adapter.findEvidence('BTC', { since: Date.now() - 24 * 60 * 60 * 1000 });
        console.log(`✅ Retrieved ${retrievedEvidence.length} evidence items`);

        // Show the structure
        retrievedEvidence.forEach((evidence, i) => {
            console.log(`Evidence ${i + 1}:`);
            console.log(`  Kind: ${evidence.kind}`);
            console.log(`  Source: ${evidence.source}`);
            if (evidence.kind === 'news') {
                console.log(`  URL: ${evidence.url}`);
                console.log(`  Snippet: ${evidence.snippet}`);
            } else {
                console.log(`  Metric: ${evidence.metric}`);
                console.log(`  Value: ${evidence.value}`);
            }
            console.log(`  Relevance: ${evidence.relevance}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await adapter.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testNewDBSchema().catch(console.error);
}
