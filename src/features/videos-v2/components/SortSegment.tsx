import React from 'react';

export type VideosSortId = 'latest' | 'popular' | 'following';

interface Props {
  value: VideosSortId;
  onChange: (next: VideosSortId) => void;
}

const SEGMENTS: ReadonlyArray<{ id: VideosSortId; label: string }> = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
  { id: 'following', label: 'Following' },
];

export function SortSegment({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Sort videos"
      style={{
        display: 'flex',
        background: 'rgba(0,0,0,0.05)',
        borderRadius: 11,
        padding: 3,
      }}
    >
      {SEGMENTS.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.id)}
            style={{
              flex: 1,
              textAlign: 'center',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 12.5,
              padding: '7px 0',
              borderRadius: 9,
              border: 'none',
              background: active ? '#fff' : 'transparent',
              color: active ? '#0F172A' : '#64748B',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              transition: 'all .15s',
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export default SortSegment;
