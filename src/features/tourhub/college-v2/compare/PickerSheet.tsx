/**
 * PickerSheet — the "Change" side picker for the duel.
 *
 * House BottomSheet (light). Search input filters the yearbook standings
 * client-side (same pattern as the College Hub). Row = crest 28 + name +
 * "No.{rank}". Tap replaces the target side by updating ?c1/?c2 and
 * closes. The other side is preserved as-is. If the user picks the same
 * slug as the opposite side, we ignore the tap (no self-duel).
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TITLE } from '@/lib/tokens/type';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  AMBER,
  FONT,
  GOLD,
  GOLD_DEEP,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import type { YearbookStanding } from '@/features/tourhub/college-v2/hub/data/useFranchiseStandings';

interface Props {
  open: boolean;
  onClose: () => void;
  /** which side we're replacing */
  target: 'c1' | 'c2' | null;
  standings: YearbookStanding[];
  /** slug for the OTHER side; disables that row */
  otherSlug: string;
}

export function PickerSheet({ open, onClose, target, standings, otherSlug }: Props) {
  const [, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const debounced = useDebouncedValue(q, 150);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    if (!needle) return standings;
    return standings.filter((s) => {
      const hay = `${s.collegeName} ${s.shortName ?? ''} ${s.normalizedName}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [standings, debounced]);

  const handlePick = (slug: string) => {
    if (!target) return;
    if (slug === otherSlug) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(target, slug);
      return next;
    }, { replace: true });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div style={{ padding: '8px 16px 12px', borderBottom: `0.5px solid ${HAIRLINE_INK_10}`, background: SLATE_50 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: INK_FAINT,
            marginBottom: 4,
          }}
        >
          Change {target === 'c1' ? 'Left' : 'Right'}
        </div>
        <div
          style={{
            ...TITLE,
            color: INK,
            marginBottom: 12,
          }}
        >
          Pick a college
        </div>
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            color={AMBER}
            strokeWidth={2.5}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search colleges…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: '100%',
              height: 34,
              paddingLeft: 30,
              paddingRight: 10,
              borderRadius: 8,
              background: SURFACE,
              border: `1px solid ${HAIRLINE_INK_10}`,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              color: INK,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: SURFACE }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            No colleges match "{debounced}".
          </div>
        ) : (
          filtered.map((s) => {
            const disabled = s.normalizedName === otherSlug;
            const isTop = s.rank === 1;
            return (
              <button
                key={s.normalizedName}
                type="button"
                onClick={() => handlePick(s.normalizedName)}
                disabled={disabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  textAlign: 'left',
                  fontFamily: FONT,
                }}
              >
                <div
                  style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}
                  aria-hidden
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '34%',
                      overflow: 'hidden',
                      background: isTop ? 'rgba(255,184,0,0.10)' : 'rgba(15,23,42,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, color: isTop ? GOLD_DEEP : INK }}>
                        {(s.shortName ?? s.collegeName).slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Traced canonical hairline (light surface). */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '34%',
                      border: isTop ? `1px solid ${GOLD_DEEP}` : '1px solid rgba(15,23,42,0.12)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.collegeName}
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: isTop ? GOLD : INK_MUTE,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  No.{s.rank}
                </div>
              </button>
            );
          })
        )}
        <div style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default PickerSheet;
