import type { Claim, ConsensusRec, Position, Order, Evidence, NewsItem } from '../types/index.js';

export interface AgentConfig {
    emoji: string;
    name: string;
    color: string;
    expertise: string;
    personality: string;
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
    fundamental: {
        emoji: '📊',
        name: 'FUNDAMENTAL ANALYST',
        color: '🔵',
        expertise: 'Analysis of financial indicators, trading volumes, liquidity',
        personality: 'Conservative analyst, relies on data and facts'
    },
    sentiment: {
        emoji: '📰',
        name: 'SENTIMENT ANALYST',
        color: '🟡',
        expertise: 'News analysis, social media, market psychology',
        personality: 'Emotional analyst, feels market sentiment'
    },
    valuation: {
        emoji: '📈',
        name: 'TECHNICAL ANALYST',
        color: '🟢',
        expertise: 'Technical indicators, chart patterns, price action',
        personality: 'Pragmatic analyst, trusts technical signals'
    }
};

export class NotificationFormats {
    /**
     * Формат начала раунда
     */
    static roundStart(roundId: string, universe: string[]): string {
        return `🚀 <b>TRADING ROUND STARTED</b>\n\n` +
            `🆔 Round: <code>${roundId}</code>\n` +
            `🎯 Universe: ${universe.length} assets\n` +
            `🤖 3 AI agents ready for analysis\n\n` +
            `<i>Starting multi-agent discussion...</i>`;
    }

    /**
     * Comprehensive agent analysis with detailed claims
     */
    static agentAnalysis(
        roundId: string,
        agentRole: string,
        analysis: string,
        claims: Claim[],
        processingTime: number,
        evidenceMap?: Map<string, Evidence>
    ): string {
        const config = AGENT_CONFIGS[agentRole] || {
            emoji: '🤖',
            name: 'AI AGENT',
            color: '⚪',
            expertise: 'General analysis',
            personality: 'Universal analyst'
        };

        let text = `${config.emoji} <b>${config.name}</b>\n`;
        text += `${config.color} <i>${config.personality}</i>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `⏱️ Analysis: ${processingTime}ms\n\n`;

        // Show structured analysis breakdown
        if (claims.length > 0) {
            text += `📊 <b>ANALYSIS BREAKDOWN:</b>\n\n`;

            claims.forEach((claim, i) => {
                const action = claim.claim.includes('BUY') ? '🚀' : claim.claim.includes('SELL') ? '📉' : '⏸️';
                const ticker = claim.ticker === 'UNKNOWN' ? 'PARSE_ERROR' : claim.ticker;

                text += `${i + 1}. ${action} <b>${ticker}</b>: ${claim.claim}\n`;
                text += `   💪 Confidence: ${(claim.confidence * 100).toFixed(1)}%\n`;

                // Show direction and magnitude if available
                if (claim.direction) {
                    const directionEmoji = claim.direction === 'bullish' ? '📈' : claim.direction === 'bearish' ? '📉' : '➡️';
                    text += `   ${directionEmoji} Direction: ${claim.direction.toUpperCase()}\n`;
                }

                if (claim.magnitude !== undefined) {
                    const magnitudeEmoji = Math.abs(claim.magnitude) > 0.5 ? '🔥' : Math.abs(claim.magnitude) > 0.2 ? '⚡' : '💤';
                    text += `   ${magnitudeEmoji} Magnitude: ${(claim.magnitude * 100).toFixed(1)}%\n`;
                }

                // Show rationale if available
                if (claim.rationale) {
                    text += `   💭 <b>Reasoning:</b> ${claim.rationale}\n`;
                }

                // Show signals/indicators
                if (claim.signals && claim.signals.length > 0) {
                    text += `   📈 <b>Key Indicators:</b>\n`;
                    claim.signals.forEach(signal => {
                        const value = typeof signal.value === 'number' ? signal.value.toFixed(3) : signal.value;
                        text += `      • ${signal.name}: ${value}\n`;
                    });
                }

                // Show risk assessment
                if (claim.riskFlags && claim.riskFlags.length > 0) {
                    text += `   ⚠️ <b>Risk Factors:</b> ${claim.riskFlags.join(', ')}\n`;
                }

                // Show evidence sources
                if (claim.evidence && claim.evidence.length > 0) {
                    text += `   🔍 <b>Evidence Sources:</b> ${claim.evidence.length} items\n`;

                    // Show evidence details if available
                    if (claim.evidence && claim.evidence.length > 0) {
                        claim.evidence.forEach((evidence, j) => {
                            if (typeof evidence === 'string') {
                                text += `      ${j + 1}. 📄 ${evidence}\n`;
                            } else {
                                const source = evidence.source || 'Unknown';
                                let details = 'No details';

                                if (evidence.kind === 'news') {
                                    details = evidence.snippet || evidence.url || 'No details';
                                } else if (evidence.kind === 'market' || evidence.kind === 'tech') {
                                    details = evidence.metric || 'No details';
                                }

                                text += `      ${j + 1}. 📄 ${source}: ${details}\n`;
                                text += `         📊 Relevance: ${(evidence.relevance * 100).toFixed(1)}%\n`;
                                if (evidence.impact !== undefined) {
                                    const impactEmoji = evidence.impact > 0 ? '📈' : evidence.impact < 0 ? '📉' : '➡️';
                                    text += `         ${impactEmoji} Impact: ${(evidence.impact * 100).toFixed(1)}%\n`;
                                }
                                if (evidence.confidence !== undefined) {
                                    text += `         💪 Confidence: ${(evidence.confidence * 100).toFixed(1)}%\n`;
                                }
                            }
                        });
                    }
                }

                text += '\n';
            });
        }

        // Show full analysis insights
        if (analysis && analysis.trim().length > 0) {
            text += `🧠 <b>FULL ANALYSIS:</b>\n`;
            text += `<i>"${analysis}"</i>\n\n`;
        }

        return text;
    }

    /**
 * Complete agent analysis in one message
 */
    static agentCompleteAnalysis(
        roundId: string,
        agentRole: string,
        claims: Claim[],
        analysis: string,
        evidenceMap?: Map<string, Evidence>,
        context?: any
    ): string {
        const config = AGENT_CONFIGS[agentRole] || {
            emoji: '🤖',
            name: 'AI AGENT',
            color: '⚪',
            expertise: 'General analysis',
            personality: 'Universal analyst'
        };

        let text = `${config.emoji} <b>${config.name}</b>\n`;
        text += `${config.color} <i>${config.personality}</i>\n`;
        text += `🆔 Round: <code>${roundId}</code>\n\n`;

        // 1. SUMMARY
        const buyCount = claims.filter(c => c.claim === 'BUY').length;
        const sellCount = claims.filter(c => c.claim === 'SELL').length;
        const holdCount = claims.filter(c => c.claim === 'HOLD').length;
        const avgConfidence = claims.length > 0 ?
            claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length : 0;

        text += `📊 <b>SUMMARY:</b>\n`;
        text += `🚀 Buy: ${buyCount} | 📉 Sell: ${sellCount} | ⏸️ Hold: ${holdCount}\n`;
        text += `💪 Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%\n\n`;

        // 2. DETAILED CLAIMS
        if (claims.length > 0) {
            text += `🎯 <b>CLAIMS:</b>\n`;
            claims.forEach((claim, i) => {
                const action = claim.claim.includes('BUY') ? '🚀' : claim.claim.includes('SELL') ? '📉' : '⏸️';
                const ticker = claim.ticker === 'UNKNOWN' ? 'PARSE_ERROR' : claim.ticker;
                text += `${i + 1}. ${action} <b>${ticker}</b> (${(claim.confidence * 100).toFixed(1)}%)\n`;

                // Show direction and magnitude
                if (claim.direction) {
                    const directionEmoji = claim.direction === 'bullish' ? '📈' : claim.direction === 'bearish' ? '📉' : '➡️';
                    text += `   ${directionEmoji} Direction: ${claim.direction.toUpperCase()}\n`;
                }

                if (claim.magnitude !== undefined && claim.magnitude !== null) {
                    const magnitudeEmoji = Math.abs(claim.magnitude) > 0.5 ? '🔥' : Math.abs(claim.magnitude) > 0.2 ? '⚡' : '💤';
                    text += `   ${magnitudeEmoji} Magnitude: ${(claim.magnitude * 100).toFixed(1)}%\n`;
                }

                // Show rationale
                if (claim.rationale && claim.rationale.trim()) {
                    text += `   💭 <b>Reasoning:</b> ${claim.rationale}\n`;
                }

                // Removed Key Indicators to keep messages cleaner - focus on reasoning instead

                // Show risk flags
                if (claim.riskFlags && claim.riskFlags.length > 0) {
                    text += `   ⚠️ <b>Risk Flags:</b> ${claim.riskFlags.join(', ')}\n`;
                }

                text += '\n';
            });
        }

        // 3. EVIDENCES
        const allEvidence = new Set<any>();
        claims.forEach(claim => {
            if (claim.evidence) {
                claim.evidence.forEach(evidence => {
                    allEvidence.add(evidence);
                });
            }
        });

        if (allEvidence.size > 0) {
            text += `🔍 <b>EVIDENCES:</b>\n`;
            Array.from(allEvidence).forEach((evidence, i) => {
                if (!evidence) {
                    text += `${i + 1}. 📄 Unknown evidence\n`;
                } else if (typeof evidence === 'string') {
                    text += `${i + 1}. 📄 ${evidence}\n`;
                } else {
                    const source = evidence.source || 'Unknown';
                    let details = 'No details';

                    if (evidence.kind === 'news') {
                        details = evidence.snippet || evidence.url || 'No details';
                    } else if (evidence.kind === 'market' || evidence.kind === 'tech') {
                        details = evidence.metric || 'No details';
                    }

                    text += `${i + 1}. 📄 ${source}: ${details}\n`;
                }
            });
            text += '\n';
        }

        // 4. ANALYSIS INSIGHTS
        if (analysis && analysis.trim().length > 0) {
            text += `🧠 <b>ANALYSIS:</b>\n`;
            // Truncate long analysis to avoid message overflow
            const truncatedAnalysis = analysis.length > 1200 ? analysis.substring(0, 1200) + '...' : analysis;
            text += `<i>"${truncatedAnalysis}"</i>\n\n`;
        }

        return text;
    }

    /**
     * Signal Analyst logic and position sizing
     */
    static signalAnalysis(
        roundId: string,
        signalAnalyses: any[],
        riskProfile: string
    ): string {
        let text = `🎯 <b>SIGNAL ANALYST</b>\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `🎛️ Risk Profile: ${riskProfile.toUpperCase()}\n\n`;

        if (signalAnalyses && signalAnalyses.length > 0) {
            text += `📊 <b>SIGNAL ANALYSIS:</b>\n`;
            signalAnalyses.forEach((signal: any, i: number) => {
                const action = signal.recommendation === 'BUY' ? '🚀' : signal.recommendation === 'SELL' ? '📉' : '⏸️';
                text += `${i + 1}. ${action} <b>${signal.ticker}</b>\n`;
                text += `   📊 Signal: ${(signal.overallSignal * 100).toFixed(1)}%\n`;
                text += `   💪 Confidence: ${(signal.confidence * 100).toFixed(1)}%\n`;
                text += `   ⚠️ Risk: ${(signal.riskScore * 100).toFixed(1)}%\n`;
                if (signal.positionSize) {
                    text += `   💰 Position Size: ${(signal.positionSize * 100).toFixed(1)}%\n`;
                }
                text += '\n';
            });
        } else {
            text += `📊 <b>SIGNAL ANALYSIS:</b>\n`;
            text += `⏸️ No trading signals generated\n`;
            text += `Market conditions don't meet risk criteria\n\n`;
        }

        // Add portfolio summary
        if (signalAnalyses && signalAnalyses.length > 0) {
            const buyCount = signalAnalyses.filter(s => s.recommendation === 'BUY').length;
            const sellCount = signalAnalyses.filter(s => s.recommendation === 'SELL').length;
            const holdCount = signalAnalyses.filter(s => s.recommendation === 'HOLD').length;
            const avgConfidence = signalAnalyses.reduce((sum, s) => sum + s.confidence, 0) / signalAnalyses.length;

            text += `📈 <b>PORTFOLIO SUMMARY:</b>\n`;
            text += `🚀 Buy: ${buyCount} | 📉 Sell: ${sellCount} | ⏸️ Hold: ${holdCount}\n`;
            text += `💪 Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%\n`;
        }

        return text;
    }

    /**
     * Comprehensive debate and consensus summary
     */
    static agentDebate(
        roundId: string,
        conflicts: any[],
        debateRounds: any[],
        finalConsensus: any
    ): string {
        let text = `🎭 <b>AGENT DEBATES & CONSENSUS</b>\n`;
        text += `🆔 Round: <code>${roundId}</code>\n\n`;

        // Show conflict resolution process
        if (conflicts.length === 0) {
            text += `🤝 <b>UNANIMOUS AGREEMENT</b>\n`;
            text += `All agents reached consensus without conflicts.\n\n`;

            // Show individual agent positions even without conflicts
            if (debateRounds && debateRounds.length > 0) {
                text += `📊 <b>AGENT POSITIONS:</b>\n`;
                debateRounds.forEach((round, i) => {
                    const agentEmoji = round.agent === 'fundamental' ? '📊' :
                        round.agent === 'sentiment' ? '📰' : '📈';
                    const agentName = round.agent.toUpperCase();
                    text += `${agentEmoji} <b>${agentName}:</b> ${round.argument}\n`;
                    if (round.confidence) {
                        text += `   💪 ${(round.confidence * 100).toFixed(1)}% confidence\n`;
                    }
                    text += '\n';
                });
            }
        } else {
            text += `⚔️ <b>CONFLICT RESOLUTION: ${conflicts.length} conflicts</b>\n\n`;

            // Show key conflicts and resolutions
            conflicts.forEach((conflict, i) => {
                text += `🔴 <b>${conflict.ticker} Conflict:</b>\n`;
                text += `   📊 Fundamental: ${conflict.claim1}\n`;
                text += `   📈 Technical: ${conflict.claim2}\n`;
                text += `   ⚡ Severity: ${conflict.severity}\n\n`;
            });

            // Show full debate insights
            if (debateRounds.length > 0) {
                text += `💬 <b>FULL DEBATE:</b>\n`;
                debateRounds.forEach((round, i) => {
                    const agentEmoji = round.agent === 'fundamental' ? '📊' :
                        round.agent === 'sentiment' ? '📰' : '📈';
                    const agentName = round.agent.toUpperCase();
                    text += `${agentEmoji} <b>${agentName}:</b> "${round.argument}"\n`;
                    if (round.confidence) {
                        text += `   💪 ${(round.confidence * 100).toFixed(1)}% confidence\n`;
                    }
                    text += '\n';
                });
            }
        }

        // Add consensus methodology explanation
        text += `🔬 <b>CONSENSUS METHODOLOGY:</b>\n`;
        text += `• 📊 <b>Fundamental Agent</b> (35% weight): Market data, volume, liquidity\n`;
        text += `• 📰 <b>Sentiment Agent</b> (25% weight): News sentiment, social media\n`;
        text += `• 📈 <b>Technical Agent</b> (40% weight): RSI, MACD, technical indicators\n`;
        text += `• 🎯 <b>Final Score</b> = Weighted average of agent signals\n`;
        text += `• ⚖️ <b>Decision Thresholds</b>: BUY &gt; 0.3, SELL &lt; -0.3, HOLD otherwise\n\n`;

        // Show final consensus decision
        if (finalConsensus) {
            text += `🎯 <b>FINAL CONSENSUS:</b>\n`;
            const decisionEmoji = finalConsensus.decision === 'BUY' ? '🚀' :
                finalConsensus.decision === 'SELL' ? '📉' : '⏸️';
            text += `${decisionEmoji} Decision: ${finalConsensus.decision}\n`;
            text += `💪 Agent Confidence: ${(finalConsensus.confidence * 100).toFixed(1)}%\n`;
            text += `🤝 Agreement: ${(finalConsensus.agreement * 100).toFixed(1)}%\n\n`;

            if (finalConsensus.rationale) {
                text += `💭 <b>FULL REASONING:</b>\n`;
                text += `"${finalConsensus.rationale}"\n\n`;
            }
        }

        return text;
    }

    /**
     * Portfolio summary and transactions
     */
    static portfolioSummary(
        roundId: string,
        portfolio: any,
        transactions: any[] = [],
        orders: any[] = []
    ): string {
        let text = `💼 <b>PORTFOLIO SUMMARY</b>\n`;
        text += `🆔 Round: <code>${roundId}</code>\n\n`;

        // Portfolio overview
        if (portfolio) {
            text += `📊 <b>PORTFOLIO:</b>\n`;
            text += `💰 Total Value: $${portfolio.totalValue?.toFixed(2) || 'N/A'}\n`;
            text += `📈 P&L: ${portfolio.pnl >= 0 ? '+' : ''}${portfolio.pnl?.toFixed(2) || 'N/A'}%\n`;
            text += `🎯 Target Allocation: ${(portfolio.targetAllocation * 100).toFixed(1)}%\n\n`;
        }

        // Transactions
        if (transactions.length > 0) {
            text += `💸 <b>TRANSACTIONS:</b>\n`;
            transactions.forEach((tx, i) => {
                const type = tx.type === 'BUY' ? '🚀' : '📉';
                text += `${i + 1}. ${type} ${tx.symbol}: ${tx.amount} @ $${tx.price}\n`;
                text += `   💰 Total: $${tx.total?.toFixed(2) || 'N/A'}\n`;
                if (tx.hash) {
                    text += `   🔗 <a href="https://etherscan.io/tx/${tx.hash}">View on Etherscan</a>\n`;
                }
                text += '\n';
            });
        }

        // Orders
        if (orders.length > 0) {
            text += `📋 <b>ORDERS:</b>\n`;
            orders.forEach((order, i) => {
                const status = order.status === 'FILLED' ? '✅' : order.status === 'PENDING' ? '⏳' : '❌';
                text += `${i + 1}. ${status} ${order.symbol}: ${order.side} ${order.amount}\n`;
                text += `   💰 Price: $${order.price}\n`;
                if (order.orderId) {
                    text += `   🔗 Order ID: ${order.orderId}\n`;
                }
                text += '\n';
            });
        }

        if (transactions.length === 0 && orders.length === 0) {
            text += `⏸️ <b>NO ACTIVITY</b>\n`;
            text += `No transactions or orders in this round.\n`;
        }

        return text;
    }

    /**
     * Формат консенсуса
     */
    static consensusResults(
        roundId: string,
        consensus: ConsensusRec[],
        conflicts: any[] = []
    ): string {
        let text = `🤝 <b>CONSENSUS REACHED</b>\n`;
        text += `🆔 Round: <code>${roundId}</code>\n\n`;

        if (consensus.length === 0) {
            text += `⏸️ <b>NO TRADING OPPORTUNITIES</b>\n`;
            text += `Market conditions don't require new positions.\n\n`;
        } else {
            text += `🎯 <b>FINAL DECISIONS:</b>\n\n`;

            consensus.forEach((rec, i) => {
                const actionEmoji = rec.finalScore > 0.3 ? '🚀' : rec.finalScore < -0.3 ? '📉' : '⏸️';
                const confidenceEmoji = rec.avgConfidence > 0.7 ? '🟢' : rec.avgConfidence > 0.4 ? '🟡' : '🔴';

                text += `${i + 1}. ${actionEmoji} <b>${rec.ticker}</b>\n`;
                text += `   💪 Confidence: ${confidenceEmoji} ${(rec.avgConfidence * 100).toFixed(1)}%\n`;
                text += `   📊 Final score: ${(rec.finalScore * 100).toFixed(1)}%\n`;
                text += `   💧 Liquidity: ${(rec.liquidity * 100).toFixed(1)}%\n`;
                text += `   📈 Coverage: ${(rec.coverage * 100).toFixed(1)}%\n\n`;
            });

            // Portfolio summary
            const avgScore = consensus.reduce((sum, r) => sum + r.finalScore, 0) / consensus.length;
            const highConfidenceRecs = consensus.filter(r => r.avgConfidence > 0.7).length;

            text += `📊 <b>PORTFOLIO IMPACT:</b>\n`;
            text += `• 🎯 Average score: ${(avgScore * 100).toFixed(1)}%\n`;
            text += `• 💪 High confidence: ${highConfidenceRecs}/${consensus.length}\n`;
            text += `• 📈 Total recommendations: ${consensus.length}\n`;

            if (avgScore > 0.2) {
                text += `• 🚀 Portfolio sentiment: Bullish\n`;
            } else if (avgScore < -0.2) {
                text += `• 📉 Portfolio sentiment: Bearish\n`;
            } else {
                text += `• ⏸️ Portfolio sentiment: Neutral\n`;
            }
        }

        return text;
    }

    /**
     * Формат исполнения ордеров
     */
    static orderExecution(
        roundId: string,
        orders: Order[],
        positions: Position[]
    ): string {
        let text = `⚡ <b>DECISION EXECUTION</b>\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `📋 Orders executed: ${orders.length}\n`;
        text += `💼 Positions updated: ${positions.length}\n\n`;

        if (orders.length > 0) {
            text += `<b>EXECUTED ORDERS:</b>\n`;
            orders.forEach((order, i) => {
                const side = order.side === 'buy' ? '🟢 BUY' : '🔴 SELL';
                text += `${i + 1}. ${side} ${order.quantity} ${order.symbol}\n`;
                text += `   💰 ${order.type} @ ${order.price || 'MARKET'}\n`;
                text += `   📊 Status: ${order.status}\n\n`;
            });
        }

        text += `<i>Agents completed work successfully</i>`;

        return text;
    }

    /**
     * Comprehensive round completion summary
     */
    static roundCompletion(
        roundId: string,
        summary: {
            claims: Claim[];
            consensus: ConsensusRec[];
            orders: Order[];
            positions: Position[];
            performance: { totalValue: number; unrealizedPnL: number; realizedPnL: number };
            timestamp: number;
        }
    ): string {
        const duration = Math.round((Date.now() - summary.timestamp) / 1000);
        const { totalValue, unrealizedPnL, realizedPnL } = summary.performance;

        let text = `🎉 <b>ROUND COMPLETED</b>\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `⏱️ Duration: ${duration}s\n`;
        text += `🕐 Completed: ${new Date().toLocaleString()}\n\n`;

        // Show key metrics
        text += `📊 <b>PERFORMANCE SUMMARY:</b>\n`;
        text += `• 🤖 Agents: 3 (${summary.claims.length} claims generated)\n`;
        text += `• 🎯 Consensus: ${summary.consensus.length} decisions\n`;
        text += `• ⚡ Orders: ${summary.orders.length} executed\n`;
        text += `• 💰 Portfolio: $${totalValue.toFixed(2)} (PnL: $${unrealizedPnL.toFixed(2)})\n\n`;

        // Show consensus decisions
        if (summary.consensus.length > 0) {
            text += `🎯 <b>FINAL DECISIONS:</b>\n`;
            summary.consensus.forEach((rec, i) => {
                const actionEmoji = rec.finalScore > 0.3 ? '🚀' : rec.finalScore < -0.3 ? '📉' : '⏸️';
                const confidenceEmoji = rec.avgConfidence > 0.7 ? '🟢' : rec.avgConfidence > 0.4 ? '🟡' : '🔴';
                text += `${i + 1}. ${actionEmoji} <b>${rec.ticker}</b>: ${(rec.finalScore * 100).toFixed(1)}% score\n`;
                text += `   ${confidenceEmoji} ${(rec.avgConfidence * 100).toFixed(1)}% confidence\n`;
            });
            text += '\n';
        }

        // Show execution results
        if (summary.orders.length > 0) {
            text += `⚡ <b>EXECUTION RESULTS:</b>\n`;
            summary.orders.forEach((order, i) => {
                const side = order.side === 'buy' ? '🟢 BUY' : '🔴 SELL';
                text += `${i + 1}. ${side} ${order.quantity} ${order.symbol} @ ${order.price || 'MARKET'}\n`;
            });
            text += '\n';
        }

        text += `<i>Multi-agent consensus system completed successfully!</i>`;

        return text;
    }

    /**
     * Формат экстренного уведомления
     */
    static emergencyAlert(
        type: 'kill_switch' | 'risk_violation' | 'api_failure',
        details: string
    ): string {
        const emoji = {
            kill_switch: '🛑',
            risk_violation: '🚨',
            api_failure: '⚠️'
        }[type];

        return `${emoji} <b>EMERGENCY ALERT</b>\n\n` +
            `🚨 Type: ${type.replace('_', ' ').toUpperCase()}\n` +
            `🕐 Time: ${new Date().toLocaleString()}\n` +
            `📝 Details: ${details}\n\n` +
            `⚡ All trading operations suspended`;
    }

    /**
     * Формат оценки рисков
     */
    static riskAssessment(
        roundId: string,
        riskCheck: { ok: boolean; violations: any[]; warnings: any[] }
    ): string {
        const status = riskCheck.ok ? '✅ PASSED' : '❌ FAILED';
        const emoji = riskCheck.ok ? '🛡️' : '🚨';

        let text = `${emoji} <b>RISK ASSESSMENT</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `📊 Status: ${status}\n\n`;

        if (riskCheck.violations.length > 0) {
            text += `🚨 <b>VIOLATIONS (${riskCheck.violations.length}):</b>\n`;
            riskCheck.violations.forEach(violation => {
                text += `• ${violation.type}: ${violation.severity}\n`;
            });
            text += '\n';
        }

        if (riskCheck.warnings.length > 0) {
            text += `⚠️ <b>WARNINGS (${riskCheck.warnings.length}):</b>\n`;
            riskCheck.warnings.forEach(warning => {
                text += `• ${warning.type}: ${warning.message}\n`;
            });
            text += '\n';
        }

        if (riskCheck.ok) {
            text += `✅ All risk checks passed - continuing execution`;
        } else {
            text += `❌ Risk checks failed - execution blocked`;
        }

        return text;
    }

    /**
     * Генерация сводки claims
     */
    private static generateClaimsSummary(claims: Claim[]): string {
        if (claims.length === 0) {
            return 'Claims not generated';
        }

        const summary = claims.map(claim => {
            const action = claim.claim.includes('BUY') ? '🚀' : claim.claim.includes('SELL') ? '📉' : '⏸️';
            return `${action} ${claim.ticker}: ${claim.claim} (${(claim.confidence * 100).toFixed(0)}% confidence)`;
        }).join(', ');

        return summary;
    }
}
