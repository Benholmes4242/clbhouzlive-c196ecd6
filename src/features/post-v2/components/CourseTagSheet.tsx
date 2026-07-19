// CourseTagSheet - multi-select search + "popular on clbhouz" empty state.
// Header styled as an eyebrow (icon + uppercase label) to match the
// shared @mention sheet chrome.
//
// Multi-select semantics: tapping a course toggles it (amber check on selected
// rows). Selected courses pin to the top so the ordering the user sees matches
// the order that will be persisted. Done button commits the ordered array
// (empty = clear tag). Search behaviour unchanged.

import { useEffect, useMemo, useState } from 'react';
import { Check, MapPin, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomSheet from './BottomSheet';
import type { StageCourse } from '../hooks/useStageComposer';
import { usePopularCourses } from '../hooks/usePopularCourses';
import useKeyboardHeight from '@/hooks/messaging/useKeyboardHeight';


interface Props {
  open: boolean;
  onClose: () => void;
  /** Commit the ordered selection. Empty array clears the tag. */
  onSubmit: (courses: StageCourse[]) => void;
  /** Currently selected courses (ordered). */
  selected: StageCourse[];
  userId?: string | null;
  title?: string;
  /**
   * Review-flow only. When set:
   *  - popular suggestions exclude courses this user has already reviewed
   *  - search results still include them, with a small amber REVIEWED badge
   */
  excludeReviewedForUserId?: string | null;
}

interface Row extends StageCourse {
  sub_country?: string | null;
  isHomeClub?: boolean;
}

export default function CourseTagSheet({
  open,
  onClose,
  onSubmit,
  selected,
  userId,
  title = 'Tag a course',
  excludeReviewedForUserId = null,
}: Props) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const { rows: popular } = usePopularCourses(open, {
    excludeReviewedForUserId,
  });
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const keyboardHeight = useKeyboardHeight();

  // Local ordered selection - seeded from `selected` each time the sheet opens.
  const [picked, setPicked] = useState<StageCourse[]>(selected);
  useEffect(() => {
    if (open) setPicked(selected);
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
    const t = setTimeout(async () => {
      if (q.trim().length === 0) { setRows([]); return; }
      const { data } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country')
        .ilike('name', `%${q.trim()}%`)
        .limit(20);
      setRows((data ?? []) as Row[]);
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  const showPopular = q.trim().length === 0;
  const pickedIds = useMemo(() => new Set(picked.map((c) => c.id)), [picked]);

  const toggle = (c: StageCourse) => {
    setPicked((prev) => prev.some((p) => p.id === c.id)
      ? prev.filter((p) => p.id !== c.id)
      : [...prev, c]);
  };

  const commit = () => {
    onSubmit(picked);
    onClose();
  };

  // Compose the visible list: selected courses pinned to the top, then
  // popular/search rows with the already-picked ones filtered out.
  const suggestions: Row[] = showPopular
    ? popular.map(r => ({ id: r.id, name: r.name, country: r.country, sub_country: r.sub_country }))
    : rows;
  const restRows = suggestions.filter((r) => !pickedIds.has(r.id));

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
            borderBottom: '1px solid rgba(15,23,42,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(15,23,42,0.55)',
            }}
          >
            <MapPin size={11} strokeWidth={2.25} color="#F7931E" />
            {title ?? 'Tag a course'}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 0, color: '#1F2428', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 'none', padding: '8px 16px 12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', top: 12, left: 12 }} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search any of 40,000+ courses"
              style={{ width: '100%', padding: '10px 12px 10px 34px', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, fontSize: 14, background: '#fff', color: '#0F172A' }}
            />
          </div>
        </div>

        {/* Scrolling list region — the only part that grows */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          {picked.length > 0 && (
            <>
              <div style={{ padding: '10px 16px 6px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#94A3B8' }}>
                SELECTED
              </div>
              {picked.map((c) => (
                <CourseRow
                  key={c.id}
                  row={{ id: c.id, name: c.name, country: c.country ?? null }}
                  selected
                  onToggle={toggle}
                />
              ))}
            </>
          )}

          {showPopular ? (
            <>
              {restRows.length > 0 ? (
                <>
                  <div style={{ padding: '10px 16px 6px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#94A3B8' }}>
                    POPULAR ON CLBHOUZ
                  </div>
                  {restRows.map(r => (
                    <CourseRow
                      key={r.id}
                      row={r}
                      selected={false}
                      onToggle={toggle}
                    />
                  ))}
                  <div style={{ padding: '16px', fontSize: 12, color: '#94A3B8' }}>
                    Can't see it? Search any of 40,000+ courses above.
                  </div>
                </>
              ) : (
                <div style={{ padding: '32px 16px', fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                  Search any of 40,000+ courses above.
                </div>
              )}
            </>
          ) : (
            restRows.map(r => (
              <CourseRow
                key={r.id}
                row={r}
                selected={false}
                reviewed={reviewedIds.has(r.id)}
                onToggle={toggle}
              />
            ))
          )}
        </div>

        {/* Done bar — clears tag at zero selections (matches today's untag path). */}
        <div
          style={{
            flexShrink: 0,
            padding: '10px 16px calc(10px + env(safe-area-inset-bottom))',
            borderTop: '1px solid rgba(15,23,42,0.08)',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: '#5A6270' }}>
            {picked.length === 0
              ? 'No courses tagged'
              : picked.length === 1
                ? '1 course selected'
                : `${picked.length} courses selected`}
          </div>
          <button
            onClick={commit}
            style={{
              background: '#F7931E',
              color: '#15171F',
              border: 0,
              borderRadius: 999,
              padding: '8px 18px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}


function CourseRow({
  row,
  selected,
  onToggle,
  reviewed = false,
}: {
  row: Row;
  selected: boolean;
  onToggle: (c: StageCourse) => void;
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
        <div style={{ width: 34, height: 34, borderRadius: 12, background: '#F1F5F9', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={16} color="#F7931E" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
          {locality && <div style={{ fontSize: 12, color: row.isHomeClub ? '#F7931E' : '#94A3B8', fontWeight: row.isHomeClub ? 700 : 400 }}>{locality}</div>}
        </div>
        {reviewed && !selected && (
          <div
            style={{
              flex: 'none',
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(247,147,30,0.12)',
              color: '#B45309',
              fontSize: 9.5,
              fontWeight: 800,
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
            border: selected ? '0' : '1.5px solid rgba(15,23,42,0.18)',
            background: selected ? '#F7931E' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <Check size={14} color="#15171F" strokeWidth={3} />}
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
  borderTop: '1px solid rgba(15,23,42,0.06)',
  background: 'transparent',
  cursor: 'pointer',
};
