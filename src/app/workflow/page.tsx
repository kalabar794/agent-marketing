'use client';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressPipeline } from "@/components/ProgressPipeline";
import { AgentAvatar } from "@/components/AgentAvatar";
import { WorkflowStatus } from "@/types/content";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Pause,
  Play,
  RefreshCw,
  Download,
  Eye,
  MessageSquare,
  AlertCircle,
  Search,
  Users,
  Lightbulb,
  Target,
  PenTool,
  Edit3,
  Share2,
  Globe,
  BarChart3,
  Sparkles,
  Brain,
  Zap
} from "lucide-react";
import Link from "next/link";

// Enhanced agent mapping with professional Lucide icons and better categorization
const agentMapping: Record<string, { 
  name: string; 
  icon: any; // Lucide React component
  role: string; 
  description: string;
  category: 'research' | 'strategy' | 'creation' | 'optimization' | 'analysis';
  color: {
    primary: string;
    secondary: string;
    bg: string;
    border: string;
    text: string;
  };
}> = {
  'market-researcher': { 
    name: 'Market Researcher', 
    icon: Search, 
    role: 'Market Analysis', 
    description: 'Analyzing market trends and competitive landscape',
    category: 'research',
    color: {
      primary: 'from-blue-500 to-cyan-500',
      secondary: 'from-blue-600/20 to-cyan-600/10',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400'
    }
  },
  'audience-analyzer': { 
    name: 'Audience Analyzer', 
    icon: Users, 
    role: 'Audience Research', 
    description: 'Researching target demographics and user behavior',
    category: 'research',
    color: {
      primary: 'from-green-500 to-emerald-500',
      secondary: 'from-green-600/20 to-emerald-600/10',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400'
    }
  },
  'content-strategist': { 
    name: 'Content Strategist', 
    icon: Lightbulb, 
    role: 'Strategy & Planning', 
    description: 'Developing comprehensive content strategies',
    category: 'strategy',
    color: {
      primary: 'from-purple-500 to-violet-500',
      secondary: 'from-purple-600/20 to-violet-600/10',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400'
    }
  },
  'ai-seo-optimizer': { 
    name: 'SEO Optimizer', 
    icon: Target, 
    role: 'Search Optimization', 
    description: 'Optimizing content for search engines and keywords',
    category: 'optimization',
    color: {
      primary: 'from-orange-500 to-red-500',
      secondary: 'from-orange-600/20 to-red-600/10',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400'
    }
  },
  'content-writer': { 
    name: 'Content Writer', 
    icon: PenTool, 
    role: 'Content Creation', 
    description: 'Creating compelling, on-brand written content',
    category: 'creation',
    color: {
      primary: 'from-pink-500 to-rose-500',
      secondary: 'from-pink-600/20 to-rose-600/10',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/30',
      text: 'text-pink-400'
    }
  },
  'content-editor': { 
    name: 'Content Editor', 
    icon: Edit3, 
    role: 'Content Review', 
    description: 'Reviewing and refining content quality',
    category: 'optimization',
    color: {
      primary: 'from-indigo-500 to-blue-500',
      secondary: 'from-indigo-600/20 to-blue-600/10',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400'
    }
  },
  'social-media-specialist': { 
    name: 'Social Media Specialist', 
    icon: Share2, 
    role: 'Social Strategy', 
    description: 'Creating platform-specific social media content',
    category: 'strategy',
    color: {
      primary: 'from-cyan-500 to-teal-500',
      secondary: 'from-cyan-600/20 to-teal-600/10',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400'
    }
  },
  'landing-page-specialist': { 
    name: 'Landing Page Specialist', 
    icon: Globe, 
    role: 'Conversion Optimization', 
    description: 'Designing high-converting landing pages',
    category: 'optimization',
    color: {
      primary: 'from-lime-500 to-green-500',
      secondary: 'from-lime-600/20 to-green-600/10',
      bg: 'bg-lime-500/10',
      border: 'border-lime-500/30',
      text: 'text-lime-400'
    }
  },
  'performance-analyst': { 
    name: 'Performance Analyst', 
    icon: BarChart3, 
    role: 'Analytics & Tracking', 
    description: 'Tracking performance metrics and ROI analysis',
    category: 'analysis',
    color: {
      primary: 'from-yellow-500 to-amber-500',
      secondary: 'from-yellow-600/20 to-amber-600/10',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400'
    }
  }
};

// Utility function to format percentages properly
const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  
  // Handle very small or very large numbers
  if (value < 0.01 && value > 0) return '<1%';
  if (value > 100) return '100%';
  if (value < 0) return '0%';
  
  // Round to 1 decimal place for numbers between 0-10, whole numbers for 10+
  return value >= 10 ? `${Math.round(value)}%` : `${Math.round(value * 10) / 10}%`;
};

// Enhanced agent card component
const EnhancedAgentCard = ({ 
  agent, 
  agentInfo, 
  isActive = false, 
  progress 
}: { 
  agent: any; 
  agentInfo: any; 
  isActive?: boolean; 
  progress?: number;
}) => {
  const IconComponent = agentInfo.icon;
  
  return (
    <div className={`group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-1 ${
      isActive 
        ? `${agentInfo.color.bg} ${agentInfo.color.border} border-2 shadow-2xl` 
        : 'bg-gray-800/50 border border-gray-600/30 hover:border-gray-500/50'
    }`}>
      {/* Animated background glow for active agents */}
      {isActive && (
        <div className={`absolute inset-0 bg-gradient-to-br ${agentInfo.color.secondary} opacity-50 animate-pulse`}></div>
      )}
      
      {/* Status indicator dot */}
      <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
        agent.status === 'completed' 
          ? 'bg-green-500 animate-pulse' 
          : agent.status === 'running' 
          ? 'bg-blue-500 animate-pulse' 
          : agent.status === 'failed'
          ? 'bg-red-500'
          : 'bg-gray-500'
      }`}>
        {agent.status === 'running' && (
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        )}
      </div>
      
      <div className="relative p-6 z-10">
        {/* Icon and basic info */}
        <div className="flex items-start space-x-4 mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${agentInfo.color.primary} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-base mb-1 ${isActive ? agentInfo.color.text : 'text-white'} group-hover:text-yellow-300 transition-colors duration-300`}>
              {agentInfo.name}
            </h3>
            <p className="text-sm text-gray-300 font-medium">{agentInfo.role}</p>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                agent.category === 'research' ? 'bg-blue-400' :
                agent.category === 'strategy' ? 'bg-purple-400' :
                agent.category === 'creation' ? 'bg-pink-400' :
                agent.category === 'optimization' ? 'bg-orange-400' :
                'bg-yellow-400'
              }`}></div>
              <span className="text-xs text-gray-400 capitalize">{agentInfo.category}</span>
            </div>
          </div>
        </div>

        {/* Progress section */}
        {typeof progress === 'number' && agent.status === 'running' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Progress</span>
              <span className={`text-sm font-bold ${agentInfo.color.text}`}>
                {formatPercentage(progress)}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${agentInfo.color.primary} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.max(5, Math.min(100, progress || 0))}%` }}
              />
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="flex items-center justify-between">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            agent.status === 'completed' 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : agent.status === 'running' 
              ? `${agentInfo.color.bg} ${agentInfo.color.text} border ${agentInfo.color.border}` 
              : agent.status === 'failed'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
          }`}>
            {agent.status === 'running' && <Zap className="w-3 h-3 inline mr-1" />}
            {agent.status === 'completed' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
          </div>
          
          {agent.duration && agent.status === 'completed' && (
            <span className="text-xs text-gray-400">{agent.duration}s</span>
          )}
        </div>

        {/* Description for inactive agents */}
        {!isActive && (
          <p className="text-xs text-gray-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {agentInfo.description}
          </p>
        )}
      </div>
    </div>
  );
};

function WorkflowPageContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');
  
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!workflowId) {
      setError('No workflow ID provided');
      setIsLoading(false);
      return;
    }

    const fetchWorkflowStatus = async () => {
      try {
        console.log(`Fetching status for workflow: ${workflowId}`);
        const response = await fetch(`/api/content/generate?workflowId=${workflowId}`);
        
        if (!response.ok) {
          console.error(`API responded with status: ${response.status}`);
          
          if (response.status === 404) {
            // Check if this is an old workflow by parsing the timestamp
            const timestampMatch = workflowId.match(/(\d+)/);
            if (timestampMatch) {
              const workflowTime = parseInt(timestampMatch[1]);
              const now = Date.now();
              const ageInMinutes = (now - workflowTime) / (1000 * 60);
              
              if (ageInMinutes > 30) {
                throw new Error(`Workflow expired. This workflow was created ${Math.round(ageInMinutes)} minutes ago and is no longer available.`);
              }
            }
            throw new Error('Workflow not found. It may have expired or never existed.');
          }
          
          const errorText = await response.text();
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        
        const status = await response.json();
        console.log('Received workflow status:', status);
        setWorkflowStatus(status);
        setError(null);
      } catch (err) {
        console.error('Workflow fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred while fetching workflow status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflowStatus();

    // Poll for updates every 3 seconds if workflow is running
    const interval = setInterval(() => {
      if (isRunning && workflowStatus?.status !== 'completed' && workflowStatus?.status !== 'failed') {
        fetchWorkflowStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [workflowId, isRunning, workflowStatus?.status]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getProgressPercentage = () => {
    if (!workflowStatus?.agents) return 0;
    const completed = workflowStatus.agents.filter(agent => agent.status === 'completed').length;
    return Math.round((completed / workflowStatus.agents.length) * 100);
  };

  const getCurrentStage = () => {
    if (!workflowStatus?.agents) return null;
    return workflowStatus.agents.find(agent => agent.status === 'running') || null;
  };

  const getLiveUpdates = () => {
    if (!workflowStatus?.agents) return [];
    
    return workflowStatus.agents
      .filter(agent => agent.status !== 'pending')
      .map(agent => ({
        agent: agentMapping[agent.agentId]?.name || agent.agentId,
        action: agent.status === 'completed' ? 'Completed analysis and content generation' : 
                agent.status === 'running' ? 'Currently processing...' : 
                agent.status === 'failed' ? `Failed: ${agent.error}` : 'Processing',
        time: agent.startTime ? new Date(agent.startTime).toLocaleTimeString() : 'Now',
        type: agent.status === 'completed' ? 'success' : 'info'
      }))
      .slice(-5); // Show only last 5 updates
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Workflow...</h2>
          <p className="text-muted-foreground">Getting real-time status from AI agents</p>
        </div>
      </div>
    );
  }

  if (error || !workflowStatus) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-6xl mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-white mb-3">AI Agent Specialists</h2>
          {error === 'No workflow ID provided' ? (
            <>
              <p className="text-gray-300 mb-6">
                Meet the specialized AI agents that power our content generation system.
              </p>
              
              {/* Enhanced Agent Grid with Professional Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {Object.entries(agentMapping).map(([id, agentInfo]) => {
                  const IconComponent = agentInfo.icon;
                  
                  return (
                    <div 
                      key={id} 
                      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${agentInfo.color.secondary} backdrop-blur-xl border ${agentInfo.color.border} shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2`}
                    >
                      {/* Animated background glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${agentInfo.color.secondary} opacity-0 group-hover:opacity-70 transition-opacity duration-500`}></div>
                      
                      {/* Floating particles effect */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-2 right-2 w-1 h-1 bg-white/60 rounded-full animate-twinkle"></div>
                        <div className="absolute bottom-4 left-4 w-1 h-1 bg-white/40 rounded-full animate-twinkle-delay"></div>
                        <div className="absolute top-1/2 left-2 w-0.5 h-0.5 bg-white/30 rounded-full animate-pulse"></div>
                      </div>
                      
                      {/* Category badge */}
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white/90 border border-white/30`}>
                        {agentInfo.category}
                      </div>
                      
                      <div className="relative p-6 z-10">
                        <div className="flex items-start space-x-4 mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${agentInfo.color.primary} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-white mb-1 group-hover:text-yellow-300 transition-colors duration-300">
                              {agentInfo.name}
                            </h3>
                            <p className="text-sm text-white/80 font-medium">{agentInfo.role}</p>
                          </div>
                        </div>
                        
                        {/* Agent capabilities */}
                        <div className="space-y-2">
                          <p className="text-xs text-white/70 leading-relaxed">
                            {agentInfo.description}
                          </p>
                          
                          {/* Specialized features per agent */}
                          <div className="space-y-1 mt-3">
                            {id === 'market-researcher' && (
                              <>
                                <div className="flex items-center text-xs text-white/70">
                                  <div className={`w-1 h-1 rounded-full mr-2 ${agentInfo.color.text.replace('text-', 'bg-')}`}></div>
                                  Competitive landscape analysis
                                </div>
                                <div className="flex items-center text-xs text-white/70">
                                  <div className={`w-1 h-1 rounded-full mr-2 ${agentInfo.color.text.replace('text-', 'bg-')}`}></div>
                                  Market trend identification
                                </div>
                                <div className="flex items-center text-xs text-white/70">
                                  <div className={`w-1 h-1 rounded-full mr-2 ${agentInfo.color.text.replace('text-', 'bg-')}`}></div>
                                  Data-driven insights
                                </div>
                              </>
                            )}
                            
                            {id === 'audience-analyzer' && (
                              <>
                                <div className="flex items-center text-xs text-white/70">
                                  <div className={`w-1 h-1 rounded-full mr-2 ${agentInfo.color.text.replace('text-', 'bg-')}`}></div>
                                  Demographic profiling
                                </div>
                                <div className="flex items-center text-xs text-white/70">
                                  <div className={`w-1 h-1 rounded-full mr-2 ${agentInfo.color.text.replace('text-', 'bg-')}`}></div>
                                  Behavior pattern analysis
                                </div>
                                <div className="flex items-center text-xs text-white/70">
                                  <div className={`w-1 h-1 rounded-full mr-2 ${agentInfo.color.text.replace('text-', 'bg-')}`}></div>
                                  Persona development
                                </div>
                              </>
                            )}
                            
                            {/* Add similar patterns for other agents... */}
                            {(id !== 'market-researcher' && id !== 'audience-analyzer') && (
                              <div className="flex items-center text-xs text-white/70">
                                <Brain className="w-3 h-3 mr-2 opacity-50" />
                                AI-powered {agentInfo.role.toLowerCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-3">
                <Link href="/create">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    Start New Content Generation
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="max-w-2xl mx-auto">
                <p className="text-gray-300 mb-4 text-lg">{error || 'Workflow not found'}</p>
                
                {error?.includes('expired') && (
                  <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6 text-yellow-200">
                    <h3 className="font-semibold mb-2">⏰ Workflow Expired</h3>
                    <p className="text-sm">
                      Workflows are automatically cleaned up after 30 minutes to preserve server resources. 
                      Your content may still be available if it was generated successfully.
                    </p>
                  </div>
                )}
                
                {error?.includes('not found') && !error?.includes('expired') && (
                  <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6 text-red-200">
                    <h3 className="font-semibold mb-2">🚫 Workflow Not Found</h3>
                    <p className="text-sm">
                      This workflow doesn't exist or may have been removed. Please check the URL or start a new content generation.
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Button onClick={() => window.history.back()} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-200">
                    Go Back
                  </Button>
                  <Link href="/create">
                    <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10 transition-all duration-200">
                      Start New Content Generation
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200">
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Section with Vibrant Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-600/20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30 mb-6">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
              {workflowStatus?.workflowType === 'demo' ? 'Demo Mode - Live Preview' : 'Live Workflow Monitoring'}
            </div>
            {workflowStatus?.workflowType === 'demo' && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-400/50 rounded-lg backdrop-blur-sm text-yellow-300 text-sm">
                <span className="font-semibold">Demo Mode:</span> This is a preview showing how AI agents would collaborate. 
                For real AI content generation, the API key would need to be configured.
              </div>
            )}
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Workflow
              <br />
              <span className="text-yellow-300 drop-shadow-lg">in Progress</span>
            </h1>
            <p className="text-xl text-white/90 leading-relaxed drop-shadow-md">
              Watch your AI agents collaborate in real-time
            </p>
          </div>
        </div>
        
        {/* Floating Background Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-float-delay-1"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-400/20 rounded-full blur-lg animate-float-delay-2"></div>
      </section>
      
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Project Info */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <Button
                variant="outline"
                onClick={() => setIsRunning(!isRunning)}
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all duration-200"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              
              <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold px-6 py-3 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200">
                <Eye className="w-4 h-4 mr-2" />
                Preview Result
              </Button>
            </div>
          </div>

          {/* Project Status Card */}
          <Card className="shadow-2xl mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <h3 className="font-semibold text-white mb-1">{workflowStatus.content?.title || 'Content Generation Project'}</h3>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">AI Content Generation</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {formatPercentage(getProgressPercentage())}
                  </div>
                  <div className="text-sm text-gray-400">
                    {workflowStatus.agents.filter(agent => agent.status === 'completed').length} of {workflowStatus.agents.length} agents complete
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-white">ETA: {workflowStatus.estimatedTimeRemaining ? `${workflowStatus.estimatedTimeRemaining} min` : 'Calculating...'}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Started at {new Date(workflowStatus.startTime).toLocaleTimeString()}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Current time</div>
                  <div className="font-semibold text-white">
                    {formatTime(currentTime)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Workflow Pipeline */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <RefreshCw className={`w-5 h-5 text-yellow-400 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>Content Generation Pipeline</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Real-time progress through the content creation workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressPipeline stages={workflowStatus.agents.map(agent => {
                  const agentInfo = agentMapping[agent.agentId];
                  const IconComponent = agentInfo?.icon;
                  
                  return {
                    id: agent.agentId,
                    name: agentInfo?.name || agent.agentId,
                    status: agent.status === 'completed' ? 'completed' : agent.status === 'running' ? 'active' : 'pending',
                    progress: agent.progress,
                    icon: IconComponent ? <IconComponent className="w-5 h-5" /> : '🤖',
                    description: agentInfo?.description || 'AI Agent processing'
                  };
                })} currentStage={workflowStatus.currentAgent || workflowStatus.agents.find(a => a.status === 'running')?.agentId || ''} />
              </CardContent>
            </Card>

            {/* Stage Details */}
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Stage Details & Outputs</CardTitle>
                <CardDescription className="text-gray-300">
                  Detailed view of each workflow stage and its deliverables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowStatus.agents.map((agent) => {
                    const agentInfo = agentMapping[agent.agentId];
                    const IconComponent = agentInfo?.icon;
                    
                    return (
                      <div
                        key={agent.agentId}
                        className={`p-5 rounded-xl border transition-all duration-300 ${
                          agent.status === 'running'
                            ? `${agentInfo?.color.bg || 'bg-blue-500/10'} ${agentInfo?.color.border || 'border-blue-500/30'} shadow-lg`
                            : agent.status === 'completed'
                            ? 'bg-green-500/10 border-green-500/30 shadow-md'
                            : agent.status === 'failed'
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-gray-800/50 border-gray-600/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${agentInfo?.color.primary || 'from-gray-600 to-gray-700'} shadow-md`}>
                              {IconComponent ? (
                                <IconComponent className="w-5 h-5 text-white" />
                              ) : (
                                <Brain className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-white text-base">
                                {agentInfo?.name || agent.agentId}
                              </h4>
                              <p className="text-sm text-gray-300">
                                {agentInfo?.role || 'AI Agent'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {agent.duration && agent.status === 'completed' && (
                              <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                                {agent.duration}s
                              </span>
                            )}
                            <Badge 
                              variant={agent.status === 'completed' ? 'default' : 'secondary'}
                              className={`${
                                agent.status === 'completed' 
                                  ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                                  : agent.status === 'running' 
                                  ? `${agentInfo?.color.bg || 'bg-blue-500/20'} ${agentInfo?.color.text || 'text-blue-300'} border ${agentInfo?.color.border || 'border-blue-500/30'}` 
                                  : agent.status === 'failed'
                                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                  : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                              }`}
                            >
                              {agent.status === 'running' && <Zap className="w-3 h-3 inline mr-1" />}
                              {agent.status === 'completed' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                              {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Agent category and description */}
                        <div className="mb-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${
                              agentInfo?.category === 'research' ? 'bg-blue-400' :
                              agentInfo?.category === 'strategy' ? 'bg-purple-400' :
                              agentInfo?.category === 'creation' ? 'bg-pink-400' :
                              agentInfo?.category === 'optimization' ? 'bg-orange-400' :
                              'bg-yellow-400'
                            }`}></div>
                            <span className="text-xs text-gray-400 capitalize">
                              {agentInfo?.category || 'processing'}
                            </span>
                          </div>
                          {agentInfo?.description && (
                            <p className="text-sm text-gray-300">{agentInfo.description}</p>
                          )}
                        </div>

                        {/* Progress section for running agents */}
                        {agent.status === 'running' && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-gray-400">Progress</span>
                              <span className={`text-sm font-bold ${agentInfo?.color.text || 'text-blue-400'}`}>
                                {formatPercentage(agent.progress)}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${agentInfo?.color.primary || 'from-blue-500 to-cyan-500'} rounded-full transition-all duration-500 ease-out`}
                                style={{ width: `${Math.max(5, Math.min(100, agent.progress || 0))}%` }}
                              />
                            </div>
                            {(agent.progress || 0) < 10 && (
                              <div className={`mt-3 p-3 ${agentInfo?.color.bg || 'bg-blue-500/10'} border ${agentInfo?.color.border || 'border-blue-500/20'} rounded-lg text-xs ${agentInfo?.color.text || 'text-blue-300'}`}>
                                <span className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${agentInfo?.color.text?.replace('text-', 'bg-') || 'bg-blue-400'}`}></div>
                                  Initializing AI processing... This may take 30-60 seconds
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Error display */}
                        {agent.error && (
                          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
                            <span className="flex items-center">
                              <AlertCircle className="w-3 h-3 mr-2" />
                              Error: {agent.error}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Generated Content Display */}
            {workflowStatus.status === 'completed' && workflowStatus.content && (
              <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20" data-content-section>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span>Generated Content</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    AI-generated content ready for review and use
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Content Title */}
                    {workflowStatus.content.title && (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <h3 className="text-lg font-semibold text-green-400 mb-2">📝 Title</h3>
                        <p className="text-white">{workflowStatus.content.title}</p>
                      </div>
                    )}

                    {/* Main Content */}
                    {workflowStatus.content.content && (
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <h3 className="text-lg font-semibold text-blue-400 mb-2">📄 Main Content</h3>
                        <div className="text-white whitespace-pre-wrap max-h-96 overflow-y-auto">
                          {workflowStatus.content.content}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {workflowStatus.content.summary && (
                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <h3 className="text-lg font-semibold text-purple-400 mb-2">📋 Summary</h3>
                        <p className="text-white">{workflowStatus.content.summary}</p>
                      </div>
                    )}

                    {/* SEO Keywords */}
                    {workflowStatus.content.seoKeywords && workflowStatus.content.seoKeywords.length > 0 && (
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <h3 className="text-lg font-semibold text-orange-400 mb-2">🔍 SEO Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {workflowStatus.content.seoKeywords.map((keyword: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Platform Content */}
                    {workflowStatus.content.platforms && Object.keys(workflowStatus.content.platforms).length > 0 && (
                      <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">🌐 Platform Adaptations</h3>
                        <div className="space-y-3">
                          {Object.entries(workflowStatus.content.platforms).map(([platform, content]: [string, any]) => (
                            <div key={platform} className="bg-cyan-500/5 p-3 rounded">
                              <h4 className="font-medium text-cyan-300 capitalize mb-1">{platform}</h4>
                              <p className="text-white text-sm">{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quality Scores */}
                    {workflowStatus.qualityScores && (
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-2">⭐ Quality Scores</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(workflowStatus.qualityScores).map(([metric, score]: [string, any]) => (
                            <div key={metric} className="text-center">
                              <div className="text-lg font-bold text-yellow-300">
                                {formatPercentage((score as number) * 100)}
                              </div>
                              <div className="text-xs text-yellow-400 capitalize">{metric.replace(/([A-Z])/g, ' $1').trim()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Active Agents */}
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">AI Agents Status</CardTitle>
                <CardDescription className="text-gray-300">
                  Current activity of each AI agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowStatus.agents.map((agent) => {
                    const agentInfo = agentMapping[agent.agentId];
                    const isActive = agent.status === 'running';
                    
                    return (
                      <EnhancedAgentCard
                        key={agent.agentId}
                        agent={agent}
                        agentInfo={agentInfo}
                        isActive={isActive}
                        progress={agent.progress}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Live Activity Feed */}
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <MessageSquare className="w-5 h-5" />
                  <span>Live Activity</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Real-time updates from AI agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getLiveUpdates().map((update, index) => (
                    <div key={index} className="flex items-start space-x-3 text-sm">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        update.type === 'success' ? 'bg-success' : 'bg-accent'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white">{update.agent}</span>
                          <span className="text-xs text-gray-400">{update.time}</span>
                        </div>
                        <p className="text-gray-300">{update.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Progress Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Force Complete Stage
                </Button>
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold" 
                  disabled={workflowStatus.status !== 'completed' || !workflowStatus.content}
                  onClick={() => {
                    const contentSection = document.querySelector('[data-content-section]');
                    if (contentSection) {
                      contentSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  View Final Content
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Workflow...</h2>
          <p className="text-gray-300">Preparing your content generation workspace</p>
        </div>
      </div>
    }>
      <WorkflowPageContent />
    </Suspense>
  );
}