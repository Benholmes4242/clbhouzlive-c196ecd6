/** Page 2 of the post wizard, rebuilt around golf (signed-off mock
 * post-page-signed-off.html). Presentation only: StageComposer owns state and
 * every write; rules live in lib/golfPostRules.ts.
 */
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShotTagChoices } from '@/components/course-media-tab/ShotTagChoices';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import BottomSheet from '../BottomSheet';
import SlideThumb from '../SlideThumb';
import type { StageCourse, StageMediaItem } from '../../hooks/useStageComposer';
import {
  holeLine, isHoleTag, shotTagLabel, VISIBILITY_OPTIONS,
  type PostVisibility, type ShotTag, type WithCandidate,
} from '../../lib/golfPostRules';
import { GP, chipStyle, labelAction, sectionLabel } from './golfPageTokens';

/* ---- MEDIA STRIP + HOLE LINE ------------------------------------------- */
export function GolfShotStrip({ media, tags, courseName, onTap, onAdd }: {
  media: StageMediaItem[]; tags: Record<string, ShotTag>; courseName: string | null;
  onTap: (i: number) => void; onAdd: () => void;
}) {
  const holes = media.filter((m) => isHoleTag(tags[m.id])).length;
  const line = holeLine(courseName, holes);
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
                  background: tag ? 'rgba(10,10,12,0.62)' : 'rgba(10,10,12,0.42)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  border: `1px ${tag ? 'solid' : 'dashed'} rgba(255,255,255,0.18)`, color: tag ? GP.ink : 'rgba(248,250,252,0.78)',
                }}>{tag ? shotTagLabel(tag) : '+ Tag'}</span>
              )}
            </button>
          );
        })}
        <button type="button" aria-label="Add" onClick={onAdd} style={{ flex: 'none', width: 92, height: 116, borderRadius: 14, border: `1.5px dashed ${GP.line2}`, background: 'transparent', display: 'grid', placeItems: 'center', color: GP.mute, fontSize: 26, cursor: 'pointer' }}>+</button>
      </div>
      {line && (
        <div data-testid="hole-line" style={{ padding: '10px 16px 0', fontSize: 12.5, color: GP.mute, lineHeight: 1.45 }}>
          {line.count && <b style={{ color: GP.ink, fontWeight: 600 }}>{line.count}</b>}{line.text}
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
  if (course && !changing) {
    return (
      <div data-testid="where-section" style={{ margin: '18px 16px 0' }}>
        <div style={sectionLabel}><span>Where</span><button type="button" style={labelAction} onClick={onChange}>Change</button></div>
        <div data-testid="where-card" style={{ display: 'flex', alignItems: 'center', gap: 12, background: GP.panel, border: `1px solid ${GP.line}`, borderRadius: 16, padding: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: 10, flex: 'none', background: 'linear-gradient(150deg,#5f8f4e,#21401f 60%,#a8c48b)' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: GP.ink }}>{course.name}</div>
            <div data-testid="where-reason" style={{ fontSize: 12, color: GP.mute, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              {reason ? <>{tick}{reason}</> : 'Tagged'}
            </div>
          </div>
          <button type="button" aria-label="Remove course" onClick={onUntag} style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: 'none' }}>
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
        <Search size={16} color={GP.dim} strokeWidth={2.4} />Search 23,000 courses
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
export function PlayedWithSection({ suggestions, tagged, onToggle, onFind }: {
  suggestions: WithCandidate[]; tagged: WithCandidate[]; onToggle: (p: WithCandidate) => void; onFind: () => void;
}) {
  // Tagged people always show, even when found by search.
  const shown = [...tagged, ...suggestions.filter((s) => !tagged.some((t) => t.id === s.id))].slice(0, 8);
  return (
    <div data-testid="played-with" style={{ margin: '18px 16px 0' }}>
      <div style={sectionLabel}><span>Played with</span><button type="button" style={labelAction} onClick={onFind}>Find someone</button></div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginRight: -16, paddingRight: 16, scrollbarWidth: 'none' }}>
        {shown.map((p) => {
          const on = tagged.some((t) => t.id === p.id);
          return (
            <button key={p.id} type="button" aria-pressed={on} data-testid="with-chip" onClick={() => onToggle(p)} style={{ ...chipStyle(on), paddingLeft: 8 }}>
              <SquircleAvatar src={p.avatarUrl} alt={p.name} userId={p.id} size={22} hairlineRing ringColor={DARK_HAIRLINE} />{p.name.split(/\s+/)[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
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
