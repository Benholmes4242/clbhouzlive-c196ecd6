import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { FONT, INK, INK_MUTE } from '@/features/tourhub/_shared/tokens';

// Collapsible golfer search used by the Discover "View all" sheet header.
// Frosted treatment matches the Discover lens bar (AlmanacSections.tsx:32-35):
// translucent slate-50 tint + blur(10px) + hairline slate border.
const FROST_BG = 'rgba(244,246,249,0.94)';
const FROST_BORDER = '1px solid rgba(15,23,42,0.10)';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Props {
  /** Debounced query pushed to the parent. */
  onQueryChange: (q: string) => void;
  /** Fires when the field expands / collapses so the header can adapt. */
  onExpandedChange?: (open: boolean) => void;
}

export function GolferSearchField({ onQueryChange, onExpandedChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reduced = prefersReducedMotion();

  // Debounce ~120ms. No network work here - parent filters loaded rows.
  useEffect(() => {
    const t = window.setTimeout(() => onQueryChange(text.trim()), 120);
    return () => window.clearTimeout(t);
  }, [text, onQueryChange]);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  const collapse = () => {
    setText('');
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        aria-label="Search golfers"
        aria-expanded={false}
        onClick={() => setExpanded(true)}
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: FROST_BG,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: FROST_BORDER,
          color: INK,
          cursor: 'pointer',
          transition: reduced ? 'none' : 'opacity 200ms ease',
        }}
      >
        <Search size={16} strokeWidth={2.2} />
      </button>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 34,
        padding: '0 10px',
        borderRadius: 999,
        background: FROST_BG,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: FROST_BORDER,
        transition: reduced ? 'none' : 'width 200ms ease, opacity 200ms ease',
      }}
    >
      <Search size={15} strokeWidth={2.2} color={INK_MUTE} style={{ flexShrink: 0 }} />
      <input
        ref={inputRef}
        type="search"
        aria-label="Search golfers by name"
        placeholder="Search golfers"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            collapse();
          }
        }}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          color: INK,
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      />
      <button
        type="button"
        aria-label={text ? 'Clear search' : 'Close search'}
        aria-expanded
        onClick={() => {
          if (text) setText('');
          else collapse();
        }}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: 'rgba(15,23,42,0.06)',
          color: INK_MUTE,
          cursor: 'pointer',
        }}
      >
        <X size={13} strokeWidth={2.4} />
      </button>
    </div>
  );
}

// Accent-insensitive, case-insensitive substring match helper.
export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default GolferSearchField;
