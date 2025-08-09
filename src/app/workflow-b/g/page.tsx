/*
 * Multi‑agent job progress page.
 *
 * Displays a progress bar and agent statuses by polling the
 * `/api/multi-agent/job` endpoint using the `jobId` query parameter.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Human‑friendly names and colours for known agents.
const agentMapping: Record<string, { name: string; description: string; color: { primary: string; secondary: string; bg: string; border: string; text: string; }; }> = {
  'market-researcher': {
    name: 'Market Researcher',
    description: 'Analyzing market trends and competitive landscape',
    color: {
      primary: 'from-blue-500 to-cyan-500',
      secondary: 'from-blue-600/20 to-cyan-600/10',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
    },
  },
  'audience-analyzer': {
    name: 'Audience Analyzer',
    description: 'Researching target demographics and user behaviour',
    color: {
      primary: 'from-green-500 to-emerald-500',
      secondary: 'from-green-600/20 to-emerald-600/10',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
    },
  },
  'content-strategist': {
    name: 'Content Strategist',
    description: 'Developing comprehensive content strategies',
    color: {
      primary: 'from-purple-500 to-violet-500',
      secondary: 'from-purple-600/20 to-violet-600/10',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
    },
  },
  'content-writer': {
    name: 'Content Writer',
    description: 'Creating compelling, on‑brand written content',
    color: {
      primary: 'from-pink-500 to-rose-500',
      secondary: 'from-pink-600/20 to-rose-600/10',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
    },
  },
  'ai-seo-optimizer': {
    name: 'SEO Optimizer',
    description: 'Optimizing content for search engines and keywords',
    color: {
      primary: 'from-orange-500 to-red-500',
      secondary: 'from-orange-600/20 to-red-600/10',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
    },
  },
  'social-media-specialist': {
    name: 'Social Media Specialist',
    description: 'Creating platform‑specific social media content',
    color: {
      primary: 'from-cyan-500 to-teal-500',
      secondary: 'from-cyan-600/20 to-teal-600/10',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
    },
  },
  'content-editor': {
    name: 'Content Editor',
    description: 'Reviewing and refining content quality',
    color: {
      primary: 'from-indigo-500 to-blue-500',
      secondary: 'from-indigo-600/20 to-blue-600/10',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400',
    },
  },
};

type JobData = {
  id: string;
  status: 'running' | 'completed';
  createdAt: number;
  agents: {
    agentId: string;
    status: 'pending' | 'running' | 'completed';
    startTime?: number;
    endTime?: number;
    error?: string;
  }[];
};

function calculateProgress(job: JobData): number {
  if (!job || !job.agents || job.agents.length === 0) return 0;
  const completed = job.agents.filter(a => a.status === 'completed').length;
  return Math.round((completed / job.agents.length) * 100);
}

export default function MultiAgentWorkflowPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [job, setJob] = useState<JobData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/multi-agent/job?jobId=${jobId}`);
        if (!res.ok) {
          if (res.status === 404) {
            const data = await res.json().catch(() => null);
            setError(data?.message || 'Job not found');
          } else {
            const text = await res.text();
            setError(`Unexpected error: ${text}`);
          }
          setLoading(false);
          return;
        }
        const data: JobData = await res.json();
        if (!cancelled) {
          setJob(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch job');
          setLoading(false);
        }
      }
    };
    // initial fetch and polling
    fetchJob();
    const interval = setInterval(() => {
      fetchJob();
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Job…</h2>
          <p className="text-muted-foreground">Getting real-time status from AI agents</p>
        </div>
      </div>
    );
  }
  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-white mb-3">Multi-Agent Content Generation</h2>
          <p className="text-gray-300 mb-6">{error ?? 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }
  const progress = calculateProgress(job);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Multi-Agent Content Generation</h1>
        <p className="text-sm text-gray-400 mb-6">Job ID: {job.id}</p>
        <div className="mb-8 p-6 rounded-xl bg-slate-800 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Progress Overview</h2>
          <div className="h-4 w-full bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">Overall Progress: {progress}%</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">AI Agent Pipeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {job.agents.map(agent => {
              const info = agentMapping[agent.agentId] || {
                name: agent.agentId,
                description: '',
                color: {
                  primary: 'from-gray-500 to-gray-600',
                  secondary: 'from-gray-600/20 to-gray-700/10',
                  bg: 'bg-gray-500/10',
                  border: 'border-gray-500/30',
                  text: 'text-gray-400',
                },
              };
              return (
                <div
                  key={agent.agentId}
                  className={`p-4 rounded-xl border shadow-md bg-slate-800 border-slate-700 flex flex-col space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{info.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        agent.status === 'completed'
                          ? 'bg-green-600/20 text-green-400'
                          : agent.status === 'running'
                          ? 'bg-yellow-600/20 text-yellow-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{info.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}