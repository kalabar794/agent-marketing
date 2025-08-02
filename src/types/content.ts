export interface ContentGenerationRequest {
  contentType: 'blog' | 'social' | 'email' | 'landing';
  topic: string;
  audience: string;
  goals: string;
  tone?: string;
  keywords?: string[];
  platforms?: string[];
  brandGuidelines?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  estimatedTime: number; // in minutes
  dependencies: string[];
}

export interface AgentResponse {
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  output?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface WorkflowStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentAgent?: string;
  agents: AgentResponse[];
  content?: GeneratedContent;
  qualityScores?: QualityScores;
  estimatedTimeRemaining?: number;
  startTime: Date;
  endTime?: Date;
}

export interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  summary: string;
  seoKeywords: string[];
  readabilityScore: number;
  platforms: PlatformContent[];
}

export interface PlatformContent {
  platform: string;
  content: string;
  hashtags?: string[];
  mediaRecommendations?: string[];
}

export interface QualityScores {
  readability: number; // Flesch Reading Ease (target: 60+)
  seo: number; // SEO optimization score (target: 85+)
  originality: number; // Uniqueness percentage (target: 95%+)
  brandAlignment: number; // Brand voice consistency (target: 90%+)
  overall: number; // Combined score
  evaluatedAt?: Date; // Optional evaluation timestamp
  recommendations?: string[]; // Optional recommendations
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  contentType: string;
  defaultAgents: string[];
  estimatedTime: number;
}

export interface AgentMetrics {
  totalRuns: number;
  averageTime: number;
  successRate: number;
  qualityContribution: number;
}