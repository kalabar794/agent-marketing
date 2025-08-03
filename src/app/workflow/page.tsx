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
  AlertCircle
} from "lucide-react";
import Link from "next/link";

const agentMapping: Record<string, { name: string; icon: string; role: string; description?: string }> = {
  'market-researcher': { name: 'Market Researcher', icon: '🔍', role: 'Market Analysis', description: 'Analyzing market trends' },
  'audience-analyzer': { name: 'Audience Analyzer', icon: '👥', role: 'Audience Research', description: 'Researching target audience' },
  'content-strategist': { name: 'Content Strategist', icon: '📋', role: 'Strategy & Planning', description: 'Creating content strategy' },
  'ai-seo-optimizer': { name: 'SEO Optimizer', icon: '🎯', role: 'Search Optimization', description: 'Optimizing for search' },
  'content-writer': { name: 'Content Writer', icon: '✍️', role: 'Content Creation', description: 'Writing content' },
  'content-editor': { name: 'Content Editor', icon: '📝', role: 'Content Review', description: 'Editing and reviewing' },
  'social-media-specialist': { name: 'Social Media Specialist', icon: '📱', role: 'Social Strategy', description: 'Social media optimization' },
  'landing-page-specialist': { name: 'Landing Page Specialist', icon: '🌐', role: 'Conversion Optimization', description: 'Landing page optimization' },
  'performance-analyst': { name: 'Performance Analyst', icon: '📊', role: 'Analytics & Tracking', description: 'Performance analysis' }
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
        const response = await fetch(`/api/content/generate?workflowId=${workflowId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workflow status');
        }
        const status = await response.json();
        setWorkflowStatus(status);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
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
              
              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {Object.entries(agentMapping).map(([id, agent]) => (
                  <Card key={id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="text-2xl">{agent.icon}</div>
                        <div>
                          <h3 className="font-semibold text-sm">{agent.name}</h3>
                          <p className="text-xs text-gray-300">{agent.role}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {id === 'market-researcher' && (
                          <div className="text-xs text-gray-400">
                            • Analyzes industry trends and competitive landscape<br/>
                            • Identifies market opportunities and threats<br/>
                            • Provides data-driven market insights
                          </div>
                        )}
                        {id === 'audience-analyzer' && (
                          <div className="text-xs text-gray-400">
                            • Researches target audience demographics<br/>
                            • Analyzes user behavior and preferences<br/>
                            • Creates detailed audience personas
                          </div>
                        )}
                        {id === 'content-strategist' && (
                          <div className="text-xs text-gray-400">
                            • Develops comprehensive content strategies<br/>
                            • Aligns content with business objectives<br/>
                            • Plans content distribution and timing
                          </div>
                        )}
                        {id === 'ai-seo-optimizer' && (
                          <div className="text-xs text-gray-400">
                            • Optimizes content for search engines<br/>
                            • Researches high-value keywords<br/>
                            • Implements technical SEO best practices
                          </div>
                        )}
                        {id === 'content-writer' && (
                          <div className="text-xs text-gray-400">
                            • Creates compelling, on-brand content<br/>
                            • Adapts tone and style to audience<br/>
                            • Ensures clear and engaging messaging
                          </div>
                        )}
                        {id === 'content-editor' && (
                          <div className="text-xs text-gray-400">
                            • Reviews and refines content quality<br/>
                            • Ensures consistency and accuracy<br/>
                            • Optimizes readability and flow
                          </div>
                        )}
                        {id === 'social-media-specialist' && (
                          <div className="text-xs text-gray-400">
                            • Creates platform-specific social content<br/>
                            • Optimizes for engagement and reach<br/>
                            • Plans posting schedules and hashtags
                          </div>
                        )}
                        {id === 'landing-page-specialist' && (
                          <div className="text-xs text-gray-400">
                            • Designs high-converting landing pages<br/>
                            • Optimizes user experience and CTAs<br/>
                            • Implements conversion best practices
                          </div>
                        )}
                        {id === 'performance-analyst' && (
                          <div className="text-xs text-gray-400">
                            • Tracks content performance metrics<br/>
                            • Provides data-driven optimization insights<br/>
                            • Monitors ROI and engagement analytics
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              <p className="text-gray-300 mb-6">{error || 'Workflow not found'}</p>
              <div className="space-y-3">
                <Button onClick={() => window.history.back()} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  Go Back
                </Button>
                <Link href="/create">
                  <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                    Start New Content Generation
                  </Button>
                </Link>
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
      
      <div className="max-w-7xl mx-auto px-6 py-8">
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
                  <h3 className="font-semibold text-foreground mb-1">{workflowStatus.content?.title || 'Content Generation Project'}</h3>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">AI Content Generation</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">
                    {getProgressPercentage()}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {workflowStatus.agents.filter(agent => agent.status === 'completed').length} of {workflowStatus.agents.length} agents complete
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-foreground">ETA: {workflowStatus.estimatedTimeRemaining ? `${workflowStatus.estimatedTimeRemaining} min` : 'Calculating...'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Started at {new Date(workflowStatus.startTime).toLocaleTimeString()}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current time</div>
                  <div className="font-semibold text-foreground">
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
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className={`w-5 h-5 text-yellow-400 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>Content Generation Pipeline</span>
                </CardTitle>
                <CardDescription>
                  Real-time progress through the content creation workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressPipeline stages={workflowStatus.agents.map(agent => ({
                  id: agent.agentId,
                  name: agentMapping[agent.agentId]?.name || agent.agentId,
                  status: agent.status === 'completed' ? 'completed' : agent.status === 'running' ? 'active' : 'pending',
                  progress: agent.progress,
                  icon: agentMapping[agent.agentId]?.icon || '🤖',
                  description: agentMapping[agent.agentId]?.description || 'AI Agent processing'
                }))} currentStage={workflowStatus.currentAgent || workflowStatus.agents.find(a => a.status === 'running')?.agentId || ''} />
              </CardContent>
            </Card>

            {/* Stage Details */}
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Stage Details & Outputs</CardTitle>
                <CardDescription>
                  Detailed view of each workflow stage and its deliverables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowStatus.agents.map((agent) => (
                    <div
                      key={agent.agentId}
                      className={`p-4 rounded-lg border transition-all ${
                        agent.status === 'running'
                          ? 'bg-primary/5 border-primary'
                          : agent.status === 'completed'
                          ? 'bg-success/5 border-success/30'
                          : 'bg-muted/30 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{agentMapping[agent.agentId]?.icon || '🤖'}</span>
                          <h4 className="font-semibold text-foreground">{agentMapping[agent.agentId]?.name || agent.agentId}</h4>
                          <Badge variant={agent.status === 'completed' ? 'default' : 'secondary'}>
                            {agent.status}
                          </Badge>
                        </div>
                        {agent.duration && (
                          <span className="text-xs text-muted-foreground">{agent.duration}s</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Role: </span>
                          <span className="text-foreground">{agentMapping[agent.agentId]?.role || 'AI Agent'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status: </span>
                          <span className="text-foreground">{agent.error ? `Error: ${agent.error}` : agent.status}</span>
                        </div>
                      </div>

                      {agent.status === 'running' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{agent.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${agent.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Active Agents */}
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>AI Agents Status</CardTitle>
                <CardDescription>
                  Current activity of each AI agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowStatus.agents.map((agent) => (
                    <div key={agent.agentId} className="space-y-3">
                      <AgentAvatar
                        name={agentMapping[agent.agentId]?.name || agent.agentId}
                        role={agentMapping[agent.agentId]?.role || 'AI Agent'}
                        status={agent.status === 'completed' ? 'completed' : agent.status === 'running' ? 'working' : agent.status === 'failed' ? 'error' : 'idle'}
                        avatar={agentMapping[agent.agentId]?.icon || '🤖'}
                        progress={agent.progress}
                        className="w-full"
                      />
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="text-muted-foreground">Status: </span>
                          <span className="text-foreground">{agent.status}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress: </span>
                          <span className="text-foreground">{agent.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Activity Feed */}
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Live Activity</span>
                </CardTitle>
                <CardDescription>
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
                          <span className="font-medium text-foreground">{update.agent}</span>
                          <span className="text-xs text-muted-foreground">{update.time}</span>
                        </div>
                        <p className="text-muted-foreground">{update.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
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
                <Button className="w-full justify-start bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold" disabled>
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