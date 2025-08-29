// Export base classes and interfaces
export { BaseAgent, type AgentContext, type AgentResponse } from './base/base-agent.js';

// Export concrete agents
export { FundamentalAgent } from './implementations/fundamental-agent.js';
export { SentimentAgent } from './implementations/sentiment-agent.js';
export { TechnicalAnalysisAgent } from './implementations/technical-agent.js';

// Export factory and coordinator
export { AgentFactory } from '../factories/agent-factory.js';
export { AgentCoordinator, type DebateRound, type ConsensusResult } from './coordination/agent-coordinator.js';

// Export main service
export { AgentsService } from '../services/agents.js';
