/** Course-only chrome overlays the canonical slides. No media lane, gesture or
 * second viewer lives here; filter replacement and jumps use the shared store.
 * Layout follows the canonical viewer (CANONICAL_FULLSCREEN_VIEWER part 2):
 * glass back circle, facts strip, author row, the shared FullscreenVideoRow
 * and a Tag / Share / Grid pill row. Canonical pieces come from fullscreenCanon. */
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, Grid2X2, MessageCircle, Share, Tag } from 'lucide-react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { COURSE_PLACES, type CoursePlace } from '@/lib/courseMedia/places';
import { filteredGallery, galleryAction, galleryFilters, galleryGroups, galleryPost, galleryRun, shortOrdinal, type GalleryFilter, type GalleryShot } from '@/lib/courseMedia/courseGallery';
import { holeOrdinal } from '@/lib/courseMedia/holeWalk';
import { postedDateLabel } from '@/lib/courseMedia/addedMonth';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useFullscreenMuteControl } from './useFullscreenMuteControl';
import { BACK_HIT, BackCircle, FullscreenVideoRow } from './fullscreenCanon';
import { ReactionGlyph } from '@/lib/reactionKind';
import { BAND_H_CSS } from '@/lib/media/fullscreenBand';
import { PLACE_LABELS } from '@/components/course-media-tab/ShotTagChoices';
import { placeAge } from '@/components/course-media-tab/CoursePlaceTiles';
import { ReadyShotCover } from '@/components/course-media-tab/ReadyShotCover';
import { CourseGalleryTagger } from '@/components/course-media-tab/CourseGalleryTagger';
import { holeFacts, type HoleWalkData } from '@/lib/courseMedia/holeFacts';
import { placeCells, statCells, type CourseFigures } from '@/lib/fullscreen/statRow';
import { FullscreenBottomStack } from './FullscreenBottomStack';
import { mergeTagged } from '@/lib/mentions/taggedEntities';
import type { PostGolfTags } from '@/hooks/feed/usePostGolfTags';
import type { FeedPost } from '@/components/media-system/types/media';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { toast } from 'sonner';
import './course-gallery.css';

const PLACE_TITLES: Record<CoursePlace, string> = { clubhouse: 'The clubhouse', food_drink: 'Food and drink', practice: 'The practice ground', pro_shop: 'The pro shop', views: 'The views', golfers: 'The golfers', conditions: 'Course conditions', stay: 'Where to stay', other: 'Around the club' };
export function CourseGalleryChrome({ onClose, engagement, tags, onOpenReview, onOpenTagged, holeWalk, courseFigures = null }: { onClose: () => void; engagement?: {
  likeState: { isLiked: boolean; count: number }; commentCount: number;
  onLike: () => void; onComment: () => void; onShare: () => void;
};
  /** The overlay's one tags batch over the shots' source posts. */
  tags?: PostGolfTags;
  /** Opens a review source's full review (same target as the post viewer's chip). */
  onOpenReview?: (post: FeedPost) => void;
  onOpenTagged?: (id: string, kind?: 'user' | 'business') => void;
  /** The course's hole walk from the shared useCourseHoleFacts (read by the overlay). */
  holeWalk?: HoleWalkData | null;
  /** Course par/yards/members' rating for untagged shots (overlay's shared stat reads). */
  courseFigures?: CourseFigures | null;
}) {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession(); const admin = useIsAdmin();
  const options = useFullscreenFeedStore(s => s.courseGallery);
  const data = useFullscreenFeedStore(s => s.galleryData);
  const pager = useFullscreenFeedStore(s => s.activePagerIdx);
  const galleryFeedPost = useFullscreenFeedStore(s => s.posts[0] ?? null);
  const [grid, setGrid] = useState(false);
  const [tagShot, setTagShot] = useState<GalleryShot | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  // The shared fullscreen sound control — the same one ImmersiveFullscreenChrome
  // uses, so course videos are not a second mute.
  const { shownMuted, handleMuteTap } = useFullscreenMuteControl();
  const panelRef = useRef<HTMLDivElement>(null); const gridRef = useRef<HTMLDivElement>(null);
  const [gridTop, setGridTop] = useState<number | undefined>(undefined);
  // The grid starts 6px below the panel's measured bottom and scrolls under it.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!grid || !panel) return;
    const measure = () => setGridTop(panel.getBoundingClientRect().bottom - (panel.offsetParent?.getBoundingClientRect().top ?? 0) + 6);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure); observer.observe(panel);
    return () => observer.disconnect();
  }, [grid, options?.filter]);
  if (!options || !data) return null;
  const list = filteredGallery(data.shots, options.filter);
  const shot = list[pager] ?? list[0];
  const label = (filter: GalleryFilter) => t(`media.gallery.filters.${filter}`, { defaultValue: filter === 'all' ? 'All' : filter === 'holes' ? 'Holes' : PLACE_LABELS[filter] });
  const jump = (id: string) => {
    const next = { ...options, startShotId: id };
    useFullscreenFeedStore.getState().replaceGallery(galleryPost(list, next), next);
  };
  const changeFilter = (filter: GalleryFilter) => {
    const next = { ...options, filter, startShotId: undefined };
    useFullscreenFeedStore.getState().replaceGallery(galleryPost(filteredGallery(data.shots, filter), next), next);
    void analyticsEvents.track('course_gallery_filter', { filter });
  };
  const share = async () => {
    if (!grid && !shot) return;
    // Grid shares the Media tab for the current filter; the viewer shares the shot.
    const url = grid
      ? `${window.location.origin}/courses/${options.courseId}?tab=media&filter=${encodeURIComponent(options.filter)}`
      : `${window.location.origin}/courses/${options.courseId}?tab=media&shot=${encodeURIComponent(shot?.id ?? '')}`;
    try {
      if (navigator.share) await navigator.share({ title: options.courseName, url });
      else { await navigator.clipboard.writeText(url); toast(t('media.gallery.copied', { defaultValue: 'Link copied' })); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) toast(t('media.gallery.shareError', { defaultValue: 'The link could not be shared.' })); }
  };
  // Hole facts rules are shared with the feed hole card (lib/courseMedia/holeFacts).
  const facts = shot?.holeTag ? holeFacts(holeWalk ?? data, shot.holeTag.hole_no) : null;
  const place = COURSE_PLACES.find(place => place.id === shot?.placeTag?.place);
  const placeCount = place ? filteredGallery(data.shots, place.id).length : 0;
  const age = place ? placeAge(filteredGallery(data.shots, place.id)[0]?.addedAt ?? '') : null;
  const action = shot ? galleryAction(shot, user?.id, admin) : null;
  const galleryTagged = shot && tags && !shot.post.id.startsWith('shots:') ? mergeTagged(
    shot.post.actorType !== 'business' ? (shot.post.isReview && shot.post.review?.reviewId ? tags.withByReview?.get(shot.post.review.reviewId) : tags.withByPost.get(shot.post.id)) : null,
    shot.post.isReview ? shot.post.review?.reviewText || shot.post.caption : shot.post.caption,
    [shot.post.actorId, shot.post.userId], tags.mentionEntities) : [];
  const sourcePostId = shot?.item.memberShot?.sourcePostId ?? (!shot?.post.id.startsWith('shots:') ? shot?.post.id : null);
  const hasPostActions = !!sourcePostId && !!engagement;
  const run = galleryRun(data.shots, shot);
  const runIndex = shot ? Math.max(0, run.findIndex(row => row.id === shot.id)) : 0;
  const currentHole = !grid ? shot?.holeTag?.hole_no : undefined;
  const holeShots = (n: number) => list.filter(row => row.holeTag?.hole_no === n);
  const jumpHole = (n: number) => {
    const first = holeShots(n)[0];
    if (!first) return;
    if (!grid) { jump(first.id); return; }
    const scroller = gridRef.current;
    const group = scroller?.querySelector<HTMLElement>(`[data-gallery-group="hole:${n}"]`);
    if (scroller && group) scroller.scrollTop = group.offsetTop;
  };
  const shotWord = (n: number) => n === 1 ? 'shot' : 'shots';
  const isVideo = !grid && shot?.item.type === 'video';
  const toggleGrid = () => { setGrid(on => !on); void analyticsEvents.track('course_gallery_grid_toggle', { on: !grid }); };
  const pills = <div className="course-gallery-pills" data-gallery-pills>
    {!grid && hasPostActions && <>
      <Button variant="ghost" data-pill="like" className="course-gallery-pill" aria-label={engagement?.likeState.isLiked ? 'Unlike' : 'Like'} onClick={engagement?.onLike}><ReactionGlyph reacted={engagement?.likeState.isLiked ?? shot?.post.isLikedByMe ?? false} size={20} tone="chrome" />{(engagement?.likeState.count ?? shot?.post.likeCount ?? 0) || null}</Button>
      <Button variant="ghost" data-pill="comment" className="course-gallery-pill" aria-label="Comments" onClick={engagement?.onComment}><MessageCircle size={20} />{(engagement?.commentCount ?? shot?.post.commentCount ?? 0) || null}</Button>
    </>}
    {!grid && action && <Button variant="ghost" data-pill="tag" aria-label={action === 'tag' ? 'Tag this shot' : 'Fix tag'} className={`course-gallery-pill is-square${action === 'tag' ? ' is-primary' : ''}`} onClick={() => { if (!shot) return; setTagShot(shot); void analyticsEvents.track('course_gallery_tag_open', { mode: action }); }}><Tag size={17} /></Button>}
    <Button variant="ghost" data-pill="share" aria-label="Share" className="course-gallery-pill is-square" onClick={() => { if (!grid && hasPostActions && engagement) engagement.onShare(); else void share(); }}><Share size={18} /></Button>
    <Button variant="ghost" data-pill="grid" className="course-gallery-pill is-square" aria-label={t(grid ? 'media.gallery.fullscreen' : 'media.gallery.grid', { defaultValue: grid ? 'Full screen' : 'Grid view' })} aria-pressed={grid} onClick={toggleGrid}><Grid2X2 size={18} /></Button>
  </div>;
  const kickerHole = (n: number) => t('media.gallery.holeKicker', { ordinal: holeOrdinal(n), defaultValue: `The ${holeOrdinal(n)}` });
  return <div className={`course-gallery-chrome${grid ? ' is-grid' : ''}`} data-course-gallery data-gallery-filter={options.filter}>
    <div className="course-gallery-top-shade" aria-hidden />
    <div className="course-gallery-panel" ref={panelRef} data-gallery-panel>
      <div className="course-gallery-top">
        <button type="button" className="course-gallery-back" style={BACK_HIT} aria-label={t('media.gallery.back', { defaultValue: 'Back' })} onClick={onClose}><BackCircle /></button>
        <div className="course-gallery-heading"><b>{options.courseName}</b><span data-gallery-count>{grid ? t('media.gallery.gridCount', { count: list.length, filter: label(options.filter), defaultValue: `${list.length} ${shotWord(list.length)} · ${label(options.filter)}` }) : t('media.gallery.total', { count: data.shots.length, defaultValue: `${data.shots.length} ${shotWord(data.shots.length)} from members` })}</span></div>
      </div>
      <div className="course-gallery-filters">{galleryFilters(data.shots).map(({ filter, count }) => {
        const Icon = filter === 'holes' ? Flag : COURSE_PLACES.find(place => place.id === filter)?.icon;
        return <Button key={filter} variant="ghost" className="course-gallery-chip" aria-pressed={filter === options.filter} onClick={() => changeFilter(filter)}>{Icon && <Icon size={14} />}{label(filter)}<span>{count}</span></Button>;
      })}</div>
      {options.filter === 'holes' && <div className="course-gallery-jump" data-gallery-jump>
        <div className="course-gallery-jump-head"><span className="course-gallery-label">{t('media.gallery.jump', { defaultValue: 'JUMP TO A HOLE' })}</span>
          {!grid && shot?.holeTag && <span className="course-gallery-label is-ink" data-gallery-position>{t('media.gallery.position', { ordinal: shortOrdinal(shot.holeTag.hole_no).toUpperCase(), i: runIndex + 1, n: run.length, defaultValue: `${shortOrdinal(shot.holeTag.hole_no).toUpperCase()} · ${runIndex + 1} OF ${run.length}` })}</span>}</div>
        <div className="course-gallery-holes">{Array.from({ length: 18 }, (_, i) => {
          const n = i + 1; const rows = holeShots(n);
          return <Button key={n} variant="ghost" data-shot={rows.length > 0} aria-label={t('media.gallery.hole', { hole: n, defaultValue: `Hole ${n}` })} aria-current={currentHole === n ? 'true' : undefined} onClick={() => jumpHole(n)}>
            <i className="course-gallery-bar">{rows.length ? rows.map(row => <em key={row.id} data-piece={currentHole === n ? row.id === shot?.id ? 'current' : 'hole' : 'shot'} />) : <em data-piece="empty" />}</i>
            <span>{n}</span></Button>;
        })}</div>
      </div>}
    </div>
    {grid ? <>
      <div className="course-gallery-grid" data-gallery-grid ref={gridRef} style={{ top: gridTop }}>{galleryGroups(data.shots, options.filter).map(group => <section key={group.key} data-gallery-group={group.key}>
        {group.hole != null && <header><span className="course-gallery-kicker">{kickerHole(group.hole)}</span><span className="course-gallery-label">{t('media.gallery.shots', { count: group.shots.length, defaultValue: `${group.shots.length} ${shotWord(group.shots.length)}` })}</span></header>}
        <div className="course-gallery-squares">{group.shots.map(square => <Button variant="ghost" key={square.id} className="course-gallery-square block h-auto w-full rounded-none p-0" aria-label={t('media.gallery.viewShot', { id: square.id, defaultValue: `View shot ${square.id}` })} onClick={() => { jump(square.id); setGrid(false); }}>
          <ReadyShotCover fallbackIcon shots={[{ id: square.id, media_url: square.item.imageUrl ?? '', media_type: square.item.type, poster_url: square.item.thumbnailUrl, stream_id: square.item.streamId, duration_seconds: square.item.duration }]} />
          {square.item.type === 'video' && square.item.duration != null && <span className="course-gallery-duration">{Math.floor(square.item.duration / 60)}:{String(Math.floor(square.item.duration % 60)).padStart(2, '0')}</span>}
        </Button>)}</div>
      </section>)}</div>
      {pills}
    </> : shot && <>
      <div className="course-gallery-shade" data-fullscreen-shade aria-hidden />
      <div className="course-gallery-info" data-gallery-stack {...(scrubbing ? { inert: '' } : {})} style={{ bottom: isVideo ? `calc(${BAND_H_CSS} + 38px)` : `calc(${BAND_H_CSS} + 2px)`, opacity: scrubbing ? 0 : 1 }}>
        <FullscreenBottomStack
          dotsKind="gallery"
          dots={run.length > 1 ? { count: run.length, active: runIndex } : null}
          people={galleryTagged}
          peopleKey={shot.id}
          onOpenTagged={onOpenTagged}
          mute={isVideo ? { muted: shownMuted, onToggle: handleMuteTap } : null}
          member={{ name: shot.name, avatarUrl: shot.avatar || null, userId: shot.ownerId || null, time: postedDateLabel(shot.post.createdAt) || null }}
          onOpenReview={shot.post.isReview && onOpenReview ? () => onOpenReview(shot.post) : null}
          cells={shot.holeTag ? statCells({ holeNo: shot.holeTag.hole_no, facts })
            : place ? placeCells({ place: place.id, title: t(`media.gallery.titles.${place.id}`, { defaultValue: PLACE_TITLES[place.id] }), count: placeCount, age })
            : statCells({ holeNo: null, course: courseFigures })}
        />
      </div>
      <FullscreenVideoRow muteInStack activePost={galleryFeedPost} showMute={isVideo} scrubbing={scrubbing} shownMuted={shownMuted} onMute={handleMuteTap} onDraggingChange={setScrubbing} />
      {pills}
    </>}
    {tagShot && <CourseGalleryTagger courseId={options.courseId} shot={tagShot} holes={data.holes.map(hole => hole.hole_no)} onClose={() => setTagShot(null)} onSaved={(holeTag, placeTag) => {
      const nextData = { ...data, shots: data.shots.map(row => row.id === tagShot.id ? { ...row, holeTag, placeTag } : row) };
      let nextFilter = options.filter;
      if (!filteredGallery(nextData.shots, nextFilter).some(row => row.id === tagShot.id)) nextFilter = holeTag ? 'holes' : (placeTag?.place as CoursePlace | undefined) ?? 'all';
      const next = { ...options, filter: nextFilter, startShotId: tagShot.id };
      useFullscreenFeedStore.getState().replaceGallery(galleryPost(filteredGallery(nextData.shots, nextFilter), next), next, nextData);
    }} />}
  </div>;
}