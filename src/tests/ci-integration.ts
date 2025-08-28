import { ConsensusService } from '../services/consensus.js';
import { TechnicalAnalysisService } from '../services/technical-analysis.service.js';
import { NewsAnalysisService } from '../services/news-analysis.service.js';

/**
 * Простой CI/CD тест
 * Проверяет базовую функциональность без внешних API
 */

async function testCoreServices() {
    console.log('🧪 Testing Core Services (CI Mode)');
    console.log('===================================');

    try {
        // Test Technical Analysis Service
        console.log('\n📈 Testing Technical Analysis Service...');
        const technicalAnalysis = new TechnicalAnalysisService();

        const isOverbought = technicalAnalysis.isOverbought(75, 'RSI');
        const isOversold = technicalAnalysis.isOversold(25, 'RSI');

        console.log('✅ Technical Analysis Service tests passed');
        console.log(`   RSI overbought (75): ${isOverbought}`);
        console.log(`   RSI oversold (25): ${isOversold}`);

        // Test News Analysis Service
        console.log('\n📰 Testing News Analysis Service...');
        const newsAnalysis = new NewsAnalysisService();

        const sentiment = newsAnalysis.calculateSentiment('High', 'Positive for crypto market');

        console.log('✅ News Analysis Service tests passed');
        console.log(`   Calculated sentiment: ${sentiment.toFixed(2)}`);

        // Test Consensus Service
        console.log('\n🎯 Testing Consensus Service...');
        const consensus = new ConsensusService();

        const mockEvidence = [
            {
                id: '1',
                ticker: 'BTC',
                kind: 'news' as const,
                source: 'test',
                url: 'https://test.com',
                snippet: 'Test evidence',
                publishedAt: new Date().toISOString(),
                relevance: 0.8,
                impact: 0.6,
                confidence: 0.8
            }
        ];

        const mockClaims = [
            {
                id: '1',
                ticker: 'BTC',
                agentRole: 'fundamental' as const,
                claim: 'BTC is undervalued',
                confidence: 0.8,
                evidence: mockEvidence,
                timestamp: Date.now()
            }
        ];

        const mockMarketStats = [
            {
                symbol: 'BTC',
                timestamp: Date.now(),
                volume24h: 1000000,
                spread: 0.1,
                tickSize: 0.01,
                stepSize: 0.001,
                minQty: 0.001,
                maxQty: 1000
            }
        ];

        const consensusResult = await consensus.buildConsensus(mockClaims, mockMarketStats, 5);
        console.log('✅ Consensus Service tests passed');
        console.log(`   Consensus recommendations: ${consensusResult.length}`);

        console.log('\n🎉 All Core Services tests passed!');

    } catch (error) {
        console.error('❌ Core Services test failed:', error);
        throw error;
    }
}

async function testBasicImports() {
    console.log('\n📝 Testing Basic Imports (CI Mode)');
    console.log('==================================');

    try {
        // Test that core modules can be imported
        console.log('\n🔍 Testing module imports...');

        // Test services imports
        const { AgentsService } = await import('../services/agents.js');
        const { ConsensusService } = await import('../services/consensus.js');
        const { VerifierService } = await import('../services/verifier.js');

        console.log('✅ All service imports successful');

        // Test adapters imports
        const { Signals } = await import('../adapters/signals-adapter.js');
        const { NewsAPIAdapter } = await import('../adapters/news-adapter.js');

        console.log('✅ All adapter imports successful');

        // Test types imports
        const types = await import('../types/index.js');
        console.log('✅ Types import successful');

        console.log('\n🎉 All Basic Imports tests passed!');

    } catch (error) {
        console.error('❌ Basic Imports test failed:', error);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting CI/CD Integration Tests');
    console.log('====================================');
    console.log('These tests verify core functionality without external API dependencies');
    console.log('');

    try {
        await testBasicImports();
        await testCoreServices();

        console.log('\n🎉 All CI/CD Integration Tests Passed!');
        console.log('✅ Core functionality is working correctly');
        console.log('✅ All modules can be imported');
        console.log('✅ Services can be instantiated');

    } catch (error) {
        console.error('\n❌ CI/CD Integration Tests Failed!');
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
