import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminTheme as t } from '../theme';
import { courseMatchLabel } from '../lib/geography';

/**
 * Duplicate detection for the add-course sheet.
 *
 * Debounced 300ms, minimum 3 characters:
 *   supabase.from('golf_courses')
 *     .select('id, name, sub_country, region, country')
 *     .ilike('name', `%${term}%`)
 *     .order('name')
 *     .limit(5)
 *
 * Never blocks submission - it only makes the collision impossible to miss.
 */

export interface DuplicateHit {
  id: string;
  name: string;
  sub_country: string | null;
  region: string | null;
  country: string | null;
}

export function useDuplicateCourseCheck(name: string) {
  const term = useDebouncedValue(name.trim(), 300);
  const enabled = term.length >= 3;
  const { data = [] } = useQuery({
    queryKey: ['admin-v2', 'courses', 'dupe-check', term],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, sub_country, region, country')
        .ilike('name', `%${term}%`)
        .order('name')
        .limit(5);
      if (error) return [] as DuplicateHit[];
      return (data ?? []) as DuplicateHit[];
    },
  });
  return enabled ? data : [];
}

export function DuplicateCourseWarning({ hits, onUseInstead }: {
  hits: DuplicateHit[];
  onUseInstead: (id: string) => void;
}) {
  if (!hits.length) return null;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: 12, borderRadius: t.radius.md,
      border: `1px solid ${t.line}`, background: t.canvas,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
        textTransform: 'uppercase', color: t.inkMuted,
      }}>
        {hits.length === 1 ? 'Possible existing course' : 'Possible existing courses'}
      </div>
      {hits.map((h) => (
        <div
          key={h.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: t.radius.sm,
            background: t.surface, border: `1px solid ${t.line}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{h.name}</div>
            <div style={{ fontSize: 11, color: t.inkMuted }}>
              {courseMatchLabel(h) || '-'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUseInstead(h.id)}
            style={{
              flexShrink: 0, padding: '8px 10px', minHeight: 36,
              borderRadius: t.radius.sm, border: `1px solid ${t.line}`,
              background: t.surface, color: t.ink,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >Use this instead</button>
        </div>
      ))}
    </div>
  );
}

export default DuplicateCourseWarning;
