import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Crop, SlidersHorizontal, Type } from 'lucide-react';
import type { SimpleEdits, SimpleCropRatio } from '@/types/studioSimple';
import { SIMPLE_FILTERS, ratioToNumber } from '@/types/studioSimple';
import CropPanel from './panels/CropPanel';
import FilterPanel from './panels/FilterPanel';
import TextPanel from './panels/TextPanel';
import { SURFACE, INK, SUBTLE, BORDER, AMBER } from './tokens';

type Tool = 'crop' | 'filter' | 'text';

export interface EditorScreenProps {
  src: string;
  initialEdits?: SimpleEdits;
  onCancel: () => void;
  onDone: (edits: SimpleEdits) => void;
}

export default function EditorScreen({ src, initialEdits, onCancel, onDone }: EditorScreenProps) {
  const [edits, setEdits] = useState<SimpleEdits>(initialEdits ?? { filter: 'normal' });
  const [tool, setTool] = useState<Tool>('crop');
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const update = useCallback((patch: Partial<SimpleEdits>) => {
    setEdits((prev) => ({ ...prev, ...patch }));
  }, []);

  const filterCss = useMemo(
    () => SIMPLE_FILTERS.find((f) => f.id === (edits.filter ?? 'normal'))?.css ?? 'none',
    [edits.filter]
  );

  const ratio: SimpleCropRatio = edits.crop?.ratio ?? 'original';
  const aspect = ratio === 'original' ? undefined : ratioToNumber(ratio, 1);
  const rotate = edits.rotate ?? 0;
  const scaleX = edits.flipH ? -1 : 1;
  const scaleY = edits.flipV ? -1 : 1;
  const zoom = edits.crop?.zoom ?? 1;

  const overlays = edits.text ?? [];

  const onOverlayDrag = (id: string, e: React.PointerEvent) => {
    const target = previewRef.current;
    if (!target) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = target.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      setEdits((prev) => ({
        ...prev,
        text: (prev.text ?? []).map((o) => (o.id === id ? { ...o, x, y } : o)),
      }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: SURFACE, zIndex: 60 }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          paddingBottom: 10,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <button onClick={onCancel} className="text-sm font-medium" style={{ color: INK }}>
          Cancel
        </button>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', color: SUBTLE }}>EDIT</div>
        <button
          onClick={() => onDone(edits)}
          className="text-sm font-semibold"
          style={{ color: AMBER }}
        >
          Done
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          ref={previewRef}
          className="relative"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: aspect ? 'auto' : '100%',
            aspectRatio: aspect ? String(aspect) : 'auto',
            background: '#000',
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={src}
            alt="edit preview"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: aspect ? 'cover' : 'contain',
              filter: filterCss,
              transform: `rotate(${rotate}deg) scale(${scaleX * zoom}, ${scaleY * zoom})`,
              transformOrigin: 'center',
              transition: 'filter 180ms ease',
            }}
          />
          {overlays.map((o) => (
            <div
              key={o.id}
              onPointerDown={(e) => {
                setSelectedTextId(o.id);
                setTool('text');
                onOverlayDrag(o.id, e);
              }}
              style={{
                position: 'absolute',
                left: `${o.x * 100}%`,
                top: `${o.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${o.scale})`,
                color: '#fff',
                fontSize: 'min(6vw, 36px)',
                fontWeight: o.style === 'serif' ? 700 : 800,
                fontFamily:
                  o.style === 'serif'
                    ? 'Georgia, serif'
                    : 'system-ui, -apple-system, "Segoe UI", sans-serif',
                textShadow:
                  o.style === 'outline'
                    ? 'none'
                    : '0 2px 8px rgba(0,0,0,0.55)',
                WebkitTextStroke: o.style === 'outline' ? '2px #0F172A' : undefined,
                cursor: 'grab',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                outline: selectedTextId === o.id ? `1px dashed ${AMBER}` : 'none',
                outlineOffset: 4,
                padding: 2,
              }}
            >
              {o.text || ' '}
            </div>
          ))}
        </div>
      </div>

      {/* Tool panel */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: '#fff' }}>
        {tool === 'crop' && <CropPanel edits={edits} update={update} />}
        {tool === 'filter' && <FilterPanel edits={edits} update={update} previewUrl={src} />}
        {tool === 'text' && (
          <TextPanel edits={edits} update={update} selectedId={selectedTextId} setSelectedId={setSelectedTextId} />
        )}
      </div>

      {/* Bottom tool tabs */}
      <div
        className="grid grid-cols-3"
        style={{
          borderTop: `1px solid ${BORDER}`,
          background: '#fff',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {([
          { id: 'crop' as Tool, label: 'Crop', icon: Crop },
          { id: 'filter' as Tool, label: 'Filter', icon: SlidersHorizontal },
          { id: 'text' as Tool, label: 'Text', icon: Type },
        ]).map(({ id, label, icon: Icon }) => {
          const active = tool === id;
          return (
            <button
              key={id}
              onClick={() => setTool(id)}
              className="flex flex-col items-center justify-center gap-1 py-3"
              style={{
                borderTop: active ? `2px solid ${AMBER}` : '2px solid transparent',
                color: active ? INK : SUBTLE,
              }}
            >
              <Icon className="w-4 h-4" />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
