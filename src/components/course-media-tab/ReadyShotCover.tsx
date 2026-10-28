import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { Camera, Video } from 'lucide-react';

export interface CoverShot { id: string; media_url: string; media_type?: string; stream_id?: string | null; poster_url?: string | null; duration_seconds?: number | null }
export function readyCoverShots<T extends CoverShot>(shots: readonly T[]): T[] {
  return shots.filter(shot => shot.media_type !== 'video' || shot.duration_seconds != null);
}
export function ReadyShotCover({ shots, fallbackIcon = false, alt = '' }: { shots: readonly CoverShot[]; fallbackIcon?: boolean; alt?: string }) {
  const { t } = useTranslation('courses');
  const candidates = [...new Set(readyCoverShots(shots).flatMap(shot => {
    const poster = holeMediaPoster(shot);
    const generated = shot.media_type === 'video' ? holeMediaPoster({ ...shot, poster_url: null }) : shot.poster_url;
    return [poster, generated].filter((url): url is string => !!url);
  }))];
  const identity = candidates.join('|');
  const [state, setState] = useState({ identity, index: 0, loaded: false });
  const current = state.identity === identity ? state : { identity, index: 0, loaded: false };
  const src = candidates[current.index];
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth > 0) setState({ identity, index: current.index, loaded: true });
  }, [identity, current.index]);
  if (!src) return fallbackIcon ? <span className="course-gallery-thumb-fallback">{shots[0]?.media_type === 'video' ? <Video size={16} /> : <Camera size={16} />}</span> : <span className="media-v2-processing">{t('media.v2.processing', { defaultValue: "Processing" })}</span>;
  return <>
    {!current.loaded && <span className="media-v2-cover-shimmer clb-shimmer-dark" />}
    <img ref={image} className={`media-v2-cover${current.loaded ? ' is-loaded' : ''}`} src={src} alt={alt}
      onLoad={() => setState({ identity, index: current.index, loaded: true })}
      onError={() => setState({ identity, index: current.index + 1, loaded: false })} />
  </>;
}