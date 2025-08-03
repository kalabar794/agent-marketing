import { ContentGenerationRequest } from '@/types/content';
import { BaseAgent } from '../agents/base-agent';

interface QualityMetrics {
  contentQuality: number;
  seoOptimization: number;
  brandAlignment: number;
  engagementPotential: number;
  technicalAccuracy: number;
  overallScore: number;
}

interface OptimizationSuggestion {
  agentId: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
}

interface EvaluationResult {
  agentId: string;
  output: any;
  metrics: QualityMetrics;
  suggestions: OptimizationSuggestion[];
  shouldRetry: boolean;
  retryInstructions?: string;
}

export class EvaluatorOptimizer extends BaseAgent {
  private qualityThreshold: number = 0.75;
  private maxOptimizationCycles: number = 3;

  constructor() {
    super('Evaluator-Optimizer');
  }

  public async execute(request: ContentGenerationRequest, context: any): Promise<any> {
    // This method is required by BaseAgent but not used in the traditional sense
    // The evaluator-optimizer works through evaluate() and optimize() methods
    return { status: 'evaluator-optimizer-ready' };
  }

  public async evaluateAgentOutput(
    agentId: string,
    output: any,
    request: ContentGenerationRequest,
    context: any
  ): Promise<EvaluationResult> {
    this.logExecution(`Evaluating output from ${agentId}`);

    try {
      const metrics = await this.calculateQualityMetrics(agentId, output, request);
      const suggestions = await this.generateOptimizationSuggestions(agentId, output, metrics, request);
      
      const shouldRetry = metrics.overallScore < this.qualityThreshold && 
                         this.hasSignificantIssues(suggestions);

      const retryInstructions = shouldRetry ? 
        await this.generateRetryInstructions(agentId, output, suggestions, request) : 
        undefined;

      const result: EvaluationResult = {
        agentId,
        output,
        metrics,
        suggestions,
        shouldRetry,
        retryInstructions
      };

      this.logExecution(`Evaluation completed for ${agentId}`, {
        overallScore: metrics.overallScore,
        shouldRetry,
        suggestionsCount: suggestions.length
      });

      return result;

    } catch (error) {
      console.error(`Evaluation failed for ${agentId}:`, error);
      
      return {
        agentId,
        output,
        metrics: this.getDefaultMetrics(),
        suggestions: [],
        shouldRetry: false
      };
    }
  }

  private async calculateQualityMetrics(
    agentId: string, 
    output: any, 
    request: ContentGenerationRequest
  ): Promise<QualityMetrics> {
    const prompt = `Evaluate the quality of this ${agentId} output for a ${request.contentType} project about "${request.topic}".

OUTPUT TO EVALUATE:
${JSON.stringify(output, null, 2)}

EVALUATION CRITERIA:
1. Content Quality (0-1): Accuracy, depth, relevance, structure
2. SEO Optimization (0-1): Keyword usage, meta elements, search optimization
3. Brand Alignment (0-1): Tone, voice, message consistency
4. Engagement Potential (0-1): Hooks, emotional triggers, call-to-actions
5. Technical Accuracy (0-1): Format compliance, data completeness

Respond with this JSON format:
{
  "contentQuality": 0.85,
  "seoOptimization": 0.78,
  "brandAlignment": 0.92,
  "engagementPotential": 0.80,
  "technicalAccuracy": 0.88,
  "overallScore": 0.85,
  "reasoning": "Brief explanation of scores"
}`;

    try {
      const response = await this.callLLM(prompt, {
        maxTokens: 1000,
        temperature: 0.3
      });

      const parsed = this.extractJSONFromResponse(response);
      
      // Validate and ensure all metrics are present
      const metrics: QualityMetrics = {
        contentQuality: Math.max(0, Math.min(1, parsed.contentQuality || 0.7)),
        seoOptimization: Math.max(0, Math.min(1, parsed.seoOptimization || 0.7)),
        brandAlignment: Math.max(0, Math.min(1, parsed.brandAlignment || 0.7)),
        engagementPotential: Math.max(0, Math.min(1, parsed.engagementPotential || 0.7)),
        technicalAccuracy: Math.max(0, Math.min(1, parsed.technicalAccuracy || 0.7)),
        overallScore: 0
      };

      // Calculate weighted overall score
      metrics.overallScore = (
        metrics.contentQuality * 0.3 +
        metrics.seoOptimization * 0.2 +
        metrics.brandAlignment * 0.2 +
        metrics.engagementPotential * 0.2 +
        metrics.technicalAccuracy * 0.1
      );

      return metrics;

    } catch (error) {
      console.warn(`Failed to calculate quality metrics for ${agentId}, using defaults`);
      return this.getDefaultMetrics();
    }
  }

  private async generateOptimizationSuggestions(
    agentId: string,
    output: any,
    metrics: QualityMetrics,
    request: ContentGenerationRequest
  ): Promise<OptimizationSuggestion[]> {
    const lowScoreThreshold = 0.7;
    const suggestions: OptimizationSuggestion[] = [];

    // Generate suggestions based on low-scoring metrics
    if (metrics.contentQuality < lowScoreThreshold) {
      suggestions.push({
        agentId,
        issue: 'Low content quality score',
        suggestion: 'Improve content depth, accuracy, and relevance to the topic',
        priority: 'high',
        estimatedImpact: 0.25
      });
    }

    if (metrics.seoOptimization < lowScoreThreshold) {
      suggestions.push({
        agentId,
        issue: 'Poor SEO optimization',
        suggestion: 'Better keyword integration, meta descriptions, and heading structure',
        priority: 'high',
        estimatedImpact: 0.20
      });
    }

    if (metrics.brandAlignment < lowScoreThreshold) {
      suggestions.push({
        agentId,
        issue: 'Brand alignment issues',
        suggestion: 'Ensure tone, voice, and messaging align with brand guidelines',
        priority: 'medium',
        estimatedImpact: 0.15
      });
    }

    if (metrics.engagementPotential < lowScoreThreshold) {
      suggestions.push({
        agentId,
        issue: 'Low engagement potential',
        suggestion: 'Add stronger hooks, emotional triggers, and clear call-to-actions',
        priority: 'medium',
        estimatedImpact: 0.18
      });
    }

    if (metrics.technicalAccuracy < lowScoreThreshold) {
      suggestions.push({
        agentId,
        issue: 'Technical formatting issues',
        suggestion: 'Fix JSON structure, ensure all required fields are present',
        priority: 'high',
        estimatedImpact: 0.15
      });
    }

    // Agent-specific suggestions
    const agentSpecificSuggestions = await this.getAgentSpecificSuggestions(agentId, output, request);
    suggestions.push(...agentSpecificSuggestions);

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.estimatedImpact - a.estimatedImpact;
    });
  }

  private async getAgentSpecificSuggestions(
    agentId: string,
    output: any,
    request: ContentGenerationRequest
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    switch (agentId) {
      case 'content-writer':
        if (!output.content?.mainContent || output.content.mainContent.length < 3) {
          suggestions.push({
            agentId,
            issue: 'Insufficient content sections',
            suggestion: 'Add at least 3-5 well-structured main content sections',
            priority: 'high',
            estimatedImpact: 0.3
          });
        }
        
        if (!output.metadata?.wordCount || output.metadata.wordCount < 800) {
          suggestions.push({
            agentId,
            issue: 'Content too short',
            suggestion: 'Expand content to at least 800-1200 words for better SEO',
            priority: 'medium',
            estimatedImpact: 0.2
          });
        }
        break;

      case 'market-researcher':
        if (!output.trends || output.trends.length < 3) {
          suggestions.push({
            agentId,
            issue: 'Insufficient market trends',
            suggestion: 'Research and include at least 3-5 relevant market trends',
            priority: 'high',
            estimatedImpact: 0.25
          });
        }
        break;

      case 'ai-seo-optimizer':
        if (!output.keywordStrategy?.primaryKeywords || output.keywordStrategy.primaryKeywords.length < 3) {
          suggestions.push({
            agentId,
            issue: 'Insufficient keyword research',
            suggestion: 'Identify and optimize for at least 3-5 primary keywords',
            priority: 'high',
            estimatedImpact: 0.3
          });
        }
        break;

      case 'audience-analyzer':
        if (!output.primaryPersona?.painPoints || output.primaryPersona.painPoints.length < 3) {
          suggestions.push({
            agentId,
            issue: 'Shallow persona analysis',
            suggestion: 'Develop deeper insights into audience pain points and motivations',
            priority: 'medium',
            estimatedImpact: 0.2
          });
        }
        break;
    }

    return suggestions;
  }

  private async generateRetryInstructions(
    agentId: string,
    output: any,
    suggestions: OptimizationSuggestion[],
    request: ContentGenerationRequest
  ): Promise<string> {
    const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
    
    if (highPrioritySuggestions.length === 0) {
      return 'Please improve the overall quality based on the evaluation feedback.';
    }

    const prompt = `Generate specific retry instructions for ${agentId} to address these issues:

HIGH PRIORITY ISSUES:
${highPrioritySuggestions.map(s => `- ${s.issue}: ${s.suggestion}`).join('\n')}

ORIGINAL REQUEST:
Topic: ${request.topic}
Content Type: ${request.contentType}
Audience: ${request.audience}

CURRENT OUTPUT STRUCTURE:
${JSON.stringify(Object.keys(output), null, 2)}

Generate clear, actionable instructions for the agent to fix these issues in a retry attempt. Be specific about what needs to be changed or added.`;

    try {
      const instructions = await this.callLLM(prompt, {
        maxTokens: 800,
        temperature: 0.5
      });

      return instructions.trim();
    } catch (error) {
      console.warn('Failed to generate retry instructions, using fallback');
      return `Please address these key issues: ${highPrioritySuggestions.map(s => s.suggestion).join('; ')}`;
    }
  }

  public async optimizeWorkflow(
    results: Map<string, any>,
    request: ContentGenerationRequest,
    maxCycles: number = this.maxOptimizationCycles
  ): Promise<Map<string, any>> {
    let optimizedResults = new Map(results);
    let cycle = 0;

    this.logExecution('Starting workflow optimization', { 
      agentsCount: results.size, 
      maxCycles 
    });

    while (cycle < maxCycles) {
      cycle++;
      console.log(`🔍 Optimization cycle ${cycle}/${maxCycles}`);

      const evaluations = new Map<string, EvaluationResult>();
      let needsOptimization = false;

      // Evaluate all agent outputs
      for (const [agentId, output] of optimizedResults) {
        const evaluation = await this.evaluateAgentOutput(
          agentId, 
          output, 
          request, 
          { previousOutputs: Object.fromEntries(optimizedResults) }
        );
        
        evaluations.set(agentId, evaluation);
        
        if (evaluation.shouldRetry) {
          needsOptimization = true;
        }
      }

      if (!needsOptimization) {
        console.log(`✅ No optimization needed, stopping at cycle ${cycle}`);
        break;
      }

      // Apply optimizations for agents that need retry
      const optimizationPromises: Promise<void>[] = [];

      for (const [agentId, evaluation] of evaluations) {
        if (evaluation.shouldRetry && evaluation.retryInstructions) {
          optimizationPromises.push(
            this.retryAgentWithOptimization(
              agentId,
              evaluation,
              request,
              optimizedResults
            ).then(newOutput => {
              if (newOutput) {
                optimizedResults.set(agentId, newOutput);
              }
            })
          );
        }
      }

      await Promise.allSettled(optimizationPromises);
    }

    this.logExecution('Workflow optimization completed', { 
      cyclesUsed: cycle,
      finalResultsCount: optimizedResults.size 
    });

    return optimizedResults;
  }

  private async retryAgentWithOptimization(
    agentId: string,
    evaluation: EvaluationResult,
    request: ContentGenerationRequest,
    currentResults: Map<string, any>
  ): Promise<any> {
    try {
      console.log(`🔄 Optimizing ${agentId} with instructions:`, evaluation.retryInstructions?.substring(0, 100));

      // Create an enhanced prompt with optimization instructions
      const optimizedPrompt = this.createOptimizedPrompt(
        agentId,
        evaluation,
        request,
        currentResults
      );

      const response = await this.callLLM(optimizedPrompt, {
        maxTokens: 4000,
        temperature: 0.7
      });

      const optimizedOutput = this.extractJSONFromResponse(response);
      
      console.log(`✅ ${agentId} optimization completed`);
      return optimizedOutput;

    } catch (error) {
      console.error(`❌ Failed to optimize ${agentId}:`, error);
      return null;
    }
  }

  private createOptimizedPrompt(
    agentId: string,
    evaluation: EvaluationResult,
    request: ContentGenerationRequest,
    currentResults: Map<string, any>
  ): string {
    const context = Object.fromEntries(currentResults);
    
    return `You are a professional ${agentId.replace('-', ' ')} tasked with creating optimized content.

OPTIMIZATION INSTRUCTIONS:
${evaluation.retryInstructions}

QUALITY IMPROVEMENTS NEEDED:
${evaluation.suggestions.map(s => `- ${s.suggestion}`).join('\n')}

ORIGINAL REQUEST:
- Topic: ${request.topic}
- Content Type: ${request.contentType}
- Audience: ${request.audience}
- Goals: ${request.goals}
- Tone: ${request.tone || 'Professional and engaging'}

CONTEXT FROM OTHER AGENTS:
${JSON.stringify(context, null, 2)}

PREVIOUS OUTPUT (FOR REFERENCE):
${JSON.stringify(evaluation.output, null, 2)}

Create an improved version that addresses all the optimization instructions and quality issues. 
Ensure your output follows the exact same JSON structure as the previous version but with enhanced quality and completeness.`;
  }

  private hasSignificantIssues(suggestions: OptimizationSuggestion[]): boolean {
    const highPriorityCount = suggestions.filter(s => s.priority === 'high').length;
    const totalImpact = suggestions.reduce((sum, s) => sum + s.estimatedImpact, 0);
    
    return highPriorityCount > 0 || totalImpact > 0.3;
  }

  private getDefaultMetrics(): QualityMetrics {
    return {
      contentQuality: 0.7,
      seoOptimization: 0.7,
      brandAlignment: 0.7,
      engagementPotential: 0.7,
      technicalAccuracy: 0.7,
      overallScore: 0.7
    };
  }

  public async generateQualityReport(
    evaluations: Map<string, EvaluationResult>
  ): Promise<{
    overallScore: number;
    agentScores: Array<{ agentId: string; score: number; status: string }>;
    totalSuggestions: number;
    criticalIssues: number;
    recommendations: string[];
  }> {
    const scores = Array.from(evaluations.values()).map(e => e.metrics.overallScore);
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const agentScores = Array.from(evaluations.entries()).map(([agentId, evaluation]) => ({
      agentId,
      score: evaluation.metrics.overallScore,
      status: evaluation.shouldRetry ? 'needs-improvement' : 'acceptable'
    }));

    const allSuggestions = Array.from(evaluations.values())
      .flatMap(e => e.suggestions);

    const criticalIssues = allSuggestions
      .filter(s => s.priority === 'high').length;

    const recommendations = this.generateTopRecommendations(allSuggestions);

    return {
      overallScore,
      agentScores,
      totalSuggestions: allSuggestions.length,
      criticalIssues,
      recommendations
    };
  }

  private generateTopRecommendations(suggestions: OptimizationSuggestion[]): string[] {
    return suggestions
      .filter(s => s.priority === 'high')
      .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
      .slice(0, 5)
      .map(s => s.suggestion);
  }
}