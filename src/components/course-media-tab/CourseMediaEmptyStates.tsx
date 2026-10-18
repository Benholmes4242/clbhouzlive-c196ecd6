/** MEDIA_EMPTY_1: B and C have distinct layouts and write entrypoints.
 * Only B's untapped Add first chooses a hole. Tile taps use the existing
 * known-hole path; C can only navigate to the existing review composer.
 * A awaits its own missing signed-off mock, never substituted with B or C.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { MEDIA_CATALOGUE_TOTAL, MEDIA_EMPTY_SNAPSHOT } from '@/lib/courseMedia/emptyStates';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { HolePhotoPicker } from './HolePhotoPicker';
import { HolePhotoOutcome } from './HolePhotoTagDialog';
import './media-empty.css';

const theme = { '--media-empty-ink': A.INK, '--media-empty-muted': A.MUTE, '--media-empty-body': A.BODY, '--media-empty-rule': A.SOFT, '--media-empty-dim': A.DIM, '--media-empty-faint': A.FAINT, '--media-empty-canvas': A.CANVAS } as CSSProperties;

export function CourseMediaNoPhotographs({ courseName, holes, onHole, onAddFirst }: {
  courseName?: string; holes: readonly CourseHole[]; onHole: (hole: number) => void; onAddFirst: () => void;
}) {
  return <section className="media-empty media-empty-section" style={theme}>
    <p className="media-empty-kicker">Walk the course</p>
    <h2 className="media-empty-title">You would be the first</h2>
    <p className="media-empty-lede">Nobody has shot {courseName || 'this course'}. Every hole is open.</p>
    <div className="media-empty-grid">{[...holes].sort((a, b) => a.hole_no - b.hole_no).map(hole => <Button key={hole.hole_no} variant="ghost" aria-label={`Hole ${hole.hole_no}`} data-state="open" className="media-empty-hole" onClick={() => onHole(hole.hole_no)}><span className="media-empty-hole-number">{hole.hole_no}</span><span className="media-empty-hole-open">Open</span></Button>)}</div>
    <p className="media-empty-said"><strong>{MEDIA_EMPTY_SNAPSHOT.withoutPhotos.toLocaleString('en-GB')} of the {MEDIA_CATALOGUE_TOTAL.toLocaleString('en-GB')} courses</strong> we track have no photograph at all. <strong>No publisher will ever shoot them.</strong> Members are the only way this gets filled, one hole at a time.</p>
    <Button variant="ghost" className="media-empty-action" onClick={onAddFirst}>Add the first</Button>
  </section>;
}

export function CourseMediaNothing({ courseName, onReview }: { courseName?: string; onReview: () => void }) {
  return <section className="media-empty media-empty-section" style={theme}>
    <p className="media-empty-kicker">Nobody has been here yet</p>
    <h2 className="media-empty-title">No photographs of {courseName || 'this course'}</h2>
    <p className="media-empty-lede">And no rounds, so clbhouz does not yet know its holes.</p>
    <p className="media-empty-said">Photographs reach a course through a review. <strong>Write one and your pictures land here</strong> — and the first round posted opens the hole walk for everybody after you.</p>
    <Button variant="ghost" className="media-empty-action" onClick={onReview}>Review this course</Button>
  </section>;
}

export function CourseFirstPhotoPicker({ knownHoles, pending, result, error, onSubmit, onClose }: {
  knownHoles: readonly number[]; pending: boolean; result: HolePhoto | null; error: string | null;
  onSubmit: (file: File, hole: number) => void; onClose: () => void;
}) {
  const [hole, setHole] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent className="media-empty" style={{ ...theme, background: A.PANEL }}>
    <DialogTitle>Add the first photograph</DialogTitle>
    <DialogDescription className="sr-only">Choose the hole and a photograph from your library.</DialogDescription>
    {result ? <HolePhotoOutcome row={result} /> : <HolePhotoPicker holeCount={knownHoles.length} knownHoleNumbers={knownHoles} floor={0} selectedHole={hole} usedHoles={[]} onSelect={n => { if (!pending) setHole(n); }} />}
    <input ref={input} type="file" accept="image/*" hidden disabled={pending} onChange={event => { const file = event.target.files?.[0]; if (file && hole != null) onSubmit(file, hole); event.target.value = ''; }} />
    {error && <p role="alert" className="media-empty-lede">{error}</p>}
    <Button variant="ghost" className="media-empty-action" disabled={pending || (!result && hole == null)} onClick={() => { if (result) onClose(); else input.current?.click(); }}>{pending ? <><Loader2 className="animate-spin" />Tagging</> : result ? 'Done' : 'Choose from your library'}</Button>
  </DialogContent></Dialog>;
}