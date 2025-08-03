import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle
} from "lucide-react";

const features = [
  "No setup required",
  "Professional results", 
  "Brand consistency"
];


export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-600/20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                Next-Generation Marketing AI
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                  Agentic Marketing
                  <br />
                  <span className="text-yellow-300 drop-shadow-lg">Content Generator</span>
                </h1>
                
                <p className="text-xl text-white/90 max-w-lg leading-relaxed drop-shadow-md">
                  Transform your marketing workflow with 11 specialized AI 
                  agents that collaborate to create professional, on-brand 
                  content in minutes, not hours.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/create">
                  <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg px-8 py-4 h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200">
                    Start Creating
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="text-lg px-8 py-4 h-auto rounded-xl bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all duration-200">
                    View Dashboard
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-white/80">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Column - Vibrant 3D Illustration */}
            <div className="relative">
              <div className="relative z-10 w-full h-96 lg:h-[500px] bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl shadow-2xl overflow-hidden transform hover:rotate-1 transition-transform duration-500">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/30 via-purple-500/30 to-cyan-400/30 animate-pulse"></div>
                
                {/* 3D Isometric Scene */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Platform */}
                  <div className="relative">
                    {/* Base Platform - More Vibrant */}
                    <div className="w-64 h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-lg transform perspective-1000 rotate-x-60 shadow-2xl animate-pulse-glow"></div>
                    
                    {/* Floating UI Elements - Bright Colors */}
                    <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-lg animate-float"></div>
                    <div className="absolute -top-12 right-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg animate-float-delay-1"></div>
                    <div className="absolute -top-6 right-12 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg shadow-lg animate-float-delay-2"></div>
                    
                    {/* Agent Figures - Colorful */}
                    <div className="absolute -top-20 left-1/4 w-8 h-16 bg-gradient-to-b from-green-400 to-emerald-600 rounded-t-full shadow-lg animate-bounce-subtle"></div>
                    <div className="absolute -top-16 right-1/4 w-6 h-12 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-t-full shadow-lg animate-bounce-subtle"></div>
                    
                    {/* Floating Icons - Vibrant */}
                    <div className="absolute -top-32 left-8 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded shadow-lg animate-bounce"></div>
                    <div className="absolute -top-28 right-8 w-4 h-4 bg-gradient-to-br from-green-400 to-lime-500 rounded shadow-lg animate-bounce-delay"></div>
                    <div className="absolute -top-24 left-20 w-5 h-5 bg-gradient-to-br from-red-400 to-pink-500 rounded shadow-lg animate-pulse"></div>
                  </div>
                </div>
                
                {/* Enhanced Particle Effects */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-twinkle shadow-lg"></div>
                  <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-pink-300 rounded-full animate-twinkle-delay shadow-lg"></div>
                  <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-300 rounded-full animate-twinkle-delay-2 shadow-lg"></div>
                  <div className="absolute top-1/2 right-1/2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
              
              {/* Enhanced Glow Effect */}
              <div className="absolute -inset-6 bg-gradient-to-r from-orange-500/40 via-pink-500/40 to-purple-500/40 rounded-3xl blur-3xl animate-pulse-glow"></div>
            </div>
          </div>
        </div>
        
        {/* Floating Background Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-float-delay-1"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-400/20 rounded-full blur-lg animate-float-delay-2"></div>
      </section>


      {/* Powerful Features Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Powerful Features for 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500"> Modern Marketing</span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Experience the future of content creation with our comprehensive agentic platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🤖',
                title: '11 Specialized AI Agents',
                description: 'Content Strategist, SEO Optimizer, Content Writer, Visual Designer, Brand Guardian, and Quality Controller work together seamlessly',
                gradient: 'from-cyan-400 to-blue-500'
              },
              {
                icon: '⚡',
                title: 'Intelligent Pipeline',
                description: 'Automated workflow from research to final content with real-time progress tracking and agent coordination',
                gradient: 'from-yellow-400 to-orange-500'
              },
              {
                icon: '📊',
                title: 'Quality Analytics',
                description: 'Advanced metrics and scoring to ensure every piece meets your brand standards and performance goals',
                gradient: 'from-green-400 to-emerald-500'
              },
              {
                icon: '🛡️',
                title: 'Quality Control',
                description: 'Built-in review system with manual approval checkpoints and automated quality validation',
                gradient: 'from-purple-400 to-pink-500'
              },
              {
                icon: '🌐',
                title: 'Multi-Platform Content',
                description: 'Generate blogs, social media, landing pages, and email campaigns tailored for each platform',
                gradient: 'from-rose-400 to-red-500'
              },
              {
                icon: '🎨',
                title: 'Brand Consistency',
                description: 'Maintain your unique voice and style across all content with intelligent brand guidelines enforcement',
                gradient: 'from-indigo-400 to-purple-500'
              }
            ].map((feature, index) => (
              <div key={index} className="group p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className={`text-4xl mb-4 p-4 rounded-full bg-gradient-to-r ${feature.gradient} w-fit`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-yellow-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-pink-500/20 to-purple-600/30 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Start Creating with AI Agents
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Experience intelligent content generation powered by specialized AI agents working together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 font-bold text-lg px-8 py-4 h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/workflow">
              <Button variant="outline" className="text-lg px-8 py-4 h-auto rounded-xl bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all duration-200">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}