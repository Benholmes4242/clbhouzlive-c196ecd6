/**
 * TournamentsSection - season history rows in schedule grammar.
 *
 * Row: date block (day 18/800 over month LABEL, always INK / INK_MUTE - never
 * amber) + event name with a single status label (WIN in AMBER_DEEP, else
 * MAJOR in INK_FAINT, plus LIVE when the event is in progress) + right rail
 * (position over to-par). Amber on this row means a win and only a win.
 *
 * No row hairlines - fixed column widths carry the alignment instead.
 * Scores go through the canonical fmtScore + getScoreColor helpers, with a
 * missed cut overridden to INK_FAINT (no meaningful score-to-par).
 *
 * The section always shows INITIAL_LIMIT rows; FULL SEASON opens
 * SeasonResultsSheet, which consumes the SAME extracted PlayerResultRow.
 * There is no inline expansion.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { formatMonthShort } from '@/i18n/format';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { PlayerTournamentResult } from '../../hooks/usePlayerResults';
import { tournamentRoute } from '../../routes';
import { isAnyMajor } from '../../utils/majorScope';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import {
  AMBER_DEEP,
  INK,
  INK_FAINT,
  INK_MUTE,
  LIVE_DOT,
  SURFACE,
} from '../../_shared/tokens';

interface TournamentsSectionProps {
  results: PlayerTournamentResult[];
  playerId: string;
  playerName: string;
  liveTournamentId: string | null;
}

const INITIAL_LIMIT = 8;

const KICKER = {
  fontSize: 10,
  fontWeight: 700 as const,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: INK,
};

const LABEL = {
  fontSize: 9,
  fontWeight: 700 as const,
  letterSpacing: '0.13em',
  textTransform: 'uppercase' as const,
};

function fmtPosition(r: PlayerTournamentResult, t: TFunction): string {
  const st = r.status?.toUpperCase();
  if (st === 'CUT' || st === 'MC') return t('player.tournaments.status.mc');
  if (st === 'WD') return t('player.tournaments.status.wd');
  if (st === 'DQ') return t('player.tournaments.status.dq');
  if (r.position === null) return t('player.tournaments.status.noResult');
  if (r.position === 1) return '1';
  return `${r.position_tied ? 'T' : ''}${r.position}`;
}

interface PlayerResultRowProps {
  result: PlayerTournamentResult;
  playerId: string;
  playerName: string;
  isLive: boolean;
  from: 'section' | 'sheet';
}

export function PlayerResultRow({
  result: r,
  playerId,
  playerName,
  isLive,
  from,
}: PlayerResultRowProps) {
  const { t } = useTranslation('tourhub');
  const target = tournamentRoute(r.tournament_id, { kind: 'player', playerName });
  const status = r.status?.toUpperCase();
  const isMissed = status === 'WD' || status === 'CUT' || status === 'MC' || status === 'DQ';
  const isWin = r.position === 1 && !isMissed;
  const isMajor = r.tournament_name ? isAnyMajor(r.tournament_name) : false;
  const pos = fmtPosition(r, t);
  const dt = r.tournament_end_date ? new Date(r.tournament_end_date) : null;
  const day = dt ? String(dt.getDate()) : '';
  const month = dt ? formatMonthShort(dt).toUpperCase() : '';
  const scoreStr = typeof r.score === 'number' ? fmtScore(r.score) : '';
  // Missed cut keeps its INK_FAINT override: no meaningful score-to-par.
  const scoreColor = isMissed ? INK_FAINT : getScoreColor(r.score, 'dark');

  return (
    <Link
      to={target.to}
      state={target.state}
      onClick={() => {
        void analyticsEvents.track('tour_player_result_tapped', {
          player_id: playerId,
          tournament_id: r.tournament_id,
          position: pos,
          from,
        });
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 16px',
        textDecoration: 'none',
        color: INK,
      }}
      className="active:bg-black/[0.02] transition-colors"
    >
      {/* Date block - never amber */}
      <div style={{ width: 34, flex: '0 0 34px', textAlign: 'center' as const }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: INK,
            fontVariantNumeric: 'tabular-nums lining-nums',
            lineHeight: 1,
          }}
        >
          {day}
        </div>
        <div style={{ marginTop: 3, ...LABEL, color: INK_MUTE }}>{month}</div>
      </div>

      {/* Name + status label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.005em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
              minWidth: 0,
            }}
          >
            {r.tournament_name}
          </span>
          {/* A win is the bigger fact: a major that was won shows WIN only. */}
          {isWin ? (
            <span style={{ flexShrink: 0, ...LABEL, color: AMBER_DEEP }}>
              {t('player.tournaments.winChip')}
            </span>
          ) : isMajor ? (
            <span style={{ flexShrink: 0, ...LABEL, color: INK_FAINT }}>
              {t('player.tournaments.major')}
            </span>
          ) : null}
          {isLive && (
            <span
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                ...LABEL,
                color: LIVE_DOT,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: LIVE_DOT,
                  boxShadow: `0 0 8px ${LIVE_DOT}`,
                }}
              />
              {t('player.tournaments.liveChip')}
            </span>
          )}
        </div>
      </div>

      {/* Right rail */}
      <div style={{ textAlign: 'right' as const, width: 48, flex: '0 0 48px' }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: isWin ? AMBER_DEEP : isMissed ? INK_FAINT : INK,
            fontVariantNumeric: 'tabular-nums lining-nums',
            lineHeight: 1,
            letterSpacing: '-0.005em',
          }}
        >
          {pos}
        </div>
        {scoreStr && (
          <div
            style={{
              marginTop: 3,
              fontSize: 11,
              fontWeight: 700,
              color: scoreColor,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {scoreStr}
          </div>
        )}
      </div>
    </Link>
  );
}

function SeasonResultsSheet({
  open,
  onClose,
  results,
  playerId,
  playerName,
  liveTournamentId,
}: {
  open: boolean;
  onClose: () => void;
  results: PlayerTournamentResult[];
  playerId: string;
  playerName: string;
  liveTournamentId: string | null;
}) {
  const { t } = useTranslation('tourhub');
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      ariaLabelledBy="player-season-sheet-title"
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
        <div style={{ flexShrink: 0, padding: '4px 16px 10px' }}>
          <p style={{ margin: '4px 0 4px', ...KICKER }}>{t('player.seasonSheet.kicker')}</p>
          <h2
            id="player-season-sheet-title"
            style={{
              margin: '0 0 4px',
              fontSize: 17,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.01em',
            }}
          >
            {playerName}
          </h2>
          <p style={{ margin: 0, ...LABEL, color: INK_FAINT }}>
            {t('player.seasonSheet.sub', { count: results.length })}
          </p>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 24,
          }}
        >
          {results.map((r) => (
            <PlayerResultRow
              key={r.id}
              result={r}
              playerId={playerId}
              playerName={playerName}
              isLive={liveTournamentId === r.tournament_id}
              from="sheet"
            />
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

export function TournamentsSection({
  results,
  playerId,
  playerName,
  liveTournamentId,
}: TournamentsSectionProps) {
  const { t } = useTranslation('tourhub');
  const [sheetOpen, setSheetOpen] = useState(false);
  if (results.length === 0) return null;

  const visible = results.slice(0, INITIAL_LIMIT);
  const canOpen = results.length > INITIAL_LIMIT;

  const openSheet = () => {
    setSheetOpen(true);
    void analyticsEvents.track('tour_player_full_season_opened', {
      player_id: playerId,
      results: results.length,
    });
  };

  return (
    <section style={{ background: SURFACE, padding: '16px 0 10px' }}>
      <div
        style={{
          padding: '0 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p style={{ margin: 0, ...KICKER }}>{t('player.tournaments.eyebrow')}</p>
        {canOpen && (
          <button
            type="button"
            onClick={openSheet}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              ...LABEL,
              color: INK,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
            className="active:opacity-60 transition-opacity"
          >
            {t('player.tournaments.fullSeason')}
            <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>
              {'\u203a'}
            </span>
          </button>
        )}
      </div>

      <div>
        {visible.map((r) => (
          <PlayerResultRow
            key={r.id}
            result={r}
            playerId={playerId}
            playerName={playerName}
            isLive={liveTournamentId === r.tournament_id}
            from="section"
          />
        ))}
      </div>

      <SeasonResultsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        results={results}
        playerId={playerId}
        playerName={playerName}
        liveTournamentId={liveTournamentId}
      />
    </section>
  );
}
