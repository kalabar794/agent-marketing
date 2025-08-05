// Job Storage - handles both Netlify Blobs and fallback storage
import { NetlifyBlobsStorage } from './netlify-blobs-storage';

interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  progress: number;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt?: string;
}

// In-memory fallback for development/when Netlify Blobs isn't available
const memoryStorage = new Map<string, JobStatus>();

export class JobStorage {
  private useBlobs: boolean = false;
  private blobsStorage?: NetlifyBlobsStorage;

  constructor() {
    // Try to use Netlify Blobs if available
    try {
      // Check if we're in a Netlify environment
      if (process.env.NETLIFY_SITE_ID || process.env.NODE_ENV === 'production') {
        this.blobsStorage = new NetlifyBlobsStorage();
        this.useBlobs = true;
        console.log('🗄️ Using Netlify Blobs for job storage');
      } else {
        console.log('🗄️ Using memory storage for job status (development mode)');
      }
    } catch (error) {
      console.warn('Failed to initialize Netlify Blobs, falling back to memory storage:', error);
      this.useBlobs = false;
    }
  }

  async saveJobStatus(jobId: string, status: JobStatus): Promise<void> {
    if (this.useBlobs && this.blobsStorage) {
      try {
        await this.blobsStorage.saveJobStatus(jobId, status);
        return;
      } catch (error) {
        console.warn('Failed to save to Netlify Blobs, falling back to memory:', error);
        // Fall through to memory storage
      }
    }
    
    // Memory storage fallback
    memoryStorage.set(jobId, status);
    console.log(`[Memory Storage] Saved job ${jobId}:`, status.status);
  }

  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    if (this.useBlobs && this.blobsStorage) {
      try {
        const result = await this.blobsStorage.getJobStatus(jobId);
        if (result) return result;
      } catch (error) {
        console.warn('Failed to get from Netlify Blobs, falling back to memory:', error);
        // Fall through to memory storage
      }
    }
    
    // Memory storage fallback
    return memoryStorage.get(jobId) || null;
  }

  async updateJobStatus(jobId: string, updates: Partial<JobStatus>): Promise<void> {
    const existing = await this.getJobStatus(jobId);
    if (!existing) {
      console.warn(`Job ${jobId} not found for update`);
      return;
    }

    const updated: JobStatus = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveJobStatus(jobId, updated);
  }

  async deleteJobStatus(jobId: string): Promise<void> {
    if (this.useBlobs && this.blobsStorage) {
      try {
        await this.blobsStorage.deleteJobStatus(jobId);
        return;
      } catch (error) {
        console.warn('Failed to delete from Netlify Blobs, falling back to memory:', error);
        // Fall through to memory storage
      }
    }
    
    // Memory storage fallback
    memoryStorage.delete(jobId);
    console.log(`[Memory Storage] Deleted job ${jobId}`);
  }
}

// Singleton instance
let jobStorageInstance: JobStorage | null = null;

export function getJobStorage(): JobStorage {
  if (!jobStorageInstance) {
    jobStorageInstance = new JobStorage();
  }
  return jobStorageInstance;
}