/**
 * HeroWireTicker — dark wire ticker rendered directly under the
 * Overview hero PhotoBand.
 *
 * State matrix:
 *   - live:     TOP 10 (red chip + pulse) — leaderboard rows with THRU
 *   - results:  TOP 10 (red chip) — final leaderboard rows
 *   - upcoming: THE FIELD (amber chip) — AI top contenders (OWGR)
 *
 * Ties: full inclusion (position <= 10 emits every entry). Rank label
 * is "T{n}" when position_tied or when duplicate positions are detected.
 *
 * Absent state → returns null (no band).
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { TickerShell } from '@/components/shared/wire/TickerShell';
import { WIRE_BG, WIRE_HEIGHT, WIRE_ITEM_GAP } from '@/components/shared/wire/tokens';
import { fmtScore, shortenName, type HeroState } from '../HybridHero.utils';
import { getScoreColor } from '../../../_shared/scoreColor';
import { NUMERIC_STYLE } from '../HybridHero.constants';

const FONT = "'Geist', -apple-system, BlinkMacSystemFont, sans-serif";

interface HeroWireTickerProps {
  state: HeroState;
  leaderboard: any[];
  /** Upcoming-state AI top contenders (already sorted / pre-filtered upstream). */
  upcomingContenders?: Array<{
    playerName: string;
    worldRanking?: number | null;
    country?: string | null;
  }>;
  /**
   * Upcoming-state fallback facts used when `upcomingContenders` is empty.
   * Every field is optional; the empty-state list is built from whatever is
   * present, in the exact order documented in the addendum.
   */
  emptyStateFacts?: {
    datesString?: string | null;
    venueName?: string | null;
    defenderName?: string | null;
    defenderYear?: string | number | null;
    defenderScore?: string | null;
    defenderSurname?: string | null;
    purse?: string | null;
  };
}

/** Amber-toned chip used for the "FIELD SOON" empty state. */
function EmptyLeadingChip({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        background: 'rgba(247,147,30,0.16)',
        color: '#F7931E',
        fontFamily: FONT,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

function LeadingChip({
  label,
  variant,
}: {
  label: string;
  variant: 'red' | 'amber';
}) {
  const bg = variant === 'red' ? '#FF3B3B' : '#F7931E';
  const isLive = variant === 'red';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 12px',
        background: bg,
        color: '#0E1013',
        fontFamily: FONT,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        flexShrink: 0,
      }}
    >
      {isLive && (
        <span
          className="hybrid-live-pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: 'white',
            display: 'inline-block',
          }}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </div>
  );
}

interface Row {
  key: string;
  rank: string;
  name: string;
  score?: number | null;
  scoreText?: string;
  thru?: string | null;
  metaRight?: string | null;
}

function entryName(e: any): string {
  const p = e?.player;
  const full = p?.full_name || `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim();
  return p?.last_name || shortenName(full) || '—';
}

function derivePosition(entry: any): { rank: string; posNum: number | null } {
  const pos = entry?.position;
  if (pos == null) return { rank: '—', posNum: null };
  const tied = !!entry?.position_tied;
  return { rank: tied ? `T${pos}` : String(pos), posNum: Number(pos) };
}

export function HeroWireTicker({ state, leaderboard, upcomingContenders }: HeroWireTickerProps) {
  const { t } = useTranslation('tourhub');

  const rows = useMemo<Row[]>(() => {
    if (state.kind === 'live' || state.kind === 'results') {
      const arr = Array.isArray(leaderboard) ? leaderboard : [];

      // Detect duplicate positions so we can label "Tn" even if the source
      // omits position_tied.
      const counts = new Map<number, number>();
      for (const e of arr) {
        const p = e?.position;
        if (typeof p === 'number') counts.set(p, (counts.get(p) ?? 0) + 1);
      }

      const top: Row[] = [];
      for (const e of arr) {
        const { rank, posNum } = derivePosition(e);
        if (posNum == null || posNum > 10) continue;
        const duplicated = counts.get(posNum) ?? 0;
        const finalRank = duplicated > 1 && !rank.startsWith('T') ? `T${posNum}` : rank;
        const score = typeof e?.score === 'number' ? e.score : null;
        const thruRaw = e?.thru;
        const thruLabel =
          state.kind === 'live' && thruRaw != null && thruRaw !== ''
            ? typeof thruRaw === 'number'
              ? `THRU ${thruRaw}`
              : String(thruRaw)
            : null;
        top.push({
          key: `${e?.player?.id ?? entryName(e)}-${posNum}`,
          rank: finalRank,
          name: entryName(e),
          score,
          scoreText: fmtScore(score),
          thru: thruLabel,
        });
      }
      return top;
    }

    if (state.kind === 'upcoming') {
      const list = (upcomingContenders ?? [])
        .filter((c) => c && c.playerName)
        .slice(0, 10);
      return list.map((c, i) => ({
        key: `${c.playerName}-${i}`,
        rank: String(i + 1),
        name: c.playerName,
        scoreText: '',
        metaRight: c.worldRanking != null ? `OWGR ${c.worldRanking}` : null,
      }));
    }

    return [];
  }, [state, leaderboard, upcomingContenders]);

  const chip = useMemo(() => {
    if (state.kind === 'live') {
      return <LeadingChip label={t('hero.live', { defaultValue: 'LIVE' })} variant="red" />;
    }
    if (state.kind === 'results') {
      return <LeadingChip label={t('hero.top10', { defaultValue: 'TOP 10' })} variant="red" />;
    }
    return <LeadingChip label={t('hero.theField', { defaultValue: 'THE FIELD' })} variant="amber" />;
  }, [state.kind, t]);

  const items = useMemo(
    () =>
      rows.map((row) => (
        <span
          key={row.key}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
            flexShrink: 0,
            fontFamily: FONT,
          }}
        >
          <span
            style={{
              ...NUMERIC_STYLE,
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.42)',
              letterSpacing: '0.04em',
            }}
          >
            {row.rank}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.94)',
              whiteSpace: 'nowrap',
            }}
          >
            {row.name}
          </span>
          {row.scoreText ? (
            <span
              style={{
                ...NUMERIC_STYLE,
                fontSize: 12,
                fontWeight: 800,
                color:
                  typeof row.score === 'number'
                    ? getScoreColor(row.score, 'dark')
                    : 'rgba(255,255,255,0.75)',
              }}
            >
              {row.scoreText}
            </span>
          ) : null}
          {row.thru ? (
            <span
              style={{
                ...NUMERIC_STYLE,
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.08em',
              }}
            >
              {row.thru}
            </span>
          ) : null}
          {row.metaRight ? (
            <span
              style={{
                ...NUMERIC_STYLE,
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.08em',
              }}
            >
              {row.metaRight}
            </span>
          ) : null}
        </span>
      )),
    [rows],
  );

  if (items.length === 0) return null;

  return (
    <TickerShell
      items={items}
      background={WIRE_BG}
      height={WIRE_HEIGHT}
      gap={WIRE_ITEM_GAP}
      leadingChip={chip}
      dividerTop="rgba(255,255,255,0.08)"
      ariaLabel={
        state.kind === 'upcoming'
          ? t('hero.theField', { defaultValue: 'The field' })
          : t('hero.top10', { defaultValue: 'Top 10' })
      }
    />
  );
}

export default HeroWireTicker;
