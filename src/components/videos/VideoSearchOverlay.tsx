import React, { useMemo, useRef, useState } from 'react';
import { Search, X, Clock } from 'lucide-react';

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000]"
      aria-modal
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{ background: '#F8FAFC' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ background: '#E0E0E0' }} />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <button
            aria-label="Close"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
          >
            <X size={20} className="text-foreground/70" />
          </button>

          <div
            className="flex-1 h-11 rounded-2xl bg-muted/50 border border-border/50 px-3.5 flex items-center gap-3 transition-shadow focus-within:shadow-lg focus-within:border-primary/40 focus-within:ring-[3px] focus-within:ring-primary/15"
          >
            <Search size={18} className="text-muted-foreground/60 shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && q.trim() && commit(q.trim())}
              placeholder="Search videos, people, courses…"
              className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
              autoFocus
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="p-1 rounded-full hover:bg-muted/80 transition-colors"
              >
                <X size={16} className="text-muted-foreground/60" />
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-border/40" />

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 pt-4">
          {recent.length > 0 ? (
            <>
              <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">
                Recent searches
              </p>
              <div className="space-y-1">
                {recent.map(r => (
                  <button
                    key={r}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/[0.06] active:bg-primary/10 transition-colors text-left"
                    onClick={() => commit(r)}
                  >
                    <Clock size={16} className="text-muted-foreground/40 shrink-0" />
                    <span className="text-sm text-foreground/80">{r}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center pt-20">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search size={24} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Search for anything</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
