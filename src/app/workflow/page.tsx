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
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Workflow Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Workflow not found'}</p>
          <Link href="/create">
            <Button>Start New Content Generation</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Project Info */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Workflow in Progress
              </h1>
              <p className="text-muted-foreground">
                Watch your AI agents collaborate in real-time
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <Button
                variant="outline"
                onClick={() => setIsRunning(!isRunning)}
                className="shadow-professional"
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
              
              <Link href={`/quality?id=${workflowId}`}>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Result
                </Button>
              </Link>
            </div>
          </div>

          {/* Project Status Card */}
          <Card className="shadow-professional mb-8">
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
            <Card className="shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className={`w-5 h-5 text-primary ${isRunning ? 'animate-spin' : ''}`} />
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
            <Card className="shadow-professional">
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
            <Card className="shadow-professional">
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
            <Card className="shadow-professional">
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
            <Card className="shadow-professional">
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
                <Link href={`/quality?id=${workflowId}`} className="block">
                  <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to Quality Control
                  </Button>
                </Link>
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Workflow...</h2>
          <p className="text-gray-600">Preparing your content generation workspace</p>
        </div>
      </div>
    }>
      <WorkflowPageContent />
    </Suspense>
  );
}