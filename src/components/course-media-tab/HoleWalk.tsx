import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReadyShotCover } from './ReadyShotCover';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { deriveHoleWalk } from '@/lib/courseMedia/holeWalk';
import './hole-walk.css';
import './media-v2.css';

export function HoleProcessingVideo({ media, label }: { media: { media_url: string; stream_id?: string | null; poster_url?: string | null }; label: string }) {
  return <div className="hole-media-processing">
    <img src={holeMediaPoster({ ...media, media_type: 'video' })} alt={label} onError={event => { event.currentTarget.hidden = true; }} />
    <span className="hole-media-processing-label" style={{ color: A.DIM }}>Processing</span>
  </div>;
}

/** Sparse course rail only. Every photographed hole opens the course gallery;
 * no selected-hole state, inline panel, move-follow focus or page scrolling. */
export function HoleWalk({ available, holes, rows, onAddFirst, onChooseFirst, onOpen }: {
  available: boolean; holes: readonly CourseHole[]; rows: readonly HolePhoto[];
  totalMedia: number; courseName?: string; authors?: ReadonlyMap<string, string>;
  onAddFirst: (hole: number) => void; onChooseFirst?: () => void;
  onOpen?: (hole: number, origin: HTMLElement, entry: string) => void;
  scored?: boolean;
}) {
  const { t } = useTranslation('courses');
  if (!available || !holes.length) return null;
  const walk = deriveHoleWalk(holes, rows);
  if (!walk.photographed) return null;
  return <div className="hole-walk"><section>
    <div className="media-v2-hole-head">
      <div className="media-v2-head"><h3>{t('media.v2.holeByHole', { defaultValue: 'Hole by hole' })}</h3><span className="media-v2-label">{t('media.v2.coverage', { shot: walk.photographed, holes: holes.length, defaultValue: `${walk.photographed} of ${holes.length} holes` })}</span></div>
      <div className="media-v2-coverage">{walk.tiles.map(item => <Button key={item.hole.hole_no} variant="ghost" data-shot={item.photos.length > 0}
        aria-label={t('media.v2.coverageHole', { hole: item.hole.hole_no, defaultValue: `Coverage hole ${item.hole.hole_no}` })}
        onClick={event => item.photos.length ? onOpen?.(item.hole.hole_no, event.currentTarget, 'coverage') : onAddFirst(item.hole.hole_no)}><i /><span>{item.hole.hole_no}</span></Button>)}</div>
    </div>
    <div className="media-v2-hole-rail">{walk.tiles.filter(item => item.photos.length).map(item => <Button key={item.hole.hole_no} variant="ghost" className="media-v2-hole-card" aria-label={`Hole ${item.hole.hole_no}`} onClick={event => onOpen?.(item.hole.hole_no, event.currentTarget, 'hole-card')}>
      <ReadyShotCover shots={item.photos} /><span className="media-v2-hole-number">{item.hole.hole_no}</span><span className="media-v2-hole-count">{t('media.v2.shots', { count: item.photos.length, defaultValue: `${item.photos.length} ${item.photos.length === 1 ? 'shot' : 'shots'}` })}</span>
    </Button>)}
    {walk.openCount > 0 && <Button variant="ghost" className="media-v2-add-card" onClick={onChooseFirst} disabled={!onChooseFirst}><i><Plus size={16} /></i><b>{t('media.v2.holesToGo', { count: walk.openCount, defaultValue: `${walk.openCount} ${walk.openCount === 1 ? 'hole' : 'holes'} to go` })}</b><span>{t('media.v2.addFirstShot', { defaultValue: 'Add the first shot of one' })}</span></Button>}
    </div>
  </section></div>;
}
