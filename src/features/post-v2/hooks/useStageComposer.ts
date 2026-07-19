// useStageComposer - central state for the Stage composer.
//
// One reducer-esque state object; each surface (media stage, tray, caption,
// detail rows, sheets) reads/writes through this hook. Kept intentionally
// small - no orchestration or DB writes live here (see usePostSubmit +
// usePostUploadOrchestrator for those).

import { useCallback, useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { POST_LIMITS, formatDuration } from '@/constants/postLimits';

// Probe a video File's duration (seconds). Resolves 0 if unreadable.
function probeVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    const done = (d: number) => {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      resolve(d);
    };
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : 0);
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
}

export interface StageCourse {
  id: string;
  name: string;
  country?: string | null;
}

export const MAX_MEDIA = 10;

export interface StageState {
  media: StageMediaItem[];
  activeIndex: number;
  caption: string;
  /**
   * Ordered list of tagged courses. The FIRST entry remains the primary
   * course written to posts.course_id exactly as today; all entries
   * (including the first) are also written to posts.tagged_course_ids
   * in selection order. Consumers that need a single course should read
   * `courses[0] ?? null`.
   */
  courses: StageCourse[];
  scheduledAt: Date | null;
  dirty: boolean;
}

const emptyState: StageState = {
  media: [],
  activeIndex: 0,
  caption: '',
  courses: [],
  scheduledAt: null,
  dirty: false,
};

export function useStageComposer() {
  const [state, setState] = useState<StageState>(emptyState);

  // revoke blob URLs when unmounting so we don't leak
  useEffect(() => {
    return () => {
      for (const m of state.media) {
        if (m.previewUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(m.previewUrl); } catch { /* ignore */ }
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markDirty = (patch: Partial<StageState>) =>
    setState(s => ({ ...s, ...patch, dirty: true }));

  const addFiles = useCallback(async (files: File[]) => {
    const kept: File[] = [];
    for (const file of files) {
      if (file.type.startsWith('video/')) {
        const dur = await probeVideoDuration(file);
        if (dur === 0) {
          toast.error("Couldn't read that video's length. Try a different file.");
          continue;
        }
        if (dur > POST_LIMITS.MAX_VIDEO_DURATION_SECONDS) {
          toast.error(`Video too long (${formatDuration(dur)}). Maximum is ${POST_LIMITS.MAX_VIDEO_DURATION_DISPLAY}.`);
          continue;
        }
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
  const setCourses = useCallback((cs: StageCourse[]) => markDirty({ courses: cs }), []);
  /** Back-compat single-course setter — writes as a 1-element (or empty) array. */
  const setCourse = useCallback((c: StageCourse | null) => markDirty({ courses: c ? [c] : [] }), []);
  const setScheduledAt = useCallback((d: Date | null) => markDirty({ scheduledAt: d }), []);

  const restoreDraft = useCallback((patch: Partial<StageState>) => {
    setState(s => ({ ...s, ...patch, dirty: false }));
  }, []);

  /**
   * Hydrate the composer for edit mode: seed caption/course/media without
   * flipping `dirty`. Called once on mount when editPostId is set.
   */
  const hydrate = useCallback((patch: Partial<StageState>) => {
    setState(s => ({ ...s, ...patch, dirty: false }));
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
    setCourse,
    setScheduledAt,
    restoreDraft,
    hydrate,
    reset,
  };
}
