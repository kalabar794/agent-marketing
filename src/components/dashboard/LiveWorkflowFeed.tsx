'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEventSource } from 'react-use-websocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Activity, CheckCircle2, AlertCircle, Users, Zap } from 'lucide-react';
import Link from 'next/link';

interface WorkflowAgent {
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
}

interface WorkflowUpdate {
  id: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  currentAgent?: string;
  startTime: string;
  endTime?: string;
  agents: WorkflowAgent[];
  estimatedTimeRemaining?: number;
}

interface SSEMessage {
  type: 'connected' | 'system_status' | 'workflow_updates' | 'heartbeat' | 'error';
  timestamp: string;
  data?: WorkflowUpdate[];
  message?: string;
}

const agentNames: Record<string, string> = {
  'market-researcher': 'Market Researcher',
  'audience-analyzer': 'Audience Analyzer', 
  'content-strategist': 'Content Strategist',
  'ai-seo-optimizer': 'SEO Optimizer',
  'content-writer': 'Content Writer',
  'content-editor': 'Content Editor',
  'social-media-specialist': 'Social Media Specialist',
  'landing-page-specialist': 'Landing Page Specialist',
  'performance-analyst': 'Performance Analyst'
};

export function LiveWorkflowFeed() {
  const [workflows, setWorkflows] = useState<WorkflowUpdate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [usePolling, setUsePolling] = useState(false);

  // Fallback polling function
  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await fetch('/api/status', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.workflowUpdates) {
        setWorkflows(data.workflowUpdates);
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Workflow polling error:', error);
      setConnectionStatus('error');
    }
  }, []);

  // Polling effect
  useEffect(() => {
    if (usePolling) {
      // Initial fetch
      fetchWorkflows();
      
      // Set up polling interval
      const interval = setInterval(fetchWorkflows, 5000); // Poll every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [usePolling, fetchWorkflows]);

  // Try SSE first, fallback to polling
  const { lastEvent, readyState } = useEventSource('/api/status/stream', {
    withCredentials: false,
    events: {
      message: (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              setConnectionStatus('connected');
              setUsePolling(false); // SSE is working
              break;
              
            case 'workflow_updates':
              if (data.data) {
                setWorkflows(data.data);
                setUsePolling(false); // SSE is working
              }
              break;
              
            case 'error':
              console.error('Live workflow feed SSE error:', data.message);
              setConnectionStatus('error');
              setUsePolling(true); // Fallback to polling
              break;
          }
        } catch (error) {
          console.error('Error parsing workflow SSE message:', error);
          setUsePolling(true); // Fallback to polling
        }
      },
    },
  });

  // Monitor SSE connection and fallback to polling if needed
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (readyState === 0 || readyState === 2 || readyState === 3) {
        console.log('SSE connection failed for workflows, falling back to polling');
        setUsePolling(true);
      }
    }, 10000); // Wait 10 seconds for SSE to connect

    return () => clearTimeout(timeout);
  }, [readyState]);

  // Update connection status based on readyState
  useEffect(() => {
    if (!usePolling) {
      switch (readyState) {
        case 0: // CONNECTING
          setConnectionStatus('connecting');
          break;
        case 1: // OPEN
          setConnectionStatus('connected');
          break;
        case 2: // CLOSED
          setConnectionStatus('disconnected');
          setUsePolling(true); // Fallback to polling
          break;
        default:
          setConnectionStatus('error');
          setUsePolling(true); // Fallback to polling
      }
    }
  }, [readyState, usePolling]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-900/30 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-900/30 text-slate-400 border-slate-500/30';
    }
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Zap className="w-3 h-3 text-blue-400" />;
      case 'completed':
        return <CheckCircle2 className="w-3 h-3 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Clock className="w-3 h-3 text-slate-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString();
  };

  const formatEstimatedTime = (minutes?: number) => {
    if (!minutes) return 'Calculating...';
    if (minutes < 1) return '< 1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (connectionStatus === 'connecting') {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <Activity className="w-4 h-4 animate-spin" />
            <span>Connecting to live workflow feed...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (connectionStatus === 'error' && workflows.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>Unable to connect to live workflow feed</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-white">Live Workflow Activity</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Real-time updates from active content generation workflows
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {workflows.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No active workflows at the moment</p>
            <p className="text-xs text-slate-500 mt-1">Start creating content to see real-time updates</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="space-y-3">
                <div className={`p-4 rounded-lg border ${getStatusColor(workflow.status)}`}>
                  {/* Workflow Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(workflow.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white text-sm">
                            Workflow {workflow.id.split('-').pop()}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {workflow.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400">
                          Started {formatTimeAgo(workflow.startTime)}
                          {workflow.estimatedTimeRemaining && workflow.status === 'running' && (
                            <> • ETA {formatEstimatedTime(workflow.estimatedTimeRemaining)}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link href={`/workflow?id=${workflow.id}`}>
                      <button className="text-xs text-blue-400 hover:text-blue-300 underline">
                        View Details
                      </button>
                    </Link>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Overall Progress</span>
                      <span>{workflow.progress}%</span>
                    </div>
                    <Progress value={workflow.progress} className="h-2" />
                  </div>

                  {/* Active Agents */}
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 font-medium">Agents Status:</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {workflow.agents.map((agent) => (
                        <div
                          key={agent.agentId}
                          className={`flex items-center space-x-2 p-2 rounded text-xs ${
                            agent.status === 'running' ? 'bg-blue-900/30' :
                            agent.status === 'completed' ? 'bg-green-900/30' :
                            agent.status === 'failed' ? 'bg-red-900/30' :
                            'bg-slate-900/30'
                          }`}
                        >
                          {getAgentStatusIcon(agent.status)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">
                              {agentNames[agent.agentId] || agent.agentId}
                            </div>
                            {agent.status === 'running' && (
                              <div className="text-xs text-slate-400">
                                {agent.progress}%
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}