import React from 'react';

/**
 * Category ids replicated (NOT imported) from the legacy mood system in
 * src/components/watch/videos/hooks/useVideosMood.ts. That hook maps its
 * three category moods to MOMENT_CATEGORIES ids as follows:
 *   course_vlogs -> 'course-vlog'
 *   coaching     -> 'tips-coaching'
 *   tournaments  -> 'tournament'
 * Videos v2 uses those MOMENT_CATEGORIES ids directly as its ?cat= values.
 */
export const VIDEOS_V2_CATEGORY_IDS = [
  'course-vlog',
  'tips-coaching',
  'tournament',
] as const;

export type VideosV2CategoryId = typeof VIDEOS_V2_CATEGORY_IDS[number];

const CATEGORIES: ReadonlyArray<{ id: VideosV2CategoryId; label: string }> = [
  { id: 'course-vlog', label: 'Course vlogs' },
  { id: 'tips-coaching', label: 'Coaching' },
  { id: 'tournament', label: 'Tournaments' },
];

interface Props {
  value: VideosV2CategoryId | null;
  onChange: (next: VideosV2CategoryId | null) => void;
}

export function CategoryChips({ value, onChange }: Props) {
  const chips: ReadonlyArray<{ id: VideosV2CategoryId | null; label: string }> = [
    { id: null, label: 'All' },
    ...CATEGORIES,
  ];

  return (
    <div
      className="scrollbar-hide"
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingTop: 8,
      }}
    >
      {chips.map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id ?? 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c.id)}
            style={{
              flexShrink: 0,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 11.5,
              padding: '5px 12px',
              borderRadius: 999,
              background: active ? 'rgba(247,147,30,0.14)' : 'transparent',
              color: active ? '#c97a10' : '#64748B',
              border: active
                ? '1px solid rgba(247,147,30,0.35)'
                : '1px solid rgba(0,0,0,0.07)',
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryChips;
