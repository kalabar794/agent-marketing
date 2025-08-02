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
    color: "text-primary"
  },
  {
    title: "Agents Working",
    value: "4",
    change: "Real-time collaboration",
    icon: Users,
    color: "text-accent"
  },
  {
    title: "Success Rate",
    value: "96%",
    change: "+4% from last month",
    icon: BarChart3,
    color: "text-success"
  },
  {
    title: "Avg. Completion Time",
    value: "12min",
    change: "-8min improvement",
    icon: Clock,
    color: "text-warning"
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
        return 'text-success';
      case 'In Progress':
        return 'text-primary';
      case 'Review':
        return 'text-warning';
      case 'Planning':
        return 'text-accent';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-success/10';
      case 'In Progress':
        return 'bg-primary/10';
      case 'Review':
        return 'bg-warning/10';
      case 'Planning':
        return 'bg-accent/10';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Marketing Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor your AI agents and content generation pipeline
            </p>
          </div>
          <Link href="/create">
            <Button className="mt-4 md:mt-0 bg-gradient-primary shadow-professional">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card 
              key={metric.title} 
              className="shadow-professional hover:shadow-elevated transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                  {metric.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Active Agents */}
          <Card className="shadow-professional">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Active AI Agents</span>
              </CardTitle>
              <CardDescription>
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
          <Card className="shadow-professional">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                <span>Content Pipeline</span>
              </CardTitle>
              <CardDescription>
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
          <Card className="shadow-professional">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span>Quality Metrics</span>
              </CardTitle>
              <CardDescription>
                Real-time quality scores and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualityMetrics />
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card className="shadow-professional">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Recent Projects</span>
            </CardTitle>
            <CardDescription>
              Your latest content generation projects and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-foreground">{project.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBg(project.status)} ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{project.type}</span>
                      <span>•</span>
                      <span>{project.agents} agents involved</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      {project.completion === 100 && <CheckCircle2 className="w-4 h-4 text-success" />}
                      <span className="text-sm font-medium text-foreground">
                        {project.completion}%
                      </span>
                    </div>
                    <div className="w-24 h-2 bg-muted rounded-full">
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