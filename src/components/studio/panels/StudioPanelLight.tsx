import { useState, useCallback, useEffect } from 'react';
import { StudioEdits } from '@/types/studio';

type StudioPanelLightProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
};

const ADJUSTMENTS = [
  { key: 'exposure' as const,   label: 'Exposure' },
  { key: 'contrast' as const,   label: 'Contrast' },
  { key: 'highlights' as const, label: 'Highlights' },
  { key: 'shadows' as const,    label: 'Shadows' },
  { key: 'saturation' as const, label: 'Saturation' },
];

export default function StudioPanelLight({ edits, updateEdits }: StudioPanelLightProps) {
  const [values, setValues] = useState(() => ({
    exposure: edits.exposure ?? 50,
    contrast: edits.contrast ?? 50,
    highlights: edits.highlights ?? 50,
    shadows: edits.shadows ?? 50,
    saturation: edits.saturation ?? 50,
  }));

  useEffect(() => {
    setValues({
      exposure: edits.exposure ?? 50,
      contrast: edits.contrast ?? 50,
      highlights: edits.highlights ?? 50,
      shadows: edits.shadows ?? 50,
      saturation: edits.saturation ?? 50,
    });
  }, [edits.exposure, edits.contrast, edits.highlights, edits.shadows, edits.saturation]);

  const handleChange = useCallback((key: keyof typeof values, val: number) => {
    setValues(prev => ({ ...prev, [key]: val }));
    updateEdits({ [key]: val });
  }, [updateEdits]);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="px-4 pt-3 pb-2">
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
          Light Adjustments
        </span>
      </div>

      <div className="px-4 pb-6 space-y-5">
        {ADJUSTMENTS.map(({ key, label }) => {
          const val = values[key];
          const delta = val - 50;
          const displayVal = delta > 0 ? `+${delta}` : delta === 0 ? '0' : `${delta}`;
          const fillPct = ((val - 50) / 50) * 50; // -50% to +50%

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                  {label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: delta === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums' }}>
                  {displayVal}
                </span>
              </div>

              <div className="relative" style={{ height: 20 }}>
                {/* Track */}
                <div style={{ position: 'absolute', top: 9, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.10)', borderRadius: 1 }} />

                {/* Centre tick */}
                <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-0.5px)', width: 1, height: 6, background: 'rgba(255,255,255,0.20)', borderRadius: 0.5 }} />

                {/* Fill from centre */}
                <div style={{
                  position: 'absolute',
                  top: 9,
                  left: fillPct >= 0 ? '50%' : `${50 + fillPct}%`,
                  width: `${Math.abs(fillPct)}%`,
                  height: 2,
                  background: '#ffffff',
                  borderRadius: 1,
                }} />

                {/* Input */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={val}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  className="absolute inset-0 w-full appearance-none cursor-pointer
                    [&::-webkit-slider-runnable-track]:bg-transparent
                    [&::-webkit-slider-runnable-track]:h-5
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-[14px]
                    [&::-webkit-slider-thumb]:h-[14px]
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.5)]
                    [&::-webkit-slider-thumb]:cursor-grab
                    [&::-webkit-slider-thumb]:active:cursor-grabbing
                    [&::-moz-range-track]:bg-transparent
                    [&::-moz-range-track]:h-5
                    [&::-moz-range-thumb]:w-[14px]
                    [&::-moz-range-thumb]:h-[14px]
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                  style={{ background: 'transparent' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
