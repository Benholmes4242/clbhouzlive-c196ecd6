/** Separate shot list; MediaTray and the shared counter are not modified.
 * Picker uses actual holes, no floor, and closes on selection. Both sheets use
 * one scroll owner; original file dates alone label photographs.
 * BRIEF_REVIEW_WIZARD_VIDEO_HOLE_TAGS: videos list beside photos with their
 * own numbering, the tray poster as thumbnail (never a <video>), a duration
 * second line, and a GlassDurationBadge in the sheet instead of a Taken chip.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { RV2 } from '../tokens';
import { ordinal } from './ReviewReceipt';
import { capitalPhotoCount, spellPhotoCount } from '@/lib/courseMedia/holePhotoData';
import type { useReviewHoleTags } from '../hooks/useReviewHoleTags';

type Props = ReturnType<typeof useReviewHoleTags>;
const dateLabel = (day: string, year = false) => new Date(`${day.slice(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' as const } : {}) });
const roundDate = (day: string) => {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return day.slice(0, 10) === localDay(today) ? 'Today' : day.slice(0, 10) === localDay(yesterday) ? 'Yesterday' : dateLabel(day);
};

export function ReviewHoleTags(props: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [roundOpen, setRoundOpen] = useState(false);
  if (!props.holes.length || !props.shots.length) return null;
  const active = props.shots.find(shot => shot.id === activeId);
  const tagged = props.shots.filter(shot => props.assignments[shot.id] != null);
  const info = active ? props.metadata[active.id] : undefined;
  const summary = props.shots.length === tagged.length
    ? `${capitalPhotoCount(tagged.length)} on a hole. All still post with your review.`
    : `${capitalPhotoCount(tagged.length)} of ${spellPhotoCount(props.shots.length)} on a hole. ${capitalPhotoCount(props.shots.length - tagged.length)} still ${props.shots.length - tagged.length === 1 ? 'posts' : 'post'} with your review — ${props.shots.length - tagged.length === 1 ? 'it' : 'they'} just will not appear on a hole.`;
  const note = { borderLeft: `2px solid ${RV2.hairlineStrong}`, paddingLeft: 11, fontSize: 12, lineHeight: 1.5, color: RV2.secondary };
  let photoNumber = 0; let videoNumber = 0;
  const numbered = props.shots.map(shot => {
    const video = shot.type === 'video';
    const n = video ? ++videoNumber : ++photoNumber;
    return { shot, video, n };
  });
  return <section aria-label="Holes for your photos and videos" style={{ padding: '0 16px 16px', color: RV2.ink }}>
    {props.rounds.length > 0 && <Button variant="ghost" onClick={() => setRoundOpen(true)} className="w-full h-auto min-h-14 justify-between text-left whitespace-normal rounded-lg px-3 py-3" style={{ border: `1px ${props.chosenRound ? 'solid' : 'dashed'} ${RV2.hairlineStrong}`, background: props.chosenRound ? RV2.track : 'transparent' }}>
      <span className="min-w-0"><span className="block text-[13.5px] font-bold tabular-nums">{props.chosenRound ? roundDate(props.chosenRound.playDate) : 'Which round were these from?'}</span>
        <span className="block text-[11.5px] leading-[1.45]" style={{ color: RV2.secondary }}>{props.chosenRound
          ? [props.chosenRound.grossScore != null ? `You shot ${props.chosenRound.grossScore}` : null, props.chosenRound.teeMarker ? `${props.chosenRound.teeMarker} tees` : null].filter(Boolean).join(' · ')
          : `You have ${props.rounds.length} ${props.rounds.length === 1 ? 'round' : 'rounds'} here · Optional`}</span></span>
      <span className="ml-2 text-[11.5px] font-bold" style={{ color: RV2.amber }}>{props.chosenRound ? 'Change' : 'Choose'}</span>
    </Button>}
    <h2 className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-normal" style={{ color: RV2.eyebrow }}>Put them on a hole</h2>
    <div className="flex flex-col gap-2">{numbered.map(({ shot, video, n }) => {
      const day = props.metadata[shot.id]?.exif.captureDay;
      const hole = props.assignments[shot.id];
      const length = video && shot.durationSeconds ? formatDuration(shot.durationSeconds) : '';
      return <Button key={shot.id} variant="ghost" aria-label={`Tag ${video ? 'video' : 'photo'} ${n}`} onClick={() => setActiveId(shot.id)} className="w-full h-auto min-h-14 justify-start gap-3 p-2 rounded-lg text-left" style={{ border: `1px solid ${RV2.hairline}` }}>
        <img src={video ? shot.posterUrl ?? shot.previewUrl : shot.previewUrl} alt="" className="w-10 h-10 object-cover rounded-lg shrink-0" />
        <span className="min-w-0"><span className="block text-[12.5px] font-semibold">{video ? `Video ${n}` : `Photo ${n}`}</span><span className="block text-[10.5px] leading-[1.45]" style={{ color: RV2.muted }}>{video ? length : day ? `Taken ${roundDate(day)}` : 'No date on file'}</span></span>
        <span className="ml-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-bold" style={{ border: `1px ${hole == null ? 'dashed' : 'solid'} ${hole == null ? RV2.hairlineStrong : RV2.ink}`, background: hole == null ? 'transparent' : RV2.ink, color: hole == null ? RV2.secondary : RV2.canvas }}>{hole == null ? 'Tag' : ordinal(hole)}</span>
      </Button>;
    })}</div>
    <p className="mt-3" style={note}>{summary}</p>
    <Sheet open={!!active} onOpenChange={open => { if (!open) setActiveId(null); }}>
      <SheetContent side="bottom" hideCloseButton className="p-0 rounded-t-lg gap-0 sm:max-w-[480px] sm:mx-auto" style={{ background: RV2.canvas, color: RV2.ink, borderColor: RV2.hairline }}>
        <div className="overflow-y-auto p-[18px]" style={{ willChange: 'transform' }}>
          <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: RV2.trackStrong }} />
          <SheetTitle className="text-base font-bold tracking-normal" style={{ color: RV2.ink }}>Which hole is this?</SheetTitle>
          <SheetDescription className="mt-1 text-[12.5px]" style={{ color: RV2.secondary }}>{active ? `${ordinal(props.shots.findIndex(p => p.id === active.id) + 1)} of ${spellPhotoCount(props.shots.length)}.` : ''} {tagged.length > 0 ? `${capitalPhotoCount(tagged.length)} already tagged.` : ''}</SheetDescription>
          {active && (active.type === 'video'
            ? <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-lg"><img src={active.posterUrl ?? active.previewUrl} alt="Your video" className="w-full h-full object-cover" /><GlassDurationBadge seconds={active.durationSeconds} bottom={8} right={8} fontSize={11} /></div>
            : <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-lg"><img src={active.previewUrl} alt="Your photograph" className="w-full h-full object-cover" /><span className="absolute bottom-2 left-2 rounded px-2 py-1 text-[11px] font-bold" style={{ color: RV2.ink, background: RV2.scrim }}>{info?.exif.captureDay ? `Taken ${dateLabel(info.exif.captureDay, true)}` : 'No date on this file'}</span></div>)}
          <div role="group" aria-label="Hole" className={`grid gap-[6px] mt-4 ${props.holes.length === 9 ? 'grid-cols-5' : 'grid-cols-6'}`}>
            {props.holes.map(hole => <Button key={hole} variant="ghost" aria-label={`Hole ${hole}`} aria-pressed={!!active && props.assignments[active.id] === hole} data-state="open" className="aspect-square h-auto min-w-0 p-0 rounded-lg text-sm font-bold tabular-nums" style={{ border: `1px solid ${RV2.hairlineStrong}`, color: RV2.secondary, background: active && props.assignments[active.id] === hole ? RV2.trackStrong : 'transparent' }} onClick={() => { if (active) props.assign(active.id, hole); setActiveId(null); }}>{hole}</Button>)}
          </div>

        </div>
      </SheetContent>
    </Sheet>
    <Sheet open={roundOpen} onOpenChange={setRoundOpen}>
      <SheetContent side="bottom" className="rounded-t-lg sm:max-w-[480px] sm:mx-auto" style={{ background: RV2.canvas, color: RV2.ink }}>
        <SheetTitle style={{ color: RV2.ink }}>Which round were these from?</SheetTitle>
        <SheetDescription style={{ color: RV2.secondary }}>Optional</SheetDescription>
        <div className="overflow-y-auto flex flex-col gap-2" style={{ willChange: 'transform' }}>
          <Button variant="ghost" onClick={() => { props.chooseRound(null); setRoundOpen(false); }}>No round</Button>
          {props.rounds.map(round => <Button key={round.whsScoreId} variant="ghost" aria-pressed={props.chosenRound?.whsScoreId === round.whsScoreId} className="h-auto min-h-12 justify-between tabular-nums" onClick={() => { props.chooseRound(round.whsScoreId); setRoundOpen(false); }}><span>{dateLabel(round.playDate, true)}</span><span>{round.grossScore != null ? `You shot ${round.grossScore}` : ''}{round.teeMarker ? ` · ${round.teeMarker} tees` : ''}</span></Button>)}
        </div>
      </SheetContent>
    </Sheet>
  </section>;
}