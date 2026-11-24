/** Feed-card pieces for the golf post page: the Played with chip/panel/sheet
 * (Option C: media chip, no-media name-row faces and byline, viewer chip), the
 * per-slide course tag chip and a tagged member's "Remove me". Data arrives
 * batched from the host feed (usePostGolfTags); nothing here reads per card,
 * except Remove me's own delete.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BottomSheet from '@/features/post-v2/components/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { slideChip, withLine, withNames, type SlideTag } from '@/features/post-v2/lib/golfPostRules';
import { removeMeFromPost } from '@/features/post-v2/lib/postWith';
import { removeMeFromReview } from '@/features/review-v2/lib/reviewWith';
import { toast } from '@/lib/toast';
import { CHIP_GLASS } from '@/lib/tokens/glass';
import './played-with.css';

const WITH_COLOUR = 'rgba(248,250,252,0.62)';
const INK = '#F8FAFC';

/** `kind` 'business' = an @mentioned business (logo face, business profile);
 *  absent/'user' = a member. `userId` holds the entity id either way. */
export interface PlayedWithPerson { userId: string; name: string; username?: string | null; avatarUrl?: string | null; kind?: 'user' | 'business' }
const entityKey = (p: PlayedWithPerson) => `${p.kind ?? 'user'}:${p.userId}`;
/** A face: members pass userId (canonical fallback key); businesses pass none. */
function EntityFace({ p, size }: { p: PlayedWithPerson; size: number }) {
  return <SquircleAvatar src={p.avatarUrl ?? null} alt={p.name} userId={p.kind === 'business' ? undefined : p.userId} size={size} hairlineRing />;
}

/** Media pill/panel bottom offsets, defined in played-with.css (FEED MEDIA
 *  CHROME): the pill sits bottom-left at 12px; beside a video's 36px mute it
 *  is vertically centred on that row (15px) and its max-width leaves room. */
export type PlayedWithOffset = 'media' | 'media-video' | 'review' | 'review-video';
/** A hole/place chip sits 8px above the 30px played-with chip. */
export const PLAYED_WITH_LIFTED_BOTTOM = 50;

const GLASS_BLUR = 'blur(18px) saturate(150%)';

/** Up to three faces, each overlapping the previous by 6px. The canonical
 *  hairline is the only ring (no extra boxShadow ring, FEED MEDIA CHROME §4). */
function Faces({ people, size }: { people: ReadonlyArray<PlayedWithPerson>; size: number }) {
  return (
    <span data-played-with-faces style={{ display: 'inline-flex', alignItems: 'center', flex: 'none' }}>
      {people.slice(0, 3).map((p, i) => (
        <span key={entityKey(p)} data-played-with-face style={{ display: 'inline-flex', borderRadius: '34%', marginLeft: i === 0 ? 0 : -6 }}>
          <EntityFace p={p} size={size} />
        </span>
      ))}
    </span>
  );
}

function useEscape(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);
}

export function PlayedWithChip({ people, expanded, onToggle, style, offset }: { people: ReadonlyArray<PlayedWithPerson>; expanded: boolean; onToggle: () => void; style?: React.CSSProperties; offset?: PlayedWithOffset }) {
  const text = withLine(people.map((p) => p.name));
  if (!text) return null;
  return (
    <button
      type="button"
      data-testid="played-with-chip"
      data-pw-offset={offset}
      aria-expanded={expanded}
      aria-label={`Played with: ${people.map((p) => p.name).join(', ')}`}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(); }}
      style={{
        position: 'absolute', left: 12, zIndex: 20, height: 30, padding: '0 12px 0 4px', borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box',
        ...CHIP_GLASS, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#FFFFFF',
        whiteSpace: 'nowrap', cursor: 'pointer', pointerEvents: 'auto', ...style,
      }}
    >
      <Faces people={people} size={22} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{text}</span>
    </button>
  );
}

export function PlayedWithPanel({ people, onClose, onOpenProfile, style, panelRef, offset, exploreHeadingInk = false }: { people: ReadonlyArray<PlayedWithPerson>; onClose: () => void; onOpenProfile: (userId: string, kind?: 'user' | 'business') => void; style?: React.CSSProperties; panelRef?: React.Ref<HTMLDivElement>; offset?: PlayedWithOffset; exploreHeadingInk?: boolean }) {
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Played with"
      data-testid="played-with-panel"
      data-pw-offset={offset}
      onClick={stop} onDoubleClick={stop} onPointerDown={stop} onTouchStart={stop}
      style={{
        position: 'absolute', left: 12, zIndex: 21, width: 'min(300px, calc(100% - 24px))', boxSizing: 'border-box',
        borderRadius: 16, padding: '6px 6px 6px 12px', background: 'rgba(22,22,26,0.55)', backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
        border: '1px solid rgba(255,255,255,0.16)', color: INK, pointerEvents: 'auto', textAlign: 'left', ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 2px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: WITH_COLOUR, ...(exploreHeadingInk ? { color: INK } : {}) }}>PLAYED WITH</span>
        <button type="button" aria-label="Close" data-testid="played-with-close" onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ width: 28, height: 28, borderRadius: '50%', border: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: INK, background: 'rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
      </div>
      <div role="list" style={{ maxHeight: 4 * 44, overflowY: 'auto' }}>
        {people.map((p) => (
          <button type="button" role="listitem" key={entityKey(p)} data-played-with-row data-tag-kind={p.kind ?? 'user'} onClick={(e) => { e.stopPropagation(); onOpenProfile(p.userId, p.kind ?? 'user'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, paddingRight: 6, width: '100%', background: 'transparent', border: 0, padding: '0 6px 0 0', color: INK, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
            <EntityFace p={p} size={30} />
            <span style={{ minWidth: 0, flex: 1, display: 'block' }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              {p.username ? <span style={{ display: 'block', fontSize: 12, color: 'rgba(248,250,252,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username}</span> : null}
            </span>
            <span aria-hidden style={{ fontSize: 16, fontWeight: 700, color: WITH_COLOUR }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The chip and its in-place panel on a media container. Outside taps on the
 *  media close the panel and are swallowed (no like, no full-screen open);
 *  `resetKey` (the visible slide) closes it on swipe; leaving the screen
 *  closes it. */
export function PlayedWithMediaOverlay({ people, onOpenProfile, resetKey, offset = 'media' }: { people: ReadonlyArray<PlayedWithPerson>; onOpenProfile: (userId: string, kind?: 'user' | 'business') => void; resetKey?: unknown; offset?: PlayedWithOffset }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useEscape(open, close);
  useEffect(() => { setOpen(false); }, [resetKey]);
  useEffect(() => {
    const host = anchor.current?.parentElement;
    if (!open || !host) return;
    const swallow = (e: Event) => {
      if (panel.current?.contains(e.target as Node)) return;
      e.stopPropagation(); e.preventDefault(); setOpen(false);
    };
    host.addEventListener('click', swallow, true);
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => { if (entries.some((x) => !x.isIntersecting)) setOpen(false); });
      io.observe(host);
    }
    return () => { host.removeEventListener('click', swallow, true); io?.disconnect(); };
  }, [open]);
  if (!people.length) return null;
  return (
    <>
      <span ref={anchor} hidden aria-hidden data-played-with-anchor />
      {open
        ? <PlayedWithPanel people={people} onClose={close} onOpenProfile={(id, kind) => { setOpen(false); onOpenProfile(id, kind); }} panelRef={panel} offset={offset} />
        : <PlayedWithChip people={people} expanded={false} onToggle={() => setOpen(true)} offset={offset} />}
    </>
  );
}

/** Full-screen viewer: a static chip in the bottom stack; the panel opens
 *  above it, aligned to the author block. Key it by post so paging closes it. */
export function PlayedWithViewerChip({ people, onOpenProfile, style, exploreHeadingInk = false }: { people: ReadonlyArray<PlayedWithPerson>; onOpenProfile: (userId: string, kind?: 'user' | 'business') => void; style?: React.CSSProperties; exploreHeadingInk?: boolean }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useEscape(open, close);
  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => {
      if (wrap.current?.contains(e.target as Node)) return;
      e.stopPropagation(); e.preventDefault(); setOpen(false);
    };
    document.addEventListener('click', outside, true);
    return () => document.removeEventListener('click', outside, true);
  }, [open]);
  if (!people.length) return null;
  return (
    <div ref={wrap} data-fullscreen-played-with style={{ position: 'relative', alignSelf: 'flex-start', marginTop: 8, maxWidth: '100%', minWidth: 0, pointerEvents: 'auto', ...style }}>
      <PlayedWithChip people={people} expanded={open} onToggle={() => setOpen((v) => !v)} style={{ position: 'relative', left: 0, bottom: 'auto', display: 'inline-flex', maxWidth: '100%', zIndex: 'auto' }} />
      {open && (
        <PlayedWithPanel people={people} exploreHeadingInk={exploreHeadingInk} onClose={close} onOpenProfile={(id, kind) => { setOpen(false); onOpenProfile(id, kind); }}
          style={{ left: 0, bottom: 'calc(100% + 8px)', width: 'min(300px, calc(100vw - 24px))' }} />
      )}
    </div>
  );
}

/** The "Played with" BottomSheet (no-media posts). */
export function PlayedWithSheet({ open, people, onClose, onOpenProfile }: { open: boolean; people: ReadonlyArray<PlayedWithPerson>; onClose: () => void; onOpenProfile: (userId: string, kind?: 'user' | 'business') => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Played with">
      <div role="list" data-testid="played-with-sheet" style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column' }}>
        {people.map((p) => (
          <button type="button" role="listitem" key={entityKey(p)} data-played-with-row data-tag-kind={p.kind ?? 'user'} onClick={(e) => { e.stopPropagation(); onClose(); onOpenProfile(p.userId, p.kind ?? 'user'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, background: 'transparent', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }}>
            <EntityFace p={p} size={36} />
            <span style={{ minWidth: 0, flex: 1, display: 'block' }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              {p.username ? <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(248,250,252,0.42)' }}>@{p.username}</span> : null}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

/** No-media name-row faces: 20px, 6px after the name, never squeezing it. */
export function PlayedWithNameFaces({ people, onOpen }: { people: ReadonlyArray<PlayedWithPerson>; onOpen: () => void }) {
  if (!people.length) return null;
  return (
    <span role="button" tabIndex={0} data-testid="played-with-name-faces" aria-label={`Played with: ${people.map((p) => p.name).join(', ')}`}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpen(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onOpen(); } }}
      style={{ display: 'inline-flex', flex: 'none', marginLeft: 6, cursor: 'pointer', alignSelf: 'center' }}>
      <Faces people={people} size={20} />
    </span>
  );
}

/** No-media byline: "with <b>A</b>, <b>B</b> and <b>C</b> · " + the existing byline. */
export function PlayedWithByline({ people, onOpen, tail, style }: { people: ReadonlyArray<PlayedWithPerson>; onOpen: () => void; tail?: React.ReactNode; style?: React.CSSProperties }) {
  const { shown, others } = withNames(people.map((p) => p.name));
  if (!shown.length) return <>{tail}</>;
  const b = (n: string, k: number) => <b key={k} style={{ fontWeight: 600, color: INK }}>{n}</b>;
  const parts: React.ReactNode[] = ['with '];
  if (shown.length === 1) parts.push(b(shown[0], 0));
  else if (others > 0) parts.push(b(shown[0], 0), ', ', b(shown[1], 1), ` and ${others} others`);
  else if (shown.length === 2) parts.push(b(shown[0], 0), ' and ', b(shown[1], 1));
  else parts.push(b(shown[0], 0), ', ', b(shown[1], 1), ' and ', b(shown[2], 2));
  return (
    <span data-testid="played-with-byline" style={{ display: 'block', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...style }}>
      <span role="button" tabIndex={0} data-played-with-open onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpen(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onOpen(); } }}
        style={{ cursor: 'pointer' }}>{parts}</span>
      {tail != null && tail !== '' && tail !== false ? <>{' · '}{tail}</> : null}
    </span>
  );
}

/** A slide's place tag on media, on the shared chip glass. A HOLE tag never
 *  renders here: holes have ONE chip, HoleChip (FEED MEDIA CHROME §1). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SlideTagChip({ tag, lifted: _lifted }: { tag: SlideTag | null | undefined; lifted?: boolean }) {
  if (tag?.hole != null) return null;
  const label = slideChip(tag);
  if (!label) return null;
  return (
    <span
      data-testid="slide-tag-chip"
      style={{
        // FOLLOW-UP RULINGS §2(5): the hole chip's place and geometry (left/top 12,
        // 28px, 0 10px, radius 9). A shot carries a hole or a place, never both;
        // the place chip never expands. `lifted` is kept for callers and unused.
        position: 'absolute', left: 12, top: 12, zIndex: 4, height: 28, padding: '0 10px', borderRadius: 9, boxSizing: 'border-box',
        ...CHIP_GLASS, fontSize: 12, fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none',
      }}
    >{label}</span>
  );
}

export function RemoveMeMenu({ postId, memberId, reviewId }: { postId: string; memberId: string; reviewId?: string }) {
  const qc = useQueryClient();
  const remove = async () => {
    try {
      if (reviewId) await removeMeFromReview(reviewId, memberId);
      else await removeMeFromPost(postId, memberId);
      qc.invalidateQueries({ queryKey: ['post-golf-tags'] });
      toast.success(reviewId ? 'Removed from this review' : 'Removed from this post');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : reviewId ? "You couldn't be removed from this review." : "You couldn't be removed from this post.");
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Post options" onClick={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 0, padding: 0, color: WITH_COLOUR, cursor: 'pointer', display: 'flex' }}>
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => void remove()}>Remove me</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
