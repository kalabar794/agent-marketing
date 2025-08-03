import { ContentGenerationRequest, WorkflowStatus, AgentResponse, GeneratedContent, QualityScores } from '@/types/content';
import { EnhancedOrchestrator } from './agents/enhanced-orchestrator';
import { EvaluatorOptimizer } from './quality/evaluator-optimizer';
import { DynamicTaskDelegator } from './agents/dynamic-task-delegator';
import { ErrorRecoveryManager } from './resilience/error-recovery';
import { ContentStorage } from './storage/content';

interface EnhancedWorkflowOptions {
  priorityMode?: 'speed' | 'balanced' | 'quality';
  maxExecutionTime?: number;
  enableOptimization?: boolean;
  maxOptimizationCycles?: number;
  enableFallbacks?: boolean;
}

export class EnhancedContentWorkflow {
  private static instances: Map<string, EnhancedContentWorkflow> = new Map();
  
  private id: string;
  private request: ContentGenerationRequest;
  private options: EnhancedWorkflowOptions;
  private status: WorkflowStatus;
  
  private orchestrator: EnhancedOrchestrator;
  private evaluator: EvaluatorOptimizer;
  private delegator: DynamicTaskDelegator;
  private errorRecovery: ErrorRecoveryManager;
  private storage: ContentStorage;
  
  private executionStartTime: Date;
  private progressCallback?: (agentId: string, progress: number) => void;

  constructor(request: ContentGenerationRequest, options: EnhancedWorkflowOptions = {}) {
    this.id = this.generateId();
    this.request = request;
    this.options = {
      priorityMode: 'balanced',
      enableOptimization: true,
      maxOptimizationCycles: 2,
      enableFallbacks: true,
      ...options
    };
    
    this.orchestrator = new EnhancedOrchestrator();
    this.evaluator = new EvaluatorOptimizer();
    this.delegator = new DynamicTaskDelegator();
    this.errorRecovery = new ErrorRecoveryManager();
    this.storage = new ContentStorage();
    
    this.executionStartTime = new Date();
    
    // Initialize status with dynamic task delegation
    const delegation = this.delegator.delegateTasks(
      request, 
      this.options.maxExecutionTime, 
      this.options.priorityMode
    );
    
    this.status = {
      id: this.id,
      status: 'pending',
      progress: 0,
      agents: this.initializeAgentStatus(delegation.selectedTasks),
      startTime: this.executionStartTime,
      estimatedTimeRemaining: Math.ceil(delegation.estimatedDuration / 60),
      currentAgent: delegation.selectedTasks[0]?.agentId
    };

    EnhancedContentWorkflow.instances.set(this.id, this);
    
    console.log(`🚀 Enhanced workflow ${this.id} initialized:`, {
      contentType: request.contentType,
      selectedTasks: delegation.selectedTasks.length,
      estimatedDuration: `${Math.ceil(delegation.estimatedDuration / 60)}m`,
      priorityMode: this.options.priorityMode
    });
  }

  static getInstance(id: string): EnhancedContentWorkflow | undefined {
    return EnhancedContentWorkflow.instances.get(id);
  }

  private generateId(): string {
    return `enhanced-workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAgentStatus(tasks: any[]): AgentResponse[] {
    return tasks.map(task => ({
      agentId: task.agentId,
      status: 'pending',
      progress: 0
    }));
  }

  public async start(): Promise<string> {
    this.status.status = 'running';
    
    // Start the workflow asynchronously
    this.executeEnhancedWorkflow().catch(error => {
      console.error('Enhanced workflow execution failed:', error);
      this.status.status = 'failed';
      this.status.error = error instanceof Error ? error.message : 'Unknown error';
    });

    return this.id;
  }

  public setProgressCallback(callback: (agentId: string, progress: number) => void): void {
    this.progressCallback = callback;
  }

  private async executeEnhancedWorkflow(): Promise<void> {
    try {
      console.log(`🚀 Starting enhanced workflow execution for ${this.request.contentType}`);
      
      // Phase 1: Dynamic Task Planning
      console.log('📋 Phase 1: Dynamic Task Planning');
      const delegation = this.delegator.delegateTasks(
        this.request,
        this.options.maxExecutionTime,
        this.options.priorityMode
      );

      // Phase 2: Execute agents with enhanced orchestration
      console.log('🔄 Phase 2: Enhanced Agent Execution');
      const agentResults = await this.orchestrator.executeWorkflow(
        this.request,
        (agentId, progress) => {
          this.updateAgentProgress(agentId, progress);
          if (this.progressCallback) {
            this.progressCallback(agentId, progress);
          }
        }
      );

      // Store intermediate results
      await this.storeIntermediateResults(agentResults);

      // Phase 3: Quality Evaluation and Optimization
      if (this.options.enableOptimization) {
        console.log('🎯 Phase 3: Quality Evaluation and Optimization');
        const optimizedResults = await this.evaluator.optimizeWorkflow(
          agentResults,
          this.request,
          this.options.maxOptimizationCycles
        );

        // Update with optimized results
        optimizedResults.forEach((result, agentId) => {
          agentResults.set(agentId, result);
        });
      }

      // Phase 4: Generate Final Content
      console.log('📝 Phase 4: Final Content Generation');
      await this.generateFinalContent(agentResults);

      // Phase 5: Final Quality Assessment
      console.log('✅ Phase 5: Final Quality Assessment');
      await this.runFinalQualityControl(agentResults);

      // Mark workflow as completed
      this.status.status = 'completed';
      this.status.endTime = new Date();
      this.status.progress = 100;

      const duration = this.status.endTime.getTime() - this.status.startTime.getTime();
      console.log(`🎉 Enhanced workflow completed in ${Math.round(duration / 1000)}s`);

    } catch (error) {
      console.error('Enhanced workflow failed:', error);
      
      // Try error recovery if enabled
      if (this.options.enableFallbacks) {
        console.log('🔧 Attempting error recovery...');
        const recovered = await this.attemptErrorRecovery(error as Error);
        
        if (!recovered) {
          this.status.status = 'failed';
          this.status.error = error instanceof Error ? error.message : 'Unknown error';
          throw error;
        }
      } else {
        this.status.status = 'failed';
        this.status.error = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      }
    }
  }

  private updateAgentProgress(agentId: string, progress: number): void {
    const agentIndex = this.status.agents.findIndex(a => a.agentId === agentId);
    if (agentIndex !== -1) {
      this.status.agents[agentIndex].progress = progress;
      
      if (progress === 100) {
        this.status.agents[agentIndex].status = 'completed';
        this.status.agents[agentIndex].endTime = new Date();
      } else if (progress > 0) {
        this.status.agents[agentIndex].status = 'running';
        if (!this.status.agents[agentIndex].startTime) {
          this.status.agents[agentIndex].startTime = new Date();
        }
      }
    }

    // Update overall progress
    const totalProgress = this.status.agents.reduce((sum, agent) => sum + agent.progress, 0);
    this.status.progress = Math.round(totalProgress / this.status.agents.length);
    
    // Update current agent
    const runningAgent = this.status.agents.find(a => a.status === 'running');
    this.status.currentAgent = runningAgent?.agentId;
  }

  private async storeIntermediateResults(results: Map<string, any>): Promise<void> {
    for (const [agentId, result] of results) {
      await this.storage.saveAgentOutput(this.id, agentId, result);
    }
  }

  private async generateFinalContent(agentResults: Map<string, any>): Promise<void> {
    const completedOutputs = Object.fromEntries(agentResults);

    // Use enhanced content generation logic
    const content: GeneratedContent = {
      id: `enhanced-content-${this.id}`,
      title: this.extractTitle(completedOutputs),
      content: this.extractMainContent(completedOutputs),
      summary: this.extractSummary(completedOutputs),
      seoKeywords: this.extractSEOKeywords(completedOutputs),
      readabilityScore: this.calculateReadabilityScore(completedOutputs),
      platforms: this.generatePlatformContent(completedOutputs),
      metadata: {
        contentType: this.request.contentType,
        generationMethod: 'enhanced-workflow',
        totalAgents: agentResults.size,
        optimizationCycles: this.options.maxOptimizationCycles || 0,
        executionTime: Date.now() - this.executionStartTime.getTime(),
        qualityMode: this.options.priorityMode
      }
    };

    this.status.content = content;
    await this.storage.saveFinalContent(this.id, content);
  }

  private async runFinalQualityControl(agentResults: Map<string, any>): Promise<void> {
    if (!this.status.content) return;

    try {
      // Evaluate each agent's output
      const evaluations = new Map();
      
      for (const [agentId, output] of agentResults) {
        const evaluation = await this.evaluator.evaluateAgentOutput(
          agentId,
          output,
          this.request,
          { previousOutputs: Object.fromEntries(agentResults) }
        );
        evaluations.set(agentId, evaluation);
      }

      // Generate quality report
      const qualityReport = await this.evaluator.generateQualityReport(evaluations);
      
      this.status.qualityScores = {
        overall: qualityReport.overallScore,
        content: qualityReport.overallScore,
        seo: this.calculateAvgMetric(evaluations, 'seoOptimization'),
        engagement: this.calculateAvgMetric(evaluations, 'engagementPotential'),
        brand: this.calculateAvgMetric(evaluations, 'brandAlignment')
      };

      // Save quality report
      await this.storage.saveQualityReport(this.id, qualityReport);

      console.log(`📊 Quality assessment completed - Overall score: ${Math.round(qualityReport.overallScore * 100)}%`);

    } catch (error) {
      console.warn('Quality control failed, using default scores:', error);
      this.status.qualityScores = {
        overall: 0.75,
        content: 0.75,
        seo: 0.75,
        engagement: 0.75,
        brand: 0.75
      };
    }
  }

  private calculateAvgMetric(evaluations: Map<string, any>, metric: string): number {
    const values = Array.from(evaluations.values())
      .map(e => e.metrics[metric])
      .filter(v => typeof v === 'number');
    
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0.75;
  }

  private async attemptErrorRecovery(error: Error): Promise<boolean> {
    console.log('🔧 Attempting workflow-level error recovery...');
    
    try {
      // Try to recover using error recovery manager
      const recovery = await this.errorRecovery.handleError(
        'workflow',
        error,
        this.request,
        { status: this.status },
        1,
        2
      );

      if (recovery.recovered && recovery.result) {
        console.log('✅ Workflow recovery successful');
        
        // Use fallback content
        this.status.content = recovery.result;
        this.status.status = 'completed';
        this.status.endTime = new Date();
        this.status.progress = 100;
        
        return true;
      }

      return false;
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
      return false;
    }
  }

  // Content extraction helpers
  private extractTitle(outputs: any): string {
    return outputs['content-strategist']?.outline?.title ||
           outputs['content-writer']?.content?.title ||
           `${this.request.contentType} about ${this.request.topic}`;
  }

  private extractMainContent(outputs: any): string {
    const writer = outputs['content-writer'];
    if (writer?.content) {
      let content = writer.content.introduction || '';
      
      if (writer.content.mainContent) {
        writer.content.mainContent.forEach((section: any) => {
          content += `\n\n## ${section.heading}\n`;
          if (section.paragraphs) {
            content += section.paragraphs.join('\n\n');
          }
        });
      }
      
      if (writer.content.conclusion) {
        content += `\n\n## Conclusion\n${writer.content.conclusion}`;
      }
      
      return content;
    }
    
    return `Content about ${this.request.topic}`;
  }

  private extractSummary(outputs: any): string {
    return outputs['content-strategist']?.strategy?.summary ||
           outputs['content-writer']?.content?.introduction?.substring(0, 200) + '...' ||
           `Summary of ${this.request.topic}`;
  }

  private extractSEOKeywords(outputs: any): string[] {
    return outputs['ai-seo-optimizer']?.keywordStrategy?.primaryKeywords?.map((k: any) => k.keyword) ||
           outputs['ai-seo-optimizer']?.keywords ||
           [this.request.topic];
  }

  private calculateReadabilityScore(outputs: any): number {
    return outputs['content-writer']?.metadata?.readabilityScore ||
           outputs['content-editor']?.readabilityScore ||
           75;
  }

  private generatePlatformContent(outputs: any): any[] {
    const platforms = [];
    
    if (outputs['social-media-specialist']?.platforms) {
      platforms.push(...outputs['social-media-specialist'].platforms);
    }
    
    if (outputs['landing-page-specialist']) {
      platforms.push({
        platform: 'landing-page',
        content: outputs['landing-page-specialist'].content,
        mediaRecommendations: outputs['landing-page-specialist'].mediaRecommendations
      });
    }

    return platforms;
  }

  // Public interface methods
  public async getStatus(): Promise<WorkflowStatus> {
    return { ...this.status };
  }

  public async getContent(): Promise<GeneratedContent | undefined> {
    return this.status.content;
  }

  public async getQualityScores(): Promise<QualityScores | undefined> {
    return this.status.qualityScores;
  }

  public async getExecutionStats(): Promise<{
    duration: number;
    agentStats: any;
    qualityMetrics: any;
    errorRecoveryStats: any;
  }> {
    const endTime = this.status.endTime || new Date();
    const duration = endTime.getTime() - this.status.startTime.getTime();
    
    return {
      duration,
      agentStats: this.orchestrator.getExecutionStats(),
      qualityMetrics: this.status.qualityScores,
      errorRecoveryStats: this.errorRecovery.getErrorAnalytics()
    };
  }

  public async getDetailedReport(): Promise<any> {
    const stats = await this.getExecutionStats();
    
    return {
      workflowId: this.id,
      request: this.request,
      options: this.options,
      status: this.status,
      executionStats: stats,
      recommendations: this.generateRecommendations(stats)
    };
  }

  private generateRecommendations(stats: any): string[] {
    const recommendations: string[] = [];
    
    if (stats.duration > (this.options.maxExecutionTime || 900) * 1000) {
      recommendations.push('Consider using speed priority mode for faster execution');
    }
    
    if (stats.qualityMetrics?.overall < 0.8) {
      recommendations.push('Consider using quality priority mode for better results');
    }
    
    if (stats.errorRecoveryStats?.totalErrors > 0) {
      recommendations.push('Review error patterns and consider system optimization');
    }
    
    if (stats.agentStats?.successRate < 0.9) {
      recommendations.push('Some agents may need optimization or alternative strategies');
    }
    
    return recommendations;
  }
}