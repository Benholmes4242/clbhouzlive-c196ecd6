/**
 * LATEST REVIEWS rails (LATEST_REVIEWS_MAGAZINE, latest-reviews-signed-off
 * mock, signed off 18 Nov): the section is two rails. SEEN ON THE COURSE
 * holds reviews with at least one photo or video in a magazine card — the
 * Clubhouse upright split on top (one big, two small, "+N" on the last), a
 * glass score disc on the photos, and the body lit by a blurred, darkened
 * copy of the cover. WRITTEN REVIEWS holds reviews with no media and
 * non-empty text: stamp/place share the top line with the score, the course
 * name always has its own line(s). Every review appears once; an empty rail
 * hides with its label. The whole card opens the review sheet. Widths per
 * Ben's ruling (the mock wins over the brief): media min(300px, 100vw-64px),
 * written min(290px, 100vw-64px), so the next card always peeks. Only
 * LatestReviewsSection renders this rail (the shell reads its geometry).
 */

import React from 'react';
import { MentionText } from '@/components/mentions/MentionText';
import { useTranslation } from 'react-i18next';

import { INK, INK_FAINT, INK_MUTE } from '@/features/courses/_shared/tokens';
import { courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import type { LatestReview, ReviewMediaItem } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { HoleInlineVideo } from '@/components/course-media-tab/HoleInlineVideo';
import { imageSrc } from '@/utils/imageSrc';
import { shortAge } from '@/features/explore-magazine/watch/watchMiddle';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { latestReviewFeedPost } from './browse/latestReviewFeedPost';
import { Button } from '@/components/ui/button';

/* Rail + card geometry, read by the cards AND their shell. */
export const RAIL_GAP = 10;
export const RAIL_X = 16;
export const MEDIA_CARD_W = 'min(300px, calc(100vw - 64px))';
export const WRITTEN_CARD_W = 'min(290px, calc(100vw - 64px))';
export const REVIEW_BG = '#16161B';
export const REVIEW_RADIUS = 20;
export const MOSAIC_H = 236;
export const REVIEW_AVATAR = 24;
export const RAIL_LABEL_STYLE: React.CSSProperties = {
  margin: '18px 16px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '.19em',
  textTransform: 'uppercase', color: INK_FAINT,
};

const QUOTE_INK = 'rgba(248,250,252,.82)';
const RULE_INK = 'rgba(248,250,252,.24)';

const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
const ELL: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const CLAMP = (lines: number): React.CSSProperties => ({
  display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden',
});

/** "{v} video(s) · {p} photo(s)", or one part alone; '' without media. */
export function reviewMediaLine(videos: number, photos: number, sep = ' · '): string {
  const v = videos > 0 ? `${videos} ${videos === 1 ? 'video' : 'videos'}` : '';
  const p = photos > 0 ? `${photos} ${photos === 1 ? 'photo' : 'photos'}` : '';
  return v && p ? `${v}${sep}${p}` : v || p;
}

/** "region · nation" (sub_country, falling back to country), de-duplicated. */
export function reviewPlaceLine(r: LatestReview): string {
  const parts = [r.courseRegion, r.courseSubCountry ?? r.courseCountry]
    .map((s) => (s ?? '').trim())
    .filter(Boolean);
  return Array.from(new Set(parts)).join(' · ');
}

function formatDuration(seconds: number | null): string {
  const s = Math.max(0, Math.round(seconds ?? 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** TOP 100 stamp + location, shared by both cards. Nothing when both are absent. */
function PlaceLine({ r, style }: { r: LatestReview; style?: React.CSSProperties }) {
  const loc = reviewPlaceLine(r);
  if (!r.top100 && !loc) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, height: 22, ...style }}>
      {r.top100 ? (
        <span data-review-stamp="" style={{
          flex: 'none', display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 9px',
          borderRadius: 999, border: '1px solid rgba(248,250,252,0.42)', fontSize: 9, fontWeight: 700,
          letterSpacing: '.16em', textTransform: 'uppercase', color: INK, whiteSpace: 'nowrap',
        }}>TOP 100</span>
      ) : null}
      {loc ? <span data-review-loc="" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: INK_MUTE, minWidth: 0, ...ELL }}>{loc}</span> : null}
    </div>
  );
}

/** The four category scores as plain numbers; null scores drop out, all null drops the row. */
function ScoreNumbers({ r, style }: { r: LatestReview; style?: React.CSSProperties }) {
  const cells: Array<{ label: string; value: number }> = [
    { label: 'Design', value: r.breakdown.design },
    { label: 'Condition', value: r.breakdown.conditions },
    { label: 'Facilities', value: r.breakdown.facilities },
    { label: 'Clubhouse', value: r.breakdown.clubhouse },
  ].filter((c): c is { label: string; value: number } => c.value != null);
  if (cells.length === 0) return null;
  return (
    <div data-review-scores="" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4, ...style }}>
      {cells.map((c) => (
        <div key={c.label}>
          <b style={{ ...FIGS, display: 'block', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: courseSubScoreTone(c.value) }}>{c.value.toFixed(1)}</b>
          <i style={{ display: 'block', fontStyle: 'normal', fontSize: 7.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: INK_FAINT, marginTop: 5, ...ELL }}>{c.label}</i>
        </div>
      ))}
    </div>
  );
}

/** Golfer face + name, then right-aligned meta ("2 videos · 4 photos · 3d", or the age alone). */
function ReviewFooter({ r, name, withMedia, style }: { r: LatestReview; name: string; withMedia: boolean; style?: React.CSSProperties }) {
  const media = withMedia ? reviewMediaLine(r.videoCount ?? 0, r.photoCount ?? 0) : '';
  const age = shortAge(r.at) ?? '';
  const meta = [media, age].filter(Boolean).join(' · ');
  return (
    <div data-review-foot="" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, ...style }}>
      <SquircleAvatar src={r.reviewerAvatar} userId={r.userId} alt={name} size={REVIEW_AVATAR} surface="canvas" hairlineRing />
      <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, ...ELL }}>{name}</span>
      {meta ? <span data-review-media-line="" style={{ marginLeft: 'auto', flex: 'none', fontSize: 11, color: INK_FAINT }}>{meta}</span> : null}
    </div>
  );
}

/** The glass score disc over the mosaic. */
function ScoreDisc({ rating }: { rating: number }) {
  return (
    <div data-review-disc="" style={{
      position: 'absolute', top: 12, right: 12, zIndex: 3, width: 60, height: 60, borderRadius: '50%',
      background: 'rgba(14,14,16,0.56)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <b style={{ ...FIGS, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: courseSubScoreTone(rating) }}>{rating.toFixed(1)}</b>
      <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.06em', color: INK_MUTE, marginTop: 2 }}>/10</span>
    </div>
  );
}

function VideoBadge({ seconds }: { seconds: number | null }) {
  return (
    <span data-review-vid="" style={{
      position: 'absolute', left: 8, bottom: 8, zIndex: 2, height: 22, padding: '0 8px 0 7px', borderRadius: 999,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: INK,
    }}>
      <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden><path d="M0 0l9 5-9 5z" fill="#fff" /></svg>
      {formatDuration(seconds)}
    </span>
  );
}

/** One mosaic tile. The big tile autoplays a video muted in the shared
 *  "courses-member-shots" group; small video tiles show the poster only. */
function MediaTile({ item, big, more, style, onOpen }: { item: ReviewMediaItem; big: boolean; more: number; style?: React.CSSProperties; onOpen: (item: ReviewMediaItem, el: HTMLElement) => void }) {
  return (
    <Button variant="ghost" className="active:scale-100" aria-label="Open review media" data-review-media-id={item.id}
      onClick={e => { e.stopPropagation(); onOpen(item, e.currentTarget); }}
      onKeyDown={e => e.stopPropagation()}
      style={{ position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0, padding: 0, width: '100%', height: '100%', borderRadius: 0, background: REVIEW_BG, ...style }}>
      {item.type === 'video' ? (
        big ? (
          <span style={{ position: 'absolute', inset: 0 }}>
            <HoleInlineVideo
              media={{ media_url: item.url, stream_id: item.streamId, poster_url: item.posterUrl, duration_seconds: item.durationSeconds }}
              alt="" fit="cover" autoplayGroup="courses-member-shots" active
            />
          </span>
        ) : (
          <img src={imageSrc(item.posterUrl ?? item.url, 220)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )
      ) : (
        <img src={imageSrc(item.url, big ? 800 : 440)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {item.type === 'video' ? <VideoBadge seconds={item.durationSeconds} /> : null}
      {more > 0 ? (
        <span data-review-more="" style={{
          position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: INK,
        }}>+{more}</span>
      ) : null}
    </Button>
  );
}

function cardProps(r: LatestReview, onReviewPress: (r: LatestReview) => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'data-review-card': '',
    onClick: () => onReviewPress(r),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onReviewPress(r);
      }
    },
  };
}

/** SEEN ON THE COURSE — the magazine card for a review with media. */
function MediaReviewCard({ r, name, onReviewPress, onMediaOpen }: { r: LatestReview; name: string; onReviewPress: (r: LatestReview) => void; onMediaOpen: (item: ReviewMediaItem, el: HTMLElement) => void }) {
  const media = (r.media ?? []).slice(0, 3);
  const more = (r.media ?? []).length - media.length;
  const count = media.length;
  const gridColumns = count === 1 ? '1fr' : '2fr 1fr';
  const gridRows = count >= 3 ? '1fr 1fr' : '1fr';
  const cover = media[0];
  const ambient = cover ? imageSrc(cover.type === 'video' ? cover.posterUrl ?? cover.url : cover.url, 480) : undefined;
  return (
    <div
      {...cardProps(r, onReviewPress)}
      data-review-media-card=""
      style={{
        position: 'relative', width: MEDIA_CARD_W, flexShrink: 0, boxSizing: 'border-box', textAlign: 'left',
        background: REVIEW_BG, borderRadius: REVIEW_RADIUS, overflow: 'hidden', cursor: 'pointer', color: INK,
      }}
    >
      {ambient ? (
        <div aria-hidden style={{
          position: 'absolute', left: -30, right: -30, bottom: -30, height: 360,
          backgroundImage: `url(${ambient})`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(36px) saturate(140%)', opacity: 0.55,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,12,0.55)' }} />
        </div>
      ) : null}
      <div data-review-mosaic="" style={{ position: 'relative', height: MOSAIC_H, display: 'grid', gridTemplateColumns: gridColumns, gridTemplateRows: gridRows, gap: 2 }}>
        {media.map((m, i) => (
          <MediaTile key={m.id} item={m} big={i === 0} more={i === media.length - 1 ? more : 0} onOpen={onMediaOpen}
            style={i === 0 && count >= 3 ? { gridRow: '1 / 3' } : undefined} />
        ))}
      </div>
      <ScoreDisc rating={r.rating} />
      <div style={{ position: 'relative', padding: '14px 16px 16px' }}>
        <PlaceLine r={r} />
        <div data-review-course="" style={{ marginTop: 10, fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, color: INK, ...CLAMP(2) }}>
          {r.courseName}
        </div>
        {r.quote ? (
          <p data-review-quote="" style={{ marginTop: 7, marginBottom: 0, fontSize: 13, lineHeight: 1.5, color: QUOTE_INK, ...CLAMP(3) }}>
            <MentionText text={r.quote} disableNavigation />
          </p>
        ) : null}
        <ScoreNumbers r={r} style={{ marginTop: 14 }} />
        <ReviewFooter r={r} name={name} withMedia style={{ marginTop: 14 }} />
      </div>
    </div>
  );
}

/** WRITTEN REVIEWS — the text card for a review with no media. */
function WrittenReviewCard({ r, name, onReviewPress }: { r: LatestReview; name: string; onReviewPress: (r: LatestReview) => void }) {
  return (
    <div
      {...cardProps(r, onReviewPress)}
      data-review-written-card=""
      style={{
        position: 'relative', width: WRITTEN_CARD_W, flexShrink: 0, boxSizing: 'border-box', textAlign: 'left',
        background: REVIEW_BG, borderRadius: REVIEW_RADIUS, overflow: 'hidden', padding: 16,
        display: 'flex', flexDirection: 'column', cursor: 'pointer', color: INK,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <PlaceLine r={r} style={{ flex: 1 }} />
        <span data-review-score="" style={{ display: 'flex', alignItems: 'baseline', gap: 2, flex: 'none' }}>
          <b style={{ ...FIGS, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: courseSubScoreTone(r.rating) }}>{r.rating.toFixed(1)}</b>
          <span style={{ fontSize: 11, fontWeight: 700, color: INK_FAINT }}>/10</span>
        </span>
      </div>
      <div data-review-course="" style={{ marginTop: 12, fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, color: INK, ...CLAMP(2) }}>
        {r.courseName}
      </div>
      <div style={{ position: 'relative', marginTop: 10, paddingLeft: 16 }}>
        <span aria-hidden style={{ position: 'absolute', left: 0, top: 3, bottom: 3, width: 3, borderRadius: 2, background: RULE_INK }} />
        <p data-review-quote="" style={{ margin: 0, fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: INK, ...CLAMP(5) }}>
          <MentionText text={r.quote} disableNavigation />
        </p>
      </div>
      <ScoreNumbers r={r} style={{ marginTop: 16 }} />
      <ReviewFooter r={r} name={name} withMedia={false} style={{ marginTop: 14 }} />
    </div>
  );
}

function ReviewRail({ label, labelStyle, children }: { label?: string; labelStyle?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div>
      {label ? <div data-review-rail-label="" style={{ ...RAIL_LABEL_STYLE, ...labelStyle }}>{label}</div> : null}
      <div className="scrollbar-hide" style={{ display: 'flex', gap: RAIL_GAP, overflowX: 'auto', padding: `0 ${RAIL_X}px`, scrollbarWidth: 'none', alignItems: 'stretch' }}>
        {children}
      </div>
    </div>
  );
}

interface Props {
  reviews: LatestReview[];
  onReviewPress: (r: LatestReview) => void;
}

export const ReviewRailSlot: React.FC<Props> = ({ reviews, onReviewPress }) => {
  const { t } = useTranslation('courses');
  // A review never appears in both rails; each rail caps at 20, newest first.
  const mediaRail = reviews.filter((r) => (r.media ?? []).length >= 1).slice(0, 20);
  const writtenRail = reviews.filter((r) => (r.media ?? []).length === 0 && r.quote).slice(0, 20);
  if (mediaRail.length === 0 && writtenRail.length === 0) return null;

  const nameOf = (r: LatestReview) => r.reviewerName || t('discover.reviews.member', 'A member');
  const openMedia = (r: LatestReview, item: ReviewMediaItem, el: HTMLElement) => {
    analyticsEvents.track('review_photo_opened', { course_id: r.courseId, review_id: r.reviewId, source: 'courses-latest-reviews' });
    openWithOrigin({
      posts: mediaRail.map(latestReviewFeedPost), index: mediaRail.indexOf(r), mediaId: item.id,
      originEl: el, posterUrl: item.posterUrl ?? (item.type === 'image' ? item.url : null),
      openedFrom: 'courses-latest-reviews', options: { readOnly: true, hasNextPage: false },
    });
  };

  return (
    <section>
      {mediaRail.length > 0 ? (
        <ReviewRail>
          {mediaRail.map((r) => <MediaReviewCard key={r.reviewId} r={r} name={nameOf(r)} onReviewPress={onReviewPress} onMediaOpen={(item, el) => openMedia(r, item, el)} />)}
        </ReviewRail>
      ) : null}
      {writtenRail.length > 0 ? (
        <ReviewRail label="WRITTEN REVIEWS" labelStyle={{ marginTop: mediaRail.length > 0 ? 24 : 0 }}>
          {writtenRail.map((r) => <WrittenReviewCard key={r.reviewId} r={r} name={nameOf(r)} onReviewPress={onReviewPress} />)}
        </ReviewRail>
      ) : null}
    </section>
  );
};

export default ReviewRailSlot;
