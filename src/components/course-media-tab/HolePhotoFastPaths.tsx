/** MEDIA_FAST_1 keeps the hole-known and batch surfaces separate. Parents own
 * real course rounds, complete sources and authoritative writes. URL-only sources
 * carry empty EXIF without downloading media (MEDIA_TAGFIX_1).
 * The known-hole path never renders HolePhotoPicker. Skip has no write callback.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { HolePhotoPicker } from './HolePhotoPicker';
import { holeOrdinal } from '@/lib/courseMedia/holeWalk';
import { capitalPhotoCount, spellPhotoCount, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { advanceBatch, closedHoleCount, startBatch, type BatchPhoto } from '@/lib/courseMedia/holePhotoBatch';
import type { HolePhotoRound } from '@/lib/courseMedia/holePhotoVerdict';
import './hole-photo-fast.css';

const theme = { '--hole-walk-ink': A.INK, '--hole-walk-canvas': A.CANVAS, '--hole-walk-muted': A.MUTE, '--hole-walk-rule': A.BORDER, '--hole-walk-track': A.TRACK, '--hole-photo-panel': A.PANEL, '--hole-photo-success': A.IMPROVED } as CSSProperties;

export function HoleKnownPhotoPath({ hole, photos, pending, error, onChoose, onLibrary, onClose }: {
  hole: number; photos: readonly string[]; round?: HolePhotoRound; pending: boolean; result?: HolePhoto | null; error: string | null;
  onChoose: (url: string) => void; onLibrary: (file: File) => void; onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent style={theme} className="hole-photo-fast hole-photo-fast-sheet">
    <div className="hole-photo-fast-grab" />
    <DialogTitle className="hole-photo-fast-title">Add a photo of the {holeOrdinal(hole)}</DialogTitle>
    <DialogDescription className="hole-photo-fast-lede">The hole is already set. Pick a picture and it is done.</DialogDescription>
      <div className="hole-photo-fast-pile">{photos.map(url => <Button key={url} variant="ghost" className="hole-photo-fast-photo" aria-label="Choose photograph" disabled={pending} onClick={() => onChoose(url)}><img src={url} alt="Your photograph" /></Button>)}</div>
      <input ref={input} type="file" accept="image/*" hidden disabled={pending} onChange={event => { const file = event.target.files?.[0]; if (file) onLibrary(file); event.target.value = ''; }} />
      <Button variant="ghost" className="hole-photo-fast-action" disabled={pending} onClick={() => input.current?.click()}>{pending ? <><Loader2 className="animate-spin" />Tagging</> : 'Choose from your library'}</Button>
    {error && <p role="alert" className="hole-photo-fast-lede">{error}</p>}
  </DialogContent></Dialog>;
}

export function HolePhotoBatchPath({ photos, rounds, memberId, courseId, knownHoles, onTag, onClose }: {
  photos: readonly BatchPhoto[]; rounds: readonly HolePhotoRound[]; memberId: string; courseId: string; knownHoles: readonly number[];
  onTag: (url: string, hole: number) => Promise<HolePhoto>; onClose: () => void;
}) {
  const [state, setState] = useState(startBatch);
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photo = photos[state.index];
  const advance = async () => {
    if (!photo || selected == null || selected < state.floor) return;
    setPending(true); setError(null);
    try {
      await onTag(photo.url, selected);
      const next = advanceBatch(state, photo.url, selected);
      setState(next); setSelected(null);
      if (next.index >= photos.length) onClose();
    } catch { setError('The photograph could not be tagged. The tag was not saved.'); }
    finally { setPending(false); }
  };
  const skip = () => { if (!photo) return; const next = advanceBatch(state, photo.url, null); setState(next); setSelected(null); setError(null); if (next.index >= photos.length) onClose(); };
  if (!photo) return null;
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent style={theme} className="hole-photo-fast hole-photo-fast-sheet">
    <div className="hole-photo-fast-grab" />
    <DialogTitle className="hole-photo-fast-title">Which hole is this?</DialogTitle>
    <DialogDescription className="hole-photo-fast-lede">{capitalPhotoCount(photos.length)} photos, oldest first. <strong>{capitalPhotoCount(state.index + 1)} of {spellPhotoCount(photos.length)}.</strong></DialogDescription>
    <div className="hole-photo-fast-thumbs">{photos.map((item, index) => <div key={item.url} className={`hole-photo-fast-photo ${index === state.index ? 'is-current' : ''}`}><img src={item.url} alt={index === state.index ? 'Current photograph' : 'Batch photograph'} />{state.tags[item.url] != null && <span className="hole-photo-fast-tag">{state.tags[item.url]}</span>}</div>)}</div>
    <HolePhotoPicker holeCount={knownHoles.length} knownHoleNumbers={knownHoles} floor={state.floor} selectedHole={selected} usedHoles={Object.values(state.tags)} onSelect={hole => { if (!pending) setSelected(hole); }} />
    {state.floor > 1 && <p className="hole-photo-fast-floor">The first <strong>{spellPhotoCount(closedHoleCount(state.floor))}</strong> are closed because your last photo was the <strong>{holeOrdinal(state.floor)}</strong>. You cannot walk backwards. <strong>Three photos on one hole is fine</strong> — the {holeOrdinal(state.floor)} stays open until you move past it.</p>}
    {error && <p role="alert" className="hole-photo-fast-lede">{error}</p>}
    <Button variant="ghost" className="hole-photo-fast-action" disabled={pending || selected == null} onClick={advance}>{pending && <Loader2 className="animate-spin" />}{state.index === photos.length - 1 ? 'Tag photo' : 'Next photo'}</Button>
    <Button variant="ghost" className="hole-photo-fast-action hole-photo-fast-skip" disabled={pending} onClick={skip}>Skip this one</Button>
  </DialogContent></Dialog>;
}