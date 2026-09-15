import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTourSelection } from '../../context/TourSelectionContext';
import { useAIPredictions } from '../../hooks/useAIPredictions';
import { usePickLiveState } from '../data/usePickLiveState';
import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { spokenToPar } from '../magazineCopy';

export function TIPickMagazineCard() {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const { data, tournamentPhase } = useAIPredictions(viewingTournamentId);
  const pick = useMemo(() => [...(data?.topContenders ?? [])].sort((a, b) => a.rank - b.rank)[0], [data]);
  const ids = useMemo(() => (pick?.playerId ? [pick.playerId] : []), [pick?.playerId]);
  const { data: liveMap } = usePickLiveState(viewingTournamentId ?? undefined, ids, { live: tournamentPhase === 'in-progress' });

  if (!viewingTournamentId || !pick) return null;
  const live = liveMap?.[pick.playerId];
  const headline = tournamentPhase === 'in-progress' && live?.score != null && live.thru != null
    ? t('overview.magazine.pickLive', { player: pick.playerName, score: spokenToPar(live.score, t), rounds: live.thru })
    : tournamentPhase === 'pre-tournament' && pick.winProbability != null
      ? t('overview.magazine.pickPre', { player: pick.playerName, probability: Math.round(pick.winProbability) })
      : t('overview.magazine.pickPlain', { player: pick.playerName });

  return (
    <article style={{ padding: '0 20px', fontFamily: SANS }}>
      <button
        type="button"
        onClick={() => navigate(`/tourhub/player/${pick.playerId}`)}
        style={{ display: 'flex', width: '100%', gap: 12, alignItems: 'center', padding: '14px 0', border: 0, borderTop: `0.5px solid ${A.BORDER}`, borderBottom: `0.5px solid ${A.BORDER}`, background: 'transparent', color: A.INK, textAlign: 'left', cursor: 'pointer' }}
      >
        <PlayerAvatar playerId={pick.playerId} playerName={pick.playerName} tourCode={viewingTourSlug ?? 'pga'} photoUrl={pick.photoUrl} size="md" />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.DIM }}>{t('overview.tiPicks.eyebrow')}</span>
          <span style={{ display: 'block', marginTop: 5, fontSize: 16, fontWeight: 700, lineHeight: 1.24, color: A.INK }}>{headline}</span>
          {(pick.pulledQuote || pick.reasons?.[0]) ? <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: A.MUTE, lineHeight: 1.4 }}>{pick.pulledQuote || pick.reasons[0]}</span> : null}
        </span>
      </button>
    </article>
  );
}