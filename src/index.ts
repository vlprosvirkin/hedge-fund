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
      console.log(`
🤖 Hedge Fund MVP - Crypto Trading System

Usage:
  npm run mock     - Run mock pipeline for testing
  npm start        - Start production trading system
  npm test         - Run tests

Environment Variables:
  BINANCE_API_KEY     - Binance API key
  BINANCE_SECRET_KEY  - Binance secret key
  ASPIS_API_KEY       - Aspis API key
  ASPIS_API_KEY       - Aspis API key
  OPENAI_API_KEY      - OpenAI API key for LLM agents
  LOG_LEVEL           - Logging level (debug, info, warn, error)

Configuration:
  Edit src/config.ts to modify trading parameters
      `);
      break;
  }
}

async function startProductionSystem() {
  // TODO: Implement production system with real adapters
  logger.warn('Production system not yet implemented');
  logger.info('Use "npm run mock" to test the system');
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
