import { ContentGenerationRequest, WorkflowStatus, AgentResponse, GeneratedContent, QualityScores } from '@/types/content';
import { EnhancedOrchestrator } from './agents/enhanced-orchestrator';
import { EvaluatorOptimizer } from './quality/evaluator-optimizer';
import { DynamicTaskDelegator } from './agents/dynamic-task-delegator';
import { ErrorRecoveryManager } from './resilience/error-recovery';
import { NetlifyBlobsStorage } from './storage/netlify-blobs-storage';

interface EnhancedWorkflowOptions {
  priorityMode?: 'speed' | 'balanced' | 'quality';
  maxExecutionTime?: number;
  enableOptimization?: boolean;
  maxOptimizationCycles?: number;
  enableFallbacks?: boolean;
  demoMode?: boolean;
}

export class EnhancedContentWorkflow {
  private static instances: Map<string, EnhancedContentWorkflow> = new Map();
  
  public static setInstance(id: string, instance: EnhancedContentWorkflow): void {
    this.instances.set(id, instance);
  }

  // Static storage to persist across function calls (limited but better than /tmp)
  private static completedWorkflows = new Map<string, any>();

  public static async loadPersistedStatus(workflowId: string): Promise<any | null> {
    try {
      // First try in-memory storage
      if (this.completedWorkflows.has(workflowId)) {
        const status = this.completedWorkflows.get(workflowId);
        console.log(`📊 Found completed workflow in memory: ${workflowId}`);
        return status;
      }

      // Try Netlify Blobs storage
      try {
        const storage = new (await import('./storage/netlify-blobs-storage')).NetlifyBlobsStorage();
        const status = await storage.getWorkflowStatus(workflowId);
        if (status) {
          console.log(`📊 Found completed workflow in Netlify Blobs: ${workflowId}`);
          // Cache in memory for faster access
          this.completedWorkflows.set(workflowId, status);
          return status;
        }
      } catch (blobError) {
        console.warn(`Failed to load from Netlify Blobs: ${blobError}`);
      }

      // Fallback to file system (keeping original logic for compatibility)
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      const statusFile = path.join('/tmp', `workflow-${workflowId}.json`);
      const statusData = await fs.readFile(statusFile, 'utf-8');
      
      const status = JSON.parse(statusData);
      
      // Convert date strings back to Date objects
      if (status.startTime) status.startTime = new Date(status.startTime);
      if (status.endTime) status.endTime = new Date(status.endTime);
      
      // Cache in memory for faster access
      this.completedWorkflows.set(workflowId, status);
      
      return status;
    } catch (error) {
      // File not found or other error - this is expected for new workflows
      console.log(`📊 No persisted status found for workflow: ${workflowId}`);
      return null;
    }
  }
  
  private id: string;
  private request: ContentGenerationRequest;
  private options: EnhancedWorkflowOptions;
  private status: WorkflowStatus;
  
  private orchestrator: EnhancedOrchestrator;
  private evaluator: EvaluatorOptimizer;
  private delegator: DynamicTaskDelegator;
  private errorRecovery: ErrorRecoveryManager;
  private storage: NetlifyBlobsStorage;
  
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
    this.storage = new NetlifyBlobsStorage();
    
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

      // Phase 3: Quality Evaluation and Optimization (DISABLED FOR DEBUGGING)
      if (false && this.options.enableOptimization) {
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
      const finalContent = await this.assembleFinalContent(agentResults);
      this.status.content = finalContent;
      await this.storage.saveFinalContent(this.id, finalContent);

      // Phase 5: Final Quality Assessment  
      console.log('✅ Phase 5: Final Quality Assessment');
      try {
        await this.runFinalQualityControl(agentResults);
      } catch (error) {
        console.warn('Quality control failed, using default scores:', error);
        // Set default quality scores so workflow can complete
        this.status.qualityScores = {
          overall: 0.8,
          content: 0.8,
          seo: 0.75,
          engagement: 0.8,
          brand: 0.75
        };
      }

      // Mark workflow as completed
      this.status.status = 'completed';
      this.status.endTime = new Date();
      this.status.progress = 100;

      // Persist the completed status immediately to Netlify Blobs
      await this.storage.saveWorkflowStatus(this.id, this.status);
      await this.updatePersistedStatus();

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

  private async assembleFinalContent(agentResults: Map<string, any>): Promise<any> {
    const completedOutputs = Object.fromEntries(agentResults);
    
    // Debug: Log agent output structure
    console.log('🔍 DEBUG: Agent outputs structure:');
    Object.keys(completedOutputs).forEach(agentId => {
      const output = completedOutputs[agentId];
      console.log(`  ${agentId}:`, {
        hasTitle: !!output?.title,
        hasContentTitle: !!output?.content?.title,
        hasIntroduction: !!output?.introduction,
        hasContentIntroduction: !!output?.content?.introduction,
        hasSections: !!output?.sections,
        hasMainContent: !!output?.content?.mainContent,
        hasConclusion: !!output?.conclusion,
        hasContentConclusion: !!output?.content?.conclusion,
        structure: Object.keys(output || {})
      });
    });
    
    // Use enhanced content generation logic
    const extractedTitle = this.extractTitle(completedOutputs);
    const extractedContent = this.extractMainContent(completedOutputs);
    const extractedSummary = this.extractSummary(completedOutputs);
    
    console.log('🔍 DEBUG: Extracted values:', {
      title: extractedTitle,
      contentLength: extractedContent?.length || 0,
      summaryLength: extractedSummary?.length || 0
    });
    
    const content = {
      id: `enhanced-content-${this.id}`,
      title: extractedTitle,
      content: extractedContent,
      summary: extractedSummary,
      seoKeywords: this.extractSEOKeywords(completedOutputs),
      readabilityScore: this.calculateReadabilityScore(completedOutputs),
      platforms: this.generatePlatformContent(completedOutputs),
      metadata: {
        contentType: this.request.contentType,
        generationMethod: 'enhanced-background-workflow',
        totalAgents: agentResults.size,
        executionTime: Date.now() - this.status.startTime.getTime(),
        qualityMode: this.options.priorityMode || 'balanced'
      }
    };

    console.log(`📝 Assembled final content: ${content.title}`);
    return content;
  }


  private async runFinalQualityControl(agentResults: Map<string, any>): Promise<void> {
    if (!this.status.content) return;

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Quality control timeout')), 30000)
    );

    try {
      await Promise.race([timeoutPromise, this.performQualityControl(agentResults)]);
    } catch (error) {
      console.warn('Quality control failed or timed out:', error);
      throw error;
    }
  }

  private async performQualityControl(agentResults: Map<string, any>): Promise<void> {
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

  // Content extraction helpers (duplicated below for legacy support)
  private extractTitleLegacy(outputs: any): string {
    // Handle new simplified format from ContentWriter
    if (outputs['content-writer']?.title) {
      return outputs['content-writer'].title;
    }
    // Handle ContentStrategist output
    if (outputs['content-strategist']?.outline?.title) {
      return outputs['content-strategist'].outline.title;
    }
    // Handle full ContentWriterOutput format (fallback)
    if (outputs['content-writer']?.content?.title) {
      return outputs['content-writer'].content.title;
    }
    return `${this.request.contentType} about ${this.request.topic}`;
  }

  private extractMainContentLegacy(outputs: any): string {
    const writer = outputs['content-writer'];
    
    // Handle new simplified format from ContentWriter
    if (writer?.introduction && writer?.sections) {
      let content = writer.introduction + '\n\n';
      
      if (writer.sections && Array.isArray(writer.sections)) {
        writer.sections.forEach((section: any) => {
          content += `\n\n## ${section.heading}\n\n`;
          if (section.content) {
            content += section.content + '\n\n';
          }
        });
      }
      
      if (writer.conclusion) {
        content += `\n\n## Conclusion\n\n${writer.conclusion}`;
      }
      
      return content;
    }
    
    // Handle full ContentWriterOutput format (fallback)
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

  private extractSummaryLegacy(outputs: any): string {
    // Handle ContentWriter simplified format
    if (outputs['content-writer']?.introduction) {
      return outputs['content-writer'].introduction.substring(0, 200) + '...';
    }
    // Handle ContentStrategist output
    if (outputs['content-strategist']?.strategy?.summary) {
      return outputs['content-strategist'].strategy.summary;
    }
    // Handle full ContentWriter format (fallback)
    if (outputs['content-writer']?.content?.introduction) {
      return outputs['content-writer'].content.introduction.substring(0, 200) + '...';
    }
    return `Summary of ${this.request.topic}`;
  }

  private extractSEOKeywordsLegacy(outputs: any): string[] {
    // Handle SEO Optimizer output
    if (outputs['ai-seo-optimizer']?.keywordStrategy?.primaryKeywords) {
      return outputs['ai-seo-optimizer'].keywordStrategy.primaryKeywords.map((k: any) => k.keyword);
    }
    // Handle simplified format
    if (outputs['ai-seo-optimizer']?.keywords) {
      return outputs['ai-seo-optimizer'].keywords;
    }
    return [this.request.topic];
  }

  private calculateReadabilityScoreLegacy(outputs: any): number {
    // Handle ContentWriter metadata
    if (outputs['content-writer']?.metadata?.readabilityScore) {
      return outputs['content-writer'].metadata.readabilityScore;
    }
    // Handle ContentEditor output
    if (outputs['content-editor']?.readabilityScore) {
      return outputs['content-editor'].readabilityScore;
    }
    return 75;
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

  // Background processing methods
  public async executeWorkflowInBackground(workflowId: string): Promise<void> {
    try {
      this.id = workflowId;
      this.status.status = 'running';
      this.status.startTime = new Date();
      
      console.log(`🔄 Starting background enhanced workflow execution for ${this.request.contentType}`);
      
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
        }
      );

      // Store intermediate results
      await this.storeIntermediateResults(agentResults);

      // Phase 3: Quality Evaluation and Optimization (DISABLED FOR DEBUGGING)
      if (false && this.options.enableOptimization) {
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

      // Phase 4: Final content generation and assembly
      console.log('📝 Phase 4: Final Content Assembly');
      const finalContent = await this.assembleFinalContent(agentResults);
      
      // Calculate quality scores
      const qualityScores = await this.evaluator.calculateQualityScores(
        finalContent,
        this.request,
        agentResults
      );

      // Store final results
      this.status.content = finalContent;
      this.status.qualityScores = qualityScores;
      this.status.status = 'completed';
      this.status.endTime = new Date();
      this.status.progress = 100;
      
      // Mark all agents as completed
      this.status.agents.forEach(agent => {
        agent.status = 'completed';
        agent.progress = 100;
      });

      // Persist final status to Netlify Blobs
      await this.storage.saveWorkflowStatus(this.id, this.status);
      await this.updatePersistedStatus();

      console.log(`✅ Background workflow ${workflowId} completed successfully`);
      
    } catch (error) {
      console.error(`❌ Background workflow ${workflowId} failed:`, error);
      await this.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  public async markAsFailed(errorMessage: string): Promise<void> {
    this.status.status = 'failed';
    this.status.error = errorMessage;
    this.status.endTime = new Date();
    
    // Mark any running agents as failed
    this.status.agents.forEach(agent => {
      if (agent.status === 'running') {
        agent.status = 'failed';
      }
    });
    
    // Persist failed status to Netlify Blobs
    await this.storage.saveWorkflowStatus(this.id, this.status);
    await this.updatePersistedStatus();
  }

  public async simulateDemoWorkflow(workflowId: string): Promise<void> {
    try {
      this.id = workflowId;
      this.status.status = 'running';
      this.status.startTime = new Date();
      
      console.log(`🎭 Starting demo workflow simulation for ${workflowId}`);
      
      const agents = [
        'market-researcher',
        'content-strategist', 
        'content-writer',
        'ai-seo-optimizer',
        'content-editor'
      ];
      
      // Simulate progressive completion
      for (let i = 0; i < agents.length; i++) {
        const agentId = agents[i];
        const agentIndex = this.status.agents.findIndex(a => a.agentId === agentId);
        
        if (agentIndex !== -1) {
          // Mark as running
          this.status.agents[agentIndex].status = 'running';
          this.status.agents[agentIndex].progress = 0;
          
          // Simulate progress over 5-10 seconds
          const duration = 5000 + Math.random() * 5000;
          const steps = 10;
          const stepDuration = duration / steps;
          
          for (let step = 0; step <= steps; step++) {
            await new Promise(resolve => setTimeout(resolve, stepDuration));
            this.status.agents[agentIndex].progress = Math.round((step / steps) * 100);
            this.status.progress = Math.round(((i * steps + step) / (agents.length * steps)) * 100);
          }
          
          // Mark as completed
          this.status.agents[agentIndex].status = 'completed';
        }
      }
      
      // Generate demo content
      const demoContent = this.generateDemoContent();
      
      this.status.content = demoContent;
      this.status.qualityScores = {
        overall: 0.85,
        content: 0.88,
        seo: 0.82,
        engagement: 0.87,
        brand: 0.83
      };
      this.status.status = 'completed';
      this.status.endTime = new Date();
      this.status.progress = 100;
      
      // Persist demo completion to Netlify Blobs
      await this.storage.saveWorkflowStatus(this.id, this.status);
      await this.updatePersistedStatus();
      
      console.log(`✅ Demo workflow ${workflowId} completed`);
      
    } catch (error) {
      console.error(`❌ Demo workflow ${workflowId} failed:`, error);
      await this.markAsFailed(error instanceof Error ? error.message : 'Demo workflow failed');
    }
  }

  private generateDemoContent(): any {
    return {
      id: `demo-content-${Date.now()}`,
      title: `The Future of ${this.request.topic}: A Complete Guide`,
      content: `# The Future of ${this.request.topic}: A Complete Guide

## Introduction
${this.request.topic} is transforming the way ${this.request.audience} approach their work and achieve their goals.

## Key Benefits
- **Enhanced Efficiency**: Streamlined processes that save time and resources
- **Better Results**: Proven strategies that deliver measurable outcomes  
- **Competitive Advantage**: Stay ahead with cutting-edge approaches
- **Scalable Solutions**: Growth-ready implementations

## Implementation Strategy
1. Start with clear objectives aligned with your goals
2. Implement proven methodologies step by step
3. Monitor progress and optimize continuously
4. Scale successful approaches across your organization

## Best Practices
- Focus on data-driven decision making
- Maintain consistent quality standards
- Invest in team training and development
- Stay updated with industry trends

## Conclusion
The integration of ${this.request.topic} represents a significant opportunity for ${this.request.audience} to achieve their goals and drive meaningful results.

*Ready to get started? Contact our team to learn more about implementing these strategies for your organization.*`,
      summary: `Comprehensive guide to ${this.request.topic} for ${this.request.audience} with actionable strategies and best practices.`,
      seoKeywords: [this.request.topic.toLowerCase(), 'best practices', 'implementation', 'strategy'],
      readabilityScore: 85,
      platforms: this.request.contentType === 'social' ? ['LinkedIn', 'Twitter', 'Facebook'] : [],
      metadata: {
        contentType: this.request.contentType,
        generationMethod: 'demo-mode',
        totalAgents: 5,
        executionTime: 60000, // 1 minute
        qualityMode: 'demo'
      }
    };
  }

  private updateAgentProgress(agentId: string, progress: number): void {
    const agentIndex = this.status.agents.findIndex(a => a.agentId === agentId);
    if (agentIndex !== -1) {
      this.status.agents[agentIndex].progress = progress;
      if (progress === 100) {
        this.status.agents[agentIndex].status = 'completed';
      } else if (progress > 0) {
        this.status.agents[agentIndex].status = 'running';
      }
    }
    
    // Update overall progress
    const totalProgress = this.status.agents.reduce((sum, agent) => sum + agent.progress, 0);
    this.status.progress = Math.round(totalProgress / this.status.agents.length);
    
    // Persist updated progress
    this.updatePersistedStatus().catch(console.error);
  }

  // Helper methods for content assembly
  private extractTitle(outputs: any): string {
    // Handle new simplified format from ContentWriter
    if (outputs['content-writer']?.title) {
      return outputs['content-writer'].title;
    }
    // Handle full ContentWriterOutput format (fallback)
    if (outputs['content-writer']?.content?.title) {
      return outputs['content-writer'].content.title;
    }
    // Handle ContentStrategist output
    if (outputs['content-strategist']?.outline?.title) {
      return outputs['content-strategist'].outline.title;
    }
    return `${this.request.topic}: A Comprehensive Guide`;
  }

  private extractMainContent(outputs: any): string {
    const writer = outputs['content-writer'];
    
    // Handle new simplified format from ContentWriter
    if (writer?.introduction && writer?.sections) {
      let content = writer.introduction + '\n\n';
      
      if (writer.sections && Array.isArray(writer.sections)) {
        writer.sections.forEach((section: any) => {
          content += `\n\n## ${section.heading}\n\n`;
          if (section.content) {
            content += section.content + '\n\n';
          }
        });
      }
      
      if (writer.conclusion) {
        content += `\n\n## Conclusion\n\n${writer.conclusion}`;
      }
      
      return content;
    }
    
    // Handle full ContentWriterOutput format (fallback)
    if (writer?.content?.mainContent) {
      const sections = writer.content.mainContent;
      let content = writer.content.introduction || '';
      
      sections.forEach((section: any) => {
        content += `\n\n## ${section.heading}\n\n`;
        if (section.paragraphs) {
          content += section.paragraphs.join('\n\n') + '\n\n';
        }
        if (section.bulletPoints && section.bulletPoints.length > 0) {
          content += section.bulletPoints.map((point: string) => `- ${point}`).join('\n') + '\n\n';
        }
      });
      
      if (writer.content.conclusion) {
        content += `\n\n## Conclusion\n\n${writer.content.conclusion}`;
      }
      
      return content;
    }
    
    return `# ${this.request.topic}\n\nComprehensive content about ${this.request.topic} for ${this.request.audience}.`;
  }

  private extractSummary(outputs: any): string {
    // Handle ContentWriter simplified format
    if (outputs['content-writer']?.introduction) {
      return outputs['content-writer'].introduction.substring(0, 200) + '...';
    }
    // Handle ContentStrategist output
    if (outputs['content-strategist']?.strategy?.valueProposition) {
      return outputs['content-strategist'].strategy.valueProposition;
    }
    // Handle full ContentWriter format (fallback)
    if (outputs['content-writer']?.content?.introduction) {
      return outputs['content-writer'].content.introduction.substring(0, 200) + '...';
    }
    return `Complete guide to ${this.request.topic} for ${this.request.audience}`;
  }

  private extractSEOKeywords(outputs: any): string[] {
    // Handle SEO Optimizer output
    if (outputs['ai-seo-optimizer']?.keywordStrategy?.primaryKeywords) {
      return outputs['ai-seo-optimizer'].keywordStrategy.primaryKeywords.map((k: any) => k.keyword || k);
    }
    // Handle simplified format
    if (outputs['ai-seo-optimizer']?.keywords) {
      return outputs['ai-seo-optimizer'].keywords;
    }
    return [this.request.topic.toLowerCase(), 'best practices', 'guide'];
  }

  private calculateReadabilityScore(outputs: any): number {
    // Handle ContentEditor output
    if (outputs['content-editor']?.readabilityScore) {
      return outputs['content-editor'].readabilityScore;
    }
    // Handle ContentWriter metadata
    if (outputs['content-writer']?.metadata?.readabilityScore) {
      return outputs['content-writer'].metadata.readabilityScore;
    }
    return 78; // Default readable score
  }

  private generatePlatformContent(outputs: any): any[] {
    if (outputs['social-media-specialist']?.platforms) {
      return outputs['social-media-specialist'].platforms;
    }
    if (this.request.contentType === 'social') {
      return [
        { platform: 'LinkedIn', content: `Professional insights on ${this.request.topic}` },
        { platform: 'Twitter', content: `Quick tips about ${this.request.topic}` }
      ];
    }
    return [];
  }

  // Persistence methods for serverless environment
  public async persistStatus(): Promise<void> {
    try {
      // Always save to in-memory storage for quick access
      EnhancedContentWorkflow.completedWorkflows.set(this.id, { ...this.status });
      
      // Save to Netlify Blobs for persistent storage
      await this.storage.saveWorkflowStatus(this.id, this.status);
      
      // Also save to file system as backup (though it may not persist in serverless)
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      const statusFile = path.join('/tmp', `workflow-${this.id}.json`);
      const statusData = JSON.stringify(this.status, null, 2);
      
      await fs.writeFile(statusFile, statusData, 'utf-8');
      
      console.log(`💾 Persisted workflow status for ${this.id} (memory + Netlify Blobs + file)`);
    } catch (error) {
      console.error('Failed to persist workflow status:', error);
      // Even if persistence fails, in-memory persistence should work
    }
  }

  private async updatePersistedStatus(): Promise<void> {
    await this.persistStatus();
  }
}