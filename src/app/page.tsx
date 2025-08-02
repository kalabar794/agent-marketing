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

const stats = [
  { value: "94%", label: "Content Quality", description: "Average quality score" },
  { value: "75%", label: "Time Saved", description: "Faster than traditional methods" },
  { value: "98%", label: "Brand Consistency", description: "Maintains brand voice" },
  { value: "96%", label: "Client Satisfaction", description: "Positive feedback rate" }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-sm font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Next-Generation Marketing AI
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Agentic Marketing
                  <br />
                  <span className="text-orange-500">Content Generator</span>
                </h1>
                
                <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                  Transform your marketing workflow with 11 specialized AI 
                  agents that collaborate to create professional, on-brand 
                  content in minutes, not hours.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/create">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-4 h-auto rounded-lg shadow-lg">
                    Start Creating
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="text-lg px-8 py-4 h-auto rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50">
                    View Dashboard
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Column - Isometric Illustration */}
            <div className="relative">
              <div className="relative z-10 w-full h-96 lg:h-[500px] bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* 3D Isometric Scene */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Platform */}
                  <div className="relative">
                    {/* Base Platform */}
                    <div className="w-64 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg transform perspective-1000 rotate-x-60 shadow-2xl"></div>
                    
                    {/* Floating UI Elements */}
                    <div className="absolute -top-8 -left-8 w-16 h-16 bg-orange-500 rounded-lg shadow-lg animate-float"></div>
                    <div className="absolute -top-12 right-4 w-12 h-12 bg-purple-500 rounded-lg shadow-lg animate-float-delay-1"></div>
                    <div className="absolute -top-6 right-12 w-8 h-8 bg-pink-500 rounded-lg shadow-lg animate-float-delay-2"></div>
                    
                    {/* People Figures */}
                    <div className="absolute -top-20 left-1/4 w-8 h-16 bg-gradient-to-b from-orange-400 to-orange-600 rounded-t-full shadow-lg"></div>
                    <div className="absolute -top-16 right-1/4 w-6 h-12 bg-gradient-to-b from-blue-400 to-blue-600 rounded-t-full shadow-lg"></div>
                    
                    {/* Floating Icons */}
                    <div className="absolute -top-32 left-8 w-6 h-6 bg-yellow-400 rounded shadow-lg animate-bounce"></div>
                    <div className="absolute -top-28 right-8 w-4 h-4 bg-green-400 rounded shadow-lg animate-bounce-delay"></div>
                    <div className="absolute -top-24 left-20 w-5 h-5 bg-red-400 rounded shadow-lg animate-pulse"></div>
                  </div>
                </div>
                
                {/* Particle Effects */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
                  <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-twinkle-delay"></div>
                  <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-white rounded-full animate-twinkle-delay-2"></div>
                </div>
              </div>
              
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-2xl blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-orange-500 mb-2">
                  {stat.value}
                </div>
                <div className="font-medium text-gray-900 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}