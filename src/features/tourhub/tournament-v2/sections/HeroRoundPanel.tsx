/** Only an open hero row mounts this reader. Its single selected-round query
 * reuses useBoardHoles' whole-field cache; closed rows never invoke the hook.
 * Availability starts from board scores and successful empty reads disable chips.
 * Shared marks remain untouched for weekly rows and round posts. */
import { Fragment, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { HoleMarks, orderedHoleCells } from '../../leaderboard/BoardRound';
import { useBoardHoles } from '../../leaderboard/useBoardHoles';
import { getScoreColor } from '../../_shared/scoreColor';
import { fmtScore } from '../../utils/fmtScore';
import { heroNineTotal } from './heroRoundRules';
import './heroRoundPanel.css';

export function HeroRoundPanel({ tournamentId, playerId, round, rounds, startedRounds, boardUpdatedAt, onRound, onEmpty, onFull }: {
  tournamentId: string; playerId: string; round: number; rounds: number; startedRounds: number[]; boardUpdatedAt: number;
  onRound: (round: number) => void; onEmpty: (round: number) => void; onFull: () => void;
}) {
  const { t } = useTranslation('tourhub');
  const query = useBoardHoles(tournamentId, round, boardUpdatedAt, true);
  const holes = query.byPlayer.get(playerId) ?? [];
  useEffect(() => {
    if (query.isSuccess && holes.length === 0) onEmpty(round);
  }, [query.isSuccess, holes.length, round, onEmpty]);
  const cells = orderedHoleCells(holes);
  const played = cells.filter(h => h?.strokes != null && h.strokes > 0);
  const front = heroNineTotal(cells, 0);
  const back = heroNineTotal(cells, 9);
  const gross = front != null && back != null ? front + back : null;
  const toPar = played.length > 0 && played.every(h => h?.par != null)
    ? played.reduce((sum, h) => sum + (h?.strokes ?? 0) - (h?.par ?? 0), 0) : null;
  return <div className="hero-round-panel" id={`hero-round-${playerId}`} data-hero-round-panel data-player-id={playerId} data-selected-round={round}>
    <div className="hero-round-header">
      <div className="hero-round-label">{t('overview.board.roundLabel', { defaultValue: `ROUND ${round}`, round })}
        <b>{gross ?? (played.length ? t('overview.board.thruLabel', { defaultValue: `THRU ${played.length}`, count: played.length }) : null)}</b>
        <i style={{ color: getScoreColor(toPar, 'dark') }}>{toPar == null ? null : fmtScore(toPar)}</i>
      </div>
      <div className="hero-round-chips">{Array.from({ length: rounds }, (_, i) => i + 1).map(rd => <Button key={rd} variant="ghost" data-round-chip={rd} aria-pressed={round === rd} disabled={!startedRounds.includes(rd)} onClick={() => onRound(rd)}>R{rd}</Button>)}</div>
    </div>
    <div className="hero-round-numbers" aria-hidden="true">{cells.map((_, i) => <Fragment key={i}>{i === 9 && <i className="hero-round-nine-gap" />}<span>{i + 1}</span></Fragment>)}</div>
    <div className="hero-round-marks"><HoleMarks holes={cells} surface="var(--hero-round-surface)" /></div>
    <div className="hero-round-footer">
      <div className="hero-round-nines"><span>{t('overview.board.out', { defaultValue: 'OUT' })} <b data-hero-out>{front}</b></span><span>{t('overview.board.in', { defaultValue: 'IN' })} <b data-hero-in>{back}</b></span></div>
      <Button variant="ghost" className="hero-scorecard-button" data-hero-full-scorecard onClick={onFull}>{t('overview.board.fullScorecard', { defaultValue: 'Full scorecard ›' })}</Button>
    </div>
  </div>;
}