/** Page 2 of the post wizard, rebuilt around golf (signed-off mock
 * post-page-signed-off.html). Presentation only: StageComposer owns state and
 * every write; rules live in lib/golfPostRules.ts.
 */
import { useEffect, useRef, useState } from 'react';
import { Pencil, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '@/lib/ui/haptics';
import { Button } from '@/components/ui/button';
import { ShotTagChoices } from '@/components/course-media-tab/ShotTagChoices';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import BottomSheet from '../BottomSheet';
import SlideThumb from '../SlideThumb';
import type { StageCourse, StageMediaItem } from '../../hooks/useStageComposer';
import {
  holeLine, isHoleTag, shotTagLabel, VISIBILITY_OPTIONS, MAX_PLAYED_WITH,
  type PostVisibility, type ShotTag, type WithCandidate,
} from '../../lib/golfPostRules';
import { PostCoursePhoto } from '../PostFlowChrome';
import { useCourseSearchPlaceholder } from '../../hooks/useCourseCatalogueCount';
import '@/styles/post-flow.css';
import { GP, chipStyle, labelAction, sectionLabel } from './golfPageTokens';

/* ---- MEDIA STRIP + HOLE LINE ------------------------------------------- */
/** Brief 23: every media tile carries an edit badge that opens the studio,
 * and a 300ms hold (≤8px travel) lifts a tile for drag-to-reorder. The strip
 * keeps no order of its own: drop calls onReorder(from, to) once and the
 * composer's state.media stays the single order source. */
const TILE_STEP = 100; // 92px tile + 8px gap
const HOLD_MS = 300;
const SLOP_PX = 8;
const EDGE_PX = 40;
const SLIDE = 'transform 180ms ease';
type Lift = { index: number; id: string; pointerId: number; startX: number; startY: number; startScroll: number; clientX: number; lifted: boolean };
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const capture = (el: Element, id: number) => { try { (el as HTMLElement).setPointerCapture?.(id); } catch { /* jsdom / stale pointer */ } };

export function GolfShotStrip({ media, tags, courseName, onTap, onAdd, onEdit, onReorder, visibility = 'anyone', personal = true, onVisibility }: {
  media: StageMediaItem[]; tags: Record<string, ShotTag>; courseName: string | null;
  onTap: (i: number) => void; onAdd: () => void; onEdit?: (i: number) => void; onReorder?: (from: number, to: number) => void;
  visibility?: PostVisibility; personal?: boolean; onVisibility?: () => void;
}) {
  const { t } = useTranslation('composer');
  const holes = media.filter((m) => isHoleTag(tags[m.id])).length;
  const line = holeLine(courseName, holes, visibility, personal);
  const stripRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<Lift | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeRef = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const [lift, setLift] = useState<Lift | null>(null);
  const [settle, setSettle] = useState<{ id: string; x: number; animate: boolean } | null>(null);
  const reduce = reducedMotion();

  const dxOf = (l: Lift) => l.clientX - l.startX + ((stripRef.current?.scrollLeft ?? 0) - l.startScroll);
  const slotOf = (l: Lift) => Math.max(0, Math.min(media.length - 1, l.index + Math.round(dxOf(l) / TILE_STEP)));
  const stopEdge = () => { if (edgeRef.current !== null) cancelAnimationFrame(edgeRef.current); edgeRef.current = null; };
  const clearHold = () => { if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = null; };
  const end = () => { clearHold(); stopEdge(); liftRef.current = null; setLift(null); };

  // Block the native pan while a tile is lifted (iOS WebKit honours a
  // non-passive touchmove preventDefault; touch-action alone is fixed at
  // gesture start and would let the strip scroll under the finger).
  useEffect(() => {
    const el = stripRef.current; if (!el) return;
    const block = (e: TouchEvent) => { if (liftRef.current?.lifted) e.preventDefault(); };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, []);
  useEffect(() => () => { clearHold(); stopEdge(); }, []);
  useEffect(() => {
    if (!settle || settle.animate) return;
    const raf = requestAnimationFrame(() => setSettle((s) => (s ? { ...s, x: 0, animate: true } : s)));
    const done = setTimeout(() => setSettle(null), 200);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [settle]);

  const edgeScroll = () => {
    stopEdge();
    const step = () => {
      const l = liftRef.current, el = stripRef.current;
      if (!l?.lifted || !el) { edgeRef.current = null; return; }
      const r = el.getBoundingClientRect();
      const dir = l.clientX < r.left + EDGE_PX ? -1 : l.clientX > r.right - EDGE_PX ? 1 : 0;
      if (!dir) { edgeRef.current = null; return; }
      el.scrollLeft += dir * 6;
      setLift({ ...l });
      edgeRef.current = requestAnimationFrame(step);
    };
    edgeRef.current = requestAnimationFrame(step);
  };

  const onPointerDown = (i: number, id: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onReorder || media.length < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const target = e.currentTarget;
    const l: Lift = { index: i, id, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startScroll: stripRef.current?.scrollLeft ?? 0, clientX: e.clientX, lifted: false };
    liftRef.current = l;
    clearHold();
    timerRef.current = setTimeout(() => {
      const cur = liftRef.current; if (!cur || cur.pointerId !== l.pointerId) return;
      cur.lifted = true; capture(target, cur.pointerId); triggerHaptic('light'); setLift({ ...cur });
    }, HOLD_MS);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const l = liftRef.current; if (!l || l.pointerId !== e.pointerId) return;
    l.clientX = e.clientX;
    if (!l.lifted) {
      if (Math.hypot(e.clientX - l.startX, e.clientY - l.startY) > SLOP_PX) { clearHold(); liftRef.current = null; }
      return;
    }
    e.preventDefault();
    setLift({ ...l });
    const el = stripRef.current;
    if (el && edgeRef.current === null) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (e.clientX < r.left + EDGE_PX || e.clientX > r.right - EDGE_PX)) edgeScroll();
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const l = liftRef.current; if (!l || l.pointerId !== e.pointerId) return;
    if (l.lifted) {
      suppressClick.current = true;
      l.clientX = e.clientX;
      const to = slotOf(l);
      const residual = dxOf(l) - (to - l.index) * TILE_STEP;
      end();
      if (to !== l.index) onReorder?.(l.index, to);
      if (!reduce) setSettle({ id: l.id, x: residual, animate: false });
      return;
    }
    end();
  };
  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const l = liftRef.current; if (!l || l.pointerId !== e.pointerId) return;
    if (l.lifted) suppressClick.current = true;
    end();
  };
  const tap = (fn: () => void) => { if (suppressClick.current) { suppressClick.current = false; return; } fn(); };

  const liftSlot = lift?.lifted ? slotOf(lift) : null;
  const shiftFor = (j: number) => {
    if (!lift?.lifted || liftSlot === null || j === lift.index) return 0;
    if (lift.index < j && j <= liftSlot) return -TILE_STEP;
    if (liftSlot <= j && j < lift.index) return TILE_STEP;
    return 0;
  };

  return (
    <>
      <div ref={stripRef} data-testid="golf-strip" style={{ display: 'flex', gap: 8, padding: '10px 16px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {media.map((m, i) => {
          const tag = tags[m.id];
          const kind = m.type === 'video' ? 'video' : 'photo';
          const isLifted = !!lift?.lifted && lift.index === i;
          const settling = settle?.id === m.id ? settle : null;
          const x = isLifted ? dxOf(lift!) : settling ? settling.x : shiftFor(i);
          const transform = `translateX(${x}px)${isLifted && !reduce ? ' scale(1.06)' : ''}`;
          const transition = reduce || isLifted || (settling && !settling.animate) ? 'none' : SLIDE;
          return (
            <div key={m.id} role="button" tabIndex={0} aria-label={`Photo ${i + 1}`} data-testid="strip-tile" data-media-id={m.id} data-lifted={isLifted || undefined}
              onClick={() => tap(() => onTap(i))}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(i); } }}
              onPointerDown={onPointerDown(i, m.id)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                position: 'relative', flex: 'none', width: 92, height: 116, borderRadius: 14, overflow: 'hidden', border: 0, padding: 0, cursor: 'pointer', background: GP.panel,
                transform, transition, zIndex: isLifted ? 3 : settling ? 2 : undefined,
                boxShadow: isLifted && !reduce ? '0 12px 28px rgba(0,0,0,0.55)' : undefined,
                outline: isLifted ? `1.5px solid ${GP.ink}` : undefined, outlineOffset: 0,
                touchAction: 'pan-x', WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none',
              } as React.CSSProperties}>
              <SlideThumb item={m} glyph={22} />
              {courseName && (
                <span data-testid="shot-chip" data-tagged={!!tag || undefined} style={{
                  position: 'absolute', left: 6, right: 38, bottom: 6, height: 26, borderRadius: 8, fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, whiteSpace: 'nowrap',
                  background: 'var(--composer-tag-glass)',
                  border: `1px ${tag ? 'solid' : 'dashed'} var(--composer-tag-edge)`, color: tag ? GP.ink : GP.mute,
                }}>{tag ? shotTagLabel(tag) : '+ Tag'}</span>
              )}
              <button type="button" data-testid="strip-edit" aria-label={`Edit ${kind} ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); tap(() => (onEdit ?? onTap)(i)); }}
                style={{
                  position: 'absolute', right: 6, bottom: 6, width: 26, height: 26, borderRadius: '50%', padding: 0, cursor: 'pointer',
                  display: 'grid', placeItems: 'center', background: 'rgba(10,10,12,0.62)',
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.16)', zIndex: 1,
                } as React.CSSProperties}>
                <Pencil size={13} color={GP.ink} strokeWidth={2.4} aria-hidden />
              </button>
            </div>
          );
        })}
        <button type="button" aria-label="Add" onClick={onAdd} style={{ flex: 'none', width: 92, height: 116, borderRadius: 14, border: `1.5px dashed ${GP.line2}`, background: 'transparent', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', color: GP.mute, fontSize: 26, cursor: 'pointer' }}>+</button>
      </div>
      {media.length >= 2 && (
        <p data-testid="reorder-hint" style={{ margin: '10px 16px 0', fontSize: 12.5, color: GP.mute, lineHeight: 1.45 }}>{t('golfStrip.reorderHint', { defaultValue: 'Hold and drag to reorder.' })}</p>
      )}
      {line && (
        <div data-testid="hole-line" style={{ padding: `${media.length >= 2 ? 6 : 10}px 16px 0`, fontSize: 12.5, color: GP.mute, lineHeight: 1.45 }}>
          {line.visibilityAction ? <Button variant="ghost" className="pf4-hole-audience" onClick={onVisibility}>Hole pages only show posts everyone can see. Change <strong>Who can see this</strong> to Everyone to add your {holes} hole {holes === 1 ? 'shot' : 'shots'}.</Button> : <>{line.count && <b style={{ color: GP.ink, fontWeight: 600 }}>{line.count}</b>}{line.text}</>}
        </div>
      )}
    </>
  );
}

/* ---- WHAT'S IN THIS SHOT? ---------------------------------------------- */
export function ShotTagSheet({ open, item, courses, courseIndex, onCourseIndex, holes, tag, onChoose, onClose, onEditPhoto }: {
  open: boolean; item: StageMediaItem | null; courses: StageCourse[]; courseIndex: number; onCourseIndex: (i: number) => void;
  holes: readonly number[]; tag: ShotTag | null; onChoose: (t: ShotTag | null) => void; onClose: () => void; onEditPhoto: () => void;
}) {
  const course = courses[courseIndex] ?? courses[0];
  return (
    <BottomSheet open={open && !!item} onClose={onClose}>
      <div data-testid="shot-tag-sheet" style={{ padding: '0 16px 30px', color: GP.ink }}>
        {courses.length > 1 && (
          <div role="tablist" aria-label="Course" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14 }}>
            {courses.map((c, i) => (
              <button key={c.id} role="tab" aria-selected={i === courseIndex} type="button" onClick={() => onCourseIndex(i)} style={chipStyle(i === courseIndex)}>{c.name}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ position: 'relative', width: 64, height: 80, borderRadius: 12, overflow: 'hidden', flex: 'none' }}>{item && <SlideThumb item={item} glyph={0} />}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>What's in this shot?</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: GP.mute }}>{course?.name}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => { onClose(); onEditPhoto(); }}
            style={{ ...chipStyle(false), height: 32, padding: '0 12px', fontSize: 12.5, fontWeight: 700 }}>Edit photo</Button>
        </div>
        <div style={{ marginTop: 18 }}>
          <ShotTagChoices
            holes={holes}
            hole={tag && isHoleTag(tag) ? tag.hole : null}
            onHole={(h) => onChoose({ hole: h })}
            place={tag && !isHoleTag(tag) ? tag.place : null}
            onPlace={(p) => onChoose({ place: p })}
          />
        </div>
        {tag && (
          <button type="button" onClick={() => onChoose(null)} style={{ ...chipStyle(false), marginTop: 16, width: '100%', justifyContent: 'center' }}>Clear tag</button>
        )}
      </div>
    </BottomSheet>
  );
}

/* ---- WHERE ------------------------------------------------------------- */
const tick = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GP.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5 9-10" /></svg>;

export function WhereSection({ course, reason, changing, recent, onChange, onCancel, onUntag, onSearch, onPick }: {
  course: StageCourse | null; reason: string | null; changing: boolean; recent: StageCourse[];
  onChange: () => void; onCancel: () => void; onUntag: () => void; onSearch: () => void; onPick: (c: StageCourse) => void;
}) {
  const placeholder = useCourseSearchPlaceholder();
  if (course && !changing) {
    return (
      <div data-testid="where-section" style={{ margin: '18px 16px 0' }}>
        <div style={sectionLabel}><span>Where</span><button type="button" style={labelAction} onClick={onChange}>Change</button></div>
        <div data-testid="where-card" style={{ display: 'flex', alignItems: 'center', gap: 12, background: GP.panel, border: `1px solid ${GP.line}`, borderRadius: 16, padding: 12 }}>
          <PostCoursePhoto course={course} size={44} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: GP.ink }}>{course.name}</div>
            <div data-testid="where-reason" style={{ fontSize: 12, color: GP.mute, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              {reason ? <>{tick}{reason}</> : 'Tagged'}
            </div>
          </div>
          <button type="button" aria-label="Remove course" onClick={onUntag} style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', flex: 'none' }}>
            <X size={12} color={GP.ink} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    );
  }
  return (
    <div data-testid="where-section" style={{ margin: '18px 16px 0' }}>
      <div style={sectionLabel}><span>Where</span>{course && <button type="button" style={labelAction} onClick={onCancel}>Cancel</button>}</div>
      <button type="button" onClick={onSearch} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, height: 46, borderRadius: 14, background: GP.panel, border: `1px solid ${GP.line}`, padding: '0 14px', color: GP.dim, fontSize: 14.5, marginBottom: 10, cursor: 'pointer' }}>
        <Search size={16} color={GP.dim} strokeWidth={2.4} />{placeholder}
      </button>
      {recent.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {recent.map((c) => <button key={c.id} type="button" style={chipStyle(false)} onClick={() => onPick(c)}>+ {c.name}</button>)}
        </div>
      )}
    </div>
  );
}

/* ---- PLAYED WITH ------------------------------------------------------- */
/** PF4 + post-flow-round-played-with mock. Inline search reuses the mention
 * member source. iOS: a result tap first blurs the input, so the list never
 * collapses on blur; it closes on a tap outside the section, on Escape, and a
 * result selects on pointer-up from a container that prevents the blur.
 * Added people stay listed as "Added"; caption mentions (resolved by the
 * caller) are offered as one-tap adds. Nothing is written into the caption. */
const addedTick = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5 9-10" /></svg>;
export function PlayedWithSection({ suggestions, tagged, onToggle, search, selfId, mentioned = [], onActiveChange }: {
  suggestions: WithCandidate[]; tagged: WithCandidate[]; onToggle: (p: WithCandidate) => void;
  search: (q: string) => Promise<WithCandidate[]>; selfId: string | null;
  mentioned?: WithCandidate[]; onActiveChange?: (active: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const pointerPicked = useRef(false);
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<WithCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const limited = tagged.length >= MAX_PLAYED_WITH;
  const activeRef = useRef(onActiveChange); activeRef.current = onActiveChange;
  useEffect(() => { activeRef.current?.(focused); }, [focused]);
  useEffect(() => () => { activeRef.current?.(false); }, []);
  useEffect(() => {
    if (!focused) return;
    const outside = (e: Event) => { if (!sectionRef.current?.contains(e.target as Node)) setFocused(false); };
    document.addEventListener('pointerdown', outside, true);
    const frame = requestAnimationFrame(() => sectionRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }));
    return () => { document.removeEventListener('pointerdown', outside, true); cancelAnimationFrame(frame); };
  }, [focused]);
  useEffect(() => {
    if (!focused || !query.trim() || limited) { setResults([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setResults([]);
    const timer = setTimeout(() => {
      void search(query).then(rows => { if (!cancelled) setResults(rows); }).catch(() => { if (!cancelled) setResults([]); }).finally(() => { if (!cancelled) setLoading(false); });
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, focused, limited, search]);
  const isAdded = (id: string) => tagged.some(t => t.id === id);
  const mentionIds = new Set(mentioned.map(m => m.id));
  const shown = (query.trim() ? results : suggestions).filter(p => p.id !== selfId);
  const offers = mentioned.filter(p => p.id !== selfId && !isAdded(p.id));
  const add = (p: WithCandidate) => { if (isAdded(p.id) || limited) return; onToggle(p); setQuery(''); inputRef.current?.focus(); };
  const avatar = (p: WithCandidate, size: number) => <SquircleAvatar src={p.avatarUrl} alt="" fallback={getInitialsFromName(p.name)} userId={p.id} size={size} hairlineRing ringColor={DARK_HAIRLINE}/>;
  return <section ref={sectionRef} data-testid="played-with" className="composer-golf pf4-with" style={{ scrollMarginTop: 72 }} onKeyDown={e => { if (e.key === 'Escape') setFocused(false); }}>
    <div className="composer-golf-head"><span className="composer-golf-kicker">Played with</span>{focused && <span className="pf4-with-limit">{tagged.length} of {MAX_PLAYED_WITH}</span>}</div>
    <label className="pf4-with-input"><Search size={17} aria-hidden="true"/><input ref={inputRef} aria-label="Who did you play with?" placeholder={limited ? '8 people tagged' : 'Who did you play with?'} disabled={limited} value={query} onFocus={() => setFocused(true)} onChange={e => setQuery(e.target.value)}/></label>
    {focused && !limited && (shown.length > 0 || loading || !!query.trim()) && <div className="pf4-with-results" aria-busy={loading} onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()}>
      {loading ? <div role="status" style={{ fontSize: 13, color: GP.mute, padding: 12 }}>Searching…</div> : !shown.length ? <div role="status" style={{ fontSize: 13, color: GP.mute, padding: 12, overflowWrap: 'anywhere' }}>No golfers match "{query}"</div> : shown.map(p => { const added = isAdded(p.id); return <Button variant="ghost" className="pf4-with-result" key={p.id} data-added={added || undefined} aria-disabled={added || undefined}
        onPointerUp={() => { pointerPicked.current = true; add(p); }}
        onClick={() => { if (pointerPicked.current) { pointerPicked.current = false; return; } add(p); }}>
        {avatar(p, 34)}
        <span className="pf4-with-person"><b>{p.name}{mentionIds.has(p.id) && <span className="pf4-with-tagcap">IN CAPTION</span>}</b><small>{[p.username ? `@${p.username}` : null, p.homeClub].filter(Boolean).join(' · ')}</small></span>
        {added ? <span className="pf4-with-done">{addedTick}Added</span> : <span className="pf4-with-add">Add</span>}
      </Button>; })}
    </div>}
    {offers.length > 0 && !limited && <div className="pf4-with-sugg" data-testid="with-mentions"><small>Mentioned in your caption</small><div className="pf4-with-chips" style={{ marginTop: 0 }}>{offers.map(p => <button type="button" className="pf4-with-offer" key={p.id} data-offer={p.id} onClick={() => add(p)}>{avatar(p, 26)}<span><span className="pf4-with-plus">+</span>{p.name}</span></button>)}</div></div>}
    {tagged.length > 0 && <>
      <div className="pf4-with-selhead"><span><b>{tagged.length} played with you</b></span><span>Up to {MAX_PLAYED_WITH}</span></div>
      <div className="pf4-with-chips" style={{ marginTop: 8 }}>{tagged.map(p => <div className="pf4-with-chip" key={p.id} data-chip={p.id}>
        {avatar(p, 26)}<span>{p.name}</span>
        <Button variant="ghost" className="pf4-with-remove" aria-label={`Remove ${p.name}`} onClick={() => onToggle(p)}><X size={12}/></Button>
      </div>)}</div>
    </>}
  </section>;
}

export function FindSomeoneSheet({ open, onClose, search, onPick }: {
  open: boolean; onClose: () => void; search: (q: string) => Promise<WithCandidate[]>; onPick: (p: WithCandidate) => void;
}) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<WithCandidate[]>([]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => { const r = await search(q); if (!cancelled) setRows(r); }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, open, search]);
  return (
    <BottomSheet open={open} onClose={onClose} title="Find someone">
      <div style={{ padding: '0 16px 24px' }}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" aria-label="Search members"
          style={{ width: '100%', height: 46, borderRadius: 14, background: GP.panel, border: `1px solid ${GP.line}`, padding: '0 14px', color: GP.ink, fontSize: 15, caretColor: GP.ink, outline: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
          {rows.map((p) => (
            <button key={p.id} type="button" onClick={() => { onPick(p); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', background: 'transparent', border: 0, color: GP.ink, cursor: 'pointer', textAlign: 'left' }}>
              <SquircleAvatar src={p.avatarUrl} alt={p.name} userId={p.id} size={32} hairlineRing ringColor={DARK_HAIRLINE} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

/* ---- WHO CAN SEE THIS -------------------------------------------------- */
export function VisibilitySheet({ open, value, onChange, onClose }: { open: boolean; value: PostVisibility; onChange: (v: PostVisibility) => void; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Who can see this">
      <div role="radiogroup" style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {VISIBILITY_OPTIONS.map((o) => (
          <button key={o.value} role="radio" aria-checked={value === o.value} type="button" onClick={() => { onChange(o.value); onClose(); }}
            style={{ ...chipStyle(value === o.value), height: 48, justifyContent: 'flex-start', padding: '0 16px', fontSize: 15 }}>{o.label}</button>
        ))}
      </div>
    </BottomSheet>
  );
}
