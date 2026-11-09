/**
 * FullBoardSheet — full-height house sheet that mounts the existing
 * BoardTable with the event's rows + meta. No new renderer; cut state
 * is derived inline from the same fields LeaderboardTab uses.
 *
 * Row taps open the SAME inline expand as the tour overview hero board
 * (HeroRoundPanel: hole marks, round chips, nine totals, "Full scorecard"
 * button) — one row open at a time, tapping it again closes it. The
 * panel's "Full scorecard" and rows with no started round still forward
 * to the ONE ScorecardSheet.
 *
 * The whole sheet paints SHEET_SURFACE: the wrapper overrides
 * --tour-board-canvas / --tour-board-head / --hero-round-surface so row
 * fills, the sticky column header and the hole-mark rings match the
 * sheet, and the LEADERBOARD kicker reads white (board ink) here only —
 * the tournament page and Leaderboards page boards keep theirs.
 *
 * Wiring: completed events' 'Full board >' opens this. Live events
 * keep the Leaderboards-tab deep link (richer live surface) but can
 * fall back to this when the event isn't present in the live tab.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { TITLE, FIGS as TFIGS } from '@/lib/tokens/type';
import { LiveBoard } from '../../leaderboard/LiveBoard';
import { computeBoardColumns, todayFromEntry, type BoardEntry, type CutState } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import { resolveCutDisplay, tournamentIsFinished } from '../../_shared/cutDisplay';
import { FONT, INK_MUTE, INK_FAINT, HAIRLINE_INK_8 } from '../../_shared/tokens';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { resolveBoardEntity, teamNamesNeedInitials } from '../../_shared/boardEntity';
import { SHEET_SURFACE } from '@/lib/tokens/surfaces';
import { HeroRoundPanel } from './HeroRoundPanel';
import { heroDefaultRound, heroStartedRounds } from './heroRoundRules';

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  meta: TournamentMeta | null;
  entries: BoardEntry[];
}

function isDemoted(s?: string | null): boolean {
  const u = (s || '').toUpperCase();
  return u === 'MC' || u === 'CUT' || u === 'WD' || u === 'DQ' || u === 'MDF' || u === 'DNS';
}

export function FullBoardSheet({ open, onClose, tournamentId, meta, entries }: Props) {
  const { t } = useTranslation('tourhub');
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const [expanded, setExpanded] = useState<{ playerId: string; round: number } | null>(null);
  useEffect(() => { setExpanded(null); setTarget(null); }, [tournamentId, open]);
  const needsInitials = useMemo(() => teamNamesNeedInitials(entries), [entries]);


  const cutState: CutState = useMemo(() => {
    const extra = entries.filter((e) => {
      const u = (e.status || '').toUpperCase();
      return u === 'CUT' || u === 'MC' || u === 'MDF';
    }).length;
    // Shared guard: a stale projected_cutline is never shown after the cut lands.
    const cut = resolveCutDisplay({
      status: meta?.status ?? null,
      currentRound: meta?.current_round ?? null,
      cutRound: meta?.cut_round ?? null,
      cutline: meta?.cutline ?? null,
      projectedCutline: meta?.projected_cutline ?? null,
    });
    if (cut.kind === 'actual') return { kind: 'actual', cutline: cut.cutline as number, extraCount: extra };
    if (cut.kind === 'projected') return { kind: 'projected', cutline: cut.cutline as number, extraCount: 0 };
    return { kind: 'none', cutline: null, extraCount: 0 };
  }, [meta, entries]);

  const openScorecard = (e: BoardEntry) => {
    if (!e.player?.id) return;
    setTarget({
      playerId: e.player.id,
      playerName: resolveBoardEntity(e, needsInitials).lines.join(' / '),
      countryCode: e.player?.country_code ?? e.player?.country ?? null,
      position: e.position ?? null,
      positionTied: e.position_tied ?? null,
      total: e.score ?? null,
      today: todayFromEntry(e, meta?.current_round ?? null),
      thru: e.thru ?? null,
      status: e.status ?? null,
    });
  };

  /* Row tap = the hero board's inline expand. One row open at a time;
     tapping the open row closes it. A row with no started round goes
     straight to the ScorecardSheet, exactly as the hero board does. */
  const handleRow = (e: BoardEntry) => {
    const pid = e.player?.id;
    if (!pid) return;
    if (expanded?.playerId === pid) { setExpanded(null); return; }
    const started = heroStartedRounds(e, meta?.current_round ?? null);
    const defaultRound = heroDefaultRound(started, meta?.current_round ?? null);
    if (defaultRound == null) { openScorecard(e); return; }
    setExpanded({ playerId: pid, round: defaultRound });
  };

  const panelRounds = useMemo(() => {
    const cols = computeBoardColumns(entries, meta?.current_round ?? null, tournamentIsFinished(meta?.status));
    return Math.max(...cols.rounds, meta?.current_round ?? 1);
  }, [entries, meta]);

  const renderExpandedRow = (e: BoardEntry) => {
    const pid = e.player?.id;
    if (!pid || !expanded || expanded.playerId !== pid) return null;
    return (
      <HeroRoundPanel
        key={pid}
        tournamentId={tournamentId}
        playerId={pid}
        round={expanded.round}
        rounds={panelRounds}
        startedRounds={heroStartedRounds(e, meta?.current_round ?? null)}
        boardUpdatedAt={0}
        onRound={(round) => setExpanded({ playerId: pid, round })}
        onFull={() => openScorecard(e)}
      />
    );
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="tournament-full-board-sheet-title"
      style={{ height: 'auto', maxHeight: '85dvh' }}
    >
      <div
        style={{
          fontFamily: FONT,
          height: 'auto', maxHeight: '85dvh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '4px 16px 12px', borderBottom: `0.5px solid ${HAIRLINE_INK_8}` }}>
          <div style={KICKER}>{t('tournament.fullBoard.title')}</div>
          {meta?.name && (
            <h2
              id="tournament-full-board-sheet-title"
              style={{ margin: '3px 0 0', fontSize:21,fontWeight:800,letterSpacing:0,color:A.INK,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}
            >
              {meta.name}
            </h2>
          )}
          <div style={{ fontSize: 11, fontWeight: 600, color: INK_MUTE, marginTop: 2, ...TFIGS }}>
            {t('overview.fieldStrength.playersCount', { count: entries.length })}

          </div>
        </div>

        {/* Column header moved INTO BoardTable in lockstep with the
            single-line row: one grid definition, no duplicate strip here. */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, willChange:'transform', background:'var(--tour-board-canvas)' }}>
          <LiveBoard
            tournamentId={tournamentId}
            enabled={open}
            tourSlug={meta?.tour_code}
            entries={entries}
            cutState={cutState}
            currentRound={meta?.current_round ?? null}
            complete={tournamentIsFinished(meta?.status)}
            onFull={handleRow}
            headerTop={0}
          />
        </div>
      </div>

      <ScorecardSheet
        open={!!target}
        onClose={() => setTarget(null)}
        tournamentId={tournamentId}
        target={target}
      />
    </BottomSheet>
  );
}
