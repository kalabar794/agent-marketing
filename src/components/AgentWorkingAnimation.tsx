'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ContentLoader from 'react-content-loader'
import { useInView } from 'react-intersection-observer'
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'

// Backend integration types
type QueryState = {
  isPending?: boolean
  isError?: boolean
  isFetching?: boolean
  error?: Error | null
}

type MutationState = {
  isPending?: boolean
  isError?: boolean
  error?: Error | null
}

interface AgentWorkingAnimationProps {
  isWorking?: boolean
  type?: 'minimal' | 'detailed' | 'creative'
  size?: 'sm' | 'md' | 'lg'
  message?: string
  // Backend integration props
  queryState?: QueryState | UseQueryResult<any, Error>
  mutationState?: MutationState | UseMutationResult<any, Error, any, any>
  showOnlyInViewport?: boolean
  triggerOnce?: boolean
  rootMargin?: string
  // Performance optimization
  enablePerformanceMode?: boolean
  priority?: 'high' | 'normal' | 'low'
}

const AgentWorkingAnimation: React.FC<AgentWorkingAnimationProps> = ({
  isWorking = true,
  type = 'creative',
  size = 'md',
  message = 'AI agents are working on your content...',
  queryState,
  mutationState,
  showOnlyInViewport = false,
  triggerOnce = true,
  rootMargin = '50px',
  enablePerformanceMode = true,
  priority = 'normal'
}) => {
  const [dots, setDots] = useState('')
  const [currentPhase, setCurrentPhase] = useState(0)
  
  // Intersection Observer for viewport optimization
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce,
    rootMargin,
    skip: !showOnlyInViewport
  })
  
  // Determine working state from backend integration
  const backendWorking = React.useMemo(() => {
    if (queryState) {
      return queryState.isPending || queryState.isFetching
    }
    if (mutationState) {
      return mutationState.isPending
    }
    return false
  }, [queryState, mutationState])
  
  // Final working state (manual override or backend state)
  const finalIsWorking = isWorking || backendWorking
  
  // Error state from backend
  const hasError = queryState?.isError || mutationState?.isError
  const errorMessage = queryState?.error?.message || mutationState?.error?.message
  
  // Viewport check for performance
  const shouldAnimate = showOnlyInViewport ? inView : true

  const phases = React.useMemo(() => {
    if (hasError) {
      return ['Error occurred...', 'Retrying...', 'Please wait...', 'Recovering...']
    }
    
    if (queryState?.isFetching && !queryState?.isPending) {
      return ['Refreshing data...', 'Syncing changes...', 'Updating content...', 'Almost done...']
    }
    
    if (mutationState?.isPending) {
      return ['Saving changes...', 'Processing request...', 'Updating server...', 'Finalizing...']
    }
    
    return [
      'Analyzing content...',
      'Processing data...',
      'Generating insights...',
      'Finalizing results...'
    ]
  }, [hasError, queryState, mutationState])

  useEffect(() => {
    if (!finalIsWorking || !shouldAnimate) return

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    const phaseInterval = setInterval(() => {
      setCurrentPhase(prev => (prev + 1) % phases.length)
    }, 2000)

    return () => {
      clearInterval(dotsInterval)
      clearInterval(phaseInterval)
    }
  }, [finalIsWorking, shouldAnimate])

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  }

  // Performance optimization: don't render if not needed
  if (!finalIsWorking || (showOnlyInViewport && !inView)) {
    return showOnlyInViewport ? <div ref={ref} /> : null
  }
  
  // Error state rendering
  if (hasError) {
    return (
      <div ref={ref} className="flex flex-col items-center space-y-2 p-4">
        <motion.div
          className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <span className="text-red-500 text-sm">!</span>
        </motion.div>
        <p className="text-sm text-red-600 text-center">
          {errorMessage || 'Something went wrong'}
        </p>
        <motion.button
          className="text-xs text-blue-600 underline"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
        >
          Retry
        </motion.button>
      </div>
    )
  }

  if (type === 'minimal') {
    return (
      <div 
        ref={ref} 
        className="flex items-center space-x-2"
        style={{
          contain: enablePerformanceMode ? 'layout style paint' : undefined,
          willChange: shouldAnimate ? 'transform' : 'auto'
        }}
      >
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">{message}{dots}</span>
      </div>
    )
  }

  if (type === 'detailed') {
    return (
      <div 
        ref={ref} 
        className="flex flex-col items-center space-y-4 p-6"
        style={{
          contain: enablePerformanceMode ? 'layout style paint' : undefined,
          willChange: shouldAnimate ? 'transform' : 'auto'
        }}
      >
        <ContentLoader
          speed={2}
          width={240}
          height={120}
          viewBox="0 0 240 120"
          backgroundColor="#f3f4f6"
          foregroundColor="#e5e7eb"
        >
          <rect x="0" y="0" rx="8" ry="8" width="60" height="60" />
          <rect x="70" y="10" rx="4" ry="4" width="150" height="12" />
          <rect x="70" y="30" rx="4" ry="4" width="120" height="12" />
          <rect x="70" y="50" rx="4" ry="4" width="100" height="8" />
          
          <rect x="0" y="80" rx="4" ry="4" width="240" height="8" />
          <rect x="0" y="100" rx="4" ry="4" width="180" height="8" />
        </ContentLoader>
        
        <div className="text-center">
          <p className="text-sm font-medium text-gray-800">{phases[currentPhase]}</p>
          <p className="text-xs text-gray-500 mt-1">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={ref}
      className={`flex flex-col items-center justify-center ${sizeClasses[size]} relative`}
      style={{
        contain: enablePerformanceMode ? 'layout style paint' : undefined,
        willChange: shouldAnimate ? 'transform' : 'auto'
      }}
    >
      {/* Central AI Brain */}
      <motion.div
        className="relative w-16 h-16 mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-blue-500/30"
          animate={{
            scale: [1, 1.2, 1],
            borderColor: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.3)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <motion.div
          className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"
          animate={{
            boxShadow: [
              '0 0 20px rgba(59, 130, 246, 0.5)',
              '0 0 40px rgba(147, 51, 234, 0.8)',
              '0 0 20px rgba(59, 130, 246, 0.5)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="text-white text-xl font-bold"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            AI
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Orbiting Elements */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
          animate={{
            rotate: 360,
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            rotate: { duration: 3 + i, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, delay: i * 0.3 }
          }}
          style={{
            transformOrigin: `${30 + i * 8}px center`,
            x: 30 + i * 8,
            y: 0
          }}
        />
      ))}

      {/* Data Streams */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`stream-${i}`}
            className="absolute w-0.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
            style={{
              height: '60%',
              left: `${20 + i * 30}%`,
              top: '20%'
            }}
            animate={{
              opacity: [0, 1, 0],
              scaleY: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.7
            }}
          />
        ))}
      </div>

      {/* Status Text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-center mt-4"
        >
          <p className="text-sm font-medium text-gray-800 mb-1">
            {phases[currentPhase]}
          </p>
          <motion.div
            className="flex justify-center space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="w-full max-w-xs mt-4">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full"
            animate={{
              width: ['0%', '100%', '0%']
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default AgentWorkingAnimation