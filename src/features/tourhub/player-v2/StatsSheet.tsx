/**
 * StatsSheet - one-scroll canvas replacing the old four-tab statistics
 * page. Uses the house BottomSheet at a 75dvh cap, white panel surface, body
 * as the only scroller. Sub-sections: OVERVIEW / BALL STRIKING / SHORT GAME /
 * STROKES GAINED. Every field checks for null and omits its row; a sub-section
 * with all-null fields omits entirely.
 *
 * Ranks are a LOOKUP, never a calculation: useLeaderCategories already ranks
 * the whole PGA pool from the same sr_player_statistics table, and its rank
 * maps are read here by category key + player_id. Ten stats have a ranked
 * category; six do not (see UNRANKED note below) and render a figure alone.
 * Off the PGA Tour the map is empty and every cell shows a figure alone -
 * that is correct and is not papered over.
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { TourPlayerStatistics } from '../hooks/useTourHubData';
import type { TourId } from '../hooks/useOverviewData';
import { formatEarnings } from '../_shared/formatEarnings';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  LEADER_STAT_LABELS,
  currentSeasonYear,
  useLeaderCategories,
} from '../leaders-v2/data/useLeaderCategories';
import { INK, INK_FAINT, INK_MUTE, SURFACE } from '../_shared/tokens';
import { TITLE, FIGS } from '@/lib/tokens/type';

interface StatsSheetProps {
  open: boolean;
  onClose: () => void;
  playerStats: TourPlayerStatistics;
  playerName: string;
  tour: TourId;
}

function fmtInt(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}
function fmtDecimal(v: number | null | undefined, d = 2): string | null {
  if (v === null || v === undefined) return null;
  return v.toFixed(d);
}
function fmtPct(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return `${v.toFixed(1)}%`;
}
function fmtYards(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return `${v.toFixed(1)} yds`;
}
/** Money goes through the ONE shared formatter. Absent stays absent (null),
 *  but a genuine zero is a real fact and renders as $0. */
function fmtMoney(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return formatEarnings(v);
}
/** Signed strokes gained. Round FIRST, then branch on the rounded value, so
 *  -0.004 reads "0.00" and never "-0.00". */
function fmtSG(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const r = Number(v.toFixed(2));
  if (r === 0) return '0.00';
  return (r > 0 ? '+' : '') + r.toFixed(2);
}

interface RankRef {
  rank: number;
  tied: boolean;
}

interface Row {
  label: string;
  value: string;
  rank?: RankRef;
}

function Cell({ row, ordinal }: { row: Row; ordinal: (r: RankRef) => string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: INK_FAINT,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
        }}
      >
        {row.label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 19,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {row.value}
      </div>
      {row.rank && (
        <div
          style={{
            marginTop: 3,
            fontSize: 9,
            fontWeight: 700,
            color: INK_FAINT,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {ordinal(row.rank)}
        </div>
      )}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 6px',
        fontSize: 10,
        fontWeight: 700,
        color: INK,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </p>
  );
}

function SubSection({
  label,
  rows,
  ordinal,
}: {
  label: string;
  rows: Row[];
  ordinal: (r: RankRef) => string;
}) {
  if (rows.length === 0) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <Kicker>{label}</Kicker>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 20,
          rowGap: 20,
        }}
      >
        {rows.map((r) => (
          <Cell key={r.label} row={r} ordinal={ordinal} />
        ))}
      </div>
    </div>
  );
}

export function StatsSheet({ open, onClose, playerStats, playerName, tour }: StatsSheetProps) {
  const { t } = useTranslation('tourhub');
  const label = (key: keyof typeof LEADER_STAT_LABELS) => t(LEADER_STAT_LABELS[key].shortKey);

  // Gated: this must NOT fire on player-page mount, only when the sheet opens.
  const { data: leaders } = useLeaderCategories(tour, { enabled: open });
  const rankMaps = leaders?.rankMaps;

  const rankOf = (categoryKey: string): RankRef | undefined => {
    const hit = rankMaps?.[categoryKey]?.[playerStats.player_id];
    return hit ? { rank: hit.rank, tied: hit.tied } : undefined;
  };

  const ordinal = (r: RankRef): string => {
    const n = r.rank;
    const mod100 = n % 100;
    // 11th / 12th / 13th take "th" - the classic ordinal bug.
    const suffixKey =
      mod100 >= 11 && mod100 <= 13
        ? 'th'
        : n % 10 === 1
          ? 'st'
          : n % 10 === 2
            ? 'nd'
            : n % 10 === 3
              ? 'rd'
              : 'th';
    const ord = t(`player.stats.ordinal.${suffixKey}`, { n });
    return r.tied ? t('player.stats.ordinalTied', { ordinal: ord }) : ord;
  };

  // OVERVIEW
  const overview: Row[] = [];
  const push = (l: string, v: string | null, rank?: RankRef) => {
    if (v !== null) overview.push({ label: l, value: v, rank });
  };
  // UNRANKED: events_played, top_25s, cuts_made, birdies_per_round, scrambling
  // and strokes_gained_total have no ranked category in useLeaderCategories.
  // They deliberately render a figure and nothing else. An uneven sheet that
  // is true beats an even one that is not - do NOT invent ranks for these.
  push(label('events_played'), fmtInt(playerStats.events_played));
  push(label('wins'), fmtInt(playerStats.wins), rankOf('wins'));
  push(label('top_10'), fmtInt(playerStats.top_10s), rankOf('top_10'));
  push(label('top_25'), fmtInt(playerStats.top_25s));
  push(label('cuts_made'), fmtInt(playerStats.cuts_made));
  push(label('earnings'), fmtMoney(playerStats.earnings), rankOf('earnings'));
  push(label('scoring_avg'), fmtDecimal(playerStats.scoring_average, 2), rankOf('scoring_avg'));
  push(label('birdies_per_round'), fmtDecimal(playerStats.birdies_per_round, 2));

  // BALL STRIKING
  const ball: Row[] = [];
  const pushBall = (l: string, v: string | null, rank?: RankRef) => {
    if (v !== null) ball.push({ label: l, value: v, rank });
  };
  pushBall(label('drive_avg'), fmtYards(playerStats.driving_distance), rankOf('drive_avg'));
  pushBall(label('drive_acc'), fmtPct(playerStats.driving_accuracy), rankOf('drive_acc'));
  pushBall(label('gir_pct'), fmtPct(playerStats.greens_in_reg), rankOf('gir_pct'));

  // SHORT GAME
  const shortGame: Row[] = [];
  const pushShort = (l: string, v: string | null, rank?: RankRef) => {
    if (v !== null) shortGame.push({ label: l, value: v, rank });
  };
  pushShort(label('scrambling'), fmtPct(playerStats.scrambling));
  pushShort(label('putt_avg'), fmtDecimal(playerStats.putting_average, 3), rankOf('putt_avg'));

  // STROKES GAINED - plain cells. The old bars had an arbitrary unlabelled
  // +/-3.00 ceiling that silently clipped the best players, and coloured
  // "above zero" amber. The sign plus the rank say more.
  const hasSG =
    playerStats.strokes_gained_total !== null ||
    playerStats.strokes_gained_tee_green !== null ||
    playerStats.strokes_gained !== null;

  const sg: Row[] = [];
  const pushSG = (l: string, v: string | null, rank?: RankRef) => {
    if (v !== null) sg.push({ label: l, value: v, rank });
  };
  pushSG(label('strokes_gained_total'), fmtSG(playerStats.strokes_gained_total));
  pushSG(
    label('strokes_gained_tee_green'),
    fmtSG(playerStats.strokes_gained_tee_green),
    rankOf('strokes_gained_tee_green'),
  );
  pushSG(
    label('strokes_gained_around_green'),
    fmtSG(playerStats.strokes_gained),
    rankOf('strokes_gained_putting'),
  );

  const allRows = [...overview, ...ball, ...shortGame, ...(hasSG ? sg : [])];
  const rankedCount = allRows.filter((r) => !!r.rank).length;

  const poolSize = (leaders?.categories ?? []).reduce(
    (max, c) => (c.key === 'world_rank' ? max : Math.max(max, c.poolSize)),
    0,
  );

  // Sub-line: season . tour . events. Events segment drops when null.
  const tourLabel = t('player.hero.tourSuffix', { tour: t(`followPrompt.tours.${tour}`) });
  const year = currentSeasonYear();
  const sub =
    playerStats.events_played !== null && playerStats.events_played !== undefined
      ? t('player.stats.sub', { year, tour: tourLabel, events: playerStats.events_played })
      : t('player.stats.subNoEvents', { year, tour: tourLabel });

  // Fired once per open, after the rank map resolves.
  const trackedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      trackedRef.current = false;
      return;
    }
    if (trackedRef.current || !rankMaps) return;
    trackedRef.current = true;
    void analyticsEvents.track('tour_player_stats_ranks_shown', {
      player_id: playerStats.player_id,
      tour,
      ranked_stats: rankedCount,
      total_stats: allRows.length,
    });
  }, [open, rankMaps, rankedCount, allRows.length, playerStats.player_id, tour]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="stats-sheet-title"
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        background: SURFACE,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          background: SURFACE,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: '4px 16px 8px',
          }}
        >
          <Kicker>{t('player.stats.eyebrow')}</Kicker>
          <h2
            id="stats-sheet-title"
            style={{
              margin: '0 0 3px',
              ...TITLE,
              color: INK,
            }}
          >
            {playerName}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 9,
              fontWeight: 700,
              color: INK_FAINT,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {sub}
          </p>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '0 16px 24px',
          }}
        >
          <SubSection label={t('player.stats.section.overview')} rows={overview} ordinal={ordinal} />
          <SubSection label={t('player.stats.section.ballStriking')} rows={ball} ordinal={ordinal} />
          <SubSection label={t('player.stats.section.shortGame')} rows={shortGame} ordinal={ordinal} />
          {hasSG && (
            <SubSection
              label={t('player.stats.section.strokesGained')}
              rows={sg}
              ordinal={ordinal}
            />
          )}

          {rankedCount > 0 && poolSize > 0 && (
            <p
              style={{
                margin: '24px 0 0',
                fontSize: 12.5,
                lineHeight: 1.5,
                color: INK_MUTE,
                textAlign: 'center',
                ...FIGS,
              }}
            >
              {t('player.stats.rankFootnote', { count: poolSize })}
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
