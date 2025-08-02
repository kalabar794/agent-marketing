'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    agents: ['Content Strategist', 'SEO Optimizer', 'Content Writer', 'Brand Guardian', 'Quality Controller'],
    features: ['SEO Optimized', '2000+ words', 'Research backed', 'Brand aligned']
  },
  {
    id: 'social',
    title: 'Social Media Campaign',
    description: 'Multi-platform social content with engagement focus',
    icon: Share2,
    estimatedTime: '8-12 minutes',
    agents: ['Content Strategist', 'Content Writer', 'Visual Designer', 'Brand Guardian'],
    features: ['Multi-platform', 'Visual content', 'Hashtag research', 'Engagement optimized']
  },
  {
    id: 'email',
    title: 'Email Campaign',
    description: 'Conversion-focused email sequences and newsletters',
    icon: Mail,
    estimatedTime: '10-15 minutes',
    agents: ['Content Strategist', 'Content Writer', 'Brand Guardian', 'Quality Controller'],
    features: ['A/B test ready', 'Personalized', 'CTA optimized', 'Mobile responsive']
  },
  {
    id: 'landing',
    title: 'Landing Page',
    description: 'High-converting pages for campaigns and products',
    icon: Globe,
    estimatedTime: '20-25 minutes',
    agents: ['Content Strategist', 'SEO Optimizer', 'Content Writer', 'Visual Designer', 'Brand Guardian', 'Quality Controller'],
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
        goals: formData.goals.trim(),
        tone: formData.tone?.trim() || 'Professional and engaging',
        platforms: selectedType === 'social' ? ['linkedin', 'twitter', 'facebook'] : undefined,
        brandGuidelines: formData.brandGuidelines?.trim()
      };

      const response = await fetch('/api/content/generate', {
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

      const { workflowId } = await response.json();
      
      // Redirect to workflow page with the workflow ID
      window.location.href = `/workflow?id=${workflowId}`;
      
    } catch (error) {
      console.error('Error starting content generation:', error);
      alert('Failed to start content generation. Please try again.');
      setIsLoading(false);
    }
  };

  const selectedTypeData = contentTypes.find(type => type.id === selectedType);

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="space-y-4">
            <Badge className="bg-gradient-primary text-primary-foreground">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Content Creation
            </Badge>
            <h1 className="text-4xl font-bold text-foreground">
              Create Professional Marketing Content
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your content type and let our specialized AI agents collaborate 
              to create compelling, on-brand content in minutes.
            </p>
          </div>
        </div>

        {/* Content Type Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            What type of content do you want to create?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contentTypes.map((type, index) => (
              <Card 
                key={type.id}
                className={`cursor-pointer transition-all duration-300 shadow-professional hover:shadow-elevated animate-slide-up ${
                  selectedType === type.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-accent/5'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedType(type.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      selectedType === type.id 
                        ? 'bg-gradient-primary' 
                        : 'bg-muted'
                    }`}>
                      <type.icon className={`w-6 h-6 ${
                        selectedType === type.id 
                          ? 'text-primary-foreground' 
                          : 'text-muted-foreground'
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
            <Card className="shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-primary" />
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
                    <textarea
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      rows={3}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Selected Type Summary & Create Button */}
        {selectedType && (
          <div className="text-center animate-fade-in">
            <Card className="shadow-professional mb-8 bg-gradient-card border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  {selectedTypeData && <selectedTypeData.icon className="w-8 h-8 text-primary" />}
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
                    <Badge key={agent} className="bg-primary/10 text-primary">
                      {agent}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button 
              className="bg-gradient-primary shadow-professional text-lg px-12 py-4 h-auto"
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