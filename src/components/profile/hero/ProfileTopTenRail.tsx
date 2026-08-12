/**
 * ProfileTopTenRail - BRIEF_PROFILE_HERO_AND_TOP10 section 4.
 *
 * Editorial replacement for FavouritesCarousel on the personal profile: a
 * horizontal rail of 168px cards on canvas, image over a course name and
 * region, with a rank chip and (when rated) a rating chip on the image.
 *
 * Same data (useUserTopTenCourses) and the same deep-link contract
 * (?tab=courses&top_ten_comment=...) - the comments sheet is still mounted for
 * the deep-linked course, it is simply no longer what a card tap opens.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';

const GLASS = 'rgba(10,14,10,0.55)';
const SCRIM = 'linear-gradient(0deg, rgba(10,14,10,0.62), rgba(10,14,10,0) 55%)';

interface Props {
  userId: string;
  isOwnProfile: boolean;
  onManage?: () => void;
  initialCourseId?: string | null;
  initialCommentId?: string | null;
  initialParentCommentId?: string | null;
}

export const ProfileTopTenRail: React.FC<Props> = ({
  userId,
  isOwnProfile,
  onManage,
  initialCourseId = null,
  initialCommentId = null,
  initialParentCommentId = null,
}) => {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const { topTen, isLoading } = useUserTopTenCourses(userId);
  const [commentsOpen, setCommentsOpen] = React.useState(false);

  const didAutoOpen = React.useRef(false);
  React.useEffect(() => {
    if (didAutoOpen.current) return;
    if (!initialCommentId || !initialCourseId) return;
    didAutoOpen.current = true;
    setCommentsOpen(true);
  }, [initialCommentId, initialCourseId]);

  const courseIds = React.useMemo(
    () => topTen.map((c) => c.course_id).sort(),
    [topTen],
  );

  const { data: ratingsMap = {} } = useQuery({
    queryKey: ['user-course-ratings-breakdown', userId, courseIds],
    enabled: !!userId && courseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', userId)
        .in('course_id', courseIds);
      if (error) throw error;
      return (data || []).reduce((acc: Record<string, number>, r) => {
        acc[r.course_id] = r.rating;
        return acc;
      }, {});
    },
    staleTime: 60_000,
  });

  if (isLoading) return null;

  const header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        padding: '0 16px',
        fontFamily: SANS,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: A.INK,
          }}
        >
          {isOwnProfile
            ? t('topTen.kicker', 'Your top 10')
            : t('topTen.kickerOther', 'Their top 10')}
        </div>
        <div
          style={{
            marginTop: 3,
            fontSize: 11.5,
            fontWeight: 600,
            color: A.BODY,
            lineHeight: 1.35,
          }}
        >
          {isOwnProfile
            ? t('topTen.subtitle', "The very best you've played")
            : t('topTen.subtitleOther', 'The very best they have played')}
        </div>
      </div>
      {isOwnProfile && onManage && (
        <button
          type="button"
          onClick={onManage}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            flexShrink: 0,
            fontFamily: SANS,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.INK,
            cursor: 'pointer',
          }}
        >
          {t('topTen.manage', 'Manage')}
        </button>
      )}
    </div>
  );

  if (topTen.length === 0) {
    return (
      <section style={{ paddingBottom: 4 }}>
        {header}
        <div
          style={{
            padding: '10px 16px 0',
            fontFamily: SANS,
            fontSize: 11.5,
            fontWeight: 600,
            color: A.BODY,
            lineHeight: 1.35,
          }}
        >
          {isOwnProfile
            ? t('topTen.emptyOwn', 'Nothing here yet - add the courses you rate above all others.')
            : t('topTen.emptyOther', "This golfer hasn't picked their top 10 yet.")}
        </div>
      </section>
    );
  }

  return (
    <section style={{ paddingBottom: 4 }}>
      {header}

      <div
        className="scrollbar-hide"
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 9,
          overflowX: 'auto',
          paddingLeft: 16,
          paddingRight: 16,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {topTen.map((course) => {
          const rating = course.rating ?? ratingsMap[course.course_id] ?? null;
          const region = course.sub_country || course.region || course.country || null;
          return (
            <button
              key={course.id}
              type="button"
              data-top-ten-course-id={course.course_id}
              onClick={() => {
                analyticsEvents.track('profile_top10_card_tap', {
                  course_id: course.course_id,
                  position: course.position,
                });
                navigate(`/courses/${course.course_id}`);
              }}
              style={{
                width: 168,
                flexShrink: 0,
                background: 'transparent',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              <CourseImageFallback
                courseId={course.course_id}
                courseName={course.name}
                imageUrl={course.thumbnail_image}
                style={{ height: 112, borderRadius: 14 }}
              >
                <div style={{ position: 'absolute', inset: 0, background: SCRIM }} />
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    background: GLASS,
                    borderRadius: 999,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    ...FIGS,
                  }}
                >
                  #{course.position}
                </span>
                {rating != null && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: 4,
                      background: GLASS,
                      borderRadius: 999,
                      padding: '3px 8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        ...FIGS,
                      }}
                    >
                      {rating === 10 ? '10' : Number(rating).toFixed(1)}
                    </span>
                    <span
                      style={{
                        fontSize: 7,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {t('topTen.rated', 'Rated')}
                    </span>
                  </span>
                )}
              </CourseImageFallback>

              {/* Round 3 §4: the text block below the image holds ONE height -
                  two lines of the 12/800 name (2 x 15) plus the 10.5/600
                  region line (14.2) and its 2px gap. A one-line name simply
                  leaves the gap; the rail never goes ragged. */}
              <div style={{ marginTop: 7, height: 46, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: A.INK,
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {course.name}
                </div>
                {region && (
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: A.BODY,
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {region}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Deep-link contract: ?tab=courses&course=<id>&top_ten_comment=<id> */}
      {initialCourseId && (
        <CommentsSheetV2
          isOpen={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          targetType="top_ten"
          targetId={userId}
          targetSecondaryId={initialCourseId}
          initialCommentId={initialCommentId}
        />
      )}
    </section>
  );
};

export default ProfileTopTenRail;
