import { VERDICT_KICKER, TAB_TITLE } from '@/components/courses/course-detail/about/AboutSection';
/** One mounted grid owns the row-local detail panel and conditional scroll.
 * Real stored photos supply imagery, never illustrative mock art.
 * BRIEF_HOLE_PANEL_CAROUSEL: the panel frame is a swipeable track with one
 * slide per shot and a thumbnail strip of EVERY shot (active included).
 * BRIEF_CANONICAL_VIEWER_FOR_MEMBER_SHOTS §4: a tap on a ready slide opens
 * the CANONICAL full-screen viewer (FullscreenFeedOverlay via openWithOrigin,
 * readOnly) through every ready shot on the hole, each shot its own page
 * credited to the member who added it; closing returns to the panel with the
 * frame left on the tapped shot. Captions read added_at (when the member
 * added the shot to clbhouz); the month chips and "across N months" keep
 * EXIF. The panel never plays video inline — a ready video slide is its
 * poster plus a decorative glass disc, and playback lives in the fullscreen
 * viewer. */
import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { A, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { capitalPhotoCount, holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { addedMonthLabel } from '@/lib/courseMedia/addedMonth';
import { holeShotsToFeedPosts } from '@/lib/courseMedia/memberShotPosts';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { HoleMediaThumbnail } from './HoleMediaVideo';
import { captureMonthLabel, deriveHoleWalk, holeOrdinal, holePhotoMonths } from '@/lib/courseMedia/holeWalk';
import './hole-walk.css';

/** Stage 2: null duration is never playable. Shared with moderator previews
 * so neither surface attaches HLS while encoding is still in progress. */
export function HoleProcessingVideo({ media, label }: { media: { media_url: string; stream_id?: string | null; poster_url?: string | null }; label: string }) {
  return <div className="hole-media-processing">
    <img src={holeMediaPoster({ ...media, media_type: 'video' })} alt={label} onError={event => { event.currentTarget.hidden = true; }} />
    <span className="hole-media-processing-label" style={{ color: A.DIM }}>Processing</span>
  </div>;
}

export function HoleWalk({ available, holes, rows, totalMedia, courseName, authors, onAddFirst, memberId, onMove, onRemove, focus, scored = true }: {
  available: boolean; holes: readonly CourseHole[]; rows: readonly HolePhoto[];
  totalMedia: number; courseName?: string; authors?: ReadonlyMap<string, string>;
  onAddFirst: (hole: number) => void;
  memberId?: string; onMove?: (row: HolePhoto) => void; onRemove?: (row: HolePhoto) => void;
  focus?: { hole: number; id: string; nonce: number } | null;
  scored?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  // A moved item is followed to its new hole by the caller's focus nonce.
  useEffect(() => {
    if (!focus) return;
    setSelected(focus.hole); setPhotoId(focus.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce]);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!available || selected == null) return;
    const panel = panelRef.current;
    if (panel && panel.getBoundingClientRect().top >= window.innerHeight) {
      panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selected, available]);

  const trackRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef(0);
  // Set when a scroll-driven photoId change is in flight, so the programmatic
  // scroll effect does not scroll the track back to where it already is.
  const scrollDrivenRef = useRef(false);
  // Strip taps slide smoothly; focus/deep link and panel open jump instantly.
  const behaviorRef = useRef<ScrollBehavior>('auto');
  const photoIdRef = useRef(photoId);
  photoIdRef.current = photoId;
  const tileRef = useRef<{ photos: readonly HolePhoto[] } | null>(null);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const show = available && holes.length > 0;
  const walk = show ? deriveHoleWalk(holes, rows) : null;
  const tile = walk?.tiles.find(item => item.hole.hole_no === selected);
  tileRef.current = tile ?? null;
  const photos = tile?.photos ?? [];
  const activeIndex = tile ? Math.max(0, photos.findIndex(photo => photo.id === photoId)) : 0;

  // photoId changed from anywhere other than a track swipe: bring the frame
  // to that shot (smooth from the strip, instant for focus/panel open).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !tileRef.current) return;
    if (scrollDrivenRef.current) { scrollDrivenRef.current = false; return; }
    const width = track.clientWidth;
    if (!width) return;
    const index = Math.max(0, tileRef.current.photos.findIndex(photo => photo.id === photoIdRef.current));
    if (Math.round(track.scrollLeft / width) !== index) {
      track.scrollTo?.({ left: index * width, behavior: behaviorRef.current });
    }
    behaviorRef.current = 'auto';
  }, [photoId, selected, available]);

  // Keep the active thumbnail in view as the active shot changes.
  useEffect(() => {
    activeThumbRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [activeIndex, selected]);

  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track || rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const width = track.clientWidth;
      const current = tileRef.current;
      if (!width || !current) return;
      const i = Math.round(track.scrollLeft / width);
      const photo = current.photos[i];
      if (photo && photo.id !== photoIdRef.current) {
        scrollDrivenRef.current = true;
        setPhotoId(photo.id);
      }
    });
  };

  if (!show || !walk) return null;
  const months = tile ? holePhotoMonths(tile.photos) : [];
  const field = tile ? toParParts(tile.hole.avg_to_par) : null;
  const active = photos[activeIndex];

  // Every image or ready video on the hole, in panel order; processing videos
  // are left out of the viewer entirely.
  const playable = photos.filter(photo => photo.media_type !== 'video' || photo.duration_seconds != null);

  // §4 — the tapped slide opens the canonical viewer over every ready shot on
  // the hole, one page per shot, landing on the tapped shot. The frame stays
  // on the tapped shot when the viewer closes (it has no index callback).
  const openViewer = (id: string) => {
    const index = playable.findIndex(photo => photo.id === id);
    if (index < 0) return;
    const tapped = playable[index];
    const posts = holeShotsToFeedPosts(
      playable.map(photo => ({ ...photo, member_id: photo.user_id, member_name: authors?.get(photo.user_id) ?? null })),
      courseName,
    );
    openWithOrigin({
      posts,
      index,
      originEl: null,
      posterUrl: tapped.media_type === 'video' ? holeMediaPoster(tapped) : tapped.media_url,
      mediaId: id,
      openedFrom: 'course-media',
      options: { readOnly: true },
    });
  };

  const panel = tile && <section ref={panelRef} className={scored ? 'hole-walk-panel' : 'hole-walk-panel hole-walk-panel-unscored'} role="region" aria-label={`Hole ${tile.hole.hole_no}`}>
      <p className="hole-walk-kicker" style={VERDICT_KICKER}>The {holeOrdinal(tile.hole.hole_no)}</p>
      {scored && <h2 className="hole-walk-title" style={TAB_TITLE}>Par {tile.hole.par}{tile.hole.yards != null && <> · {tile.hole.yards.toLocaleString()} yards</>}</h2>}
      <div className={`hole-walk-photo ${active ? '' : 'hole-walk-photo-open'}`}>
        {active ? <>
          {photos.length >= 2 && <span className="glass-chip hole-walk-frame-count">{activeIndex + 1} / {photos.length}</span>}
          <div className="hole-walk-track" ref={trackRef} onScroll={onTrackScroll}>
            {photos.map(photo => {
              const processing = photo.media_type === 'video' && photo.duration_seconds == null;
              const slideAuthor = authors?.get(photo.user_id);
              const slideMonth = addedMonthLabel(photo.added_at);
              return <div key={photo.id} className="hole-walk-slide" onClick={() => { if (!processing) openViewer(photo.id); }}>
                {photo.media_type === 'video'
                  ? (processing
                    ? <HoleProcessingVideo media={photo} label={`Hole ${tile.hole.hole_no}`} />
                    : <>
                      <img src={holeMediaPoster(photo)} alt={`Hole ${tile.hole.hole_no}`} />
                      <span className="glass-chip hole-walk-play-disc" aria-hidden="true">{'\u25B6'}</span>
                    </>)
                  : <img src={photo.media_url} alt={`Hole ${tile.hole.hole_no}`} />}
                {(slideAuthor || slideMonth) && <div className="hole-walk-caption">{slideAuthor && <strong>{slideAuthor}</strong>}{slideMonth && ` · ${slideMonth}`}</div>}
              </div>;
            })}
          </div>
        </> : <span>No shot yet</span>}
      </div>
      {photos.length >= 2 && <div className="hole-walk-strip">
        {photos.map((photo, index) => <button type="button" key={photo.id}
          ref={index === activeIndex ? activeThumbRef : undefined}
          className={`hole-walk-thumbnail ${index === activeIndex ? 'hole-walk-thumbnail-active' : ''}`}
          aria-label={`Show shot ${index + 1} of ${photos.length}`}
          aria-current={index === activeIndex ? 'true' : undefined}
          onClick={() => { behaviorRef.current = 'smooth'; setPhotoId(photo.id); }}>
          <HoleMediaThumbnail url={photo.media_url} mediaType={photo.media_type} posterUrl={photo.poster_url} streamId={photo.stream_id} durationSeconds={photo.duration_seconds} alt={`Hole ${tile.hole.hole_no}`} />
          {photo.media_type === 'video' && <span className="hole-walk-thumb-play" aria-hidden="true">{'\u25B6'}</span>}
        </button>)}
      </div>}
      {active && memberId && active.user_id === memberId && active.status === 'approved' && onMove && onRemove && <div className="hole-walk-owner"><span className="hole-walk-owner-label">Yours</span><span className="hole-walk-owner-actions"><Button variant="ghost" className="hole-walk-owner-action" onClick={() => onMove(active)}>Move to another hole</Button><span className="hole-walk-owner-dot" aria-hidden="true">{'\u00B7'}</span><Button variant="ghost" className="hole-walk-owner-action" onClick={() => onRemove(active)}>Remove</Button></span></div>}
      {scored && <div className="hole-walk-stats">
        <div><b>{tile.hole.par}</b><span>Par</span></div>
        {tile.hole.yards != null && <div><b>{tile.hole.yards.toLocaleString()}</b><span>Yards</span></div>}
        {tile.hole.stroke_index != null && <div><b>{tile.hole.stroke_index}</b><span>Stroke index</span></div>}
        {field && <div><b style={{ color: field.tone }}>{field.text}</b><span>Field loses</span></div>}
      </div>}
      {/* A hole that already has media still takes more from an eligible member;
          same entry point as "Add the first", which stays for empty holes. */}
      {tile.photos.length >= 1 && <Button variant="ghost" className="hole-walk-add" onClick={() => onAddFirst(tile.hole.hole_no)}>Add a photo or video</Button>}
      {months.length > 0 && <div className="hole-walk-months">{months.map(item => <span key={item.month}>{capitalPhotoCount(item.count)} in {captureMonthLabel(item.month)}</span>)}</div>}
      {/* MEDIA_CTA_1: the sentence is absent below two photographs; at two or
          more it reads "shots of this hole", gaining "across {spelled} months"
          (never seasons) only when the photographs span two or more months. */}
      {tile.photos.length >= 2 && <p className="hole-walk-observation">{capitalPhotoCount(tile.photos.length)} shots of this hole{months.length > 0 && <> across {months.length === 2 ? 'two' : capitalPhotoCount(months.length).toLowerCase()} months</>}.</p>}
      {!active && <><p className="hole-walk-observation">{walk.hardestOpen === tile.hole.hole_no && <>The field loses more shots here than on any hole{courseName ? ` at ${courseName}` : ' on the course'}. </>}<strong>Nobody has shot it yet.</strong></p>
        <Button variant="ghost" className="hole-walk-add" onClick={() => onAddFirst(tile.hole.hole_no)}>Add the first</Button></>}
    </section>;
  const selectedIndex = walk.tiles.findIndex(item => item.hole.hole_no === selected);
  const rowEnd = selectedIndex < 0 ? -1 : Math.min(Math.ceil((selectedIndex + 1) / 3) * 3, walk.tiles.length) - 1;
  return <div className="hole-walk" style={{ color: A.INK, '--hole-walk-ink': A.INK, '--hole-walk-canvas': A.CANVAS, '--hole-walk-muted': A.MUTE, '--hole-walk-body': A.BODY, '--hole-walk-dim': A.DIM, '--hole-walk-faint': A.FAINT, '--hole-walk-soft': A.SOFT, '--hole-walk-rule': A.SOFT, '--hole-walk-track': A.TRACK, '--hole-walk-panel': A.PANEL } as CSSProperties}>
    <section className="hole-walk-section">
      <p className="hole-walk-kicker" style={VERDICT_KICKER}>Walk the course</p>
      <h2 className="hole-walk-title" style={TAB_TITLE}>{walk.headline}</h2>
      <p className="hole-walk-lede">{capitalPhotoCount(walk.photoCount)} of the {totalMedia.toLocaleString()} are tied to a hole. Tap one to walk it.</p>
      <div className="hole-walk-grid">
        {walk.tiles.map((item, index) => <Fragment key={item.hole.hole_no}><Button variant="ghost" aria-label={`Hole ${item.hole.hole_no}`} aria-pressed={selected === item.hole.hole_no}
          className={`hole-walk-tile ${item.photos.length ? '' : 'hole-walk-open'} ${selected === item.hole.hole_no ? 'hole-walk-selected' : ''}`}
          onClick={() => { setSelected(current => current === item.hole.hole_no ? null : item.hole.hole_no); setPhotoId(null); }}>
          {item.photos[0] && <img src={holeMediaPoster(item.photos[0])} alt="" loading="lazy" onError={event => { if (item.photos[0]?.media_type === 'video' && item.photos[0]?.duration_seconds == null) { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add('hole-walk-processing-empty'); } }} />}
          <span className="hole-walk-number">{item.hole.hole_no}</span>
          <span className="hole-walk-count">{item.photos.length || 'Open'}</span>
        </Button>{index === rowEnd && panel}</Fragment>)}
      </div>
      <div className="hole-walk-legend"><span><i className="hole-walk-swatch" />Shot</span><span><i className="hole-walk-swatch hole-walk-swatch-open" />Nobody has yet</span></div>
      {!tile && (walk.most != null || walk.openCount > 0) && <p className="hole-walk-observation">
        {walk.most != null && <>The <strong>{holeOrdinal(walk.most)}</strong> is the most photographed hole on the course. </>}
        {walk.openCount > 0 && <><strong>{capitalPhotoCount(walk.openCount)} holes here have never been shot</strong>{walk.hardestOpen != null ? <> — including the <strong>{holeOrdinal(walk.hardestOpen)}</strong>, which the field loses most shots to.</> : '.'}</>}
      </p>}
      {!tile && !scored && <p className="hole-walk-quiet">No rounds have been posted here yet, so par and yardage are still to come. They fill in with the first tracked round.</p>}
    </section>
    {viewerIndex != null && tile && viewerItems.length > 0 && <MediaPreviewViewer
      items={viewerItems}
      initialIndex={viewerIndex}
      onClose={() => setViewerIndex(null)}
      onIndexChange={index => { const photo = playable[index]; if (photo) setPhotoId(photo.id); }}
      edgeBounce
    />}
  </div>;
}
