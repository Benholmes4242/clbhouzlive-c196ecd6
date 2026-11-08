// useStageComposer - central state for the Stage composer.
//
// One reducer-esque state object; each surface (media stage, tray, caption,
// detail rows, sheets) reads/writes through this hook. Kept intentionally
// small - no orchestration or DB writes live here (see usePostSubmit +
// usePostUploadOrchestrator for those).

import { useCallback, useState } from 'react';
import { toast } from '@/lib/toast';
import { POST_LIMITS, formatDuration } from '@/constants/postLimits';
import type { ShotTagChoice } from '../lib/shotTagWrites';
import type { PostShotTag } from '../lib/composerGolfRules';
import { emptyVideoDetails, roundBoundVideoDetails, type VideoDetails } from '../lib/videoDetails';

// Probe a video File's duration (seconds). Resolves 0 if unreadable.
function probeVideoDuration(file: File, onDimensions?: (width: number, height: number) => void): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    const done = (d: number) => {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      resolve(d);
    };
    v.onloadedmetadata = () => { onDimensions?.(v.videoWidth, v.videoHeight); done(Number.isFinite(v.duration) ? v.duration : 0); };
    v.onerror = () => done(0);
    v.src = url;
  });
}

export type FrameId = 'original' | '4:5' | '1:1' | '9:16';

export interface StageMediaItem {
  id: string;
  /** Present for newly-picked items only. Existing (already-uploaded) items omit this. */
  file?: File;
  type: 'image' | 'video';
  previewUrl: string;
  naturalWidth?: number;
  naturalHeight?: number;
  duration?: number;
  // Edits held on the client until upload:
  frame: FrameId;
  crop?: { x: number; y: number; scale: number } | null;
  trimStart?: number | null;
  trimEnd?: number | null;
  posterTimestamp?: number | null;
  /** Set for items loaded from an existing post - the post_media.id. */
  existingId?: string;
  holeNo?: number | null;
  shotTag?: ShotTagChoice | null;
  studioEdits?: Record<string, unknown>;
  /** Cloudflare Stream uid for an already-uploaded video. The playable
   *  URL is built from this, never parsed back out of previewUrl. */
  streamId?: string | null;
  /** An ALREADY-UPLOADED poster for this item (post_media.poster_url). Set only
   *  on items hydrated from an existing post; newly-picked items extract their
   *  own frame from the local blob. When present it is used as-is and NO
   *  extraction is attempted — a remote video cannot be drawn to a canvas
   *  without tainting it. */
  posterUrl?: string | null;
  /** PF1 draft source: reuse storage, never pretend it is existing post media. */
  remoteUrl?: string;
  filterId?: string | null;
}

export interface StageCourse {
  id: string;
  name: string;
  country?: string | null;
  sub_country?: string | null;
  /** Course cover carried by sources; older draft/edit payloads hydrate by id. */
  thumbnail?: string | null;
}

export const MAX_MEDIA = 10;

export interface StageState {
  media: StageMediaItem[];
  activeIndex: number;
  caption: string;
  /**
   * Ordered list of tagged courses. The FIRST entry is the primary course
   * (written to posts.course_id as today). All entries (including the first)
   * are written to posts.tagged_course_ids in selection order.
   */
  courses: StageCourse[];
  /** Deprecated derived alias for the primary course; kept for consumers. */
  course: StageCourse | null;
  scheduledAt: Date | null;
  dirty: boolean;
  holeNo: number | null;
  postShotTags: PostShotTag[];
  attachedScoreId: string | null;
  addToGuide: boolean;
  videoData?: VideoDetails;

}

const emptyState: StageState = {
  media: [],
  activeIndex: 0,
  caption: '',
  courses: [],
  course: null,
  scheduledAt: null,
  dirty: false,
  holeNo: null,
  postShotTags: [],
  attachedScoreId: null,
  addToGuide: true,
  videoData: emptyVideoDetails(),

};

export function useStageComposer() {
  const [state, setState] = useState<StageState>(emptyState);

  // Blob URL revocation is NOT done here. A submitted item's previewUrl is
  // owned by pendingPostsStore (removeJob → revokeMediaBlobs, on upload
  // completion); removed items are revoked in removeMedia below. The former
  // unmount effect closed over the initial empty list and revoked nothing.

  const markDirty = (patch: Partial<StageState>) =>
    setState(s => ({ ...s, ...patch, dirty: true }));

  const addFiles = useCallback(async (files: File[]) => {
    const kept: File[] = [];
    const durations = new Map<File, number>();
    const dimensions = new Map<File, { naturalWidth: number; naturalHeight: number }>();
    for (const file of files) {
      if (file.type.startsWith('video/')) {
        const dur = await probeVideoDuration(file, (naturalWidth, naturalHeight) => dimensions.set(file, { naturalWidth, naturalHeight }));
        if (dur === 0) {
          toast.error("Couldn't read that video's length. Try a different file.");
          continue;
        }
        if (dur > POST_LIMITS.MAX_VIDEO_DURATION_SECONDS) {
          toast.error(`Video too long (${formatDuration(dur)}). Maximum is ${POST_LIMITS.MAX_VIDEO_DURATION_DISPLAY}.`);
          continue;
        }
        durations.set(file, dur);
      }
      kept.push(file);
    }
    if (kept.length === 0) return;
    setState(s => {
      const remaining = MAX_MEDIA - s.media.length;
      const accepted = kept.slice(0, Math.max(0, remaining));
      const newItems: StageMediaItem[] = accepted.map(file => {
        const isVideo = file.type.startsWith('video/');
        return {
          id: crypto.randomUUID(),
          file,
          type: isVideo ? 'video' : 'image',
          previewUrl: URL.createObjectURL(file),
          frame: 'original',
          crop: null,
          trimStart: null,
          trimEnd: null,
          posterTimestamp: null,
          ...(isVideo ? { duration: durations.get(file), ...dimensions.get(file) } : {}),
        };
      });
      return {
        ...s,
        media: [...s.media, ...newItems],
        activeIndex: s.media.length === 0 ? 0 : s.activeIndex,
        dirty: true,
      };
    });
  }, []);

  const removeAt = useCallback((idx: number) => {
    setState(s => {
      const removed = s.media[idx];
      if (removed?.previewUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(removed.previewUrl); } catch { /* ignore */ }
      }
      const media = s.media.filter((_, i) => i !== idx);
      const activeIndex = Math.max(0, Math.min(s.activeIndex, media.length - 1));
      return { ...s, media, activeIndex, dirty: true };
    });
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setState(s => {
      if (from === to) return s;
      const media = [...s.media];
      const [item] = media.splice(from, 1);
      media.splice(to, 0, item);
      return { ...s, media, activeIndex: to, dirty: true };
    });
  }, []);

  const setActiveIndex = useCallback((i: number) => {
    setState(s => ({ ...s, activeIndex: i }));
  }, []);

  const updateActive = useCallback((patch: Partial<StageMediaItem>) => {
    setState(s => {
      const media = s.media.map((m, i) => (i === s.activeIndex ? { ...m, ...patch } : m));
      return { ...s, media, dirty: true };
    });
  }, []);

  const setCaption = useCallback((v: string) => markDirty({ caption: v }), []);
  const setVideoData = useCallback((patch: Partial<VideoDetails>) => {
    setState(s => ({ ...s, videoData: { ...(s.videoData ?? emptyVideoDetails()), ...patch }, dirty: true }));
  }, []);
  const setCourse = useCallback((c: StageCourse | null) => {
    // Single-course setter: replaces the whole list with [c] (or clears).
    const courses = c ? [c] : [];
    setState(s => ({
      ...s,
      courses,
      course: courses[0] ?? null,
      holeNo: s.course?.id===c?.id ? s.holeNo : null,
      attachedScoreId: s.course?.id===c?.id ? s.attachedScoreId : null,
      videoData: s.course?.id===c?.id ? s.videoData : roundBoundVideoDetails(s.videoData ?? emptyVideoDetails(), null),
      dirty: true,
    }));
  }, []);
  const setCourses = useCallback((cs: StageCourse[]) => {
    setState(s => ({
      ...s,
      courses: cs,
      course: cs[0] ?? null,
      holeNo: s.course?.id===cs[0]?.id ? s.holeNo : null,
      attachedScoreId: s.course?.id===cs[0]?.id ? s.attachedScoreId : null,
      videoData: s.course?.id===cs[0]?.id ? s.videoData : roundBoundVideoDetails(s.videoData ?? emptyVideoDetails(), null),
      dirty: true,
    }));
  }, []);

  const setScheduledAt = useCallback((d: Date | null) => markDirty({ scheduledAt: d }), []);
  const setGolf = useCallback((patch:Pick<Partial<StageState>,'holeNo'|'postShotTags'|'attachedScoreId'|'addToGuide'>) => setState(s => ({ ...s, ...patch, videoData: 'attachedScoreId' in patch && patch.attachedScoreId !== s.attachedScoreId ? roundBoundVideoDetails(s.videoData ?? emptyVideoDetails(), patch.attachedScoreId ?? null) : s.videoData, dirty: true })),[]);

  const restoreDraft = useCallback((patch: Partial<StageState>) => {
    setState(s => {
      const next = { ...s, ...patch, dirty: false };
      next.videoData = roundBoundVideoDetails(next.videoData ?? emptyVideoDetails(), next.attachedScoreId);
      // Keep derived alias in sync if only one side was patched.
      if (patch.courses && !patch.course) next.course = patch.courses[0] ?? null;
      else if (patch.course && !patch.courses) next.courses = patch.course ? [patch.course] : [];
      return next;
    });
  }, []);

  /**
   * Hydrate the composer for edit mode: seed caption/course/media without
   * flipping `dirty`. Called once on mount when editPostId is set.
   */
  const hydrate = useCallback((patch: Partial<StageState>) => {
    setState(s => {
      const next = { ...s, ...patch, dirty: false };
      if (patch.courses && !patch.course) next.course = patch.courses[0] ?? null;
      else if (patch.course && !patch.courses) next.courses = patch.course ? [patch.course] : [];
      return next;
    });
  }, []);

  const reset = useCallback(() => setState(emptyState), []);

  return {
    state,
    addFiles,
    removeAt,
    reorder,
    setActiveIndex,
    updateActive,
    setCaption,
    setVideoData,
    setCourse,
    setCourses,
    setGolf,

    setScheduledAt,
    restoreDraft,
    hydrate,
    reset,
  };
}
