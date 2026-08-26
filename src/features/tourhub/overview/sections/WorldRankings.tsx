/**
 * WorldRankings — cardless Open Spotlight (Option B). Tour-picker driven: pga
 * reads the OWGR (sr_world_rankings); euro, lpga, liv and pgad each read
 * tour_season_rankings for their own tour_code. champ alone has no board in the
 * data and renders null.
 *
 * Anatomy: eyebrow header, No.1 spotlight row, hairline, then rows 2-5. Every
 * avatar+name cluster deep-links to the player page (H8 convention). OWGR rows
 * carry sr_players.id via the join; season boards may lack a player_id when the
 * row is a manual entry — those rows fall through as non-tappable.
 *
 * ENRICHMENT (MICRO_BRIEF_WORLD_RANKINGS_ENRICHMENT):
 *  - Rows 2-5 carry a points bar scaled to the LEADER, not to the visible set,
 *    so the shape still tells the truth if the section ever shows rows 6-10.
 *    The hero gets no bar: a bar at 100% says nothing.
 *  - Wins / top-10s render on every row INCLUDING the hero.
 *  - Flags use the app's one flag system (@/components/ui/country-flag), the
 *    same component the players page uses. Never emoji.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { MovementFigure } from '../../_shared/movement';

import { useRankingsBoards, type RankingsBoard, type RankingsRow } from '../data/useRankingsBoards';
import type { TourId } from '../../hooks/useOverviewData';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { formatNumber } from '@/i18n/format';
import { Skeleton } from '@/components/ui/skeleton';

const TOUR_TO_BOARD: Partial<Record<TourId, { board: RankingsBoard; tourCode: string }>> = {
  pga: { board: 'owgr', tourCode: 'pga' },
  euro: { board: 'r2d', tourCode: 'euro' },
  lpga: { board: 'cme', tourCode: 'lpga' },
  liv: { board: 'livpts', tourCode: 'liv' },
  pgad: { board: 'kft', tourCode: 'pgad' },
};

/**
 * The eyebrow NAMES THE BOARD. "World rankings" is true of the OWGR alone, so
 * the season boards reuse the EXISTING leaders brand keys rather than
 * duplicating brand names. Used at BOTH SectionShell call sites so the skeleton
 * and the loaded state cannot drift.
 */
const BOARD_EYEBROW_KEY: Record<RankingsBoard, string> = {
  owgr: 'overview.rankings.sectionEyebrow',
  r2d: 'leaders.pointsBrand.euro',
  cme: 'leaders.pointsBrand.lpga',
  livpts: 'leaders.pointsBrand.liv',
  kft: 'leaders.pointsBrand.pgad',
};

/**
 * Wins / top-10s: A ZERO IS A FACT AND RENDERS ("WINS 0"). Only a genuinely
 * NULL figure collapses.
 *
 * This DIFFERS DELIBERATELY from "What's coming up" on the same page, where a
 * missing figure collapses its column — there the DATA is absent (the fixture
 * feed carries no field size at all), here the data is present and the value is
 * zero. Do not reconcile the two rules; they answer different questions.
 */
function Figures({
  wins,
  top10s,
  gap,
  marginTop,
}: {
  wins: number | null;
  top10s: number | null;
  gap: number;
  marginTop: number;
}) {
  const { t } = useTranslation('tourhub');
  if (wins == null && top10s == null) return null;
  return (
    <div style={{ marginTop, display: 'flex', alignItems: 'center', gap }}>
      {wins != null && (
        <Figure label={t('overview.rankings.winsLabel', 'Wins')} value={wins} />
      )}
      {top10s != null && (
        <Figure label={t('overview.rankings.top10Label', 'Top 10')} value={top10s} />
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, minWidth: 0 }}>
      {/* READ floor is 11 — this label sits at the floor, not below it. */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.11em',
          textTransform: 'uppercase',
          color: V4.inkFaint,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: V4.inkMute,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function WorldRankings({ tour }: { tour: TourId }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const mapping = TOUR_TO_BOARD[tour];
  const board = mapping?.board ?? 'owgr';
  const { data, isLoading } = useRankingsBoards(board);
  const eyebrow = t(BOARD_EYEBROW_KEY[board]);

  if (!mapping) return null;
  const rows = data ?? [];
  if (isLoading && rows.length === 0) {
    return (
      <SectionShell eyebrow={eyebrow} linkLabel={t('overview.rankings.linkLabel')} onLinkClick={() => navigate('/tourhub?tab=leaderboards')}>
        <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Skeleton className="h-[62px] w-[62px]" style={{ borderRadius: 18 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <Skeleton className="h-8 w-16 rounded" />
        </div>
        <div style={{ margin: '0 16px', height: '0.5px', background: V4.hairline }} />
        <div style={{ padding: '2px 16px 0' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 0',
                borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
              }}
            >
              <Skeleton className="h-3.5 w-4 rounded" />
              <Skeleton className="h-[34px] w-[34px]" style={{ borderRadius: 12 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Skeleton className="h-3.5 w-2/5 rounded" />
                <Skeleton className="h-2.5 w-1/3 rounded" />
              </div>
              <Skeleton className="h-3 w-10 rounded" />
            </div>
          ))}
        </div>
      </SectionShell>
    );
  }
  if (rows.length === 0) return null;

  const [top, ...pack] = rows;
  // Bars scale to the LEADER (row 1), never to the visible slice.
  const leaderPoints = top?.points ?? null;
  const goToPlayer = (playerId: string | null) => {
    if (!playerId) return;
    navigate(`/tourhub/player/${playerId}`);
  };

  return (
    <SectionShell eyebrow={eyebrow} linkLabel={t('overview.rankings.linkLabel')} onLinkClick={() => navigate('/tourhub?tab=leaderboards')}>
      {/* No.1 spotlight — cardless, scale does the work. */}
      <div style={{ padding: '4px 16px 12px' }}>
        <SpotlightRow
          row={top}
          board={board}
          tourCode={mapping.tourCode}
          onNavigate={goToPlayer}
        />
      </div>

      <div style={{ margin: '0 16px', height: '0.5px', background: V4.hairline }} />

      {/* Pack — rows 2-5 */}
      <div style={{ padding: '2px 16px 0' }}>
        {pack.map((r, i) => {
          const tappable = !!r.playerId;
          const share =
            leaderPoints && leaderPoints > 0 && r.points != null
              ? Math.max(0, Math.min(1, r.points / leaderPoints))
              : null;
          return (
            <div
              key={`${r.rank}-${i}`}
              style={{
                position: 'relative',
                borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
              }}
            >
              {/* Points bar — BEHIND the content. No height, no column: it fills
                  the row that already exists (same idea as the tee-difficulty
                  bars on the course card). The content wrapper is
                  position:relative and comes after, so no z-index is needed. */}
              {share != null && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${share * 100}%`,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '0 3px 3px 0',
                  }}
                />
              )}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 0',
                }}
              >
                {/* Position numbers stay at 13 — the floor is a minimum, not a target. */}
                <div style={{ width: 16, flex: 'none', textAlign: 'right', fontSize: 13, fontWeight: 700, color: V4.inkFaint, fontVariantNumeric: 'tabular-nums' }}>
                  {r.rank}
                </div>
                <div
                  role={tappable ? 'link' : undefined}
                  onClick={tappable ? () => goToPlayer(r.playerId) : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: tappable ? 'pointer' : 'default' }}
                >
                  <SquircleAvatar
                    size={34}
                    srcCandidates={
                      r.photoUrl
                        ? [r.photoUrl, ...getPlayerHeadshotCandidates(r.playerName, mapping.tourCode)]
                        : getPlayerHeadshotCandidates(r.playerName, mapping.tourCode)
                    }
                    alt={r.playerName}
                    userId={r.playerId ?? r.playerName}
                    hairlineRing
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <CountryFlag country={r.country} size="sm" className="!w-[13px] !h-[10px]" />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.playerName}
                      </div>
                    </div>
                    <Figures wins={r.wins} top10s={r.top10s} gap={12} marginTop={3} />
                  </div>
                </div>
                <div style={{ minWidth: 38, flex: 'none', textAlign: 'right', fontSize: 15, fontWeight: 700, color: V4.inkMute, fontVariantNumeric: 'tabular-nums' }}>
                  {r.points != null ? formatNumber(Math.round(r.points)) : ''}
                </div>
                <div style={{ minWidth: 22, flex: 'none', display: 'flex', justifyContent: 'flex-end' }}>
                  <MovementFigure movement={r.movement} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

function SpotlightRow({
  row,
  board,
  tourCode,
  onNavigate,
}: {
  row: RankingsRow;
  board: RankingsBoard;
  tourCode: string;
  onNavigate: (playerId: string | null) => void;
}) {
  const { t } = useTranslation('tourhub');
  const tappable = !!row.playerId;
  const candidates = row.photoUrl
    ? [row.photoUrl, ...getPlayerHeadshotCandidates(row.playerName, tourCode)]
    : getPlayerHeadshotCandidates(row.playerName, tourCode);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        role={tappable ? 'link' : undefined}
        onClick={tappable ? () => onNavigate(row.playerId) : undefined}
        style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, cursor: tappable ? 'pointer' : 'default' }}
      >
        <SquircleAvatar
          size={62}
          srcCandidates={candidates}
          alt={row.playerName}
          userId={row.playerId ?? row.playerName}
          hairlineRing
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: V4.ink, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {/* Only the OWGR leader is the WORLD No. 1. A season board's leader
                is the SEASON No. 1 — the eyebrow above already names the board. */}
            {board === 'owgr'
              ? t('overview.rankings.worldNo1Label')
              : t('overview.rankings.seasonNo1Label')}
          </div>
          <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <CountryFlag country={row.country} size="sm" className="!w-4 !h-3" />
            <div style={{ flex: 1, minWidth: 0, fontSize: 19, fontWeight: 700, color: V4.ink, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.playerName}
            </div>
          </div>
          {/* The hero carries wins/top-10s too — it is the one player whose wins matter most. */}
          <Figures wins={row.wins} top10s={row.top10s} gap={14} marginTop={5} />
        </div>
      </div>
      {row.points != null ? (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: V4.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
            {formatNumber(Math.round(row.points))}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.14em' }}>
            {t('overview.rankings.pointsLabel')}
          </div>
        </div>
      ) : null}
    </div>
  );
}
