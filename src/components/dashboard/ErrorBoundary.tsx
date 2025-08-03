'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="bg-white/5 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Something went wrong
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  There was an error loading this dashboard component
                </p>
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined });
                    window.location.reload();
                  }}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Simple functional error boundary for specific components
export function WithErrorBoundary({ children, componentName }: { children: React.ReactNode; componentName: string }) {
  return (
    <DashboardErrorBoundary
      fallback={
        <Card className="bg-white/5 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-y-2 py-4">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <div className="text-center">
                <p className="text-sm text-white">
                  Error loading {componentName}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Please refresh the page to try again
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      {children}
    </DashboardErrorBoundary>
  );
}