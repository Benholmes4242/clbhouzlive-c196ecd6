/** Course-only chrome overlays the canonical slides. No media lane, gesture or
 * second viewer lives here; filter replacement and jumps use the shared store. */
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, Grid2X2, Image as ImageIcon, Share, Tag, X } from 'lucide-react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { COURSE_PLACES, type CoursePlace } from '@/lib/courseMedia/places';
import { filteredGallery, galleryAction, galleryFilters, galleryGroups, galleryPost, galleryRun, shortOrdinal, type GalleryFilter, type GalleryShot } from '@/lib/courseMedia/courseGallery';
import { holeOrdinal } from '@/lib/courseMedia/holeWalk';
import { addedMonthLabel } from '@/lib/courseMedia/addedMonth';
import { PLACE_LABELS } from '@/components/course-media-tab/ShotTagChoices';
import { placeAge } from '@/components/course-media-tab/CoursePlaceTiles';
import { ReadyShotCover } from '@/components/course-media-tab/ReadyShotCover';
import { CourseGalleryTagger } from '@/components/course-media-tab/CourseGalleryTagger';
import { VERDICT_KICKER } from '@/components/courses/course-detail/about/AboutSection';
import { toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { toast } from 'sonner';
import './course-gallery.css';

const PLACE_TITLES: Record<CoursePlace, string> = { clubhouse: 'The clubhouse', food_drink: 'Food and drink', practice: 'The practice ground', pro_shop: 'The pro shop', views: 'The views', golfers: 'The golfers', conditions: 'Course conditions', stay: 'Where to stay', other: 'Around the club' };
export function CourseGalleryChrome({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession(); const admin = useIsAdmin();
  const options = useFullscreenFeedStore(s => s.courseGallery);
  const data = useFullscreenFeedStore(s => s.galleryData);
  const pager = useFullscreenFeedStore(s => s.activePagerIdx);
  const [grid, setGrid] = useState(false);
  const [tagShot, setTagShot] = useState<GalleryShot | null>(null);
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
    if (!shot) return;
    const url = `${window.location.origin}/courses/${options.courseId}?tab=media&shot=${encodeURIComponent(shot.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: options.courseName, url });
      else { await navigator.clipboard.writeText(url); toast(t('media.gallery.copied', { defaultValue: 'Link copied' })); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) toast(t('media.gallery.shareError', { defaultValue: 'The link could not be shared.' })); }
  };
  const hole = data.holes.find(hole => hole.hole_no === shot?.holeTag?.hole_no);
  const field = hole && Number.isFinite(hole.avg_to_par) ? toParParts(hole.avg_to_par) : null;
  const place = COURSE_PLACES.find(place => place.id === shot?.placeTag?.place);
  const placeCount = place ? filteredGallery(data.shots, place.id).length : 0;
  const age = place ? placeAge(filteredGallery(data.shots, place.id)[0]?.addedAt ?? '') : null;
  const action = shot ? galleryAction(shot, user?.id, admin) : null;
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
  return <div className={`course-gallery-chrome${grid ? ' is-grid' : ''}`} data-course-gallery data-gallery-filter={options.filter}>
    <div className="course-gallery-panel" ref={panelRef} data-gallery-panel>
      <div className="course-gallery-top">
        <Button variant="ghost" className="course-gallery-circle" aria-label={t('media.gallery.close', { defaultValue: 'Close' })} onClick={onClose}><X size={16} /></Button>
        <div className="course-gallery-heading"><b>{options.courseName}</b><span data-gallery-count>{grid ? t('media.gallery.gridCount', { count: list.length, filter: label(options.filter), defaultValue: `${list.length} ${shotWord(list.length)} · ${label(options.filter)}` }) : t('media.gallery.count', { i: Math.min(pager + 1, list.length), n: list.length, filter: label(options.filter), defaultValue: `${Math.min(pager + 1, list.length)} of ${list.length} · ${label(options.filter)}` })}</span></div>
        <Button variant="ghost" className="course-gallery-circle course-gallery-grid-toggle" aria-label={t(grid ? 'media.gallery.fullscreen' : 'media.gallery.grid', { defaultValue: grid ? 'Full screen' : 'Grid view' })} aria-pressed={grid} onClick={() => { setGrid(on => !on); void analyticsEvents.track('course_gallery_grid_toggle', { on: !grid }); }}>{grid ? <ImageIcon size={16} /> : <Grid2X2 size={16} />}</Button>
      </div>
      <div className="course-gallery-filters">{galleryFilters(data.shots).map(({ filter, count }) => {
        const Icon = filter === 'holes' ? Flag : COURSE_PLACES.find(place => place.id === filter)?.icon;
        return <Button key={filter} variant="ghost" className="course-gallery-chip" aria-pressed={filter === options.filter} onClick={() => changeFilter(filter)}>{Icon && <Icon size={14} />}{label(filter)}<span>{count}</span></Button>;
      })}</div>
      {options.filter === 'holes' && <div className="course-gallery-jump" data-gallery-jump>
        <div className="course-gallery-jump-head"><span className="course-gallery-label">{t('media.gallery.jump', { defaultValue: 'JUMP TO A HOLE' })}</span>
          {!grid && shot?.holeTag && <span className="course-gallery-label is-ink" data-gallery-position>{t('media.gallery.position', { ordinal: shortOrdinal(shot.holeTag.hole_no).toUpperCase(), i: runIndex + 1, n: run.length, defaultValue: `THE ${shortOrdinal(shot.holeTag.hole_no).toUpperCase()} · SHOT ${runIndex + 1} OF ${run.length}` })}</span>}</div>
        <div className="course-gallery-holes">{Array.from({ length: 18 }, (_, i) => {
          const n = i + 1; const rows = holeShots(n);
          return <Button key={n} variant="ghost" data-shot={rows.length > 0} aria-label={t('media.gallery.hole', { hole: n, defaultValue: `Hole ${n}` })} aria-current={currentHole === n ? 'true' : undefined} onClick={() => jumpHole(n)}>
            <i className="course-gallery-bar">{rows.length ? rows.map(row => <em key={row.id} data-piece={currentHole === n ? row.id === shot?.id ? 'current' : 'hole' : 'shot'} />) : <em data-piece="empty" />}</i>
            <span>{n}</span></Button>;
        })}</div>
      </div>}
    </div>
    {grid ? <div className="course-gallery-grid" data-gallery-grid ref={gridRef} style={{ top: gridTop }}>{galleryGroups(data.shots, options.filter).map(group => <section key={group.key} data-gallery-group={group.key}>
      {group.hole != null && <header><span style={VERDICT_KICKER}>{t('media.gallery.holeKicker', { ordinal: holeOrdinal(group.hole), defaultValue: `The ${holeOrdinal(group.hole)}` })}</span><span className="course-gallery-label">{t('media.gallery.shots', { count: group.shots.length, defaultValue: `${group.shots.length} ${shotWord(group.shots.length)}` })}</span></header>}
      <div className="course-gallery-squares">{group.shots.map(square => <Button variant="ghost" key={square.id} className="course-gallery-square" aria-label={t('media.gallery.viewShot', { id: square.id, defaultValue: `View shot ${square.id}` })} onClick={() => { jump(square.id); setGrid(false); }}>
        <ReadyShotCover fallbackIcon shots={[{ id: square.id, media_url: square.item.imageUrl ?? '', media_type: square.item.type, poster_url: square.item.thumbnailUrl, stream_id: square.item.streamId, duration_seconds: square.item.duration }]} />
        {square.item.type === 'video' && square.item.duration != null && <span className="course-gallery-duration">{Math.floor(square.item.duration / 60)}:{String(Math.floor(square.item.duration % 60)).padStart(2, '0')}</span>}
      </Button>)}</div>
    </section>)}</div> : shot && <div className="course-gallery-info">
      {run.length > 1 && <div className="course-gallery-progress" data-gallery-progress>{run.map(row => <i key={row.id} data-current={row.id === shot.id} />)}</div>}
      {shot.holeTag ? <>
        <div className="course-gallery-kicker-row"><span style={VERDICT_KICKER}>{t('media.gallery.holeKicker', { ordinal: holeOrdinal(shot.holeTag.hole_no), defaultValue: `The ${holeOrdinal(shot.holeTag.hole_no)}` })}</span>{run.length > 1 && <span className="course-gallery-label is-mute">{t('media.gallery.shotOf', { i: runIndex + 1, n: run.length, defaultValue: `SHOT ${runIndex + 1} OF ${run.length}` })}</span>}</div>
        <h2>{data.scored && hole ? hole.yards != null ? t('media.gallery.parYards', { par: hole.par, yards: hole.yards, defaultValue: `Par ${hole.par} · ${hole.yards} yards` }) : t('media.gallery.par', { par: hole.par, defaultValue: `Par ${hole.par}` }) : t('media.gallery.holeTitle', { ordinal: holeOrdinal(shot.holeTag.hole_no), defaultValue: `The ${holeOrdinal(shot.holeTag.hole_no)} hole` })}</h2>
        {data.scored && (hole?.stroke_index != null || field) && <div className="course-gallery-stats">
          {hole?.stroke_index != null && <div><b>{hole.stroke_index}</b><span>{t('media.gallery.strokeIndex', { defaultValue: 'Stroke index' })}</span></div>}
          {field && <div><b style={{ color: field.tone }}>{field.text}</b><span>{t('media.gallery.fieldLoses', { defaultValue: 'Field loses' })}</span></div>}
        </div>}
      </> : place ? <>
        <div className="course-gallery-kicker-row"><div className="course-gallery-place-kicker"><place.icon size={14} strokeWidth={2.2} /><span style={VERDICT_KICKER}>{label(place.id)}</span></div>{run.length > 1 && <span className="course-gallery-label is-mute">{t('media.gallery.shotOf', { i: runIndex + 1, n: run.length, defaultValue: `SHOT ${runIndex + 1} OF ${run.length}` })}</span>}</div>
        <h2>{t(`media.gallery.titles.${place.id}`, { defaultValue: PLACE_TITLES[place.id] })}</h2>
        <p>{t('media.gallery.membersShots', { count: placeCount, defaultValue: `${placeCount} ${shotWord(placeCount)} from members` })}{place.id === 'conditions' && age && <> · {t('media.gallery.latest', { age: t(`media.gallery.age.${age.key}`, { count: age.count, defaultValue: age.key === 'today' ? 'Today' : age.key === 'yesterday' ? 'Yesterday' : `${age.count} ${age.key} ago` }), defaultValue: `Latest ${age.key === 'today' ? 'Today' : age.key === 'yesterday' ? 'Yesterday' : `${age.count} ${age.key} ago`}` })}</>}</p>
      </> : null}
      {(shot.holeTag || shot.placeTag) && <hr />}
      <div className="course-gallery-credit-row"><div className="course-gallery-credit"><span className="course-gallery-avatar">{shot.avatar ? <img src={shot.avatar} alt="" /> : shot.name.split(/\s+/).map(word => word[0]).slice(0, 2).join('')}</span><span><b>{shot.name}</b>{addedMonthLabel(shot.addedAt) && ` · ${addedMonthLabel(shot.addedAt)}`}</span></div><div className="course-gallery-actions">
        {action && <Button variant="ghost" className={`course-gallery-tag${action === 'tag' ? ' is-primary' : ''}`} onClick={() => { setTagShot(shot); void analyticsEvents.track('course_gallery_tag_open', { mode: action }); }}><Tag size={15} />{t(action === 'tag' ? 'media.gallery.tag' : 'media.gallery.retag', { defaultValue: action === 'tag' ? 'Tag this shot' : 'Retag' })}</Button>}
        <Button variant="ghost" className="course-gallery-circle" aria-label={t('media.gallery.share', { defaultValue: 'Share' })} onClick={() => void share()}><Share size={16} /></Button>
      </div></div>
    </div>}
    {tagShot && <CourseGalleryTagger courseId={options.courseId} shot={tagShot} holes={data.holes.map(hole => hole.hole_no)} onClose={() => setTagShot(null)} onSaved={(holeTag, placeTag) => {
      const nextData = { ...data, shots: data.shots.map(row => row.id === tagShot.id ? { ...row, holeTag, placeTag } : row) };
      let nextFilter = options.filter;
      if (!filteredGallery(nextData.shots, nextFilter).some(row => row.id === tagShot.id)) nextFilter = holeTag ? 'holes' : (placeTag?.place as CoursePlace | undefined) ?? 'all';
      const next = { ...options, filter: nextFilter, startShotId: tagShot.id };
      useFullscreenFeedStore.getState().replaceGallery(galleryPost(filteredGallery(nextData.shots, nextFilter), next), next, nextData);
    }} />}
  </div>;
}