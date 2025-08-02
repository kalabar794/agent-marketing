'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AgentAvatarProps {
  name: string;
  role: string;
  status: 'idle' | 'thinking' | 'working' | 'completed' | 'error';
  avatar?: string;
  progress?: number;
  className?: string;
}

const statusConfig = {
  idle: {
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    pulseColor: 'hsl(var(--muted))',
    animation: 'animate-none'
  },
  thinking: {
    bgColor: 'bg-accent',
    textColor: 'text-accent-foreground',
    pulseColor: 'hsl(var(--accent))',
    animation: 'animate-pulse-glow'
  },
  working: {
    bgColor: 'bg-primary',
    textColor: 'text-primary-foreground',
    pulseColor: 'hsl(var(--primary))',
    animation: 'animate-pulse-glow'
  },
  completed: {
    bgColor: 'bg-success',
    textColor: 'text-success-foreground',
    pulseColor: 'hsl(var(--success))',
    animation: 'animate-bounce-subtle'
  },
  error: {
    bgColor: 'bg-destructive',
    textColor: 'text-destructive-foreground',
    pulseColor: 'hsl(var(--destructive))',
    animation: 'animate-none'
  }
};

const getStatusIcon = (status: AgentAvatarProps['status']) => {
  switch (status) {
    case 'idle':
      return '⚪';
    case 'thinking':
      return '🤔';
    case 'working':
      return '⚡';
    case 'completed':
      return '✅';
    case 'error':
      return '❌';
    default:
      return '⚪';
  }
};

export function AgentAvatar({ 
  name, 
  role, 
  status, 
  avatar, 
  progress, 
  className 
}: AgentAvatarProps) {
  const config = statusConfig[status];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-lg shadow-agent bg-card border border-border',
        'transition-all duration-300',
        className
      )}
    >
      {/* Avatar Circle */}
      <div className="relative mb-3">
        <motion.div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-professional',
            config.bgColor,
            config.textColor,
            config.animation
          )}
          style={{
            boxShadow: status === 'working' || status === 'thinking' 
              ? `0 0 20px ${config.pulseColor}30, 0 0 40px ${config.pulseColor}20`
              : undefined
          }}
        >
          {avatar || getStatusIcon(status)}
        </motion.div>
        
        {/* Status Indicator Dot */}
        <div 
          className={cn(
            'absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background',
            config.bgColor
          )}
        />
      </div>

      {/* Agent Info */}
      <div className="text-center space-y-1 mb-3">
        <h3 className="font-semibold text-card-foreground text-sm">
          {name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {role}
        </p>
      </div>

      {/* Status Text */}
      <div className={cn(
        'px-3 py-1 rounded-full text-xs font-medium',
        config.bgColor,
        config.textColor
      )}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>

      {/* Progress Bar (if provided) */}
      {typeof progress === 'number' && (
        <div className="w-full mt-3">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">
            {progress}%
          </p>
        </div>
      )}
    </motion.div>
  );
}