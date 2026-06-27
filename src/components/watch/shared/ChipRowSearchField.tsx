import { memo, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface ChipRowSearchFieldProps {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  placeholder?: string;
}

/**
 * Inline search field that lives INSIDE the light mood-chip row (Videos + Clips).
 * Controlled; grows on the left while the mood pills stay scrollable to its right.
 * Autofocuses on mount. Distinct from the full-screen SearchOverlay.
 */
function ChipRowSearchFieldInner({ value, onChange, onClose, placeholder = 'Search...' }: ChipRowSearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className="flex items-center shrink-0"
      style={{
        height: 30,
        borderRadius: 15,
        background: '#FFFFFF',
        border: '1px solid rgba(15,23,42,0.12)',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        padding: '0 10px 0 12px',
        gap: 7,
        minWidth: 150,
        maxWidth: 240,
        flex: '0 0 auto',
        width: 210,
      }}
    >
      <Search size={15} strokeWidth={2} color="#94A3B8" style={{ flexShrink: 0 }} aria-hidden />
      <input
        ref={inputRef}
        className="chip-row-search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        placeholder={placeholder}
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-label={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#0F172A',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          caretColor: '#F7931E',
          padding: 0,
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        className="flex items-center justify-center active:scale-[0.97]"
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          background: 'transparent',
          color: '#64748B',
          border: 'none',
          flexShrink: 0,
          padding: 4,
        }}
      >
        <X size={13} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

export const ChipRowSearchField = memo(ChipRowSearchFieldInner);

export const ChipRowSearchTrigger = memo(function ChipRowSearchTrigger(
  { onOpen }: { onOpen: () => void }
) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open search"
      className="shrink-0 flex items-center justify-center active:scale-[0.97]"
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        background: '#FFFFFF',
        border: '1px solid rgba(15,23,42,0.12)',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        color: '#64748B',
        flex: '0 0 auto',
      }}
    >
      <Search size={16} strokeWidth={2} aria-hidden />
    </button>
  );
});


export default ChipRowSearchField;
