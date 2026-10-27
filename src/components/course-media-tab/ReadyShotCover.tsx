import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';

export interface CoverShot { id: string; media_url: string; media_type?: string; stream_id?: string | null; poster_url?: string | null; duration_seconds?: number | null }
export function readyCoverShots<T extends CoverShot>(shots: readonly T[]): T[] {
  return shots.filter(shot => shot.media_type !== 'video' || shot.duration_seconds != null);
}
export function ReadyShotCover({ shots }: { shots: readonly CoverShot[] }) {
  const { t } = useTranslation('courses');
  const candidates = readyCoverShots(shots).map(holeMediaPoster).filter(Boolean);
  const identity = candidates.join('|');
  const [state, setState] = useState({ identity, index: 0, loaded: false });
  const current = state.identity === identity ? state : { identity, index: 0, loaded: false };
  const src = candidates[current.index];
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth > 0) setState({ identity, index: current.index, loaded: true });
  }, [identity, current.index]);
  if (!src) return <span className="media-v2-processing">{t('media.v2.processing')}</span>;
  return <>
    {!current.loaded && <span className="media-v2-cover-shimmer clb-shimmer-dark" />}
    <img ref={image} className={`media-v2-cover${current.loaded ? ' is-loaded' : ''}`} src={src} alt=""
      onLoad={() => setState({ identity, index: current.index, loaded: true })}
      onError={() => setState({ identity, index: current.index + 1, loaded: false })} />
  </>;
}