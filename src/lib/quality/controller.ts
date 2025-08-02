import { GeneratedContent, QualityScores } from '@/types/content';

export class QualityController {
  constructor() {
    // Initialize quality control system
  }

  public async evaluateContent(content: GeneratedContent): Promise<QualityScores> {
    // Simulate comprehensive quality evaluation
    const scores = await this.calculateQualityScores(content);
    return scores;
  }

  private async calculateQualityScores(content: GeneratedContent): Promise<QualityScores> {
    // Calculate readability score based on content complexity
    const readability = this.calculateReadabilityScore(content.content);
    
    // Calculate SEO score based on keywords and structure
    const seo = this.calculateSEOScore(content);
    
    // Calculate brand alignment score
    const brandAlignment = this.calculateBrandAlignment(content);
    
    // Calculate originality score
    const originality = this.calculateOriginality(content);
    
    // Calculate overall score as weighted average
    const overall = (readability * 0.25) + (seo * 0.3) + (brandAlignment * 0.25) + (originality * 0.2);

    return {
      overall: Math.round(overall * 100) / 100,
      readability: Math.round(readability * 100) / 100,
      seo: Math.round(seo * 100) / 100,
      brandAlignment: Math.round(brandAlignment * 100) / 100,
      originality: Math.round(originality * 100) / 100,
      evaluatedAt: new Date(),
      recommendations: this.generateRecommendations(overall, readability, seo, brandAlignment, originality)
    };
  }

  private calculateReadabilityScore(content: string): number {
    if (!content) return 0;
    
    // Simple readability calculation based on sentence and word complexity
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / Math.max(words.length, 1);
    
    // Score based on ideal ranges (10-20 words per sentence, 4-6 chars per word)
    let score = 0.8;
    
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
      score += 0.1;
    } else {
      score -= Math.abs(avgWordsPerSentence - 15) * 0.01;
    }
    
    if (avgWordLength >= 4 && avgWordLength <= 6) {
      score += 0.1;
    } else {
      score -= Math.abs(avgWordLength - 5) * 0.02;
    }
    
    return Math.max(0.3, Math.min(1.0, score));
  }

  private calculateSEOScore(content: GeneratedContent): number {
    let score = 0.7; // Base score
    
    // Check for SEO keywords
    if (content.seoKeywords && content.seoKeywords.length > 0) {
      score += 0.2;
      
      // Check if keywords are used in content
      const contentLower = content.content.toLowerCase();
      const keywordUsage = content.seoKeywords.filter(keyword => 
        contentLower.includes(keyword.toLowerCase())
      ).length;
      
      score += (keywordUsage / content.seoKeywords.length) * 0.1;
    }
    
    // Check for title optimization
    if (content.title && content.title.length >= 30 && content.title.length <= 60) {
      score += 0.1;
    }
    
    // Check for meta description (summary)
    if (content.summary && content.summary.length >= 120 && content.summary.length <= 160) {
      score += 0.1;
    }
    
    return Math.max(0.3, Math.min(1.0, score));
  }

  private calculateBrandAlignment(content: GeneratedContent): number {
    // Simulate brand alignment analysis
    // In a real implementation, this would check:
    // - Brand voice consistency
    // - Tone matching
    // - Messaging alignment
    // - Visual brand elements usage
    
    let score = 0.85; // Base good score
    
    // Check for professional tone indicators
    const professionalWords = ['professional', 'expertise', 'solution', 'innovative', 'quality'];
    const contentLower = content.content.toLowerCase();
    const professionalCount = professionalWords.filter(word => 
      contentLower.includes(word)
    ).length;
    
    score += (professionalCount / professionalWords.length) * 0.1;
    
    // Penalize overly casual language
    const casualWords = ['awesome', 'cool', 'dude', 'totally'];
    const casualCount = casualWords.filter(word => 
      contentLower.includes(word)
    ).length;
    
    score -= casualCount * 0.1;
    
    return Math.max(0.3, Math.min(1.0, score));
  }

  private calculateOriginality(content: GeneratedContent): number {
    // Simulate originality analysis
    // In a real implementation, this would check for:
    // - Plagiarism detection
    // - Content uniqueness
    // - Creative elements
    
    // For now, return a high score since we're generating original content
    return 0.95;
  }

  private generateRecommendations(overall: number, readability: number, seo: number, brandAlignment: number, originality: number): string[] {
    const recommendations: string[] = [];
    
    if (readability < 0.6) {
      recommendations.push('Improve readability by using shorter sentences and simpler words');
    }
    
    if (seo < 0.7) {
      recommendations.push('Optimize SEO by adding more relevant keywords and improving meta descriptions');
    }
    
    if (brandAlignment < 0.8) {
      recommendations.push('Ensure content aligns better with brand voice and messaging guidelines');
    }
    
    if (originality < 0.9) {
      recommendations.push('Add more unique insights and original perspectives');
    }
    
    if (overall >= 0.9) {
      recommendations.push('Excellent quality! Content is ready for publication');
    } else if (overall >= 0.8) {
      recommendations.push('Good quality content with minor improvements needed');
    } else {
      recommendations.push('Content needs significant improvement before publication');
    }
    
    return recommendations;
  }
}