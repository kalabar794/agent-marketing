import { getStore } from '@netlify/blobs';
import { GeneratedContent, QualityScores } from '@/types/content';

export class NetlifyBlobsStorage {
  private store: any;
  
  constructor() {
    // Initialize Netlify Blobs store with proper configuration
    try {
      // Try to get from environment first (works on Netlify production)
      this.store = getStore('marketing-agent-storage');
    } catch (error) {
      console.warn('Failed to initialize Netlify Blobs with automatic config, trying manual config:', error.message);
      
      // Manual configuration for development or when environment is not fully configured
      const siteId = process.env.NETLIFY_SITE_ID || '6b8802ee-ebc3-4d40-b769-2c0d7ba9425a';
      const token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
      
      if (siteId && token) {
        console.log('Using manual Netlify Blobs configuration');
        this.store = getStore('marketing-agent-storage', {
          siteID: siteId,
          token: token
        });
      } else {
        console.warn('Netlify Blobs not available - missing siteID or token. Storage operations will be disabled.');
        this.store = null;
      }
    }
  }

  public async saveAgentOutput(workflowId: string, agentId: string, result: any): Promise<void> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, skipping saveAgentOutput');
      return;
    }
    
    const key = `${workflowId}_agent_${agentId}`;
    const data = {
      workflowId,
      agentId,
      result,
      timestamp: new Date().toISOString(),
      type: 'agent_output'
    };
    
    await this.store.set(key, JSON.stringify(data));
  }

  public async getAgentOutput(workflowId: string, agentId: string): Promise<any> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, returning null for getAgentOutput');
      return null;
    }
    
    const key = `${workflowId}_agent_${agentId}`;
    try {
      const data = await this.store.get(key);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.result;
    } catch (error) {
      console.error(`Failed to get agent output for ${key}:`, error);
      return null;
    }
  }

  public async saveFinalContent(workflowId: string, content: GeneratedContent): Promise<void> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, skipping saveFinalContent');
      return;
    }
    
    const key = `${workflowId}_final_content`;
    const data = {
      workflowId,
      content,
      timestamp: new Date().toISOString(),
      type: 'final_content'
    };
    
    await this.store.set(key, JSON.stringify(data));
  }

  public async getFinalContent(workflowId: string): Promise<GeneratedContent | null> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, returning null for getFinalContent');
      return null;
    }
    
    const key = `${workflowId}_final_content`;
    try {
      const data = await this.store.get(key);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.content;
    } catch (error) {
      console.error(`Failed to get final content for ${key}:`, error);
      return null;
    }
  }

  public async saveQualityReport(workflowId: string, scores: QualityScores): Promise<void> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, skipping saveQualityReport');
      return;
    }
    
    const key = `${workflowId}_quality_report`;
    const data = {
      workflowId,
      scores,
      timestamp: new Date().toISOString(),
      type: 'quality_report'
    };
    
    await this.store.set(key, JSON.stringify(data));
  }

  public async getQualityReport(workflowId: string): Promise<QualityScores | null> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, returning null for getQualityReport');
      return null;
    }
    
    const key = `${workflowId}_quality_report`;
    try {
      const data = await this.store.get(key);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.scores;
    } catch (error) {
      console.error(`Failed to get quality report for ${key}:`, error);
      return null;
    }
  }

  public async saveApproval(workflowId: string, approvalData: any): Promise<void> {
    const key = `${workflowId}_approval`;
    const data = {
      workflowId,
      approvalData,
      timestamp: new Date().toISOString(),
      type: 'approval'
    };
    
    await this.store.set(key, JSON.stringify(data));
  }

  public async getApproval(workflowId: string): Promise<any> {
    const key = `${workflowId}_approval`;
    try {
      const data = await this.store.get(key);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.approvalData;
    } catch (error) {
      console.error(`Failed to get approval for ${key}:`, error);
      return null;
    }
  }

  public async saveRevisionRequest(workflowId: string, revisionData: any): Promise<void> {
    const key = `${workflowId}_revision`;
    const data = {
      workflowId,
      revisionData,
      timestamp: new Date().toISOString(),
      type: 'revision_request'
    };
    
    await this.store.set(key, JSON.stringify(data));
  }

  public async getRevisionRequest(workflowId: string): Promise<any> {
    const key = `${workflowId}_revision`;
    try {
      const data = await this.store.get(key);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.revisionData;
    } catch (error) {
      console.error(`Failed to get revision request for ${key}:`, error);
      return null;
    }
  }

  public async saveWorkflowStatus(workflowId: string, status: any): Promise<void> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, skipping saveWorkflowStatus');
      return;
    }
    
    const key = `${workflowId}_status`;
    const data = {
      workflowId,
      status,
      timestamp: new Date().toISOString(),
      type: 'workflow_status'
    };
    
    await this.store.set(key, JSON.stringify(data));
  }

  public async getWorkflowStatus(workflowId: string): Promise<any> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, returning null for getWorkflowStatus');
      return null;
    }
    
    const key = `${workflowId}_status`;
    try {
      const data = await this.store.get(key);
      if (!data) return null;
      const parsed = JSON.parse(data);
      
      // Convert ISO string dates back to Date objects
      if (parsed.status.startTime) {
        parsed.status.startTime = new Date(parsed.status.startTime);
      }
      if (parsed.status.endTime) {
        parsed.status.endTime = new Date(parsed.status.endTime);
      }
      
      return parsed.status;
    } catch (error) {
      console.error(`Failed to get workflow status for ${key}:`, error);
      return null;
    }
  }

  public async getAllWorkflowData(workflowId: string): Promise<any> {
    const workflowData: any = {
      agentOutputs: {},
      finalContent: null,
      qualityReport: null,
      approval: null,
      revisionRequest: null,
      status: null
    };

    if (!this.store) {
      console.warn('Netlify Blobs not available, returning empty workflow data');
      return workflowData;
    }

    try {
      // Get all keys with the workflow prefix
      const keys = [
        `${workflowId}_final_content`,
        `${workflowId}_quality_report`,
        `${workflowId}_approval`,
        `${workflowId}_revision`,
        `${workflowId}_status`
      ];

      // Get agent output keys (these vary by agent)
      const agentKeys = [
        `${workflowId}_agent_market-researcher`,
        `${workflowId}_agent_content-strategist`,
        `${workflowId}_agent_content-writer`,
        `${workflowId}_agent_ai-seo-optimizer`,
        `${workflowId}_agent_content-editor`,
        `${workflowId}_agent_social-media-specialist`,
        `${workflowId}_agent_landing-page-specialist`
      ];

      // Process all keys
      for (const key of [...keys, ...agentKeys]) {
        try {
          const data = await this.store.get(key);
          if (data) {
            const parsed = JSON.parse(data);
            
            switch (parsed.type) {
              case 'agent_output':
                workflowData.agentOutputs[parsed.agentId] = parsed.result;
                break;
              case 'final_content':
                workflowData.finalContent = parsed.content;
                break;
              case 'quality_report':
                workflowData.qualityReport = parsed.scores;
                break;
              case 'approval':
                workflowData.approval = parsed.approvalData;
                break;
              case 'revision_request':
                workflowData.revisionRequest = parsed.revisionData;
                break;
              case 'workflow_status':
                workflowData.status = parsed.status;
                break;
            }
          }
        } catch (error) {
          console.warn(`Failed to retrieve data for key ${key}:`, error);
        }
      }

      return workflowData;
    } catch (error) {
      console.error(`Failed to get workflow data for ${workflowId}:`, error);
      return workflowData;
    }
  }

  public async deleteWorkflowData(workflowId: string): Promise<void> {
    const keys = [
      `${workflowId}_final_content`,
      `${workflowId}_quality_report`,
      `${workflowId}_approval`,
      `${workflowId}_revision`,
      `${workflowId}_status`,
      // Agent output keys
      `${workflowId}_agent_market-researcher`,
      `${workflowId}_agent_content-strategist`,
      `${workflowId}_agent_content-writer`,
      `${workflowId}_agent_ai-seo-optimizer`,
      `${workflowId}_agent_content-editor`,
      `${workflowId}_agent_social-media-specialist`,
      `${workflowId}_agent_landing-page-specialist`
    ];

    for (const key of keys) {
      try {
        await this.store.delete(key);
      } catch (error) {
        console.warn(`Failed to delete key ${key}:`, error);
      }
    }
  }

  // Job status methods for background processing
  public async saveJobStatus(jobId: string, status: any): Promise<void> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, skipping saveJobStatus');
      return;
    }
    
    const key = `job_${jobId}_status`;
    const data = {
      jobId,
      ...status,
      updatedAt: new Date().toISOString(),
      type: 'job_status'
    };
    
    await this.store.set(key, JSON.stringify(data));
    console.log(`[Netlify Blobs] Saved job status for ${jobId}:`, status.status);
  }

  public async getJobStatus(jobId: string): Promise<any> {
    if (!this.store) {
      console.warn('Netlify Blobs not available, returning null for getJobStatus');
      return null;
    }
    
    const key = `job_${jobId}_status`;
    try {
      const data = await this.store.get(key);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      console.error(`Failed to get job status for ${jobId}:`, error);
      return null;
    }
  }

  public async updateJobStatus(jobId: string, updates: any): Promise<void> {
    const existing = await this.getJobStatus(jobId) || { jobId };
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveJobStatus(jobId, updated);
  }

  public async deleteJobStatus(jobId: string): Promise<void> {
    const key = `job_${jobId}_status`;
    try {
      await this.store.delete(key);
      console.log(`[Netlify Blobs] Deleted job status for ${jobId}`);
    } catch (error) {
      console.warn(`Failed to delete job status for ${jobId}:`, error);
    }
  }

  public async getWorkflowHistory(): Promise<string[]> {
    // Note: Netlify Blobs doesn't have a native list operation
    // This would need to be implemented differently, perhaps by maintaining
    // a separate index or using metadata storage
    console.warn('getWorkflowHistory not implemented for Netlify Blobs - requires index management');
    return [];
  }
}