import axios from 'axios';
import type {
    Claim,
    ConsensusRec,
    Position,
    Order,
    PipelineArtifact
} from '../types/index.js';
import { API_CONFIG } from '../config.js';

export interface TelegramMessage {
    text: string;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
    reply_markup?: {
        inline_keyboard?: Array<Array<{
            text: string;
            callback_data?: string;
            url?: string;
        }>>;
    };
}

export interface DecisionSummary {
    roundId: string;
    timestamp: number;
    claims: Claim[];
    consensus: ConsensusRec[];
    orders: Order[];
    positions: Position[];
    performance: {
        totalValue: number;
        unrealizedPnL: number;
        realizedPnL: number;
    };
}

export class TelegramAdapter {
    private botToken: string;
    private chatId: string;
    private baseUrl: string;
    private isConnectedFlag = false;

    constructor(botToken?: string, chatId?: string) {
        this.botToken = botToken || API_CONFIG.telegram?.botToken || '';
        this.chatId = chatId || API_CONFIG.telegram?.chatId || '';
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    async connect(): Promise<void> {
        try {
            if (!this.botToken || !this.chatId) {
                throw new Error('Telegram bot token or chat ID not configured');
                this.isConnectedFlag = true;
                return;
            }

            // Test connection by getting bot info
            const response = await axios.get(`${this.baseUrl}/getMe`);

            if (response.data.ok) {
                this.isConnectedFlag = true;
                console.log(`✅ Connected to Telegram bot: ${response.data.result.username}`);
            } else {
                throw new Error('Failed to connect to Telegram bot');
            }
        } catch (error) {
            throw new Error(`Telegram connection failed: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        this.isConnectedFlag = false;
    }

    isConnected(): boolean {
        return this.isConnectedFlag;
    }

    /**
     * Send a message to the configured Telegram chat
     */
    async sendMessage(message: TelegramMessage): Promise<void> {
        if (!this.botToken || !this.chatId) {
            // TODO: Implement real Telegram message sending
            throw new Error('Telegram message sending not implemented');
            return;
        }

        try {
            await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: this.chatId,
                ...message
            });
        } catch (error) {
            console.error('Failed to send Telegram message:', error);
        }
    }

    /**
     * Post trading round start notification
     */
    async postRoundStart(roundId: string, universe: string[]): Promise<void> {
        const message: TelegramMessage = {
            text: `🚀 <b>Trading Round Started</b>\n\n` +
                `🆔 Round ID: <code>${roundId}</code>\n` +
                `🕐 Time: ${new Date().toLocaleString()}\n` +
                `🎯 Universe: ${universe.join(', ')}\n` +
                `📊 Analyzing ${universe.length} assets...`,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post agent analysis results with detailed OpenAI responses
     */
    async postAgentAnalysis(
        roundId: string,
        agentRole: string,
        claims: Claim[],
        processingTime: number,
        openaiResponse?: string,
        debateContext?: any
    ): Promise<void> {
        const emoji = {
            fundamental: '📊',
            sentiment: '📰',
            valuation: '📈'
        }[agentRole] || '🤖';

        let text = `${emoji} <b>${agentRole.toUpperCase()} AGENT ANALYSIS</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `⏱️ Processing time: ${processingTime}ms\n`;
        text += `📋 Generated ${claims.length} claims\n\n`;

        // Show OpenAI response analysis if available
        if (openaiResponse) {
            text += `🧠 <b>AI REASONING:</b>\n`;
            const responsePreview = openaiResponse.substring(0, 300);
            text += `<code>${responsePreview}${openaiResponse.length > 300 ? '...' : ''}</code>\n\n`;
        }

        // Show debate context if available
        if (debateContext) {
            text += `💬 <b>DEBATE CONTEXT:</b>\n`;
            if (debateContext.conflicts) {
                text += `⚠️ Conflicts detected: ${debateContext.conflicts.length}\n`;
            }
            if (debateContext.round) {
                text += `🔄 Debate round: ${debateContext.round}\n`;
            }
            if (debateContext.consensus) {
                text += `🤝 Consensus reached: ${debateContext.consensus ? 'Yes' : 'No'}\n`;
            }
            text += '\n';
        }

        // Show detailed analysis for each claim
        const topClaims = claims.slice(0, 5); // Show top 5 instead of 3
        for (let i = 0; i < topClaims.length; i++) {
            const claim = topClaims[i];
            if (!claim) continue;

            text += `<b>${i + 1}. ${claim.ticker}</b>\n`;
            text += `💪 Confidence: ${(claim.confidence * 100).toFixed(1)}%\n`;
            text += `📅 Timestamp: ${new Date(claim.timestamp).toLocaleString()}\n`;
            text += `📝 <i>${claim.claim}</i>\n`;

            // Show evidence if available
            if (claim.evidence && claim.evidence.length > 0) {
                text += `🔍 Evidence (${claim.evidence.length} sources):\n`;
                claim.evidence.slice(0, 2).forEach(evidenceId => {
                    text += `  • Evidence ID: ${evidenceId}\n`;
                });
                if (claim.evidence.length > 2) {
                    text += `  • ... and ${claim.evidence.length - 2} more sources\n`;
                }
            }

            if (claim.riskFlags && claim.riskFlags.length > 0) {
                text += `⚠️ Risk flags: ${claim.riskFlags.join(', ')}\n`;
            }

            // Show agent-specific details
            if (agentRole === 'fundamental') {
                text += `📊 Analysis: Price, volume, market cap analysis\n`;
            } else if (agentRole === 'sentiment') {
                text += `📰 Analysis: News sentiment and social media analysis\n`;
            } else if (agentRole === 'valuation') {
                text += `📈 Analysis: Technical indicators and chart patterns\n`;
            }

            text += '\n';
        }

        // Show summary statistics
        if (claims.length > 0) {
            const avgConfidence = claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length;
            const highConfidenceClaims = claims.filter(c => c.confidence > 0.7).length;

            text += `📊 <b>SUMMARY:</b>\n`;
            text += `• Average confidence: ${(avgConfidence * 100).toFixed(1)}%\n`;
            text += `• High confidence claims (>70%): ${highConfidenceClaims}/${claims.length}\n`;
            text += `• Assets analyzed: ${new Set(claims.map(c => c.ticker)).size}\n`;
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };

        await this.sendMessage(message);
    }

    /**
     * Post agent debate and conflict resolution details
     */
    async postAgentDebate(
        roundId: string,
        conflicts: any[],
        debateRounds: any[],
        finalConsensus: any
    ): Promise<void> {
        let text = `💬 <b>AGENT DEBATE & CONFLICT RESOLUTION</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `⚠️ Conflicts detected: ${conflicts.length}\n`;
        text += `🔄 Debate rounds: ${debateRounds.length}\n\n`;

        // Show conflicts in detail
        if (conflicts.length > 0) {
            text += `🚨 <b>CONFLICTS DETECTED:</b>\n`;
            conflicts.forEach((conflict, i) => {
                text += `${i + 1}. <b>${conflict.ticker}</b>\n`;
                text += `   🔴 ${conflict.agent1}: ${conflict.claim1} (${(conflict.confidence1 * 100).toFixed(1)}%)\n`;
                text += `   🟢 ${conflict.agent2}: ${conflict.claim2} (${(conflict.confidence2 * 100).toFixed(1)}%)\n`;
                text += `   ⚡ Severity: ${conflict.severity}\n`;
                if (conflict.reason) {
                    text += `   💭 Reason: ${conflict.reason}\n`;
                }
                text += '\n';
            });
        }

        // Show debate rounds
        if (debateRounds.length > 0) {
            text += `🔄 <b>DEBATE ROUNDS:</b>\n`;
            debateRounds.forEach((round, i) => {
                text += `Round ${i + 1}:\n`;
                text += `   🤖 ${round.agent}: ${round.argument.substring(0, 100)}${round.argument.length > 100 ? '...' : ''}\n`;
                if (round.confidence) {
                    text += `   💪 Confidence: ${(round.confidence * 100).toFixed(1)}%\n`;
                }
                text += '\n';
            });
        }

        // Show final consensus
        if (finalConsensus) {
            text += `🤝 <b>FINAL CONSENSUS:</b>\n`;
            text += `   🎯 Decision: ${finalConsensus.decision}\n`;
            text += `   💪 Confidence: ${(finalConsensus.confidence * 100).toFixed(1)}%\n`;
            text += `   📊 Agreement level: ${(finalConsensus.agreement * 100).toFixed(1)}%\n`;
            if (finalConsensus.rationale) {
                text += `   💭 Rationale: ${finalConsensus.rationale.substring(0, 150)}${finalConsensus.rationale.length > 150 ? '...' : ''}\n`;
            }
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };

        await this.sendMessage(message);
    }

    /**
     * Post signal processing analysis
     */
    async postSignalProcessing(
        roundId: string,
        signalAnalyses: any[],
        riskProfile: string
    ): Promise<void> {
        let text = `🎯 <b>SIGNAL PROCESSING ANALYSIS</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `🎛️ Risk Profile: ${riskProfile.toUpperCase()}\n`;
        text += `📊 Signals processed: ${signalAnalyses.length}\n\n`;

        // Show top signals
        const topSignals = signalAnalyses
            .sort((a, b) => Math.abs(b.overallSignal) - Math.abs(a.overallSignal))
            .slice(0, 5);

        text += `🏆 <b>TOP SIGNALS:</b>\n`;
        topSignals.forEach((signal, i) => {
            const signalEmoji = signal.overallSignal > 0 ? '🟢' : signal.overallSignal < 0 ? '🔴' : '🟡';
            const recommendation = signal.recommendation;
            const recEmoji = recommendation === 'BUY' ? '🟢' : recommendation === 'SELL' ? '🔴' : '🟡';

            text += `${i + 1}. ${signalEmoji} <b>${signal.ticker}</b>\n`;
            text += `   ${recEmoji} ${recommendation} (${(signal.overallSignal * 100).toFixed(1)}%)\n`;
            text += `   💪 Confidence: ${(signal.confidence * 100).toFixed(1)}%\n`;
            text += `   ⚠️ Risk Score: ${(signal.riskScore * 100).toFixed(1)}%\n`;
            text += `   📊 Position Size: ${(signal.positionSize * 100).toFixed(1)}%\n`;
            text += `   ⏰ Horizon: ${signal.timeHorizon}\n`;

            // Show component signals
            text += `   📈 Components:\n`;
            text += `      • Fundamental: ${(signal.fundamental * 100).toFixed(1)}%\n`;
            text += `      • Sentiment: ${(signal.sentiment * 100).toFixed(1)}%\n`;
            text += `      • Technical: ${(signal.technical * 100).toFixed(1)}%\n`;
            text += `      • Momentum: ${(signal.momentum * 100).toFixed(1)}%\n`;
            text += `      • Volatility: ${(signal.volatility * 100).toFixed(1)}%\n`;

            text += '\n';
        });

        // Show signal statistics
        const buySignals = signalAnalyses.filter(s => s.recommendation === 'BUY').length;
        const sellSignals = signalAnalyses.filter(s => s.recommendation === 'SELL').length;
        const holdSignals = signalAnalyses.filter(s => s.recommendation === 'HOLD').length;

        text += `📊 <b>SIGNAL STATISTICS:</b>\n`;
        text += `• 🟢 BUY signals: ${buySignals}\n`;
        text += `• 🔴 SELL signals: ${sellSignals}\n`;
        text += `• 🟡 HOLD signals: ${holdSignals}\n`;
        text += `• Average confidence: ${(signalAnalyses.reduce((sum, s) => sum + s.confidence, 0) / signalAnalyses.length * 100).toFixed(1)}%\n`;
        text += `• Average risk score: ${(signalAnalyses.reduce((sum, s) => sum + s.riskScore, 0) / signalAnalyses.length * 100).toFixed(1)}%\n`;

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };

        await this.sendMessage(message);
    }

    /**
     * Post Kelly Criterion and position sizing analysis
     */
    async postPositionSizingAnalysis(
        roundId: string,
        positionSizes: any[],
        marketImpact: any[]
    ): Promise<void> {
        let text = `📊 <b>POSITION SIZING ANALYSIS</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `🎯 Kelly Criterion applied\n`;
        text += `📈 Market impact calculated\n\n`;

        // Show position sizing details
        text += `💰 <b>POSITION SIZES:</b>\n`;
        positionSizes.forEach((pos, i) => {
            text += `${i + 1}. <b>${pos.ticker}</b>\n`;
            text += `   📊 Kelly Fraction: ${(pos.kellyFraction * 100).toFixed(2)}%\n`;
            text += `   🎯 Conservative Kelly: ${(pos.conservativeKelly * 100).toFixed(2)}%\n`;
            text += `   💪 Final Position: ${(pos.finalPosition * 100).toFixed(2)}%\n`;
            text += `   ⚠️ Risk Penalty: ${(pos.riskPenalty * 100).toFixed(1)}%\n`;
            text += `   🎛️ Confidence Adj: ${(pos.confidenceAdjustment * 100).toFixed(1)}%\n`;
            text += '\n';
        });

        // Show market impact analysis
        if (marketImpact.length > 0) {
            text += `📈 <b>MARKET IMPACT:</b>\n`;
            marketImpact.forEach((impact, i) => {
                text += `${i + 1}. <b>${impact.ticker}</b>\n`;
                text += `   💧 Slippage: ${(impact.slippage * 100).toFixed(3)}%\n`;
                text += `   📊 Market Impact: ${(impact.marketImpact * 100).toFixed(3)}%\n`;
                text += `   📏 Order Size: ${(impact.orderSize / impact.dailyVolume * 100).toFixed(2)}% of daily volume\n`;
                text += `   ⚡ Max Order: ${(impact.maxOrderSize / impact.dailyVolume * 100).toFixed(2)}% of daily volume\n`;
                text += '\n';
            });
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };

        await this.sendMessage(message);
    }

    /**
     * Post consensus results
     */
    async postConsensusResults(
        roundId: string,
        consensus: ConsensusRec[],
        conflicts: any[] = []
    ): Promise<void> {
        let text = `🎯 <b>CONSENSUS RESULTS</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `📊 ${consensus.length} recommendations generated\n\n`;

        // Show detailed consensus analysis
        for (let i = 0; i < Math.min(consensus.length, 8); i++) {
            const rec = consensus[i];
            if (!rec) continue;

            text += `<b>${i + 1}. ${rec.ticker}</b>\n`;
            text += `🎯 Final Score: ${(rec.finalScore * 100).toFixed(1)}%\n`;
            text += `💪 Avg Confidence: ${(rec.avgConfidence * 100).toFixed(1)}%\n`;
            text += `📈 Coverage: ${(rec.coverage * 100).toFixed(0)}%\n`;
            text += `💧 Liquidity: ${(rec.liquidity * 100).toFixed(1)}%\n`;
            text += `📋 Claims: ${rec.claims.length}\n`;

            // Show claim breakdown by agent
            const agentBreakdown = rec.claims.reduce((acc, claimId) => {
                // Since claims are just IDs, we'll show the count
                acc['total'] = (acc['total'] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            text += `🤖 Agent breakdown: `;
            Object.entries(agentBreakdown).forEach(([role, count], index) => {
                text += `${role}: ${count}`;
                if (index < Object.keys(agentBreakdown).length - 1) text += ', ';
            });
            text += '\n';

            // Show claim summary
            if (rec.claims.length > 0) {
                text += `💡 Claims: ${rec.claims.length} total\n`;
            }

            text += '\n';
        }

        // Show consensus summary
        if (consensus.length > 0) {
            const avgScore = consensus.reduce((sum, rec) => sum + rec.finalScore, 0) / consensus.length;
            const highScoreRecs = consensus.filter(rec => rec.finalScore > 0.7).length;

            text += `📊 <b>CONSENSUS SUMMARY:</b>\n`;
            text += `• Average final score: ${(avgScore * 100).toFixed(1)}%\n`;
            text += `• High confidence recommendations (>70%): ${highScoreRecs}/${consensus.length}\n`;
            text += `• Total claims processed: ${consensus.reduce((sum, rec) => sum + rec.claims.length, 0)}\n`;
        }

        if (conflicts.length > 0) {
            text += `\n⚠️ <b>CONFLICTS DETECTED:</b> ${conflicts.length}\n`;
            conflicts.forEach(conflict => {
                text += `• ${conflict.ticker}: ${conflict.severity} severity\n`;
                if (conflict.description) {
                    text += `  ${conflict.description}\n`;
                }
            });
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post risk assessment results
     */
    async postRiskAssessment(
        roundId: string,
        riskCheck: { ok: boolean; violations: any[]; warnings: any[] }
    ): Promise<void> {
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
            text += `✅ All risk checks passed - proceeding with execution`;
        } else {
            text += `❌ Risk checks failed - execution blocked`;
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post order execution results
     */
    async postOrderExecution(
        roundId: string,
        orders: Order[],
        positions: Position[]
    ): Promise<void> {
        let text = `📈 <b>ORDER EXECUTION</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `📋 ${orders.length} orders placed\n\n`;

        // Show executed orders
        if (orders.length > 0) {
            text += `<b>EXECUTED ORDERS:</b>\n`;
            orders.forEach((order, i) => {
                const side = order.side === 'buy' ? '🟢 BUY' : '🔴 SELL';
                text += `${i + 1}. ${side} ${order.quantity} ${order.symbol}\n`;
                text += `   💰 ${order.type} @ ${order.price || 'MARKET'}\n`;
                text += `   📊 Status: ${order.status}\n\n`;
            });
        }

        // Show current positions
        if (positions.length > 0) {
            text += `<b>CURRENT POSITIONS:</b>\n`;
            positions.forEach(position => {
                const pnlEmoji = position.unrealizedPnL >= 0 ? '📈' : '📉';
                text += `• ${position.symbol}: ${position.quantity}\n`;
                text += `  💰 Avg Price: $${position.avgPrice.toLocaleString()}\n`;
                text += `  ${pnlEmoji} PnL: $${position.unrealizedPnL.toLocaleString()}\n\n`;
            });
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post detailed decision process analysis
     */
    async postDecisionProcess(
        roundId: string,
        universe: string[],
        marketStats: any[],
        newsCount: number,
        evidenceCount: number,
        totalClaims: number,
        verifiedClaims: number,
        rejectedClaims: number
    ): Promise<void> {
        let text = `🧠 <b>DECISION PROCESS ANALYSIS</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `📅 ${new Date().toLocaleString()}\n\n`;

        text += `📊 <b>DATA INPUTS:</b>\n`;
        text += `• Universe: ${universe.length} assets (${universe.slice(0, 5).join(', ')}${universe.length > 5 ? '...' : ''})\n`;
        text += `• Market data: ${marketStats.length} assets analyzed\n`;
        text += `• News articles: ${newsCount} processed\n`;
        text += `• Evidence pieces: ${evidenceCount} collected\n\n`;

        text += `🤖 <b>AGENT ANALYSIS:</b>\n`;
        text += `• Total claims generated: ${totalClaims}\n`;
        text += `• Claims verified: ${verifiedClaims} (${totalClaims > 0 ? ((verifiedClaims / totalClaims) * 100).toFixed(1) : '0'}%)\n`;
        text += `• Claims rejected: ${rejectedClaims} (${totalClaims > 0 ? ((rejectedClaims / totalClaims) * 100).toFixed(1) : '0'}%)\n`;
        text += `• Verification rate: ${totalClaims > 0 ? ((verifiedClaims / totalClaims) * 100).toFixed(1) : '0'}%\n\n`;

        text += `🎯 <b>DECISION QUALITY:</b>\n`;
        const qualityScore = totalClaims > 0 ? (verifiedClaims / totalClaims) * 100 : 0;
        const qualityEmoji = qualityScore > 80 ? '🟢' : qualityScore > 60 ? '🟡' : '🔴';
        text += `${qualityEmoji} Data quality score: ${qualityScore.toFixed(1)}%\n`;

        if (qualityScore < 60) {
            text += `⚠️ Low data quality - consider manual review\n`;
        } else if (qualityScore > 80) {
            text += `✅ High data quality - automated decisions reliable\n`;
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };

        await this.sendMessage(message);
    }

    /**
     * Post comprehensive round summary
     */
    async postRoundSummary(summary: DecisionSummary): Promise<void> {
        const duration = Date.now() - summary.timestamp;
        const pnlEmoji = summary.performance.unrealizedPnL >= 0 ? '📈' : '📉';

        let text = `🎉 <b>TRADING ROUND COMPLETED</b>\n\n`;
        text += `🆔 Round ID: <code>${summary.roundId}</code>\n`;
        text += `⏱️ Duration: ${Math.round(duration / 1000)}s\n`;
        text += `🕐 Completed: ${new Date().toLocaleString()}\n\n`;

        text += `<b>📊 SUMMARY:</b>\n`;
        text += `• Claims Generated: ${summary.claims.length}\n`;
        text += `• Consensus Recs: ${summary.consensus.length}\n`;
        text += `• Orders Placed: ${summary.orders.length}\n`;
        text += `• Active Positions: ${summary.positions.length}\n\n`;

        text += `<b>💰 PERFORMANCE:</b>\n`;
        text += `• Portfolio Value: $${summary.performance.totalValue.toLocaleString()}\n`;
        text += `• ${pnlEmoji} Unrealized PnL: $${summary.performance.unrealizedPnL.toLocaleString()}\n`;
        text += `• 💵 Realized PnL: $${summary.performance.realizedPnL.toLocaleString()}\n\n`;

        // Show top performing positions
        if (summary.positions.length > 0) {
            text += `<b>🏆 TOP POSITIONS:</b>\n`;
            const sortedPositions = summary.positions
                .sort((a, b) => b.unrealizedPnL - a.unrealizedPnL)
                .slice(0, 3);

            sortedPositions.forEach((pos, i) => {
                const emoji = pos.unrealizedPnL >= 0 ? '🟢' : '🔴';
                text += `${i + 1}. ${emoji} ${pos.symbol}: $${pos.unrealizedPnL.toLocaleString()}\n`;
            });
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    { text: '📊 View Details', callback_data: `details_${summary.roundId}` },
                    { text: '📈 Portfolio', callback_data: `portfolio_${summary.roundId}` }
                ]]
            }
        };

        await this.sendMessage(message);
    }

    /**
     * Post emergency alert
     */
    async postEmergencyAlert(
        type: 'kill_switch' | 'risk_violation' | 'api_failure',
        details: string
    ): Promise<void> {
        const emoji = {
            kill_switch: '🛑',
            risk_violation: '🚨',
            api_failure: '⚠️'
        }[type];

        let text = `${emoji} <b>EMERGENCY ALERT</b>\n\n`;
        text += `🚨 Type: ${type.replace('_', ' ').toUpperCase()}\n`;
        text += `🕐 Time: ${new Date().toLocaleString()}\n`;
        text += `📝 Details: ${details}\n\n`;
        text += `⚡ All trading operations have been halted`;

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post daily performance report
     */
    async postDailyReport(
        totalRounds: number,
        successfulRounds: number,
        totalPnL: number,
        topPerformers: Array<{ symbol: string; pnl: number }>
    ): Promise<void> {
        const successRate = (successfulRounds / totalRounds * 100).toFixed(1);
        const pnlEmoji = totalPnL >= 0 ? '📈' : '📉';

        let text = `📅 <b>DAILY PERFORMANCE REPORT</b>\n\n`;
        text += `🕐 Date: ${new Date().toLocaleDateString()}\n`;
        text += `🔄 Total Rounds: ${totalRounds}\n`;
        text += `✅ Successful: ${successfulRounds} (${successRate}%)\n`;
        text += `${pnlEmoji} Total PnL: $${totalPnL.toLocaleString()}\n\n`;

        if (topPerformers.length > 0) {
            text += `<b>🏆 TOP PERFORMERS:</b>\n`;
            topPerformers.forEach((performer, i) => {
                const emoji = performer.pnl >= 0 ? '🟢' : '🔴';
                text += `${i + 1}. ${emoji} ${performer.symbol}: $${performer.pnl.toLocaleString()}\n`;
            });
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }
}
