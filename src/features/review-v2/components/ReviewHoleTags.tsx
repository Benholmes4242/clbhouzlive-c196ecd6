/** Separate shot list; MediaTray and the shared counter are not modified.
 * Picker uses actual holes, no floor, and never closes on selection —
 * Confirm tag assigns, Remove tag clears, and the sheet stays open; both
 * sheets use one scroll owner; original file dates alone label photographs.
 * BRIEF_REVIEW_WIZARD_VIDEO_HOLE_TAGS: videos list beside photos with their
 * own numbering, the tray poster as thumbnail (never a <video>), a duration
 * second line, and a GlassDurationBadge in the sheet instead of a Taken chip.
 * The tagging sheet mirrors the Media tab batch window (BRIEF_HOLE_TAG_BATCH_V3)
 * using its own classes and theme: the tagged state is the reviewing flag, so
 * Confirm can land on the just-tagged shot and read "All tagged" once every
 * shot is tagged, exactly like the dialog.
 */
import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { ReviewMediaPreview } from './ReviewMediaPreview';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { RV2 } from '../tokens';
import { ordinal } from './ReviewReceipt';
import { capitalPhotoCount, spellPhotoCount } from '@/lib/courseMedia/holePhotoData';
import { theme } from '@/components/course-media-tab/HolePhotoFastPaths';
import { HolePhotoPicker } from '@/components/course-media-tab/HolePhotoPicker';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { useReviewHoleTags } from '../hooks/useReviewHoleTags';
import '@/components/course-media-tab/hole-photo-fast.css';

type Props = ReturnType<typeof useReviewHoleTags> & {
  /** BRIEF_REVIEW_STEP_ONE §4: the tray's hole chips replace the shot list. */
  hideShotList?: boolean;
  /** Open the tagging sheet on this shot (set by a tray chip). */
  focusShotId?: string | null;
  /** Called when the sheet closes so the opener can clear its request. */
  onFocusClosed?: () => void;
};

export function ReviewHoleTags(props: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [removedNotice, setRemovedNotice] = useState(false);
  const { focusShotId } = props;
  useEffect(() => {
    if (!focusShotId) return;
    setActiveId(focusShotId); setSelected(null); setConfirmation(null); setRemovedNotice(false);
    setReviewing(props.assignments[focusShotId] != null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusShotId]);
  if (!props.holes.length || !props.shots.length) return null;
  const active = props.shots.find(shot => shot.id === activeId);
  const tagged = props.shots.filter(shot => props.assignments[shot.id] != null);
  const index = active ? props.shots.findIndex(shot => shot.id === active.id) : -1;
  const activeHole = active ? props.assignments[active.id] : undefined;
  const inTaggedState = reviewing && activeHole != null;
  const allTagged = tagged.length === props.shots.length;
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
  const focus = (id: string) => {
    setActiveId(id); setSelected(null); setConfirmation(null); setRemovedNotice(false);
    setReviewing(props.assignments[id] != null); // a row open on a tagged shot enters the tagged state like a tagged thumb; untagged rows start fresh
  };
  const choose = (id: string) => {
    if (id === activeId) {
      if (props.assignments[id] != null) { setReviewing(true); setSelected(null); setConfirmation(null); setRemovedNotice(false); }
      return;
    }
    setActiveId(id); setSelected(null); setConfirmation(null); setRemovedNotice(false);
    setReviewing(props.assignments[id] != null);
  };
  const confirmTag = () => {
    if (!active || selected == null || inTaggedState || allTagged) return;
    const hole = selected;
    const updated = { ...props.assignments, [active.id]: hole };
    props.assign(active.id, hole);
    setConfirmation(`${active.type === 'video' ? 'Video' : 'Photo'} tagged to the ${ordinal(hole)}.`);
    setSelected(null); setReviewing(false); setRemovedNotice(false);
    for (let step = 1; step <= props.shots.length; step++) {
      const candidate = props.shots[(index + step) % props.shots.length];
      if (updated[candidate.id] == null) { setActiveId(candidate.id); return; }
    }
  };
  const removeTag = () => {
    if (!active || activeHole == null) return;
    props.unassign(active.id);
    setReviewing(false); setSelected(null); setConfirmation(null); setRemovedNotice(true);
  };
  const confirmEnabled = inTaggedState || (!allTagged && selected != null);
  const closeSheet = () => { setActiveId(null); props.onFocusClosed?.(); };
  const list = !props.hideShotList;
  return <section aria-label="Holes for your photos and videos" style={{ padding: list ? '0 16px 16px' : 0, color: RV2.ink }}>
    {list && <><h2 className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-normal" style={{ color: RV2.eyebrow }}>Put them on a hole</h2>
    <div className="flex flex-col gap-2">{numbered.map(({ shot, video, n }) => {
      const day = props.metadata[shot.id]?.exif.captureDay;
      const hole = props.assignments[shot.id];
      const length = video && shot.durationSeconds ? formatDuration(shot.durationSeconds) : '';
      return <Button key={shot.id} variant="ghost" aria-label={`Tag ${video ? 'video' : 'photo'} ${n}`} onClick={() => focus(shot.id)} className="w-full h-auto min-h-14 justify-start gap-3 p-2 rounded-lg text-left" style={{ border: `1px solid ${RV2.hairline}` }}>
        <div className="w-10 h-10 overflow-hidden rounded-lg shrink-0"><ReviewMediaPreview {...shot} /></div>
        <span className="min-w-0"><span className="block text-[12.5px] font-semibold">{video ? `Video ${n}` : `Photo ${n}`}</span><span className="block text-[10.5px] leading-[1.45]" style={{ color: RV2.muted }}>{video ? length : day ? `Taken ${roundDate(day)}` : 'No date on file'}</span></span>
        <span className="ml-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-bold" style={{ border: `1px ${hole == null ? 'dashed' : 'solid'} ${hole == null ? RV2.hairlineStrong : RV2.ink}`, background: hole == null ? 'transparent' : RV2.ink, color: hole == null ? RV2.secondary : RV2.canvas }}>{hole == null ? 'Tag' : ordinal(hole)}</span>
      </Button>;
    })}</div>
    <p className="mt-3" style={note}>{summary}</p></>}
    <Sheet open={!!active} onOpenChange={open => { if (!open) closeSheet(); }}>
      <SheetContent side="bottom" hideCloseButton className="hole-photo-batch p-0 gap-0 rounded-t-[14px] sm:max-w-[480px] sm:mx-auto" style={{ background: RV2.canvas, color: RV2.ink, borderColor: RV2.hairline, ...theme }}>
        <div data-sheet-body className="overflow-y-auto flex flex-col gap-3" style={{ paddingTop: 10, paddingLeft: 16, paddingRight: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', willChange: 'transform' }}>
          <div className="w-9 h-1 rounded-full mx-auto mb-[2px]" style={{ background: 'rgba(255,255,255,0.18)' }} />
          <div className="hole-photo-batch-top" style={{ marginTop: -6 }}>
            <SheetTitle className="hole-photo-fast-title">Which hole is this?</SheetTitle>
            <button type="button" className="hole-photo-batch-close" aria-label="Close" onClick={closeSheet}><X size={20} strokeWidth={2.5} /></button>
          </div>
          <SheetDescription className="hole-photo-fast-lede">{capitalPhotoCount(props.shots.length)} photos or videos. Tap any one to tag it.</SheetDescription>
          {active && <>
            <div className="hole-photo-batch-hero" data-hero={active.id}>
              {active.type === 'video'
                ? <video src={active.previewUrl} poster={active.posterUrl ?? undefined} muted playsInline autoPlay loop className="block w-full h-full object-contain" />
                : <img src={active.previewUrl} alt="Current photograph" />}
              {active.type === 'video' && <GlassDurationBadge seconds={active.durationSeconds} bottom={8} right={8} fontSize={11} />}
              <span className="hole-photo-batch-chip" data-chip>{`${index + 1} / ${props.shots.length}`}</span>
            </div>
            {inTaggedState && activeHole != null && <p role="status" aria-live="polite" className="hole-photo-batch-ok"><span>{`Tagged to the ${ordinal(activeHole)}. Remove the tag to choose a different hole.`}</span></p>}
            {removedNotice && !inTaggedState && <p role="status" aria-live="polite" className="hole-photo-batch-ok"><span>Tag removed. Pick the right hole.</span></p>}
            {confirmation && !inTaggedState && !removedNotice && <p role="status" aria-live="polite" className="hole-photo-batch-ok"><Check size={14} strokeWidth={3} style={{ color: A.IMPROVED }} aria-hidden="true" /><span>{confirmation}</span></p>}
            <div className="hole-photo-batch-strip" data-strip>
              <div className="hole-photo-batch-row">{props.shots.map((shot, i) => {
                const hole = props.assignments[shot.id];
                const video = shot.type === 'video';
                return <button key={shot.id} type="button"
                  className={`hole-photo-batch-thumb${shot.id === activeId ? ' is-current' : ''}${hole != null ? ' is-done' : ''}`}
                  aria-label={`Shot ${i + 1} of ${props.shots.length}${hole != null ? `, tagged to the ${ordinal(hole)}` : ''}`}
                  aria-current={shot.id === activeId ? 'true' : undefined}
                  onClick={() => choose(shot.id)}>
                  <ReviewMediaPreview {...shot} alt="" />
                  {hole != null && <span className="hole-photo-batch-badge">{hole}</span>}
                  {video && shot.durationSeconds != null && <span className="absolute right-[3px] bottom-[3px] rounded-[4px] px-1 text-[8.5px] font-bold" style={{ color: '#fff', background: 'rgba(0,0,0,0.55)' }}>{formatDuration(shot.durationSeconds)}</span>}
                </button>;
              })}</div>
            </div>
            <HolePhotoPicker holeCount={props.holes.length} knownHoleNumbers={props.holes} selectedHole={inTaggedState ? activeHole ?? null : selected} disabled={allTagged || inTaggedState} dimOthers={inTaggedState} onSelect={hole => { if (!allTagged && !inTaggedState) setSelected(prev => (prev === hole ? null : hole)); }} />
            <button type="button" className="hole-photo-batch-confirm" disabled={!confirmEnabled} data-enabled={confirmEnabled || undefined} onClick={() => { if (inTaggedState) removeTag(); else confirmTag(); }}>{inTaggedState ? 'Remove tag' : allTagged ? 'All tagged' : 'Confirm tag'}</button>
          </>}
        </div>
      </SheetContent>
    </Sheet>
  </section>;
}
