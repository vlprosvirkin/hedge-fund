import type {
    Claim,
    ConsensusRec,
    Position,
    Order,
    PipelineArtifact,
    Evidence,
    NewsItem
} from '../../types/index.js';
import { TelegramAdapter } from '../../adapters/telegram-adapter.js';
import type { TelegramMessage } from '../../adapters/telegram-adapter.js';
import { formatEvidenceForDisplay, createEvidenceMap, createNewsMap } from '../../utils/evidence-utils.js';
import { NotificationFormats } from './notification-formats.js';
import { DevelopmentLoggerService } from '../development-logger.service.js';

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

export class NotificationsService {
    private devLogger: DevelopmentLoggerService;

    constructor(private telegramAdapter: TelegramAdapter) {
        this.devLogger = new DevelopmentLoggerService();
    }

    /**
     * Send message with basic formatting
     */
    private async sendFormattedMessage(text: string, disablePreview: boolean = false): Promise<void> {
        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: disablePreview
        };

        // Capture message for development logging
        this.devLogger.captureMessage(text);

        await this.telegramAdapter.sendMessage(message);
    }

    /**
     * Post trading round start notification
     */
    async postRoundStart(roundId: string, universe: string[]): Promise<void> {
        const text = NotificationFormats.roundStart(roundId, universe);
        await this.sendFormattedMessage(text);
    }

    /**
     * Post Kelly Criterion and position sizing analysis (simplified)
     */
    async postPositionSizingAnalysis(
        roundId: string,
        positionSizes: any[],
        marketImpact: any[]
    ): Promise<void> {
        // Skip this message - will be included in final summary
        return;
    }

    /**
     * Post risk assessment results (simplified)
     */
    async postRiskAssessment(
        roundId: string,
        riskCheck: { ok: boolean; violations: any[]; warnings: any[] }
    ): Promise<void> {
        // Skip this message - will be included in final summary
        return;
    }

    /**
     * Post order execution results (simplified)
     */
    async postOrderExecution(
        roundId: string,
        orders: Order[],
        positions: Position[]
    ): Promise<void> {
        // Skip this message - will be included in final summary
        return;
    }

    /**
     * Post detailed decision process analysis (simplified)
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
        // Skip this message - will be included in final summary
        return;
    }

    /**
     * Post emergency alert
     */
    async postEmergencyAlert(
        type: 'kill_switch' | 'risk_violation' | 'api_failure',
        details: string
    ): Promise<void> {
        const text = NotificationFormats.emergencyAlert(type, details);
        await this.sendFormattedMessage(text);
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
        text += `🔄 Total rounds: ${totalRounds}\n`;
        text += `✅ Successful: ${successfulRounds} (${successRate}%)\n`;
        text += `${pnlEmoji} Total PnL: $${totalPnL.toLocaleString()}\n\n`;

        if (topPerformers.length > 0) {
            text += `<b>🏆 TOP PERFORMERS:</b>\n`;
            topPerformers.forEach((performer, i) => {
                const emoji = performer.pnl >= 0 ? '🟢' : '🔴';
                text += `${i + 1}. ${emoji} ${performer.symbol}: $${performer.pnl.toLocaleString()}\n`;
            });
        }

        await this.sendFormattedMessage(text);
    }

    /**
     * Agent analysis with AI reasoning and debate context
     */
    async postAgentAnalysis(
        roundId: string,
        agentRole: string,
        claims: Claim[],
        processingTime: number,
        openaiResponse?: string,
        debateContext?: any,
        evidence?: Evidence[],
        newsItems?: NewsItem[],
        textPart?: string,
        jsonPart?: any
    ): Promise<void> {
        // Extract analysis from response
        const analysis = this.extractAgentAnalysis(agentRole, textPart || openaiResponse || '');

        // Create evidence map for quick lookup
        const evidenceMap = new Map<string, Evidence>();
        if (evidence) {
            evidence.forEach(ev => evidenceMap.set(ev.id || 'unknown', ev));
        }

        const text = NotificationFormats.agentAnalysis(
            roundId,
            agentRole,
            analysis,
            claims,
            processingTime,
            evidenceMap
        );

        await this.sendFormattedMessage(text, true);
    }

    /**
     * Agent debate with real conversation flow
     */
    async postAgentDebate(
        roundId: string,
        conflicts: any[],
        debateRounds: any[],
        finalConsensus: any
    ): Promise<void> {
        const text = NotificationFormats.agentDebate(roundId, conflicts, debateRounds, finalConsensus);
        await this.sendFormattedMessage(text, true);
    }

    /**
     * Complete agent analysis in one message
     */
    async postAgentCompleteAnalysis(
        roundId: string,
        agentRole: string,
        claims: Claim[],
        analysis: string,
        evidence?: Evidence[],
        context?: any
    ): Promise<void> {
        // Create evidence map for quick lookup
        const evidenceMap = new Map<string, Evidence>();
        if (evidence) {
            evidence.forEach(ev => evidenceMap.set(ev.id || 'unknown', ev));
        }

        const text = NotificationFormats.agentCompleteAnalysis(
            roundId,
            agentRole,
            claims,
            analysis,
            evidenceMap,
            context
        );

        await this.sendFormattedMessage(text, true);
    }

    /**
     * Signal Analyst logic and position sizing
     */
    async postSignalAnalysis(
        roundId: string,
        signalAnalysis: any,
        riskProfile: string
    ): Promise<void> {
        const text = NotificationFormats.signalAnalysis(roundId, signalAnalysis, riskProfile);
        await this.sendFormattedMessage(text, true);
    }

    /**
     * Portfolio summary and transactions
     */
    async postPortfolioSummary(
        roundId: string,
        portfolio: any,
        transactions: any[] = [],
        orders: any[] = []
    ): Promise<void> {
        const text = NotificationFormats.portfolioSummary(roundId, portfolio, transactions, orders);
        await this.sendFormattedMessage(text, true);
    }

    /**
     * Signal processing with market insights
     */
    async postSignalProcessing(
        roundId: string,
        signalAnalyses: any[],
        riskProfile: string
    ): Promise<void> {
        let text = `🎯 <b>MARKET SIGNAL ANALYSIS</b>\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `🎛️ Risk Profile: ${riskProfile.toUpperCase()}\n`;
        text += `📊 <i>Combined analysis from all agents with risk-adjusted position sizing</i>\n\n`;

        // Show top signals with market context
        const topSignals = signalAnalyses
            .sort((a, b) => Math.abs(b.overallSignal) - Math.abs(a.overallSignal))
            .slice(0, 3);

        text += `🏆 <b>TOP MARKET OPPORTUNITIES:</b>\n\n`;
        topSignals.forEach((signal, i) => {
            const signalEmoji = signal.overallSignal > 0.1 ? '🚀' : signal.overallSignal < -0.1 ? '📉' : '⏸️';
            const strength = Math.abs(signal.overallSignal);
            const strengthText = strength > 0.5 ? 'STRONG' : strength > 0.2 ? 'MODERATE' : 'WEAK';

            text += `${i + 1}. ${signalEmoji} <b>${signal.ticker}</b>\n`;
            text += `   💪 Signal Strength: ${strengthText} (${(signal.overallSignal * 100).toFixed(1)}%)\n`;
            text += `   🎯 Recommendation: ${signal.recommendation}\n`;
            text += `   ⚠️ Risk Level: ${(signal.riskScore * 100).toFixed(1)}%\n`;
            text += `   📊 Position Size: ${(signal.positionSize * 100).toFixed(1)}%\n\n`;
        });

        // Market overview
        const buySignals = signalAnalyses.filter(s => s.recommendation === 'BUY').length;
        const sellSignals = signalAnalyses.filter(s => s.recommendation === 'SELL').length;
        const avgConfidence = signalAnalyses.reduce((sum, s) => sum + s.confidence, 0) / signalAnalyses.length;

        text += `📊 <b>MARKET OVERVIEW:</b>\n`;
        text += `• 🚀 Bullish signals: ${buySignals}\n`;
        text += `• 📉 Bearish signals: ${sellSignals}\n`;
        text += `• 💪 Average confidence: ${(avgConfidence * 100).toFixed(1)}%\n`;

        if (buySignals > sellSignals * 2) {
            text += `• 📈 Market sentiment: Strongly bullish\n`;
        } else if (buySignals > sellSignals) {
            text += `• 📈 Market sentiment: Moderately bullish\n`;
        } else if (sellSignals > buySignals * 2) {
            text += `• 📉 Market sentiment: Strongly bearish\n`;
        } else if (sellSignals > buySignals) {
            text += `• 📉 Market sentiment: Moderately bearish\n`;
        } else {
            text += `• ⏸️ Market sentiment: Neutral\n`;
        }

        await this.sendFormattedMessage(text, true);
    }

    /**
     * Separate debate summary with detailed dialogue
     */
    async postAgentDebateSummary(
        roundId: string,
        conflicts: any[],
        debateRounds: any[],
        consensus: ConsensusRec[]
    ): Promise<void> {
        let text = `🗣️ <b>AGENT DEBATE SUMMARY</b>\n`;
        text += `🆔 Round: <code>${roundId}</code>\n\n`;

        // Debate overview
        text += `📊 <b>DEBATE OVERVIEW</b>\n`;
        text += `• Total conflicts: ${conflicts.length}\n`;
        text += `• Debate rounds: ${debateRounds.length}\n`;
        text += `• Consensus points: ${consensus.length}\n\n`;

        // Show conflicts summary
        if (conflicts.length > 0) {
            text += `⚔️ <b>CONFLICT SUMMARY</b>\n`;
            conflicts.forEach((conflict, index) => {
                text += `${index + 1}. <b>${conflict.ticker}</b>\n`;
                text += `   • ${conflict.agent1}: ${conflict.claim1}\n`;
                text += `   • ${conflict.agent2}: ${conflict.claim2}\n`;
                text += `   • Resolution: ${conflict.resolution || 'Pending'}\n\n`;
            });
        }

        // Show debate dialogue
        if (debateRounds.length > 0) {
            text += `🔄 <b>DEBATE DIALOGUE</b>\n`;
            debateRounds.forEach((round, index) => {
                const agentEmoji = round.agent === 'fundamental' ? '📊' :
                    round.agent === 'sentiment' ? '📰' : '📈';
                text += `${agentEmoji} <b>AGENT ${round.agent.toUpperCase()}:</b>\n`;
                text += `<i>"${round.argument}"</i>\n\n`;
            });
        }

        // Show consensus summary
        text += `🤝 <b>CONSENSUS SUMMARY</b>\n`;
        consensus.forEach((item, index) => {
            // Use configurable thresholds - default to neutral profile
            const thresholds = { buy: 0.1, sell: -0.1 }; // Default neutral thresholds
            const decision = item.finalScore > thresholds.buy ? 'BUY' : item.finalScore < thresholds.sell ? 'SELL' : 'HOLD';
            const confidence = Math.abs(item.finalScore) * 100;

            text += `${index + 1}. ${decision === 'BUY' ? '🚀' : decision === 'SELL' ? '📉' : '⏸️'} <b>${item.ticker}</b>\n`;
            text += `   • Decision: ${decision}\n`;
            text += `   • Confidence: ${confidence.toFixed(1)}%\n`;
            text += `   • Coverage: ${(item.coverage * 100).toFixed(1)}%\n`;
            text += `   • Liquidity: ${(item.liquidity * 100).toFixed(1)}%\n\n`;
        });

        await this.sendFormattedMessage(text, true);
    }

    /**
     * Consensus results with portfolio impact (simplified)
     */
    async postConsensusResults(
        roundId: string,
        consensus: ConsensusRec[],
        conflicts: any[] = []
    ): Promise<void> {
        // Skip this message - will be included in debate summary
        return;
    }

    /**
     * Round completion with performance insights
     */
    async postRoundCompletion(
        roundId: string,
        summary: DecisionSummary
    ): Promise<void> {
        const text = NotificationFormats.roundCompletion(roundId, summary);
        await this.sendFormattedMessage(text, true);
    }

    /**
     * Enhanced round completion with detailed signal results and price targets
     */
    async postRoundCompletionWithResults(
        roundId: string,
        summary: DecisionSummary,
        results: any[] = []
    ): Promise<void> {
        const text = NotificationFormats.roundCompletionWithResults(roundId, summary, results);
        await this.sendFormattedMessage(text, true);
    }

    // Приватные методы форматирования
    private extractAgentAnalysis(agentRole: string, content: string): string {
        if (!content) return '';

        try {
            let analysis = '';

            if (agentRole === 'sentiment') {
                analysis = this.extractSentimentAnalysis(content);
            } else if (agentRole === 'fundamental') {
                analysis = this.extractFundamentalAnalysis(content);
            } else if (agentRole === 'technical') {
                analysis = this.extractTechnicalAnalysis(content);
            }

            if (!analysis) {
                analysis = this.extractAIAnalysisFromResponse(content);
            }

            return analysis;
        } catch (error) {
            console.log(`🔍 Telegram: Failed to extract analysis for ${agentRole}: ${error}`);
            return '';
        }
    }

    private extractSentimentAnalysis(content: string): string {
        try {
            // Look for SUMMARIZE section in Sentiment Agent response
            const summarizeMatch = content.match(/SUMMARIZE:\s*([\s\S]*?)(?=\n\n|\n\{|$)/i);
            if (summarizeMatch && summarizeMatch[1]) {
                return summarizeMatch[1].trim();
            }

            // Fallback: extract text before JSON
            const lines = content.split('\n');
            let analysis = '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('"claims"') || trimmed.includes('"ticker"')) {
                    break;
                }
                if (trimmed.length > 0) {
                    analysis += trimmed + '\n';
                }
            }

            return analysis.trim();
        } catch (error) {
            console.log(`🔍 Telegram: Failed to extract sentiment analysis: ${error}`);
            return '';
        }
    }

    private extractFundamentalAnalysis(content: string): string {
        try {
            // Look for FUNDAMENTAL ANALYSIS section
            const fundamentalMatch = content.match(/FUNDAMENTAL ANALYSIS:\s*([\s\S]*?)(?=\n\n|\n\{|$)/i);
            if (fundamentalMatch && fundamentalMatch[1]) {
                return fundamentalMatch[1].trim();
            }

            // Fallback: try to extract any text before JSON
            const lines = content.split('\n');
            let analysis = '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('"claims"') || trimmed.includes('"ticker"')) {
                    break;
                }
                if (trimmed.length > 0 && !trimmed.startsWith('Here is the JSON') && !trimmed.startsWith('JSON format')) {
                    analysis += trimmed + '\n';
                }
            }

            return analysis.trim();
        } catch (error) {
            console.log(`🔍 Telegram: Failed to extract fundamental analysis: ${error}`);
            return '';
        }
    }

    private extractTechnicalAnalysis(content: string): string {
        try {
            // Look for TECHNICAL ANALYSIS section
            const technicalMatch = content.match(/TECHNICAL ANALYSIS:\s*([\s\S]*?)(?=\n\n|\n\{|$)/i);
            if (technicalMatch && technicalMatch[1]) {
                return technicalMatch[1].trim();
            }

            // Fallback: try to extract any text before JSON
            const lines = content.split('\n');
            let analysis = '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('"claims"') || trimmed.includes('"ticker"')) {
                    break;
                }
                if (trimmed.length > 0 && !trimmed.startsWith('Here is the JSON') && !trimmed.startsWith('JSON format')) {
                    analysis += trimmed + '\n';
                }
            }

            return analysis.trim();
        } catch (error) {
            console.log(`🔍 Telegram: Failed to extract technical analysis: ${error}`);
            return '';
        }
    }

    private extractAIAnalysisFromResponse(openaiResponse: string): string {
        if (!openaiResponse) return '';

        // Try to extract human-readable analysis before JSON
        const lines = openaiResponse.split('\n');
        const analysisLines: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();

            // Stop when we hit JSON
            if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"claims"')) {
                break;
            }

            // Also stop when we hit JSON-like patterns
            if (trimmed.includes('"ticker"') || trimmed.includes('"agentRole"') || trimmed.includes('"claim"')) {
                break;
            }

            // Stop when we hit "Here is the JSON" or similar
            if (trimmed.toLowerCase().includes('here is the json') || trimmed.toLowerCase().includes('json array')) {
                break;
            }

            // Skip empty lines and markdown
            if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('```')) {
                continue;
            }

            // Collect meaningful analysis lines
            if (trimmed.length > 10) {
                analysisLines.push(trimmed);
            }
        }

        return analysisLines.join('\n');
    }
}