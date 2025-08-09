// Simple JavaScript wrapper for job storage
// This avoids TypeScript import issues in Netlify Functions

const { getStore } = require('@netlify/blobs'); // Using getStore correctly

class SimpleJobStorage {
  constructor() {
    this.useBlobs = false;
    this.memoryStorage = new Map();
    
    try {
      // Try to initialize Netlify Blobs
      this.store = getStore('marketing-agent-storage');
      this.useBlobs = true;
      console.log('📦 Using Netlify Blobs for job storage');
    } catch (error) {
      console.warn('⚠️ Failed to initialize Netlify Blobs, using memory storage:', error.message);
      this.useBlobs = false;
    }
  }

  async saveJobStatus(jobId, statusData) {
    const data = {
      jobId,
      ...statusData,
      updatedAt: new Date().toISOString(),
      type: 'job_status'
    };

    console.log(`💾 Attempting to save job ${jobId} with useBlobs=${this.useBlobs}`);

    if (this.useBlobs && this.store) {
      try {
        const key = `job_${jobId}_status`;
        await this.store.set(key, JSON.stringify(data));
        console.log(`✅ [Netlify Blobs] Saved job status for ${jobId}:`, statusData.status);
        return;
      } catch (error) {
        console.error('❌ Failed to save to Netlify Blobs:', error);
        this.useBlobs = false; // Disable for future attempts
      }
    }

    // Fallback to memory storage
    this.memoryStorage.set(jobId, data);
    console.log(`⚠️ [Memory Storage] Saved job ${jobId}:`, statusData.status, 'NOTE: Memory storage not persistent!');
  }

  async getJobStatus(jobId) {
    console.log(`🔍 Looking for job ${jobId} with useBlobs=${this.useBlobs}`);
    
    if (this.useBlobs && this.store) {
      try {
        const key = `job_${jobId}_status`;
        const data = await this.store.get(key);
        if (data) {
          console.log(`✅ [Netlify Blobs] Found job ${jobId}`);
          return JSON.parse(data);
        } else {
          console.log(`❌ [Netlify Blobs] Job ${jobId} not found in blobs`);
        }
      } catch (error) {
        console.error('❌ Failed to get from Netlify Blobs:', error);
        this.useBlobs = false;
      }
    }

    // Fallback to memory storage
    const memoryResult = this.memoryStorage.get(jobId) || null;
    console.log(`🔍 [Memory Storage] Job ${jobId}:`, memoryResult ? 'FOUND' : 'NOT FOUND');
    return memoryResult;
  }

  async updateJobStatus(jobId, statusUpdate) {
    const currentStatus = await this.getJobStatus(jobId);
    if (!currentStatus) {
      console.warn(`⚠️ Job ${jobId} not found for update`);
      return;
    }

    const updatedStatus = {
      ...currentStatus,
      ...statusUpdate,
      updatedAt: new Date().toISOString()
    };

    await this.saveJobStatus(jobId, updatedStatus);
  }
}

// Singleton instance
let jobStorageInstance = null;

function getJobStorage() {
  if (!jobStorageInstance) {
    jobStorageInstance = new SimpleJobStorage();
  }
  return jobStorageInstance;
}

module.exports = { getJobStorage };