/** MEDIA_FAST_1 keeps the hole-known and batch surfaces separate. Parents own
 * real course rounds, complete sources and authoritative writes. URL-only sources
 * carry empty EXIF without downloading media (MEDIA_TAGFIX_1).
 * The known-hole path never renders HolePhotoPicker. Selecting a hole or a
 * thumbnail never writes; only Confirm tag calls onTag.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { HolePhotoPicker } from './HolePhotoPicker';
import { holeOrdinal } from '@/lib/courseMedia/holeWalk';
import { capitalPhotoCount, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { type BatchPhoto } from '@/lib/courseMedia/holePhotoBatch';
import type { HolePhotoRound } from '@/lib/courseMedia/holePhotoVerdict';
import { HoleMediaThumbnail } from './HoleMediaVideo';
import type { OwnMediaSource } from '@/lib/courseMedia/holePhotoData';
import { holePhotoErrorMessage } from '@/lib/courseMedia/holePhotoError';
import { addedMonthLabel } from '@/lib/courseMedia/addedMonth';
import { adminTagConfirmation, memberTagConfirmation } from '@/lib/courseMedia/holeTagConfirmation';
import { ordinal } from '@/lib/text/numbers';
import './hole-photo-fast.css';

const theme = { '--hole-walk-ink': A.INK, '--hole-walk-canvas': A.CANVAS, '--hole-walk-muted': A.MUTE, '--hole-walk-rule': A.BORDER, '--hole-walk-track': A.TRACK, '--hole-photo-panel': A.PANEL, '--hole-photo-success': A.IMPROVED, '--hole-walk-body': A.BODY, '--hole-walk-dim': A.DIM } as CSSProperties;

export function HoleKnownPhotoPath({ hole, photos, sources = [], pending, uploadProgress, error, onChoose, onLibrary, onClose }: {
  hole: number; photos: readonly string[]; sources?: readonly OwnMediaSource[]; round?: HolePhotoRound; pending: boolean; uploadProgress?: number | null; result?: HolePhoto | null; error: string | null;
  onChoose: (url: string) => void; onLibrary: (file: File) => void; onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent style={theme} className="hole-photo-fast hole-photo-fast-sheet" onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onPointerDownOutside={event => { if (pending) event.preventDefault(); }}>
    <DialogTitle className="hole-photo-fast-title">Add a photo or video of the {holeOrdinal(hole)}</DialogTitle>
    <DialogDescription className="hole-photo-fast-lede">The hole is already set. Pick a photo or video and it is done.</DialogDescription>
      <div className="hole-photo-fast-pile">{photos.map(url => { const source = sources.find(s => s.url === url); const video = source?.mediaType === 'video'; return <Button key={url} variant="ghost" className="hole-photo-fast-photo hole-media-preview" aria-label={video ? 'Choose video' : 'Choose photograph'} disabled={pending} onClick={() => onChoose(url)}><HoleMediaThumbnail url={url} {...source} alt={video ? 'Your video' : 'Your photograph'} /></Button>; })}</div>
      <input ref={input} type="file" accept="image/*,video/*" hidden disabled={pending} onChange={event => { const file = event.target.files?.[0]; if (file) onLibrary(file); event.target.value = ''; }} />
      <Button variant="ghost" className="hole-photo-fast-action" disabled={pending} onClick={() => input.current?.click()}>{pending ? <><Loader2 className="animate-spin" />{uploadProgress != null ? `Uploading ${uploadProgress}%` : 'Tagging'}</> : 'Choose from your library'}</Button>
    {error && <p role="alert" className="hole-photo-fast-lede">{error}</p>}
  </DialogContent></Dialog>;
}

/** BRIEF_HOLE_TAG_BATCH_V3: one large current shot, a single sideways row of
 * tappable thumbnails, a hole grid that only selects, and "Confirm tag" that
 * writes. The window stays open until closed; there is no Skip or Done. */
export function HolePhotoBatchPath({ photos, knownHoles, onTag, onClose, adminMode = false, existingHoleTags = [] }: {
  photos: readonly (BatchPhoto & Partial<OwnMediaSource> & { ownerName?: string })[]; rounds?: readonly HolePhotoRound[]; memberId?: string; courseId?: string; knownHoles: readonly number[]; adminMode?: boolean;
  /** The member's own non-rejected tags at this course, one entry per tag. */
  existingHoleTags?: readonly number[];
  onTag: (url: string, hole: number) => Promise<HolePhoto>; onClose: () => void;
}) {
  const [existing] = useState(() => [...existingHoleTags]);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(() => photos[0]?.url);
  const [tags, setTags] = useState<Readonly<Record<string, number>>>({});
  const [unavailable, setUnavailable] = useState<ReadonlySet<string>>(() => new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const thumbs = useRef(new Map<string, HTMLButtonElement>());
  const index = Math.max(0, photos.findIndex(p => p.url === currentUrl));
  const photo = photos[index];
  const done = (url: string, t = tags, u = unavailable) => t[url] != null || u.has(url);
  const allTagged = photos.length > 0 && photos.every(p => done(p.url));
  const nextUntagged = (from: number, t: Record<string, number>, u: ReadonlySet<string>) => {
    for (let step = 1; step <= photos.length; step++) {
      const candidate = photos[(from + step) % photos.length];
      if (candidate && !done(candidate.url, t, u)) return candidate.url;
    }
    return undefined;
  };
  useEffect(() => {
    if (currentUrl) thumbs.current.get(currentUrl)?.scrollIntoView?.({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [currentUrl]);
  const confirm = async () => {
    if (!photo || pending || selected == null || done(photo.url)) return;
    const hole = selected;
    setPending(true); setError(null);
    try {
      await onTag(photo.url, hole);
      const nextTags = { ...tags, [photo.url]: hole };
      setTags(nextTags);
      const count = existing.filter(h => h === hole).length + Object.values(nextTags).filter(h => h === hole).length;
      setConfirmation(adminMode ? adminTagConfirmation(hole, photo.ownerName) : memberTagConfirmation(hole, count));
      setSelected(null);
      const next = nextUntagged(index, nextTags, unavailable);
      if (next) setCurrentUrl(next);
    } catch (error) {
      setConfirmation(null);
      if (adminMode && typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        // Admin duplicates are stale list entries, not successful tags: mark
        // the shot unavailable (no badge) and move on by the same rule.
        const nextUnavailable = new Set(unavailable).add(photo.url);
        setUnavailable(nextUnavailable); setSelected(null); setError('That shot is already tagged.');
        const next = nextUntagged(index, tags, nextUnavailable);
        if (next) setCurrentUrl(next);
      } else {
        console.error('[hole-tag] failed', error); setError(holePhotoErrorMessage(error, `The ${photo.mediaType === 'video' ? 'video' : 'photo'} could not be tagged. The tag was not saved.`, photo.mediaType === 'video' ? 'video' : 'image'));
      }
    }
    finally { setPending(false); }
  };
  const choose = (url: string) => {
    if (pending || done(url) || url === currentUrl) return;
    setCurrentUrl(url); setSelected(null);
  };
  if (!photo) return null;
  const video = photo.mediaType === 'video';
  const canConfirm = !pending && !allTagged && selected != null && !done(photo.url);
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent style={theme} className="hole-photo-fast hole-photo-fast-sheet hole-photo-batch" onOpenAutoFocus={event => { event.preventDefault(); (event.currentTarget as HTMLElement | null)?.focus(); }} onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onPointerDownOutside={event => { if (pending) event.preventDefault(); }}>
    <div className="hole-photo-batch-top">
      <DialogTitle className="hole-photo-fast-title">Which hole is this?</DialogTitle>
      <button type="button" className="hole-photo-batch-close" aria-label="Close" disabled={pending} onClick={() => { if (!pending) onClose(); }}><X size={20} strokeWidth={2.5} /></button>
    </div>
    <DialogDescription className="hole-photo-fast-lede">{capitalPhotoCount(photos.length)} photos or videos, oldest first. Tap any one to tag it.</DialogDescription>
    <div className="hole-photo-batch-hero" data-hero={photo.url}>
      {video ? <HoleMediaThumbnail {...photo} alt="Current video" /> : <img src={photo.url} alt="Current photograph" />}
      <span className="hole-photo-batch-chip" data-chip>{`${index + 1} / ${photos.length}`}</span>
    </div>
    {adminMode && photo.ownerName && <p className="hole-photo-batch-owner">{[photo.ownerName, addedMonthLabel(photo.createdAt)].filter(Boolean).join(' \u00B7 ')}</p>}
    {confirmation && !error && <p role="status" aria-live="polite" className="hole-photo-batch-ok"><Check size={14} strokeWidth={3} style={{ color: A.IMPROVED }} aria-hidden="true" /><span>{confirmation}</span></p>}
    <div className="hole-photo-batch-strip" data-strip>
      <div className="hole-photo-batch-row">{photos.map((item, i) => {
        const hole = tags[item.url]; const gone = unavailable.has(item.url); const current = item.url === photo.url;
        return <button key={item.url} type="button" ref={el => { if (el) thumbs.current.set(item.url, el); else thumbs.current.delete(item.url); }}
          className={`hole-photo-batch-thumb${current ? ' is-current' : ''}${hole != null || gone ? ' is-done' : ''}`}
          aria-label={`Shot ${i + 1} of ${photos.length}${hole != null ? `, tagged to the ${ordinal(hole)}` : ''}`}
          aria-current={current ? 'true' : undefined} aria-disabled={hole != null || gone ? 'true' : undefined}
          data-tagged={hole ?? undefined} data-unavailable={gone || undefined}
          onClick={() => choose(item.url)}>
          <HoleMediaThumbnail {...item} alt="" />
          {hole != null && <span className="hole-photo-batch-badge">{hole}</span>}
        </button>;
      })}</div>
    </div>
    <HolePhotoPicker holeCount={knownHoles.length} knownHoleNumbers={knownHoles} selectedHole={selected} disabled={allTagged} onSelect={hole => { if (!pending && !allTagged && !done(photo.url)) setSelected(hole); }} />
    {error && <p role="alert" className="hole-photo-fast-lede">{error}</p>}
    <button type="button" className="hole-photo-batch-confirm" disabled={!canConfirm} data-enabled={canConfirm || undefined} onClick={() => { void confirm(); }}>{pending ? 'Tagging...' : allTagged ? 'All tagged' : 'Confirm tag'}</button>
  </DialogContent></Dialog>;
}
