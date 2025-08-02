import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from './base-agent';
import { MarketResearcher } from './market-researcher';
import { AudienceAnalyzer } from './audience-analyzer';
import { ContentStrategist } from './content-strategist';
import { AISEOOptimizer } from './ai-seo-optimizer';
import { ContentWriter } from './content-writer';
import { ContentEditor } from './content-editor';
import { SocialMediaSpecialist } from './social-media-specialist';
import { LandingPageSpecialist } from './landing-page-specialist';
import { PerformanceAnalyst } from './performance-analyst';

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent>;

  constructor() {
    this.agents = new Map([
      ['market-researcher', new MarketResearcher()],
      ['audience-analyzer', new AudienceAnalyzer()],
      ['content-strategist', new ContentStrategist()],
      ['ai-seo-optimizer', new AISEOOptimizer()],
      ['content-writer', new ContentWriter()],
      ['content-editor', new ContentEditor()],
      ['social-media-specialist', new SocialMediaSpecialist()],
      ['landing-page-specialist', new LandingPageSpecialist()],
      ['performance-analyst', new PerformanceAnalyst()]
    ]);
  }

  public async executeAgent(agentId: string, request: ContentGenerationRequest, context: any): Promise<any> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    console.log(`Executing agent: ${agentId}`);
    
    try {
      const result = await agent.execute(request, context);
      console.log(`Agent ${agentId} completed successfully`);
      return result;
    } catch (error) {
      console.error(`Agent ${agentId} failed:`, error);
      throw error;
    }
  }

  public getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  public async healthCheck(): Promise<Map<string, boolean>> {
    const health = new Map<string, boolean>();
    
    for (const [agentId, agent] of this.agents) {
      try {
        if (typeof agent.healthCheck === 'function') {
          await agent.healthCheck();
          health.set(agentId, true);
        } else {
          health.set(agentId, true); // Assume healthy if no health check method
        }
      } catch (error) {
        console.error(`Health check failed for agent ${agentId}:`, error);
        health.set(agentId, false);
      }
    }
    
    return health;
  }
}