/**
 * REAL TELEGRAM TEST
 * 
 * This test runs a complete trading cycle and captures Telegram messages
 * using the REAL formatting functions from TelegramAdapter.
 * 
 * KEY CHANGES MADE:
 * 1. Uses real NotificationsService instance instead of mocked one
 * 2. Only overrides sendMessage() to capture messages without sending
 * 3. All message formatting uses the actual NotificationsService methods:
 *    - postAgentAnalysis()
 *    - postAgentDebate() 
 *    - postSignalProcessing()
 *    - postConsensusResults()
 *    - postRoundCompletion()
 * 4. Captures both message text and message objects for analysis
 * 5. Saves detailed output files for testing and debugging
 * 
 * This ensures that test messages are identical to what would be sent
 * in production, using the same formatting logic and structure.
 */

import { HedgeFundOrchestrator } from '../orchestrator.js';
import { TelegramAdapter } from '../adapters/telegram-adapter.js';
import { NotificationsService } from '../services/notifications.service.js';
import { PostgresAdapter } from '../adapters/postgres-adapter.js';
import { BinanceAdapter } from '../adapters/binance-adapter.js';
import { NewsAPIAdapter } from '../adapters/news-adapter.js';
import { Signals } from '../adapters/signals-adapter.js';
import { AspisAdapter } from '../adapters/aspis-adapter.js';
import { AgentFactory } from '../agents/agent-factory.js';
import { SignalProcessorService } from '../services/signal-processor.service.js';
import { ConsensusService } from '../services/consensus.js';
import type { RiskService } from '../interfaces/adapters.js';
import { VaultController } from '../controllers/vault.controller.js';
import { OpenAIService } from '../services/openai.service.js';
import { DEFAULT_CONFIG } from '../config.js';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Real Telegram Test...');
console.log('================================================================================');
console.log('🧪 REAL TELEGRAM TEST SUITE');
console.log('================================================================================');
console.log('This test runs a real trading cycle and generates Telegram messages using real formatting functions.');

async function runRealTelegramTest() {
    try {
        // Initialize all adapters and services
        const config = DEFAULT_CONFIG;
        const factStore = new PostgresAdapter();
        const marketData = new BinanceAdapter();
        const news = new NewsAPIAdapter();
        const technicalIndicators = new Signals();
        const trading = new AspisAdapter();
        const telegram = new TelegramAdapter();
        const notifications = new NotificationsService(telegram);
        const agentFactory = new AgentFactory();

        // Mock LLM service
        const llmService = {
            runRole: async (role: string, context: any) => {
                const agent = await AgentFactory.createAgent(role as any);
                return await agent.run(context);
            },
            validateClaim: (claim: any) => true,
            connect: async () => { },
            disconnect: async () => { },
            isConnected: () => true
        };
        const signalProcessor = new SignalProcessorService();
        const consensus = new ConsensusService();
        const risk: RiskService = {
            checkLimits: async () => ({ ok: true, violations: [] }),
            getRiskMetrics: async () => ({
                totalExposure: 0,
                leverage: 1.0,
                volatility: 0.1,
                maxDrawdown: 0.05,
                var95: 0.02
            }),
            updateLimits: async () => { },
            triggerKillSwitch: async () => { },
            isKillSwitchActive: () => false
        };

        // Mock universe service
        const universeService = {
            getUniverse: async () => ['BTC', 'ETH'],
            getSymbolMapping: async () => null,
            getAllMappings: async () => [],
            updateMapping: async () => { },
            validateSymbol: async () => true,
            validateOrder: async () => ({ valid: true, errors: [] }),
            refreshUniverse: async () => { }
        };
        const vaultController = new VaultController(trading, marketData);

        // Capture messages using real NotificationsService formatting functions
        const capturedMessages: string[] = [];
        const capturedMessageObjects: any[] = [];

        // Override sendMessage to capture the actual message objects
        const originalSendMessage = telegram.sendMessage.bind(telegram);
        telegram.sendMessage = async (message: any) => {
            const messageText = typeof message === 'string' ? message : message.text || JSON.stringify(message);
            capturedMessages.push(messageText);
            capturedMessageObjects.push(message);

            console.log('📱 CAPTURED TELEGRAM MESSAGE:');
            console.log('────────────────────────────────────────────────────────────────');
            console.log(messageText);
            console.log('────────────────────────────────────────────────────────────────');
        };

        // Mock LLM service to capture agent responses
        const originalLLMService = llmService;
        const agentPrompts: any[] = [];
        const agentResponses: any[] = [];

        llmService.runRole = async (role: string, context: any) => {
            const agent = await AgentFactory.createAgent(role as any);

            // Capture the prompts before calling the agent
            const systemPrompt = (agent as any).buildSystemPrompt(context);
            const userPrompt = (agent as any).buildUserPrompt(context);

            agentPrompts.push({
                timestamp: new Date().toISOString(),
                role,
                context: {
                    universe: context.universe,
                    marketStats: context.marketStats?.length || 0,
                    facts: context.facts?.length || 0,
                    news: context.news?.length || 0,
                    sampleMarketStats: context.marketStats?.slice(0, 2) || [],
                    sampleFacts: context.facts?.slice(0, 2) || [],
                    sampleNews: context.news?.slice(0, 2) || []
                },
                prompts: {
                    systemPrompt,
                    userPrompt
                }
            });

            const response = await agent.run(context);

            // Capture agent response
            agentResponses.push({
                timestamp: new Date().toISOString(),
                role,
                context: {
                    universe: context.universe,
                    marketStats: context.marketStats?.length || 0,
                    facts: context.facts?.length || 0,
                    news: context.news?.length || 0
                },
                response: {
                    claims: response.claims,
                    textPart: response.textPart,
                    jsonPart: response.jsonPart,
                    openaiResponse: response.openaiResponse
                }
            });

            return response;
        };

        // Create orchestrator with real Telegram adapter (but mocked sendMessage)
        // Create OpenAI service
        const openaiService = new OpenAIService();

        const orchestrator = new HedgeFundOrchestrator(
            config,
            marketData,
            trading,
            news,
            factStore,
            universeService,
            llmService,
            risk,
            technicalIndicators,
            openaiService,
            telegram
        );

        console.log('🧪 Running real trading cycle...');

        // Run the actual trading pipeline
        await orchestrator.executeTradingPipeline();

        console.log('✅ Real trading cycle completed!');
        console.log(`📱 Captured ${capturedMessages.length} Telegram messages`);

        // Save messages to file
        const outputDir = path.join(process.cwd(), 'test-outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputFile = path.join(outputDir, `telegram-messages-${timestamp}.txt`);

        let fileContent = `🧪 REAL TELEGRAM TEST RESULTS\n`;
        fileContent += `================================================================================\n`;
        fileContent += `Test Date: ${new Date().toLocaleString()}\n`;
        fileContent += `Total Messages: ${capturedMessages.length}\n`;
        fileContent += `Note: These messages use REAL NotificationsService formatting functions\n`;
        fileContent += `================================================================================\n\n`;

        capturedMessages.forEach((message, index) => {
            fileContent += `📱 MESSAGE ${index + 1}:\n`;
            fileContent += `────────────────────────────────────────────────────────────────\n`;
            fileContent += `${message}\n`;
            fileContent += `────────────────────────────────────────────────────────────────\n\n`;
        });

        // Add summary
        fileContent += `📊 MESSAGE SUMMARY:\n`;
        fileContent += `================================================================================\n`;
        capturedMessages.forEach((message, index) => {
            const lines = message.split('\n');
            const firstLine = lines[0] || 'No title';
            fileContent += `${index + 1}. ${firstLine.substring(0, 80)}...\n`;
        });

        fs.writeFileSync(outputFile, fileContent, 'utf8');
        console.log(`💾 Messages saved to: ${outputFile}`);

        // Also save a simplified version with just the key information
        const simplifiedFile = path.join(outputDir, `telegram-summary-${timestamp}.txt`);
        let simplifiedContent = `🧪 TELEGRAM MESSAGES SUMMARY\n`;
        simplifiedContent += `================================================================================\n`;
        simplifiedContent += `Test Date: ${new Date().toLocaleString()}\n`;
        simplifiedContent += `Total Messages: ${capturedMessages.length}\n`;
        simplifiedContent += `Note: Using REAL NotificationsService formatting functions\n`;
        simplifiedContent += `================================================================================\n\n`;

        capturedMessages.forEach((message, index) => {
            const lines = message.split('\n');
            const title = lines.find(line => line.includes('<b>') && line.includes('</b>')) || lines[0] || 'No title';
            simplifiedContent += `${index + 1}. ${title.replace(/<[^>]*>/g, '')}\n`;

            // Extract key information
            const confidenceMatch = message.match(/Confidence:\s*([^%\n]+)%/);
            const recommendationMatch = message.match(/Recommendation:\s*([^\n]+)/);
            const sentimentMatch = message.match(/Market Sentiment:\s*([^\n]+)/);

            if (confidenceMatch) simplifiedContent += `   Confidence: ${confidenceMatch[1]}%\n`;
            if (recommendationMatch) simplifiedContent += `   Recommendation: ${recommendationMatch[1]}\n`;
            if (sentimentMatch) simplifiedContent += `   Sentiment: ${sentimentMatch[1]}\n`;

            simplifiedContent += '\n';
        });

        fs.writeFileSync(simplifiedFile, simplifiedContent, 'utf8');
        console.log(`💾 Summary saved to: ${simplifiedFile}`);

        // Save agent prompts to JSON file
        const agentPromptsFile = path.join(outputDir, `agent-prompts-${timestamp}.json`);
        const agentPromptsContent = {
            testDate: new Date().toLocaleString(),
            totalAgents: agentPrompts.length,
            prompts: agentPrompts
        };
        fs.writeFileSync(agentPromptsFile, JSON.stringify(agentPromptsContent, null, 2), 'utf8');
        console.log(`💾 Agent prompts saved to: ${agentPromptsFile}`);

        // Save agent responses to JSON file
        const agentResponsesFile = path.join(outputDir, `agent-responses-${timestamp}.json`);
        const agentResponsesContent = {
            testDate: new Date().toLocaleString(),
            totalAgents: agentResponses.length,
            responses: agentResponses
        };
        fs.writeFileSync(agentResponsesFile, JSON.stringify(agentResponsesContent, null, 2), 'utf8');
        console.log(`💾 Agent responses saved to: ${agentResponsesFile}`);

        // Save complete agent chain (prompts + responses) to JSON file
        const agentChainFile = path.join(outputDir, `agent-chain-${timestamp}.json`);
        const agentChainContent = {
            testDate: new Date().toLocaleString(),
            totalAgents: agentPrompts.length,
            chain: agentPrompts.map((prompt, index) => ({
                agent: prompt.role,
                timestamp: prompt.timestamp,
                prompt: prompt,
                response: agentResponses[index] || null
            }))
        };
        fs.writeFileSync(agentChainFile, JSON.stringify(agentChainContent, null, 2), 'utf8');
        console.log(`💾 Complete agent chain saved to: ${agentChainFile}`);

        // Save captured message objects to JSON file
        const messageObjectsFile = path.join(outputDir, `telegram-message-objects-${timestamp}.json`);
        const messageObjectsContent = {
            testDate: new Date().toLocaleString(),
            totalMessages: capturedMessageObjects.length,
            messages: capturedMessageObjects.map((msg, index) => ({
                index: index + 1,
                message: msg,
                text: capturedMessages[index]
            }))
        };
        fs.writeFileSync(messageObjectsFile, JSON.stringify(messageObjectsContent, null, 2), 'utf8');
        console.log(`💾 Message objects saved to: ${messageObjectsFile}`);

        // Summary of captured messages
        console.log('\n📊 MESSAGE SUMMARY:');
        console.log('================================================================================');
        capturedMessages.forEach((message, index) => {
            const lines = message.split('\n');
            const firstLine = lines[0] || 'No title';
            console.log(`${index + 1}. ${firstLine.substring(0, 80)}...`);
        });

    } catch (error) {
        console.error('❌ Error in real telegram test:', error);
        throw error;
    }
}

// Run the test
runRealTelegramTest()
    .then(() => {
        console.log('\n✅ Real Telegram test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Real Telegram test failed:', error);
        process.exit(1);
    });
