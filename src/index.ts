#!/usr/bin/env node

import { HedgeFundOrchestrator } from './orchestrator.js';
import { BinanceAdapter } from './adapters/binance-adapter.js';
import { AspisAdapter } from './adapters/aspis-adapter.js';
import { AgentsService } from './services/agents.js';
import type { SystemConfig } from './types/index.js';
import { runMockPipeline } from './mock-pipeline.js';
import dotenv from 'dotenv';
import pino from 'pino';

// Load environment variables
dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  logger.info('🚀 Hedge Fund MVP Starting...');

  switch (command) {
    case 'mock':
      logger.info('Running mock pipeline...');
      await runMockPipeline();
      break;

    case 'start':
      logger.info('Starting production trading system...');
      await startProductionSystem();
      break;

    case 'test':
      logger.info('Running tests...');
      // TODO: Add test runner
      break;

    default:
      // If no command specified, start production system by default
      logger.info('No command specified, starting production system...');
      await startProductionSystem();
      break;
  }
}

async function startProductionSystem() {
  try {
    logger.info('Starting production trading system...');

    // Import config
    const { SYSTEM_CONFIG } = await import('./config.js');

    // Import adapters
    const { BinanceAdapter } = await import('./adapters/binance-adapter.js');
    const { AspisAdapter } = await import('./adapters/aspis-adapter.js');
    const { NewsAPIAdapter } = await import('./adapters/news-adapter.js');
    const { PostgresAdapter } = await import('./adapters/postgres-adapter.js');
    const { AgentsService } = await import('./services/agents.js');

    // Create adapters
    const marketData = new BinanceAdapter();
    const trading = new AspisAdapter(); // Uses config values automatically
    const news = new NewsAPIAdapter();
    const factStore = new PostgresAdapter();
    const agents = new AgentsService();

    // Create orchestrator
    const orchestrator = new HedgeFundOrchestrator(
      SYSTEM_CONFIG,
      marketData,
      trading,
      news,
      factStore,
      {
        getUniverse: () => Promise.resolve(['BTC', 'ETH']),
        getSymbolMapping: () => Promise.resolve(null),
        getAllMappings: () => Promise.resolve([]),
        updateMapping: () => Promise.resolve(),
        validateSymbol: () => Promise.resolve(true),
        validateOrder: () => Promise.resolve({ valid: true, errors: [] }),
        refreshUniverse: () => Promise.resolve()
      }, // mock universe service
      agents,
      {
        checkLimits: () => Promise.resolve({ ok: true, violations: [] }),
        getRiskMetrics: () => Promise.resolve({ totalExposure: 0, leverage: 1, volatility: 0, maxDrawdown: 0, var95: 0 }),
        updateLimits: () => Promise.resolve(),
        triggerKillSwitch: () => Promise.resolve(),
        isKillSwitchActive: () => false
      }, // mock risk service
    );

    logger.info('✅ Orchestrator created successfully');

    // Start the orchestrator
    await orchestrator.start();

    logger.info('🚀 Trading system started successfully');

    // Keep the process running
    process.on('SIGINT', async () => {
      logger.info('Shutting down trading system...');
      await orchestrator.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start production system:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}
