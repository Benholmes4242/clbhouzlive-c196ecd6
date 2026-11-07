/** Shared following chip and About strip. Callers supply cached round data;
 * unmarked holes remain inert and missing scores are never manufactured. */
import { Button } from '@/components/ui/button';
import { golfRoundToPar } from '@/hooks/feed/usePostGolfContext';
import { holeOrdinal, type VideoChapter } from '@/features/post-v2/lib/videoDetails';
import { playingRoundScore, roundScoreText, type VideoRound } from './roundVideoModel';
import './round-video.css';
export function RoundVideoChip({ round, chapter, follows }: { round: VideoRound | null; chapter: VideoChapter | null; follows: boolean }) {
  const score = follows && round ? playingRoundScore(round, chapter) : null;
  return score ? <div className="round-video-chip" data-testid="round-video-chip"><div className="round-video-kicker">{score.kicker}</div><div className="round-video-value">{score.gross}<span data-under={score.toPar != null && score.toPar < 0}> {roundScoreText(score.toPar)}</span>{score.thru != null && <span> thru {score.thru}</span>}</div></div> : null;
}
export function RoundVideoScorecard({ round, chapters, chapter, onTime, onScorecard }: { round: VideoRound; chapters: VideoChapter[]; chapter?: VideoChapter | null; onTime: (seconds: number) => void; onScorecard: () => void }) {
  const count = round.context.roundHoles;
  if (!round.shape || (count !== 9 && count !== 18)) return null;
  return <section className="video-about-section" data-video-section="Scorecard"><div className="round-video-score-head"><h3 className="video-about-kicker">SCORECARD</h3><Button variant="ghost" className="round-video-score-door" onClick={onScorecard}>{round.context.roundGross ?? '—'} ({roundScoreText(golfRoundToPar(round.context))}) · Scorecard ›</Button></div>
    <div className="round-video-grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>{Array.from({ length: count }, (_, i) => i + 1).map(h => { const hole = round.shape?.holes.find(r => r.holeNo === h), mark = chapters.find(c => c.holeNo === h), delta = hole?.strokes != null && hole.par != null ? hole.strokes - hole.par : null; return <Button key={h} variant="ghost" className="round-video-cell" data-active={chapter?.holeNo === h} data-unmarked={!mark} disabled={!mark} aria-label={`Jump to ${holeOrdinal(h)}`} onClick={() => { if (mark) onTime(mark.seconds); }}><i data-tone={delta == null ? 'missing' : delta < 0 ? 'under' : delta === 0 ? 'par' : delta === 1 ? 'bogey' : 'worse'} /><span>{hole?.strokes ?? '—'}</span></Button>; })}</div><p className="round-video-grid-hint">Tap a hole to jump there.</p>
  </section>;
}