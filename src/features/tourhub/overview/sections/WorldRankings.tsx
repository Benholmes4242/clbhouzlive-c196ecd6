import { OverviewReadinessBand, overviewQueryReady, useOverviewBandReady } from '../../components/overview-v3/overviewShells';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { RailChips } from '@/components/ui/RailChips';
import CountryFlag from '@/components/ui/country-flag';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { useRankingsBoards, type RankingsBoard, type RankingsRow } from '../data/useRankingsBoards';
import { isActiveTour } from '../../constants/tourMap';
import { useFollowedBoardRows } from '../data/useFollowedBoardRows';
import { useClimberRankHistory } from '../data/useClimberRankHistory';
import { useTourPlayerFollows } from '../../leaderboard/useTourPlayerFollows';
import { movementFrom } from '../../_shared/movement';
import { AMBER, FONT, INK, INK_FAINT, INK_MUTE, TREND_UP } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';
import {
  fmtPoints,
  leadSentence,
  ordinalEn,
  pickBiggestClimb,
  sinceLabel,
  sparkline,
  surnameOf,
} from './worldRankingsRules';

const BOARDS: { id: RankingsBoard; label: string }[] = [{ id: 'owgr', label: 'World' }, ...([{ id: 'r2d', label: 'Race to Dubai', tour: 'euro' }, { id: 'cme', label: 'LPGA', tour: 'lpga' }, { id: 'kft', label: 'Korn Ferry', tour: 'pgad' }] as const).filter(board => isActiveTour(board.tour))];

const UNMOVED_INK = 'rgba(248,250,252,0.3)';
const FOLLOWED_WASH = 'rgba(247,147,30,0.06)';
const BAR_TRACK = 'rgba(255,255,255,0.06)';
const BAR_FILL = 'rgba(248,250,252,0.55)';
const HAIRLINE = 'rgba(255,255,255,0.06)';

/**
 * Rank rises retain TREND_UP; falls are muted. Red only means under par on
 * Tour, the same rule as the leaderboard. Rank deltas never use scoreColor.
 */
export function Movement({ value }: { value: number | null }) {
  const up = value != null && value > 0; const down = value != null && value < 0;
  return <span data-movement-tone={up ? 'rise' : down ? 'fall' : 'unchanged'} style={{ textAlign: 'right', fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: up ? TREND_UP : down ? INK_FAINT : UNMOVED_INK }}>{up ? `▲${value}` : down ? `▼${Math.abs(value)}` : '–'}</span>;
}

/**
 * C5's rule, unchanged: the movement track exists only when at least one of
 * the rows actually drawn carries a value. Only the SOURCE changed (90-day
 * window instead of week-over-week). Never a hardcoded board list.
 */
export function hasMovement(rows: RankingsRow[]): boolean {
  return rows.some((r) => r.movement != null && r.movement !== 0);
}

type ThirdColumn = 'movement' | 'wins' | null;

function RankingRow({ row, onOpen, third, followed, leaderPoints }: {
  row: RankingsRow;
  onOpen?: () => void;
  third: ThirdColumn;
  followed: boolean;
  leaderPoints: number | null;
}) {
  const barPct = row.points != null && leaderPoints != null && leaderPoints > 0
    ? Math.round((row.points / leaderPoints) * 100)
    : null;
  return <button type="button" disabled={!onOpen} onClick={onOpen} data-rank-row data-followed={followed || undefined} style={{ width: '100%', minHeight: 58, padding: '9px 24px', display: 'grid', gridTemplateColumns: third ? '26px minmax(0,1fr) 58px 48px' : '26px minmax(0,1fr) 48px', columnGap: 10, alignItems: 'center', border: 0, background: followed ? FOLLOWED_WASH : 'transparent', color: INK, textAlign: 'left', fontFamily: FONT, cursor: onOpen ? 'pointer' : 'default' }}>
    <span style={{ fontSize: 14, fontWeight: 700, color: row.rank === 1 ? INK : INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>{row.rank}</span>
    <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 11 }}>
      <span style={{ position: 'relative', width: 34, height: 34, flex: 'none' }}>
        <SquircleAvatar size={34} hideRing alt={row.playerName} srcCandidates={resolvePlayerAvatarCandidates({ name: row.playerName, photoUrl: row.photoUrl })} />
        <span data-flag style={{ position: 'absolute', right: -4, bottom: -3, width: 16, height: 12, borderRadius: 2, overflow: 'hidden', display: 'block', lineHeight: 0 }}>
          <CountryFlag country={row.country} size="sm" className="border-none" />
        </span>
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {row.playerName}{followed ? <span data-followed-star style={{ color: AMBER, fontSize: 11, marginLeft: 4 }}>★</span> : null}
        </span>
        {barPct != null ? (
          <span data-points-bar style={{ display: 'block', marginTop: 6, height: 3, borderRadius: 2, background: BAR_TRACK, overflow: 'hidden' }}>
            <i data-points-fill style={{ display: 'block', height: '100%', borderRadius: 2, width: `${barPct}%`, background: row.rank === 1 ? INK : BAR_FILL }} />
          </span>
        ) : null}
      </span>
    </span>
    {third === 'movement' ? <Movement value={row.movement} /> : null}
    {third === 'wins' ? <span data-wins style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>{row.wins == null ? '' : row.wins}</span> : null}
    <span style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{row.points == null ? '' : fmtPoints(row.points)}</span>
  </button>;
}

function LeadSentence({ rows, eventsLeft }: { rows: RankingsRow[]; eventsLeft: number | null }) {
  const sentence = leadSentence(rows, eventsLeft);
  if (!sentence) return null;
  return (
    <div data-lead-sentence style={{ margin: '16px 24px 0', fontFamily: FONT, fontSize: 13.5, lineHeight: 1.4, color: INK_MUTE }}>
      {sentence.kind === 'level' ? (
        <Trans ns="tourhub" i18nKey="overview.rankings.level" values={sentence.values} components={{ b: <strong style={{ color: INK, fontWeight: 700 }} /> }} />
      ) : (
        <>
          <Trans ns="tourhub" i18nKey="overview.rankings.leadsBy" values={sentence.values} components={{ b: <strong style={{ color: INK, fontWeight: 700 }} /> }} />
          {sentence.clause === 'twice' ? <Trans ns="tourhub" i18nKey="overview.rankings.clauseTwice" /> : null}
          {sentence.clause === 'nearly' ? <Trans ns="tourhub" i18nKey="overview.rankings.clauseNearly" /> : null}
          {sentence.eventsLeft != null ? (
            <Trans ns="tourhub" i18nKey="overview.rankings.eventsLeft" count={sentence.eventsLeft} values={{ count: sentence.eventsLeft }} components={{ b: <strong style={{ color: INK, fontWeight: 700 }} /> }} />
          ) : (
            <Trans ns="tourhub" i18nKey="overview.rankings.clauseEnd" />
          )}
        </>
      )}
    </div>
  );
}

function ColumnHeader({ third, comparisonDate }: { third: ThirdColumn; comparisonDate: string | null }) {
  const { t } = useTranslation('tourhub');
  return (
    <div data-col-header style={{ whiteSpace: 'nowrap', display: 'grid', gridTemplateColumns: third ? '26px minmax(0,1fr) 58px 48px' : '26px minmax(0,1fr) 48px', columnGap: 10, alignItems: 'end', margin: '16px 24px 0', paddingBottom: 6, borderBottom: `1px solid ${HAIRLINE}`, fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: INK_FAINT, textTransform: 'uppercase' }}>
      <span>{t('overview.rankings.colRank')}</span>
      <span>{t('overview.rankings.colPlayer')}</span>
      {third ? <span style={{ textAlign: 'right' }}>{third === 'wins' ? t('overview.rankings.colWins') : t('overview.rankings.colSince', { date: comparisonDate ? sinceLabel(comparisonDate) : '' })}</span> : null}
      <span style={{ textAlign: 'right' }}>{t('overview.rankings.colPoints')}</span>
    </div>
  );
}

function ClimbCard({ rows, basisDays, comparisonDate, latestDate, onOpen }: {
  rows: RankingsRow[];
  basisDays: number | null;
  comparisonDate: string | null;
  latestDate: string | null;
  onOpen: (playerId: string) => void;
}) {
  const climber = basisDays != null ? pickBiggestClimb(rows) : null;
  const history = useClimberRankHistory(climber?.playerId ?? null, latestDate);
  useOverviewBandReady('climber', overviewQueryReady(history, !!climber?.playerId && !!latestDate));
  if (!climber || climber.movement == null || !climber.playerId) return null;
  const line = sparkline(history.data ?? []);
  return (
    <button type="button" data-climb-card onClick={() => onOpen(climber.playerId as string)} style={{ margin: '14px 16px 0', padding: '12px 14px', borderRadius: 14, background: '#141418', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, width: 'calc(100% - 32px)', fontFamily: FONT, color: INK, textAlign: 'left', cursor: 'pointer' }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: INK_FAINT, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
          <Trans ns="tourhub" i18nKey="overview.rankings.climbLabel" />
        </span>
        <span style={{ display: 'block', marginTop: 3, fontSize: 14, fontWeight: 600 }}>
          <Trans
            ns="tourhub"
            i18nKey="overview.rankings.climbLine"
            values={{
              name: surnameOf(climber.playerName),
              count: climber.movement,
              ordinal: ordinalEn(climber.rank),
              date: comparisonDate ? sinceLabel(comparisonDate) : '',
            }}
            components={{
              up: <span style={{ color: TREND_UP, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }} />,
              m: <span style={{ color: INK_MUTE, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }} />,
            }}
          />
        </span>
      </span>
      {line ? (
        <svg data-climb-line width={84} height={30} viewBox="0 0 84 30" aria-hidden="true" style={{ marginLeft: 'auto', flex: 'none' }}>
          <polyline points={line.points} fill="none" stroke={TREND_UP} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={line.last.x} cy={line.last.y} r={3} fill={TREND_UP} />
        </svg>
      ) : null}
    </button>
  );
}

export function WorldRankings() {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const [board, setBoard] = useState<RankingsBoard>('owgr');
  const rankingsQuery = useRankingsBoards(board);
  const { data, isLoading } = rankingsQuery;
  const follows = useTourPlayerFollows();
  const followedIds = [...follows.ids];
  const followed = useFollowedBoardRows(board, followedIds, data?.latestDate ?? null, followedIds.length > 0);

  const allRows = data?.rows ?? [];
  useOverviewBandReady('unused-rankings', overviewQueryReady(rankingsQuery));
  if (!isLoading && allRows.length === 0) return <OverviewReadinessBand id="rankings" hero base={overviewQueryReady(rankingsQuery)} expect={[]} />;
  const rows = allRows.slice(0, 5);
  const basisDays = data?.basisDays ?? null;
  const leaderPoints = rows[0]?.points ?? null;

  const third: ThirdColumn =
    board === 'owgr'
      ? basisDays != null && hasMovement(rows) ? 'movement' : null
      : rows.some((r) => r.wins != null) ? 'wins' : null;

  // Your players: members only (the follows hook returns an empty set for
  // guests, so nothing below ever renders for them).
  const isFollowed = (r: RankingsRow) => r.playerId != null && follows.ids.has(r.playerId);
  const followedRows = followed.data ?? [];
  const topIds = new Set(rows.map((r) => r.playerId));
  const belowFive = followedRows
    .filter((r) => !topIds.has(r.playerId))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map((r) => ({
      ...r,
      movement:
        board === 'owgr' && r.playerId && data?.comparisonRanks
          ? movementFrom(r.rank, data.comparisonRanks[r.playerId] ?? null)
          : null,
    }));
  const followedCount = followedRows.length;

  const openPlayer = (playerId: string) => navigate(`/tourhub/player/${playerId}`);

  return (
<OverviewReadinessBand id="rankings" hero base={overviewQueryReady(rankingsQuery)} expect={board === 'owgr' ? ['climber'] : []}>
    <section data-overview-band="rankings">
      <OverviewSectionHead title={t('overview.rankings.sectionEyebrow')} action={t('overview.rankings.linkLabel')} onAction={() => navigate('/tourhub?tab=players&view=all&lens=stats&stat=world_rank')} />
      <RailChips options={BOARDS} value={board} onChange={(next) => setBoard(next as RankingsBoard)} ariaLabel={t('overview.rankings.sectionEyebrow')} distribute style={{ margin: 0, padding: '0 24px' }} />
      <LeadSentence rows={rows} eventsLeft={board === 'owgr' ? null : data?.eventsLeft ?? null} />
      <ColumnHeader third={third} comparisonDate={data?.comparisonDate ?? null} />
      {rows.length > 0 ? (
        <div>
          {rows.map((row) => (
            <RankingRow
              key={`${row.rank}-${row.playerId ?? row.playerName}`}
              row={row}
              third={third}
              followed={isFollowed(row)}
              leaderPoints={leaderPoints}
              onOpen={row.playerId ? () => openPlayer(row.playerId as string) : undefined}
            />
          ))}
        </div>
      ) : null}
      {belowFive.length > 0 ? (
        <div data-your-players>
          <div style={{ margin: '14px 24px 2px', display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', color: AMBER }}>
            <span>{t('overview.rankings.yourPlayers')}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 0, color: INK_FAINT }}>{t('overview.rankings.followedCount', { count: followedCount })}</span>
          </div>
          {belowFive.map((row) => (
            <RankingRow
              key={`mine-${row.rank}-${row.playerId ?? row.playerName}`}
              row={row}
              third={third}
              followed
              leaderPoints={leaderPoints}
              onOpen={row.playerId ? () => openPlayer(row.playerId as string) : undefined}
            />
          ))}
        </div>
      ) : null}
      {board === 'owgr' ? (
        <ClimbCard rows={allRows} basisDays={basisDays} comparisonDate={data?.comparisonDate ?? null} latestDate={data?.latestDate ?? null} onOpen={openPlayer} />
      ) : null}
    </section>
    </OverviewReadinessBand>
  );
}
