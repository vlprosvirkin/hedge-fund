import type { Claim, ConsensusRec, Position, Order, Evidence, NewsItem } from '../../types/index.js';

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
        expertise: 'On-chain metrics, network health, liquidity analysis, market cap dynamics',
        personality: 'Data-driven analyst, focuses on blockchain fundamentals and institutional metrics'
    },
    sentiment: {
        emoji: '📰',
        name: 'SENTIMENT ANALYST',
        color: '🟡',
        expertise: 'News sentiment, social media analysis, Fear & Greed Index, community engagement',
        personality: 'Sentiment-focused analyst, evaluates market mood and social signals'
    },
    technical: {
        emoji: '📈',
        name: 'TECHNICAL ANALYST',
        color: '🟢',
        expertise: 'RSI, MACD, Bollinger Bands, volatility analysis, price action patterns',
        personality: 'Technical analyst, relies on chart patterns and momentum indicators'
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

                // Show signals/indicators with proper formatting
                if (claim.signals && claim.signals.length > 0) {
                    text += `   📈 <b>Key Indicators:</b>\n`;

                    // Filter out zero values and show only meaningful indicators
                    const meaningfulSignals = claim.signals.filter(signal =>
                        signal && signal.value !== undefined && signal.value !== null &&
                        (typeof signal.value === 'number' ? Math.abs(signal.value) > 0.001 : true)
                    );

                    if (meaningfulSignals.length > 0) {
                        meaningfulSignals.slice(0, 5).forEach(signal => {
                            const value = typeof signal.value === 'number' ? signal.value.toFixed(3) : signal.value;
                            const signalEmoji = this.getSignalEmoji(signal.name);
                            text += `      ${signalEmoji} ${signal.name}: ${value}\n`;
                        });

                        if (meaningfulSignals.length > 5) {
                            text += `      • ... and ${meaningfulSignals.length - 5} more\n`;
                        }
                    } else {
                        text += `      ⚠️ No significant indicators available\n`;
                    }
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
                                } else if (evidence.kind === 'onchain') {
                                    details = evidence.metric || 'On-chain data';
                                } else if (evidence.kind === 'social') {
                                    details = evidence.metric || 'Social metrics';
                                } else if (evidence.kind === 'index') {
                                    details = evidence.name || 'Market index';
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

                // Show key signals/indicators (top 5 most important)
                if (claim.signals && claim.signals.length > 0) {
                    text += `   📊 <b>Key Signals:</b>\n`;

                    // Filter out zero values and show only meaningful indicators
                    const meaningfulSignals = claim.signals.filter(signal =>
                        signal && signal.value !== undefined && signal.value !== null &&
                        (typeof signal.value === 'number' ? Math.abs(signal.value) > 0.001 : true)
                    );

                    if (meaningfulSignals.length > 0) {
                        // Show only top 5 most important indicators
                        const topSignals = meaningfulSignals.slice(0, 5);
                        topSignals.forEach(signal => {
                            if (signal && signal.name && signal.value !== undefined) {
                                const value = typeof signal.value === 'number' ? signal.value.toFixed(3) : signal.value;
                                const signalEmoji = this.getSignalEmoji(signal.name);
                                text += `      ${signalEmoji} ${signal.name}: ${value}\n`;
                            }
                        });
                        if (meaningfulSignals.length > 5) {
                            text += `      • ... and ${meaningfulSignals.length - 5} more\n`;
                        }
                    } else {
                        text += `      ⚠️ No significant signals available\n`;
                    }
                }

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
            text += `📊 <b>Evidence Summary:</b> ${allEvidence.size} items used\n`;
            Array.from(allEvidence).forEach((evidence, i) => {
                if (!evidence) {
                    text += `${i + 1}. 📄 Unknown evidence\n`;
                } else if (typeof evidence === 'string') {
                    // Try to parse evidence ID for better display
                    if (evidence.includes('_')) {
                        const parts = evidence.split('_');
                        const type = parts[1] || 'unknown';
                        const timestamp = parts[2] || 'unknown';
                        text += `${i + 1}. 📄 ${type.toUpperCase()} data (${timestamp})\n`;
                    } else {
                        text += `${i + 1}. 📄 ${evidence}\n`;
                    }
                } else {
                    const source = evidence.source || 'Unknown';
                    let details = 'No details';

                    if (evidence.kind === 'news') {
                        details = evidence.snippet || evidence.url || 'No details';
                    } else if (evidence.kind === 'market' || evidence.kind === 'tech') {
                        details = evidence.metric || 'No details';
                    } else if (evidence.kind === 'onchain') {
                        details = evidence.metric || 'On-chain data';
                    } else if (evidence.kind === 'social') {
                        details = evidence.metric || 'Social metrics';
                    } else if (evidence.kind === 'index') {
                        details = evidence.name || 'Market index';
                    }

                    text += `${i + 1}. 📄 ${source}: ${details}\n`;
                }
            });
            text += '\n';
        }

        // 4. ANALYSIS INSIGHTS
        if (analysis && analysis.trim().length > 0) {
            text += `🧠 <b>ANALYSIS:</b>\n`;

            // Try to extract clean analysis text (avoid raw JSON)
            let cleanAnalysis = analysis;

            // Remove JSON blocks that might be mixed in
            cleanAnalysis = cleanAnalysis
                .replace(/\{[^{}]*"claims"[^{}]*\}/g, '') // Remove JSON claims blocks
                .replace(/CLAIMS:\s*\n\s*\{[\s\S]*?\}\s*\n/g, '') // Remove CLAIMS: JSON blocks
                .replace(/FUNDAMENTAL ANALYSIS:\s*/gi, '')
                .replace(/TECHNICAL ANALYSIS:\s*/gi, '')
                .replace(/SENTIMENT ANALYSIS:\s*/gi, '')
                .replace(/Based on the above analysis, here are the claims for each ticker:/gi, '')
                .replace(/\n\n+/g, '\n') // Remove multiple newlines
                .trim();

            // Extract key insights for each ticker
            const tickerInsights: string[] = [];
            claims.forEach(claim => {
                const ticker = claim.ticker;
                const direction = claim.direction || (claim.claim === 'BUY' ? 'bullish' : claim.claim === 'SELL' ? 'bearish' : 'neutral');
                const confidence = (claim.confidence * 100).toFixed(0);

                let insight = `${ticker}: ${direction.toUpperCase()} (${confidence}% conf)`;

                if (claim.rationale) {
                    // Extract first sentence of rationale
                    const firstSentence = claim.rationale.split('.')[0];
                    if (firstSentence && firstSentence.length < 80) {
                        insight += ` - ${firstSentence}`;
                    }
                }

                tickerInsights.push(insight);
            });

            // Show compact insights instead of full analysis
            if (tickerInsights.length > 0) {
                text += `📊 <b>Key Insights:</b>\n`;
                tickerInsights.forEach(insight => {
                    text += `• ${insight}\n`;
                });

                // Add agent-specific analysis summary
                const agentSummary = this.getAgentAnalysisSummary(agentRole, claims);
                if (agentSummary) {
                    text += `\n🔬 <b>${agentRole.toUpperCase()} Analysis Summary:</b>\n`;
                    text += `${agentSummary}\n`;
                }

                text += '\n';
            } else if (cleanAnalysis.length > 0) {
                // Show clean analysis if no insights extracted but analysis exists
                const truncatedAnalysis = cleanAnalysis.length > 300 ? cleanAnalysis.substring(0, 300) + '...' : cleanAnalysis;
                text += `<i>"${truncatedAnalysis}"</i>\n\n`;
            }
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

                // Handle different conflict formats
                if (conflict.claims && Array.isArray(conflict.claims)) {
                    // New format from consensus service
                    const fundamentalClaim = conflict.claims.find((c: any) => c.agentRole === 'fundamental');
                    const technicalClaim = conflict.claims.find((c: any) => c.agentRole === 'technical');

                    text += `   📊 Fundamental: ${fundamentalClaim ? fundamentalClaim.claim : 'No data'}\n`;
                    text += `   📈 Technical: ${technicalClaim ? technicalClaim.claim : 'No data'}\n`;
                } else {
                    // Old format with claim1/claim2
                    text += `   📊 Fundamental: ${conflict.claim1 || 'No data'}\n`;
                    text += `   📈 Technical: ${conflict.claim2 || 'No data'}\n`;
                }

                text += `   ⚡ Severity: ${conflict.severity || 'unknown'}\n\n`;
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
        text += `• 📊 <b>Fundamental Agent</b> (30% weight): On-chain metrics, market cap dynamics, social sentiment\n`;
        text += `• 📰 <b>Sentiment Agent</b> (30% weight): News sentiment, social media, Fear & Greed Index\n`;
        text += `• 📈 <b>Technical Agent</b> (40% weight): RSI, MACD, technical indicators, price action\n`;
        text += `• 🎯 <b>Final Score</b> = Weighted average of agent signals\n`;
        text += `• ⚖️ <b>Decision Thresholds</b>: BUY &gt; 0.3, SELL &lt; -0.3, HOLD otherwise\n`;
        text += `• 🔄 <b>Process</b>: Individual analysis → Signal processing → Consensus building → Final decision\n\n`;

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
     * Comprehensive round completion summary with signal interpretation
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

        // Show consensus decisions with signal interpretation
        if (summary.consensus.length > 0) {
            text += `🎯 <b>FINAL DECISIONS:</b>\n`;
            summary.consensus.forEach((rec, i) => {
                const signalInterpretation = this.interpretSignal(rec.finalScore, rec.avgConfidence);
                const actionEmoji = signalInterpretation.action === 'BUY' ? '🚀' :
                    signalInterpretation.action === 'SELL' ? '📉' : '⏸️';
                const confidenceEmoji = rec.avgConfidence > 0.7 ? '🟢' : rec.avgConfidence > 0.4 ? '🟡' : '🔴';

                text += `${i + 1}. ${actionEmoji} <b>${rec.ticker}</b>: ${(rec.finalScore * 100).toFixed(1)}% score\n`;
                text += `   ${confidenceEmoji} ${(rec.avgConfidence * 100).toFixed(1)}% confidence\n`;
                text += `   📊 ${signalInterpretation.description}\n`;
                text += `   💡 ${signalInterpretation.reasoning}\n`;
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
     * Enhanced round completion with detailed signal results and price targets
     */
    static roundCompletionWithResults(
        roundId: string,
        summary: {
            claims: Claim[];
            consensus: ConsensusRec[];
            orders: Order[];
            positions: Position[];
            performance: { totalValue: number; unrealizedPnL: number; realizedPnL: number };
            timestamp: number;
        },
        results: any[] = []
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

        // Show detailed signal results with price targets
        if (results.length > 0) {
            text += `🎯 <b>DETAILED SIGNAL ANALYSIS:</b>\n`;
            results.forEach((result, i) => {
                const signalInterpretation = this.interpretSignal(result.signal_strength, result.confidence);
                const actionEmoji = result.signal_direction === 'buy' ? '🚀' :
                    result.signal_direction === 'sell' ? '📉' : '⏸️';
                const confidenceEmoji = result.confidence > 0.7 ? '🟢' : result.confidence > 0.4 ? '🟡' : '🔴';

                text += `${i + 1}. ${actionEmoji} <b>${result.ticker}</b>\n`;
                text += `   📊 Signal: ${(result.signal_strength * 100).toFixed(1)}% (${signalInterpretation.description})\n`;
                text += `   ${confidenceEmoji} Confidence: ${(result.confidence * 100).toFixed(1)}%\n`;
                text += `   ⚠️ Risk Score: ${(result.risk_score * 100).toFixed(1)}%\n`;

                // Show price targets if available
                if (result.target_price || result.stop_loss || result.take_profit) {
                    text += `   💰 <b>Price Targets:</b>\n`;
                    if (result.target_price) {
                        text += `      🎯 Target: $${result.target_price.toFixed(2)}\n`;
                    }
                    if (result.stop_loss) {
                        text += `      🛑 Stop Loss: $${result.stop_loss.toFixed(2)}\n`;
                    }
                    if (result.take_profit) {
                        text += `      💎 Take Profit: $${result.take_profit.toFixed(2)}\n`;
                    }
                    text += `      ⏰ Time Horizon: ${result.time_horizon.toUpperCase()}\n`;
                }

                // Show current market context
                if (result.market_context) {
                    const ctx = result.market_context;
                    text += `   📈 <b>Market Context:</b>\n`;
                    text += `      💵 Price: $${ctx.price_at_signal?.toFixed(2) || 'N/A'}\n`;
                    text += `      📊 Volume 24h: $${(ctx.volume_24h / 1000000).toFixed(1)}M\n`;
                    text += `      📈 Volatility: ${(ctx.volatility * 100).toFixed(1)}%\n`;
                    text += `      😊 Sentiment: ${(ctx.market_sentiment * 100).toFixed(1)}%\n`;
                }

                // Show agent contributions
                if (result.agent_contributions) {
                    text += `   🤖 <b>Agent Contributions:</b>\n`;
                    const agents = result.agent_contributions;
                    if (agents.fundamental) {
                        const fundEmoji = agents.fundamental.signal > 0 ? '📈' : agents.fundamental.signal < 0 ? '📉' : '➡️';
                        text += `      📊 Fundamental: ${fundEmoji} ${(agents.fundamental.signal * 100).toFixed(1)}% (${(agents.fundamental.confidence * 100).toFixed(1)}% conf)\n`;
                    }
                    if (agents.sentiment) {
                        const sentEmoji = agents.sentiment.signal > 0 ? '📈' : agents.sentiment.signal < 0 ? '📉' : '➡️';
                        text += `      📰 Sentiment: ${sentEmoji} ${(agents.sentiment.signal * 100).toFixed(1)}% (${(agents.sentiment.confidence * 100).toFixed(1)}% conf)\n`;
                    }
                    if (agents.technical) {
                        const techEmoji = agents.technical.signal > 0 ? '📈' : agents.technical.signal < 0 ? '📉' : '➡️';
                        text += `      📈 Technical: ${techEmoji} ${(agents.technical.signal * 100).toFixed(1)}% (${(agents.technical.confidence * 100).toFixed(1)}% conf)\n`;
                    }
                }

                text += '\n';
            });
        } else if (summary.consensus.length > 0) {
            // Fallback to consensus data if no results available
            text += `🎯 <b>FINAL DECISIONS:</b>\n`;
            summary.consensus.forEach((rec, i) => {
                const signalInterpretation = this.interpretSignal(rec.finalScore, rec.avgConfidence);
                const actionEmoji = signalInterpretation.action === 'BUY' ? '🚀' :
                    signalInterpretation.action === 'SELL' ? '📉' : '⏸️';
                const confidenceEmoji = rec.avgConfidence > 0.7 ? '🟢' : rec.avgConfidence > 0.4 ? '🟡' : '🔴';

                text += `${i + 1}. ${actionEmoji} <b>${rec.ticker}</b>: ${(rec.finalScore * 100).toFixed(1)}% score\n`;
                text += `   ${confidenceEmoji} ${(rec.avgConfidence * 100).toFixed(1)}% confidence\n`;
                text += `   📊 ${signalInterpretation.description}\n`;
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

    /**
     * Get emoji for signal type
     */
    private static getSignalEmoji(signalName: string): string {
        const name = signalName.toLowerCase();

        // Technical indicators
        if (name.includes('rsi')) return '📈';
        if (name.includes('macd')) return '📊';
        if (name.includes('bollinger') || name.includes('bb')) return '📉';
        if (name.includes('stochastic')) return '📊';
        if (name.includes('volatility')) return '📊';
        if (name.includes('momentum')) return '⚡';

        // Fundamental indicators
        if (name.includes('liquidity')) return '💰';
        if (name.includes('volume')) return '📊';
        if (name.includes('market_cap')) return '🏢';
        if (name.includes('on_chain') || name.includes('network')) return '🔗';
        if (name.includes('transaction')) return '💳';
        if (name.includes('address')) return '🏠';
        if (name.includes('utxo')) return '📦';

        // Sentiment indicators
        if (name.includes('sentiment')) return '📰';
        if (name.includes('social')) return '👥';
        if (name.includes('galaxy')) return '⭐';
        if (name.includes('fear_greed') || name.includes('feargreed')) return '😨';
        if (name.includes('news')) return '📰';
        if (name.includes('coverage')) return '📊';
        if (name.includes('freshness')) return '🆕';
        if (name.includes('consistency')) return '🔄';
        if (name.includes('credibility')) return '✅';

        // Risk indicators
        if (name.includes('risk') || name.includes('correlation')) return '⚠️';
        if (name.includes('drawdown')) return '📉';
        if (name.includes('profit')) return '💰';

        // Default
        return '📋';
    }

    /**
     * Get agent-specific analysis summary
     */
    private static getAgentAnalysisSummary(agentRole: string, claims: Claim[]): string {
        if (claims.length === 0) return '';

        const buyCount = claims.filter(c => c.claim === 'BUY').length;
        const sellCount = claims.filter(c => c.claim === 'SELL').length;
        const holdCount = claims.filter(c => c.claim === 'HOLD').length;
        const avgConfidence = claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length;

        switch (agentRole) {
            case 'fundamental':
                return `Analyzed ${claims.length} assets using on-chain metrics, network health, and market fundamentals. ${buyCount} BUY, ${sellCount} SELL, ${holdCount} HOLD recommendations with ${(avgConfidence * 100).toFixed(1)}% avg confidence. Evaluated liquidity, transaction efficiency, address growth, and institutional metrics.`;

            case 'sentiment':
                return `Analyzed ${claims.length} assets using news sentiment, social media, and market mood indicators. ${buyCount} BUY, ${sellCount} SELL, ${holdCount} HOLD recommendations with ${(avgConfidence * 100).toFixed(1)}% avg confidence. Evaluated news coverage, sentiment scores, Fear & Greed Index, and community engagement.`;

            case 'technical':
                return `Analyzed ${claims.length} assets using technical indicators and price action patterns. ${buyCount} BUY, ${sellCount} SELL, ${holdCount} HOLD recommendations with ${(avgConfidence * 100).toFixed(1)}% avg confidence. Applied RSI, MACD, Bollinger Bands, volatility, and momentum analysis.`;

            default:
                return `Analyzed ${claims.length} assets. ${buyCount} BUY, ${sellCount} SELL, ${holdCount} HOLD recommendations with ${(avgConfidence * 100).toFixed(1)}% avg confidence.`;
        }
    }

    /**
     * Interpret trading signal with detailed analysis
     */
    static interpretSignal(signalStrength: number, confidence: number): {
        action: 'BUY' | 'SELL' | 'HOLD';
        description: string;
        reasoning: string;
        strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
        recommendation: string;
    } {
        const absSignal = Math.abs(signalStrength);
        const signalPercent = Math.abs(signalStrength * 100);

        // Determine signal strength
        let strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
        if (absSignal < 0.05) strength = 'very_weak';
        else if (absSignal < 0.1) strength = 'weak';
        else if (absSignal < 0.2) strength = 'moderate';
        else if (absSignal < 0.4) strength = 'strong';
        else strength = 'very_strong';

        // Determine action based on signal direction and strength
        let action: 'BUY' | 'SELL' | 'HOLD';
        let description: string;
        let reasoning: string;
        let recommendation: string;

        if (signalStrength > 0.1) {
            action = 'BUY';
            description = this.getSignalDescription(signalPercent, 'bullish', strength);
            reasoning = this.getSignalReasoning(signalPercent, confidence, 'bullish');
            recommendation = this.getSignalRecommendation(signalPercent, confidence, 'bullish');
        } else if (signalStrength < -0.1) {
            action = 'SELL';
            description = this.getSignalDescription(signalPercent, 'bearish', strength);
            reasoning = this.getSignalReasoning(signalPercent, confidence, 'bearish');
            recommendation = this.getSignalRecommendation(signalPercent, confidence, 'bearish');
        } else {
            action = 'HOLD';
            description = this.getSignalDescription(signalPercent, 'neutral', strength);
            reasoning = this.getSignalReasoning(signalPercent, confidence, 'neutral');
            recommendation = this.getSignalRecommendation(signalPercent, confidence, 'neutral');
        }

        return {
            action,
            description,
            reasoning,
            strength,
            recommendation
        };
    }

    /**
     * Get signal description based on strength and direction
     */
    private static getSignalDescription(signalPercent: number, direction: 'bullish' | 'bearish' | 'neutral', strength: string): string {
        const strengthEmoji = {
            'very_weak': '💤',
            'weak': '⚡',
            'moderate': '🔥',
            'strong': '🚀',
            'very_strong': '💥'
        }[strength];

        const directionEmoji = {
            'bullish': '📈',
            'bearish': '📉',
            'neutral': '➡️'
        }[direction];

        const strengthText = {
            'very_weak': 'Very Weak',
            'weak': 'Weak',
            'moderate': 'Moderate',
            'strong': 'Strong',
            'very_strong': 'Very Strong'
        }[strength];

        return `${strengthEmoji} ${strengthText} ${directionEmoji} Signal (${signalPercent.toFixed(1)}%)`;
    }

    /**
     * Get signal reasoning based on strength and confidence
     */
    private static getSignalReasoning(signalPercent: number, confidence: number, direction: 'bullish' | 'bearish' | 'neutral'): string {
        const confidenceText = confidence > 0.8 ? 'High' : confidence > 0.6 ? 'Moderate' : 'Low';

        if (direction === 'neutral') {
            return `Market is in equilibrium with ${confidenceText.toLowerCase()} confidence. Mixed signals from agents suggest waiting for clearer direction.`;
        }

        const directionText = direction === 'bullish' ? 'upside potential' : 'downside risk';
        const strengthText = signalPercent > 30 ? 'strong' : signalPercent > 15 ? 'moderate' : 'weak';

        return `${confidenceText} confidence in ${strengthText} ${directionText}. Multiple indicators align in ${direction} direction.`;
    }

    /**
     * Get signal recommendation based on strength and confidence
     */
    private static getSignalRecommendation(signalPercent: number, confidence: number, direction: 'bullish' | 'bearish' | 'neutral'): string {
        if (direction === 'neutral') {
            return 'Wait for stronger signals or clearer market direction';
        }

        const confidenceText = confidence > 0.8 ? 'High confidence' : confidence > 0.6 ? 'Moderate confidence' : 'Low confidence';
        const actionText = direction === 'bullish' ? 'consider buying' : 'consider selling';
        const strengthText = signalPercent > 30 ? 'strong signal' : signalPercent > 15 ? 'moderate signal' : 'weak signal';

        return `${confidenceText} ${strengthText} - ${actionText} with proper risk management`;
    }
}
