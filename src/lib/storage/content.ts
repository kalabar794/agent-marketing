import { GeneratedContent, QualityScores } from '@/types/content';

export class ContentStorage {
  private storage: Map<string, any> = new Map();
  
  constructor() {
    // Initialize in-memory storage
    // In production, this would connect to a database
  }

  public async saveAgentOutput(workflowId: string, agentId: string, result: any): Promise<void> {
    const key = `${workflowId}_agent_${agentId}`;
    this.storage.set(key, {
      workflowId,
      agentId,
      result,
      timestamp: new Date(),
      type: 'agent_output'
    });
  }

  public async getAgentOutput(workflowId: string, agentId: string): Promise<any> {
    const key = `${workflowId}_agent_${agentId}`;
    return this.storage.get(key)?.result;
  }

  public async saveFinalContent(workflowId: string, content: GeneratedContent): Promise<void> {
    const key = `${workflowId}_final_content`;
    this.storage.set(key, {
      workflowId,
      content,
      timestamp: new Date(),
      type: 'final_content'
    });
  }

  public async getFinalContent(workflowId: string): Promise<GeneratedContent | null> {
    const key = `${workflowId}_final_content`;
    return this.storage.get(key)?.content || null;
  }

  public async saveQualityReport(workflowId: string, scores: QualityScores): Promise<void> {
    const key = `${workflowId}_quality_report`;
    this.storage.set(key, {
      workflowId,
      scores,
      timestamp: new Date(),
      type: 'quality_report'
    });
  }

  public async getQualityReport(workflowId: string): Promise<QualityScores | null> {
    const key = `${workflowId}_quality_report`;
    return this.storage.get(key)?.scores || null;
  }

  public async saveApproval(workflowId: string, approvalData: any): Promise<void> {
    const key = `${workflowId}_approval`;
    this.storage.set(key, {
      workflowId,
      approvalData,
      timestamp: new Date(),
      type: 'approval'
    });
  }

  public async getApproval(workflowId: string): Promise<any> {
    const key = `${workflowId}_approval`;
    return this.storage.get(key)?.approvalData || null;
  }

  public async saveRevisionRequest(workflowId: string, revisionData: any): Promise<void> {
    const key = `${workflowId}_revision`;
    this.storage.set(key, {
      workflowId,
      revisionData,
      timestamp: new Date(),
      type: 'revision_request'
    });
  }

  public async getRevisionRequest(workflowId: string): Promise<any> {
    const key = `${workflowId}_revision`;
    return this.storage.get(key)?.revisionData || null;
  }

  public async getAllWorkflowData(workflowId: string): Promise<any> {
    const workflowData: any = {
      agentOutputs: {},
      finalContent: null,
      qualityReport: null,
      approval: null,
      revisionRequest: null
    };

    // Collect all data for this workflow
    for (const [key, value] of this.storage.entries()) {
      if (key.startsWith(workflowId)) {
        switch (value.type) {
          case 'agent_output':
            workflowData.agentOutputs[value.agentId] = value.result;
            break;
          case 'final_content':
            workflowData.finalContent = value.content;
            break;
          case 'quality_report':
            workflowData.qualityReport = value.scores;
            break;
          case 'approval':
            workflowData.approval = value.approvalData;
            break;
          case 'revision_request':
            workflowData.revisionRequest = value.revisionData;
            break;
        }
      }
    }

    return workflowData;
  }

  public async deleteWorkflowData(workflowId: string): Promise<void> {
    const keysToDelete = Array.from(this.storage.keys()).filter(key => 
      key.startsWith(workflowId)
    );
    
    keysToDelete.forEach(key => this.storage.delete(key));
  }

  public async getWorkflowHistory(): Promise<string[]> {
    const workflowIds = new Set<string>();
    
    for (const key of this.storage.keys()) {
      const workflowId = key.split('_')[0];
      workflowIds.add(workflowId);
    }
    
    return Array.from(workflowIds);
  }
}