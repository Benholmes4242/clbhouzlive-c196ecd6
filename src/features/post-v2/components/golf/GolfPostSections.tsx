/** Page 2 of the post wizard, rebuilt around golf (signed-off mock
 * post-page-signed-off.html). Presentation only: StageComposer owns state and
 * every write; rules live in lib/golfPostRules.ts.
 */
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
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
export function GolfShotStrip({ media, tags, courseName, onTap, onAdd, visibility = 'anyone', personal = true, onVisibility }: {
  media: StageMediaItem[]; tags: Record<string, ShotTag>; courseName: string | null;
  onTap: (i: number) => void; onAdd: () => void; visibility?: PostVisibility; personal?: boolean; onVisibility?: () => void;
}) {
  const holes = media.filter((m) => isHoleTag(tags[m.id])).length;
  const line = holeLine(courseName, holes, visibility, personal);
  return (
    <>
      <div data-testid="golf-strip" style={{ display: 'flex', gap: 8, padding: '10px 16px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {media.map((m, i) => {
          const tag = tags[m.id];
          return (
            <button key={m.id} type="button" aria-label={`Photo ${i + 1}`} onClick={() => onTap(i)}
              style={{ position: 'relative', flex: 'none', width: 92, height: 116, borderRadius: 14, overflow: 'hidden', border: 0, padding: 0, cursor: 'pointer', background: GP.panel }}>
              <SlideThumb item={m} glyph={22} />
              {courseName && (
                <span data-testid="shot-chip" data-tagged={!!tag || undefined} style={{
                  position: 'absolute', left: 6, right: 6, bottom: 6, height: 24, borderRadius: 8, fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, whiteSpace: 'nowrap',
                  background: 'var(--composer-tag-glass)',
                  border: `1px ${tag ? 'solid' : 'dashed'} var(--composer-tag-edge)`, color: tag ? GP.ink : GP.mute,
                }}>{tag ? shotTagLabel(tag) : '+ Tag'}</span>
              )}
            </button>
          );
        })}
        <button type="button" aria-label="Add" onClick={onAdd} style={{ flex: 'none', width: 92, height: 116, borderRadius: 14, border: `1.5px dashed ${GP.line2}`, background: 'transparent', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', color: GP.mute, fontSize: 26, cursor: 'pointer' }}>+</button>
      </div>
      {line && (
        <div data-testid="hole-line" style={{ padding: '10px 16px 0', fontSize: 12.5, color: GP.mute, lineHeight: 1.45 }}>
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
/** PF4: inline search reuses the mention member source; chosen ids never appear in results. */
export function PlayedWithSection({ suggestions, tagged, onToggle, search, selfId }: {
  suggestions: WithCandidate[]; tagged: WithCandidate[]; onToggle: (p: WithCandidate) => void;
  search: (q: string) => Promise<WithCandidate[]>; selfId: string | null;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<WithCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const limited = tagged.length >= MAX_PLAYED_WITH;
  useEffect(() => {
    if (!focused || !query.trim() || limited) { setResults([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setResults([]);
    const timer = setTimeout(() => {
      void search(query).then(rows => { if (!cancelled) setResults(rows); }).catch(() => { if (!cancelled) setResults([]); }).finally(() => { if (!cancelled) setLoading(false); });
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, focused, limited, search]);
  const shown = (query.trim() ? results : suggestions).filter(p => p.id !== selfId && !tagged.some(t => t.id === p.id));
  return <section data-testid="played-with" className="composer-golf pf4-with" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}>
    <div className="composer-golf-head"><span className="composer-golf-kicker">Played with</span>{focused && <span className="pf4-with-limit">Up to 8</span>}</div>
    <label className="pf4-with-input"><Search size={17} aria-hidden="true"/><input ref={inputRef} aria-label="Who did you play with?" placeholder={limited ? '8 people tagged' : 'Who did you play with?'} disabled={limited} value={query} onFocus={() => setFocused(true)} onChange={e => setQuery(e.target.value)}/></label>
    {focused && !limited && (shown.length > 0 || loading || !!query.trim()) && <div className="pf4-with-results" aria-busy={loading}>
      {loading ? <div role="status" style={{ fontSize: 13, color: GP.mute, padding: 12 }}>Searching…</div> : !shown.length ? <div role="status" style={{ fontSize: 13, color: GP.mute, padding: 12, overflowWrap: 'anywhere' }}>No golfers match "{query}"</div> : shown.map(p => <Button variant="ghost" className="pf4-with-result" key={p.id} onPointerDown={e => e.preventDefault()} onClick={() => { onToggle(p); setQuery(''); inputRef.current?.focus(); }}>
        <SquircleAvatar src={p.avatarUrl} alt="" fallback={getInitialsFromName(p.name)} userId={p.id} size={34} hairlineRing ringColor={DARK_HAIRLINE}/>
        <span className="pf4-with-person"><b>{p.name}</b><small>{[p.username ? `@${p.username}` : null, p.homeClub].filter(Boolean).join(' · ')}</small></span><span className="pf4-with-add">Add</span>
      </Button>)}
    </div>}
    {tagged.length > 0 && <div className="pf4-with-chips">{tagged.map(p => <div className="pf4-with-chip" key={p.id}>
      <SquircleAvatar src={p.avatarUrl} alt="" fallback={getInitialsFromName(p.name)} userId={p.id} size={26} hairlineRing ringColor={DARK_HAIRLINE}/><span>{p.name}</span>
      <Button variant="ghost" className="pf4-with-remove" aria-label={`Remove ${p.name}`} onClick={() => onToggle(p)}><X size={12}/></Button>
    </div>)}</div>}
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
