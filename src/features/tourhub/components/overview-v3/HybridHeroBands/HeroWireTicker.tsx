/**
 * HeroWireTicker — Tour Hub hero leaderboard band.
 *
 * A dark wire ticker (36px tall, #15171F) that lives at the bottom of the
 * HybridHero, replacing the old MiddleBand + LeaderboardBand two-band stack.
 * Delegates to the shared `TickerShell` so behaviour matches the Explore-tab
 * WireTicker (seamless -50% loop, pause-on-touch, reduced-motion swap).
 *
 * Top-10 tie rule: consecutive T-positions with the same score collapse into a
 * single "T1 (n) · Name/Name … · −12" entry so the ticker mirrors what a
 * broadcast lower-third would say instead of stuttering three "T1" chips.
 *
 * Live state feeds top-10 rows. Results state feeds the final top-10.
 * Upcoming feeds nothing → shell renders an empty bar as a hairline.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TickerShell } from '@/components/shared/wire/TickerShell';
import { fmtScore, type TickerRow } from '../HybridHero.utils';
import { NUMERIC_STYLE } from '../HybridHero.constants';

const BG = '#15171F';

function scoreColor(s: number): string {
  if (s < 0) return '#DC2626';
  if (s > 0) return 'rgba(255,255,255,0.55)';
  return 'rgba(255,255,255,0.90)';
}

type CollapsedRow =
  | { kind: 'solo'; rank: string; name: string; score: number }
  | { kind: 'tie'; rank: string; count: number; names: string[]; score: number };

function collapseTies(rows: TickerRow[]): CollapsedRow[] {
  const out: CollapsedRow[] = [];
  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (
      j < rows.length &&
      rows[j].score === rows[i].score &&
      rows[j].rank === rows[i].rank
    )
      j++;
    const group = rows.slice(i, j);
    if (group.length === 1) {
      out.push({ kind: 'solo', rank: group[0].rank, name: group[0].shortName, score: group[0].score });
    } else {
      // Prefix with T when the group is a tie group and not already T-prefixed.
      const rank = group[0].rank.startsWith('T') ? group[0].rank : `T${group[0].rank}`;
      out.push({
        kind: 'tie',
        rank,
        count: group.length,
        names: group.map((g) => g.shortName),
        score: group[0].score,
      });
    }
    i = j;
  }
  return out;
}

interface HeroWireTickerProps {
  rows: TickerRow[];
}

export function HeroWireTicker({ rows }: HeroWireTickerProps) {
  const { t } = useTranslation('tourhub');

  const collapsed = useMemo(() => collapseTies(rows ?? []), [rows]);

  const nodes = collapsed.map((r) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 7,
        ...NUMERIC_STYLE,
        fontSize: 12,
      }}
    >
      <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.42)', fontWeight: 700 }}>
        {r.rank}
      </span>
      {r.kind === 'tie' && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#0F172A',
            background: 'rgba(255,255,255,0.72)',
            padding: '1px 4px',
            borderRadius: 3,
            letterSpacing: '0.02em',
          }}
        >
          {r.count}
        </span>
      )}
      <span
        style={{
          fontWeight: 600,
          color: 'rgba(255,255,255,0.94)',
          maxWidth: r.kind === 'tie' ? 220 : 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {r.kind === 'tie' ? r.names.slice(0, 3).join(' / ') : r.name}
      </span>
      <span style={{ fontWeight: 800, color: scoreColor(r.score) }}>{fmtScore(r.score)}</span>
    </span>
  ));

  const label = t('overview.ticker.top10Label');
  const leftAccessory = (
    <div
      style={{
        padding: '0 12px',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.16em',
        color: 'rgba(255,255,255,0.55)',
        background: BG,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        borderRight: '0.5px solid rgba(255,255,255,0.10)',
        zIndex: 2,
      }}
    >
      {label}
    </div>
  );

  return (
    <TickerShell
      items={nodes}
      itemKey={(i) => `${collapsed[i]?.rank}-${i}`}
      height={36}
      background={BG}
      gap={22}
      durationSec={Math.max(40, collapsed.length * 5.5)}
      padding="0 16px"
      ariaLabel={label}
      leftAccessory={leftAccessory}
      edgeFadeColor={BG}
    />
  );
}
