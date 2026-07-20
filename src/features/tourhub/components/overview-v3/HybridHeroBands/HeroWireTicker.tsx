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

const PULSE_STYLE_ID = 'lovable-hero-wire-empty-pulse';
function ensurePulseStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(PULSE_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = PULSE_STYLE_ID;
  el.textContent = `
@keyframes lovable-hero-wire-empty-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}
.lovable-hero-wire-empty-pulse-label {
  animation: lovable-hero-wire-empty-pulse 2.2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .lovable-hero-wire-empty-pulse-label { animation: none !important; }
}
`;
  document.head.appendChild(el);
}

interface FactItem {
  key: string;
  label: string;
  value: string;
  labelColor?: string;
  labelPulse?: boolean;
}

export function HeroWireTicker({
  state,
  leaderboard,
  upcomingContenders,
  emptyStateFacts,
}: HeroWireTickerProps) {
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

  // ---------------------------------------------------------------------------
  // Empty state: upcoming tournament with no field predictions.
  // Build a fact list from whatever the tournament row exposes, in this exact
  // order: TEES OFF → VENUE → DEFENDS → {YEAR} WINNER → PURSE → FIELD (always
  // last, always present).
  // ---------------------------------------------------------------------------
  const emptyFacts = useMemo<FactItem[]>(() => {
    if (state.kind !== 'upcoming') return [];
    if (items.length > 0) return [];
    const f = emptyStateFacts ?? {};
    const list: FactItem[] = [];
    if (f.datesString) {
      list.push({
        key: 'tees-off',
        label: t('hero.teesOff', { defaultValue: 'TEES OFF' }),
        value: f.datesString,
      });
    }
    if (f.venueName) {
      list.push({
        key: 'venue',
        label: t('hero.venueLabel', { defaultValue: 'VENUE' }),
        value: f.venueName,
      });
    }
    if (f.defenderName) {
      list.push({
        key: 'defends',
        label: t('hero.defendsLabel', { defaultValue: 'DEFENDS' }),
        value: f.defenderName,
        labelColor: '#FDE68A',
      });
    }
    if (f.defenderYear && (f.defenderScore || f.defenderSurname)) {
      const parts = [f.defenderScore, f.defenderSurname].filter(Boolean).join(' — ');
      if (parts) {
        list.push({
          key: 'prev-winner',
          label: t('hero.prevWinner', {
            year: f.defenderYear,
            defaultValue: `${f.defenderYear} WINNER`,
          }),
          value: parts,
        });
      }
    }
    if (f.purse) {
      list.push({
        key: 'purse',
        label: t('hero.purse', { defaultValue: 'PURSE' }),
        value: f.purse,
      });
    }
    list.push({
      key: 'field',
      label: t('hero.fieldSoon', { defaultValue: 'FIELD SOON' }),
      value: t('hero.fieldAnnouncedSoon', { defaultValue: 'Announced soon' }),
      labelPulse: true,
    });
    return list;
  }, [state.kind, items.length, emptyStateFacts, t]);

  useEffect(() => {
    if (emptyFacts.some((f) => f.labelPulse)) ensurePulseStyles();
  }, [emptyFacts]);

  const emptyItems = useMemo(
    () =>
      emptyFacts.map((f, idx) => (
        <span
          key={f.key}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 36,
            marginRight: idx === emptyFacts.length - 1 ? 0 : 24,
            flexShrink: 0,
            fontFamily: FONT,
          }}
        >
          <span
            className={f.labelPulse ? 'lovable-hero-wire-empty-pulse-label' : undefined}
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: f.labelColor ?? 'rgba(255,255,255,0.45)',
              marginRight: 8,
              textTransform: 'uppercase',
            }}
          >
            {f.label}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              whiteSpace: 'nowrap',
            }}
          >
            {f.value}
          </span>
          {idx === emptyFacts.length - 1 ? null : (
            <span
              aria-hidden="true"
              style={{
                width: 3,
                height: 3,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.25)',
                marginLeft: 16,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
          )}
        </span>
      )),
    [emptyFacts],
  );

  if (items.length === 0 && state.kind === 'upcoming' && emptyFacts.length > 0) {
    return (
      <TickerShell
        items={emptyItems}
        background={WIRE_BG}
        height={WIRE_HEIGHT}
        gap={0}
        leadingChip={
          <EmptyLeadingChip label={t('hero.fieldSoon', { defaultValue: 'FIELD SOON' })} />
        }
        dividerTop="rgba(255,255,255,0.08)"
        ariaLabel={t('hero.theField', { defaultValue: 'The field' })}
        animated={emptyFacts.length >= 2}
      />
    );
  }

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
