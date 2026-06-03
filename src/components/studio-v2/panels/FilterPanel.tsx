import React from 'react';
import { SIMPLE_FILTERS, type SimpleEdits, type SimpleFilterId } from '@/types/studioSimple';
import { INK, SUBTLE, AMBER } from '../tokens';

interface Props {
  edits: SimpleEdits;
  update: (patch: Partial<SimpleEdits>) => void;
  previewUrl: string;
}

export default function FilterPanel({ edits, update, previewUrl }: Props) {
  const active: SimpleFilterId = edits.filter ?? 'normal';
  return (
    <div className="px-3 py-3" style={{ overflowX: 'auto' }}>
      <div className="flex gap-3">
        {SIMPLE_FILTERS.map((f) => {
          const isActive = f.id === active;
          return (
            <button
              key={f.id}
              onClick={() => update({ filter: f.id })}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              style={{ flexShrink: 0 }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 12,
                  overflow: 'hidden',
                  outline: isActive ? `2px solid ${AMBER}` : 'none',
                  outlineOffset: 2,
                }}
              >
                <img
                  src={previewUrl}
                  alt={f.label}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css }}
                />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? INK : SUBTLE,
                }}
              >
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
