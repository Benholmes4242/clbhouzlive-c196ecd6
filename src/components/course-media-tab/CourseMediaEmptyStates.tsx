import { VERDICT_KICKER, TAB_TITLE } from '@/components/courses/course-detail/about/AboutSection';
/** MEDIA_EMPTY_2: B and C share one no-shots card (CourseMediaNoShots); its
 * button opens the shared add flow (CourseMediaAddShot). A owns its photograph mosaic and closing invitation, with no tagging controls.
 */
import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { MEDIA_CATALOGUE_TOTAL, MEDIA_EMPTY_SNAPSHOT, privateHolePhotos, photoDayLabel } from '@/lib/courseMedia/emptyStates';
import { memberReasonSentence } from '@/lib/courseMedia/memberReasonSentence';
import { capitalPhotoCount, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { HoleMediaThumbnail } from './HoleMediaVideo';
import { HolePhotoPicker } from './HolePhotoPicker';
import './media-empty.css';

const theme = { '--media-empty-ink': A.INK, '--media-empty-muted': A.MUTE, '--media-empty-body': A.BODY, '--media-empty-rule': A.SOFT, '--media-empty-dim': A.DIM, '--media-empty-faint': A.FAINT, '--media-empty-canvas': A.CANVAS, '--media-empty-rejected': A.RED } as CSSProperties;

export function CourseMediaNoHoleList({ courseName, photoCount, children }: {
  courseName?: string; photoCount: number; children: ReactNode;
}) {
  return <section className="media-empty media-empty-section" style={theme}>
    <p className="media-empty-kicker" style={VERDICT_KICKER}>From the members</p>
    <h2 className="media-empty-title" style={TAB_TITLE}>{capitalPhotoCount(photoCount)} {photoCount === 1 ? 'photograph' : 'photographs'}</h2>
    <p className="media-empty-lede">Posted with reviews of this course.</p>
    {children}
    <p className="media-empty-said">Nobody has posted a round at {courseName || 'this course'}, so clbhouz does not yet know which holes it has. <strong>The first tracked round here opens the hole walk</strong> and these photographs become taggable.</p>
  </section>;
}

/** State D Retag uses the deployed owner RPC, never a direct table update.
 * Unavailable hole analysis omits the picker/action; Remove stays absent.
 * Rejection sentences share the notification helper; no local reason map.
 */
export function CourseMediaNotLive({ rows, memberId, courseId, onRetag }: {
  rows: readonly HolePhoto[]; memberId: string; courseId: string; onRetag?: (row: HolePhoto) => void;
}) {
  const own = privateHolePhotos(rows, memberId, courseId);
  if (!own.length) return null;
  return <section className="media-empty media-empty-section" style={theme}>
    <p className="media-empty-kicker" style={VERDICT_KICKER}>Only you can see this</p>
    <h2 className="media-empty-title" style={TAB_TITLE}>{capitalPhotoCount(own.length)} of yours {own.length === 1 ? 'is' : 'are'} not live</h2>
    {rows.some(row => row.user_id === memberId && row.course_id === courseId && row.status === 'approved') && <p className="media-empty-lede">Everything else you have tagged here is published.</p>}
    <div className="media-empty-status-list">{own.map(row => {
      const reviewed = photoDayLabel(row.reviewed_at);
      return <div key={row.id} role="status" className="media-empty-status" data-status={row.status}>
        <X className="h-4 w-4 shrink-0" />
        <p><strong>Not published · The {row.hole_no}{ordinalSuffix(row.hole_no)}.</strong>{' '}
          {reviewed && <>Reviewed on {reviewed}. </>}<strong>{row.media_type === 'video' ? memberReasonSentence(row.reject_reason).replace(/photo/g, 'video') : memberReasonSentence(row.reject_reason)}</strong>{row.reject_reason === 'not_your_photo' && <> This {row.media_type === 'video' ? 'video' : 'photo'} cannot be retagged because it is not yours.</>}
        </p>
      </div>;
    })}</div>
    <div className="media-empty-thumbnails">{own.map(row => <div key={row.id} className="media-empty-thumbnail"><HoleMediaThumbnail url={row.media_url} mediaType={row.media_type} streamId={row.stream_id} posterUrl={row.poster_url} durationSeconds={row.duration_seconds} alt={`Your rejected ${row.media_type === 'video' ? 'video' : 'photograph'} of hole ${row.hole_no}`} /><span>{row.hole_no}</span></div>)}</div>
    {own.some(row => row.status === 'rejected') && <p className="media-empty-said">A rejected photo or video stays yours and stays private.</p>}
    {onRetag && own.filter(row => row.reject_reason !== 'not_your_photo').map(row => <Button key={row.id} variant="ghost" className="media-empty-action media-empty-retag-action" onClick={() => onRetag(row)}>Retag the {row.hole_no}{ordinalSuffix(row.hole_no)}</Button>)}
  </section>;
}

export function CoursePhotoRetagPicker({ row, knownHoles, pending, error, onSubmit, onClose, mode = 'retag' }: {
  row: HolePhoto; knownHoles: readonly number[]; pending: boolean; error: string | null;
  onSubmit: (hole: number) => void; onClose: () => void; mode?: 'retag' | 'move';
}) {
  const move = mode === 'move';
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent className="media-empty media-empty-dialog" style={{ ...theme, background: A.PANEL }} onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onPointerDownOutside={event => { if (pending) event.preventDefault(); }}>
    <DialogTitle>{move ? 'Move from the' : 'Retag the'} {row.hole_no}{ordinalSuffix(row.hole_no)}</DialogTitle>
    <DialogDescription className="media-empty-lede">{move ? 'Choose the hole this was taken on.' : 'Choose a different hole.'}</DialogDescription>
    {row.media_type === 'video' ? <div className="media-empty-retag-photo hole-media-preview"><HoleMediaThumbnail url={row.media_url} mediaType={row.media_type} streamId={row.stream_id} posterUrl={row.poster_url} durationSeconds={row.duration_seconds} alt={move ? 'Your video' : 'Your rejected video'} /></div> : <img src={row.media_url} alt={move ? 'Your photo' : 'Your rejected photograph'} className="media-empty-retag-photo" />}
    <HolePhotoPicker holeCount={knownHoles.length} knownHoleNumbers={knownHoles} selectedHole={row.hole_no} onSelect={value => { if (!pending && value !== row.hole_no) onSubmit(value); }} />
    {error && <p role="alert" className="media-empty-lede">{error}</p>}
    <Button variant="ghost" disabled={pending} onClick={onClose}>Cancel</Button>
  </DialogContent></Dialog>;
}

/** Owner removal of a live tag; same shell, theme and pending lock as the retag picker. */
export function HoleTagRemoveDialog({ row, fromPost, pending, error, onConfirm, onClose }: {
  row: HolePhoto; fromPost: boolean | null; pending: boolean; error: string | null;
  onConfirm: () => void; onClose: () => void;
}) {
  const video = row.media_type === 'video';
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent className="media-empty media-empty-dialog" style={{ ...theme, background: A.PANEL }} onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onPointerDownOutside={event => { if (pending) event.preventDefault(); }}>
    <DialogTitle>Remove from the {row.hole_no}{ordinalSuffix(row.hole_no)}?</DialogTitle>
    <DialogDescription className="media-empty-lede">{fromPost === false ? "You added this straight to the hole, so it won't appear anywhere on clbhouz after this." : fromPost ? 'It comes off the hole walk. Your post or review keeps it.' : 'It comes off the hole walk.'}</DialogDescription>
    {video ? <div className="media-empty-retag-photo hole-media-preview"><HoleMediaThumbnail url={row.media_url} mediaType={row.media_type} streamId={row.stream_id} posterUrl={row.poster_url} durationSeconds={row.duration_seconds} alt="Your video" /></div> : <img src={row.media_url} alt="Your photo" className="media-empty-retag-photo" />}
    {error && <p role="alert" className="media-empty-lede">{error}</p>}
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
      <Button variant="ghost" className="media-empty-action" style={{ width: '100%', marginTop: 0 }} disabled={pending || fromPost == null} onClick={onConfirm}>{pending ? 'Removing...' : 'Remove'}</Button>
      <Button variant="ghost" style={{ minHeight: 44 }} disabled={pending} onClick={onClose}>Cancel</Button>
    </div>
  </DialogContent></Dialog>;
}

function ordinalSuffix(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
}

/** No shots at all (with or without a hole list): one invite card, same chrome
 * as the nothing-tagged invite. Its button opens the shared add flow. */
export function CourseMediaNoShots({ courseName, hasHoles, onAdd }: { courseName?: string; hasHoles: boolean; onAdd: () => void }) {
  const { t } = useTranslation('courses');
  const name = courseName || 'this course';
  const withoutPhotos = MEDIA_EMPTY_SNAPSHOT.withoutPhotos.toLocaleString('en-GB');
  const total = MEDIA_CATALOGUE_TOTAL.toLocaleString('en-GB');
  return <section className="media-empty-noshots" data-media-no-shots data-has-holes={hasHoles || undefined} style={{ margin: '20px 20px 0', padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#F8FAFC' }}><Camera size={17} /></span>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>{t('media.empty.title', { defaultValue: 'Be the first to show it' })}</h3>
        <p data-no-shots-body style={{ fontSize: 13, lineHeight: 1.45, color: 'rgba(248,250,252,0.62)', marginTop: 4, marginBottom: 0 }}>{hasHoles
          ? t('media.empty.bodyHoles', { courseName: name, defaultValue: `Nobody has added a photo or video of ${name} yet. Add yours and tag it to a hole, the clubhouse, the food or anything else.` })
          : t('media.empty.bodyPlaces', { courseName: name, defaultValue: `Nobody has added a photo or video of ${name} yet. Add yours and tag it to the clubhouse, the views or anything else. Holes open up once rounds are logged here.` })}</p>
      </div>
    </div>
    <button type="button" onClick={onAdd} style={{ marginTop: 14, width: '100%', height: 44, borderRadius: 12, background: '#F8FAFC', color: '#0A0A0C', fontSize: 14.5, fontWeight: 650, border: 0 }}>{t('media.empty.add', { defaultValue: 'Add a photo or video' })}</button>
    <p data-no-shots-foot style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(248,250,252,0.42)', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>{t('media.empty.footer', { withoutPhotos, total, defaultValue: `${withoutPhotos} of the ${total} courses on clbhouz have never been photographed. Members are the only way that changes.` })}</p>
  </section>;
}
