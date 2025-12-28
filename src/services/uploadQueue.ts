import { wardrobeAPI } from './api';

export interface UploadJob {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  itemId?: string;
  preview?: string;
}

type QueueListener = (jobs: UploadJob[]) => void;

class UploadQueueService {
  private queue: UploadJob[] = [];
  private isProcessing = false;
  private listeners: Set<QueueListener> = new Set();
  private concurrency = 2; // Process 2 uploads at a time
  private activeUploads = 0;

  /**
   * Subscribe to queue updates
   */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener([...this.queue]);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of queue changes
   */
  private notify() {
    const snapshot = [...this.queue];
    this.listeners.forEach(listener => listener(snapshot));
  }

  /**
   * Add files to the upload queue
   */
  addFiles(files: File[]): void {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`Skipping large file (>10MB): ${file.name}`);
        return false;
      }
      return true;
    });

    const newJobs: UploadJob[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending',
      progress: 0,
      preview: URL.createObjectURL(file),
    }));

    this.queue.push(...newJobs);
    this.notify();
    this.processQueue();
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.hasPendingJobs() || this.activeUploads > 0) {
      // Start new uploads up to concurrency limit
      while (this.activeUploads < this.concurrency && this.hasPendingJobs()) {
        const job = this.getNextPendingJob();
        if (job) {
          this.activeUploads++;
          this.processJob(job).finally(() => {
            this.activeUploads--;
          });
        }
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  private hasPendingJobs(): boolean {
    return this.queue.some(job => job.status === 'pending');
  }

  private getNextPendingJob(): UploadJob | undefined {
    return this.queue.find(job => job.status === 'pending');
  }

  /**
   * Process a single upload job
   */
  private async processJob(job: UploadJob): Promise<void> {
    try {
      // Update status to uploading
      this.updateJob(job.id, { status: 'uploading', progress: 10 });

      // Create FormData - only send image, let AI do the rest
      const formData = new FormData();
      formData.append('image', job.file);

      // Upload to backend
      this.updateJob(job.id, { progress: 30 });

      const response = await wardrobeAPI.addItem(formData);

      // Update to processing (AI is analyzing)
      this.updateJob(job.id, {
        status: 'processing',
        progress: 70,
        itemId: response.data?._id || response.data?.id
      });

      // Mark as completed
      this.updateJob(job.id, { status: 'completed', progress: 100 });

    } catch (error: any) {
      console.error(`Upload failed for ${job.file.name}:`, error);
      this.updateJob(job.id, {
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Upload failed',
      });
    }
  }

  /**
   * Update a job in the queue
   */
  private updateJob(id: string, updates: Partial<UploadJob>): void {
    const index = this.queue.findIndex(job => job.id === id);
    if (index !== -1) {
      this.queue[index] = { ...this.queue[index], ...updates };
      this.notify();
    }
  }

  /**
   * Retry a failed job
   */
  retryJob(id: string): void {
    this.updateJob(id, { status: 'pending', progress: 0, error: undefined });
    this.processQueue();
  }

  /**
   * Remove a job from the queue
   */
  removeJob(id: string): void {
    const job = this.queue.find(j => j.id === id);
    if (job?.preview) {
      URL.revokeObjectURL(job.preview);
    }
    this.queue = this.queue.filter(job => job.id !== id);
    this.notify();
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): void {
    this.queue.filter(job => job.status === 'completed').forEach(job => {
      if (job.preview) URL.revokeObjectURL(job.preview);
    });
    this.queue = this.queue.filter(job => job.status !== 'completed');
    this.notify();
  }

  /**
   * Get current queue state
   */
  getQueue(): UploadJob[] {
    return [...this.queue];
  }

  /**
   * Get queue stats
   */
  getStats(): { pending: number; uploading: number; completed: number; failed: number } {
    return {
      pending: this.queue.filter(j => j.status === 'pending').length,
      uploading: this.queue.filter(j => j.status === 'uploading' || j.status === 'processing').length,
      completed: this.queue.filter(j => j.status === 'completed').length,
      failed: this.queue.filter(j => j.status === 'failed').length,
    };
  }
}

// Singleton instance
export const uploadQueue = new UploadQueueService();
