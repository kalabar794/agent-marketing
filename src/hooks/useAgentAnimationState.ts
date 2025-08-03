'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'

// Types for animation state management
interface AnimationTask {
  id: string
  type: 'query' | 'mutation' | 'custom'
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
  priority: 'high' | 'normal' | 'low'
  startTime: number
  estimatedDuration?: number
}

interface AnimationQueue {
  high: AnimationTask[]
  normal: AnimationTask[]
  low: AnimationTask[]
}

interface UseAgentAnimationStateOptions {
  maxConcurrent?: number
  enableQueue?: boolean
  enableAnalytics?: boolean
  defaultPriority?: 'high' | 'normal' | 'low'
}

interface AnimationMetrics {
  totalAnimations: number
  averageDuration: number
  errorRate: number
  performanceScore: number
}

export const useAgentAnimationState = (options: UseAgentAnimationStateOptions = {}) => {
  const {
    maxConcurrent = 3,
    enableQueue = true,
    enableAnalytics = true,
    defaultPriority = 'normal'
  } = options

  // State management
  const [queue, setQueue] = useState<AnimationQueue>({
    high: [],
    normal: [],
    low: []
  })
  
  const [activeAnimations, setActiveAnimations] = useState<AnimationTask[]>([])
  const [metrics, setMetrics] = useState<AnimationMetrics>({
    totalAnimations: 0,
    averageDuration: 0,
    errorRate: 0,
    performanceScore: 100
  })

  // Performance tracking
  const performanceRef = useRef<{
    durations: number[]
    errors: number
    startTimes: Map<string, number>
  }>({
    durations: [],
    errors: 0,
    startTimes: new Map()
  })

  // Generate unique animation ID
  const generateId = useCallback(() => {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Add animation to queue
  const addAnimation = useCallback((
    type: 'query' | 'mutation' | 'custom',
    message?: string,
    priority: 'high' | 'normal' | 'low' = defaultPriority,
    estimatedDuration?: number
  ) => {
    const id = generateId()
    const task: AnimationTask = {
      id,
      type,
      status: 'pending',
      message,
      priority,
      startTime: Date.now(),
      estimatedDuration
    }

    setQueue(prev => ({
      ...prev,
      [priority]: [...prev[priority], task]
    }))

    if (enableAnalytics) {
      performanceRef.current.startTimes.set(id, Date.now())
    }

    return id
  }, [generateId, defaultPriority, enableAnalytics])

  // Remove animation from queue/active
  const removeAnimation = useCallback((id: string) => {
    // Remove from queue
    setQueue(prev => ({
      high: prev.high.filter(task => task.id !== id),
      normal: prev.normal.filter(task => task.id !== id),
      low: prev.low.filter(task => task.id !== id)
    }))

    // Remove from active
    setActiveAnimations(prev => prev.filter(task => task.id !== id))

    // Update metrics
    if (enableAnalytics) {
      const startTime = performanceRef.current.startTimes.get(id)
      if (startTime) {
        const duration = Date.now() - startTime
        performanceRef.current.durations.push(duration)
        performanceRef.current.startTimes.delete(id)
        
        // Update metrics
        setMetrics(prev => ({
          totalAnimations: prev.totalAnimations + 1,
          averageDuration: performanceRef.current.durations.reduce((a, b) => a + b, 0) / performanceRef.current.durations.length,
          errorRate: (performanceRef.current.errors / (prev.totalAnimations + 1)) * 100,
          performanceScore: Math.max(0, 100 - (performanceRef.current.errors * 10) - Math.max(0, (duration - 2000) / 100))
        }))
      }
    }
  }, [enableAnalytics])

  // Mark animation as error
  const markError = useCallback((id: string, error?: string) => {
    setActiveAnimations(prev => 
      prev.map(task => 
        task.id === id 
          ? { ...task, status: 'error', message: error || 'Animation error' }
          : task
      )
    )

    if (enableAnalytics) {
      performanceRef.current.errors++
    }
  }, [enableAnalytics])

  // Process queue and start animations
  const processQueue = useCallback(() => {
    if (!enableQueue) return

    setActiveAnimations(current => {
      if (current.length >= maxConcurrent) return current

      const availableSlots = maxConcurrent - current.length
      const newAnimations: AnimationTask[] = []

      // Process by priority: high -> normal -> low
      const priorities: (keyof AnimationQueue)[] = ['high', 'normal', 'low']
      
      for (const priority of priorities) {
        const pending = queue[priority].filter(task => task.status === 'pending')
        const toStart = pending.slice(0, Math.max(0, availableSlots - newAnimations.length))
        
        newAnimations.push(...toStart.map(task => ({
          ...task,
          status: 'running' as const
        })))

        if (newAnimations.length >= availableSlots) break
      }

      // Remove started animations from queue
      if (newAnimations.length > 0) {
        setQueue(prev => {
          const result = { ...prev }
          for (const priority of priorities) {
            result[priority] = result[priority].filter(
              task => !newAnimations.some(newTask => newTask.id === task.id)
            )
          }
          return result
        })
      }

      return [...current, ...newAnimations]
    })
  }, [enableQueue, maxConcurrent, queue])

  // Auto-process queue when it changes
  useEffect(() => {
    if (enableQueue) {
      const timer = setTimeout(processQueue, 10)
      return () => clearTimeout(timer)
    }
  }, [enableQueue, processQueue])

  // Integrate with TanStack Query
  const addQueryAnimation = useCallback((
    queryResult: UseQueryResult<any, Error>,
    message?: string,
    priority?: 'high' | 'normal' | 'low'
  ) => {
    if (queryResult.isPending || queryResult.isFetching) {
      const id = addAnimation('query', message || 'Loading data...', priority)
      
      // Auto-remove when query completes
      const cleanup = () => {
        if (!queryResult.isPending && !queryResult.isFetching) {
          removeAnimation(id)
        }
      }
      
      // This would need to be called when query state changes
      return { id, cleanup }
    }
    
    return null
  }, [addAnimation, removeAnimation])

  // Integrate with TanStack Mutation
  const addMutationAnimation = useCallback((
    mutationResult: UseMutationResult<any, Error, any, any>,
    message?: string,
    priority?: 'high' | 'normal' | 'low'
  ) => {
    if (mutationResult.isPending) {
      const id = addAnimation('mutation', message || 'Saving changes...', priority)
      
      // Auto-remove when mutation completes
      const cleanup = () => {
        if (!mutationResult.isPending) {
          removeAnimation(id)
        }
      }
      
      return { id, cleanup }
    }
    
    return null
  }, [addAnimation, removeAnimation])

  // Get current animation state
  const getCurrentState = useCallback(() => {
    const totalQueued = queue.high.length + queue.normal.length + queue.low.length
    const hasActiveAnimations = activeAnimations.length > 0
    const hasQueuedAnimations = totalQueued > 0
    
    const primaryAnimation = activeAnimations.find(anim => anim.priority === 'high') || 
                           activeAnimations[0]
    
    return {
      isAnimating: hasActiveAnimations,
      hasQueue: hasQueuedAnimations,
      totalActive: activeAnimations.length,
      totalQueued,
      primaryMessage: primaryAnimation?.message || 'Working...',
      primaryType: primaryAnimation?.type || 'custom',
      estimatedTimeRemaining: primaryAnimation?.estimatedDuration ? 
        Math.max(0, (primaryAnimation.startTime + primaryAnimation.estimatedDuration) - Date.now()) : 
        undefined
    }
  }, [activeAnimations, queue])

  // Clear all animations
  const clearAll = useCallback(() => {
    setQueue({ high: [], normal: [], low: [] })
    setActiveAnimations([])
    performanceRef.current.startTimes.clear()
  }, [])

  // Get performance insights
  const getPerformanceInsights = useCallback(() => {
    if (!enableAnalytics) return null
    
    const { durations, errors } = performanceRef.current
    const avgDuration = durations.length > 0 ? 
      durations.reduce((a, b) => a + b, 0) / durations.length : 0
    
    return {
      ...metrics,
      recommendations: [
        ...(avgDuration > 3000 ? ['Consider optimizing animation duration'] : []),
        ...(metrics.errorRate > 10 ? ['High error rate detected - check error handling'] : []),
        ...(activeAnimations.length > 2 ? ['Multiple concurrent animations may impact performance'] : [])
      ]
    }
  }, [enableAnalytics, metrics, activeAnimations.length])

  return {
    // State
    activeAnimations,
    queue,
    metrics,
    
    // Actions
    addAnimation,
    removeAnimation,
    markError,
    clearAll,
    
    // TanStack integration
    addQueryAnimation,
    addMutationAnimation,
    
    // Utilities
    getCurrentState,
    getPerformanceInsights,
    
    // Analytics
    isAnalyticsEnabled: enableAnalytics,
    isQueueEnabled: enableQueue,
    maxConcurrent
  }
}

export default useAgentAnimationState