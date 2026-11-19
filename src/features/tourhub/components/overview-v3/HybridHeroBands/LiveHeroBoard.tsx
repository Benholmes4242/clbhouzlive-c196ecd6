/**
 * LiveHeroBoard — the Tour overview's LIVE-PHASE board only (state.kind
 * 'live' | 'suspended'), signed-off tour-live-states mock. Completed boards
 * and Also this week keep HeroBoardRows' R1…Rn grammar; this sibling never
 * changes it.
 *
 * Columns: POS | PLAYER (22px face + name) | THRU | TODAY | TOT.
 *  - round 1 drops TODAY (it equals TOT);
 *  - between rounds THRU becomes "R{n} TEE", each player's next tee time dim,
 *    and TODAY is absent;
 *  - THRU's header is live green in play, grey when suspended;
 *  - at ≤340px with TODAY present, names become "M. Greyserman" and faces go
 *    (CSS media rule in liveStates.css, so both forms are in the markup).
 * Row taps reuse HeroBoardRows' behaviour: HeroRoundPanel in place, or the
 * ScorecardSheet when no round has started. Tee times read the existing
 * sr_tee_times source via useTeeTimesAll, only between rounds.
 */
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { todayFromEntry, type BoardEntry } from '../../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../../leaderboard/ScorecardSheet';
import { FONT, WHITE_ALPHA_45, TOUR_LIVE_GREEN } from '../../../_shared/tokens';
import { fmtScore } from '../../../utils/fmtScore';
import { getScoreColor } from '../../../_shared/scoreColor';
import { ClbhouzPickMark } from '../../../_shared/ClbhouzPickMark';
import { resolvePlayerAvatarCandidates } from '../../../_shared/resolvePlayerAvatar';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { OVERVIEW } from '../overviewTokens';
import { useTeeTimesAll } from '../../../tournament-v2/data/useTeeTimesAll';
import { HeroRoundPanel } from '../../../tournament-v2/sections/HeroRoundPanel';
import { heroDefaultRound, heroStartedRounds } from '../../../tournament-v2/sections/heroRoundRules';
import { heroTieRoles } from '../../../tournament-v2/sections/HeroBoardRows';
import { thruLabel } from '../../../tournament-v2/sections/MiniBoard';
import { venueTee } from '../upcomingOverviewRules';
import { formatTimeHm24 } from '@/i18n/format';
import { initialSurname, type LiveStage } from '../liveStateRules';
import '../../../leaderboard/leaderboard.css';
import './liveStates.css';

export const LIVE_BOARD_ROWS = 10;
const GREY = 'rgba(248,250,252,.42)';

export interface LiveBoardLayout { today: boolean; nextTee: number | null; thruLive: boolean }
export function liveBoardLayout(stage: LiveStage, round: number, nextRound: number | null): LiveBoardLayout {
  if (stage === 'between') return { today: false, nextTee: nextRound, thruLive: false };
  return { today: round > 1, nextTee: null, thruLive: stage !== 'suspended' };
}

export function liveBoardGrid(layout: LiveBoardLayout): string {
  return ['24px', 'minmax(0,1fr)', layout.nextTee != null ? '50px' : '38px', layout.today ? '44px' : null, '40px'].filter(Boolean).join(' ');
}

interface Props {
  tournamentId: string;
  entries: BoardEntry[];
  stage: LiveStage;
  round: number;
  nextRound: number | null;
  totalRounds?: number | null;
  tourSlug?: string | null;
  zone?: string | null;
  pickPlayerIds?: Set<string>;
  onRowTap?: (playerId: string) => void;
  onFullBoard?: () => void;
  boardUpdatedAt?: number;
}

export function LiveHeroBoard({ tournamentId, entries, stage, round, nextRound, totalRounds = null, tourSlug = null, zone = null, pickPlayerIds, onRowTap, onFullBoard, boardUpdatedAt = 0 }: Props) {
  const { t } = useTranslation('tourhub');
  const layout = liveBoardLayout(stage, round, nextRound);
  const grid = liveBoardGrid(layout);
  const rows = entries.slice(0, LIVE_BOARD_ROWS);
  const ties = heroTieRoles(rows);
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const [expanded, setExpanded] = useState<{ playerId: string; round: number } | null>(null);
  useEffect(() => { setExpanded(null); setTarget(null); }, [tournamentId]);
  const teeQuery = useTeeTimesAll(tournamentId, layout.nextTee ?? 1, { enabled: layout.nextTee != null });
  const tees = useMemo(() => {
    const map = new Map<string, string>();
    if (layout.nextTee == null) return map;
    for (const g of teeQuery.data ?? []) {
      if (!Number.isFinite(Date.parse(g.teeTime))) continue;
      const time = venueTee(g.teeTime, zone)?.time ?? formatTimeHm24(g.teeTime);
      for (const p of g.players) if (p.id) map.set(p.id, time);
    }
    return map;
  }, [layout.nextTee, teeQuery.data, zone]);
  // The column round: the round in play, or (between) the one just finished.
  const colRound = round;

  return (
    <>
      <div className="live-board" data-live-board data-live-stage={stage} data-live-today={layout.today || undefined} style={{ fontFamily: FONT, padding: '30px 0 0' }}>
        <div data-live-board-header style={{ display: 'grid', gridTemplateColumns: grid, gap: 4, alignItems: 'end', padding: '0 20px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: OVERVIEW.mute }}>
          <span style={{ gridColumn: '1 / 3', fontWeight: 800, letterSpacing: '0.16em' }}>{t('rebuilt.leaderboard', { defaultValue: 'Leaderboard' })}</span>
          <span data-live-col="thru" style={{ textAlign: 'center', whiteSpace: 'nowrap', color: layout.nextTee != null ? GREY : layout.thruLive ? TOUR_LIVE_GREEN : GREY }}>
            {layout.nextTee != null ? t('overview.live.board.nextTee', { round: layout.nextTee }) : t('overview.live.board.thru')}
          </span>
          {layout.today ? <span data-live-col="today" style={{ textAlign: 'center' }}>{t('overview.live.board.today')}</span> : null}
          <span data-live-col="tot" style={{ textAlign: 'right' }}>{t('overview.live.board.tot')}</span>
        </div>
        {rows.map((r, i) => {
          const pid = r.player?.id ?? null;
          const name = r.player?.full_name?.trim() || r.team?.display_name?.trim() || '';
          const today = todayFromEntry(r, colRound);
          const role = ties[i];
          const pos = r.status === 'MC' || r.status === 'CUT' ? 'MC' : r.status === 'WD' ? 'WD' : r.position == null ? '' : `${r.position_tied ? 'T' : ''}${r.position}`;
          const isOpen = !!pid && expanded?.playerId === pid;
          const started = heroStartedRounds(r, colRound);
          const defaultRound = heroDefaultRound(started, colRound);
          const openScorecard = () => { if (pid) setTarget({ playerId: pid, playerName: name, countryCode: r.player?.country_code ?? r.player?.country ?? null, position: r.position ?? null, positionTied: r.position_tied ?? null, total: r.score ?? null, today, thru: r.thru ?? null, status: r.status ?? null }); };
          const toggle = () => {
            if (!pid) return;
            onRowTap?.(pid);
            if (isOpen) { setExpanded(null); return; }
            if (defaultRound == null) { openScorecard(); return; }
            setExpanded({ playerId: pid, round: defaultRound });
          };
          const thru = layout.nextTee != null ? (pid ? tees.get(pid) ?? '' : '') : thruLabel(r, today);
          const Tag = pid ? Button : 'div';
          return (
            <Fragment key={r.id}>
              <Tag
                data-live-board-row={r.id}
                data-hero-board-row={r.id}
                {...(pid ? { type: 'button' as const, variant: 'ghost' as const, 'aria-expanded': isOpen } : { role: 'group' })}
                aria-label={t('overview.board.rowLabel', { name, position: pos, score: r.score == null ? '' : fmtScore(r.score) })}
                onClick={pid ? toggle : undefined}
                className={pid ? 'active:bg-white/[0.06] transition-colors' : undefined}
                style={{ display: 'grid', gridTemplateColumns: grid, gap: 4, alignItems: 'center', width: '100%', height: 'auto', minHeight: 40, padding: '4px 20px', border: 'none', borderRadius: 0, background: 'transparent', color: '#FFFFFF', textAlign: 'left', fontFamily: FONT }}
              >
                <span data-live-pos style={{ fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{role === 'middle' || role === 'last' ? <span className="sr-only">{pos}</span> : pos}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {r.player ? <span className="live-board-face" style={{ display: 'inline-flex', flex: 'none' }}><SquircleAvatar size={22} srcCandidates={resolvePlayerAvatarCandidates({ name, photoUrl: r.player.photo_url ?? null, tourSlug })} alt={name} userId={pid ?? name} hideRing /></span> : null}
                  <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, fontWeight: 600 }}>
                    <span className="live-board-name-full">{name}</span>
                    <span className="live-board-name-short">{r.player ? initialSurname(name) : name}</span>
                  </span>
                  {pid && pickPlayerIds?.has(pid) ? <ClbhouzPickMark size={10} label={t('overview.board.clbhouzPick')} /> : null}
                </span>
                <span data-live-cell="thru" style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontSize: layout.nextTee != null ? 11.5 : 12, fontWeight: 600, color: layout.nextTee != null ? WHITE_ALPHA_45 : 'rgba(248,250,252,.78)' }}>{thru}</span>
                {layout.today ? <span data-live-cell="today" style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontSize: 12.5, fontWeight: 600, color: getScoreColor(today, 'dark') }}>{today == null ? '' : fmtScore(today)}</span> : null}
                <span data-live-cell="tot" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 15, fontWeight: 700, color: getScoreColor(r.score, 'dark') }}>{r.score == null ? '' : fmtScore(r.score)}</span>
              </Tag>
              {isOpen && expanded && pid ? <HeroRoundPanel key={pid} tournamentId={tournamentId} playerId={pid} round={expanded.round} rounds={totalRounds ?? Math.max(colRound, 1)} startedRounds={started} boardUpdatedAt={boardUpdatedAt} onRound={rd => setExpanded({ playerId: pid, round: rd })} onFull={openScorecard} /> : null}
            </Fragment>
          );
        })}
        {onFullBoard && entries.length > rows.length ? (
          <Button variant="ghost" data-live-full-leaderboard data-hero-full-leaderboard onClick={onFullBoard} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: 'auto', minHeight: 36, padding: '8px 20px', border: 'none', borderRadius: 0, background: 'transparent', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: OVERVIEW.mute }}>
            <span>{t('overview.live.board.fullLeaderboard', { count: entries.length })}</span>
            <span aria-hidden style={{ color: '#FFFFFF', fontSize: 16 }}>›</span>
          </Button>
        ) : null}
      </div>
      <ScorecardSheet open={!!target} onClose={() => setTarget(null)} tournamentId={tournamentId} target={target} />
    </>
  );
}
