/**
 * MentionAutocomplete — floating suggestion list for @-mentions.
 *
 * Positioning: caller wraps the textarea in a `position: relative`
 * container and mounts <MentionAutocomplete /> as a sibling. The
 * popup renders as an absolute box anchored to the top of that
 * container, so it floats ABOVE the composer input row.
 *
 * Visual language matches the Dispatch suggestion cards
 * (white surface, 0.5px hairline border, squircle avatar, amber
 * accent for active row).
 */

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Building2, Loader2 } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import type { MentionSuggestion } from '@/lib/mentions/useMentionAutocomplete';

interface Props {
  isActive: boolean;
  suggestions: MentionSuggestion[];
  isLoading: boolean;
  onSelect: (s: MentionSuggestion) => void;
  /** Optional textarea ref — enables ↑/↓/Enter/Esc keyboard control. */
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
  /** Empty query fallback copy. */
  emptyHint?: string;
}

const INK = '#0F172A';
const INK_SUBTLE = '#94A3B8';
const AMBER = '#F7931E';
const BORDER = 'rgba(15,23,42,0.10)';

export function MentionAutocomplete({
  isActive,
  suggestions,
  isLoading,
  onSelect,
  inputRef,
  emptyHint = 'No matches',
}: Props) {
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset highlight whenever the suggestion set changes.
  useEffect(() => {
    setHighlight(0);
  }, [suggestions]);

  // Keyboard control on the anchored input.
  useEffect(() => {
    if (!isActive || !inputRef?.current) return;
    const el = inputRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === 'ArrowDown') {
        if (suggestions.length === 0) return;
        e.preventDefault();
        setHighlight(h => (h + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        if (suggestions.length === 0) return;
        e.preventDefault();
        setHighlight(h => (h - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (suggestions.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect(suggestions[highlight]);
      } else if (e.key === 'Escape') {
        // Let the composer decide what to do (usually just close via losing token).
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [isActive, suggestions, highlight, onSelect, inputRef]);

  if (!isActive) return null;

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Mention suggestions"
      className="absolute left-0 right-0 z-[210]"
      style={{
        bottom: 'calc(100% + 8px)',
        maxHeight: 260,
        overflowY: 'auto',
        background: '#ffffff',
        borderRadius: 12,
        border: `0.5px solid ${BORDER}`,
        boxShadow: '0 8px 24px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.08)',
      }}
    >
      {isLoading && suggestions.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-3" style={{ color: INK_SUBTLE, fontSize: 13 }}>
          <Loader2 size={14} className="animate-spin" />
          Searching…
        </div>
      )}
      {!isLoading && suggestions.length === 0 && (
        <div className="px-3 py-3" style={{ color: INK_SUBTLE, fontSize: 13 }}>
          {emptyHint}
        </div>
      )}
      {suggestions.map((s, i) => {
        const active = i === highlight;
        return (
          <button
            key={`${s.entityType}:${s.entityId}`}
            type="button"
            role="option"
            aria-selected={active}
            onMouseDown={(e) => {
              // mousedown so the textarea doesn't blur before we insert.
              e.preventDefault();
              onSelect(s);
            }}
            onMouseEnter={() => setHighlight(i)}
            className="w-full flex items-center gap-2.5 text-left border-0 cursor-pointer"
            style={{
              padding: '8px 10px',
              minHeight: 44,
              background: active ? 'rgba(247,147,30,0.08)' : 'transparent',
              borderBottom: i === suggestions.length - 1 ? 'none' : `0.5px solid ${BORDER}`,
            }}
          >
            <SquircleAvatar
              size={30}
              src={s.avatarUrl ?? undefined}
              alt={s.display}
              fallback={s.display.charAt(0).toUpperCase()}
              hairlineRing
              ringColor={LIGHT_HAIRLINE}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span
                  className="truncate"
                  style={{ fontSize: 13.5, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}
                >
                  {s.display}
                </span>
                {s.isVerified && (
                  <CheckCircle2 size={12} style={{ color: AMBER, flexShrink: 0 }} strokeWidth={2.25} />
                )}
                {s.entityType === 'business' && (
                  <Building2 size={11} style={{ color: INK_SUBTLE, flexShrink: 0 }} strokeWidth={2} />
                )}
              </div>
              {s.secondary && (
                <div
                  className="truncate"
                  style={{ fontSize: 11.5, color: INK_SUBTLE, lineHeight: 1.2, marginTop: 1 }}
                >
                  {s.secondary}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
