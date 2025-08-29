import fs from 'fs';
import path from 'path';

export interface CapturedMessage {
    timestamp: string;
    message: string;
}

export interface CapturedAgentResponse {
    timestamp: string;
    role: string;
    context: {
        universe: string[];
        marketStats: number;
        facts: number;
        news: number;
    };
    response: {
        claims: any[];
        textPart?: string;
        jsonPart?: any;
        openaiResponse?: string;
        systemPrompt?: string;
        userPrompt?: string;
    };
}

export interface CapturedAgentPrompt {
    timestamp: string;
    role: string;
    context: {
        universe: string[];
        marketStats: number;
        facts: number;
        news: number;
        sampleMarketStats: any[];
        sampleFacts: any[];
        sampleNews: any[];
    };
    prompts: {
        systemPrompt: string;
        userPrompt: string;
    };
}

export class DevelopmentLoggerService {
    private isDevelopment = process.env.NODE_ENV === 'development';
    private capturedMessages: CapturedMessage[] = [];
    private capturedAgentResponses: CapturedAgentResponse[] = [];
    private capturedAgentPrompts: CapturedAgentPrompt[] = [];
    private roundId: string = '';

    constructor() {
        if (this.isDevelopment) {
            console.log('🔧 Development Logger Service initialized');
        }
    }

    setRoundId(roundId: string): void {
        this.roundId = roundId;
    }

    captureMessage(message: string): void {
        if (!this.isDevelopment) return;

        this.capturedMessages.push({
            timestamp: new Date().toISOString(),
            message
        });

        console.log('📱 CAPTURED MESSAGE:', message.substring(0, 100) + '...');
    }

    captureAgentResponse(role: string, context: any, response: any): void {
        if (!this.isDevelopment) return;

        this.capturedAgentResponses.push({
            timestamp: new Date().toISOString(),
            role,
            context: {
                universe: context.universe || [],
                marketStats: context.marketStats?.length || 0,
                facts: context.facts?.length || 0,
                news: context.news?.length || 0
            },
            response: {
                claims: response.claims || [],
                textPart: response.textPart,
                jsonPart: response.jsonPart,
                openaiResponse: response.openaiResponse,
                systemPrompt: response.systemPrompt,
                userPrompt: response.userPrompt
            }
        });

        console.log(`🤖 CAPTURED AGENT RESPONSE: ${role} agent (${response.claims?.length || 0} claims)`);
    }

    captureAgentPrompt(role: string, context: any, systemPrompt: string, userPrompt: string): void {
        if (!this.isDevelopment) return;

        this.capturedAgentPrompts.push({
            timestamp: new Date().toISOString(),
            role,
            context: {
                universe: context.universe || [],
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

        console.log(`🤖 CAPTURED AGENT PROMPT: ${role} agent (${systemPrompt.length + userPrompt.length} chars)`);
    }

    async saveDevelopmentData(): Promise<void> {
        if (!this.isDevelopment) return;

        const outputDir = path.join(process.cwd(), 'dev-outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const roundId = this.roundId || 'unknown';

        // Save messages
        if (this.capturedMessages.length > 0) {
            const messagesFile = path.join(outputDir, `messages-${roundId}-${timestamp}.txt`);
            let messagesContent = `🧪 DEVELOPMENT LOG - MESSAGES\n`;
            messagesContent += `================================================================================\n`;
            messagesContent += `Round ID: ${roundId}\n`;
            messagesContent += `Date: ${new Date().toLocaleString()}\n`;
            messagesContent += `Total Messages: ${this.capturedMessages.length}\n`;
            messagesContent += `================================================================================\n\n`;

            this.capturedMessages.forEach((msg, index) => {
                messagesContent += `📱 MESSAGE ${index + 1} (${msg.timestamp}):\n`;
                messagesContent += `────────────────────────────────────────────────────────────────\n`;
                messagesContent += `${msg.message}\n`;
                messagesContent += `────────────────────────────────────────────────────────────────\n\n`;
            });

            fs.writeFileSync(messagesFile, messagesContent, 'utf8');
            console.log(`💾 Development messages saved to: ${messagesFile}`);
        }

        // Save agent responses
        if (this.capturedAgentResponses.length > 0) {
            const responsesFile = path.join(outputDir, `agent-responses-${roundId}-${timestamp}.json`);
            const responsesContent = {
                roundId,
                date: new Date().toLocaleString(),
                totalResponses: this.capturedAgentResponses.length,
                responses: this.capturedAgentResponses
            };
            fs.writeFileSync(responsesFile, JSON.stringify(responsesContent, null, 2), 'utf8');
            console.log(`💾 Agent responses saved to: ${responsesFile}`);
        }

        // Save agent prompts
        if (this.capturedAgentPrompts.length > 0) {
            const promptsFile = path.join(outputDir, `agent-prompts-${roundId}-${timestamp}.json`);
            const promptsContent = {
                roundId,
                date: new Date().toLocaleString(),
                totalPrompts: this.capturedAgentPrompts.length,
                prompts: this.capturedAgentPrompts
            };
            fs.writeFileSync(promptsFile, JSON.stringify(promptsContent, null, 2), 'utf8');
            console.log(`💾 Agent prompts saved to: ${promptsFile}`);
        }

        // Save complete chain
        if (this.capturedAgentPrompts.length > 0) {
            const chainFile = path.join(outputDir, `agent-chain-${roundId}-${timestamp}.json`);
            const chainContent = {
                roundId,
                date: new Date().toLocaleString(),
                totalAgents: this.capturedAgentPrompts.length,
                chain: this.capturedAgentPrompts.map((prompt, index) => ({
                    agent: prompt.role,
                    timestamp: prompt.timestamp,
                    prompt: prompt,
                    response: this.capturedAgentResponses[index] || null
                }))
            };
            fs.writeFileSync(chainFile, JSON.stringify(chainContent, null, 2), 'utf8');
            console.log(`💾 Complete agent chain saved to: ${chainFile}`);
        }

        // Save summary
        const summaryFile = path.join(outputDir, `summary-${roundId}-${timestamp}.txt`);
        let summaryContent = `🧪 DEVELOPMENT LOG SUMMARY\n`;
        summaryContent += `================================================================================\n`;
        summaryContent += `Round ID: ${roundId}\n`;
        summaryContent += `Date: ${new Date().toLocaleString()}\n`;
        summaryContent += `Total Messages: ${this.capturedMessages.length}\n`;
        summaryContent += `Total Agent Responses: ${this.capturedAgentResponses.length}\n`;
        summaryContent += `Total Agent Prompts: ${this.capturedAgentPrompts.length}\n`;
        summaryContent += `================================================================================\n\n`;

        // Message summary
        if (this.capturedMessages.length > 0) {
            summaryContent += `📱 MESSAGE SUMMARY:\n`;
            this.capturedMessages.forEach((msg, index) => {
                const lines = msg.message.split('\n');
                const firstLine = lines[0] || 'No title';
                summaryContent += `${index + 1}. ${firstLine.substring(0, 80)}...\n`;
            });
            summaryContent += '\n';
        }

        // Agent summary
        if (this.capturedAgentResponses.length > 0) {
            summaryContent += `🤖 AGENT SUMMARY:\n`;
            const agentStats = this.capturedAgentResponses.reduce((acc, resp) => {
                acc[resp.role] = (acc[resp.role] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(agentStats).forEach(([role, count]) => {
                summaryContent += `${role}: ${count} responses\n`;
            });
            summaryContent += '\n';
        }

        fs.writeFileSync(summaryFile, summaryContent, 'utf8');
        console.log(`💾 Summary saved to: ${summaryFile}`);
    }

    clearData(): void {
        this.capturedMessages = [];
        this.capturedAgentResponses = [];
        this.capturedAgentPrompts = [];
        this.roundId = '';
    }

    getStats(): {
        messages: number;
        agentResponses: number;
        agentPrompts: number;
        roundId: string;
    } {
        return {
            messages: this.capturedMessages.length,
            agentResponses: this.capturedAgentResponses.length,
            agentPrompts: this.capturedAgentPrompts.length,
            roundId: this.roundId
        };
    }
}
