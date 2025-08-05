'use client';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Users,
  Lightbulb,
  Target,
  PenTool,
  Edit3,
  Share2,
  Eye,
  Download,
  RefreshCw,
  Sparkles,
  Brain,
  Zap
} from "lucide-react";
import Link from "next/link";

// Enhanced agent mapping with all 7 agents
const agentMapping: Record<string, { 
  name: string; 
  icon: any;
  role: string; 
  description: string;
  color: {
    primary: string;
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
    color: {
      primary: 'from-blue-500 to-cyan-500',
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
    color: {
      primary: 'from-green-500 to-emerald-500',
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
    color: {
      primary: 'from-purple-500 to-violet-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400'
    }
  },
  'content-writer': { 
    name: 'Content Writer', 
    icon: PenTool, 
    role: 'Content Creation', 
    description: 'Creating engaging and compelling content',
    color: {
      primary: 'from-orange-500 to-red-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400'
    }
  },
  'ai-seo-optimizer': { 
    name: 'SEO Optimizer', 
    icon: Target, 
    role: 'Search Optimization', 
    description: 'Optimizing content for search engines and keywords',
    color: {
      primary: 'from-yellow-500 to-amber-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400'
    }
  },
  'social-media-specialist': { 
    name: 'Social Media Specialist', 
    icon: Share2, 
    role: 'Social Strategy', 
    description: 'Creating platform-specific social media content',
    color: {
      primary: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/30',
      text: 'text-pink-400'
    }
  },
  'content-editor': { 
    name: 'Content Editor', 
    icon: Edit3, 
    role: 'Quality Assurance', 
    description: 'Polishing and refining content for excellence',
    color: {
      primary: 'from-indigo-500 to-purple-500',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400'
    }
  }
};

interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  progress: number;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt?: string;
}

function WorkflowContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams?.get('jobId');
  
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      setLoading(false);
      return;
    }

    let pollInterval: NodeJS.Timeout | null = null;
    let cleanupFunction: (() => void) | null = null;

    // Set up Server-Sent Events for real-time updates with fallback to polling
    const setupEventSource = () => {
      console.log(`📡 Setting up SSE for job ${jobId}`);
      
      const es = new EventSource(`/api/content/status/${jobId}`, {
        withCredentials: false
      });

      let sseWorking = false;

      es.onopen = () => {
        console.log('✅ SSE connection opened');
        sseWorking = true;
        setLoading(false);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 SSE update received:', data);
          setJobStatus(data);
          
          // Close connection if job is completed or failed
          if (data.status === 'completed' || data.status === 'failed') {
            console.log(`🏁 Job ${data.status}, closing SSE connection`);
            es.close();
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      es.onerror = (error) => {
        console.error('SSE error:', error);
        console.log('📡 SSE failed, falling back to polling');
        es.close();
        
        // Only show error and fallback to polling if SSE never worked
        if (!sseWorking) {
          setupPolling();
        }
      };

      setEventSource(es);
      
      // Set up cleanup function
      cleanupFunction = () => {
        console.log('🔌 Closing SSE connection on cleanup');
        es.close();
      };
    };

    // Fallback polling mechanism
    const setupPolling = () => {
      console.log('🔄 Setting up polling fallback');
      setLoading(false);
      
      // Initial status check
      refreshStatus();
      
      // Poll every 3 seconds
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/content/status/${jobId}`);
          const data = await response.json();
          
          if (response.ok) {
            console.log('🔄 Polling update:', data);
            setJobStatus(data);
            
            // Stop polling if job is completed or failed
            if (data.status === 'completed' || data.status === 'failed') {
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 3000);
      
      cleanupFunction = () => {
        if (pollInterval) {
          console.log('🔌 Clearing polling interval');
          clearInterval(pollInterval);
          pollInterval = null;
        }
      };
    };

    // Try SSE first, with automatic fallback to polling
    setupEventSource();

    // Cleanup on unmount
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [jobId]);

  const refreshStatus = async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/content/status/${jobId}`);
      const data = await response.json();
      
      if (response.ok) {
        setJobStatus(data);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
      setError('Failed to refresh status');
    }
  };

  const getStatusIcon = () => {
    if (!jobStatus) return <Clock className="w-6 h-6 text-gray-400" />;
    
    switch (jobStatus.status) {
      case 'queued':
        return <Clock className="w-6 h-6 text-yellow-400" />;
      case 'processing':
        return <Brain className="w-6 h-6 text-blue-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!jobStatus) return 'text-gray-400';
    
    switch (jobStatus.status) {
      case 'queued':
        return 'text-yellow-400';
      case 'processing':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to workflow...</p>
        </div>
      </div>
    );
  }

  if (error || !jobId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-red-900/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300 mb-4">{error || 'No job ID provided'}</p>
            <Link href="/create">
              <Button className="w-full">Create New Content</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon()}
              <div>
                <h1 className="text-2xl font-bold text-white">Multi-Agent Content Generation</h1>
                <p className="text-gray-400">Job ID: {jobId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                className={`${getStatusColor()} border-current/30 bg-current/10`}
              >
                {jobStatus?.status.toUpperCase() || 'UNKNOWN'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshStatus}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Overview */}
        <Card className="mb-8 bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Progress Overview</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              {jobStatus?.message || 'Initializing workflow...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Overall Progress</span>
                <span className="text-white font-bold">{jobStatus?.progress || 0}%</span>
              </div>
              <Progress 
                value={jobStatus?.progress || 0} 
                className="h-3 bg-white/10"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  Status: {jobStatus?.status || 'unknown'}
                </span>
                <span className="text-gray-400">
                  {jobStatus?.updatedAt && new Date(jobStatus.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Pipeline */}
        <Card className="mb-8 bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <span>AI Agent Pipeline</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              All 7 specialized agents working on your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(agentMapping).map(([agentId, agent], index) => {
                const IconComponent = agent.icon;
                const isActive = jobStatus?.status === 'processing';
                const isCompleted = jobStatus?.status === 'completed';
                
                return (
                  <div
                    key={agentId}
                    className={`p-4 rounded-lg border transition-all duration-500 ${
                      isCompleted 
                        ? `${agent.color.bg} ${agent.color.border} animate-pulse-once`
                        : isActive
                        ? `${agent.color.bg} ${agent.color.border} animate-pulse`
                        : 'bg-white/5 border-white/10'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${agent.color.primary}`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm truncate">{agent.name}</h3>
                        <p className="text-gray-400 text-xs">{agent.role}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : isActive ? (
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">{agent.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {jobStatus?.status === 'completed' && jobStatus.result && (
          <Card className="mb-8 bg-green-900/20 border-green-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Content Generated Successfully!</span>
              </CardTitle>
              <CardDescription className="text-green-300">
                Your multi-agent workflow has completed successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Title</h4>
                    <p className="text-gray-300 text-sm">
                      {jobStatus.result.title || 'Generated content title'}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Word Count</h4>
                    <p className="text-gray-300 text-sm">
                      {jobStatus.result.content?.length || 0} characters
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">SEO Keywords</h4>
                    <p className="text-gray-300 text-sm">
                      {jobStatus.result.seoKeywords?.length || 0} keywords
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Eye className="w-4 h-4 mr-2" />
                    View Content
                  </Button>
                  <Button variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Section */}
        {jobStatus?.status === 'failed' && (
          <Card className="mb-8 bg-red-900/20 border-red-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Content Generation Failed</span>
              </CardTitle>
              <CardDescription className="text-red-300">
                An error occurred during the content generation process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <p className="text-red-300 text-sm">
                    {jobStatus.error || 'Unknown error occurred'}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={refreshStatus}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Link href="/create">
                    <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                      Create New Content
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading workflow...</p>
        </div>
      </div>
    }>
      <WorkflowContent />
    </Suspense>
  );
}