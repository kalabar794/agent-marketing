'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  estimatedTime?: string;
  icon?: string;
}

interface ProgressPipelineProps {
  stages: PipelineStage[];
  currentStage?: string;
  className?: string;
}

const getStatusIcon = (status: PipelineStage['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-success" />;
    case 'active':
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-muted-foreground" />;
    case 'error':
      return <div className="w-5 h-5 rounded-full bg-destructive" />;
    default:
      return <div className="w-5 h-5 rounded-full bg-muted" />;
  }
};

const getStatusColor = (status: PipelineStage['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-success';
    case 'active':
      return 'bg-primary';
    case 'pending':
      return 'bg-muted';
    case 'error':
      return 'bg-destructive';
    default:
      return 'bg-muted';
  }
};

export function ProgressPipeline({ stages, currentStage, className }: ProgressPipelineProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
        
        {/* Stages */}
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const isActive = stage.status === 'active' || stage.id === currentStage;
            const isCompleted = stage.status === 'completed';
            
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start space-x-4"
              >
                {/* Status Icon */}
                <div className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background',
                  getStatusColor(stage.status)
                )}>
                  {stage.icon ? (
                    <span className="text-sm">{stage.icon}</span>
                  ) : (
                    getStatusIcon(stage.status)
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'p-4 rounded-lg border transition-all duration-200',
                    isActive 
                      ? 'bg-primary/5 border-primary shadow-professional' 
                      : isCompleted
                      ? 'bg-success/5 border-success/30'
                      : 'bg-card border-border'
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={cn(
                        'font-semibold',
                        isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-foreground'
                      )}>
                        {stage.name}
                      </h3>
                      {stage.estimatedTime && isActive && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {stage.estimatedTime}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {stage.description}
                    </p>

                    {/* Progress Bar for Active Stage */}
                    {isActive && typeof stage.progress === 'number' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{stage.progress}%</span>
                        </div>
                        <Progress value={stage.progress} className="h-2" />
                      </div>
                    )}

                    {/* Completion Status */}
                    {isCompleted && (
                      <div className="flex items-center space-x-2 text-xs text-success">
                        <CheckCircle className="w-3 h-3" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}