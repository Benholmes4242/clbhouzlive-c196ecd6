import { useMemo, useState } from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import {
  useRegionFeats,
  sortBirdieHauls,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { TierSeeAllSheet } from './TierSeeAllSheet';
import { SectionHead } from './SectionHead';
import { relativeTime } from '@/utils/relativeTime';
import { FONT } from './gamingLightTokens';

const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.45)';
const RANK_MUTE = 'rgba(15,23,42,0.35)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const BAR_TRACK = 'rgba(15,23,42,0.08)';
const BAR_GRADIENT = `linear-gradient(90deg, ${AMBER}, #FBBC2E)`;
const CARD_BG = '#FFFFFF';
const ROWS = 5;

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}
function initials(name: string): string {
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
function birdieCount(row: FeatRow): number {
  return parseFloat(String(row.feat_value ?? row.value ?? '').replace(/[^\d.]/g, '')) || 0;
}

interface Props {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap?: (row: FeatRow) => void;
}

export function BirdieHaulsLedger({ region, regionUpper, mode, onRowTap }: Props) {
  const { data, isLoading } = useRegionFeats(region, 'birdie_hauls', mode);
  const rows = useMemo(() => sortBirdieHauls(data ?? [], mode), [data, mode]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const display = rows.slice(0, ROWS);
  const maxCount = useMemo(() => {
    let m = 0;
    for (const r of display) m = Math.max(m, birdieCount(r));
    return m > 0 ? m : 1;
  }, [display]);

  if (!isLoading && display.length === 0) return null;

  const scopeLabel = mode === 'alltime' ? 'BEST EVER' : 'LATEST';

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      <SectionHead
        overline={`Birdie hauls · ${scopeLabel} · ${regionUpper}`}
        meta="View all"
        onMeta={() => setSheetOpen(true)}
      />
      <div style={{ padding: '0 16px' }}>
        <div
          style={{
            background: CARD_BG,
            borderRadius: 16,
            border: `0.5px solid ${HAIRLINE}`,
            boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
            padding: '10px 12px',
          }}
        >
          {display.map((row, i) => {
            const isFirst = i === 0;
            const name = formatHolderName(row.holder_name);
            const count = birdieCount(row);
            const pct = Math.max(0.08, Math.min(1, count / maxCount));
            const when = row.play_date ?? row.attained_at ?? null;
            return (
              <button
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                type="button"
                onClick={() => onRowTap?.(row)}
                className="text-left active:opacity-80 transition-opacity"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '9px 2px',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderTop: isFirst ? 'none' : `0.5px solid ${HAIRLINE}`,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 16,
                      fontSize: 11,
                      fontWeight: 800,
                      color: isFirst ? AMBER : RANK_MUTE,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'center',
                    }}
                  >
                    {i + 1}
                  </div>
                  <SquircleAvatar
                    size={24}
                    srcCandidates={row.holder_avatar ? [row.holder_avatar] : []}
                    alt={name}
                    fallback={initials(name)}
                    userId={row.user_id}
                    hairlineRing
                    ringColor={isFirst ? SC_FILL_GOLD : LIGHT_HAIRLINE}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: INK,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: INK_MUTE,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.course_name}
                      {when ? ` · ${relativeTime(when)}` : ''}
                    </div>
                  </div>
                  <div
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      minWidth: 44,
                    }}
                  >
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: isFirst ? AMBER : INK,
                        lineHeight: 1,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {count}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#94A3B8',
                        lineHeight: 1,
                      }}
                    >
                      BIRDIES
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: 26,
                    height: 4,
                    borderRadius: 999,
                    background: BAR_TRACK,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct * 100}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: BAR_GRADIENT,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="birdie_hauls"
        region={region}
        rows={rows}
        onRowTap={onRowTap}
        initialMode={mode}
      />
    </section>
  );
}

export default BirdieHaulsLedger;
