/**
 * WorldRankings — cardless Open Spotlight (Option B). Tour-picker driven:
 * pga -> OWGR, euro -> Race to Dubai, lpga -> Rolex Rankings. Other tours
 * (liv, pgad, champ) have no ranking board and render null.
 *
 * Anatomy: eyebrow header, board sub-label, No.1 spotlight row, hairline,
 * then rows 2-5. Every avatar+name cluster deep-links to the player page
 * (H8 convention). OWGR rows carry sr_players.id via the join; season
 * boards may lack a player_id when the row is a manual entry — those
 * rows fall through as non-tappable.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { MovementFigure } from '../../_shared/movement';

import { useRankingsBoards, type RankingsBoard, type RankingsRow } from '../data/useRankingsBoards';
import type { TourId } from '../../hooks/useOverviewData';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { formatNumber } from '@/i18n/format';
import { Skeleton } from '@/components/ui/skeleton';

// Board sub-label routed via i18n key (see overview.rankings.boards.*).
const TOUR_TO_BOARD: Partial<Record<TourId, { board: RankingsBoard; labelKey: string; tourCode: string }>> = {
  pga: { board: 'owgr', labelKey: 'overview.rankings.boards.owgr', tourCode: 'pga' },
  euro: { board: 'r2d', labelKey: 'overview.rankings.boards.r2d', tourCode: 'euro' },
  lpga: { board: 'rolex', labelKey: 'overview.rankings.boards.rolex', tourCode: 'lpga' },
};

export function WorldRankings({ tour }: { tour: TourId }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const mapping = TOUR_TO_BOARD[tour];
  const { data, isLoading } = useRankingsBoards(mapping?.board ?? 'owgr');

  if (!mapping) return null;
  const rows = data ?? [];
  if (isLoading && rows.length === 0) {
    return (
      <SectionShell eyebrow={t('overview.rankings.sectionEyebrow')} linkLabel={t('overview.rankings.linkLabel')} onLinkClick={() => navigate('/tourhub?tab=leaderboards')}>
        <div style={{ padding: '0 16px 10px' }}>
          <Skeleton className="h-3 w-32 rounded" />
        </div>
        <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Skeleton className="h-[54px] w-[54px]" style={{ borderRadius: 18 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
          <Skeleton className="h-7 w-16 rounded" />
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
                padding: '10px 0',
                borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
              }}
            >
              <Skeleton className="h-3.5 w-4 rounded" />
              <Skeleton className="h-8 w-8" style={{ borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <Skeleton className="h-3.5 w-2/5 rounded" />
              </div>
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          ))}
        </div>
      </SectionShell>
    );
  }
  if (rows.length === 0) return null;

  const [top, ...pack] = rows;
  const goToPlayer = (playerId: string | null) => {
    if (!playerId) return;
    navigate(`/tourhub/player/${playerId}`);
  };

  return (
    <SectionShell eyebrow={t('overview.rankings.sectionEyebrow')} linkLabel={t('overview.rankings.linkLabel')} onLinkClick={() => navigate('/tourhub?tab=leaderboards')}>
      <div style={{ padding: '0 16px 10px', fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
        {t(mapping.labelKey)}
      </div>

      {/* No.1 spotlight — cardless, scale does the work. */}
      <div style={{ padding: '4px 16px 12px' }}>
        <SpotlightRow
          row={top}
          tourCode={mapping.tourCode}
          onNavigate={goToPlayer}
        />
      </div>

      <div style={{ margin: '0 16px', height: '0.5px', background: V4.hairline }} />

      {/* Pack — rows 2-5 */}
      <div style={{ padding: '2px 16px 0' }}>
        {pack.map((r, i) => {
          const tappable = !!r.playerId;
          return (
            <div
              key={`${r.rank}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
              }}
            >
              <div style={{ width: 22, textAlign: 'right', fontSize: 13, fontWeight: 700, color: V4.inkFaint, fontVariantNumeric: 'tabular-nums' }}>
                {r.rank}
              </div>
              <div
                role={tappable ? 'link' : undefined}
                onClick={tappable ? () => goToPlayer(r.playerId) : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: tappable ? 'pointer' : 'default' }}
              >
                <PlayerAvatar
                  playerId={r.playerId ?? r.playerName}
                  playerName={r.playerName}
                  tourCode={mapping.tourCode}
                  photoUrl={r.photoUrl}
                  size="sm"
                />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.playerName}
                </div>
              </div>
              {r.points != null ? (
                <div style={{ minWidth: 56, textAlign: 'right', fontSize: 12, fontWeight: 700, color: V4.inkFaint, fontVariantNumeric: 'tabular-nums' }}>
                  {formatNumber(Math.round(r.points))}
                </div>
              ) : (
                <div style={{ minWidth: 56 }} />
              )}
              <MovementFigure movement={r.movement} />

            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

function SpotlightRow({
  row,
  tourCode,
  onNavigate,
}: {
  row: RankingsRow;
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
          size={54}
          srcCandidates={candidates}
          alt={row.playerName}
          userId={row.playerId ?? row.playerName}
          hairlineRing
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: V4.ink, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {t('overview.rankings.worldNo1Label')}
          </div>
          <div style={{ marginTop: 2, fontSize: 16.5, fontWeight: 700, color: V4.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {row.playerName}
          </div>
        </div>
      </div>
      {row.points != null ? (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 200, color: V4.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {formatNumber(Math.round(row.points))}
          </div>
          <div style={{ marginTop: 4, fontSize: 8.5, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.14em' }}>
            {t('overview.rankings.pointsLabel')}
          </div>
        </div>
      ) : null}
    </div>
  );
}
