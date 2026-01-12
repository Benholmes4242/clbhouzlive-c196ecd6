/**
 * IndexedDB storage for upload job persistence
 * Allows resuming uploads after page refresh or app close
 */

const DB_NAME = 'clbhouz_uploads';
const DB_VERSION = 1;
const STORE_NAME = 'upload_jobs';

export interface PersistedMediaItem {
  id: string;
  fileName: string;
  fileSize: number;
  mediaType: 'image' | 'video';
  uploadUrl?: string;           // TUS URL for video resume
  bytesUploaded: number;
  totalBytes: number;
  status: 'pending' | 'uploading' | 'complete' | 'failed';
  mediaUrl?: string;            // Final URL after complete
  thumbnailDataUrl?: string;    // Base64 thumbnail for preview
  errorMessage?: string;
  retryCount: number;
}

export interface PersistedPostData {
  content: string;
  actorType: string;
  actorId: string;
  visibility: string;
  categories: string[];
  badges: string[];
  courseId?: string;
  courseName?: string;
  scheduledAt?: string;
  studioEditsByIndex?: (Record<string, any> | null)[];
}

export interface PersistedUploadJob {
  id: string;
  postId: string;
  userId: string;
  mediaItems: PersistedMediaItem[];
  postData: PersistedPostData;
  createdAt: number;
  lastUpdatedAt: number;
  overallStatus: 'uploading' | 'paused' | 'failed' | 'complete';
  totalBytes: number;
  uploadedBytes: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Open or create the IndexedDB database
 */
async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[UploadDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('overallStatus', 'overallStatus', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Save or update an upload job
 */
export async function saveUploadJob(job: PersistedUploadJob): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put({
      ...job,
      lastUpdatedAt: Date.now()
    });

    request.onerror = () => {
      console.error('[UploadDB] Failed to save job:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Get an upload job by ID
 */
export async function getUploadJob(id: string): Promise<PersistedUploadJob | null> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => {
      console.error('[UploadDB] Failed to get job:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

/**
 * Get all incomplete upload jobs for a user
 */
export async function getIncompleteJobs(userId: string): Promise<PersistedUploadJob[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onerror = () => {
      console.error('[UploadDB] Failed to get incomplete jobs:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const jobs = (request.result || []) as PersistedUploadJob[];
      // Filter to only incomplete jobs (not complete, not too old)
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const incompleteJobs = jobs.filter(job => 
        job.overallStatus !== 'complete' &&
        job.createdAt > oneWeekAgo
      );
      resolve(incompleteJobs);
    };
  });
}

/**
 * Get all incomplete jobs regardless of user
 */
export async function getAllIncompleteJobs(): Promise<PersistedUploadJob[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('[UploadDB] Failed to get all jobs:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const jobs = (request.result || []) as PersistedUploadJob[];
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const incompleteJobs = jobs.filter(job => 
        job.overallStatus !== 'complete' &&
        job.createdAt > oneWeekAgo
      );
      resolve(incompleteJobs);
    };
  });
}

/**
 * Delete an upload job
 */
export async function deleteUploadJob(id: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      console.error('[UploadDB] Failed to delete job:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Update a specific media item within a job
 */
export async function updateMediaItemStatus(
  jobId: string,
  mediaItemId: string,
  updates: Partial<PersistedMediaItem>
): Promise<void> {
  const job = await getUploadJob(jobId);
  if (!job) {
    console.warn('[UploadDB] Job not found:', jobId);
    return;
  }

  const mediaIndex = job.mediaItems.findIndex(m => m.id === mediaItemId);
  if (mediaIndex === -1) {
    console.warn('[UploadDB] Media item not found:', mediaItemId);
    return;
  }

  job.mediaItems[mediaIndex] = {
    ...job.mediaItems[mediaIndex],
    ...updates
  };

  // Recalculate total uploaded bytes
  job.uploadedBytes = job.mediaItems.reduce((sum, m) => sum + m.bytesUploaded, 0);

  // Update overall status based on media items
  const statuses = job.mediaItems.map(m => m.status);
  if (statuses.every(s => s === 'complete')) {
    job.overallStatus = 'complete';
  } else if (statuses.some(s => s === 'failed') && !statuses.some(s => s === 'uploading')) {
    job.overallStatus = 'failed';
  } else if (statuses.some(s => s === 'uploading')) {
    job.overallStatus = 'uploading';
  }

  await saveUploadJob(job);
}

/**
 * Clean up old/stale jobs (older than 7 days)
 */
export async function cleanupStaleJobs(): Promise<number> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('[UploadDB] Failed to cleanup jobs:', request.error);
      reject(request.error);
    };

    request.onsuccess = async () => {
      const jobs = (request.result || []) as PersistedUploadJob[];
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const job of jobs) {
        if (job.createdAt < oneWeekAgo || job.overallStatus === 'complete') {
          await deleteUploadJob(job.id);
          deletedCount++;
        }
      }

      console.log(`[UploadDB] Cleaned up ${deletedCount} stale jobs`);
      resolve(deletedCount);
    };
  });
}

/**
 * Generate a thumbnail data URL from a file (for preview in recovery modal)
 */
export async function generateThumbnailDataUrl(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 100;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = () => resolve(undefined);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadeddata = () => {
        video.currentTime = 0.5; // Seek to 0.5s for thumbnail
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 100;
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, width, height);
        URL.revokeObjectURL(video.src);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(undefined);
      };
      
      video.src = URL.createObjectURL(file);
    } else {
      resolve(undefined);
    }
  });
}
