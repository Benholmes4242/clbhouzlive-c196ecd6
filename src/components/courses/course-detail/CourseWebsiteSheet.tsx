/**
 * BEFORE_YOU_GO — the course website sheet, replacing ExternalLinkSheet on
 * the course About tab (ExternalLinkSheet.tsx itself is untouched on disk).
 *
 * Every piece drops out on its own when its data is missing: no photo band
 * without a thumbnail, no figures without measured rounds, no band sentence
 * without an index and a big-enough sample, no "you" panel when it would only
 * say "You haven't played it yet", no tiles without their data.
 *
 * DATA: every read reuses a hook the course page already calls (same query
 * keys, so nothing is fetched twice); the only new read is
 * useCourseBandAverage, which fires only for a signed-in member with an index.
 *
 * NO NEGATIVE LETTER-SPACING anywhere in this sheet.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight, Bookmark, Calendar, Check, ChevronRight, Link as LinkIcon,
  MapPin, Phone, Share, X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/lib/toast';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { openMapsUrl } from '@/utils/median/openMapsUrl';
import { isIOS } from '@/utils/env';
import { ensureProtocol } from '@/lib/business/socialLinks';
import { withShareSource } from '@/lib/business/shareBusinessProfile';
import { trackBusinessAction } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useCourseHoleAnalysis, type CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { useCourseReviewSample } from '@/hooks/useCourseReviewSample';
import { reviewsCommunitySample } from '@/lib/reviews/communitySample';
import { hasCommunityAverage } from '@/lib/reviews/sampleRules';
import { useCourseClaimStatus } from '@/hooks/useCourseClaim';
import { useBoardCoursePlayers } from '@/components/explore-tab-new/courseled/hooks/useBoardCoursePlayers';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { CIRCLE_PLAYERS_LIMIT, circleNamesLine } from './you/circleNamesLine';
import { useViewerHandicapIndex } from '@/components/explore-tab-new/courseled/hooks/useGolfThisWeek';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useCourseBandAverage } from '@/hooks/useCourseBandAverage';
import { pickHardestHole } from '@/components/business/ClubHowItPlays';
import { toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { ordinal } from '@/lib/text/numbers';

const BG = '#16161A';
const INK = '#F8FAFC';
const ON_INK = '#0A0A0C';
const MUTE = 'rgba(248,250,252,0.62)';
const DIM = 'rgba(248,250,252,0.42)';
const HAIR = 'rgba(255,255,255,0.08)';
const AMBER = '#F7931E';

const LABEL: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: DIM,
};

/** Same logic as ExternalLinkSheet's extractDomain (that file is untouched). */
const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  }
};

export interface CourseWebsiteSheetCourse {
  id: string;
  name: string;
  website_url?: string | null;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  club_id?: string | null;
}

interface CourseWebsiteSheetProps {
  open: boolean;
  onClose: () => void;
  course: CourseWebsiteSheetCourse;
  coords: { lat: number; lng: number } | null;
  onTabChange?: (tab: string) => void;
}

const CourseWebsiteSheet: React.FC<CourseWebsiteSheetProps> = ({
  open,
  onClose,
  course,
  coords,
  onTabChange,
}) => {
  const { t } = useTranslation('common');
  const { user } = useSupabaseSession();
  const [copied, setCopied] = useState(false);

  const { data: stats } = useCourseStatsDetail(course.id, true);
  const { data: analysis } = useCourseHoleAnalysis(course.id);
  const { data: reviewRows } = useCourseReviewSample(course.id, user?.id);
  const { data: claimStatus } = useCourseClaimStatus(course.id);
  const circlePlayers = useBoardCoursePlayers(
    user?.id,
    course.id,
    { ...DEFAULT_FILTERS, scope: 'circle', window: 'all' },
    { limit: CIRCLE_PLAYERS_LIMIT },
  );
  const { index } = useViewerHandicapIndex(user?.id);
  const personalStatus = useCoursePersonalStatus(course.id);
  const { data: bandAverage } = useCourseBandAverage(course.id, index);

  const business = claimStatus?.state === 'claimed' ? claimStatus.business : null;
  const rounds = stats?.rounds_tracked ?? null;
  const yourRounds = stats?.your_rounds ?? 0;

  const holes: CourseHole[] | null =
    analysis?.available && (analysis.holes?.length ?? 0) >= 9
      ? [...analysis.holes].sort((a, b) => a.hole_no - b.hole_no)
      : null;

  const sample = useMemo(
    () => (reviewRows ? reviewsCommunitySample(reviewRows, user?.id) : null),
    [reviewRows, user?.id],
  );
  const showRating = sample != null && hasCommunityAverage(sample.ratingCount) && sample.score != null;

  const circle = useMemo(() => circleNamesLine(circlePlayers.data), [circlePlayers.data]);

  useEffect(() => {
    if (open) analyticsEvents.track('course_website_sheet_open', { course_id: course.id });
  }, [open, course.id]);

  const track = (event: string) => analyticsEvents.track(event, { course_id: course.id });

  const handleVisitWebsite = () => {
    if (!course.website_url) return;
    track('course_website_open');
    if (business) trackBusinessAction(business.id, 'website', user?.id);
    openExternalUrl(course.website_url);
    onClose();
  };

  const handleTeeTimes = () => {
    if (!business?.booking_url) return;
    track('course_tee_times');
    trackBusinessAction(business.id, 'website', user?.id);
    openExternalUrl(ensureProtocol(business.booking_url));
  };

  const handleCall = () => {
    if (!business?.phone) return;
    track('course_call');
    trackBusinessAction(business.id, 'call', user?.id);
    window.location.href = `tel:${business.phone}`;
  };

  const handleDirections = () => {
    if (!coords) return;
    track('course_directions');
    if (business) trackBusinessAction(business.id, 'directions', user?.id);
    if (isIOS) {
      openMapsUrl(
        `https://maps.apple.com/?q=${encodeURIComponent(course.name)}&ll=${coords.lat},${coords.lng}`,
      );
    } else {
      openMapsUrl(
        `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
      );
    }
  };

  const handleCopyLink = async () => {
    if (!course.website_url) return;
    track('course_copy_link');
    try {
      await navigator.clipboard.writeText(course.website_url);
      setCopied(true);
      toast.success(t('courseDetail.websiteSheet.copiedToast', { defaultValue: 'Copied to clipboard' }));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('courseDetail.websiteSheet.copyFailed', { defaultValue: 'Failed to copy link' }));
    }
  };

  const handleShare = async () => {
    track('course_share');
    const url = withShareSource(`${window.location.origin}/courses/${course.id}`);
    if (navigator.share) {
      try {
        await navigator.share({ title: course.name, url });
      } catch {
        /* user cancelled the native sheet */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t('courseDetail.websiteSheet.copiedToast', { defaultValue: 'Copied to clipboard' }));
      } catch {
        toast.error(t('courseDetail.websiteSheet.copyFailed', { defaultValue: 'Failed to copy link' }));
      }
    }
  };

  const handleSaveToList = () => {
    track('course_save_to_list');
    personalStatus.setWantToPlay(true);
  };

  /* ── Quick action tiles, in order, each only when its data exists ── */
  const tiles: { key: string; label: string; icon: React.ReactNode; onTap: () => void }[] = [];
  if (business?.booking_url) {
    tiles.push({
      key: 'tee-times',
      label: t('courseDetail.websiteSheet.teeTimes', { defaultValue: 'Tee times' }),
      icon: <Calendar style={{ width: 19, height: 19 }} strokeWidth={1.9} />,
      onTap: handleTeeTimes,
    });
  }
  if (business?.phone) {
    tiles.push({
      key: 'call',
      label: t('courseDetail.websiteSheet.call', { defaultValue: 'Call' }),
      icon: <Phone style={{ width: 19, height: 19 }} strokeWidth={1.9} />,
      onTap: handleCall,
    });
  }
  if (coords) {
    tiles.push({
      key: 'directions',
      label: t('courseDetail.websiteSheet.directions', { defaultValue: 'Directions' }),
      icon: <MapPin style={{ width: 19, height: 19 }} strokeWidth={1.9} />,
      onTap: handleDirections,
    });
  }
  tiles.push({
    key: 'copy',
    label: copied
      ? t('courseDetail.websiteSheet.copied', { defaultValue: 'Copied' })
      : t('courseDetail.websiteSheet.copyLink', { defaultValue: 'Copy link' }),
    icon: copied ? (
      <Check style={{ width: 19, height: 19 }} strokeWidth={1.9} />
    ) : (
      <LinkIcon style={{ width: 19, height: 19 }} strokeWidth={1.9} />
    ),
    onTap: handleCopyLink,
  });
  const hasTeeTimes = Boolean(business?.booking_url);
  if (!hasTeeTimes) {
    tiles.push({
      key: 'share',
      label: t('courseDetail.websiteSheet.share', { defaultValue: 'Share' }),
      icon: <Share style={{ width: 19, height: 19 }} strokeWidth={1.9} />,
      onTap: handleShare,
    });
  }
  const shownTiles = tiles.slice(0, 4);
  const shareTileShown = shownTiles.some((tile) => tile.key === 'share');

  /* ── Figures ── */
  const hasRounds = (rounds ?? 0) > 0;
  const toPar = hasRounds ? toParParts(stats?.avg_over_par, 1) : null;
  const totalPar =
    analysis?.available && analysis.holes?.length === 18
      ? analysis.holes.reduce((sum, hole) => sum + hole.par, 0)
      : null;
  const hardestNo = hasRounds
    ? holes
      ? pickHardestHole(holes)
      : stats?.hardest_hole_no ?? null
    : null;
  const hardestHole = hardestNo != null && holes ? holes.find((h) => h.hole_no === hardestNo) : null;
  const hardestOver =
    hardestHole != null
      ? hardestHole.avg_to_par
      : stats?.hardest_hole_plays != null && stats?.hardest_hole_par != null
        ? stats.hardest_hole_plays - stats.hardest_hole_par
        : null;

  /* ── The "you" panel ── */
  const bandSentence =
    user && index != null && bandAverage && bandAverage.rounds >= 5 && bandAverage.golfers >= 3
      ? t('courseDetail.websiteSheet.bandAverage', {
          defaultValue: 'Golfers off your handicap average {{gross}} here.',
          gross: Math.round(bandAverage.avg_gross),
        })
      : null;
  const bestSentence =
    yourRounds > 0 && stats?.your_best != null
      ? t('courseDetail.websiteSheet.yourBest', {
          defaultValue: 'Your best here is {{best}}.',
          best: stats.your_best,
        })
      : yourRounds > 0
        ? null
        : t('courseDetail.websiteSheet.notPlayedYet', { defaultValue: "You haven't played it yet." });
  const showYouPanel = Boolean(user) && (bandSentence != null || yourRounds > 0);

  /* ── People you follow ── */
  const circleText = (() => {
    if (circle.count <= 0) return null;
    const [a, b, c] = circle.shown.map((p) => p.display_name as string);
    if (circle.count === 1) {
      return { names: [a], text: t('courseDetail.websiteSheet.circleOne', { defaultValue: '{{a}} has played here', a }) };
    }
    if (circle.count === 2) {
      return { names: [a, b], text: t('courseDetail.websiteSheet.circleTwo', { defaultValue: '{{a}} and {{b}} have played here', a, b }) };
    }
    if (circle.count === 3) {
      return { names: [a, b, c], text: t('courseDetail.websiteSheet.circleThree', { defaultValue: '{{a}}, {{b}} and {{c}} have played here', a, b, c }) };
    }
    const others = circle.capped ? '500+' : String(circle.count - 2);
    return { names: [a, b], text: t('courseDetail.websiteSheet.circleMany', { defaultValue: '{{a}}, {{b}} and {{others}} others you follow have played here', a, b, others }) };
  })();

  const onList = personalStatus.status?.status === 'want_to_play';
  const showSaveButton = !personalStatus.hasTrackedRounds;

  const hasPhoto = Boolean(course.thumbnail_image);
  const domain = course.website_url ? extractDomain(course.website_url) : '';

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="gap-0 border-t-0 p-0"
        style={{
          background: BG,
          borderRadius: '28px 28px 0 0',
          overflow: 'hidden',
          maxHeight: '92vh',
        }}
      >
        <SheetTitle className="sr-only">{course.name}</SheetTitle>
        <div
          data-course-website-sheet
          style={{
            position: 'relative',
            maxHeight: '92vh',
            overflowY: 'auto',
            paddingBottom: 'calc(34px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {hasPhoto && (
            <div style={{ position: 'relative', height: 132 }}>
              <img
                src={course.thumbnail_image}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(22,22,26,0) 40%, #16161A 100%)',
                }}
              />
            </div>
          )}

          {/* Grabber */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 36,
              height: 4,
              borderRadius: 2,
              background: hasPhoto ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)',
              zIndex: 2,
            }}
          />

          {/* Close */}
          <button
            type="button"
            aria-label={t('courseDetail.websiteSheet.close', { defaultValue: 'Close' })}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: hasPhoto ? 'rgba(10,10,12,0.45)' : 'rgba(255,255,255,0.06)',
              backdropFilter: hasPhoto ? 'blur(12px)' : undefined,
              WebkitBackdropFilter: hasPhoto ? 'blur(12px)' : undefined,
              color: INK,
              zIndex: 2,
              cursor: 'pointer',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>

          <div style={{ padding: hasPhoto ? '4px 20px 0' : '40px 20px 0' }}>
            {/* Header */}
            <div style={LABEL}>
              {t('courseDetail.websiteSheet.officialWebsite', { defaultValue: 'OFFICIAL WEBSITE' })}
            </div>
            <div style={{ marginTop: 7, fontSize: 21, fontWeight: 700, lineHeight: 1.2, color: INK }}>
              {course.name}
            </div>
            <div style={{ marginTop: 5, fontSize: 13.5, color: MUTE }}>
              {t('courseDetail.websiteSheet.domainLine', {
                defaultValue: '{{domain}} · opens in your browser',
                domain,
              })}
            </div>

            {/* Visit website */}
            <button
              type="button"
              onClick={handleVisitWebsite}
              style={{
                marginTop: 18,
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: 'none',
                background: INK,
                color: ON_INK,
                fontSize: 16,
                fontWeight: 650,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              {t('courseDetail.websiteSheet.visitWebsite', { defaultValue: 'Visit website' })}
              <ArrowUpRight style={{ width: 17, height: 17 }} strokeWidth={2.2} />
            </button>

            {/* Quick action tiles */}
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              {shownTiles.map((tile) => (
                <button
                  key={tile.key}
                  type="button"
                  onClick={tile.onTap}
                  style={{
                    flex: 1,
                    height: 66,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    color: INK,
                    cursor: 'pointer',
                  }}
                >
                  {tile.icon}
                  <span style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {tile.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Divider + kicker row */}
            <div style={{ height: 1, background: HAIR, margin: '20px 0 18px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={LABEL}>
                {t('courseDetail.websiteSheet.beforeYouGo', { defaultValue: 'BEFORE YOU GO' })}
              </div>
              {hasRounds && (
                <div style={{ ...LABEL, fontSize: 8.5, fontVariantNumeric: 'tabular-nums' }}>
                  {(rounds as number) < 10
                    ? t('courseDetail.websiteSheet.earlyData', {
                        defaultValue: 'EARLY DATA · {{n}} ROUNDS',
                        n: rounds,
                      })
                    : t('courseDetail.websiteSheet.roundsMeasured', {
                        defaultValue: '{{n}} ROUNDS MEASURED',
                        n: rounds,
                      })}
                </div>
              )}
            </div>

            {/* Figures */}
            {(hasRounds || showRating) && (
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                {toPar && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                      {toPar.text}
                    </div>
                    <div style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>
                      {t('courseDetail.websiteSheet.avgOverPar', { defaultValue: 'AVG OVER PAR' })}
                    </div>
                    {totalPar != null && (
                      <div style={{ fontSize: 11.5, color: MUTE, marginTop: 4 }}>
                        {t('courseDetail.websiteSheet.parTotal', { defaultValue: 'Par {{par}}', par: totalPar })}
                      </div>
                    )}
                  </div>
                )}
                {hardestNo != null && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                      {ordinal(hardestNo)}
                    </div>
                    <div style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>
                      {t('courseDetail.websiteSheet.hardestHole', { defaultValue: 'HARDEST HOLE' })}
                    </div>
                    {hardestOver != null && (
                      <div style={{ fontSize: 11.5, color: MUTE, marginTop: 4 }}>
                        {t('courseDetail.websiteSheet.playsOver', {
                          defaultValue: '+{{x}} a round',
                          x: hardestOver.toFixed(2),
                        })}
                      </div>
                    )}
                  </div>
                )}
                {showRating && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                      {(sample?.score ?? 0).toFixed(1)}
                    </div>
                    <div style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>
                      {t('courseDetail.websiteSheet.ratedOutOfTen', { defaultValue: 'RATED /10' })}
                    </div>
                    <div style={{ fontSize: 11.5, color: MUTE, marginTop: 4 }}>
                      {t('courseDetail.websiteSheet.reviewsCount', {
                        defaultValue: '{{count}} reviews',
                        count: sample?.ratingCount ?? 0,
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {rounds === 0 && (
              <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.5, color: MUTE }}>
                {t('courseDetail.websiteSheet.noRounds', {
                  defaultValue:
                    'No rounds measured here yet. Play it with your handicap connected and yours is the first.',
                })}
              </div>
            )}

            {/* The "you" panel */}
            {showYouPanel && (
              <div
                style={{
                  marginTop: 18,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(247,147,30,0.08)',
                  border: '1px solid rgba(247,147,30,0.22)',
                  display: 'flex',
                  gap: 10,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: AMBER,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 13.5, lineHeight: 1.45, color: MUTE }}>
                  {bandSentence && (
                    <span>
                      {t('courseDetail.websiteSheet.bandAverageLead', { defaultValue: 'Golfers off your handicap average' })}{' '}
                      <strong style={{ color: INK, fontWeight: 700 }}>{Math.round(bandAverage?.avg_gross ?? 0)}</strong>{' '}
                      {t('courseDetail.websiteSheet.bandAverageTail', { defaultValue: 'here.' })}{' '}
                    </span>
                  )}
                  {yourRounds > 0 && stats?.your_best != null ? (
                    <span>
                      {t('courseDetail.websiteSheet.yourBestLead', { defaultValue: 'Your best here is' })}{' '}
                      <strong style={{ color: INK, fontWeight: 700 }}>{stats.your_best}</strong>
                      {t('courseDetail.websiteSheet.sentenceEnd', { defaultValue: '.' })}
                    </span>
                  ) : bandSentence ? (
                    <span>{t('courseDetail.websiteSheet.notPlayedYet', { defaultValue: "You haven't played it yet." })}</span>
                  ) : null}
                </div>
              </div>
            )}

            {/* People you follow */}
            {circleText && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTabChange?.('you');
                }}
                style={{
                  marginTop: 14,
                  paddingLeft: 7,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {circle.shown.map((player, i) => (
                    <div
                      key={player.user_id}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: `2px solid ${BG}`,
                        marginLeft: i === 0 ? 0 : -7,
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 700,
                        color: INK,
                        flexShrink: 0,
                      }}
                    >
                      {player.profile_photo_url ? (
                        <img
                          src={player.profile_photo_url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        (player.display_name ?? '?').trim().charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
                <span style={{ flex: 1, fontSize: 13, color: MUTE }}>{circleText.text}</span>
                <ChevronRight style={{ width: 16, height: 16, color: DIM, flexShrink: 0 }} />
              </button>
            )}

            {/* Bottom buttons */}
            {(showSaveButton || !shareTileShown) && (
              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                {showSaveButton && (
                  <button
                    type="button"
                    disabled={onList}
                    onClick={handleSaveToList}
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'none',
                      color: INK,
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: onList ? 'default' : 'pointer',
                      opacity: onList ? 0.7 : 1,
                    }}
                  >
                    <Bookmark
                      style={{ width: 16, height: 16 }}
                      fill={onList ? INK : 'none'}
                    />
                    {onList
                      ? t('courseDetail.websiteSheet.onYourList', { defaultValue: 'On your list' })
                      : t('courseDetail.websiteSheet.saveToList', { defaultValue: 'Save to your list' })}
                  </button>
                )}
                {!shareTileShown && (
                  <button
                    type="button"
                    onClick={handleShare}
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'none',
                      color: INK,
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <Share style={{ width: 16, height: 16 }} />
                    {t('courseDetail.websiteSheet.shareCourse', { defaultValue: 'Share course' })}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CourseWebsiteSheet;
