import React, { useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import CinematicOverlay from '../cinematic/CinematicOverlay';

export type VideoSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  onPick?: (q: string) => void;
};

export default function VideoSearchOverlay({ open, onClose, onPick }: VideoSearchOverlayProps) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useMemo<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('vh_recent') || '[]');
    } catch {
      return [];
    }
  }, []);

  const commit = (value: string) => {
    const next = [value, ...recent.filter(v => v !== value)].slice(0, 8);
    localStorage.setItem('vh_recent', JSON.stringify(next));
    onPick?.(value);
    onClose();
  };

  return (
    <CinematicOverlay
      isOpen={open}
      onClose={onClose}
      variant="sheet"
      tone="translucent"
      size="fullscreen"
      showHandle
      initialFocusRef={inputRef}
      header={
        <div className="flex items-center gap-3">
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex-1 bg-white/70 rounded-sq-md px-4 py-2.5 flex items-center gap-3">
            <Search size={20} className="text-gray-500" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && q.trim() && commit(q.trim())}
              placeholder="Search videos, people, courses…"
              className="w-full bg-transparent outline-none text-base"
            />
          </div>
          {q && (
            <button
              onClick={() => setQ('')}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      }
    >
      {recent.length > 0 && (
        <>
          <div className="text-sm opacity-70 mb-3">Recent searches</div>
          <div className="grid grid-cols-2 gap-2">
            {recent.map(r => (
              <button
                key={r}
                className="rounded-sq-sm px-4 py-2.5 bg-white/60 hover:bg-white/80 transition-colors text-left"
                onClick={() => commit(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}
    </CinematicOverlay>
  );
}
