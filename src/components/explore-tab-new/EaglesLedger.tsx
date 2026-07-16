import { useMemo, useState } from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { SC_EAGLE, SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import {
  useRegionFeats,
  useRegionEagleLeaders,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { TierSeeAllSheet } from './TierSeeAllSheet';
import { SectionHead } from './SectionHead';
import { formatHcp } from '@/lib/formatHcp';
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
function extractHoleNo(row: FeatRow): string {
  const s = String(row.feat_value ?? row.value ?? '');
  const m = s.match(/\d+/);
  return m ? m[0] : '—';
}

interface Props {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap?: (row: FeatRow) => void;
  onLeaderTap?: (userId: string) => void;
}

export function EaglesLedger({ region, regionUpper, mode, onRowTap, onLeaderTap }: Props) {
  const { data: featsData, isLoading } = useRegionFeats(region, 'eagles', 'latest');
  const { data: leadersData } = useRegionEagleLeaders(region);
  const feats = featsData ?? [];
  const [sheetOpen, setSheetOpen] = useState(false);

  const leaders = useMemo(
    () =>
      (leadersData ?? [])
        .filter((r) => (r.eagles ?? 0) > 0)
        .sort((a, b) => (b.eagles ?? 0) - (a.eagles ?? 0))
        .slice(0, ROWS),
    [leadersData],
  );

  const hasData = mode === 'alltime' ? leaders.length > 0 : feats.length > 0;
  if (!isLoading && !hasData) return null;

  const leaderMax = leaders[0]?.eagles ?? 1;
  const scopeLabel = mode === 'alltime' ? 'MOST' : 'LATEST';

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      <SectionHead
        overline={`Eagles · ${scopeLabel} · ${regionUpper}`}
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
          {mode === 'alltime'
            ? leaders.map((r, i) => {
                const isFirst = i === 0;
                const name = formatHolderName(r.holder_name);
                const count = r.eagles ?? 0;
                const pct = Math.max(0.08, Math.min(1, count / (leaderMax || 1)));
                const hcpText =
                  r.holder_hcp != null ? formatHcp(r.holder_hcp) : null;
                return (
                  <button
                    key={`${r.user_id ?? name}-${i}`}
                    type="button"
                    onClick={() => {
                      if (r.user_id && onLeaderTap) onLeaderTap(r.user_id);
                    }}
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
                      cursor: r.user_id ? 'pointer' : 'default',
                      fontFamily: FONT,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 16,
                          fontSize: 11,
                          fontWeight: 800,
                          color: isFirst ? SC_EAGLE : RANK_MUTE,
                          fontVariantNumeric: 'tabular-nums',
                          textAlign: 'center',
                        }}
                      >
                        {i + 1}
                      </div>
                      <SquircleAvatar
                        size={24}
                        srcCandidates={r.holder_avatar ? [r.holder_avatar] : []}
                        alt={name}
                        fallback={initials(name)}
                        userId={r.user_id}
                        hairlineRing
                        ringColor={isFirst ? SC_FILL_GOLD : LIGHT_HAIRLINE}
                      />
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: INK,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2,
                        }}
                      >
                        {name}
                        {hcpText ? (
                          <span
                            className="tabular-nums"
                            style={{
                              marginLeft: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              color: AMBER,
                            }}
                          >
                            {hcpText}
                          </span>
                        ) : null}
                      </div>
                      <div
                        className="tabular-nums"
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: isFirst ? SC_EAGLE : INK,
                          letterSpacing: '-0.01em',
                          lineHeight: 1,
                        }}
                      >
                        {count}
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
              })
            : feats.slice(0, ROWS).map((row, i) => {
                const name = formatHolderName(row.holder_name);
                const when = row.play_date ?? row.attained_at ?? null;
                const hole = extractHoleNo(row);
                const isFirst = i === 0;
                return (
                  <button
                    key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                    type="button"
                    onClick={() => onRowTap?.(row)}
                    className="text-left active:opacity-80 transition-opacity"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 2px',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderTop: isFirst ? 'none' : `0.5px solid ${HAIRLINE}`,
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    <SquircleAvatar
                      size={26}
                      srcCandidates={row.holder_avatar ? [row.holder_avatar] : []}
                      alt={name}
                      fallback={initials(name)}
                      userId={row.user_id}
                      hairlineRing
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
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#94A3B8',
                          lineHeight: 1,
                        }}
                      >
                        HOLE
                      </div>
                      <div
                        className="tabular-nums"
                        style={{
                          marginTop: 3,
                          fontSize: 15,
                          fontWeight: 900,
                          color: INK,
                          lineHeight: 1,
                        }}
                      >
                        {hole}
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>
      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="eagles"
        region={region}
        rows={feats}
        onRowTap={onRowTap}
        initialMode={mode}
      />
    </section>
  );
}

export default EaglesLedger;
