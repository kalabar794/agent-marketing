'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PenTool, 
  Target, 
  Users, 
  Calendar,
  FileText,
  Share2,
  Mail,
  Globe,
  ArrowRight,
  Sparkles,
  Settings
} from "lucide-react";

const contentTypes = [
  {
    id: 'blog',
    title: 'Blog Post',
    description: 'Long-form content for thought leadership and SEO',
    icon: FileText,
    estimatedTime: '15-20 minutes',
    agents: ['Market Researcher', 'Audience Analyzer', 'Content Strategist', 'Content Writer', 'SEO Optimizer', 'Social Media Specialist', 'Content Editor'],
    features: ['SEO Optimized', '2000+ words', 'Research backed', 'Brand aligned']
  },
  {
    id: 'social',
    title: 'Social Media Campaign',
    description: 'Multi-platform social content with engagement focus',
    icon: Share2,
    estimatedTime: '8-12 minutes',
    agents: ['Market Researcher', 'Audience Analyzer', 'Content Strategist', 'Content Writer', 'SEO Optimizer', 'Social Media Specialist', 'Content Editor'],
    features: ['Multi-platform', 'Visual content', 'Hashtag research', 'Engagement optimized']
  },
  {
    id: 'email',
    title: 'Email Campaign',
    description: 'Conversion-focused email sequences and newsletters',
    icon: Mail,
    estimatedTime: '10-15 minutes',
    agents: ['Market Researcher', 'Audience Analyzer', 'Content Strategist', 'Content Writer', 'SEO Optimizer', 'Social Media Specialist', 'Content Editor'],
    features: ['A/B test ready', 'Personalized', 'CTA optimized', 'Mobile responsive']
  },
  {
    id: 'landing',
    title: 'Landing Page',
    description: 'High-converting pages for campaigns and products',
    icon: Globe,
    estimatedTime: '20-25 minutes',
    agents: ['Market Researcher', 'Audience Analyzer', 'Content Strategist', 'Content Writer', 'SEO Optimizer', 'Social Media Specialist', 'Content Editor'],
    features: ['Conversion optimized', 'SEO ready', 'Mobile responsive', 'A/B test variants']
  }
];

const projectDetails = [
  {
    id: 'topic',
    label: 'Content Topic',
    description: 'What do you want to create content about?',
    placeholder: 'e.g., AI in marketing, sustainable business practices, customer retention strategies'
  },
  {
    id: 'audience',
    label: 'Target Audience',
    description: 'Who is your primary audience?',
    placeholder: 'e.g., Marketing professionals, Small business owners, Tech executives'
  },
  {
    id: 'goals',
    label: 'Content Goals',
    description: 'What do you want to achieve?',
    placeholder: 'e.g., Generate leads, Increase brand awareness, Drive website traffic'
  },
  {
    id: 'tone',
    label: 'Brand Tone',
    description: 'How should the content sound?',
    placeholder: 'e.g., Professional and authoritative, Friendly and approachable, Technical and detailed'
  },
  {
    id: 'length',
    label: 'Content Length',
    description: 'How comprehensive should the content be?',
    placeholder: 'Select desired word count',
    type: 'select',
    options: [
      { value: 'standard', label: 'Standard (1,000-1,500 words)', description: 'Good for most topics' },
      { value: 'comprehensive', label: 'Comprehensive (1,500-2,500 words)', description: 'In-depth coverage (Recommended)' },
      { value: 'extensive', label: 'Extensive (2,500+ words)', description: 'Ultimate authority piece' }
    ]
  }
];

export default function CreateContent() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCreateContent = async () => {
    if (!selectedType) return;
    
    // Validate required fields
    const requiredFields = ['topic', 'audience', 'goals'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const contentGenerationRequest = {
        contentType: selectedType,
        topic: formData.topic.trim(),
        audience: formData.audience.trim(),
        goals: [formData.goals.trim()],
        tone: formData.tone?.trim() || 'Professional and engaging',
        length: formData.length || 'comprehensive',
        platforms: selectedType === 'social' ? ['linkedin', 'twitter', 'facebook'] : undefined,
        brandGuidelines: formData.brandGuidelines?.trim()
      };

      const response = await fetch('/api/content/generate-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentGenerationRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start content generation');
      }

      const { jobId } = await response.json();
      
      // Redirect to background workflow page with the job ID  
      window.location.href = `/workflow-bg?jobId=${jobId}`;
      
    } catch (error) {
      console.error('Error starting content generation:', error);
      alert('Failed to start content generation. Please try again.');
      setIsLoading(false);
    }
  };

  const selectedTypeData = contentTypes.find(type => type.id === selectedType);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Section with Vibrant Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-600/20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 relative z-10">
          <div className="text-center">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                AI-Powered Content Creation
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                Create Professional
                <br />
                <span className="text-yellow-300 drop-shadow-lg">Marketing Content</span>
              </h1>
              <p className="text-xl text-white/90 max-w-lg mx-auto leading-relaxed drop-shadow-md">
                Choose your content type and let our specialized AI agents collaborate 
                to create compelling, on-brand content in minutes.
              </p>
            </div>
          </div>
        </div>
        
        {/* Floating Background Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-float-delay-1"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-400/20 rounded-full blur-lg animate-float-delay-2"></div>
      </section>
      
      <div className="max-w-7xl mx-auto px-6 py-20">

        {/* Content Type Selection */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            What type of content do you want to create?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contentTypes.map((type, index) => (
              <Card 
                key={type.id}
                className={`cursor-pointer transition-all duration-300 shadow-2xl hover:shadow-elevated animate-slide-up transform hover:scale-105 ${
                  selectedType === type.id 
                    ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-orange-900/50 via-pink-900/50 to-purple-900/50 border-yellow-400/50 text-white backdrop-blur-sm' 
                    : 'hover:bg-gradient-to-br hover:from-slate-700 hover:to-purple-900/30 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:border-white/40'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedType(type.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      selectedType === type.id 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      <type.icon className={`w-6 h-6 ${
                        selectedType === type.id 
                          ? 'text-white' 
                          : 'text-white'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{type.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{type.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {type.description}
                  </CardDescription>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {type.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">AI Agents involved:</h4>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {type.agents.length} specialists
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Project Details Form */}
        {selectedType && (
          <div className="mb-12 animate-fade-in">
            <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-yellow-400" />
                  <span>Project Details</span>
                </CardTitle>
                <CardDescription>
                  Provide details to help our AI agents create the perfect {selectedTypeData?.title.toLowerCase()} for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {projectDetails.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {field.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                    {field.type === 'select' && field.options ? (
                      <Select value={formData[field.id] || ''} onValueChange={(value) => handleInputChange(field.id, value)}>
                        <SelectTrigger className="w-full p-3 border border-white/30 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors">
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/30">
                          {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10">
                              <div className="flex flex-col">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-gray-400">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <textarea
                        className="w-full p-3 border border-white/30 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors"
                        rows={3}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Selected Type Summary & Create Button */}
        {selectedType && (
          <div className="text-center animate-fade-in">
            <Card className="shadow-2xl mb-8 bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  {selectedTypeData && <selectedTypeData.icon className="w-8 h-8 text-yellow-400" />}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Ready to create your {selectedTypeData?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTypeData?.agents.length} AI agents will collaborate on this project
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {selectedTypeData?.agents.map((agent) => (
                    <Badge key={agent} className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-300 border-orange-400/30">
                      {agent}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg px-12 py-4 h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200"
              onClick={handleCreateContent}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Initializing AI Agents...
                </>
              ) : (
                <>
                  Start Creating
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            
            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-4">
                Estimated completion time: {selectedTypeData?.estimatedTime}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}