'use client'

import React, { useState } from 'react'
import AgentWorkingAnimation from '@/components/AgentWorkingAnimation'

export default function DemoPage() {
  const [activeAnimations, setActiveAnimations] = useState({
    minimal: true,
    detailed: true,
    creative: true
  })

  const toggleAnimation = (type: keyof typeof activeAnimations) => {
    setActiveAnimations(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Agent Working Animations
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Original and visually appealing animations that symbolize AI agents working on content.
            Choose from different styles based on your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Minimal Animation */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Minimal</h2>
              <button
                onClick={() => toggleAnimation('minimal')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeAnimations.minimal
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {activeAnimations.minimal ? 'Active' : 'Stopped'}
              </button>
            </div>
            
            <div className="h-24 flex items-center justify-center mb-4">
              <AgentWorkingAnimation
                isWorking={activeAnimations.minimal}
                type="minimal"
                message="Processing"
              />
            </div>
            
            <div className="text-left space-y-2">
              <h3 className="font-medium text-gray-700">Best for:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Inline loading states</li>
                <li>• Compact UI spaces</li>
                <li>• Quick feedback</li>
              </ul>
            </div>
          </div>

          {/* Detailed Animation */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Detailed</h2>
              <button
                onClick={() => toggleAnimation('detailed')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeAnimations.detailed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {activeAnimations.detailed ? 'Active' : 'Stopped'}
              </button>
            </div>
            
            <div className="h-48 flex items-center justify-center mb-4">
              <AgentWorkingAnimation
                isWorking={activeAnimations.detailed}
                type="detailed"
                size="md"
                message="Analyzing content structure"
              />
            </div>
            
            <div className="text-left space-y-2">
              <h3 className="font-medium text-gray-700">Best for:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Content loading pages</li>
                <li>• Dashboard placeholders</li>
                <li>• Data processing</li>
              </ul>
            </div>
          </div>

          {/* Creative Animation */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Creative</h2>
              <button
                onClick={() => toggleAnimation('creative')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeAnimations.creative
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {activeAnimations.creative ? 'Active' : 'Stopped'}
              </button>
            </div>
            
            <div className="h-64 flex items-center justify-center mb-4">
              <AgentWorkingAnimation
                isWorking={activeAnimations.creative}
                type="creative"
                size="md"
                message="AI agents collaborating"
              />
            </div>
            
            <div className="text-left space-y-2">
              <h3 className="font-medium text-gray-700">Best for:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Landing pages</li>
                <li>• AI showcases</li>
                <li>• Brand experiences</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Size Variations */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Size Variations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Small</h3>
              <div className="flex justify-center">
                <AgentWorkingAnimation
                  isWorking={true}
                  type="creative"
                  size="sm"
                />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Medium</h3>
              <div className="flex justify-center">
                <AgentWorkingAnimation
                  isWorking={true}
                  type="creative"
                  size="md"
                />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Large</h3>
              <div className="flex justify-center">
                <AgentWorkingAnimation
                  isWorking={true}
                  type="creative"
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Usage Examples
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Basic Usage</h3>
              <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`import AgentWorkingAnimation from '@/components/AgentWorkingAnimation'

// Minimal loading indicator
<AgentWorkingAnimation 
  isWorking={true} 
  type="minimal" 
  message="Processing..."
/>

// Creative full-featured animation
<AgentWorkingAnimation 
  isWorking={isLoading} 
  type="creative" 
  size="lg"
  message="AI agents are analyzing your content"
/>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Props</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">Prop</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Default</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">isWorking</td>
                      <td className="border border-gray-200 px-4 py-2">boolean</td>
                      <td className="border border-gray-200 px-4 py-2">true</td>
                      <td className="border border-gray-200 px-4 py-2">Controls animation state</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">type</td>
                      <td className="border border-gray-200 px-4 py-2">'minimal' | 'detailed' | 'creative'</td>
                      <td className="border border-gray-200 px-4 py-2">'creative'</td>
                      <td className="border border-gray-200 px-4 py-2">Animation style</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">size</td>
                      <td className="border border-gray-200 px-4 py-2">'sm' | 'md' | 'lg'</td>
                      <td className="border border-gray-200 px-4 py-2">'md'</td>
                      <td className="border border-gray-200 px-4 py-2">Animation size</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">message</td>
                      <td className="border border-gray-200 px-4 py-2">string</td>
                      <td className="border border-gray-200 px-4 py-2">'AI agents are working...'</td>
                      <td className="border border-gray-200 px-4 py-2">Status message</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}