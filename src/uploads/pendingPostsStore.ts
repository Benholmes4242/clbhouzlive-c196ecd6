// Pending posts store — Phase 2 optimistic UI.
//
// Holds in-flight post uploads so feeds can render an immediate
// author-only "your post is uploading" card before the real row exists.
//
// Lifecycle:
//   composer  → addPending(...)            (status: 'queued', preview blob URLs)
//   shell-created event → attachPostId      (status stays 'uploading')
//   file:progress events → updateProgress   (per-file %, aggregated)
//   upload:complete → schedule removal      (after microtask, belt-and-braces de-dupe in selector)
//   upload:failed → markFailed              (Retry button enabled)
//
// Filtering: selectors MUST filter on the FULL viewing identity (author actor
// AND viewer actor) so a business pending post doesn't leak into a personal
// profile view, and vice versa. useProfilePosts' real query key is
// ['profile-posts', actorType, actorId, viewerActorType, viewerActorId].

import { create } from 'zustand';

export type PendingMediaKind = 'image' | 'video';

export interface PendingMediaPreview {
  id: string;
  kind: PendingMediaKind;
  /** Object URL (blob:) — only valid while the entry exists in the store. */
  previewUrl: string;
}

export type PendingPostStatus = 'queued' | 'uploading' | 'failed';

export interface PendingPost {
  jobId: string;
  /**
   * Discriminator. Defaults to 'post' when omitted so every existing
   * addPending() call site keeps working unchanged. Review-v2 flushes
   * set kind:'review' so PendingPostCard branches strictly and the
   * post-only uploadManager/uploadPipeline retry paths stay unreachable
   * from review entries.
   */
  kind?: 'post' | 'review';
  /** Filled in by attachPostId() when post:shell-created fires. */
  postId: string | null;
  /** Present on review entries (the review DB row id). */
  reviewId?: string;

  // Author identity
  actorType: 'personal' | 'business';
  actorId: string;
  userId: string;

  // Viewing actor at enqueue time — used by the selector to scope visibility
  viewerActorType: 'personal' | 'business';
  viewerActorId: string;

  // Author display metadata (rendered on the pending card)
  authorName: string;
  authorAvatarUrl: string | null;
  authorUsername: string | null;

  // Content
  caption: string;
  media: PendingMediaPreview[];

  // Course tag (optional)
  courseId?: string;
  courseName?: string;

  // Progress
  totalFiles: number;
  /** Per-file 0–100 progress, keyed by media id. */
  fileProgress: Record<string, number>;

  status: PendingPostStatus;
  error?: string;

  /**
   * Original File[] kept for FULL re-enqueue on a totally-failed job
   * (post branch only). Review entries pass [] here — the review
   * pipeline owns its own File refs and retry runs through
   * reviewRetryRegistry, not UploadManager.
   */
  files: File[];

  createdAt: string;
}

interface PendingPostsState {
  byJobId: Record<string, PendingPost>;

  addPending: (entry: PendingPost) => void;
  attachPostId: (jobId: string, postId: string) => void;
  updateProgress: (jobId: string, fileId: string, percent: number) => void;
  markFailed: (jobId: string, error: string) => void;
  removeJob: (jobId: string) => void;
}

const revokeMediaBlobs = (entry: PendingPost | undefined) => {
  if (!entry) return;
  for (const m of entry.media) {
    try {
      if (m.previewUrl.startsWith('blob:')) URL.revokeObjectURL(m.previewUrl);
    } catch {
      // ignore
    }
  }
};

export const usePendingPostsStore = create<PendingPostsState>((set, get) => ({
  byJobId: {},

  addPending: (entry) =>
    set((s) => ({ byJobId: { ...s.byJobId, [entry.jobId]: entry } })),

  attachPostId: (jobId, postId) =>
    set((s) => {
      const cur = s.byJobId[jobId];
      if (!cur) return s;
      return {
        byJobId: {
          ...s.byJobId,
          [jobId]: { ...cur, postId, status: 'uploading' },
        },
      };
    }),

  updateProgress: (jobId, fileId, percent) =>
    set((s) => {
      const cur = s.byJobId[jobId];
      if (!cur) return s;
      const next: PendingPost = {
        ...cur,
        status: cur.status === 'failed' ? cur.status : 'uploading',
        fileProgress: { ...cur.fileProgress, [fileId]: Math.max(0, Math.min(100, percent)) },
      };
      return { byJobId: { ...s.byJobId, [jobId]: next } };
    }),

  markFailed: (jobId, error) =>
    set((s) => {
      const cur = s.byJobId[jobId];
      if (!cur) return s;
      return {
        byJobId: {
          ...s.byJobId,
          [jobId]: { ...cur, status: 'failed', error },
        },
      };
    }),

  removeJob: (jobId) => {
    const cur = get().byJobId[jobId];
    revokeMediaBlobs(cur);
    set((s) => {
      if (!s.byJobId[jobId]) return s;
      const { [jobId]: _gone, ...rest } = s.byJobId;
      return { byJobId: rest };
    });
  },
}));

/** Aggregate 0–100 across all files in a pending entry. */
export function aggregatePendingProgress(entry: PendingPost): number {
  if (entry.totalFiles <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < entry.totalFiles; i++) {
    // entries are keyed by media id; if a key is missing treat as 0
    sum += 0;
  }
  for (const v of Object.values(entry.fileProgress)) sum += v;
  return Math.round(sum / entry.totalFiles);
}
