'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface QueryProviderProps {
  children: React.ReactNode
}

// Create a client with optimized settings for animations
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Optimize for animation integration
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error) => {
          // Custom retry logic for better animation UX
          if (failureCount < 3) return true
          return false
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        // Optimize mutations for better loading states
        retry: false,
        networkMode: 'online',
        // Global error handling
        onError: (error) => {
          console.error('Mutation error:', error)
          // You can add global error handling here
        },
      },
    },
  })
}

let clientSingleton: QueryClient | undefined = undefined

const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!clientSingleton) clientSingleton = createQueryClient()
    return clientSingleton
  }
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export default QueryProvider