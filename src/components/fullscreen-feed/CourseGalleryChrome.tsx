/** Course-only chrome overlays the canonical slides. No media lane, gesture or
 * second viewer lives here; filter replacement and jumps use the shared store. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, Grid2X2, Share, Tag, X } from 'lucide-react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { COURSE_PLACES, type CoursePlace } from '@/lib/courseMedia/places';
import { filteredGallery, galleryAction, galleryFilters, galleryGroups, galleryPost, type GalleryFilter, type GalleryShot } from '@/lib/courseMedia/courseGallery';
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
  return <div className={`course-gallery-chrome${grid ? ' is-grid' : ''}`} data-course-gallery data-gallery-filter={options.filter}>
    {grid && <div className="course-gallery-grid-wash" />}
    <div className="course-gallery-top">
      <Button variant="ghost" className="course-gallery-circle" aria-label={t('media.gallery.close', { defaultValue: 'Close' })} onClick={onClose}><X size={17} /></Button>
      <div className="course-gallery-heading"><b>{options.courseName}</b><span>{grid ? t('media.gallery.gridCount', { count: list.length, filter: label(options.filter), defaultValue: `${list.length} shots · ${label(options.filter)}` }) : t('media.gallery.count', { i: Math.min(pager + 1, list.length), n: list.length, filter: label(options.filter), defaultValue: `${Math.min(pager + 1, list.length)} of ${list.length} · ${label(options.filter)}` })}</span></div>
      <Button variant="ghost" className="course-gallery-circle" aria-label={t('media.gallery.grid', { defaultValue: 'Grid view' })} aria-pressed={grid} onClick={() => { setGrid(on => !on); void analyticsEvents.track('course_gallery_grid_toggle', { on: !grid }); }}><Grid2X2 size={16} /></Button>
    </div>
    <div className="course-gallery-filters">{galleryFilters(data.shots).map(({ filter, count }) => {
      const Icon = filter === 'holes' ? Flag : COURSE_PLACES.find(place => place.id === filter)?.icon;
      return <Button key={filter} variant="ghost" className="course-gallery-chip" aria-pressed={filter === options.filter} onClick={() => changeFilter(filter)}>{Icon && <Icon size={14} />}{label(filter)}<span>{count}</span></Button>;
    })}</div>
    {!grid && options.filter === 'holes' && <div className="course-gallery-holes">{Array.from({ length: 18 }, (_, i) => {
      const n = i + 1; const first = list.find(shot => shot.holeTag?.hole_no === n);
      return <Button key={n} variant="ghost" data-shot={!!first} aria-label={t('media.gallery.hole', { hole: n, defaultValue: `Hole ${n}` })} aria-current={shot?.holeTag?.hole_no === n ? 'true' : undefined} onClick={() => { if (first) jump(first.id); }}><i /><span>{n}</span></Button>;
    })}</div>}
    {grid ? <div className="course-gallery-grid" data-gallery-grid>{galleryGroups(data.shots, options.filter).map(group => <section key={group.key} data-gallery-group={group.key}>
      <header><span style={VERDICT_KICKER}>{group.hole ? t('media.gallery.holeKicker', { ordinal: holeOrdinal(group.hole), defaultValue: `The ${holeOrdinal(group.hole)}` }) : group.place ? label(group.place) : t('media.gallery.notTagged', { defaultValue: 'Not tagged' })}</span><span className="course-gallery-label">{t('media.gallery.shots', { count: group.shots.length, defaultValue: `${group.shots.length} ${group.shots.length === 1 ? 'shot' : 'shots'}` })}</span></header>
      <div className="course-gallery-squares">{group.shots.map(square => <Button variant="ghost" key={square.id} className="course-gallery-square" aria-label={t('media.gallery.viewShot', { id: square.id, defaultValue: `View shot ${square.id}` })} onClick={() => { jump(square.id); setGrid(false); }}>
        <ReadyShotCover fallbackIcon shots={[{ id: square.id, media_url: square.item.imageUrl ?? '', media_type: square.item.type, poster_url: square.item.thumbnailUrl, stream_id: square.item.streamId, duration_seconds: square.item.duration }]} />
        {square.item.type === 'video' && square.item.duration != null && <span className="course-gallery-duration">{Math.floor(square.item.duration / 60)}:{String(Math.floor(square.item.duration % 60)).padStart(2, '0')}</span>}
      </Button>)}</div>
    </section>)}</div> : shot && <div className="course-gallery-info">
      {shot.holeTag ? <>
        <span style={VERDICT_KICKER}>{t('media.gallery.holeKicker', { ordinal: holeOrdinal(shot.holeTag.hole_no), defaultValue: `The ${holeOrdinal(shot.holeTag.hole_no)}` })}</span>
        <h2>{data.scored && hole ? hole.yards != null ? t('media.gallery.parYards', { par: hole.par, yards: hole.yards, defaultValue: `Par ${hole.par} · ${hole.yards} yards` }) : t('media.gallery.par', { par: hole.par, defaultValue: `Par ${hole.par}` }) : t('media.gallery.holeTitle', { ordinal: holeOrdinal(shot.holeTag.hole_no), defaultValue: `The ${holeOrdinal(shot.holeTag.hole_no)} hole` })}</h2>
        <div className="course-gallery-stats">
          {data.scored && hole?.stroke_index != null && <div><b>{hole.stroke_index}</b><span>{t('media.gallery.strokeIndex', { defaultValue: 'Stroke index' })}</span></div>}
          {data.scored && field && <div><b style={{ color: field.tone }}>{field.text}</b><span>{t('media.gallery.fieldLoses', { defaultValue: 'Field loses' })}</span></div>}
          <div><b>{data.shots.filter(row => row.holeTag?.hole_no === shot.holeTag?.hole_no).length}</b><span>{t('media.gallery.shotsOfIt', { count: data.shots.filter(row => row.holeTag?.hole_no === shot.holeTag?.hole_no).length, defaultValue: data.shots.filter(row => row.holeTag?.hole_no === shot.holeTag?.hole_no).length === 1 ? 'Shot of it' : 'Shots of it' })}</span></div>
        </div>
      </> : place ? <>
        <div className="course-gallery-place-kicker"><place.icon size={14} strokeWidth={2.2} /><span style={VERDICT_KICKER}>{label(place.id)}</span></div>
        <h2>{t(`media.gallery.titles.${place.id}`, { defaultValue: PLACE_TITLES[place.id] })}</h2>
        <p>{t('media.gallery.membersShots', { count: placeCount, defaultValue: `${placeCount} ${placeCount === 1 ? 'shot' : 'shots'} from members` })}{place.id === 'conditions' && age && <> · {t('media.gallery.latest', { age: t(`media.gallery.age.${age.key}`, { count: age.count, defaultValue: age.key === 'today' ? 'Today' : age.key === 'yesterday' ? 'Yesterday' : `${age.count} ${age.key} ago` }), defaultValue: `Latest ${age.key === 'today' ? 'Today' : age.key === 'yesterday' ? 'Yesterday' : `${age.count} ${age.key} ago`}` })}</>}</p>
      </> : <span className="course-gallery-label course-gallery-untagged">{t('media.gallery.notTaggedYet', { defaultValue: 'Not tagged yet' })}</span>}
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