import React from 'react';
import { Trophy } from 'lucide-react';
import { useLiveRightNow } from '../../hooks/useOverviewModules';
import {
  ink, inkFaint, hairlineDark, gold, greenLive, fmtScore,
} from '../../utils/heroAtmosphere';

const TOUR_CODE: Record<string, string> = {
  pga: 'PGA', euro: 'DPW', lpga: 'LPGA', liv: 'LIV',
  champ: 'CHAMP', pgad: 'KFT',
};

function getTourCode(slug: string): string {
  return TOUR_CODE[slug] ?? slug.toUpperCase();
}

/**
 * <AllToursTicker> — horizontal ticker of currently-live tournaments. Rendered
 * at the bottom of the Tour Hero live + results states. Accent colour follows
 * the host surface: `green` on the live state, `gold` on the results state.
 */
export function AllToursTicker({
  activeTournamentId,
  onSelect,
  variant = 'live',
}: {
  activeTournamentId: string;
  onSelect: (id: string) => void;
  variant?: 'live' | 'results';
}) {
  const { data: liveTournaments } = useLiveRightNow();
  const tours = liveTournaments ?? [];
  if (tours.length === 0) return null;

  const accent = variant === 'results' ? gold : greenLive;
  const accentTint = variant === 'results' ? 'rgba(255,184,0,0.06)' : 'rgba(16,185,129,0.08)';
  const accentBorder = variant === 'results' ? 'rgba(255,184,0,0.30)' : 'rgba(16,185,129,0.30)';

  return (
    <div>
      <div
        style={{
          marginTop: 26, padding: '12px 0 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: `1px solid ${hairlineDark}`,
          fontSize: 9, fontWeight: 800, color: inkFaint, letterSpacing: '0.14em',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {variant === 'results' ? (
            <Trophy size={9} color={gold} strokeWidth={2.5} />
          ) : (
            <span
              style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: greenLive,
              }}
            />
          )}
          {variant === 'results' ? 'RECENT RESULTS' : 'ALL TOURS LIVE'}
        </span>
        <span>
          {variant === 'results'
            ? `${tours.length} TOURS · TAP TO SWITCH`
            : `${tours.length} HAPPENING NOW`}
        </span>
      </div>
      <div
        className="[&::-webkit-scrollbar]:hidden"
        style={{
          display: 'flex', gap: 8, paddingBottom: 16,
          overflowX: 'auto', scrollbarWidth: 'none' as any,
          WebkitOverflowScrolling: 'touch' as any,
          marginLeft: -20, paddingLeft: 20, marginRight: -20, paddingRight: 20,
        }}
      >
        {tours.map((t) => {
          const active = t.id === activeTournamentId;
          const tileLabel = (t as any).name ?? getTourCode(t.tourSlug);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              style={{
                flexShrink: 0, padding: '10px 12px', borderRadius: 10, minWidth: 140,
                background: active ? accentTint : 'rgba(255,255,255,0.025)',
                border: `1px solid ${active ? accentBorder : hairlineDark}`,
                textAlign: 'left',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <div
                style={{
                  fontSize: 9, fontWeight: 800,
                  color: active ? accent : inkFaint,
                  letterSpacing: '0.08em', marginBottom: 4,
                }}
              >
                {getTourCode(t.tourSlug)}
              </div>
              <div
                style={{
                  fontSize: 12, color: '#fff', fontWeight: 600, marginBottom: 4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 160,
                }}
              >
                {tileLabel}
              </div>
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: variant === 'results' ? (active ? gold : inkFaint) : greenLive,
                    fontWeight: 800, letterSpacing: '0.06em',
                  }}
                >
                  {variant === 'results' ? 'FINAL' : 'LIVE'}
                </span>
                <span
                  style={{
                    fontSize: 14, fontWeight: 800,
                    color: active && variant === 'results' ? gold : '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {t.leader ? fmtScore(t.leader.score) : '—'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
