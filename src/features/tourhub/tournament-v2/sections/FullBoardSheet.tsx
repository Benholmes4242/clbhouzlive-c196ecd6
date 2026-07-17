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
import { BoardTable, type BoardEntry, type CutState } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import { FONT, INK, INK_MUTE, INK_FAINT, SLATE_50, HAIRLINE_INK_8, AMBER } from '../../_shared/tokens';

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
    const status = (meta?.status ?? '').toLowerCase();
    const currentRound = meta?.current_round ?? null;
    const cutRound = meta?.cut_round ?? null;
    const cutline = meta?.cutline ?? null;
    const projected = meta?.projected_cutline ?? null;
    const cutHappened =
      (cutRound != null && currentRound != null && currentRound > cutRound) ||
      status === 'closed' || status === 'completed' || status === 'complete';
    const extra = entries.filter((e) => {
      const u = (e.status || '').toUpperCase();
      return u === 'CUT' || u === 'MC' || u === 'MDF';
    }).length;
    if (cutHappened && cutline != null) return { kind: 'actual', cutline, extraCount: extra };
    if (status === 'inprogress' && projected != null) return { kind: 'projected', cutline: projected, extraCount: 0 };
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
      today: e.today ?? null,
      thru: e.thru ?? null,
      status: e.status ?? null,
    });
  };

  return (
    <BottomSheet open={open} onClose={onClose} variant="light" surfaceColor={SLATE_50} style={{ height: '75dvh', maxHeight: '75dvh' }}>
      <div
        style={{
          background: SLATE_50, fontFamily: FONT,
          height: '75dvh', maxHeight: '75dvh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '4px 16px 12px', borderBottom: `0.5px solid ${HAIRLINE_INK_8}` }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: AMBER, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {t('tournament.fullBoard.title')}

          </div>
          {meta?.name && (
            <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginTop: 4, letterSpacing: '-0.01em' }}>
              {meta.name}
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 600, color: INK_MUTE, marginTop: 2 }}>
            {t('overview.fieldStrength.playersCount', { count: entries.length })}

          </div>
        </div>

        {/* Column header (matches BoardTable footprint) */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 16px',
            fontSize: 8.5, fontWeight: 800, color: INK_FAINT,
            letterSpacing: '0.10em', textTransform: 'uppercase',
            background: SLATE_50, borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
          }}
        >
          <div style={{ width: 52, flexShrink: 0 }}>{t('board.columns.pos')}</div>
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>{t('board.columns.player')}</div>
          <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>{t('board.columns.tot')}</div>
          <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>{t('board.columns.thru')}</div>
          <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>{t('board.columns.today')}</div>

        </div>

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
