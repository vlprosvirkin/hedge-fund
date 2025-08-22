import { HedgeFundOrchestrator } from './orchestrator.js';
import { BinanceAdapter } from './adapters/binance-adapter.js';
import { AspisAdapter } from './adapters/aspis-adapter.js';
import { NewsAPIAdapter } from './adapters/news-adapter.js';
import { AgentsService } from './services/agents.js';
import type { SystemConfig } from './types/index.js';
import { validateAPIConfig, getConfigSummary, loadConfig } from './config.js';
import { v4 as uuidv4 } from 'uuid';

// Mock implementations for missing services
class MockNewsAdapter {
  async connect() { console.log('Mock News connected'); }
  async disconnect() { console.log('Mock News disconnected'); }
  isConnected() { return true; }

  async search() {
    return [
      {
        id: uuidv4(),
        title: 'Bitcoin reaches new highs as institutional adoption grows',
        url: 'https://example.com/bitcoin-news',
        source: 'coindesk.com',
        publishedAt: Date.now() - 3600000,
        sentiment: 0.8
      },
      {
        id: uuidv4(),
        title: 'Ethereum 2.0 upgrade shows promising results',
        url: 'https://example.com/ethereum-news',
        source: 'cointelegraph.com',
        publishedAt: Date.now() - 1800000,
        sentiment: 0.7
      }
    ];
  }

  async getByIds() { return []; }
  async getLatest() { return []; }
}

class MockFactStore {
  private news = new Map();
  private evidence = new Map();

  async putNews(newsItems: any[]) {
    newsItems.forEach(item => this.news.set(item.id, item));
  }

  async putEvidence(evidenceItems: any[]) {
    evidenceItems.forEach(item => this.evidence.set(item.id, item));
  }

  async findEvidence() {
    return [
      {
        id: uuidv4(),
        ticker: 'BTC',
        newsItemId: uuidv4(),
        relevance: 0.9,
        timestamp: Date.now() - 3600000,
        source: 'coindesk.com',
        quote: 'Bitcoin institutional adoption accelerating'
      }
    ];
  }

  validateEvidence() { return true; }
  async getNewsByIds() { return []; }
  async cleanup() { }
}

class MockUniverseService {
  async getUniverse() {
    return ['BTC', 'ETH', 'ADA', 'DOT', 'LINK'];
  }

  async getSymbolMapping() { return null; }
  async getAllMappings() { return []; }
  async updateMapping() { }
  async validateSymbol() { return true; }
  async validateOrder() { return { valid: true, errors: [] }; }
  async refreshUniverse() { }
}

class MockRiskService {
  async checkLimits() {
    return { ok: true, violations: [] };
  }

  async getRiskMetrics() {
    return {
      totalExposure: 100000,
      leverage: 1.0,
      volatility: 0.15,
      maxDrawdown: 0.05,
      var95: 0.02
    };
  }

  async updateLimits() { }
  async triggerKillSwitch() { }
  isKillSwitchActive() { return false; }
}

async function runMockPipeline() {
  console.log('🚀 Starting Hedge Fund MVP Mock Pipeline');
  console.log('==========================================\n');

  // Validate configuration
  console.log('🔧 Validating configuration...');
  const apiValidation = validateAPIConfig();
  const configSummary = getConfigSummary();

  console.log('📋 Configuration Summary:');
  console.log(JSON.stringify(configSummary, null, 2));

  if (apiValidation.warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:');
    apiValidation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  // Load configuration from environment
  const config: SystemConfig = {
    ...loadConfig(),
    debateInterval: 30, // Override for demo (30 seconds instead of 1 hour)
    mockMode: true // Force mock mode for this demo
  };

  console.log(`\n✅ Running in ${config.mockMode ? 'MOCK' : 'PRODUCTION'} mode`);
  console.log(`📊 Risk Profile: ${config.riskProfile}`);
  console.log(`💼 Max Positions: ${config.maxPositions}\n`);

  // Initialize adapters and services
  const marketData = new BinanceAdapter();
  const trading = new AspisAdapter(); // Will automatically use mock mode (no API key)
  const news = new NewsAPIAdapter(); // Real News API adapter
  const factStore = new MockFactStore() as any;
  const universe = new MockUniverseService() as any;
  const agents = new AgentsService(); // Will use config API key
  const risk = new MockRiskService() as any;

  // Create orchestrator
  const orchestrator = new HedgeFundOrchestrator(
    config,
    marketData,
    trading,
    news,
    factStore,
    universe,
    agents,
    risk
  );

  try {
    // Start the orchestrator
    console.log('📊 Initializing trading system...');
    await orchestrator.start();

    // Let it run for a few rounds
    console.log('⏰ Running for 2 minutes to demonstrate pipeline...');
    await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes

    // Stop gracefully
    console.log('\n🛑 Stopping trading system...');
    await orchestrator.stop();

    console.log('\n✅ Mock pipeline completed successfully!');
    console.log('\n📈 What happened:');
    console.log('1. System connected to all services (mock)');
    console.log('2. Generated trading universe (BTC, ETH, ADA, DOT, LINK)');
    console.log('3. Fetched market data and news');
    console.log('4. AI agents analyzed data and generated claims');
    console.log('5. Claims were verified for validity');
    console.log('6. Consensus was built across agent opinions');
    console.log('7. Target portfolio weights were calculated');
    console.log('8. Risk checks were performed');
    console.log('9. Mock orders were placed (if risk passed)');
    console.log('10. Process repeated every 30 seconds');

  } catch (error) {
    console.error('❌ Error in mock pipeline:', error);
    await orchestrator.emergencyStop();
  }
}

// Run the mock pipeline
if (import.meta.url === `file://${process.argv[1]}`) {
  runMockPipeline().catch(console.error);
}

export { runMockPipeline };
