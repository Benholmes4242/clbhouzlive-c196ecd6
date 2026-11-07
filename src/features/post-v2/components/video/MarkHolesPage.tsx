/** Marks are composer-owned and persist through Back/Done. Local playback never
 * autoplays or claims the shared feed/video engine; trimmed times are relative. */
import { useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareFooter } from '../golf/ShareFooter';
import type { StageMediaItem } from '../../hooks/useStageComposer';
import { chapterTime, holeOrdinal, markRefusal, videoDuration, type HoleMarks } from '../../lib/videoDetails';
import type { RoundVideoContext } from './RoundVideoFields';
import './videoCreator.css';
import './roundVideoCreator.css';
export function MarkHolesPage({ item, round, marks, onChange, onBack }: { item: StageMediaItem; round: RoundVideoContext; marks: HoleMarks; onChange: (marks: HoleMarks) => void; onBack: () => void }) {
  const player = useRef<HTMLVideoElement>(null);
  const [seconds, setSeconds] = useState(0), [selected, setSelected] = useState<number | null>(null), [error, setError] = useState<string | null>(null);
  const duration = videoDuration(item) ?? 0, start = item.trimStart ?? 0;
  const holes = Array.from({ length: round.holes }, (_, i) => i + 1);
  const next = holes.find(h => marks[h] == null), target = selected ?? next;
  const seek = (time: number) => { if (player.current) player.current.currentTime = time + start; setSeconds(time); setError(null); };
  const mark = () => { if (target == null) return; const time = Math.floor(seconds), reason = markRefusal(marks, target, time, round.holes, duration); if (reason) { setError(reason); return; } onChange({ ...marks, [target]: time }); setSelected(null); setError(null); };
  return <div className="video-creator vc-details" role="dialog" aria-label="Mark the holes"><header className="vc-top"><div className="vc-top-row"><Button variant="ghost" className="vc-back" aria-label="Back to composer" onClick={onBack}><ChevronLeft size={22} /></Button><span>Mark the holes</span><span /></div></header>
    <div className="vc-mark-pinned"><div className="vc-mark-player"><video ref={player} src={item.previewUrl} playsInline controls preload="metadata" onLoadedMetadata={() => seek(0)} onTimeUpdate={e => { const time = e.currentTarget.currentTime - start; if (time > duration) { e.currentTarget.pause(); seek(duration); } else setSeconds(Math.max(0, time)); }} /><span className="vc-mark-time">{chapterTime(seconds)}</span><input type="range" min={0} max={duration} step={1} value={seconds} aria-label="Video position" onChange={e => seek(Number(e.target.value))} /></div>
    <Button className="vc-mark-primary" disabled={target == null} onClick={mark}>{target == null ? 'All holes marked' : `${selected == null ? 'Mark' : 'Move'} the ${holeOrdinal(target)} ${selected == null ? 'at' : 'to'} ${chapterTime(seconds)}`}</Button><p className="vc-mark-hint" data-error={!!error} role={error ? 'alert' : undefined}>{error ?? "Scrub to where each hole starts. Holes you skip just won't get a chapter."}</p></div>
    <div className="vc-scroll"><div className="vc-box vc-mark-list"><div className="vc-mark-row vc-mark-intro"><span className="vc-mark-hole">Intro</span><span className="vc-mark-par">Always 0:00</span><span className="vc-mark-value">0:00</span></div>
    {holes.map(h => { const hole = round.shape?.holes.find(r => r.holeNo === h), time = marks[h]; return <div key={h} className="vc-mark-row" data-next={h === next} data-selected={selected === h}><Button variant="ghost" className="vc-mark-select" aria-label={`${holeOrdinal(h)} ${time == null ? 'Not marked' : chapterTime(time)}`} aria-pressed={selected === h} onClick={() => { if (time == null) return; if (selected === h) setSelected(null); else { seek(time); setSelected(h); } }}><span className="vc-mark-hole">{holeOrdinal(h)}</span><span className="vc-mark-par">{hole?.par != null ? `Par ${hole.par}` : ''}{hole?.strokes != null ? ` · ${hole.strokes}` : ''}</span><span className="vc-mark-value" data-unmarked={time == null}>{time == null ? 'Not marked' : chapterTime(time)}</span></Button>{selected === h && <Button variant="ghost" className="vc-mark-clear" aria-label={`Clear ${holeOrdinal(h)}`} onClick={() => { const updated = { ...marks }; delete updated[h]; onChange(updated); setSelected(null); setError(null); }}>✕ Clear</Button>}</div>; })}</div></div>
    <ShareFooter label="DONE" subLine="" disabled={false} busy={false} onShare={onBack} />
  </div>;
}