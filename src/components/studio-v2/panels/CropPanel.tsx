import React from 'react';
import { RotateCw, FlipHorizontal } from 'lucide-react';
import type { SimpleEdits, SimpleCropRatio } from '@/types/studioSimple';
import { INK, SUBTLE, BORDER, CARD } from '../tokens';

const RATIOS: { id: SimpleCropRatio; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: '1:1', label: 'Square' },
  { id: '4:5', label: 'Portrait' },
];

interface Props {
  edits: SimpleEdits;
  update: (patch: Partial<SimpleEdits>) => void;
}

export default function CropPanel({ edits, update }: Props) {
  const ratio = edits.crop?.ratio ?? 'original';
  const zoom = edits.crop?.zoom ?? 1;
  const rotate = (edits.rotate ?? 0) as 0 | 90 | 180 | 270;

  const setRatio = (id: SimpleCropRatio) =>
    update({ crop: { ...(edits.crop ?? {}), ratio: id, zoom: edits.crop?.zoom ?? 1 } });

  const cycleRotate = () => {
    const next = (((rotate + 90) % 360) as 0 | 90 | 180 | 270);
    update({ rotate: next });
  };

  const toggleFlip = () => update({ flipH: !edits.flipH });

  const setZoom = (z: number) =>
    update({ crop: { ratio, ...(edits.crop ?? { ratio }), zoom: z } });

  return (
    <div className="px-4 py-3 space-y-4">
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: SUBTLE, textTransform: 'uppercase', marginBottom: 8 }}>
          Aspect
        </div>
        <div className="flex gap-2">
          {RATIOS.map((r) => {
            const active = r.id === ratio;
            return (
              <button
                key={r.id}
                onClick={() => setRatio(r.id)}
                className="px-3 py-2 text-xs font-semibold transition-colors"
                style={{
                  borderRadius: 999,
                  background: active ? INK : 'transparent',
                  color: active ? '#fff' : INK,
                  border: active ? 'none' : `1px solid ${BORDER}`,
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={cycleRotate}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold"
          style={{ borderRadius: 12, background: CARD, color: INK, border: `1px solid ${BORDER}` }}
        >
          <RotateCw className="w-4 h-4" /> Rotate · {rotate}°
        </button>
        <button
          onClick={toggleFlip}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold"
          style={{
            borderRadius: 12,
            background: edits.flipH ? INK : CARD,
            color: edits.flipH ? '#fff' : INK,
            border: `1px solid ${BORDER}`,
          }}
        >
          <FlipHorizontal className="w-4 h-4" /> Flip
        </button>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: SUBTLE, textTransform: 'uppercase', marginBottom: 8 }}>
          Zoom · {zoom.toFixed(2)}x
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
