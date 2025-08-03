import { NextRequest, NextResponse } from 'next/server';
import { EnhancedContentWorkflow } from '@/lib/enhanced-workflow';

// Force Node.js runtime
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds for quick polling

export async function GET(request: NextRequest) {
  try {
    // Set CORS headers for cross-origin requests
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json'
    });

    // Get system status
    const systemStatus = await getSystemStatus();
    
    // Get active workflows
    const workflowUpdates = await getActiveWorkflowUpdates();

    const response = {
      timestamp: new Date().toISOString(),
      systemStatus,
      workflowUpdates,
      connectionStatus: 'connected'
    };

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Status API error:', error);
    
    const errorResponse = {
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch status',
      connectionStatus: 'error',
      systemStatus: {
        api: { status: 'unknown', description: 'Status unavailable' },
        contentEngine: { status: 'unknown', description: 'Status unavailable' },
        storage: { status: 'unknown', description: 'Status unavailable' }
      },
      workflowUpdates: []
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
}

async function getSystemStatus() {
  try {
    // Get active workflow instances
    const activeWorkflows = EnhancedContentWorkflow.instances || new Map();
    const activeCount = activeWorkflows.size;
    
    // Calculate system health metrics
    let healthyCount = 0;
    let runningCount = 0;
    let failedCount = 0;

    for (const [id, workflow] of activeWorkflows) {
      try {
        const status = await workflow.getStatus();
        if (status.status === 'completed') healthyCount++;
        else if (status.status === 'running') runningCount++;
        else if (status.status === 'failed') failedCount++;
      } catch (error) {
        failedCount++;
      }
    }

    return {
      api: {
        status: 'healthy',
        description: 'All systems operational'
      },
      contentEngine: {
        status: 'healthy',
        description: `${activeCount} active workflows`,
        activeWorkflows: activeCount,
        runningWorkflows: runningCount
      },
      storage: {
        status: 'healthy',
        description: 'Storage available'
      },
      statistics: {
        totalActive: activeCount,
        running: runningCount,
        completed: healthyCount,
        failed: failedCount
      }
    };
  } catch (error) {
    console.error('Error getting system status:', error);
    return {
      api: {
        status: 'degraded',
        description: 'Limited functionality'
      },
      contentEngine: {
        status: 'unknown',
        description: 'Status unavailable'
      },
      storage: {
        status: 'unknown',
        description: 'Status unavailable'
      },
      statistics: {
        totalActive: 0,
        running: 0,
        completed: 0,
        failed: 0
      }
    };
  }
}

async function getActiveWorkflowUpdates() {
  try {
    const activeWorkflows = EnhancedContentWorkflow.instances || new Map();
    const updates = [];
    
    for (const [id, workflow] of activeWorkflows) {
      try {
        const status = await workflow.getStatus();
        
        // Only include workflows that are actively running or recently completed
        if (status.status === 'running' || 
            (status.status === 'completed' && status.endTime && 
             Date.now() - status.endTime.getTime() < 300000)) { // Last 5 minutes
          
          updates.push({
            id: status.id,
            status: status.status,
            progress: status.progress,
            currentAgent: status.currentAgent,
            startTime: status.startTime,
            endTime: status.endTime,
            agents: status.agents?.map(agent => ({
              agentId: agent.agentId,
              status: agent.status,
              progress: agent.progress
            })) || [],
            estimatedTimeRemaining: status.estimatedTimeRemaining
          });
        }
      } catch (error) {
        console.error(`Error getting status for workflow ${id}:`, error);
      }
    }
    
    return updates;
  } catch (error) {
    console.error('Error getting workflow updates:', error);
    return [];
  }
}