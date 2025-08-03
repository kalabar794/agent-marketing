'use client'

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useAgentAnimationState } from './useAgentAnimationState'
import { useCallback, useEffect, useRef } from 'react'

// Types for backend operations
interface BackendAnimationOptions {
  message?: string
  priority?: 'high' | 'normal' | 'low'
  enableAnimation?: boolean
  estimatedDuration?: number
}

interface UseAnimatedQueryOptions<TData, TError> extends UseQueryOptions<TData, TError> {
  animation?: BackendAnimationOptions
}

interface UseAnimatedMutationOptions<TData, TError, TVariables, TContext> 
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  animation?: BackendAnimationOptions
}

// Custom hook for animated queries
export const useAnimatedQuery = <TData = unknown, TError = Error>(
  options: UseAnimatedQueryOptions<TData, TError>
) => {
  const animationState = useAgentAnimationState()
  const animationIdRef = useRef<string | null>(null)
  
  const { animation, ...queryOptions } = options
  const {
    message = 'Loading data...',
    priority = 'normal',
    enableAnimation = true,
    estimatedDuration
  } = animation || {}
  
  const query = useQuery(queryOptions)
  
  // Manage animation lifecycle
  useEffect(() => {
    if (!enableAnimation) return
    
    if ((query.isPending || query.isFetching) && !animationIdRef.current) {
      // Start animation
      animationIdRef.current = animationState.addAnimation(
        'query',
        message,
        priority,
        estimatedDuration
      )
    } else if (!query.isPending && !query.isFetching && animationIdRef.current) {
      // Stop animation
      animationState.removeAnimation(animationIdRef.current)
      animationIdRef.current = null
    }
    
    // Handle errors
    if (query.isError && animationIdRef.current) {
      animationState.markError(animationIdRef.current, query.error?.message)
    }
  }, [
    query.isPending, 
    query.isFetching, 
    query.isError, 
    query.error?.message,
    enableAnimation,
    message,
    priority,
    estimatedDuration,
    animationState
  ])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        animationState.removeAnimation(animationIdRef.current)
      }
    }
  }, [animationState])
  
  return {
    ...query,
    animationId: animationIdRef.current,
    isAnimating: !!animationIdRef.current
  }
}

// Custom hook for animated mutations
export const useAnimatedMutation = <
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: UseAnimatedMutationOptions<TData, TError, TVariables, TContext>
) => {
  const animationState = useAgentAnimationState()
  const animationIdRef = useRef<string | null>(null)
  
  const { animation, ...mutationOptions } = options
  const {
    message = 'Saving changes...',
    priority = 'high',
    enableAnimation = true,
    estimatedDuration
  } = animation || {}
  
  const mutation = useMutation({
    ...mutationOptions,
    onMutate: async (variables) => {
      // Start animation before mutation
      if (enableAnimation) {
        animationIdRef.current = animationState.addAnimation(
          'mutation',
          message,
          priority,
          estimatedDuration
        )
      }
      
      // Call original onMutate
      return mutationOptions.onMutate?.(variables)
    },
    onSuccess: (data, variables, context) => {
      // Stop animation on success
      if (animationIdRef.current) {
        animationState.removeAnimation(animationIdRef.current)
        animationIdRef.current = null
      }
      
      // Call original onSuccess
      mutationOptions.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      // Mark animation as error
      if (animationIdRef.current) {
        animationState.markError(animationIdRef.current, error?.message)
        // Remove after a delay to show error state
        setTimeout(() => {
          if (animationIdRef.current) {
            animationState.removeAnimation(animationIdRef.current)
            animationIdRef.current = null
          }
        }, 3000)
      }
      
      // Call original onError
      mutationOptions.onError?.(error, variables, context)
    }
  })
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        animationState.removeAnimation(animationIdRef.current)
      }
    }
  }, [animationState])
  
  return {
    ...mutation,
    animationId: animationIdRef.current,
    isAnimating: !!animationIdRef.current
  }
}

// Hook for optimistic UI updates with animations
export const useOptimisticMutation = <
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: UseAnimatedMutationOptions<TData, TError, TVariables, TContext> & {
    optimisticUpdate?: (variables: TVariables) => void
    revertUpdate?: (error: TError, variables: TVariables) => void
  }
) => {
  const { optimisticUpdate, revertUpdate, animation, ...mutationOptions } = options
  
  const animatedMutation = useAnimatedMutation({
    ...mutationOptions,
    animation: {
      message: 'Updating...',
      priority: 'high',
      ...animation
    },
    onMutate: async (variables) => {
      // Apply optimistic update immediately
      optimisticUpdate?.(variables)
      
      // Call original onMutate
      return mutationOptions.onMutate?.(variables)
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      revertUpdate?.(error, variables)
      
      // Call original onError
      mutationOptions.onError?.(error, variables, context)
    }
  })
  
  return animatedMutation
}

// Hook for background sync with subtle animations
export const useBackgroundSync = <TData = unknown, TError = Error>(
  options: UseAnimatedQueryOptions<TData, TError> & {
    syncInterval?: number
    enableBackgroundSync?: boolean
  }
) => {
  const { syncInterval = 30000, enableBackgroundSync = true, animation, ...queryOptions } = options
  
  const query = useAnimatedQuery({
    ...queryOptions,
    animation: {
      message: 'Syncing...',
      priority: 'low',
      ...animation
    },
    refetchInterval: enableBackgroundSync ? syncInterval : false,
    refetchIntervalInBackground: true
  })
  
  return {
    ...query,
    isSyncing: query.isFetching && !query.isPending,
    lastSyncTime: query.dataUpdatedAt
  }
}

// Hook for preloading with animations
export const usePreloadQuery = <TData = unknown, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options: {
    preloadDelay?: number
    animation?: BackendAnimationOptions
  } = {}
) => {
  const { preloadDelay = 1000, animation } = options
  const animationState = useAgentAnimationState()
  
  const preload = useCallback(() => {
    if (animation?.enableAnimation !== false) {
      const animationId = animationState.addAnimation(
        'query',
        animation?.message || 'Preloading...',
        animation?.priority || 'low',
        animation?.estimatedDuration
      )
      
      setTimeout(() => {
        animationState.removeAnimation(animationId)
      }, preloadDelay)
    }
  }, [animationState, animation, preloadDelay])
  
  return { preload }
}

// Performance monitoring hook
export const useAnimationPerformance = () => {
  const animationState = useAgentAnimationState({ enableAnalytics: true })
  
  const insights = animationState.getPerformanceInsights()
  const currentState = animationState.getCurrentState()
  
  return {
    insights,
    currentState,
    activeCount: currentState.totalActive,
    queuedCount: currentState.totalQueued,
    isPerformant: insights ? insights.performanceScore > 80 : true,
    recommendations: insights?.recommendations || []
  }
}

export default {
  useAnimatedQuery,
  useAnimatedMutation,
  useOptimisticMutation,
  useBackgroundSync,
  usePreloadQuery,
  useAnimationPerformance
}