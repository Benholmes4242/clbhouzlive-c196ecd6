/**
 * Review Upload Manager - Singleton for managing review media uploads
 * 
 * Features:
 * - Background upload processing that survives component unmount
 * - Progress tracking with speed/ETA
 * - Retry logic with exponential backoff
 * - State persistence to localStorage
 * - Event-based status updates
 */

import { nanoid } from 'nanoid';

// ============================================
// TYPES
// ============================================

export type ReviewUploadStatus = 
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'attached';

export interface ReviewUploadProgress {
  loaded: number;
  total: number;
  percent: number;
  speed?: number;
  eta?: number;
}

export interface ReviewMediaUpload {
  id: string;
  sessionId: string;
  userId: string;
  file: File;
  type: 'image' | 'video';
  status: ReviewUploadStatus;
  progress: ReviewUploadProgress;
  previewUrl: string;
  uploadedUrl: string | null;
  streamId: string | null;
  posterUrl: string | null;
  dbRowId: string | null;
  error: string | null;
  retryCount: number;
  createdAt: number;
  // Dimensions
  width?: number;
  height?: number;
  orientation?: 'portrait' | 'landscape' | 'square';
  durationSeconds?: number;
}

export interface ReviewUploadJob {
  sessionId: string;
  userId: string;
  reviewId: string | null; // null until review is submitted
  courseId: string;
  uploads: ReviewMediaUpload[];
  status: 'uploading' | 'complete' | 'partial' | 'failed';
  createdAt: number;
}

type EventType = 
  | 'upload:start'
  | 'upload:progress'
  | 'upload:complete'
  | 'upload:failed'
  | 'upload:retry'
  | 'session:complete'
  | 'session:partial';

interface UploadEvent {
  type: EventType;
  uploadId?: string;
  sessionId: string;
  progress?: ReviewUploadProgress;
  error?: string;
}

type EventHandler = (event: UploadEvent) => void;

// ============================================
// CONSTANTS
// ============================================

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
const CONCURRENT_UPLOADS = 2;
const STORAGE_KEY = 'clbhouz_review_uploads';

// ============================================
// MANAGER CLASS
// ============================================

class ReviewUploadManagerClass {
  private sessions: Map<string, ReviewUploadJob> = new Map();
  private uploading: Set<string> = new Set();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    this.restoreFromStorage();
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Create a new upload session for a review
   */
  createSession(userId: string, courseId: string): string {
    const sessionId = nanoid(12);
    
    const job: ReviewUploadJob = {
      sessionId,
      userId,
      courseId,
      reviewId: null,
      uploads: [],
      status: 'uploading',
      createdAt: Date.now(),
    };

    this.sessions.set(sessionId, job);
    this.persistToStorage();
    
    console.log('[ReviewUploadManager] Created session:', sessionId);
    return sessionId;
  }

  /**
   * Add a file to an upload session
   * Returns immediately - upload happens in background
   */
  addUpload(sessionId: string, file: File): ReviewMediaUpload | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('[ReviewUploadManager] Session not found:', sessionId);
      return null;
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const previewUrl = URL.createObjectURL(file);
    
    const upload: ReviewMediaUpload = {
      id: nanoid(12),
      sessionId,
      userId: session.userId,
      file,
      type,
      status: 'queued',
      progress: { loaded: 0, total: file.size, percent: 0 },
      previewUrl,
      uploadedUrl: null,
      streamId: null,
      posterUrl: null,
      dbRowId: null,
      error: null,
      retryCount: 0,
      createdAt: Date.now(),
    };

    session.uploads.push(upload);
    this.persistToStorage();

    // Start processing queue
    this.processQueue(sessionId);

    console.log('[ReviewUploadManager] Added upload:', upload.id, file.name);
    return upload;
  }

  /**
   * Get all uploads for a session
   */
  getSessionUploads(sessionId: string): ReviewMediaUpload[] {
    return this.sessions.get(sessionId)?.uploads || [];
  }

  /**
   * Get a specific upload by ID
   */
  getUpload(uploadId: string): ReviewMediaUpload | undefined {
    for (const session of this.sessions.values()) {
      const upload = session.uploads.find(u => u.id === uploadId);
      if (upload) return upload;
    }
    return undefined;
  }

  /**
   * Remove an upload from a session
   */
  async removeUpload(uploadId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      const index = session.uploads.findIndex(u => u.id === uploadId);
      if (index !== -1) {
        const upload = session.uploads[index];
        
        // Cancel if in progress
        this.abortControllers.get(uploadId)?.abort();
        this.abortControllers.delete(uploadId);
        this.uploading.delete(uploadId);

        // Cleanup preview URL
        if (upload.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(upload.previewUrl);
        }

        // Cleanup DB row if exists
        if (upload.dbRowId) {
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase.from('course_review_media').delete().eq('id', upload.dbRowId);
        }

        // Cleanup stream asset if exists
        if (upload.streamId) {
          const { edgePost } = await import('@/utils/callEdge');
          await edgePost('delete-review-video', { streamId: upload.streamId }).catch(() => {});
        }

        session.uploads.splice(index, 1);
        this.persistToStorage();
        
        console.log('[ReviewUploadManager] Removed upload:', uploadId);
        return;
      }
    }
  }

  /**
   * Retry a failed upload
   */
  retryUpload(uploadId: string): void {
    const upload = this.getUpload(uploadId);
    if (!upload || upload.status !== 'failed') return;

    upload.status = 'queued';
    upload.error = null;
    upload.retryCount++;
    this.persistToStorage();

    this.processQueue(upload.sessionId);

    this.emit({
      type: 'upload:retry',
      uploadId,
      sessionId: upload.sessionId,
    });
  }

  /**
   * Cancel all uploads for a session and cleanup
   */
  async cancelSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log('[ReviewUploadManager] Cancelling session:', sessionId);

    // Abort all in-progress uploads
    for (const upload of session.uploads) {
      this.abortControllers.get(upload.id)?.abort();
      this.abortControllers.delete(upload.id);
      this.uploading.delete(upload.id);

      // Cleanup preview URLs
      if (upload.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(upload.previewUrl);
      }
    }

    // Cleanup pending DB rows
    const dbRowIds = session.uploads
      .filter(u => u.dbRowId && u.status !== 'attached')
      .map(u => u.dbRowId as string);

    if (dbRowIds.length > 0) {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('course_review_media').delete().in('id', dbRowIds);
    }

    // Cleanup stream assets
    const streamIds = session.uploads
      .filter(u => u.streamId && u.status !== 'attached')
      .map(u => u.streamId as string);

    if (streamIds.length > 0) {
      const { edgePost } = await import('@/utils/callEdge');
      for (const streamId of streamIds) {
        await edgePost('delete-review-video', { streamId }).catch(() => {});
      }
    }

    this.sessions.delete(sessionId);
    this.persistToStorage();
  }

  /**
   * Attach all completed uploads to a review
   */
  async attachToReview(sessionId: string, reviewId: string): Promise<{ attached: number; pending: number; failed: number }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { attached: 0, pending: 0, failed: 0 };
    }

    session.reviewId = reviewId;

    const ready = session.uploads.filter(u => u.status === 'ready' && u.dbRowId);
    const pending = session.uploads.filter(u => u.status === 'queued' || u.status === 'uploading' || u.status === 'processing');
    const failed = session.uploads.filter(u => u.status === 'failed');

    if (ready.length > 0) {
      const { supabase } = await import('@/integrations/supabase/client');
      const dbRowIds = ready.map(u => u.dbRowId as string);

      const { error } = await supabase
        .from('course_review_media')
        .update({ review_id: reviewId, status: 'attached' } as any)
        .in('id', dbRowIds);

      if (!error) {
        ready.forEach(u => { u.status = 'attached'; });
        this.persistToStorage();
      }
    }

    console.log('[ReviewUploadManager] Attached to review:', {
      reviewId,
      attached: ready.length,
      pending: pending.length,
      failed: failed.length,
    });

    return {
      attached: ready.length,
      pending: pending.length,
      failed: failed.length,
    };
  }

  /**
   * Check if session has any in-progress uploads
   */
  hasUploadsInProgress(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    return session.uploads.some(u => 
      u.status === 'queued' || u.status === 'uploading' || u.status === 'processing'
    );
  }

  /**
   * Get session status summary
   */
  getSessionStatus(sessionId: string): { 
    total: number; 
    ready: number; 
    uploading: number; 
    failed: number;
    overallPercent: number;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) return { total: 0, ready: 0, uploading: 0, failed: 0, overallPercent: 0 };

    const uploads = session.uploads;
    const ready = uploads.filter(u => u.status === 'ready' || u.status === 'attached').length;
    const uploading = uploads.filter(u => u.status === 'queued' || u.status === 'uploading' || u.status === 'processing').length;
    const failed = uploads.filter(u => u.status === 'failed').length;

    // Calculate overall progress
    let totalBytes = 0;
    let loadedBytes = 0;
    for (const u of uploads) {
      totalBytes += u.progress.total;
      loadedBytes += u.status === 'ready' || u.status === 'attached' 
        ? u.progress.total 
        : u.progress.loaded;
    }
    const overallPercent = totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0;

    return { total: uploads.length, ready, uploading, failed, overallPercent };
  }

  // ============================================
  // EVENT SYSTEM
  // ============================================

  subscribe(sessionId: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(sessionId)) {
      this.eventHandlers.set(sessionId, new Set());
    }
    this.eventHandlers.get(sessionId)!.add(handler);

    return () => {
      this.eventHandlers.get(sessionId)?.delete(handler);
    };
  }

  private emit(event: UploadEvent): void {
    const handlers = this.eventHandlers.get(event.sessionId);
    if (handlers) {
      handlers.forEach(h => h(event));
    }
  }

  // ============================================
  // UPLOAD PROCESSING
  // ============================================

  private async processQueue(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Get queued uploads that aren't already being processed
    const queued = session.uploads.filter(u => 
      u.status === 'queued' && !this.uploading.has(u.id)
    );

    // Limit concurrent uploads
    const available = CONCURRENT_UPLOADS - this.uploading.size;
    const toProcess = queued.slice(0, available);

    for (const upload of toProcess) {
      this.processUpload(upload);
    }
  }

  private async processUpload(upload: ReviewMediaUpload): Promise<void> {
    if (this.uploading.has(upload.id)) return;
    this.uploading.add(upload.id);

    const abortController = new AbortController();
    this.abortControllers.set(upload.id, abortController);

    try {
      upload.status = 'uploading';
      this.persistToStorage();

      this.emit({
        type: 'upload:start',
        uploadId: upload.id,
        sessionId: upload.sessionId,
      });

      if (upload.type === 'video') {
        await this.uploadVideo(upload, abortController.signal);
      } else {
        await this.uploadImage(upload, abortController.signal);
      }

      upload.status = 'ready';
      upload.progress.percent = 100;
      upload.progress.loaded = upload.progress.total;
      this.persistToStorage();

      this.emit({
        type: 'upload:complete',
        uploadId: upload.id,
        sessionId: upload.sessionId,
      });

      console.log('[ReviewUploadManager] Upload complete:', upload.id);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[ReviewUploadManager] Upload cancelled:', upload.id);
        return;
      }

      console.error('[ReviewUploadManager] Upload failed:', upload.id, error);

      // Retry logic
      if (upload.retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[upload.retryCount] || 4000;
        upload.retryCount++;
        upload.status = 'queued';
        this.persistToStorage();

        setTimeout(() => {
          this.uploading.delete(upload.id);
          this.processQueue(upload.sessionId);
        }, delay);

        return;
      }

      upload.status = 'failed';
      upload.error = error.message || 'Upload failed';
      this.persistToStorage();

      this.emit({
        type: 'upload:failed',
        uploadId: upload.id,
        sessionId: upload.sessionId,
        error: upload.error,
      });

    } finally {
      this.uploading.delete(upload.id);
      this.abortControllers.delete(upload.id);
      
      // Process next in queue
      this.processQueue(upload.sessionId);

      // Check if session is complete
      this.checkSessionComplete(upload.sessionId);
    }
  }

  private async uploadVideo(upload: ReviewMediaUpload, signal: AbortSignal): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { edgePost } = await import('@/utils/callEdge');
    const { generateStreamThumbnailUrl, generateStreamHlsUrl } = await import('@/config/cloudflareStream');

    // Step 1: Get direct upload URL
    const directUploadResult = await edgePost('cloudflare-stream-upload', {
      fileName: upload.file.name,
      fileSize: upload.file.size,
    });

    if (!directUploadResult?.uploadURL || !directUploadResult?.uid) {
      throw new Error('Failed to get upload URL from Cloudflare Stream');
    }

    const { uploadURL, uid: streamId } = directUploadResult;
    upload.streamId = streamId;

    // Step 2: Upload with progress tracking using XHR
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = elapsed > 0 ? e.loaded / elapsed : 0;
          const remaining = e.total - e.loaded;
          const eta = speed > 0 ? remaining / speed : undefined;

          upload.progress = {
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
            speed,
            eta,
          };

          this.emit({
            type: 'upload:progress',
            uploadId: upload.id,
            sessionId: upload.sessionId,
            progress: upload.progress,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));

      signal.addEventListener('abort', () => xhr.abort());

      const formData = new FormData();
      formData.append('file', upload.file);

      xhr.open('POST', uploadURL);
      xhr.send(formData);
    });

    // Step 3: Generate URLs
    upload.posterUrl = generateStreamThumbnailUrl(streamId);
    upload.uploadedUrl = generateStreamHlsUrl(streamId);

    // Step 4: Create DB row
    const session = this.sessions.get(upload.sessionId)!;
    const { data: dbRow } = await supabase
      .from('course_review_media')
      .insert({
        review_id: session.reviewId,
        media_url: upload.uploadedUrl,
        media_type: 'video',
        stream_id: streamId,
        poster_url: upload.posterUrl,
        file_name: upload.file.name,
        file_size: upload.file.size,
        status: session.reviewId ? 'attached' : 'pending',
        upload_session_id: upload.sessionId,
        owner_user_id: upload.userId,
      } as any)
      .select('id')
      .single();

    upload.dbRowId = dbRow?.id || null;
  }

  private async uploadImage(upload: ReviewMediaUpload, signal: AbortSignal): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');

    // Get dimensions
    const dimensions = await this.getImageDimensions(upload.file);
    if (dimensions) {
      upload.width = dimensions.width;
      upload.height = dimensions.height;
      upload.orientation = dimensions.orientation;
    }

    // Upload to R2 with progress
    const { uploadToCloudflareR2WithProgress } = await import('./uploadWithProgress');
    const fileName = `${upload.userId}-${Date.now()}-${Math.random().toString(36).substring(2)}-${upload.file.name}`;

    const result = await uploadToCloudflareR2WithProgress(
      upload.file,
      'clbhouz-review-images',
      fileName,
      signal,
      (progress) => {
        upload.progress = progress;
        this.emit({
          type: 'upload:progress',
          uploadId: upload.id,
          sessionId: upload.sessionId,
          progress,
        });
      }
    );

    if (!result.success || !result.publicUrl) {
      throw new Error(result.error || 'Failed to upload image');
    }

    upload.uploadedUrl = result.publicUrl;

    // Create DB row
    const session = this.sessions.get(upload.sessionId)!;
    const insertData: Record<string, any> = {
      review_id: session.reviewId,
      media_url: result.publicUrl,
      media_type: 'image',
      file_name: upload.file.name,
      file_size: upload.file.size,
      status: session.reviewId ? 'attached' : 'pending',
      upload_session_id: upload.sessionId,
      owner_user_id: upload.userId,
    };

    if (dimensions) {
      insertData.width = dimensions.width;
      insertData.height = dimensions.height;
      insertData.aspect_ratio = parseFloat((dimensions.width / dimensions.height).toFixed(4));
      insertData.orientation = dimensions.orientation;
    }

    const { data: dbRow } = await supabase
      .from('course_review_media')
      .insert(insertData as any)
      .select('id')
      .single();

    upload.dbRowId = dbRow?.id || null;
  }

  private getImageDimensions(file: File): Promise<{ width: number; height: number; orientation: 'portrait' | 'landscape' | 'square' } | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const orientation = width === height ? 'square' : width > height ? 'landscape' : 'portrait';
        URL.revokeObjectURL(url);
        resolve({ width, height, orientation });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }

  private checkSessionComplete(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const hasUploading = session.uploads.some(u => 
      u.status === 'queued' || u.status === 'uploading' || u.status === 'processing'
    );

    if (!hasUploading) {
      const hasFailed = session.uploads.some(u => u.status === 'failed');
      
      if (hasFailed) {
        this.emit({ type: 'session:partial', sessionId });
      } else {
        this.emit({ type: 'session:complete', sessionId });
      }

      // If review was already attached, update any newly completed uploads
      if (session.reviewId) {
        const ready = session.uploads.filter(u => u.status === 'ready' && u.dbRowId);
        if (ready.length > 0) {
          this.attachToReview(sessionId, session.reviewId);
        }
      }
    }
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  private persistToStorage(): void {
    try {
      const data: Record<string, any> = {};
      
      for (const [sessionId, session] of this.sessions) {
        data[sessionId] = {
          ...session,
          uploads: session.uploads.map(u => ({
            ...u,
            file: undefined, // Can't persist File objects
            previewUrl: undefined, // Can't persist blob URLs
          })),
        };
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[ReviewUploadManager] Failed to persist:', e);
    }
  }

  private restoreFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      for (const [sessionId, session] of Object.entries(data as Record<string, any>)) {
        // Mark any in-progress uploads as failed (files can't be restored)
        const uploads = (session.uploads || []).map((u: any) => ({
          ...u,
          file: null,
          previewUrl: '',
          status: ['queued', 'uploading', 'processing'].includes(u.status) ? 'failed' : u.status,
          error: ['queued', 'uploading', 'processing'].includes(u.status) 
            ? 'Upload interrupted - please retry' 
            : u.error,
        }));

        this.sessions.set(sessionId, {
          ...session,
          uploads,
        });
      }

      // Clean up old sessions (> 24 hours)
      const now = Date.now();
      for (const [sessionId, session] of this.sessions) {
        if (now - session.createdAt > 24 * 60 * 60 * 1000) {
          this.sessions.delete(sessionId);
        }
      }

      this.persistToStorage();
    } catch (e) {
      console.warn('[ReviewUploadManager] Failed to restore:', e);
    }
  }
}

// Export singleton
export const reviewUploadManager = new ReviewUploadManagerClass();
