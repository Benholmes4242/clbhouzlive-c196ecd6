// FrameChooser — Original / 4:5 / 1:1 pill row. Charcoal-friendly styling.
import React from 'react';

export type FrameId = 'original' | '4:5' | '1:1';
export const FRAMES: { id: FrameId; label: string; ratio?: number }[] = [
  { id: 'original', label: 'Original' },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '1:1', label: '1:1', ratio: 1 },
];

interface FrameChooserProps {
  frame: FrameId;
  onChange: (f: FrameId) => void;
  hint?: string;
}

export function FrameChooser({ frame, onChange, hint }: FrameChooserProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 0 4px' }}>
        {FRAMES.map((f) => {
          const active = frame === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onChange(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 16,
                border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                background: active ? '#fff' : 'transparent',
                color: active ? '#0F172A' : '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      {frame !== 'original' && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 10,
            color: 'rgba(255,255,255,0.6)',
            paddingBottom: 4,
          }}
        >
          {hint ?? 'Drag the photo to reposition'}
        </div>
      )}
    </>
  );
}

export default FrameChooser;
