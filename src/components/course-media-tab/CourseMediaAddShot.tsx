/** "Add a photo or video": library picker -> ShotTagCard for that one shot.
 * Nothing uploads until the primary button, so Cancel leaves no file behind.
 * Hole writes reuse submitLibraryHole*; place writes use submitLibraryPlace*.
 * Shared by the no-shots card, the nothing-tagged invite and "holes to go". */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMediaUpload } from '@/uploads/hooks/useMediaUpload';
import { uploadVideoResilient } from '@/uploads/resilientVideoUpload';
import { pollStreamMetadata } from '@/utils/pollStreamMetadata';
import { libraryHoleVideoError, submitLibraryHolePhoto, submitLibraryHoleVideo } from '@/lib/courseMedia/holePhotoData';
import { submitLibraryPlacePhoto, submitLibraryPlaceVideo } from '@/lib/courseMedia/libraryPlaceMedia';
import { holePhotoErrorMessage } from '@/lib/courseMedia/holePhotoError';
import { memberTagConfirmation } from '@/lib/courseMedia/holeTagConfirmation';
import type { CoursePlace } from '@/lib/courseMedia/places';
// Same key as placeMediaKey in useCoursePlaceMedia; spelt here so callers that
// stub that hook keep the refresh.
const placeMediaKey = (courseId: string, memberId?: string) => ['course-place-media', courseId, memberId] as const;
import { ShotTagCard } from './ShotTagCard';
import { PLACE_LABELS } from './ShotTagChoices';

export function useAddShotFlow({ courseId, memberId, knownHoles, ownHoleTags = [] }: {
  courseId: string; memberId?: string; knownHoles: readonly number[] | null; ownHoleTags?: readonly number[];
}): { open: () => void; node: ReactNode } {
  const { t } = useTranslation('courses');
  const cache = useQueryClient();
  const uploader = useMediaUpload();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hole, setHole] = useState<number | null>(null);
  const [place, setPlace] = useState<CoursePlace | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL?.(preview); }, [preview]);

  const reset = () => { setFile(null); setPreview(null); setHole(null); setPlace(null); setError(null); setProgress(null); };
  const choose = (next: File) => {
    setHole(null); setPlace(null); setError(null); setProgress(null);
    setFile(next);
    setPreview(typeof URL.createObjectURL === 'function' ? URL.createObjectURL(next) : '');
  };
  const holes = knownHoles ?? [];
  const video = !!file && !file.type.startsWith('image/');

  const submit = async () => {
    if (!file || !memberId || pending || (hole == null && place == null)) return;
    if (video) { const invalid = libraryHoleVideoError(file); if (invalid) { setError(invalid); return; } }
    setPending(true); setError(null); setProgress(video ? 0 : null);
    try {
      let streamId: string | null = null; let url: string | null = null;
      if (video) {
        streamId = await new Promise<string>((resolve, reject) => {
          uploadVideoResilient({ file,
            onProgress: (loaded, total) => setProgress(total > 0 ? Math.round((loaded / total) * 100) : 0),
            onSuccess: resolve, onError: reject,
          }).catch(reject);
        });
      } else {
        const uploaded = await uploader.upload(file, { bucketType: 'clbhouz-course-images', destination: 'r2' });
        if (!uploaded.success || !uploaded.mediaUrl) throw new Error('Upload failed');
        url = uploaded.mediaUrl;
      }
      const placeKey = placeMediaKey(courseId, memberId);
      const holeKey = ['hole-photo-tags', courseId, memberId];
      let message: string;
      if (hole != null) {
        if (!knownHoles) throw new Error('This shot cannot be tagged.');
        if (streamId) await submitLibraryHoleVideo(file, streamId, courseId, memberId, hole, knownHoles);
        else await submitLibraryHolePhoto(file, url as string, courseId, memberId, hole, knownHoles);
        message = memberTagConfirmation(hole, ownHoleTags.filter(h => h === hole).length + 1);
      } else {
        const chosen = place as CoursePlace;
        if (streamId) await submitLibraryPlaceVideo(file, streamId, courseId, memberId, chosen);
        else await submitLibraryPlacePhoto(file, url as string, courseId, memberId, chosen);
        message = t('media.v2.taggedPlace', { label: PLACE_LABELS[chosen], defaultValue: `Tagged to ${PLACE_LABELS[chosen]}.` });
      }
      if (streamId) {
        const refreshKey = hole != null ? holeKey : placeKey;
        void pollStreamMetadata(streamId).then(() => cache.invalidateQueries({ queryKey: refreshKey })).catch(() => {});
      }
      reset();
      toast(message);
      await Promise.all([
        cache.invalidateQueries({ queryKey: holeKey }),
        cache.invalidateQueries({ queryKey: placeKey }),
        cache.invalidateQueries({ queryKey: ['course-media-counts', courseId] }),
        cache.invalidateQueries({ queryKey: ['course-media-feed', courseId] }),
      ]);
    } catch (failure) {
      console.error('[add-shot] failed', failure);
      setError(video ? 'The video could not be uploaded. Nothing was saved.' : holePhotoErrorMessage(failure));
    } finally { setPending(false); setProgress(null); }
  };

  const node = <>
    <input ref={input} type="file" accept="image/*,video/*" hidden data-add-shot-input
      onChange={event => { const next = event.target.files?.[0]; if (next) choose(next); event.target.value = ''; }} />
    {file && <ShotTagCard gallerySingle shot={{ url: preview ?? '', mediaType: video ? 'video' : 'image' }}
      holes={holes} hole={hole} place={place}
      onHole={next => { setHole(current => current === next ? null : next); setPlace(null); }}
      onPlace={next => { setPlace(current => current === next ? null : next); setHole(null); }}
      pending={pending} canSubmit={hole != null || place != null}
      primaryLabel={pending ? <><Loader2 className="animate-spin" />{progress != null ? `Uploading ${progress}%` : 'Tagging'}</> : undefined}
      onSubmit={() => void submit()} onSkip={reset} onClose={reset}>
      {error && <p role="alert">{error}</p>}
    </ShotTagCard>}
  </>;
  return { open: () => { setError(null); input.current?.click(); }, node };
}
