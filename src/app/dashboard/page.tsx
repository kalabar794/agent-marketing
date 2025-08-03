'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressPipeline } from "@/components/ProgressPipeline";
import { AgentAvatar } from "@/components/AgentAvatar";
import { QualityMetrics } from "@/components/QualityMetrics";
import { Plus, FileText, Users, BarChart3, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const agents = [
  { 
    id: '1', 
    name: 'Content Strategist', 
    role: 'Strategy & Planning', 
    avatar: '📋', 
    status: 'completed' as const,
    description: 'Market analysis complete'
  },
  { 
    id: '2', 
    name: 'SEO Optimizer', 
    role: 'Search Optimization', 
    avatar: '🎯', 
    status: 'completed' as const,
    description: 'Keywords identified'
  },
  { 
    id: '3', 
    name: 'Content Writer', 
    role: 'Content Creation', 
    avatar: '✍️', 
    status: 'working' as const,
    description: 'Writing blog post',
    progress: 73
  },
  { 
    id: '4', 
    name: 'Visual Designer', 
    role: 'Visual Content', 
    avatar: '🎨', 
    status: 'thinking' as const,
    description: 'Planning graphics'
  },
  { 
    id: '5', 
    name: 'Brand Guardian', 
    role: 'Brand Compliance', 
    avatar: '🛡️', 
    status: 'idle' as const,
    description: 'Awaiting content'
  },
  { 
    id: '6', 
    name: 'Quality Controller', 
    role: 'Quality Assurance', 
    avatar: '✅', 
    status: 'idle' as const,
    description: 'Ready for review'
  },
];

const pipelineStages = [
  {
    id: 'strategy',
    name: 'Content Strategy',
    description: 'Market research and content planning completed',
    status: 'completed' as const,
    icon: '📋'
  },
  {
    id: 'seo',
    name: 'SEO Optimization',
    description: 'Keyword research and optimization strategy defined',
    status: 'completed' as const,
    icon: '🎯'
  },
  {
    id: 'writing',
    name: 'Content Creation',
    description: 'Writing engaging, brand-aligned content',
    status: 'active' as const,
    progress: 73,
    estimatedTime: '2 minutes',
    icon: '✍️'
  },
  {
    id: 'visual',
    name: 'Visual Design',
    description: 'Creating visual assets and graphics',
    status: 'pending' as const,
    icon: '🎨'
  },
  {
    id: 'quality',
    name: 'Quality Review',
    description: 'Brand compliance and final quality checks',
    status: 'pending' as const,
    icon: '🛡️'
  }
];

const recentProjects = [
  { 
    id: 1, 
    title: "AI Marketing Trends Blog Post", 
    status: "In Progress", 
    completion: 73,
    type: "Blog Post",
    agents: 3
  },
  { 
    id: 2, 
    title: "Product Launch Social Campaign", 
    status: "Review", 
    completion: 90,
    type: "Social Media",
    agents: 6
  },
  { 
    id: 3, 
    title: "Customer Success Stories", 
    status: "Completed", 
    completion: 100,
    type: "Case Study",
    agents: 4
  },
  { 
    id: 4, 
    title: "Email Newsletter Template", 
    status: "Planning", 
    completion: 25,
    type: "Email",
    agents: 2
  },
];

const metrics = [
  {
    title: "Active Projects",
    value: "8",
    change: "+2 this week",
    icon: FileText,
    color: "text-blue-400"
  },
  {
    title: "Agents Working",
    value: "4",
    change: "Real-time collaboration",
    icon: Users,
    color: "text-purple-400"
  },
  {
    title: "Success Rate",
    value: "96%",
    change: "+4% from last month",
    icon: BarChart3,
    color: "text-green-400"
  },
  {
    title: "Avg. Completion Time",
    value: "12min",
    change: "-8min improvement",
    icon: Clock,
    color: "text-yellow-400"
  }
];

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < pipelineStages.length - 1 ? prev + 1 : prev));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-400';
      case 'In Progress':
        return 'text-blue-400';
      case 'Review':
        return 'text-yellow-400';
      case 'Planning':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-900/30';
      case 'In Progress':
        return 'bg-blue-900/30';
      case 'Review':
        return 'bg-yellow-900/30';
      case 'Planning':
        return 'bg-purple-900/30';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Section with Vibrant Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-600/20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Real-Time Dashboard
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Marketing
                <br />
                <span className="text-yellow-300 drop-shadow-lg">Dashboard</span>
              </h1>
              <p className="text-xl text-white/90 leading-relaxed drop-shadow-md">
                Monitor your AI agents and content generation pipeline
              </p>
            </div>
            <Link href="/create" className="mt-6 md:mt-0">
              <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg px-8 py-4 h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200">
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Floating Background Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-float-delay-1"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-400/20 rounded-full blur-lg animate-float-delay-2"></div>
      </section>
      
      <div className="max-w-7xl mx-auto px-6 py-20">

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card 
              key={metric.title} 
              className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-elevated transition-all duration-300 animate-slide-up hover:bg-white/15"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">{metric.title}</CardTitle>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                  {metric.value}
                </div>
                <p className="text-xs text-gray-300">
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Active Agents */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Active AI Agents</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Real-time status of your AI marketing team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <AgentAvatar
                    key={agent.id}
                    name={agent.name}
                    role={agent.role}
                    status={agent.status}
                    avatar={agent.avatar}
                    progress={agent.progress}
                    className="text-center"
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Pipeline */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <span className="text-white">Content Pipeline</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Active content creation workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressPipeline 
                stages={pipelineStages}
                currentStage="writing"
              />
            </CardContent>
          </Card>
        </div>

        {/* Quality Metrics */}
        <div className="mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-pink-400" />
                <span className="text-white">Quality Metrics</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Real-time quality scores and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualityMetrics />
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="text-white">Recent Projects</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your latest content generation projects and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors cursor-pointer backdrop-blur-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-white">{project.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBg(project.status)} ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                      <span>{project.type}</span>
                      <span>•</span>
                      <span>{project.agents} agents involved</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      {project.completion === 100 && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      <span className="text-sm font-medium text-white">
                        {project.completion}%
                      </span>
                    </div>
                    <div className="w-24 h-2 bg-white/20 rounded-full">
                      <div
                        className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                        style={{ width: `${project.completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}