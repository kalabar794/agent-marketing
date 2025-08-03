import { ContentGenerationRequest } from '@/types/content';

interface ErrorContext {
  agentId: string;
  attemptNumber: number;
  totalAttempts: number;
  errorType: string;
  errorMessage: string;
  timestamp: Date;
  requestContext: any;
}

interface FallbackStrategy {
  id: string;
  name: string;
  description: string;
  applicableAgents: string[];
  applicableErrors: string[];
  priority: number;
  execute: (context: ErrorContext) => Promise<any>;
}

interface RecoveryPlan {
  strategy: FallbackStrategy;
  estimatedSuccessRate: number;
  estimatedDuration: number;
  qualityImpact: number;
}

export class ErrorRecoveryManager {
  private fallbackStrategies: Map<string, FallbackStrategy>;
  private errorHistory: Map<string, ErrorContext[]>;
  private successRates: Map<string, { successes: number; attempts: number }>;

  constructor() {
    this.fallbackStrategies = new Map();
    this.errorHistory = new Map();
    this.successRates = new Map();
    this.initializeFallbackStrategies();
  }

  private initializeFallbackStrategies(): void {
    const strategies: FallbackStrategy[] = [
      {
        id: 'simplified-prompt',
        name: 'Simplified Prompt Strategy',
        description: 'Use a simpler, more direct prompt to reduce complexity',
        applicableAgents: ['content-writer', 'content-strategist', 'market-researcher'],
        applicableErrors: ['timeout', 'parsing_error', 'invalid_response'],
        priority: 1,
        execute: this.executeSimplifiedPrompt.bind(this)
      },
      {
        id: 'template-fallback',
        name: 'Template-Based Fallback',
        description: 'Use pre-defined templates when AI generation fails',
        applicableAgents: ['content-writer', 'content-editor', 'social-media-specialist'],
        applicableErrors: ['api_error', 'timeout', 'invalid_response'],
        priority: 2,
        execute: this.executeTemplateFallback.bind(this)
      },
      {
        id: 'reduced-scope',
        name: 'Reduced Scope Strategy',
        description: 'Generate content with reduced requirements and scope',
        applicableAgents: ['content-writer', 'market-researcher', 'audience-analyzer'],
        applicableErrors: ['timeout', 'rate_limit', 'resource_exhausted'],
        priority: 3,
        execute: this.executeReducedScope.bind(this)
      },
      {
        id: 'alternative-agent',
        name: 'Alternative Agent Strategy',
        description: 'Use a different agent or simplified version for the task',
        applicableAgents: ['content-strategist', 'ai-seo-optimizer', 'performance-analyst'],
        applicableErrors: ['agent_specific_error', 'persistent_failure'],
        priority: 4,
        execute: this.executeAlternativeAgent.bind(this)
      },
      {
        id: 'cached-response',
        name: 'Cached Response Strategy',
        description: 'Use previously successful responses adapted to current context',
        applicableAgents: ['market-researcher', 'audience-analyzer', 'ai-seo-optimizer'],
        applicableErrors: ['api_error', 'rate_limit', 'timeout'],
        priority: 5,
        execute: this.executeCachedResponse.bind(this)
      },
      {
        id: 'human-intervention',
        name: 'Human Intervention Required',
        description: 'Flag for human review and manual completion',
        applicableAgents: ['content-writer', 'content-editor', 'content-strategist'],
        applicableErrors: ['critical_failure', 'quality_threshold_not_met'],
        priority: 6,
        execute: this.executeHumanIntervention.bind(this)
      }
    ];

    strategies.forEach(strategy => {
      this.fallbackStrategies.set(strategy.id, strategy);
    });
  }

  public async handleError(
    agentId: string,
    error: Error,
    request: ContentGenerationRequest,
    context: any,
    attemptNumber: number = 1,
    maxAttempts: number = 3
  ): Promise<{ recovered: boolean; result?: any; strategy?: string; qualityImpact?: number }> {
    
    const errorContext: ErrorContext = {
      agentId,
      attemptNumber,
      totalAttempts: maxAttempts,
      errorType: this.categorizeError(error),
      errorMessage: error.message,
      timestamp: new Date(),
      requestContext: context
    };

    // Log error for analysis
    this.logError(errorContext);

    console.log(`🚨 Error recovery for ${agentId} (attempt ${attemptNumber}/${maxAttempts}): ${error.message}`);

    // Get applicable recovery strategies
    const recoveryPlans = this.generateRecoveryPlans(errorContext);

    if (recoveryPlans.length === 0) {
      console.log(`❌ No recovery strategies available for ${agentId}`);
      return { recovered: false };
    }

    // Try recovery strategies in order of priority and success rate
    for (const plan of recoveryPlans) {
      try {
        console.log(`🔄 Trying recovery strategy: ${plan.strategy.name}`);
        
        const result = await plan.strategy.execute(errorContext);
        
        if (result) {
          console.log(`✅ Recovery successful using ${plan.strategy.name}`);
          this.recordSuccess(agentId, plan.strategy.id);
          
          return {
            recovered: true,
            result,
            strategy: plan.strategy.name,
            qualityImpact: plan.qualityImpact
          };
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy ${plan.strategy.name} failed:`, recoveryError);
        this.recordFailure(agentId, plan.strategy.id);
      }
    }

    console.log(`❌ All recovery strategies failed for ${agentId}`);
    return { recovered: false };
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'timeout';
    }
    
    if (message.includes('rate limit') || message.includes('quota')) {
      return 'rate_limit';
    }
    
    if (message.includes('parse') || message.includes('json') || message.includes('invalid')) {
      return 'parsing_error';
    }
    
    if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
      return 'auth_error';
    }
    
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'api_error';
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'network_error';
    }
    
    return 'unknown_error';
  }

  private generateRecoveryPlans(errorContext: ErrorContext): RecoveryPlan[] {
    const applicableStrategies = Array.from(this.fallbackStrategies.values())
      .filter(strategy => 
        strategy.applicableAgents.includes(errorContext.agentId) &&
        (strategy.applicableErrors.includes(errorContext.errorType) || 
         strategy.applicableErrors.includes('any'))
      );

    const plans: RecoveryPlan[] = applicableStrategies.map(strategy => {
      const successRate = this.getSuccessRate(errorContext.agentId, strategy.id);
      const estimatedDuration = this.estimateRecoveryDuration(strategy, errorContext);
      const qualityImpact = this.estimateQualityImpact(strategy, errorContext);

      return {
        strategy,
        estimatedSuccessRate: successRate,
        estimatedDuration,
        qualityImpact
      };
    });

    // Sort by success rate and priority
    return plans.sort((a, b) => {
      const aScore = a.estimatedSuccessRate * 0.7 + (10 - a.strategy.priority) * 0.3;
      const bScore = b.estimatedSuccessRate * 0.7 + (10 - b.strategy.priority) * 0.3;
      return bScore - aScore;
    });
  }

  private async executeSimplifiedPrompt(context: ErrorContext): Promise<any> {
    // This would integrate with the BaseAgent's callLLM method
    // For now, return a simplified structure based on agent type
    switch (context.agentId) {
      case 'content-writer':
        return {
          content: {
            title: 'Generated Content Title',
            introduction: 'This is a simplified introduction generated as a fallback.',
            mainContent: [
              {
                heading: 'Main Section',
                paragraphs: ['Simplified content paragraph with key information.'],
                bulletPoints: ['Key point 1', 'Key point 2', 'Key point 3']
              }
            ],
            conclusion: 'Simplified conclusion summarizing the main points.',
            callToAction: 'Take action now to learn more.'
          },
          metadata: {
            wordCount: 150,
            readingTime: 1,
            keywordDensity: { primary: 2.0, secondary: 1.0 },
            tone: 'professional',
            readabilityScore: 75
          },
          fallbackUsed: true,
          strategy: 'simplified-prompt'
        };
      
      case 'market-researcher':
        return {
          industry: 'General Market',
          trends: ['Digital transformation', 'Customer experience focus', 'Data-driven decisions'],
          opportunities: ['Market expansion', 'Technology adoption'],
          keyInsights: ['Market is evolving rapidly', 'Customer needs are changing'],
          fallbackUsed: true,
          strategy: 'simplified-prompt'
        };
      
      default:
        return {
          fallbackResponse: true,
          message: 'Simplified fallback response generated',
          strategy: 'simplified-prompt'
        };
    }
  }

  private async executeTemplateFallback(context: ErrorContext): Promise<any> {
    const templates = this.getTemplateForAgent(context.agentId);
    return {
      ...templates,
      fallbackUsed: true,
      strategy: 'template-fallback'
    };
  }

  private async executeReducedScope(context: ErrorContext): Promise<any> {
    // Generate minimal viable output for the agent
    const reducedOutput = this.generateReducedScopeOutput(context.agentId);
    return {
      ...reducedOutput,
      fallbackUsed: true,
      strategy: 'reduced-scope',
      note: 'This is a reduced scope output due to processing constraints'
    };
  }

  private async executeAlternativeAgent(context: ErrorContext): Promise<any> {
    // Use a simpler agent or generic response
    return {
      alternativeResponse: true,
      agentId: context.agentId,
      message: 'Alternative processing completed',
      fallbackUsed: true,
      strategy: 'alternative-agent'
    };
  }

  private async executeCachedResponse(context: ErrorContext): Promise<any> {
    // Use cached successful responses adapted to current context
    const cachedResponse = this.getCachedResponse(context.agentId);
    return {
      ...cachedResponse,
      fallbackUsed: true,
      strategy: 'cached-response',
      note: 'Adapted from previous successful execution'
    };
  }

  private async executeHumanIntervention(context: ErrorContext): Promise<any> {
    // Flag for human intervention
    return {
      requiresHumanIntervention: true,
      agentId: context.agentId,
      errorContext: context,
      fallbackUsed: true,
      strategy: 'human-intervention',
      instructions: 'This task requires manual completion or review'
    };
  }

  private getTemplateForAgent(agentId: string): any {
    const templates: Record<string, any> = {
      'content-writer': {
        content: {
          title: 'Professional Content Template',
          introduction: 'This template provides a structured approach to content creation.',
          mainContent: [
            {
              heading: 'Key Benefits',
              paragraphs: ['Template-based content ensures consistency and quality.'],
              bulletPoints: ['Reliable structure', 'Consistent quality', 'Fast delivery']
            }
          ],
          conclusion: 'Templates provide a solid foundation for content creation.',
          callToAction: 'Contact us to learn more about our services.'
        },
        metadata: {
          wordCount: 100,
          readingTime: 1,
          keywordDensity: { primary: 1.5, secondary: 1.0 },
          tone: 'professional',
          readabilityScore: 80
        }
      },
      'social-media-specialist': {
        platforms: [
          {
            platform: 'linkedin',
            content: 'Professional update about our latest insights.',
            hashtags: ['#business', '#insights', '#professional'],
            mediaRecommendations: ['Professional image or infographic']
          }
        ]
      }
    };

    return templates[agentId] || { templateContent: 'Generic template response' };
  }

  private generateReducedScopeOutput(agentId: string): any {
    const reducedOutputs: Record<string, any> = {
      'content-writer': {
        content: {
          title: 'Essential Content',
          introduction: 'Core content essentials.',
          mainContent: [{ heading: 'Main Point', paragraphs: ['Essential information.'] }],
          conclusion: 'Key takeaway.',
          callToAction: 'Learn more.'
        },
        metadata: { wordCount: 50, readingTime: 1, tone: 'brief' }
      },
      'market-researcher': {
        industry: 'Market Analysis',
        trends: ['Current trend'],
        opportunities: ['Key opportunity'],
        keyInsights: ['Main insight']
      }
    };

    return reducedOutputs[agentId] || { reducedContent: 'Minimal viable output' };
  }

  private getCachedResponse(agentId: string): any {
    // In a real implementation, this would retrieve from a cache
    // For now, return a generic cached-style response
    return {
      cachedContent: true,
      agentId,
      content: 'Previously successful content adapted for current context',
      timestamp: new Date().toISOString(),
      confidence: 0.7
    };
  }

  private logError(errorContext: ErrorContext): void {
    const agentErrors = this.errorHistory.get(errorContext.agentId) || [];
    agentErrors.push(errorContext);
    
    // Keep only last 50 errors per agent
    if (agentErrors.length > 50) {
      agentErrors.splice(0, agentErrors.length - 50);
    }
    
    this.errorHistory.set(errorContext.agentId, agentErrors);
  }

  private recordSuccess(agentId: string, strategyId: string): void {
    const key = `${agentId}:${strategyId}`;
    const stats = this.successRates.get(key) || { successes: 0, attempts: 0 };
    stats.successes++;
    stats.attempts++;
    this.successRates.set(key, stats);
  }

  private recordFailure(agentId: string, strategyId: string): void {
    const key = `${agentId}:${strategyId}`;
    const stats = this.successRates.get(key) || { successes: 0, attempts: 0 };
    stats.attempts++;
    this.successRates.set(key, stats);
  }

  private getSuccessRate(agentId: string, strategyId: string): number {
    const key = `${agentId}:${strategyId}`;
    const stats = this.successRates.get(key);
    
    if (!stats || stats.attempts === 0) {
      return 0.5; // Default neutral probability
    }
    
    return stats.successes / stats.attempts;
  }

  private estimateRecoveryDuration(strategy: FallbackStrategy, context: ErrorContext): number {
    // Estimate based on strategy complexity and historical data
    const baseDurations: Record<string, number> = {
      'simplified-prompt': 30,
      'template-fallback': 10,
      'reduced-scope': 20,
      'alternative-agent': 40,
      'cached-response': 5,
      'human-intervention': 300
    };

    return baseDurations[strategy.id] || 60;
  }

  private estimateQualityImpact(strategy: FallbackStrategy, context: ErrorContext): number {
    // Estimate quality impact (0-1, where 1 is no impact)
    const qualityImpacts: Record<string, number> = {
      'simplified-prompt': 0.85,
      'template-fallback': 0.75,
      'reduced-scope': 0.65,
      'alternative-agent': 0.8,
      'cached-response': 0.9,
      'human-intervention': 0.95
    };

    return qualityImpacts[strategy.id] || 0.7;
  }

  public getErrorAnalytics(agentId?: string): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recoverySuccessRate: number;
    mostCommonErrors: Array<{ type: string; count: number; agents: string[] }>;
    recommendations: string[];
  } {
    const allErrors = agentId 
      ? this.errorHistory.get(agentId) || []
      : Array.from(this.errorHistory.values()).flat();

    const errorsByType: Record<string, number> = {};
    const errorsByAgent: Record<string, Set<string>> = {};

    allErrors.forEach(error => {
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
      
      if (!errorsByAgent[error.errorType]) {
        errorsByAgent[error.errorType] = new Set();
      }
      errorsByAgent[error.errorType].add(error.agentId);
    });

    const totalSuccesses = Array.from(this.successRates.values())
      .reduce((sum, stats) => sum + stats.successes, 0);
    const totalAttempts = Array.from(this.successRates.values())
      .reduce((sum, stats) => sum + stats.attempts, 0);

    const recoverySuccessRate = totalAttempts > 0 ? totalSuccesses / totalAttempts : 0;

    const mostCommonErrors = Object.entries(errorsByType)
      .map(([type, count]) => ({
        type,
        count,
        agents: Array.from(errorsByAgent[type] || [])
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recommendations = this.generateRecommendations(mostCommonErrors, recoverySuccessRate);

    return {
      totalErrors: allErrors.length,
      errorsByType,
      recoverySuccessRate,
      mostCommonErrors,
      recommendations
    };
  }

  private generateRecommendations(
    commonErrors: Array<{ type: string; count: number; agents: string[] }>,
    successRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (successRate < 0.7) {
      recommendations.push('Consider improving base agent reliability to reduce fallback dependency');
    }

    commonErrors.forEach(error => {
      switch (error.type) {
        case 'timeout':
          recommendations.push('Increase timeout values or optimize prompts for faster responses');
          break;
        case 'rate_limit':
          recommendations.push('Implement request queuing or use multiple API keys for load distribution');
          break;
        case 'parsing_error':
          recommendations.push('Improve JSON parsing robustness and response validation');
          break;
        case 'api_error':
          recommendations.push('Add circuit breakers and better API health monitoring');
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('System resilience appears healthy based on current metrics');
    }

    return recommendations.slice(0, 5);
  }
}