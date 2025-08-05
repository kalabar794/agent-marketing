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

interface WorkerPool {
  id: string;
  agent: BaseAgent | null; // Now nullable for lazy loading
  isAvailable: boolean;
  currentTask?: string;
  lastUsed: Date;
  factory?: () => BaseAgent; // Factory function for lazy initialization
}

interface TaskNode {
  id: string;
  agent: BaseAgent;
  dependencies: string[];
  priority: number;
  estimatedDuration: number;
  canRunInParallel: boolean;
  retryCount: number;
  maxRetries: number;
}

interface ExecutionResult {
  agentId: string;
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
  quality?: number;
}

export class EnhancedOrchestrator {
  private workers: Map<string, WorkerPool>;
  private taskGraph: Map<string, TaskNode>;
  private executionHistory: ExecutionResult[];
  private activeExecutions: Map<string, Promise<ExecutionResult>>;
  private qualityThreshold: number = 0.8;
  private maxExecutionTime: number = 240000; // PERFORMANCE FIX: 4 minutes max per agent (was 3 min - align with base agent timeout)
  private enableFastFail: boolean = true;
  private enabledAgents: Set<string>;

  constructor(enabledAgents?: string[]) {
    this.workers = new Map();
    this.taskGraph = new Map();
    this.executionHistory = [];
    this.activeExecutions = new Map();
    
    // Configure which agents to use - default to core 7 agents
    this.enabledAgents = new Set(enabledAgents || [
      'market-researcher',
      'audience-analyzer', 
      'content-strategist',
      'ai-seo-optimizer',
      'content-writer',
      'content-editor',
      'social-media-specialist'
    ]);
    
    this.initializeWorkers();
    this.buildTaskGraph();
  }

  private initializeWorkers(): void {
    // PERFORMANCE FIX: Use lazy initialization to prevent memory explosion
    // Only create agent factories, not instances
    const agentFactories = new Map([
      ['market-researcher', () => new MarketResearcher()],
      ['audience-analyzer', () => new AudienceAnalyzer()],
      ['content-strategist', () => new ContentStrategist()],
      ['ai-seo-optimizer', () => new AISEOOptimizer()],
      ['content-writer', () => new ContentWriter()],
      ['content-editor', () => new ContentEditor()],
      ['social-media-specialist', () => new SocialMediaSpecialist()],
      ['landing-page-specialist', () => new LandingPageSpecialist()],
      ['performance-analyst', () => new PerformanceAnalyst()]
    ]);

    // Only initialize placeholders for enabled agents
    this.enabledAgents.forEach(id => {
      if (agentFactories.has(id)) {
        this.workers.set(id, {
          id,
          agent: null, // Will be lazily created on first use
          isAvailable: true,
          lastUsed: new Date(0),
          factory: agentFactories.get(id)!
        } as WorkerPool & { factory: () => BaseAgent });
      }
    });

    console.log(`🤖 Prepared ${this.workers.size} agent factories (memory efficient):`, Array.from(this.enabledAgents));
  }

  private buildTaskGraph(): void {
    // Define all possible task nodes with smart dependencies and parallel capabilities
    const allTasks: Omit<TaskNode, 'agent'>[] = [
      {
        id: 'market-researcher',
        dependencies: [],
        priority: 10,
        estimatedDuration: 180,
        canRunInParallel: true,
        retryCount: 0,
        maxRetries: 2
      },
      {
        id: 'audience-analyzer',
        dependencies: [],
        priority: 10,
        estimatedDuration: 120,
        canRunInParallel: true,
        retryCount: 0,
        maxRetries: 2
      },
      {
        id: 'ai-seo-optimizer',
        dependencies: [],
        priority: 8,
        estimatedDuration: 90,
        canRunInParallel: true,
        retryCount: 0,
        maxRetries: 2
      },
      {
        id: 'content-strategist',
        dependencies: ['market-researcher'], // PERFORMANCE FIX: Reduced dependencies to enable more parallelization
        priority: 9,
        estimatedDuration: 150,
        canRunInParallel: false,
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: 'content-writer',
        dependencies: ['content-strategist'], // PERFORMANCE FIX: Removed SEO dependency - SEO can run in parallel and be integrated later
        priority: 9,
        estimatedDuration: 240,
        canRunInParallel: false,
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: 'content-editor',
        dependencies: ['content-writer'],
        priority: 8,
        estimatedDuration: 120,
        canRunInParallel: false,
        retryCount: 0,
        maxRetries: 2
      },
      {
        id: 'social-media-specialist',
        dependencies: [], // PERFORMANCE FIX: Removed dependency to allow parallel execution
        priority: 6,
        estimatedDuration: 90,
        canRunInParallel: true,
        retryCount: 0,
        maxRetries: 2
      },
      {
        id: 'landing-page-specialist',
        dependencies: [], // PERFORMANCE FIX: Removed dependency to allow parallel execution
        priority: 6,
        estimatedDuration: 120,
        canRunInParallel: true,
        retryCount: 0,
        maxRetries: 2
      },
      {
        id: 'performance-analyst',
        dependencies: ['content-editor'],
        priority: 5,
        estimatedDuration: 60,
        canRunInParallel: true,
        retryCount: 0,
        maxRetries: 1
      }
    ];

    // Only include tasks for enabled agents
    allTasks.forEach(task => {
      if (this.enabledAgents.has(task.id)) {
        const worker = this.workers.get(task.id);
        if (worker) {
          // Filter dependencies to only include enabled agents
          const filteredDependencies = task.dependencies.filter(dep => this.enabledAgents.has(dep));
          
          this.taskGraph.set(task.id, {
            ...task,
            dependencies: filteredDependencies,
            agent: null as any // Will be set when agent is lazily loaded
          });
        }
      }
    });

    console.log(`📊 Built task graph with ${this.taskGraph.size} tasks and filtered dependencies`);
  }

  public async executeWorkflow(
    request: ContentGenerationRequest, 
    onProgress?: (agentId: string, progress: number) => void
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const completed = new Set<string>();
    const failed = new Set<string>();
    
    console.log('🚀 Starting enhanced orchestrator workflow');
    console.log('🚀 Orchestrator timestamp:', new Date().toISOString());
    console.log('🚀 Request details:', { 
      contentType: request.contentType, 
      topic: request.topic,
      targetAudience: request.targetAudience 
    });
    console.log('🚀 Task graph size:', this.taskGraph.size);

    // Phase 1: Execute independent tasks in parallel
    console.log('📋 Phase 1: Getting ready tasks...');
    const phase1Tasks = this.getReadyTasks(completed);
    console.log(`📋 Phase 1: Found ${phase1Tasks.length} parallel tasks:`, phase1Tasks.map(t => t.id));
    console.log('📋 Phase 1: Starting executeTasksInParallel...');
    
    let phase1Results;
    try {
      phase1Results = await this.executeTasksInParallel(
        phase1Tasks, 
        request, 
        results, 
        onProgress
      );
      console.log('📋 Phase 1: executeTasksInParallel completed with', phase1Results.length, 'results');
    } catch (phase1Error) {
      console.error('❌ Phase 1: executeTasksInParallel failed:', phase1Error);
      throw new Error(`Phase 1 execution failed: ${phase1Error.message}`);
    }

    console.log('📋 Phase 1: Processing results...');
    this.processResults(phase1Results, completed, failed, results);
    console.log('📋 Phase 1: Results processed. Completed:', Array.from(completed), 'Failed:', Array.from(failed));

    // Phase 2: Execute dependent tasks as dependencies complete
    console.log('📋 Phase 2: Starting dependency resolution loop...');
    let phaseCounter = 2;
    while (completed.size + failed.size < this.taskGraph.size) {
      console.log(`📋 Phase ${phaseCounter}: Loop iteration - Completed: ${completed.size}, Failed: ${failed.size}, Total: ${this.taskGraph.size}`);
      
      const readyTasks = this.getReadyTasks(completed);
      console.log(`📋 Phase ${phaseCounter}: Found ${readyTasks.length} ready tasks:`, readyTasks.map(t => t.id));
      
      if (readyTasks.length === 0) {
        // Check for circular dependencies or unrecoverable failures
        const remaining = Array.from(this.taskGraph.keys())
          .filter(id => !completed.has(id) && !failed.has(id));
        
        console.warn('⚠️ No ready tasks found, remaining:', remaining);
        console.warn('⚠️ This might indicate circular dependencies or all tasks failed');
        break;
      }

      console.log(`📋 Phase ${phaseCounter}: Starting executeTasksInParallel for ${readyTasks.length} tasks...`);
      
      let phaseResults;
      try {
        phaseResults = await this.executeTasksInParallel(
          readyTasks,
          request,
          results,
          onProgress
        );
        console.log(`📋 Phase ${phaseCounter}: executeTasksInParallel completed with ${phaseResults.length} results`);
      } catch (phaseError) {
        console.error(`❌ Phase ${phaseCounter}: executeTasksInParallel failed:`, phaseError);
        throw new Error(`Phase ${phaseCounter} execution failed: ${phaseError.message}`);
      }

      console.log(`📋 Phase ${phaseCounter}: Processing results...`);
      this.processResults(phaseResults, completed, failed, results);
      console.log(`📋 Phase ${phaseCounter}: Results processed. New totals - Completed: ${completed.size}, Failed: ${failed.size}`);
      
      phaseCounter++;
    }

    console.log(`✅ Workflow completed: ${completed.size} successful, ${failed.size} failed`);
    return results;
  }

  private getReadyTasks(completed: Set<string>): TaskNode[] {
    return Array.from(this.taskGraph.values())
      .filter(task => {
        // Task is ready if all dependencies are completed and it hasn't been completed/failed
        const dependenciesMet = task.dependencies.every(dep => completed.has(dep));
        const notYetProcessed = !completed.has(task.id);
        const hasRetriesLeft = task.retryCount < task.maxRetries;
        
        return dependenciesMet && notYetProcessed && hasRetriesLeft;
      })
      .sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  private async executeTasksInParallel(
    tasks: TaskNode[],
    request: ContentGenerationRequest,
    existingResults: Map<string, any>,
    onProgress?: (agentId: string, progress: number) => void
  ): Promise<ExecutionResult[]> {
    console.log('🔧 executeTasksInParallel: Starting with', tasks.length, 'tasks:', tasks.map(t => t.id));
    
    // Group tasks by parallel execution capability
    const parallelTasks = tasks.filter(task => task.canRunInParallel);
    const sequentialTasks = tasks.filter(task => !task.canRunInParallel);

    console.log('🔧 executeTasksInParallel: Parallel tasks:', parallelTasks.map(t => t.id));
    console.log('🔧 executeTasksInParallel: Sequential tasks:', sequentialTasks.map(t => t.id));

    const results: ExecutionResult[] = [];

    // Execute parallel tasks simultaneously
    if (parallelTasks.length > 0) {
      console.log('🔧 executeTasksInParallel: Starting', parallelTasks.length, 'parallel tasks...');
      
      const parallelPromises = parallelTasks.map(task => {
        console.log('🔧 executeTasksInParallel: Creating promise for task:', task.id);
        return this.executeTask(task, request, existingResults, onProgress);
      });
      
      console.log('🔧 executeTasksInParallel: Waiting for parallel promises to settle...');
      const parallelResults = await Promise.allSettled(parallelPromises);
      console.log('🔧 executeTasksInParallel: Parallel promises settled, processing results...');
      
      parallelResults.forEach((result, index) => {
        const taskId = parallelTasks[index].id;
        if (result.status === 'fulfilled') {
          console.log('🔧 executeTasksInParallel: Task', taskId, 'fulfilled successfully');
          results.push(result.value);
        } else {
          console.error('🔧 executeTasksInParallel: Task', taskId, 'rejected:', result.reason);
          results.push({
            agentId: parallelTasks[index].id,
            success: false,
            error: result.reason?.message || 'Unknown error',
            duration: 0
          });
        }
      });
    }

    // Execute sequential tasks one by one
    for (const task of sequentialTasks) {
      try {
        const result = await this.executeTask(task, request, existingResults, onProgress);
        results.push(result);
        
        // Update existing results for next sequential task
        if (result.success && result.output) {
          existingResults.set(result.agentId, result.output);
        }
      } catch (error) {
        results.push({
          agentId: task.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0
        });
      }
    }

    return results;
  }

  private async executeTask(
    task: TaskNode,
    request: ContentGenerationRequest,
    existingResults: Map<string, any>,
    onProgress?: (agentId: string, progress: number) => void
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const worker = this.workers.get(task.id);

    if (!worker || !worker.isAvailable) {
      throw new Error(`Worker ${task.id} not available`);
    }

    // PERFORMANCE FIX: Lazy initialize agent only when needed
    if (!worker.agent && worker.factory) {
      console.log(`🏗️ Lazy initializing agent: ${task.id}`);
      worker.agent = worker.factory();
      console.log(`✅ Agent ${task.id} initialized successfully`);
    }

    if (!worker.agent) {
      throw new Error(`Worker ${task.id} has no agent and no factory`);
    }

    // Mark worker as busy
    worker.isAvailable = false;
    worker.currentTask = task.id;

    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      console.log(`🔄 Starting ${task.id} (attempt ${task.retryCount + 1}/${task.maxRetries})`);
      
      if (onProgress) {
        onProgress(task.id, 0);
      }

      // Build context from existing results
      const context = {
        request,
        previousOutputs: Object.fromEntries(existingResults)
      };

      // Execute with progress tracking AND aggressive timeout
      progressInterval = setInterval(() => {
        if (onProgress) {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / (task.estimatedDuration * 1000)) * 100, 90);
          onProgress(task.id, progress);
        }
      }, 2000);

      // Wrap execution with timeout promise
      const executionPromise = worker.agent.execute(request, context);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${task.id} execution timeout after ${this.maxExecutionTime}ms`));
        }, this.maxExecutionTime);
      });

      const output = await Promise.race([executionPromise, timeoutPromise]);
      
      clearInterval(progressInterval);
      
      if (onProgress) {
        onProgress(task.id, 100);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ ${task.id} completed in ${duration}ms`);

      // Quality assessment using enhanced metrics
      const quality = await this.assessOutputQuality(task.id, output, request);

      const result: ExecutionResult = {
        agentId: task.id,
        success: true,
        output,
        duration,
        quality
      };

      this.executionHistory.push(result);
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${task.id} failed:`, error);

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      task.retryCount++;

      // No fallbacks - fail transparently as requested
      if (task.retryCount >= task.maxRetries) {
        console.log(`❌ ${task.id} exhausted retries - failing transparently (no fallbacks)`);
      }

      const result: ExecutionResult = {
        agentId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };

      this.executionHistory.push(result);
      return result;

    } finally {
      // Mark worker as available
      worker.isAvailable = true;
      worker.currentTask = undefined;
      worker.lastUsed = new Date();
    }
  }


  private async assessOutputQuality(
    agentId: string, 
    output: any, 
    request: ContentGenerationRequest
  ): Promise<number> {
    try {
      // Basic quality metrics
      let score = 0.5; // Base score

      // Check for required fields based on agent type
      if (agentId === 'content-writer' && output.content) {
        if (output.content.title && output.content.title.length > 10) score += 0.1;
        if (output.content.mainContent && output.content.mainContent.length > 0) score += 0.1;
        if (output.metadata && output.metadata.wordCount > 500) score += 0.1;
        if (output.qualityMetrics && output.qualityMetrics.originalityScore > 80) score += 0.1;
      }

      if (agentId === 'market-researcher' && output.industry && output.trends) {
        if (output.trends.length >= 3) score += 0.1;
        if (output.opportunities && output.opportunities.length >= 2) score += 0.1;
      }

      // Check for comprehensive output structure
      if (typeof output === 'object' && Object.keys(output).length > 3) score += 0.1;

      return Math.min(score, 1.0);
    } catch (error) {
      console.warn(`Quality assessment failed for ${agentId}:`, error);
      return 0.6; // Default acceptable score
    }
  }

  private processResults(
    results: ExecutionResult[],
    completed: Set<string>,
    failed: Set<string>,
    outputMap: Map<string, any>
  ): void {
    results.forEach(result => {
      if (result.success) {
        completed.add(result.agentId);
        if (result.output) {
          outputMap.set(result.agentId, result.output);
        }
        console.log(`✅ ${result.agentId} completed successfully`);
      } else {
        const task = this.taskGraph.get(result.agentId);
        
        if (task && task.retryCount < task.maxRetries) {
          console.log(`🔄 ${result.agentId} will retry (${task.retryCount}/${task.maxRetries})`);
        } else {
          failed.add(result.agentId);
          console.log(`❌ ${result.agentId} failed permanently`);
        }
      }
    });
  }

  public getExecutionStats(): {
    totalExecutions: number;
    successRate: number;
    avgDuration: number;
    qualityScore: number;
  } {
    if (this.executionHistory.length === 0) {
      return { totalExecutions: 0, successRate: 0, avgDuration: 0, qualityScore: 0 };
    }

    const successful = this.executionHistory.filter(r => r.success);
    const avgDuration = this.executionHistory.reduce((acc, r) => acc + r.duration, 0) / this.executionHistory.length;
    const avgQuality = successful
      .filter(r => r.quality !== undefined)
      .reduce((acc, r) => acc + (r.quality || 0), 0) / successful.length;

    return {
      totalExecutions: this.executionHistory.length,
      successRate: successful.length / this.executionHistory.length,
      avgDuration: Math.round(avgDuration),
      qualityScore: avgQuality || 0
    };
  }

  public async healthCheck(): Promise<Map<string, boolean>> {
    const health = new Map<string, boolean>();
    
    const healthPromises = Array.from(this.workers.entries()).map(async ([id, worker]) => {
      try {
        if (typeof worker.agent.healthCheck === 'function') {
          await worker.agent.healthCheck();
          return [id, true] as const;
        }
        return [id, true] as const;
      } catch (error) {
        console.error(`Health check failed for ${id}:`, error);
        return [id, false] as const;
      }
    });

    const results = await Promise.allSettled(healthPromises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        health.set(result.value[0], result.value[1]);
      }
    });

    return health;
  }
}