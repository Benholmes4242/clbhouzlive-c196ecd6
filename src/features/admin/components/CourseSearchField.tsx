import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import { RAISED } from '../lib/panels';

/**
 * The admin's ONE golf_courses name search (BRIEF_INBOX_WORK_THE_QUEUE 2.4).
 * `useCourseSearch` is the debounced query; `CourseSearchField` is the Inbox
 * row's field with its result popover. Every admin surface that searches the
 * catalogue by name reads one of the two - never an inline copy.
 */
export interface CourseSearchHit {
  id: string;
  name: string;
  region: string | null;
  sub_country: string | null;
  country: string | null;
  thumbnail_image?: string | null;
  club_id?: string | null;
}

const DEFAULT_COLUMNS = 'id, name, region, sub_country, country';

export function useCourseSearch(
  query: string,
  { limit = 25, columns = DEFAULT_COLUMNS, enabled = true, debounceMs = 220 }:
  { limit?: number; columns?: string; enabled?: boolean; debounceMs?: number } = {},
) {
  const [hits, setHits] = useState<CourseSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!enabled || q.length < 2) { setHits([]); setSearching(false); return; }
    let cancelled = false;
    setSearching(true);
    setError(null);
    const handle = setTimeout(async () => {
      const { data, error: err } = await supabase
        .from('golf_courses')
        .select(columns)
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(limit);
      if (cancelled) return;
      setSearching(false);
      if (err) { setError(err.message); setHits([]); return; }
      setHits((data ?? []) as unknown as CourseSearchHit[]);
    }, debounceMs);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [query, limit, columns, enabled, debounceMs]);

  return { hits, searching, error };
}

export default function CourseSearchField({
  placeholder, initialQuery = '', onPick, autoFocus = false, disabled = false,
}: {
  placeholder: string;
  initialQuery?: string;
  onPick: (hit: CourseSearchHit) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { hits, searching } = useCourseSearch(query, { limit: 8 });

  useEffect(() => { setQuery(initialQuery); if (initialQuery) setOpen(true); }, [initialQuery]);
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  const showPopover = open && query.trim().length >= 2;

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <label
        style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 10px',
          borderRadius: 10, background: RAISED, border: `1px solid ${t.hairline}`,
        }}
      >
        <Search size={14} color={t.inkFaint} aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{
            flex: 1, minWidth: 0, height: '100%', background: 'transparent', border: 'none',
            outline: 'none', color: t.ink, fontSize: 13,
          }}
        />
      </label>
      {showPopover && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 40, left: 0, right: 0, zIndex: 20,
            background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10,
            boxShadow: t.shadowCard, overflow: 'hidden',
          }}
        >
          {searching && hits.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: 12, color: t.inkMuted }}>Searching…</div>
          ) : hits.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: 12, color: t.inkMuted }}>No matches.</div>
          ) : hits.map((h, i) => (
            <button
              key={h.id}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setOpen(false); onPick(h); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderTop: i === 0 ? 'none' : `1px solid ${t.hairline}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
              <div style={{ fontSize: 11, color: t.inkFaint }}>
                {[h.sub_country, h.country].filter(Boolean).join(' \u00b7 ') || '\u2014'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
