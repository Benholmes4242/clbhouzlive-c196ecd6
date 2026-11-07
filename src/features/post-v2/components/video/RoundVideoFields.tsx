/** PF3C opt-in preview; all scores come from the caller's shared hole-shapes read. */
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { holeChapters, chapterTime, holeOrdinal, validHoleMarks, type VideoDetails } from '../../lib/videoDetails';
import './roundVideoCreator.css';
export interface RoundVideoContext { scoreId: string; holes: 9 | 18; shape: HoleShape | null }
export function RoundVideoFields({ details, duration, round, onChange, onMark }: { details: VideoDetails; duration: number; round: RoundVideoContext; onChange: (patch: Partial<VideoDetails>) => void; onMark: () => void }) {
  const marks = validHoleMarks(details.holeMarks ?? {}, round.holes, duration);
  const matched = holeChapters(marks, round.holes, duration).length > 0;
  const holes = Object.entries(marks).sort((a, b) => a[1] - b[1]);
  return <><div className="vc-part" data-video-round-chapters><div className="vc-part-head vc-round-head">Chapters<span className={matched ? 'vc-ok' : 'vc-note'}>{matched ? `${holes.length} holes · matched to your round` : 'Mark the holes to make chapters'}</span></div>
    <div className="vc-chapter"><span className="vc-time">0:00</span><span className="vc-grow">Intro</span></div>
    {holes.slice(0, 4).map(([h, seconds]) => { const hole = round.shape?.holes.find(r => r.holeNo === Number(h)); return <div className="vc-chapter" key={h}><span className="vc-time">{chapterTime(seconds)}</span><span className="vc-grow">{holeOrdinal(Number(h))}{hole?.par != null && <span className="vc-round-par"> · Par {hole.par}</span>}</span>{hole?.strokes != null && <b className="vc-round-score" data-under={hole.par != null && hole.strokes < hole.par}>{hole.strokes}</b>}</div>; })}
    <Button variant="ghost" className="vc-mark-door" onClick={onMark}>{holes.length > 4 && <><b>+ {holes.length - 4} more</b>{' · '}</>}Mark the holes ›</Button>
  </div><div className="vc-part vc-follow-row"><div className="vc-follow-text"><b>Scorecard follows the video</b><p>Viewers see each hole's score as you play it, and can tap a hole to jump there.</p></div><Switch className="vc-switch" aria-label="Scorecard follows the video" checked={details.scoreFollows !== false} onCheckedChange={scoreFollows => onChange({ scoreFollows })} /></div></>;
}