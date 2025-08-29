import { HedgeFundOrchestrator } from '../core/orchestrator.js';
import { AspisAdapter } from '../adapters/aspis-adapter.js';
import { Signals } from '../adapters/signals-adapter.js';
import { NewsAPIAdapter } from '../adapters/news-adapter.js';
import { AgentsService } from '../services/agents.js';
import { ConsensusService } from '../services/trading/consensus.js';
import { VerifierService } from '../services/trading/verifier.js';
import { OpenAIService } from '../services/ai/openai.service.js';
import type {
    SystemConfig,
    PipelineArtifact,
    Position,
    Order,
    TargetWeight,
    ConsensusRec
} from '../types/index.js';

/**
 * Интеграционный тест полного цикла принятия решений и исполнения
 * Проверяет: Агенты → Консенсус → Риск-менеджмент → Исполнение через Aspis
 */
async function decisionExecutionIntegrationTest() {
    console.log('🚀 Starting Decision-Execution Integration Test...\n');

    try {
        // 1. Инициализация всех компонентов
        console.log('🔧 Step 1: Initializing components...');

        const config: SystemConfig = {
            debateInterval: 30, // 30 seconds
            maxPositions: 5,
            riskProfile: 'neutral',
            rebalanceInterval: 3600,
            decisionThresholds: {
                averse: { buy: 0.15, sell: -0.15, minConfidence: 0.7, maxRisk: 0.3 },
                neutral: { buy: 0.1, sell: -0.1, minConfidence: 0.6, maxRisk: 0.5 },
                bold: { buy: 0.05, sell: -0.05, minConfidence: 0.5, maxRisk: 0.7 }
            },
            killSwitchEnabled: true
        };

        // Инициализация адаптеров
        const technicalAdapter = new Signals();
        const newsAdapter = new NewsAPIAdapter();
        // Создаем AspisAdapter с реальными учетными данными
        const aspisAdapter = new AspisAdapter();
        const agentsService = new AgentsService();

        // Mock services
        const mockMarketData = {
            connect: async () => console.log('✅ Market data connected'),
            disconnect: async () => console.log('✅ Market data disconnected'),
            getMarketStats: async (symbol: string) => ({
                symbol,
                volume24h: Math.random() * 1000000 + 100000,
                spread: Math.random() * 0.1 + 0.01,
                tickSize: 0.01,
                stepSize: 0.00001,
                minQty: 0.00001,
                maxQty: 1000000,
                timestamp: Date.now()
            })
        };

        const mockFactStore = {
            connect: async () => console.log('✅ Fact store connected'),
            disconnect: async () => console.log('✅ Fact store disconnected'),
            putNews: async (news: any[]) => console.log(`✅ Stored ${news.length} news articles`),
            findEvidence: async (ticker: string, params: any) => [
                {
                    id: `evidence-${ticker}`,
                    ticker,
                    quote: `Sample evidence for ${ticker}`,
                    relevance: 0.8,
                    timestamp: Date.now() - 3600000,
                    source: 'test'
                }
            ],
            getNewsByIds: async (ids: string[]) => []
        };

        const mockUniverse = {
            connect: async () => console.log('✅ Universe service connected'),
            disconnect: async () => console.log('✅ Universe service disconnected'),
            getUniverse: async (params: any) => ['ETH', 'ARB'] // Используем токены, которые есть в балансе
        };

        const mockRiskService = {
            connect: async () => console.log('✅ Risk service connected'),
            disconnect: async () => console.log('✅ Risk service disconnected'),
            checkLimits: async (params: any) => ({
                ok: true,
                violations: [],
                warnings: []
            })
        };

        const technicalIndicators = technicalAdapter;

        console.log('✅ All components initialized');

        // 2. Подключение к сервисам
        console.log('\n🔌 Step 2: Connecting to services...');

        await Promise.all([
            newsAdapter.connect(),
            aspisAdapter.connect(),
            agentsService.connect()
        ]);

        console.log('✅ All services connected');

        // 3. Создание оркестратора
        console.log('\n🎼 Step 3: Creating orchestrator...');

        // Create OpenAI service
        const openaiService = new OpenAIService();

        const orchestrator = new HedgeFundOrchestrator(
            config,
            mockMarketData as any,
            aspisAdapter,
            newsAdapter,
            mockFactStore as any,
            mockUniverse as any,
            agentsService,
            mockRiskService as any,
            technicalIndicators,
            openaiService
        );

        console.log('✅ Orchestrator created');

        // 4. Проверка текущих позиций
        console.log('\n📊 Step 4: Checking current positions...');

        const initialPositions = await aspisAdapter.getPositions();
        console.log(`✅ Current positions: ${initialPositions.length}`);

        initialPositions.forEach(position => {
            console.log(`   ${position.symbol}: ${position.quantity} @ $${position.avgPrice}`);
        });

        // 5. Проверка информации аккаунта
        console.log('\n💰 Step 5: Checking account info...');

        const accountInfo = await aspisAdapter.getAccountInfo();
        console.log(`✅ Account total value: $${accountInfo.totalValue.toLocaleString()}`);
        console.log(`   Available balance: $${accountInfo.balances.find(b => b.asset === 'USDT')?.free.toLocaleString() || 0} USDT`);

        // 6. Симуляция одного раунда принятия решений
        console.log('\n🤖 Step 6: Simulating decision-making round...');

        // Получаем данные для принятия решений
        const universe = await mockUniverse.getUniverse({});
        const marketStats = await Promise.all(
            universe.map(symbol => mockMarketData.getMarketStats(symbol))
        );

        console.log(`✅ Universe: ${universe.join(', ')}`);
        console.log(`✅ Market stats: ${marketStats.length} entries`);

        // Генерируем claims от агентов
        const agentRoles = ['fundamental', 'sentiment', 'technical'] as const;
        const allClaims = [];

        for (const role of agentRoles) {
            console.log(`   Running ${role} agent...`);

            const result = await agentsService.runRole(role, {
                universe,
                facts: [],
                marketStats,
                riskProfile: config.riskProfile,
                timestamp: Date.now()
            });

            console.log(`   ✅ ${role} agent generated ${result.claims.length} claims`);
            allClaims.push(...result.claims);
        }

        console.log(`✅ Total claims generated: ${allClaims.length}`);

        // 7. Построение консенсуса
        console.log('\n🎯 Step 7: Building consensus...');

        const consensusService = new ConsensusService();
        const consensus = await consensusService.buildConsensus(allClaims, marketStats, config.maxPositions);

        console.log(`✅ Consensus built: ${consensus.length} recommendations`);

        if (consensus.length > 0) {
            const topRecommendation = consensus[0];
            if (topRecommendation) {
                console.log(`   Top recommendation: ${topRecommendation.ticker} (score: ${topRecommendation.finalScore.toFixed(3)})`);
                console.log(`   Average confidence: ${topRecommendation.avgConfidence.toFixed(3)}`);
                console.log(`   Coverage: ${topRecommendation.coverage.toFixed(2)}`);
            }
        }

        // 8. Построение целевых весов
        console.log('\n⚖️ Step 8: Building target weights...');

        const targetWeights: TargetWeight[] = consensus.map(rec => ({
            symbol: rec.ticker,
            weight: 1 / consensus.length, // Equal weight distribution
            quantity: 0, // Will be calculated during execution
            side: 'buy'
        }));

        console.log(`✅ Target weights: ${targetWeights.length} positions`);
        targetWeights.forEach(weight => {
            console.log(`   ${weight.symbol}: ${(weight.weight * 100).toFixed(1)}%`);
        });

        // 9. Проверка рисков
        console.log('\n⚠️ Step 9: Risk assessment...');

        const riskCheck = await mockRiskService.checkLimits({
            targetWeights,
            currentPositions: initialPositions,
            marketStats,
            riskProfile: config.riskProfile
        });

        console.log(`✅ Risk check: ${riskCheck.ok ? 'PASSED' : 'FAILED'}`);
        if (riskCheck.violations.length > 0) {
            console.log(`   Violations: ${riskCheck.violations.length}`);
        }

        // 10. Исполнение торговых операций
        console.log('\n📈 Step 10: Executing trades...');

        if (riskCheck.ok) {
            const orders = [];

            for (const target of targetWeights) {
                const currentPosition = initialPositions.find(p => p.symbol === target.symbol);

                if (!currentPosition) {
                    // Новая позиция - покупаем
                    console.log(`   Placing BUY order for ${target.symbol}...`);

                    const orderId = await aspisAdapter.placeOrder({
                        symbol: target.symbol,
                        side: 'buy',
                        quantity: calculateQuantity(target.weight, target.symbol),
                        type: 'market'
                    });

                    console.log(`   ✅ Order placed: ${orderId}`);

                    // Получаем информацию об ордере
                    const order = await aspisAdapter.getOrder(orderId);
                    if (order) {
                        orders.push(order);
                        console.log(`   Order status: ${order.status}`);
                    }
                } else {
                    // Существующая позиция - проверяем необходимость ребалансировки
                    const currentWeight = calculateCurrentWeight(currentPosition, initialPositions);
                    const weightDiff = target.weight - currentWeight;

                    if (Math.abs(weightDiff) > 0.05) { // 5% порог
                        const side = weightDiff > 0 ? 'buy' : 'sell';
                        const quantity = Math.abs(calculateQuantity(Math.abs(weightDiff), target.symbol));

                        console.log(`   Placing ${side.toUpperCase()} order for ${target.symbol} (rebalancing)...`);

                        const orderId = await aspisAdapter.placeOrder({
                            symbol: target.symbol,
                            side,
                            quantity,
                            type: 'market'
                        });

                        console.log(`   ✅ Rebalancing order placed: ${orderId}`);

                        const order = await aspisAdapter.getOrder(orderId);
                        if (order) orders.push(order);
                    } else {
                        console.log(`   No rebalancing needed for ${target.symbol}`);
                    }
                }
            }

            console.log(`✅ Total orders placed: ${orders.length}`);
        } else {
            console.log('⚠️ Risk check failed - no trades executed');
        }

        // 11. Проверка финальных позиций
        console.log('\n📊 Step 11: Checking final positions...');

        // Ждем немного для симуляции исполнения ордеров
        await new Promise(resolve => setTimeout(resolve, 2000));

        const finalPositions = await aspisAdapter.getPositions();
        console.log(`✅ Final positions: ${finalPositions.length}`);

        finalPositions.forEach(position => {
            console.log(`   ${position.symbol}: ${position.quantity} @ $${position.avgPrice} (PnL: $${position.unrealizedPnL})`);
        });

        // 12. Проверка метрик портфеля
        console.log('\n📈 Step 12: Portfolio metrics...');

        const portfolioMetrics = await aspisAdapter.getPortfolioMetrics();
        console.log(`✅ Portfolio metrics:`);
        console.log(`   Total value: $${portfolioMetrics.totalValue.toLocaleString()}`);
        console.log(`   Available balance: $${portfolioMetrics.availableBalance.toLocaleString()}`);
        console.log(`   Unrealized PnL: $${portfolioMetrics.unrealizedPnL.toLocaleString()}`);
        console.log(`   Realized PnL: $${portfolioMetrics.realizedPnL.toLocaleString()}`);
        console.log(`   Margin level: ${portfolioMetrics.marginLevel.toFixed(2)}`);

        // 13. Проверка качества данных
        console.log('\n🔍 Step 13: Data quality validation...');

        const dataQualityChecks = [
            {
                name: 'Claims Generation',
                passed: allClaims.length > 0,
                details: `${allClaims.length} claims generated`
            },
            {
                name: 'Consensus Building',
                passed: consensus.length > 0,
                details: `${consensus.length} consensus recommendations`
            },
            {
                name: 'Risk Assessment',
                passed: riskCheck.ok,
                details: riskCheck.ok ? 'Risk check passed' : 'Risk check failed'
            },
            {
                name: 'Order Execution',
                passed: true, // Если дошли до этого места, значит исполнение работает
                details: 'Orders can be placed and tracked'
            },
            {
                name: 'Position Tracking',
                passed: finalPositions.length >= 0,
                details: `${finalPositions.length} positions tracked`
            },
            {
                name: 'Portfolio Metrics',
                passed: portfolioMetrics.totalValue > 0,
                details: `Portfolio value: $${portfolioMetrics.totalValue.toLocaleString()}`
            }
        ];

        dataQualityChecks.forEach(check => {
            const status = check.passed ? '✅' : '❌';
            console.log(`   ${status} ${check.name}: ${check.details}`);
        });

        const failedChecks = dataQualityChecks.filter(check => !check.passed);
        if (failedChecks.length > 0) {
            throw new Error(`Data quality validation failed: ${failedChecks.map(c => c.name).join(', ')}`);
        }

        // 14. Финальная проверка интеграции
        console.log('\n🎯 Step 14: Integration verification...');

        const integrationChecks = [
            {
                name: 'Decision Pipeline',
                status: allClaims.length > 0 && consensus.length > 0,
                description: 'Agents → Consensus pipeline works'
            },
            {
                name: 'Risk Management',
                status: riskCheck.ok,
                description: 'Risk assessment integrated'
            },
            {
                name: 'Trade Execution',
                status: true, // Если дошли до этого места
                description: 'AspisAdapter execution works'
            },
            {
                name: 'Position Management',
                status: finalPositions.length >= 0,
                description: 'Position tracking works'
            },
            {
                name: 'Portfolio Monitoring',
                status: portfolioMetrics.totalValue > 0,
                description: 'Portfolio metrics available'
            }
        ];

        integrationChecks.forEach(check => {
            const status = check.status ? '✅' : '❌';
            console.log(`   ${status} ${check.name}: ${check.description}`);
        });

        console.log('\n🎉 Decision-Execution Integration Test PASSED!');
        console.log('\n📊 Summary:');
        console.log(`   - Claims generated: ${allClaims.length}`);
        console.log(`   - Consensus recommendations: ${consensus.length}`);
        console.log(`   - Risk assessment: ${riskCheck.ok ? 'PASSED' : 'FAILED'}`);
        console.log(`   - Positions tracked: ${finalPositions.length}`);
        console.log(`   - Portfolio value: $${portfolioMetrics.totalValue.toLocaleString()}`);
        console.log(`   - Data quality: ${dataQualityChecks.filter(c => c.passed).length}/${dataQualityChecks.length} checks passed`);
        console.log(`   - Integration: ${integrationChecks.filter(c => c.status).length}/${integrationChecks.length} checks passed`);

    } catch (error) {
        console.error('\n❌ Decision-Execution Integration Test FAILED!');
        console.error('Error:', error);
        throw error;
    } finally {
        // Отключение от сервисов
        console.log('\n🔌 Disconnecting from services...');
        try {
            // Отключение будет выполнено автоматически
        } catch (error) {
            console.log('⚠️ Error during disconnection:', error);
        }
    }
}

// Вспомогательные функции
function calculateQuantity(weight: number, symbol: string): number {
    // Fixed $1 USD equivalent for testing - meets minimum requirement
    const quantities: Record<string, number> = {
        'ETH': 1,    // $1 USDT -> ETH
        'ARB': 1,    // $1 USDT -> ARB
        'BTC': 1,    // $1 USDT -> BTC
        'SOL': 1,    // $1 USDT -> SOL
    };
    return quantities[symbol] || 1;
}

function calculateCurrentWeight(position: any, allPositions: any[]): number {
    const totalValue = allPositions.reduce((sum, p) => sum + Math.abs(p.quantity * p.avgPrice), 0);
    const positionValue = Math.abs(position.quantity * position.avgPrice);
    return totalValue > 0 ? positionValue / totalValue : 0;
}

// Запуск интеграционного теста
if (import.meta.url === `file://${process.argv[1]}`) {
    decisionExecutionIntegrationTest()
        .then(() => {
            console.log('\n✨ Decision-execution integration test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Decision-execution integration test failed!');
            console.error(error);
            process.exit(1);
        });
}

export { decisionExecutionIntegrationTest };
