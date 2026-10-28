/** Media v3 has one presentation for single, member batch and admin batch.
 * Adapters own selection, writes, pending locks and undo; this shell owns the
 * simultaneous grids and read-only canonical thumbnail viewer. */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScorecardGlassOverlay } from '@/features/courses/_shared/scorecard/ScorecardGlassOverlay';
import { HoleMediaThumbnail } from './HoleMediaVideo';
import { ShotTagChoices, PLACE_LABELS } from './ShotTagChoices';
import type { CoursePlace } from '@/lib/courseMedia/places';
import type { OwnMediaSource } from '@/lib/courseMedia/holePhotoData';
import { placeShotsToFeedPosts } from '@/lib/courseMedia/memberShotPosts';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { ordinal } from '@/lib/text/numbers';
import './media-v3.css';

export type TagShot = Partial<OwnMediaSource> & { url: string; ownerName?: string };
export function openTagShot(shot: TagShot, originEl: HTMLElement) {
  const posts = placeShotsToFeedPosts([{ id: shot.url, course_id: '', media_url: shot.url,
    media_type: shot.mediaType ?? 'image', poster_url: shot.posterUrl, stream_id: shot.streamId,
    duration_seconds: shot.durationSeconds, width: shot.width, height: shot.height,
    added_at: shot.createdAt, member_name: shot.ownerName }], '', '', 'preview', '');
  if (!posts.length) return;
  openWithOrigin({ posts, index: 0, originEl, posterUrl: shot.posterUrl ?? shot.url,
    mediaId: shot.url, openedFrom: 'course-media', options: { readOnly: true, syntheticPosts: true } });
}

export function ShotTagCard({ shot, position, credit, holes, hole, place, onHole, onPlace,
  pending, locked = false, canSubmit, onSubmit, onSkip, onClose, remove, children, strip }: {
  shot: TagShot; position?: { i: number; n: number }; credit?: string;
  holes: readonly number[]; hole: number | null; place: CoursePlace | null;
  onHole: (hole: number) => void; onPlace: (place: CoursePlace) => void;
  pending: boolean; locked?: boolean; canSubmit: boolean; onSubmit: () => void;
  onSkip: () => void; onClose: () => void; remove?: { onClick: () => void; pending?: boolean };
  children?: ReactNode; strip?: ReactNode;
}) {
  const { t } = useTranslation('courses');
  const close = () => { if (!pending) onClose(); };
  const primary = hole != null ? t('media.v3.tagHole', { ordinal: ordinal(hole), defaultValue: `Tag to the ${ordinal(hole)}` })
    : place ? t('media.v3.tagPlace', { label: PLACE_LABELS[place], defaultValue: `Tag as ${PLACE_LABELS[place]}` })
    : t('media.v3.tag', { defaultValue: 'Tag' });
  return <ScorecardGlassOverlay open onClose={close} presentation="overlay">
    <div className="media-v3-tag-card" data-scorecard-scroll onClick={event => event.stopPropagation()}>
      <div className="media-v3-tag-header">
        <Button variant="ghost" className="media-v3-tag-thumbnail" aria-label={t('media.v3.viewShot', { defaultValue: 'View shot' })}
          onClick={event => openTagShot(shot, event.currentTarget)}>
          <HoleMediaThumbnail {...shot} alt={shot.mediaType === 'video' ? 'Current video' : 'Current photograph'} />
        </Button>
        <div className="media-v3-tag-heading">
          {position && <span className="media-v2-label" data-tag-position>{t('media.v3.position', { ...position, defaultValue: `${position.i} OF ${position.n}` })}</span>}
          <h2>{t('media.v3.title', { defaultValue: "What's in this shot?" })}</h2>
        </div>
        <Button variant="ghost" className="media-v3-tag-close" aria-label={t('media.v3.close', { defaultValue: 'Close' })} disabled={pending} onClick={close}><X size={15} /></Button>
      </div>
      {credit && <p className="media-v3-tag-credit">{credit}</p>}
      {strip}
      {children}
      <ShotTagChoices holes={holes} hole={hole} onHole={onHole} place={place} onPlace={onPlace} disabled={pending || locked} lockedHole={locked} />
      {remove && <Button variant="ghost" className="media-v3-tag-remove" disabled={pending} onClick={remove.onClick}>{remove.pending ? t('media.v3.removing', { defaultValue: 'Removing...' }) : t('media.v3.remove', { defaultValue: 'Remove tag' })}</Button>}
      <div className="media-v3-tag-buttons">
        <Button variant="outline" className="media-v3-tag-skip" disabled={pending} onClick={onSkip}>{t('media.v3.skip', { defaultValue: 'Skip' })}</Button>
        <Button className="media-v3-tag-primary" data-tag-primary disabled={!canSubmit || pending} onClick={onSubmit}>{primary}</Button>
      </div>
    </div>
  </ScorecardGlassOverlay>;
}