'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Users, BarChart3, Clock } from "lucide-react";
import Link from "next/link";
import { SystemHealthMonitor } from "@/components/dashboard/SystemHealthMonitor";
import { LiveWorkflowFeed } from "@/components/dashboard/LiveWorkflowFeed";
import { WithErrorBoundary } from "@/components/dashboard/ErrorBoundary";

const quickActions = [
  {
    id: 'create-blog',
    title: 'Create Blog Post',
    description: 'Generate SEO-optimized blog content',
    icon: FileText,
    href: '/create?type=blog'
  },
  {
    id: 'create-social',
    title: 'Social Media Campaign',
    description: 'Multi-platform social content',
    icon: Users,
    href: '/create?type=social'
  },
  {
    id: 'create-email',
    title: 'Email Campaign',
    description: 'Conversion-focused email content',
    icon: Clock,
    href: '/create?type=email'
  }
];



export default function Dashboard() {


  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Section with Vibrant Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/30 via-slate-800/20 to-slate-900/30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Real-Time Dashboard
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Marketing
                <br />
                <span className="text-blue-200">Dashboard</span>
              </h1>
              <p className="text-xl text-white/90 leading-relaxed drop-shadow-md">
                Real-time monitoring of AI agents and content generation workflows
              </p>
            </div>
            <Link href="/create" className="mt-6 md:mt-0">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 h-auto rounded-lg shadow-lg transition-colors duration-200">
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
        
      </section>
      
      <div className="max-w-7xl mx-auto px-6 py-12">


        {/* Real-Time System Health Monitor */}
        <div className="mb-8">
          <WithErrorBoundary componentName="System Health Monitor">
            <SystemHealthMonitor />
          </WithErrorBoundary>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Link key={action.id} href={action.href}>
                <Card className="bg-white/5 backdrop-blur-sm border-slate-700 shadow-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-2">{action.title}</h3>
                        <p className="text-sm text-slate-400">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Live Workflow Feed */}
        <div className="mb-8">
          <WithErrorBoundary componentName="Live Workflow Feed">
            <LiveWorkflowFeed />
          </WithErrorBoundary>
        </div>

        {/* Getting Started */}
        <Card className="bg-white/5 backdrop-blur-sm border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-white">Getting Started</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Ready to create professional marketing content?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-300">
                Choose your content type and let our AI agents create compelling, on-brand content in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/create" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                    Start Creating Content
                  </Button>
                </Link>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  View Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}