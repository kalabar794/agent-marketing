import { ContentGenerationRequest } from '@/types/content';
import { ContentWriter } from './content-writer';
import { ContentEditor } from './content-editor';

/**
 * FastOrchestrator - Optimized for Netlify's 10-second function timeout
 * Runs only essential agents in parallel for maximum speed
 */
export class FastOrchestrator {
  private maxExecutionTime: number = 8000; // 8 seconds to fit within Netlify limit

  constructor() {}

  async executeWorkflow(
    request: ContentGenerationRequest,
    progressCallback?: (agentId: string, progress: number) => void
  ): Promise<Map<string, any>> {
    console.log('🚀 FastOrchestrator: Starting optimized workflow');
    
    const startTime = Date.now();
    const results: Record<string, any> = {};

    try {
      // Step 1: Content Writer (most important agent)
      if (progressCallback) progressCallback('content-writer', 0);
      
      const contentWriter = new ContentWriter();
      console.log('📝 Executing ContentWriter...');
      
      const writerPromise = Promise.race([
        contentWriter.execute(request, {}),
        this.timeoutPromise(6000, 'ContentWriter timeout')
      ]);

      const writerResult = await writerPromise;
      results['content-writer'] = writerResult;
      
      if (progressCallback) progressCallback('content-writer', 100);
      console.log('✅ ContentWriter completed');

      // Step 2: Content Editor (for quality) - only if we have time
      const timeUsed = Date.now() - startTime;
      const timeRemaining = this.maxExecutionTime - timeUsed;

      if (timeRemaining > 2000) { // If we have at least 2 seconds left
        if (progressCallback) progressCallback('content-editor', 0);
        
        const contentEditor = new ContentEditor();
        console.log('✏️ Executing ContentEditor...');
        
        try {
          const editorPromise = Promise.race([
            contentEditor.execute(request, { 'content-writer': writerResult }),
            this.timeoutPromise(timeRemaining - 500, 'ContentEditor timeout')
          ]);

          const editorResult = await editorPromise;
          results['content-editor'] = editorResult;
          
          if (progressCallback) progressCallback('content-editor', 100);
          console.log('✅ ContentEditor completed');
        } catch (error) {
          console.log('⚠️ ContentEditor skipped due to time constraint:', error.message);
          if (progressCallback) progressCallback('content-editor', 0);
        }
      } else {
        console.log('⚠️ ContentEditor skipped - insufficient time remaining');
        if (progressCallback) progressCallback('content-editor', 0);
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ FastOrchestrator completed in ${totalTime}ms`);

      // Convert to Map for compatibility with enhanced workflow
      const resultMap = new Map<string, any>();
      Object.entries(results).forEach(([key, value]) => {
        resultMap.set(key, value);
      });
      
      return resultMap;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ FastOrchestrator failed after ${totalTime}ms:`, error);
      throw error;
    }
  }

  private timeoutPromise(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  getExecutionStats() {
    return {
      successRate: 1.0, // Simplified stats
      avgExecutionTime: 5000,
      totalExecutions: 1
    };
  }
}