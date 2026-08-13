/**
 * FullBoardSheet — full-height house sheet that mounts the existing
 * BoardTable with the event's rows + meta. No new renderer; cut state
 * is derived inline from the same fields LeaderboardTab uses. Row
 * taps forward to the ONE ScorecardSheet.
 *
 * Wiring: completed events' 'Full board >' opens this. Live events
 * keep the Leaderboards-tab deep link (richer live surface) but can
 * fall back to this when the event isn't present in the live tab.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { TITLE, FIGS as TFIGS } from '@/lib/tokens/type';
import { BoardTable, BoardHeaderCells, boardGridTemplate, computeBoardColumns, todayFromEntry, type BoardEntry, type CutState } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import { resolveCutDisplay } from '../../_shared/cutDisplay';
import { FONT, INK_MUTE, INK_FAINT, HAIRLINE_INK_8 } from '../../_shared/tokens';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';

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

  const handleRow = (e: BoardEntry) => {
    setTarget({
      playerId: e.player?.id ?? '',
      playerName: e.player?.full_name ?? '',
      countryCode: e.player?.country_code ?? e.player?.country ?? null,
      position: e.position ?? null,
      positionTied: e.position_tied ?? null,
      total: e.score ?? null,
      today: todayFromEntry(e, meta?.current_round ?? null),
      thru: e.thru ?? null,
      status: e.status ?? null,
    });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      surfaceColor={A.PANEL}
      ariaLabelledBy="tournament-full-board-sheet-title"
      style={{ height: 'auto', maxHeight: '85dvh' }}
    >
      <div
        style={{
          background: A.PANEL, fontFamily: FONT,
          height: 'auto', maxHeight: '85dvh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '4px 16px 12px', borderBottom: `0.5px solid ${HAIRLINE_INK_8}` }}>
          <div style={KICKER}>{t('tournament.fullBoard.title')}</div>
          {meta?.name && (
            <h2
              id="tournament-full-board-sheet-title"
              style={{ margin: '3px 0 0', ...TITLE, color: A.INK }}
            >
              {meta.name}
            </h2>
          )}
          <div style={{ fontSize: 11, fontWeight: 600, color: INK_MUTE, marginTop: 2, ...TFIGS }}>
            {t('overview.fieldStrength.playersCount', { count: entries.length })}

          </div>
        </div>

        {/* Column header (shares BoardTable's grid template) */}
        {(() => {
          const cols = computeBoardColumns(entries, meta?.current_round ?? null);
          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: boardGridTemplate(cols),
                alignItems: 'center',
                padding: '8px 16px',
                fontSize: 10, fontWeight: 700, color: INK_FAINT,
                letterSpacing: '0.10em', textTransform: 'uppercase',
                background: A.PANEL, borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
              }}
            >
              <div>{t('board.columns.pos')}</div>
              <div style={{ minWidth: 0, paddingLeft: 4 }}>{t('board.columns.player')}</div>
              <BoardHeaderCells
                columns={cols}
                totLabel={t('board.columns.tot')}
              />
            </div>
          );
        })()}


        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <BoardTable
            entries={entries}
            cutState={cutState}
            currentRound={meta?.current_round ?? null}
            onRowClick={handleRow}
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
