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
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { useRankingsBoards, type RankingsBoard } from '../data/useRankingsBoards';
import type { TourId } from '../../hooks/useOverviewData';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';

const TOUR_TO_BOARD: Partial<Record<TourId, { board: RankingsBoard; label: string; tourCode: string }>> = {
  pga: { board: 'owgr', label: 'Official World Golf Ranking', tourCode: 'pga' },
  euro: { board: 'r2d', label: 'Race to Dubai', tourCode: 'euro' },
  lpga: { board: 'rolex', label: 'Rolex Rankings', tourCode: 'lpga' },
};

export function WorldRankings({ tour }: { tour: TourId }) {
  const navigate = useNavigate();
  const mapping = TOUR_TO_BOARD[tour];
  const { data } = useRankingsBoards(mapping?.board ?? 'owgr');

  if (!mapping) return null;
  const rows = data ?? [];
  if (rows.length === 0) return null;

  const [top, ...pack] = rows;
  const goToPlayer = (playerId: string | null) => {
    if (!playerId) return;
    navigate(`/tourhub/player/${playerId}`);
  };

  return (
    <SectionShell eyebrow="World rankings" linkLabel="Full rankings" onLinkClick={() => navigate('/tourhub?tab=leaderboards')}>
      <div style={{ padding: '0 16px 10px', fontSize: 11, fontWeight: 600, color: V4.inkMute, marginTop: -6 }}>
        {mapping.label}
      </div>

      {/* No.1 spotlight — cardless, scale does the work. */}
      <div style={{ padding: '4px 16px 14px' }}>
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
                  ringColor={LIGHT_HAIRLINE}
                />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.playerName}
                </div>
              </div>
              {r.points != null ? (
                <div style={{ minWidth: 56, textAlign: 'right', fontSize: 12, fontWeight: 700, color: V4.inkFaint, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(r.points).toLocaleString()}
                </div>
              ) : (
                <div style={{ minWidth: 56 }} />
              )}
              {r.movement != null && r.movement !== 0 ? (
                <div style={{ minWidth: 34, textAlign: 'right', fontSize: 11, fontWeight: 800, color: r.movement > 0 ? V4.up : V4.down, fontVariantNumeric: 'tabular-nums' }}>
                  {r.movement > 0 ? '▲' : '▼'} {Math.abs(r.movement)}
                </div>
              ) : (
                <div style={{ minWidth: 34, textAlign: 'right', fontSize: 11, color: V4.inkFaint }}>—</div>
              )}
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
  row: ReturnType<typeof pickRow>;
  tourCode: string;
  onNavigate: (playerId: string | null) => void;
}) {
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
          ringColor={LIGHT_HAIRLINE}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: V4.amberDeep, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            World No. 1
          </div>
          <div style={{ marginTop: 2, fontSize: 16.5, fontWeight: 800, color: V4.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {row.playerName}
          </div>
        </div>
      </div>
      {row.points != null ? (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 200, color: V4.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {Math.round(row.points).toLocaleString()}
          </div>
          <div style={{ marginTop: 4, fontSize: 8.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.14em' }}>
            POINTS
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Type helper — RankingsRow shape from useRankingsBoards without importing the alias again.
function pickRow(_?: unknown) {
  return null as unknown as {
    rank: number;
    priorRank: number | null;
    playerId: string | null;
    playerName: string;
    country: string | null;
    photoUrl: string | null;
    points: number | null;
    movement: number | null;
  };
}
