import { ContentGenerationRequest } from '@/types/content';

interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  agentId: string;
  priority: number;
  dependencies: string[];
  requiredForTypes: string[];
  optionalForTypes: string[];
  estimatedDuration: number;
  qualityWeight: number;
}

interface DelegationStrategy {
  contentType: string;
  requiredTasks: string[];
  optionalTasks: string[];
  priorityModifiers: Record<string, number>;
  qualityThresholds: Record<string, number>;
  timeConstraints: {
    maxDuration: number;
    prioritizeSpeed: boolean;
  };
}

export class DynamicTaskDelegator {
  private taskDefinitions: Map<string, TaskDefinition>;
  private delegationStrategies: Map<string, DelegationStrategy>;

  constructor() {
    this.taskDefinitions = new Map();
    this.delegationStrategies = new Map();
    this.initializeTaskDefinitions();
    this.initializeDelegationStrategies();
  }

  private initializeTaskDefinitions(): void {
    const tasks: TaskDefinition[] = [
      {
        id: 'market-research',
        name: 'Market Research',
        description: 'Analyze market trends and competitive landscape',
        agentId: 'market-researcher',
        priority: 9,
        dependencies: [],
        requiredForTypes: ['blog', 'landing', 'email', 'whitepaper'],
        optionalForTypes: ['social'],
        estimatedDuration: 180,
        qualityWeight: 0.85
      },
      {
        id: 'audience-analysis',
        name: 'Audience Analysis',
        description: 'Research target audience and create personas',
        agentId: 'audience-analyzer',
        priority: 9,
        dependencies: [],
        requiredForTypes: ['landing', 'email', 'whitepaper'],
        optionalForTypes: ['blog', 'social'],
        estimatedDuration: 120,
        qualityWeight: 0.9
      },
      {
        id: 'content-strategy',
        name: 'Content Strategy',
        description: 'Develop comprehensive content strategy and outline',
        agentId: 'content-strategist',
        priority: 8,
        dependencies: ['market-research', 'audience-analysis'],
        requiredForTypes: ['blog', 'landing', 'whitepaper'],
        optionalForTypes: ['email', 'social'],
        estimatedDuration: 150,
        qualityWeight: 0.95
      },
      {
        id: 'seo-optimization',
        name: 'SEO Optimization',
        description: 'Optimize content for search engines and AI search',
        agentId: 'ai-seo-optimizer',
        priority: 7,
        dependencies: [],
        requiredForTypes: ['blog', 'landing', 'whitepaper'],
        optionalForTypes: ['email'],
        estimatedDuration: 90,
        qualityWeight: 0.8
      },
      {
        id: 'content-writing',
        name: 'Content Writing',
        description: 'Create engaging, conversion-focused content',
        agentId: 'content-writer',
        priority: 10,
        dependencies: ['content-strategy', 'seo-optimization'],
        requiredForTypes: ['blog', 'landing', 'email', 'whitepaper'],
        optionalForTypes: ['social'],
        estimatedDuration: 240,
        qualityWeight: 1.0
      },
      {
        id: 'content-editing',
        name: 'Content Editing',
        description: 'Review and polish content for quality and consistency',
        agentId: 'content-editor',
        priority: 8,
        dependencies: ['content-writing'],
        requiredForTypes: ['blog', 'landing', 'whitepaper'],
        optionalForTypes: ['email', 'social'],
        estimatedDuration: 120,
        qualityWeight: 0.85
      },
      {
        id: 'social-adaptation',
        name: 'Social Media Adaptation',
        description: 'Adapt content for social media platforms',
        agentId: 'social-media-specialist',
        priority: 6,
        dependencies: ['content-strategy'],
        requiredForTypes: ['social'],
        optionalForTypes: ['blog', 'landing'],
        estimatedDuration: 90,
        qualityWeight: 0.75
      },
      {
        id: 'landing-optimization',
        name: 'Landing Page Optimization',
        description: 'Optimize for conversion and user experience',
        agentId: 'landing-page-specialist',
        priority: 8,
        dependencies: ['content-strategy'],
        requiredForTypes: ['landing'],
        optionalForTypes: [],
        estimatedDuration: 120,
        qualityWeight: 0.9
      },
      {
        id: 'performance-analysis',
        name: 'Performance Analysis',
        description: 'Set up analytics and define success metrics',
        agentId: 'performance-analyst',
        priority: 5,
        dependencies: ['content-editing'],
        requiredForTypes: [],
        optionalForTypes: ['blog', 'landing', 'email', 'whitepaper', 'social'],
        estimatedDuration: 60,
        qualityWeight: 0.7
      }
    ];

    tasks.forEach(task => {
      this.taskDefinitions.set(task.id, task);
    });
  }

  private initializeDelegationStrategies(): void {
    const strategies: DelegationStrategy[] = [
      {
        contentType: 'blog',
        requiredTasks: ['market-research', 'content-strategy', 'seo-optimization', 'content-writing', 'content-editing'],
        optionalTasks: ['audience-analysis', 'performance-analysis'],
        priorityModifiers: {
          'seo-optimization': 1.5,
          'content-writing': 1.3,
          'content-editing': 1.2
        },
        qualityThresholds: {
          'content-writing': 0.85,
          'seo-optimization': 0.8,
          'content-editing': 0.8
        },
        timeConstraints: {
          maxDuration: 900, // 15 minutes
          prioritizeSpeed: false
        }
      },
      {
        contentType: 'landing',
        requiredTasks: ['audience-analysis', 'content-strategy', 'seo-optimization', 'content-writing', 'landing-optimization'],
        optionalTasks: ['market-research', 'content-editing', 'performance-analysis'],
        priorityModifiers: {
          'audience-analysis': 1.5,
          'landing-optimization': 1.4,
          'content-writing': 1.3
        },
        qualityThresholds: {
          'audience-analysis': 0.9,
          'landing-optimization': 0.85,
          'content-writing': 0.85
        },
        timeConstraints: {
          maxDuration: 720, // 12 minutes
          prioritizeSpeed: true
        }
      },
      {
        contentType: 'social',
        requiredTasks: ['social-adaptation'],
        optionalTasks: ['market-research', 'audience-analysis', 'content-strategy', 'performance-analysis'],
        priorityModifiers: {
          'social-adaptation': 2.0,
          'audience-analysis': 1.3
        },
        qualityThresholds: {
          'social-adaptation': 0.8
        },
        timeConstraints: {
          maxDuration: 300, // 5 minutes
          prioritizeSpeed: true
        }
      },
      {
        contentType: 'email',
        requiredTasks: ['audience-analysis', 'content-writing'],
        optionalTasks: ['market-research', 'content-strategy', 'seo-optimization', 'content-editing', 'performance-analysis'],
        priorityModifiers: {
          'audience-analysis': 1.6,
          'content-writing': 1.4
        },
        qualityThresholds: {
          'audience-analysis': 0.85,
          'content-writing': 0.8
        },
        timeConstraints: {
          maxDuration: 480, // 8 minutes
          prioritizeSpeed: true
        }
      },
      {
        contentType: 'whitepaper',
        requiredTasks: ['market-research', 'audience-analysis', 'content-strategy', 'seo-optimization', 'content-writing', 'content-editing'],
        optionalTasks: ['performance-analysis'],
        priorityModifiers: {
          'market-research': 1.4,
          'content-strategy': 1.5,
          'content-writing': 1.3,
          'content-editing': 1.3
        },
        qualityThresholds: {
          'market-research': 0.85,
          'content-strategy': 0.9,
          'content-writing': 0.9,
          'content-editing': 0.85
        },
        timeConstraints: {
          maxDuration: 1200, // 20 minutes
          prioritizeSpeed: false
        }
      }
    ];

    strategies.forEach(strategy => {
      this.delegationStrategies.set(strategy.contentType, strategy);
    });
  }

  public delegateTasks(
    request: ContentGenerationRequest,
    availableTime?: number,
    qualityPriority?: 'speed' | 'balanced' | 'quality'
  ): {
    selectedTasks: TaskDefinition[];
    estimatedDuration: number;
    priorityOrder: TaskDefinition[];
    parallelGroups: TaskDefinition[][];
    adaptedStrategy: DelegationStrategy;
  } {
    const contentType = request.contentType;
    const strategy = this.delegationStrategies.get(contentType);

    if (!strategy) {
      throw new Error(`No delegation strategy found for content type: ${contentType}`);
    }

    // Adapt strategy based on constraints
    const adaptedStrategy = this.adaptStrategy(strategy, request, availableTime, qualityPriority);
    
    // Select tasks based on adapted strategy
    const selectedTasks = this.selectTasks(adaptedStrategy, request);
    
    // Calculate priority order with dynamic adjustments
    const priorityOrder = this.calculatePriorityOrder(selectedTasks, adaptedStrategy, request);
    
    // Group tasks for parallel execution
    const parallelGroups = this.groupTasksForParallelExecution(priorityOrder);
    
    // Calculate estimated duration
    const estimatedDuration = this.calculateEstimatedDuration(parallelGroups);

    console.log(`🎯 Task delegation for ${contentType}:`, {
      selectedTasksCount: selectedTasks.length,
      estimatedDuration: `${Math.round(estimatedDuration / 60)}m`,
      parallelGroupsCount: parallelGroups.length
    });

    return {
      selectedTasks,
      estimatedDuration,
      priorityOrder,
      parallelGroups,
      adaptedStrategy
    };
  }

  private adaptStrategy(
    baseStrategy: DelegationStrategy,
    request: ContentGenerationRequest,
    availableTime?: number,
    qualityPriority?: 'speed' | 'balanced' | 'quality'
  ): DelegationStrategy {
    const adapted = JSON.parse(JSON.stringify(baseStrategy)) as DelegationStrategy;

    // Adapt based on available time
    if (availableTime && availableTime < baseStrategy.timeConstraints.maxDuration) {
      adapted.timeConstraints.maxDuration = availableTime;
      adapted.timeConstraints.prioritizeSpeed = true;
      
      // Reduce optional tasks if time is limited
      if (availableTime < baseStrategy.timeConstraints.maxDuration * 0.7) {
        adapted.optionalTasks = adapted.optionalTasks.slice(0, Math.floor(adapted.optionalTasks.length / 2));
      }
    }

    // Adapt based on quality priority
    switch (qualityPriority) {
      case 'speed':
        adapted.timeConstraints.prioritizeSpeed = true;
        // Lower quality thresholds for speed
        Object.keys(adapted.qualityThresholds).forEach(task => {
          adapted.qualityThresholds[task] *= 0.9;
        });
        // Reduce optional tasks
        adapted.optionalTasks = adapted.optionalTasks.slice(0, 1);
        break;

      case 'quality':
        adapted.timeConstraints.prioritizeSpeed = false;
        // Increase quality thresholds
        Object.keys(adapted.qualityThresholds).forEach(task => {
          adapted.qualityThresholds[task] = Math.min(0.95, adapted.qualityThresholds[task] * 1.1);
        });
        // Include more optional tasks
        adapted.optionalTasks = Array.from(
          new Set([...adapted.optionalTasks, ...this.getQualityEnhancingTasks(request.contentType)])
        );
        break;

      case 'balanced':
      default:
        // Keep default strategy
        break;
    }

    // Adapt based on request specifics
    if (request.audience && request.audience.toLowerCase().includes('technical')) {
      adapted.priorityModifiers['market-research'] = (adapted.priorityModifiers['market-research'] || 1) * 1.2;
      adapted.qualityThresholds['market-research'] = Math.min(0.95, (adapted.qualityThresholds['market-research'] || 0.8) * 1.1);
    }

    if (request.goals && Array.isArray(request.goals) && request.goals.some(goal => goal.toLowerCase().includes('seo'))) {
      adapted.priorityModifiers['seo-optimization'] = (adapted.priorityModifiers['seo-optimization'] || 1) * 1.3;
      adapted.qualityThresholds['seo-optimization'] = Math.min(0.95, (adapted.qualityThresholds['seo-optimization'] || 0.8) * 1.1);
    }

    return adapted;
  }

  private selectTasks(strategy: DelegationStrategy, request: ContentGenerationRequest): TaskDefinition[] {
    const selectedTasks: TaskDefinition[] = [];

    // Always include required tasks
    strategy.requiredTasks.forEach(taskId => {
      const task = this.taskDefinitions.get(taskId);
      if (task) {
        selectedTasks.push(task);
      }
    });

    // Selectively include optional tasks based on strategy and constraints
    const optionalTasksToInclude = this.selectOptionalTasks(strategy, request);
    optionalTasksToInclude.forEach(taskId => {
      const task = this.taskDefinitions.get(taskId);
      if (task) {
        selectedTasks.push(task);
      }
    });

    return selectedTasks;
  }

  private selectOptionalTasks(strategy: DelegationStrategy, request: ContentGenerationRequest): string[] {
    const selectedOptional: string[] = [];
    const availableTime = strategy.timeConstraints.maxDuration;
    const requiredTime = this.calculateRequiredTasksTime(strategy.requiredTasks);
    const remainingTime = availableTime - requiredTime;

    if (remainingTime <= 0) {
      return selectedOptional;
    }

    // Score optional tasks based on value and available time
    const scoredOptionalTasks = strategy.optionalTasks.map(taskId => {
      const task = this.taskDefinitions.get(taskId);
      if (!task) return null;

      const timeValue = remainingTime / task.estimatedDuration;
      const qualityValue = task.qualityWeight;
      const priorityValue = strategy.priorityModifiers[taskId] || 1;
      
      const score = (timeValue * 0.4 + qualityValue * 0.4 + priorityValue * 0.2);

      return { taskId, score, duration: task.estimatedDuration };
    }).filter(Boolean) as Array<{ taskId: string; score: number; duration: number }>;

    // Sort by score and select tasks that fit in remaining time
    scoredOptionalTasks.sort((a, b) => b.score - a.score);

    let usedTime = 0;
    for (const optionalTask of scoredOptionalTasks) {
      if (usedTime + optionalTask.duration <= remainingTime) {
        selectedOptional.push(optionalTask.taskId);
        usedTime += optionalTask.duration;
      }
    }

    return selectedOptional;
  }

  private calculateRequiredTasksTime(requiredTasks: string[]): number {
    return requiredTasks.reduce((total, taskId) => {
      const task = this.taskDefinitions.get(taskId);
      return total + (task?.estimatedDuration || 0);
    }, 0);
  }

  private calculatePriorityOrder(
    tasks: TaskDefinition[], 
    strategy: DelegationStrategy, 
    request: ContentGenerationRequest
  ): TaskDefinition[] {
    return tasks.slice().sort((a, b) => {
      const aModifier = strategy.priorityModifiers[a.id] || 1;
      const bModifier = strategy.priorityModifiers[b.id] || 1;
      
      const aPriority = a.priority * aModifier;
      const bPriority = b.priority * bModifier;

      // Higher priority first
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // Then by quality weight
      if (a.qualityWeight !== b.qualityWeight) {
        return b.qualityWeight - a.qualityWeight;
      }

      // Finally by estimated duration (shorter first if prioritizing speed)
      if (strategy.timeConstraints.prioritizeSpeed) {
        return a.estimatedDuration - b.estimatedDuration;
      }

      return 0;
    });
  }

  private groupTasksForParallelExecution(priorityOrder: TaskDefinition[]): TaskDefinition[][] {
    const groups: TaskDefinition[][] = [];
    const completed = new Set<string>();

    while (completed.size < priorityOrder.length) {
      const currentGroup: TaskDefinition[] = [];

      for (const task of priorityOrder) {
        if (completed.has(task.id)) continue;

        // Check if all dependencies are completed
        const dependenciesMet = task.dependencies.every(dep => completed.has(dep));
        
        if (dependenciesMet) {
          currentGroup.push(task);
          completed.add(task.id);
        }
      }

      if (currentGroup.length === 0) {
        // Safety check for circular dependencies
        console.warn('Circular dependency detected or no more tasks can be executed');
        break;
      }

      groups.push(currentGroup);
    }

    return groups;
  }

  private calculateEstimatedDuration(parallelGroups: TaskDefinition[][]): number {
    return parallelGroups.reduce((total, group) => {
      // Duration is the maximum duration in the group (since they run in parallel)
      const groupDuration = Math.max(...group.map(task => task.estimatedDuration));
      return total + groupDuration;
    }, 0);
  }

  private getQualityEnhancingTasks(contentType: string): string[] {
    const qualityTasks = ['content-editing', 'performance-analysis'];
    
    switch (contentType) {
      case 'blog':
      case 'whitepaper':
        return [...qualityTasks, 'market-research'];
      case 'landing':
        return [...qualityTasks, 'audience-analysis'];
      case 'email':
        return ['content-editing'];
      case 'social':
        return ['performance-analysis'];
      default:
        return qualityTasks;
    }
  }

  public getStrategyRecommendations(request: ContentGenerationRequest): {
    recommendedStrategy: string;
    estimatedDuration: number;
    qualityScore: number;
    alternativeStrategies: Array<{
      name: string;
      duration: number;
      quality: number;
      description: string;
    }>;
  } {
    const contentType = request.contentType;
    const strategy = this.delegationStrategies.get(contentType);

    if (!strategy) {
      throw new Error(`No strategy found for content type: ${contentType}`);
    }

    const delegation = this.delegateTasks(request);
    
    const qualityScore = delegation.selectedTasks.reduce((sum, task) => 
      sum + task.qualityWeight, 0) / delegation.selectedTasks.length;

    const alternatives = [
      {
        name: 'Speed Optimized',
        duration: delegation.estimatedDuration * 0.6,
        quality: qualityScore * 0.85,
        description: 'Faster execution with minimal quality impact'
      },
      {
        name: 'Quality Optimized',
        duration: delegation.estimatedDuration * 1.4,
        quality: qualityScore * 1.15,
        description: 'Maximum quality with extended processing time'
      },
      {
        name: 'Balanced',
        duration: delegation.estimatedDuration,
        quality: qualityScore,
        description: 'Optimal balance of speed and quality'
      }
    ];

    return {
      recommendedStrategy: 'Balanced',
      estimatedDuration: delegation.estimatedDuration,
      qualityScore,
      alternativeStrategies: alternatives
    };
  }
}