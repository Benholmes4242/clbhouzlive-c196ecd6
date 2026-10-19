import { VERDICT_KICKER, TAB_TITLE } from '@/components/courses/course-detail/about/AboutSection';
/** MEDIA_EMPTY_1: B and C have distinct layouts and write entrypoints.
 * Only B's untapped Add first chooses a hole. Tile taps use the existing
 * known-hole path; C can only navigate to the existing review composer.
 * A owns its photograph mosaic and closing invitation, with no tagging controls.
 */
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { MEDIA_CATALOGUE_TOTAL, MEDIA_EMPTY_SNAPSHOT, privateHolePhotos, photoDayLabel } from '@/lib/courseMedia/emptyStates';
import { memberReasonSentence } from '@/lib/courseMedia/memberReasonSentence';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { capitalPhotoCount, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
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
          {reviewed && <>Reviewed on {reviewed}. </>}<strong>{memberReasonSentence(row.reject_reason)}</strong>{row.reject_reason === 'not_your_photo' && <> This photograph cannot be retagged because it is not yours.</>}
        </p>
      </div>;
    })}</div>
    <div className="media-empty-thumbnails">{own.map(row => <div key={row.id} className="media-empty-thumbnail"><img src={row.media_url} alt={`Your rejected photograph of hole ${row.hole_no}`} /><span>{row.hole_no}</span></div>)}</div>
    {own.some(row => row.status === 'rejected') && <p className="media-empty-said">A rejected photograph stays yours and stays private.</p>}
    {onRetag && own.filter(row => row.reject_reason !== 'not_your_photo').map(row => <Button key={row.id} variant="ghost" className="media-empty-action media-empty-retag-action" onClick={() => onRetag(row)}>Retag the {row.hole_no}{ordinalSuffix(row.hole_no)}</Button>)}
  </section>;
}

export function CoursePhotoRetagPicker({ row, knownHoles, pending, error, onSubmit, onClose }: {
  row: HolePhoto; knownHoles: readonly number[]; pending: boolean; error: string | null;
  onSubmit: (hole: number) => void; onClose: () => void;
}) {
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent className="media-empty" style={{ ...theme, background: A.PANEL }} onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onPointerDownOutside={event => { if (pending) event.preventDefault(); }}>
    <DialogTitle>Retag the {row.hole_no}{ordinalSuffix(row.hole_no)}</DialogTitle>
    <DialogDescription className="media-empty-lede">Choose a different hole.</DialogDescription>
    <img src={row.media_url} alt="Your rejected photograph" className="media-empty-retag-photo" />
    <HolePhotoPicker holeCount={knownHoles.length} knownHoleNumbers={knownHoles} selectedHole={row.hole_no} onSelect={value => { if (!pending && value !== row.hole_no) onSubmit(value); }} />
    {error && <p role="alert" className="media-empty-lede">{error}</p>}
    <Button variant="ghost" disabled={pending} onClick={onClose}>Cancel</Button>
  </DialogContent></Dialog>;
}

function ordinalSuffix(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
}

export function CourseMediaNoPhotographs({ courseName, holes, onHole, onAddFirst }: {
  courseName?: string; holes: readonly CourseHole[]; onHole: (hole: number) => void; onAddFirst: () => void;
}) {
  return <section className="media-empty media-empty-section" style={theme}>
    <p className="media-empty-kicker" style={VERDICT_KICKER}>Walk the course</p>
    <h2 className="media-empty-title" style={TAB_TITLE}>You would be the first</h2>
    <p className="media-empty-lede">Nobody has shot {courseName || 'this course'}. Every hole is open.</p>
    <div className="media-empty-grid">{[...holes].sort((a, b) => a.hole_no - b.hole_no).map(hole => <Button key={hole.hole_no} variant="ghost" aria-label={`Hole ${hole.hole_no}`} data-state="open" className="media-empty-hole" onClick={() => onHole(hole.hole_no)}><span className="media-empty-hole-number">{hole.hole_no}</span><span className="media-empty-hole-open">Open</span></Button>)}</div>
    <p className="media-empty-said"><strong>{MEDIA_EMPTY_SNAPSHOT.withoutPhotos.toLocaleString('en-GB')} of the {MEDIA_CATALOGUE_TOTAL.toLocaleString('en-GB')} courses</strong> we track have no photograph at all. <strong>No publisher will ever shoot them.</strong> Members are the only way this gets filled, one hole at a time.</p>
    <Button variant="ghost" className="media-empty-action" onClick={() => onAddFirst()}>Add the first</Button>
  </section>;
}

export function CourseMediaNothing({ courseName, onReview }: { courseName?: string; onReview: () => void }) {
  return <section className="media-empty media-empty-section" style={theme}>
    <p className="media-empty-kicker" style={VERDICT_KICKER}>Nobody has been here yet</p>
    <h2 className="media-empty-title" style={TAB_TITLE}>No photographs of {courseName || 'this course'}</h2>
    <p className="media-empty-lede">And no rounds, so clbhouz does not yet know its holes.</p>
    <p className="media-empty-said">Photographs reach a course through a review. <strong>Write one and your pictures land here</strong> — and the first round posted opens the hole walk for everybody after you.</p>
    <Button variant="ghost" className="media-empty-action" onClick={onReview}>Review this course</Button>
  </section>;
}

export function CourseFirstPhotoPicker({ knownHoles, pending, error, onSubmit, onClose }: {
  knownHoles: readonly number[]; pending: boolean; result?: HolePhoto | null; error: string | null;
  onSubmit: (file: File, hole: number) => void; onClose: () => void;
}) {
  const [hole, setHole] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent className="media-empty" style={{ ...theme, background: A.PANEL }}>
    <DialogTitle>Add the first photograph</DialogTitle>
    <DialogDescription className="sr-only">Choose the hole and a photograph from your library.</DialogDescription>
    <HolePhotoPicker holeCount={knownHoles.length} knownHoleNumbers={knownHoles} floor={0} selectedHole={hole} usedHoles={[]} onSelect={n => { if (!pending) setHole(n); }} />
    <input ref={input} type="file" accept="image/*" hidden disabled={pending} onChange={event => { const file = event.target.files?.[0]; if (file && hole != null) onSubmit(file, hole); event.target.value = ''; }} />
    {error && <p role="alert" className="media-empty-lede">{error}</p>}
    <Button variant="ghost" className="media-empty-action" disabled={pending || hole == null} onClick={() => input.current?.click()}>{pending ? <><Loader2 className="animate-spin" />Tagging</> : 'Choose from your library'}</Button>
  </DialogContent></Dialog>;
}