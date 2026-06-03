import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import type { SimpleEdits, SimpleTextOverlay, SimpleTextStyle } from '@/types/studioSimple';
import { INK, SUBTLE, BORDER, CARD } from '../tokens';

interface Props {
  edits: SimpleEdits;
  update: (patch: Partial<SimpleEdits>) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

const STYLES: { id: SimpleTextStyle; label: string }[] = [
  { id: 'bold', label: 'Bold' },
  { id: 'serif', label: 'Serif' },
  { id: 'outline', label: 'Outline' },
];

export default function TextPanel({ edits, update, selectedId, setSelectedId }: Props) {
  const overlays = edits.text ?? [];
  const selected = overlays.find((o) => o.id === selectedId) ?? null;

  const setOverlays = (next: SimpleTextOverlay[]) => update({ text: next });

  const addOverlay = () => {
    const id = `t_${Date.now()}`;
    const o: SimpleTextOverlay = { id, text: 'Your text', x: 0.5, y: 0.5, scale: 1, style: 'bold' };
    setOverlays([...overlays, o]);
    setSelectedId(id);
  };

  const updateSelected = (patch: Partial<SimpleTextOverlay>) => {
    if (!selected) return;
    setOverlays(overlays.map((o) => (o.id === selected.id ? { ...o, ...patch } : o)));
  };

  const removeSelected = () => {
    if (!selected) return;
    setOverlays(overlays.filter((o) => o.id !== selected.id));
    setSelectedId(null);
  };

  if (!selected) {
    return (
      <div className="px-4 py-4">
        <button
          onClick={addOverlay}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold"
          style={{ background: INK, color: '#fff', borderRadius: 12 }}
        >
          <Plus className="w-4 h-4" /> Add text
        </button>
        {overlays.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {overlays.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className="w-full text-left px-3 py-2 text-xs"
                style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK }}
              >
                {o.text || '(empty)'}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-3">
      <input
        value={selected.text}
        onChange={(e) => updateSelected({ text: e.target.value })}
        placeholder="Type something"
        className="w-full px-3 py-2 text-sm"
        style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, outline: 'none' }}
      />
      <div className="flex gap-2">
        {STYLES.map((s) => {
          const active = s.id === selected.style;
          return (
            <button
              key={s.id}
              onClick={() => updateSelected({ style: s.id })}
              className="px-3 py-2 text-xs font-semibold"
              style={{
                borderRadius: 999,
                background: active ? INK : 'transparent',
                color: active ? '#fff' : INK,
                border: active ? 'none' : `1px solid ${BORDER}`,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: SUBTLE, textTransform: 'uppercase', marginBottom: 6 }}>
          Size · {selected.scale.toFixed(2)}x
        </div>
        <input
          type="range"
          min={0.6}
          max={3}
          step={0.05}
          value={selected.scale}
          onChange={(e) => updateSelected({ scale: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => setSelectedId(null)} className="text-xs font-semibold" style={{ color: SUBTLE }}>
          Done editing
        </button>
        <button
          onClick={removeSelected}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: '#dc2626' }}
        >
          <Trash2 className="w-3.5 h-3.5" /> Remove
        </button>
      </div>
    </div>
  );
}
