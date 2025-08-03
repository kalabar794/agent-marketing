'use client'

import React, { useState, Suspense } from 'react'
import AgentWorkingAnimation from '@/components/AgentWorkingAnimation'
import { QueryProvider } from '@/providers/QueryProvider'
import { 
  useAnimatedQuery, 
  useAnimatedMutation, 
  useOptimisticMutation,
  useBackgroundSync,
  useAnimationPerformance 
} from '@/hooks/useBackendAnimations'
import { useAgentAnimationState } from '@/hooks/useAgentAnimationState'

// Mock API functions for demonstration
const mockFetch = (delay: number = 2000, shouldError: boolean = false): Promise<any> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldError) {
        reject(new Error('Mock API error for testing'))
      } else {
        resolve({ data: 'Mock data loaded successfully', timestamp: Date.now() })
      }
    }, delay)
  })
}

const mockSave = (data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.8) {
        reject(new Error('Save failed - please retry'))
      } else {
        resolve({ ...data, id: Math.random().toString(36), saved: true })
      }
    }, 1500)
  })
}

// Demo Components
function BackendIntegrationDemo() {
  const [mockData, setMockData] = useState<string>('Initial data')
  const [errorDemo, setErrorDemo] = useState(false)
  
  // TanStack Query integration examples
  const dataQuery = useAnimatedQuery({
    queryKey: ['demo-data'],
    queryFn: () => mockFetch(3000, errorDemo),
    animation: {
      message: 'Loading demo data...',
      priority: 'high',
      estimatedDuration: 3000
    }
  })
  
  const saveMutation = useAnimatedMutation({
    mutationFn: (data: string) => mockSave({ content: data }),
    animation: {
      message: 'Saving your changes...',
      priority: 'high',
      estimatedDuration: 1500
    },
    onSuccess: (result) => {
      console.log('Save successful:', result)
      setMockData(result.content)
    }
  })
  
  const optimisticMutation = useOptimisticMutation({
    mutationFn: (data: string) => mockSave({ content: data }),
    animation: {
      message: 'Optimistically updating...',
      priority: 'normal'
    },
    optimisticUpdate: (data) => {
      setMockData(data + ' (optimistic)')
    },
    revertUpdate: (error, data) => {
      setMockData(data)
    },
    onSuccess: (result) => {
      setMockData(result.content)
    }
  })
  
  const backgroundSync = useBackgroundSync({
    queryKey: ['background-sync'],
    queryFn: () => mockFetch(500),
    syncInterval: 10000,
    enableBackgroundSync: true,
    animation: {
      message: 'Syncing in background...',
      priority: 'low'
    }
  })
  
  return (
    <div className="space-y-8" data-testid="integration-tab">
      {/* TanStack Query Integration */}
      <div className="bg-white rounded-xl shadow-lg p-6" data-testid="tanstack-section">
        <h3 className="text-xl font-semibold mb-4">TanStack Query Integration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Animated Query</h4>
            <div className="mb-4">
              <AgentWorkingAnimation
                queryState={dataQuery}
                type="detailed"
                size="sm"
                showOnlyInViewport={true}
                enablePerformanceMode={true}
              />
            </div>
            <div className="space-y-2">
              <button
                onClick={() => dataQuery.refetch()}
                disabled={dataQuery.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Refetch Data
              </button>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={errorDemo}
                  onChange={(e) => setErrorDemo(e.target.checked)}
                />
                <span className="text-sm">Simulate error</span>
              </label>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Status: {dataQuery.isPending ? 'Loading' : dataQuery.isError ? 'Error' : 'Success'}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Animated Mutation</h4>
            <div className="mb-4">
              <AgentWorkingAnimation
                mutationState={saveMutation}
                type="minimal"
                showOnlyInViewport={true}
              />
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={mockData}
                onChange={(e) => setMockData(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Edit data to save..."
              />
              <button
                onClick={() => saveMutation.mutate(mockData)}
                disabled={saveMutation.isPending}
                className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Status: {saveMutation.isPending ? 'Saving' : saveMutation.isError ? 'Failed' : 'Ready'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Optimistic Updates */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Optimistic Updates</h3>
        
        <div className="mb-4">
          <AgentWorkingAnimation
            mutationState={optimisticMutation}
            type="creative"
            size="sm"
            enablePerformanceMode={true}
          />
        </div>
        
        <div className="space-y-2">
          <input
            type="text"
            value={mockData}
            onChange={(e) => setMockData(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Type to see optimistic updates..."
          />
          <button
            onClick={() => optimisticMutation.mutate(mockData)}
            disabled={optimisticMutation.isPending}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
          >
            Save with Optimistic Update
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <strong>Current Data:</strong> {mockData}
        </div>
      </div>
      
      {/* Background Sync */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Background Sync</h3>
        
        <div className="mb-4">
          <AgentWorkingAnimation
            queryState={backgroundSync}
            type="minimal"
            showOnlyInViewport={true}
            priority="low"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Sync Status</h4>
            <div className="space-y-1 text-sm">
              <div>Is Syncing: {backgroundSync.isSyncing ? 'Yes' : 'No'}</div>
              <div>Last Sync: {backgroundSync.lastSyncTime ? new Date(backgroundSync.lastSyncTime).toLocaleTimeString() : 'Never'}</div>
              <div>Data Updated: {backgroundSync.dataUpdatedAt ? new Date(backgroundSync.dataUpdatedAt).toLocaleTimeString() : 'Never'}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Manual Controls</h4>
            <button
              onClick={() => backgroundSync.refetch()}
              className="px-4 py-2 bg-indigo-500 text-white rounded"
            >
              Force Sync Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnimationStateDemo() {
  const animationState = useAgentAnimationState({
    maxConcurrent: 3,
    enableQueue: true,
    enableAnalytics: true
  })
  
  const performance = useAnimationPerformance()
  const currentState = animationState.getCurrentState()
  
  const addCustomAnimation = (priority: 'high' | 'normal' | 'low') => {
    const id = animationState.addAnimation(
      'custom',
      `Custom ${priority} priority task`,
      priority,
      Math.random() * 3000 + 1000
    )
    
    // Auto-remove after duration
    setTimeout(() => {
      animationState.removeAnimation(id)
    }, Math.random() * 3000 + 1000)
  }
  
  return (
    <div className="space-y-6">
      {/* Global Animation State */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Global Animation State Manager</h3>
        
        <div className="mb-6">
          <AgentWorkingAnimation
            isWorking={currentState.isAnimating}
            type="creative"
            message={currentState.primaryMessage}
            size="md"
            enablePerformanceMode={true}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => addCustomAnimation('high')}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Add High Priority
          </button>
          <button
            onClick={() => addCustomAnimation('normal')}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Add Normal Priority
          </button>
          <button
            onClick={() => addCustomAnimation('low')}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Add Low Priority
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Current State</h4>
            <div className="space-y-1 text-sm">
              <div>Active: {currentState.totalActive}</div>
              <div>Queued: {currentState.totalQueued}</div>
              <div>Is Animating: {currentState.isAnimating ? 'Yes' : 'No'}</div>
              <div>Primary Type: {currentState.primaryType}</div>
              {currentState.estimatedTimeRemaining && (
                <div>ETA: {Math.round(currentState.estimatedTimeRemaining / 1000)}s</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Queue Status</h4>
            <div className="space-y-1 text-sm">
              <div>High Priority: {animationState.queue.high.length}</div>
              <div>Normal Priority: {animationState.queue.normal.length}</div>
              <div>Low Priority: {animationState.queue.low.length}</div>
            </div>
          </div>
        </div>
        
        <button
          onClick={animationState.clearAll}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded"
        >
          Clear All Animations
        </button>
      </div>
      
      {/* Performance Analytics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Performance Analytics</h3>
        
        {performance.insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Metrics</h4>
              <div className="space-y-1 text-sm">
                <div>Total Animations: {performance.insights.totalAnimations}</div>
                <div>Average Duration: {Math.round(performance.insights.averageDuration)}ms</div>
                <div>Error Rate: {performance.insights.errorRate.toFixed(1)}%</div>
                <div>Performance Score: {Math.round(performance.insights.performanceScore)}/100</div>
              </div>
              
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      performance.insights.performanceScore > 80 ? 'bg-green-500' :
                      performance.insights.performanceScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${performance.insights.performanceScore}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Performance Score
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              {performance.recommendations.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-600">
                  {performance.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-600">✓ Performance is optimal</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ViewportOptimizationDemo() {
  const [items] = useState(Array.from({ length: 20 }, (_, i) => i))
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Viewport Optimization Demo</h3>
      <p className="text-gray-600 mb-6">
        Scroll to see animations only trigger when in viewport (intersection observer)
      </p>
      
      <div className="space-y-8">
        {items.map((item) => (
          <div key={item} className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Animation Item #{item + 1}</h4>
            <div className="mb-2">
              <AgentWorkingAnimation
                isWorking={true}
                type={item % 3 === 0 ? 'creative' : item % 2 === 0 ? 'detailed' : 'minimal'}
                size="sm"
                showOnlyInViewport={true}
                triggerOnce={true}
                rootMargin="100px"
                enablePerformanceMode={true}
                message={`Loading item ${item + 1}...`}
              />
            </div>
            <p className="text-sm text-gray-600">
              This animation only runs when visible in the viewport
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BackendDemoPage() {
  const [activeTab, setActiveTab] = useState<'integration' | 'state' | 'viewport'>('integration')
  
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Backend Integration & Performance Demo
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Advanced animations with TanStack Query integration, intersection observer optimization,
              global state management, and performance analytics.
            </p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-lg">
              <button
                onClick={() => setActiveTab('integration')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'integration'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Backend Integration
              </button>
              <button
                onClick={() => setActiveTab('state')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'state'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Animation State
              </button>
              <button
                onClick={() => setActiveTab('viewport')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'viewport'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Viewport Optimization
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <AgentWorkingAnimation
                isWorking={true}
                type="creative"
                message="Loading demo content..."
              />
            </div>
          }>
            {activeTab === 'integration' && <BackendIntegrationDemo />}
            {activeTab === 'state' && <AnimationStateDemo />}
            {activeTab === 'viewport' && <ViewportOptimizationDemo />}
          </Suspense>
          
          {/* Feature Summary */}
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">🚀 New Features Implemented</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🔄 TanStack Query Integration</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatic query state animations</li>
                  <li>• Mutation progress indicators</li>
                  <li>• Background refetch animations</li>
                  <li>• Error state handling</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">👁️ Viewport Optimization</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Intersection Observer integration</li>
                  <li>• Animations only when visible</li>
                  <li>• Configurable trigger behavior</li>
                  <li>• Performance-optimized rendering</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🎛️ Global State Management</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Animation queuing system</li>
                  <li>• Priority-based processing</li>
                  <li>• Concurrent animation limits</li>
                  <li>• Global state coordination</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">⚡ Performance Optimization</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CSS containment strategy</li>
                  <li>• will-change optimization</li>
                  <li>• Animation metrics tracking</li>
                  <li>• Performance recommendations</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🔄 Optimistic Updates</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Immediate UI feedback</li>
                  <li>• Automatic rollback on error</li>
                  <li>• Seamless state transitions</li>
                  <li>• Enhanced user experience</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📊 Analytics & Monitoring</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Animation duration tracking</li>
                  <li>• Error rate monitoring</li>
                  <li>• Performance scoring</li>
                  <li>• Usage recommendations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryProvider>
  )
}