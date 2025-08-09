'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  CheckCircle,
  Clock,
  FileText,
  Share2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Job {
  id: string;
  status: string;
  createdAt: number;
  result?: {
    title: string;
    content: string;
    metadata: {
      wordCount: number;
      readingTime: number;
      generatedAt: string;
    };
  };
}

export default function ContentPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/job?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job');
      }
      const data = await response.json();
      setJob(data);
      setError(null);
    } catch (err) {
      setError('Failed to load content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (job?.result?.content) {
      navigator.clipboard.writeText(job.result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadAsMarkdown = () => {
    if (job?.result) {
      const blob = new Blob([job.result.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.id}-blog.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white">Loading Content...</h2>
        </div>
      </div>
    );
  }

  if (error || !job?.result) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <p className="text-red-400 mb-4">{error || 'No content found'}</p>
            <Button 
              onClick={() => router.push('/create')}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              Create New Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={downloadAsMarkdown}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <Button
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                onClick={() => router.push('/create')}
              >
                Create New
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Metadata */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Generated
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <FileText className="w-3 h-3 mr-1" />
              {job.result.metadata.wordCount} words
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Clock className="w-3 h-3 mr-1" />
              {job.result.metadata.readingTime} min read
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            {job.result.title}
          </h1>
          
          <p className="text-gray-400 text-sm">
            Job ID: {job.id} • Generated: {new Date(job.result.metadata.generatedAt).toLocaleString()}
          </p>
        </div>

        {/* Blog Content */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({children}) => <h1 className="text-3xl font-bold text-white mb-4">{children}</h1>,
                  h2: ({children}) => <h2 className="text-2xl font-bold text-white mt-8 mb-4">{children}</h2>,
                  h3: ({children}) => <h3 className="text-xl font-semibold text-white mt-6 mb-3">{children}</h3>,
                  h4: ({children}) => <h4 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h4>,
                  p: ({children}) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">{children}</ol>,
                  li: ({children}) => <li className="text-gray-300">{children}</li>,
                  strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                  em: ({children}) => <em className="text-gray-200">{children}</em>,
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-yellow-400 pl-4 my-4 text-gray-300 italic">
                      {children}
                    </blockquote>
                  ),
                  code: ({children}) => (
                    <code className="bg-slate-700 text-yellow-400 px-2 py-1 rounded text-sm">
                      {children}
                    </code>
                  ),
                  hr: () => <hr className="border-slate-600 my-8" />,
                  a: ({href, children}) => (
                    <a href={href} className="text-yellow-400 hover:text-yellow-300 underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {job.result.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            onClick={() => router.push('/create')}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold"
          >
            Create Another Blog
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/workflow-b/g?jobId=${job.id}`)}
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            View Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}