// CourseTagSheet - multi-select course tagger.
// The FIRST selected course is the primary tag (posts.course_id). All
// selected courses (incl. the first) are written to posts.tagged_course_ids
// in selection order. Selected courses pin to the top of the list.

import { useEffect, useMemo, useState } from 'react';
import { Check, MapPin, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomSheet from './BottomSheet';
import type { StageCourse } from '../hooks/useStageComposer';
import { usePopularCourses } from '../hooks/usePopularCourses';
import useKeyboardHeight from '@/hooks/messaging/useKeyboardHeight';
import { CT } from '@/features/_shared/composerTokens';


interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the FULL selection (ordered). Empty array clears the tag. */
  onDone: (selected: StageCourse[]) => void;
  /** Current selection to prime the sheet. */
  selected: StageCourse[];
  userId?: string | null;
  title?: string;
  /**
   * Review-flow only. When set:
   *  - popular suggestions exclude courses this user has already reviewed
   *  - search results still include them, with a small amber REVIEWED badge
   */
  excludeReviewedForUserId?: string | null;
  /** 'single' commits on tap and closes. Default 'multi' for post tagging. */
  selectionMode?: 'single' | 'multi';
}

interface Row extends StageCourse {
  sub_country?: string | null;
  isHomeClub?: boolean;
}

export default function CourseTagSheet({
  open,
  onClose,
  onDone,
  selected,
  userId,
  title = 'Tag a course',
  excludeReviewedForUserId = null,
  selectionMode = 'multi',
}: Props) {
  const isSingle = selectionMode === 'single';
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [searching, setSearching] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);
  const [draft, setDraft] = useState<StageCourse[]>(selected);
  const { rows: popular, loaded: popularLoaded } = usePopularCourses(open, {
    excludeReviewedForUserId,
  });
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const keyboardHeight = useKeyboardHeight();

  // Re-prime the draft whenever the sheet opens.
  useEffect(() => {
    if (open) setDraft(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Pull the user's reviewed course ids so search results can be badged.
  useEffect(() => {
    if (!open || !excludeReviewedForUserId) { setReviewedIds(new Set()); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', excludeReviewedForUserId);
      if (cancelled) return;
      setReviewedIds(new Set(
        ((data ?? []) as Array<{ course_id: string | null }>)
          .map((r) => r.course_id)
          .filter((v): v is string => !!v),
      ));
    })();
    return () => { cancelled = true; };
  }, [open, excludeReviewedForUserId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      if (q.trim().length === 0) { setRows([]); setSearching(false); return; }
      setSearching(true);
      const { data } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country')
        .ilike('name', `%${q.trim()}%`)
        .limit(20);
      if (cancelled) return;
      setRows((data ?? []) as Row[]);
      setSearching(false);
    }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, open]);

  const showPopular = q.trim().length === 0;
  const selectedIds = useMemo(() => new Set(draft.map(d => d.id)), [draft]);

  const toggle = (c: StageCourse) => {
    if (isSingle) { onDone([c]); onClose(); return; }
    setDraft((cur) => {
      if (cur.some((r) => r.id === c.id)) return cur.filter((r) => r.id !== c.id);
      return [...cur, c];
    });
  };

  const handleDone = () => {
    onDone(draft);
    onClose();
  };

  // Build pinned + filtered lists so already-selected rows show first.
  const popularPinned = useMemo(() => {
    const pinned = draft.filter((d) => popular.some((p) => p.id === d.id));
    const rest = popular.filter((p) => !selectedIds.has(p.id));
    return { pinned, rest };
  }, [popular, draft, selectedIds]);

  const searchPinned = useMemo(() => {
    const pinned = draft.filter((d) => rows.some((p) => p.id === d.id));
    const rest = rows.filter((p) => !selectedIds.has(p.id));
    return { pinned, rest };
  }, [rows, draft, selectedIds]);

  return (
    <BottomSheet open={open} onClose={onClose} bottomOffset={keyboardHeight} fixedHeight="60dvh">
      {/* Fixed-height column: header + search stay pinned, list scrolls internally. */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {/* Eyebrow header — mirrors the shared @mention sheet chrome */}
        <div
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 16px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: CT.secondary,
            }}
          >
            <MapPin size={11} strokeWidth={2.25} color={CT.amber} />
            {title ?? 'Tag a course'}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 0, color: CT.ink, cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/*
          CANONICAL DARK FIELD TREATMENT (MICRO_BRIEF_CANONICAL_FIELD_TREATMENT):
          radius 14, height 44, REST bg 6% / border 10%, FOCUS bg 10% /
          border 28%, text 96%, placeholder 38%. Both channels step on focus.
        */}
        <div style={{ flex: 'none', padding: '8px 16px 12px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              color={CT.secondary}
              style={{ position: 'absolute', top: 14, left: 12 }}
            />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFieldFocused(true)}
              onBlur={() => setFieldFocused(false)}
              placeholder="Search any of 40,000+ courses"
              className="placeholder:text-[rgba(255,255,255,0.38)]"
              style={{
                width: '100%',
                height: 44,
                padding: '0 12px 0 34px',
                border: `1px solid ${fieldFocused ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.10)'}`,
                borderRadius: 14,
                fontSize: 14,
                outline: 'none',
                background: fieldFocused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.96)',
                transition: 'background 140ms ease, border-color 140ms ease',
              }}
            />
          </div>
        </div>


        {/* Scrolling list region — the only part that grows */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          {showPopular ? (
            <>
              {!isSingle && popularPinned.pinned.length > 0 && (
                <>
                  <SectionLabel>SELECTED</SectionLabel>
                  {popularPinned.pinned.map((r) => (
                    <CourseRow key={`sel-${r.id}`} row={{ id: r.id, name: r.name, country: r.country ?? null }} selected onToggle={toggle} />
                  ))}
                </>
              )}
              {/* Selected courses NOT in popular list — pin them at the very top */}
              {!isSingle && draft.filter((d) => !popular.some((p) => p.id === d.id)).length > 0 && popularPinned.pinned.length === 0 && (
                <>
                  <SectionLabel>SELECTED</SectionLabel>
                  {draft.filter((d) => !popular.some((p) => p.id === d.id)).map((r) => (
                    <CourseRow key={`sel-${r.id}`} row={{ id: r.id, name: r.name, country: r.country ?? null }} selected onToggle={toggle} />
                  ))}
                </>
              )}
              {!popularLoaded ? (
                <>
                  <CourseRowSkeleton />
                  <CourseRowSkeleton />
                  <CourseRowSkeleton />
                </>
              ) : popular.length > 0 ? (
                <>
                  <SectionLabel>POPULAR ON CLBHOUZ</SectionLabel>
                  {popularPinned.rest.map(r => (
                    <CourseRow
                      key={r.id}
                      row={{ id: r.id, name: r.name, country: r.country, sub_country: r.sub_country }}
                      selected={selectedIds.has(r.id)}
                      onToggle={toggle}
                    />
                  ))}
                  <div style={{ padding: '16px', fontSize: 12, color: CT.secondary }}>
                    Can't see it? Search any of 40,000+ courses above.
                  </div>
                </>
              ) : (
                <div style={{ padding: '32px 16px', fontSize: 13, color: CT.secondary, textAlign: 'center' }}>
                  Search any of 40,000+ courses above.
                </div>
              )}
            </>
          ) : (
            <>
              {!isSingle && searchPinned.pinned.length > 0 && (
                <>
                  <SectionLabel>SELECTED</SectionLabel>
                  {searchPinned.pinned.map((r) => (
                    <CourseRow key={`sel-${r.id}`} row={r as Row} selected onToggle={toggle} />
                  ))}
                  <SectionLabel>RESULTS</SectionLabel>
                </>
              )}
              {searching && searchPinned.rest.length === 0 ? (
                <>
                  <CourseRowSkeleton />
                  <CourseRowSkeleton />
                  <CourseRowSkeleton />
                </>
              ) : searchPinned.rest.length === 0 && searchPinned.pinned.length === 0 ? (
                <div style={{ padding: '32px 16px', fontSize: 13, color: CT.secondary, textAlign: 'center' }}>
                  No courses found for "{q.trim()}"
                </div>
              ) : (
                searchPinned.rest.map(r => (
                  <CourseRow
                    key={r.id}
                    row={r}
                    reviewed={reviewedIds.has(r.id)}
                    selected={selectedIds.has(r.id)}
                    onToggle={toggle}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* Done bar — amber; disabled at zero selections still calls onDone
            to preserve the "clears the tag" behaviour when the user tapped
            all their picks off, matching today's untag path. */}
        {!isSingle && (
          <div
            style={{
              flexShrink: 0,
              padding: '10px 16px max(env(safe-area-inset-bottom), 10px)',
              borderTop: '1px solid rgba(255,255,255,0.10)',
              background: CT.cardBg,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ flex: 1, fontSize: 12, color: CT.secondary }}>
              {draft.length === 0 ? 'No courses selected' : `${draft.length} selected`}
            </div>
            <button
              onClick={handleDone}
              style={{
                background: CT.amber,
                color: CT.dark,
                border: 0,
                borderRadius: 999,
                padding: '8px 18px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: draft.length === 0 && selected.length === 0 ? 0.5 : 1,
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: CT.secondary }}>
      {children}
    </div>
  );
}

function CourseRowSkeleton() {
  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="clb-shimmer-dark" style={{ width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,0.06)', flex: 'none' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="clb-shimmer-dark" style={{ height: 12, width: '55%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
        <div className="clb-shimmer-dark" style={{ height: 10, width: '30%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  );
}



function CourseRow({
  row,
  onToggle,
  selected = false,
  reviewed = false,
}: {
  row: Row;
  onToggle: (c: StageCourse) => void;
  selected?: boolean;
  reviewed?: boolean;
}) {
  const locality = row.isHomeClub ? 'Your home club' : (row.sub_country || row.country || null);
  return (
    <button
      onClick={() => onToggle({ id: row.id, name: row.name, country: row.country ?? null })}
      style={{
        ...rowBtn,
        background: selected ? 'rgba(247,147,30,0.06)' : 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 12, background: CT.ghost, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={16} color={CT.amber} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: CT.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
          {locality && <div style={{ fontSize: 12, color: row.isHomeClub ? CT.amber : CT.secondary, fontWeight: row.isHomeClub ? 700 : 400 }}>{locality}</div>}
        </div>
        {reviewed && !selected && (
          <div
            style={{
              flex: 'none',
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(247,147,30,0.12)',
              color: CT.amberDeep,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            REVIEWED
          </div>
        )}
        <div
          aria-hidden
          style={{
            flex: 'none',
            width: 22,
            height: 22,
            borderRadius: 999,
            border: selected ? 0 : '1.5px solid rgba(255,255,255,0.22)',
            background: selected ? CT.amber : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <Check size={14} color={CT.cardBg} strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}


const rowBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '12px 16px',
  border: 0,
  borderTop: '1px solid rgba(255,255,255,0.08)',
  background: 'transparent',
  cursor: 'pointer',
};
