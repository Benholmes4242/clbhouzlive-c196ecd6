'use client';
import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { ALL_STATES } from './states';
import { getOverrides } from './overrides';

declare global {
  interface Window {
    __DRM?: {
      getOverrides: (id: string) => any;
      getState: () => { id: string } | null;
      setStateByIndex: (i: number) => void;
    };
  }
}

export function ReviewPanel() {
  const [index, setIndex] = useState(0);
  const state = ALL_STATES[index] ?? null;
  const isFirst = index === 0;
  const isLast  = index === ALL_STATES.length - 1;

  // Expose runtime API (no TS imports in the app)
  window.__DRM = {
    getOverrides: (id: string) => getOverrides(ALL_STATES.find(s => s.id === id) ?? null),
    getState: () => state,
    setStateByIndex: setIndex,
  };

  async function snap() {
    const el = (document.querySelector('[role="dialog"]') as HTMLElement)
            || (document.querySelector('.fixed.inset-0') as HTMLElement)
            || document.body;
    const canvas = await html2canvas(el, { backgroundColor: '#000', scale: 2, logging: false, useCORS: true });
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `${state?.id ?? 'screenshot'}.png` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 rounded-2xl bg-black/60 backdrop-blur p-3 shadow-xl ring-1 ring-white/10 z-[1000]">
      <div className="flex items-center justify-between">
        <div className="text-white/80 font-medium">Design Review Mode</div>
      </div>

      <div className="mt-2 text-xs text-white/60">
        State {index + 1} of {ALL_STATES.length} · {state?.flow === 'nearby' ? '🎯 Nearby' : '🎮 Create Game'}
      </div>
      <div className="mt-1 text-sm text-white">{state?.name}</div>
      {state?.description && <div className="text-xs text-white/50">{state.description}</div>}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button disabled={isFirst} onClick={() => setIndex(i => Math.max(i - 1, 0))}
          className="py-2 px-3 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white rounded-lg">Prev</button>

        <select className="py-2 px-3 bg-white/10 text-white rounded-lg"
                value={index}
                onChange={e => setIndex(Number(e.target.value))}>
          {ALL_STATES.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}
        </select>

        <button disabled={isLast} onClick={() => setIndex(i => Math.min(i + 1, ALL_STATES.length - 1))}
          className="py-2 px-3 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white rounded-lg">Next</button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={snap} className="py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg">
          Screenshot
        </button>
        <a href={`?review=0`} className="py-2 px-3 bg-white/10 hover:bg-white/15 text-white rounded-lg text-center">
          Close
        </a>
      </div>
    </div>
  );
}
