/**
 * The selected ring's tile (BRIEF_WHATS_BEEN_PLAYED §3, signed-off
 * whats-been-played-top mock), revised by BRIEF_WHATS_BEEN_PLAYED_V4 §2-3:
 * full course name title, no county. Taps: Best lately and the faces line open
 * the course page at Lately (courseLatelyHref); a photo opens the canonical
 * viewer (tilePhotoViewer); Explore, the no-photos tile and the latest review
 * card open the course page top. The rail sheet renders this same tile and
 * passes onNavigate (closes the sheet first) and inSheet (viewer above sheet).
 */
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { shareCourseName } from '@/lib/courses/shareCourseName';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import { courseLatelyHref } from '@/lib/courses/courseLatelyLink';
import { HoleInlineVideo } from '@/components/course-media-tab/HoleInlineVideo';
import { openTilePhoto } from './tilePhotoViewer';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { fmtCount } from './format';
import { Bar } from '@/components/skeletons/shellVocabulary';
import { formatRatingValue } from '@/utils/formatters';
import { bestLately, dayLabel, interleaveTilePhotos, toParText } from './playedRings';
import type { PlayedCourse } from './usePlayedRounds';
import { useOpenLatestReview } from './useOpenLatestReview';
import type { usePlayedTile, TileCoursePhoto, TileHolePhoto } from './usePlayedTile';
import { FaceStack, MemberFace, PLAYED_SCRIM, UNDER_RED, GLASS } from './playedParts';
import type { CourseGroup } from './WhoPlayingSection';

export const TILE_ROW_H = 216;
export const BEST_CARD_W = 156;
export const PHOTO_TILE_W = 156;
export const EMPTY_TILE_W = 230;
export const TILE_RADIUS = 16;
export const TILE_ROW_GAP = 8;
export const TILE_CARD_PAD = 12;
export const TILE_TOP = 18;
export const TILE_NAME_LINE = 22;
export const TILE_ROW_TOP = 12;
export const FACES_TOP = 12;
export const FACE_SIZE = 22;
export const BUTTON_TOP = 12;
export const BUTTON_H = 44;
const BEST_BG = '#16161B';
const BUTTON_BG = '#1B1B20';

type FacesMap = ReadonlyMap<string, { displayName: string | null; username: string | null; photoUrl: string | null }>;
const NO_FACES: FacesMap = new Map();

/** V3 §2 caption credit: 14px face + 5px + full name (filled from the shared faces). */
function Credit({ id, name, photo, day, faces }: { id: string | null; name: string | null; photo: string | null; day?: string | null; faces: FacesMap }) {
  const f = id ? faces.get(id) : undefined;
  const full = name || f?.displayName || f?.username || null;
  if (!full) return null;
  return (
    <span data-photo-credit="" style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, fontSize: 10, lineHeight: '14px', color: 'rgba(255,255,255,.85)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
      <MemberFace face={{ userId: id ?? full, photo: photo || f?.photoUrl || null, name: full }} size={14} />
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{day ? `${full} \u00B7 ${day}` : full}</span>
    </span>
  );
}

export function PlayedTile({ group, course, tile, faces = NO_FACES, onNavigate, inSheet = false, topGap = TILE_TOP, beforeReview }: {
  group: CourseGroup; course: PlayedCourse; tile: ReturnType<typeof usePlayedTile>; faces?: FacesMap;
  /** Sheet host: closes itself, then navigates. Defaults to a plain navigate. */
  onNavigate?: (to: string) => void; inSheet?: boolean; topGap?: number;
  /** Sheet host: closes itself before the review sheet opens (the review sheet sits below BottomSheet's layer). */
  beforeReview?: () => void;
}) {
  const openLatestReview = useOpenLatestReview();
  const navigate = useNavigate();
  const go = (to: string) => (onNavigate ? onNavigate(to) : navigate(to));
  const open = () => go(`/courses/${course.id}`);
  const openLately = () => go(courseLatelyHref(course.id));
  const { short } = shareCourseName(course.name);
  const title = shortCoursePart(course.name);
  const review = group.rows.length === 0 ? group.reviews[0] ?? null : null;
  const reviewer = review ? group.faces.find((f) => f.userId === review.user_id) ?? null : null;
  const openReview = () => {
    if (!review) return;
    beforeReview?.();
    openLatestReview({
      reviewId: review.id, courseId: course.id, courseName: course.name, courseImage: course.imageUrl,
      rating: Number(review.rating ?? 0), quote: review.review ?? '', at: review.created_at,
      userId: review.user_id, reviewerName: reviewer?.name ?? '', reviewerUsername: null, reviewerAvatar: reviewer?.photo ?? null,
      mediaUrl: null, mediaType: null, posterUrl: null,
      courseCountry: course.country, courseRegion: course.region, courseSubCountry: course.subCountry,
      breakdown: { design: null, conditions: null, clubhouse: null, facilities: null },
    });
  };
  const best = bestLately(group.rows);
  const photos = interleaveTilePhotos<TileHolePhoto, TileCoursePhoto>(tile.holes, tile.photos, tile.hardestHole);
  const members = group.faces.length;
  const capBase: React.CSSProperties = { position: 'absolute', left: 10, right: 10, bottom: 9 };
  const ell: React.CSSProperties = { display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

  return (
    <div data-played-tile={course.id} style={{ margin: `${topGap}px 16px 0` }}>
      <div data-tile-head="" style={{ display: 'block', width: '100%' }}>
        <b data-tile-title="" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', overflowWrap: 'anywhere', fontSize: 18, lineHeight: `${TILE_NAME_LINE}px`, fontWeight: 800, color: A.INK }}>{title}</b>
      </div>
      <div className="scrollbar-hide" data-tile-row="" style={{ display: 'flex', gap: TILE_ROW_GAP, overflowX: 'auto', scrollbarWidth: 'none', margin: `${TILE_ROW_TOP}px -16px 0`, padding: '0 16px' }}>
        {group.rows.length > 0 ? (
        <button type="button" data-best-lately="" onClick={openLately}
          style={{ flex: 'none', width: BEST_CARD_W, height: TILE_ROW_H, boxSizing: 'border-box', borderRadius: TILE_RADIUS, background: BEST_BG, padding: TILE_CARD_PAD, border: 0, display: 'flex', flexDirection: 'column', gap: 9, textAlign: 'left', cursor: 'pointer', color: A.INK }}>
          <span data-best-kicker="" style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em', color: A.INK, lineHeight: '10px' }}>BEST LATELY</span>
          {best.map((r) => {
            const par = toParText(r.gross_score as number, r.course_par);
            const under = par != null && par.startsWith('\u2212');
            return (
              <span key={r.whs_score_id} data-best-entry="" style={{ display: 'block', minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <MemberFace face={{ userId: r.user_id, photo: r.profile_photo_url, name: r.display_name }} size={20} />
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <b style={{ fontSize: 18, lineHeight: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.gross_score}</b>
                    {par != null ? <span data-to-par="" style={{ fontSize: 10.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: under ? UNDER_RED : A.DIM }}>{par}</span> : null}
                  </span>
                </span>
                <span style={{ ...ell, marginTop: 5, fontSize: 11.5, lineHeight: '14px', fontWeight: 600 }}>
                  <InlineProMemberName userId={r.user_id}>{r.display_name ?? ''}</InlineProMemberName>
                </span>
                <span style={{ ...ell, marginTop: 1, fontSize: 9.5, lineHeight: '12px', color: A.DIM }}>
                  {dayLabel(r.play_date)}
                </span>
              </span>
            );
          })}
          <span style={{ marginTop: 'auto', fontSize: 10.5, lineHeight: '13px', color: A.MUTE }}>
            {group.rows.length === 1 ? '1 round lately \u203A' : `${fmtCount(group.rows.length)} rounds lately \u203A`}
          </span>
        </button>
        ) : null}
        {review ? (
          <button type="button" data-latest-review="" onClick={openReview}
            style={{ flex: 'none', width: BEST_CARD_W, height: TILE_ROW_H, boxSizing: 'border-box', borderRadius: TILE_RADIUS, background: BEST_BG, padding: TILE_CARD_PAD, border: 0, display: 'flex', flexDirection: 'column', gap: 9, textAlign: 'left', cursor: 'pointer', color: A.INK, overflow: 'hidden' }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em', color: A.INK, lineHeight: '10px' }}>LATEST REVIEW</span>
            <span style={{ display: 'block', minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <MemberFace face={reviewer ?? { userId: review.user_id ?? '', photo: null, name: null }} size={20} />
                {review.rating != null ? <b data-review-rating="" style={{ fontSize: 18, lineHeight: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatRatingValue(Number(review.rating))}</b> : null}
              </span>
              <span style={{ ...ell, marginTop: 5, fontSize: 11.5, lineHeight: '14px', fontWeight: 600 }}>
                {review.user_id ? <InlineProMemberName userId={review.user_id}>{reviewer?.name ?? ''}</InlineProMemberName> : null}
              </span>
              <span style={{ ...ell, marginTop: 1, fontSize: 9.5, lineHeight: '12px', color: A.DIM }}>{dayLabel(review.created_at)}</span>
            </span>
            <span data-review-text="" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden', fontSize: 10.5, lineHeight: 1.35, color: 'rgba(248,250,252,.78)' }}>{review.review}</span>
            <span style={{ marginTop: 'auto', fontSize: 10.5, lineHeight: '13px', color: A.MUTE }}>
              {group.reviews.length === 1 ? '1 review lately \u203A' : `${fmtCount(group.reviews.length)} reviews lately \u203A`}
            </span>
          </button>
        ) : null}
        {!tile.ready ? (
          [0, 1].map((i) => <span key={i} data-tile-pending="" style={{ flex: 'none', display: 'block', width: PHOTO_TILE_W, height: TILE_ROW_H }}><Bar style={{ width: '100%', height: '100%', borderRadius: TILE_RADIUS }} /></span>)
        ) : photos.length === 0 ? (
          <button type="button" data-tile-empty="" onClick={open} style={{ all: 'unset', flex: 'none', width: EMPTY_TILE_W, height: TILE_ROW_H, borderRadius: TILE_RADIUS, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
            <CourseImageFallback courseId={course.id} courseName={course.name} imageUrl={course.imageUrl} style={{ position: 'absolute', inset: 0 }}>
              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,.8) 100%)' }} />
              <span style={{ position: 'absolute', left: 12, right: 12, bottom: 12, color: '#FFFFFF' }}>
                <b style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>No photos yet</b>
                <span style={{ display: 'block', marginTop: 3, fontSize: 11.5, lineHeight: 1.4, color: 'rgba(255,255,255,.78)', whiteSpace: 'normal' }}>{`Played it lately? Add the first photo of ${short}.`}</span>
                <span style={{ display: 'inline-flex', marginTop: 9, padding: '6px 10px', borderRadius: 10, background: 'rgba(247,147,30,.16)', color: A.AMBER, fontSize: 11.5, fontWeight: 700 }}>Add a photo</span>
              </span>
            </CourseImageFallback>
          </button>
        ) : photos.map((p, pi) => (
          <button key={p.key} type="button" data-tile-photo={p.kind} onClick={() => { openTilePhoto(photos, pi, course, tile.coursePosts ?? [], inSheet); }}
            style={{ flex: 'none', width: PHOTO_TILE_W, height: TILE_ROW_H, borderRadius: TILE_RADIUS, overflow: 'hidden', position: 'relative', padding: 0, border: 0, cursor: 'pointer', textAlign: 'left', color: '#FFFFFF', backgroundColor: A.CANVAS, backgroundImage: `url("${p.imageUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {p.video ? <span data-tile-video="" style={{ position: 'absolute', inset: 0 }}><HoleInlineVideo media={p.video} alt="" fit="cover" autoplayGroup="courses-member-shots" active /></span> : null}
            <span style={{ position: 'absolute', inset: 0, background: PLAYED_SCRIM }} />
            {p.kind === 'hole' ? (
              <>
                <span style={{ position: 'absolute', top: 8, left: 10, fontSize: 28, fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1 }}>{p.holeNo}</span>
                {tile.hardestHole === p.holeNo ? <span data-hardest="" style={{ position: 'absolute', top: 10, right: 8, padding: '3px 6px', borderRadius: 6, background: 'rgba(10,10,12,.6)', color: A.AMBER, fontSize: 8, fontWeight: 800, letterSpacing: '.1em', lineHeight: '10px' }}>HARDEST</span> : null}
                <span style={capBase}>
                  <b style={{ ...ell, fontSize: 11.5, fontWeight: 700 }}>{[p.par != null ? `Par ${p.par}` : null, p.yards != null ? `${p.yards} yds` : null].filter(Boolean).join(' \u00B7 ')}</b>
                  <Credit id={p.memberId} name={p.memberName} photo={p.memberPhoto} faces={faces} />
                </span>
              </>
            ) : (
              <>
                <span style={{ ...GLASS, boxShadow: undefined, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', position: 'absolute', top: 10, left: 10, padding: '3px 7px', borderRadius: 6, fontSize: 8, fontWeight: 800, letterSpacing: '.12em', lineHeight: '10px', color: '#FFFFFF' }}>COURSE</span>
                <span style={capBase}>
                  <b style={{ ...ell, fontSize: 11.5, fontWeight: 700 }}>{p.caption || short}</b>
                  <Credit id={p.memberId} name={p.memberName} photo={p.memberPhoto} day={dayLabel(p.createdAt)} faces={faces} />
                </span>
              </>
            )}
          </button>
        ))}
      </div>
      <button type="button" data-tile-faces="" onClick={openLately} style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 8, marginTop: FACES_TOP, fontSize: 12, color: A.MUTE, cursor: 'pointer', maxWidth: '100%' }}>
        <FaceStack faces={group.faces.slice(0, 4)} size={FACE_SIZE} overlap={6} ring={A.CANVAS} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          <b style={{ color: A.INK, fontWeight: 600 }}>{members === 1 ? '1 member' : `${fmtCount(members)} members`}</b> {group.rows.length > 0 ? 'played' : 'shared'} it lately
        </span>
      </button>
      <button type="button" data-tile-explore="" onClick={open}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: BUTTON_H, marginTop: BUTTON_TOP, borderRadius: 14, background: BUTTON_BG, border: 0, fontSize: 13.5, fontWeight: 700, color: A.INK, cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: '0 12px' }}>
        {`Explore ${short} \u203A`}
      </button>
    </div>
  );
}
