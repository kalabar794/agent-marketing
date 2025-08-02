'use client';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WorkflowStatus, QualityScores } from "@/types/content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  FileText,
  Eye,
  Download,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  Clock
} from "lucide-react";

const qualityMetrics = [
  {
    category: "Content Quality",
    score: 94,
    status: "excellent",
    checks: [
      { name: "Grammar & Spelling", status: "passed", score: 98 },
      { name: "Readability Score", status: "passed", score: 92 },
      { name: "Engagement Potential", status: "passed", score: 96 },
      { name: "Information Accuracy", status: "passed", score: 90 }
    ]
  },
  {
    category: "Brand Compliance",
    score: 96,
    status: "excellent",
    checks: [
      { name: "Brand Voice Consistency", status: "passed", score: 98 },
      { name: "Tone & Style", status: "passed", score: 95 },
      { name: "Messaging Alignment", status: "passed", score: 94 },
      { name: "Visual Brand Elements", status: "warning", score: 85 }
    ]
  },
  {
    category: "SEO Optimization",
    score: 88,
    status: "good",
    checks: [
      { name: "Keyword Density", status: "passed", score: 92 },
      { name: "Meta Tags", status: "passed", score: 90 },
      { name: "Heading Structure", status: "warning", score: 82 },
      { name: "Internal Linking", status: "passed", score: 88 }
    ]
  },
  {
    category: "Technical Standards",
    score: 91,
    status: "excellent",
    checks: [
      { name: "Mobile Responsiveness", status: "passed", score: 95 },
      { name: "Loading Performance", status: "passed", score: 89 },
      { name: "Accessibility", status: "warning", score: 86 },
      { name: "Schema Markup", status: "passed", score: 94 }
    ]
  }
];

const overallMetrics = [
  { label: "Overall Quality Score", value: "92", color: "text-success", icon: Shield },
  { label: "Checks Passed", value: "14/16", color: "text-success", icon: CheckCircle2 },
  { label: "Warnings", value: "2", color: "text-warning", icon: AlertTriangle },
  { label: "Critical Issues", value: "0", color: "text-success", icon: XCircle }
];

const contentPreview = {
  title: "The Future of AI in Marketing: 2024 Trends and Predictions",
  wordCount: 2847,
  readingTime: "11 min read",
  lastUpdated: "2 minutes ago",
  type: "Blog Post",
  status: "Ready for Review"
};

const agentFeedback = [
  {
    agent: "Content Strategist",
    feedback: "Excellent strategic alignment with target audience. Content hits all key messaging points.",
    rating: "approved",
    timestamp: "2 min ago"
  },
  {
    agent: "SEO Optimizer",
    feedback: "Strong keyword integration. Recommend adding 2 more internal links to boost page authority.",
    rating: "approved",
    timestamp: "1 min ago",
    suggestions: ["Add internal link to 'Marketing Automation Guide'", "Include link to 'AI Tools Comparison'"]
  },
  {
    agent: "Brand Guardian",
    feedback: "Perfect brand voice consistency. Tone matches our authoritative yet approachable style.",
    rating: "approved",
    timestamp: "3 min ago"
  },
  {
    agent: "Quality Controller",
    feedback: "Minor formatting improvements needed. Content quality is exceptional overall.",
    rating: "conditionally_approved",
    timestamp: "Just now",
    suggestions: ["Adjust heading hierarchy in section 4", "Optimize image alt text for accessibility"]
  }
];

function QualityPageContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

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
  }, [workflowId]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-success/10';
    if (score >= 75) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getFeedbackIcon = (rating: string) => {
    switch (rating) {
      case 'approved':
        return <ThumbsUp className="w-4 h-4 text-success" />;
      case 'conditionally_approved':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'rejected':
        return <ThumbsDown className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getQualityMetrics = () => {
    if (!workflowStatus?.qualityScores) {
      return qualityMetrics; // Fallback to mock data
    }

    const scores = workflowStatus.qualityScores;
    return [
      {
        category: "Content Quality",
        score: Math.round(scores.overall),
        status: scores.overall >= 90 ? "excellent" : scores.overall >= 75 ? "good" : "needs-improvement",
        checks: [
          { name: "Grammar & Spelling", status: "passed", score: 98 },
          { name: "Readability Score", status: scores.readability >= 60 ? "passed" : "warning", score: Math.round(scores.readability) },
          { name: "Engagement Potential", status: "passed", score: 96 },
          { name: "Information Accuracy", status: "passed", score: 90 }
        ]
      },
      {
        category: "Brand Compliance",
        score: Math.round(scores.brandAlignment),
        status: scores.brandAlignment >= 90 ? "excellent" : scores.brandAlignment >= 75 ? "good" : "needs-improvement",
        checks: [
          { name: "Brand Voice Consistency", status: scores.brandAlignment >= 85 ? "passed" : "warning", score: Math.round(scores.brandAlignment) },
          { name: "Tone & Style", status: "passed", score: 95 },
          { name: "Messaging Alignment", status: "passed", score: 94 },
          { name: "Visual Brand Elements", status: "warning", score: 85 }
        ]
      },
      {
        category: "SEO Optimization", 
        score: Math.round(scores.seo),
        status: scores.seo >= 85 ? "excellent" : scores.seo >= 70 ? "good" : "needs-improvement",
        checks: [
          { name: "Keyword Density", status: "passed", score: 92 },
          { name: "Meta Tags", status: scores.seo >= 80 ? "passed" : "warning", score: Math.round(scores.seo) },
          { name: "Heading Structure", status: "warning", score: 82 },
          { name: "Internal Linking", status: "passed", score: 88 }
        ]
      },
      {
        category: "Technical Standards",
        score: Math.round(scores.originality),
        status: scores.originality >= 95 ? "excellent" : scores.originality >= 80 ? "good" : "needs-improvement",
        checks: [
          { name: "Content Originality", status: scores.originality >= 95 ? "passed" : "warning", score: Math.round(scores.originality) },
          { name: "Loading Performance", status: "passed", score: 89 },
          { name: "Accessibility", status: "warning", score: 86 },
          { name: "Schema Markup", status: "passed", score: 94 }
        ]
      }
    ];
  };

  const getContentInfo = () => {
    if (!workflowStatus?.content) {
      return contentPreview; // Fallback to mock data
    }

    const content = workflowStatus.content;
    const wordCount = content.content?.split(' ').length || 0;
    
    return {
      title: content.title,
      wordCount,
      readingTime: `${Math.ceil(wordCount / 250)} min read`,
      lastUpdated: "Just now",
      type: "AI Generated Content",
      status: workflowStatus.status === 'completed' ? "Ready for Review" : "In Progress"
    };
  };

  const getOverallScores = () => {
    if (!workflowStatus?.qualityScores) {
      return overallMetrics; // Fallback to mock data
    }

    const scores = workflowStatus.qualityScores;
    const warnings = [scores.readability < 60, scores.seo < 85, scores.brandAlignment < 90].filter(Boolean).length;
    
    return [
      { label: "Overall Quality Score", value: Math.round(scores.overall).toString(), color: "text-success", icon: Shield },
      { label: "Checks Passed", value: `${16 - warnings}/16`, color: "text-success", icon: CheckCircle2 },
      { label: "Warnings", value: warnings.toString(), color: warnings > 0 ? "text-warning" : "text-success", icon: AlertTriangle },
      { label: "Critical Issues", value: "0", color: "text-success", icon: XCircle }
    ];
  };

  const handleQualityAction = async (action: 'approve' | 'reject' | 'request_revision', feedback?: string) => {
    if (!workflowId) return;
    
    setIsProcessingAction(true);
    try {
      const response = await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          action,
          feedback
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process quality action');
      }

      const result = await response.json();
      
      if (action === 'approve') {
        setApprovalStatus('approved');
      } else if (action === 'reject') {
        setApprovalStatus('rejected');
      }
      
      // Show success message or redirect
      console.log('Quality action successful:', result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Quality Analysis...</h2>
          <p className="text-gray-600">Analyzing content quality and performance</p>
        </div>
      </div>
    );
  }

  if (error || !workflowStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Quality Analysis Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Quality data not found'}</p>
          <Button onClick={() => window.history.back()} className="bg-gradient-to-r from-red-500 to-pink-500 text-white">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header Section with Vibrant Background */}
      <section className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
              Quality Control Center
            </h1>
            <p className="text-xl text-white/90">
              Review, approve, and optimize your generated content
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-6 lg:mt-0">
            <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all duration-200">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all duration-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-analyze
            </Button>
          </div>
        </div>
      </div>
    </section>
    
    <div className="container mx-auto px-4 py-12">

        {/* Content Info Card */}
        <Card className="shadow-professional mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">{getContentInfo().title}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{getContentInfo().type}</span>
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {getContentInfo().wordCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  words • {getContentInfo().readingTime}
                </div>
              </div>
              
              <div>
                <Badge className="bg-gradient-primary text-primary-foreground mb-2">
                  {getContentInfo().status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Updated {getContentInfo().lastUpdated}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button size="sm" className="bg-gradient-primary">
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getOverallScores().map((metric, index) => (
            <Card 
              key={metric.label}
              className="shadow-professional animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                      {metric.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metric.label}
                    </div>
                  </div>
                  <metric.icon className={`w-8 h-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quality Metrics */}
            <Card className="shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Detailed Quality Analysis</span>
                </CardTitle>
                <CardDescription>
                  Comprehensive quality assessment across all categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {getQualityMetrics().map((category) => (
                    <div key={category.category} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{category.category}</h4>
                        <div className="flex items-center space-x-2">
                          <div className={`text-lg font-bold ${getScoreColor(category.score)}`}>
                            {category.score}%
                          </div>
                          <Badge 
                            className={`${getScoreBg(category.score)} ${getScoreColor(category.score)}`}
                          >
                            {category.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.checks.map((check) => (
                          <div 
                            key={check.name}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(check.status)}
                              <span className="text-sm font-medium text-foreground">
                                {check.name}
                              </span>
                            </div>
                            <span className={`text-sm font-bold ${getScoreColor(check.score)}`}>
                              {check.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Approval Actions */}
            <Card className="shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span>Final Approval</span>
                </CardTitle>
                <CardDescription>
                  Make your final decision on this content piece
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="bg-success hover:bg-success/90 text-white shadow-professional"
                      onClick={() => handleQualityAction('approve', 'Content approved for publication')}
                      disabled={isProcessingAction || workflowStatus?.status !== 'completed'}
                    >
                      {isProcessingAction && approvalStatus === 'pending' ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-4 h-4 mr-2" />
                      )}
                      Approve & Publish
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-warning text-warning hover:bg-warning/10 shadow-professional"
                      onClick={() => handleQualityAction('request_revision', 'Please review and improve based on quality metrics')}
                      disabled={isProcessingAction || workflowStatus?.status !== 'completed'}
                    >
                      {isProcessingAction ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Request Revisions
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10 shadow-professional"
                      onClick={() => handleQualityAction('reject', 'Content does not meet quality standards')}
                      disabled={isProcessingAction || workflowStatus?.status !== 'completed'}
                    >
                      {isProcessingAction && approvalStatus === 'pending' ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 mr-2" />
                      )}
                      Reject Content
                    </Button>
                  </div>
                  
                  {approvalStatus !== 'pending' && (
                    <div className={`p-4 rounded-lg ${
                      approvalStatus === 'approved' ? 'bg-success/10' : 'bg-destructive/10'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {approvalStatus === 'approved' ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <span className={`font-medium ${
                          approvalStatus === 'approved' ? 'text-success' : 'text-destructive'
                        }`}>
                          Content {approvalStatus === 'approved' ? 'approved' : 'rejected'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Agent Feedback */}
            <Card className="shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-accent" />
                  <span>AI Agent Feedback</span>
                </CardTitle>
                <CardDescription>
                  Reviews and recommendations from each AI agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentFeedback.map((feedback, index) => (
                    <div key={index} className="space-y-3 pb-4 border-b border-border last:border-b-0">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-foreground">{feedback.agent}</h5>
                        <div className="flex items-center space-x-2">
                          {getFeedbackIcon(feedback.rating)}
                          <span className="text-xs text-muted-foreground">{feedback.timestamp}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{feedback.feedback}</p>
                      
                      {feedback.suggestions && (
                        <div className="space-y-1">
                          <h6 className="text-xs font-medium text-foreground">Suggestions:</h6>
                          {feedback.suggestions.map((suggestion, i) => (
                            <div key={i} className="text-xs text-muted-foreground pl-3 border-l-2 border-warning">
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Content Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">8.2</div>
                    <div className="text-xs text-muted-foreground">Readability Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">25</div>
                    <div className="text-xs text-muted-foreground">Target Keywords</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">98%</div>
                    <div className="text-xs text-muted-foreground">Originality</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-warning">A+</div>
                    <div className="text-xs text-muted-foreground">SEO Grade</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing Time */}
            <Card className="shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>Processing Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Time:</span>
                  <span className="font-medium text-foreground">18m 42s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Agents Used:</span>
                  <span className="font-medium text-foreground">6</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revisions:</span>
                  <span className="font-medium text-foreground">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quality Score:</span>
                  <span className="font-medium text-success">92%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QualityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Quality Analysis...</h2>
          <p className="text-gray-600">Analyzing content quality and performance</p>
        </div>
      </div>
    }>
      <QualityPageContent />
    </Suspense>
  );
}