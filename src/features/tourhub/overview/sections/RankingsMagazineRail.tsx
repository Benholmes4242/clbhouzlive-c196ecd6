import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTourSelection } from '../../context/TourSelectionContext';
import { useRankingsBoards, type RankingsBoard } from '../data/useRankingsBoards';
import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { r } from '@/lib/radius';

const BOARDS: Record<string, { board: RankingsBoard; tourCode: string }> = {
  all: { board: 'owgr', tourCode: 'pga' },
  pga: { board: 'owgr', tourCode: 'pga' },
  euro: { board: 'r2d', tourCode: 'euro' },
  lpga: { board: 'cme', tourCode: 'lpga' },
  liv: { board: 'livpts', tourCode: 'liv' },
  pgad: { board: 'kft', tourCode: 'pgad' },
};

export function RankingsMagazineRail() {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { selectedTourSlug } = useTourSelection();
  const mapping = BOARDS[selectedTourSlug ?? 'all'];
  const { data, isLoading, isError, refetch } = useRankingsBoards(mapping?.board ?? 'owgr');
  if (!mapping) return null;
  if (isError) {
    return <button type="button" onClick={() => refetch()} style={{ marginInline: 20, border: 0, background: 'transparent', color: A.MUTE, font: `600 13px ${SANS}`, cursor: 'pointer' }}>{t('section.retryAria', { section: t('overview.rankings.sectionEyebrow') })}</button>;
  }
  const rows = data?.slice(0, 6) ?? [];
  if (!isLoading && rows.length === 0) return null;

  return (
    <section style={{ fontFamily: SANS, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 20px 10px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: A.MUTE, textTransform: 'uppercase' }}>{t('overview.rankings.sectionEyebrow')}</span>
        <button type="button" onClick={() => navigate('/tourhub?tab=leaderboards')} style={{ padding: 0, border: 0, background: 'transparent', color: A.DIM, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{t('overview.rankings.linkLabel')} ›</button>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden', padding: '0 20px 4px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', willChange: 'transform', scrollbarWidth: 'none' }}>
        {(isLoading && rows.length === 0 ? Array.from({ length: 4 }) : rows).map((row, index) => {
          if (!('playerName' in row)) return <div key={index} style={{ flex: '0 0 144px', height: 150, borderRadius: r.md, background: A.PANEL }} />;
          return (
            <button key={`${row.rank}-${row.playerName}`} type="button" onClick={() => row.playerId && navigate(`/tourhub/player/${row.playerId}`)} disabled={!row.playerId} style={{ flex: '0 0 144px', minWidth: 0, scrollSnapAlign: 'start', padding: 14, border: `0.5px solid ${A.BORDER}`, borderRadius: r.md, background: A.PANEL, color: A.INK, textAlign: 'left', cursor: row.playerId ? 'pointer' : 'default' }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <SquircleAvatar size={44} srcCandidates={row.photoUrl ? [row.photoUrl, ...getPlayerHeadshotCandidates(row.playerName, mapping.tourCode)] : getPlayerHeadshotCandidates(row.playerName, mapping.tourCode)} alt={row.playerName} userId={row.playerId ?? row.playerName} hairlineRing />
                <span style={{ fontSize: 20, fontWeight: 700, color: A.DIM, fontVariantNumeric: 'tabular-nums' }}>{row.rank}</span>
              </span>
              <span style={{ display: '-webkit-box', marginTop: 12, height: 38, fontSize: 15, fontWeight: 700, lineHeight: 1.25, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{row.playerName}</span>
              <span style={{ display: 'block', marginTop: 7, fontSize: 11, fontWeight: 600, color: A.MUTE, fontVariantNumeric: 'tabular-nums' }}>{row.points != null ? Math.round(row.points).toLocaleString() : ''}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
