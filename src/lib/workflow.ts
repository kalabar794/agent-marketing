import { ContentGenerationRequest, WorkflowStatus, AgentResponse, AgentConfig, GeneratedContent, QualityScores } from '@/types/content';
import { AgentOrchestrator } from './agents/orchestrator';
import { QualityController } from './quality/controller';
import { ContentStorage } from './storage/content';

export class ContentWorkflow {
  private static instances: Map<string, ContentWorkflow> = new Map();
  
  private id: string;
  private request: ContentGenerationRequest;
  private status: WorkflowStatus;
  private orchestrator: AgentOrchestrator;
  private qualityController: QualityController;
  private storage: ContentStorage;

  constructor(request: ContentGenerationRequest) {
    this.id = this.generateId();
    this.request = request;
    this.orchestrator = new AgentOrchestrator();
    this.qualityController = new QualityController();
    this.storage = new ContentStorage();
    
    this.status = {
      id: this.id,
      status: 'pending',
      progress: 0,
      agents: this.initializeAgents(),
      startTime: new Date()
    };

    ContentWorkflow.instances.set(this.id, this);
  }

  static getInstance(id: string): ContentWorkflow | undefined {
    return ContentWorkflow.instances.get(id);
  }

  private generateId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAgents(): AgentResponse[] {
    const pipeline = this.getAgentPipeline();
    return pipeline.map(agent => ({
      agentId: agent.id,
      status: 'pending',
      progress: 0
    }));
  }

  public getAgentPipeline(): AgentConfig[] {
    const baseAgents = [
      {
        id: 'market-researcher',
        name: 'Market Researcher',
        description: 'Analyzing market trends and competitor landscape',
        color: 'blue',
        estimatedTime: 3,
        dependencies: []
      },
      {
        id: 'audience-analyzer',
        name: 'Audience Analyzer', 
        description: 'Analyzing target audience and creating persona insights',
        color: 'purple',
        estimatedTime: 2,
        dependencies: ['market-researcher']
      },
      {
        id: 'content-strategist',
        name: 'Content Strategist',
        description: 'Creating comprehensive content strategy and outline',
        color: 'indigo',
        estimatedTime: 3,
        dependencies: ['audience-analyzer']
      },
      {
        id: 'ai-seo-optimizer',
        name: 'AI SEO Optimizer',
        description: 'Optimizing for traditional and AI search engines',
        color: 'green',
        estimatedTime: 2,
        dependencies: ['content-strategist']
      },
      {
        id: 'content-writer',
        name: 'Content Writer',
        description: 'Writing engaging, conversion-focused content',
        color: 'orange',
        estimatedTime: 5,
        dependencies: ['ai-seo-optimizer']
      },
      {
        id: 'content-editor',
        name: 'Content Editor',
        description: 'Reviewing and polishing content for quality',
        color: 'red',
        estimatedTime: 3,
        dependencies: ['content-writer']
      }
    ];

    // Add platform-specific agents based on content type
    if (this.request.contentType === 'landing') {
      baseAgents.push({
        id: 'landing-page-specialist',
        name: 'Landing Page Specialist',
        description: 'Optimizing for conversion and user experience',
        color: 'yellow',
        estimatedTime: 4,
        dependencies: ['content-editor']
      });
    }

    if (this.request.contentType === 'social' || this.request.platforms?.length) {
      baseAgents.push({
        id: 'social-media-specialist',
        name: 'Social Media Specialist',
        description: 'Adapting content for social platforms',
        color: 'pink',
        estimatedTime: 3,
        dependencies: ['content-editor']
      });
    }

    baseAgents.push({
      id: 'performance-analyst',
      name: 'Performance Analyst',
      description: 'Setting up analytics and success metrics',
      color: 'cyan',
      estimatedTime: 2,
      dependencies: ['content-editor']
    });

    return baseAgents;
  }

  public getEstimatedTime(): number {
    return this.getAgentPipeline().reduce((total, agent) => total + agent.estimatedTime, 0);
  }

  public async start(): Promise<string> {
    this.status.status = 'running';
    
    // Start the workflow asynchronously
    this.executeWorkflow().catch(error => {
      console.error('Workflow execution failed:', error);
      this.status.status = 'failed';
    });

    return this.id;
  }

  private async executeWorkflow(): Promise<void> {
    const pipeline = this.getAgentPipeline();
    let currentProgress = 0;
    const progressPerAgent = 100 / pipeline.length;

    for (const agentConfig of pipeline) {
      // Check dependencies
      if (!this.checkDependencies(agentConfig)) {
        throw new Error(`Dependencies not met for agent: ${agentConfig.id}`);
      }

      // Update agent status to running
      const agentIndex = this.status.agents.findIndex(a => a.agentId === agentConfig.id);
      if (agentIndex !== -1) {
        this.status.agents[agentIndex].status = 'running';
        this.status.agents[agentIndex].startTime = new Date();
        this.status.currentAgent = agentConfig.id;
      }

      try {
        // Execute agent
        const result = await this.orchestrator.executeAgent(agentConfig.id, this.request, this.getAgentContext());
        
        // Update agent status to completed
        if (agentIndex !== -1) {
          this.status.agents[agentIndex].status = 'completed';
          this.status.agents[agentIndex].endTime = new Date();
          this.status.agents[agentIndex].progress = 100;
          this.status.agents[agentIndex].output = result;
          this.status.agents[agentIndex].duration = 
            this.status.agents[agentIndex].endTime!.getTime() - 
            this.status.agents[agentIndex].startTime!.getTime();
        }

        // Update overall progress
        currentProgress += progressPerAgent;
        this.status.progress = Math.min(currentProgress, 100);

        // Store intermediate results
        await this.storage.saveAgentOutput(this.id, agentConfig.id, result);

      } catch (error) {
        // Mark agent as failed
        if (agentIndex !== -1) {
          this.status.agents[agentIndex].status = 'failed';
          this.status.agents[agentIndex].error = error instanceof Error ? error.message : 'Unknown error';
        }
        throw error;
      }
    }

    // Generate final content
    await this.generateFinalContent();
    
    // Run quality control
    await this.runQualityControl();
    
    // Mark workflow as completed
    this.status.status = 'completed';
    this.status.endTime = new Date();
    this.status.progress = 100;
  }

  private checkDependencies(agent: AgentConfig): boolean {
    return agent.dependencies.every(depId => {
      const depAgent = this.status.agents.find(a => a.agentId === depId);
      return depAgent && depAgent.status === 'completed';
    });
  }

  private getAgentContext(): any {
    const completedAgents = this.status.agents.filter(a => a.status === 'completed');
    const context: any = {
      request: this.request,
      previousOutputs: {}
    };

    completedAgents.forEach(agent => {
      if (agent.output) {
        context.previousOutputs[agent.agentId] = agent.output;
      }
    });

    return context;
  }

  private async generateFinalContent(): Promise<void> {
    const completedOutputs = this.status.agents
      .filter(a => a.status === 'completed' && a.output)
      .reduce((acc, agent) => {
        acc[agent.agentId] = agent.output;
        return acc;
      }, {} as any);

    // Combine all agent outputs into final content
    const content: GeneratedContent = {
      id: `content-${this.id}`,
      title: completedOutputs['content-strategist']?.title || this.request.topic,
      content: completedOutputs['content-writer']?.content || '',
      summary: completedOutputs['content-strategist']?.summary || '',
      seoKeywords: completedOutputs['ai-seo-optimizer']?.keywords || [],
      readabilityScore: 0, // Will be calculated in quality control
      platforms: this.generatePlatformContent(completedOutputs)
    };

    this.status.content = content;
    await this.storage.saveFinalContent(this.id, content);
  }

  private generatePlatformContent(outputs: any): any[] {
    const platforms = [];
    
    if (outputs['social-media-specialist']) {
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

  private async runQualityControl(): Promise<void> {
    if (!this.status.content) return;

    const scores = await this.qualityController.evaluateContent(this.status.content);
    this.status.qualityScores = scores;
    
    // Save quality report
    await this.storage.saveQualityReport(this.id, scores);
  }

  public async getStatus(): Promise<WorkflowStatus> {
    return { ...this.status };
  }

  public async getContent(): Promise<GeneratedContent | undefined> {
    return this.status.content;
  }

  public async getQualityScores(): Promise<QualityScores | undefined> {
    return this.status.qualityScores;
  }

  public async approveContent(feedback?: string): Promise<any> {
    if (this.status.status !== 'completed') {
      throw new Error('Content must be completed before approval');
    }

    // Update workflow status to approved
    this.status.status = 'completed'; // Keep as completed but mark as approved
    const approvalData = {
      approved: true,
      approvedAt: new Date(),
      feedback,
      approvedBy: 'Quality Control'
    };

    // Store approval in storage
    await this.storage.saveApproval(this.id, approvalData);
    
    return approvalData;
  }

  public async rejectContent(feedback: string): Promise<any> {
    if (this.status.status !== 'completed') {
      throw new Error('Content must be completed before rejection');
    }

    const rejectionData = {
      approved: false,
      rejectedAt: new Date(),
      feedback,
      rejectedBy: 'Quality Control',
      reason: feedback
    };

    // Store rejection in storage
    await this.storage.saveApproval(this.id, rejectionData);
    
    return rejectionData;
  }

  public async requestRevision(feedback: string): Promise<any> {
    if (this.status.status !== 'completed') {
      throw new Error('Content must be completed before requesting revision');
    }

    const revisionData = {
      revisionRequested: true,
      requestedAt: new Date(),
      feedback,
      requestedBy: 'Quality Control',
      revisionNotes: feedback
    };

    // Store revision request in storage
    await this.storage.saveRevisionRequest(this.id, revisionData);
    
    return revisionData;
  }

  public async getQualityReport(): Promise<any> {
    if (!this.status.content || !this.status.qualityScores) {
      throw new Error('Content and quality scores must be available');
    }

    const agentFeedback = this.status.agents
      .filter(agent => agent.status === 'completed' && agent.output)
      .map(agent => ({
        agentId: agent.agentId,
        agentName: this.getAgentName(agent.agentId),
        output: agent.output,
        duration: agent.duration,
        completedAt: agent.endTime
      }));

    const report = {
      workflowId: this.id,
      content: this.status.content,
      qualityScores: this.status.qualityScores,
      agentFeedback,
      overallStatus: this.status.status,
      completedAt: this.status.endTime,
      totalDuration: this.status.endTime ? 
        this.status.endTime.getTime() - this.status.startTime.getTime() : 0,
      agentCount: this.status.agents.length,
      successfulAgents: this.status.agents.filter(a => a.status === 'completed').length
    };

    return report;
  }

  private getAgentName(agentId: string): string {
    const agent = this.getAgentPipeline().find(a => a.id === agentId);
    return agent?.name || agentId;
  }
}