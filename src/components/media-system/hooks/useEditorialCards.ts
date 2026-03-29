import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  HistoryCardData,
  HistoryCardFeedPost,
  CourseOfWeekCardData,
  CourseOfWeekCardFeedPost,
  DebateCardData,
  DebateCardFeedPost,
} from '../types/media';

export interface EditorialCards {
  historyCard: HistoryCardFeedPost | null;
  courseOfWeekCard: CourseOfWeekCardFeedPost | null;
  debateCard: DebateCardFeedPost | null;
}

const baseFeedPost = {
  userId: 'system',
  actorType: 'system' as const,
  actorId: 'system',
  username: 'clbhouz',
  displayName: 'Clbhouz',
  avatarUrl: '',
  isVerified: true,
  creatorRelation: 'none' as const,
  caption: '',
  mediaItems: [] as [],
  review: null,
  isReview: false as const,
  isLikedByMe: false,
  isFollowedByMe: false,
  likeCount: 0,
  shareCount: 0,
  createdAt: new Date().toISOString(),
  commentCount: 0,
};

export function useEditorialCards(userId: string | undefined): EditorialCards {
  const { data } = useQuery({
    queryKey: ['editorial-cards', userId],
    queryFn: async () => {
      // Fetch active editorial cards
      const { data: cards, error } = await supabase
        .from('editorial_feed_cards')
        .select('*')
        .eq('is_active', true)
        .lte('active_from', new Date().toISOString())
        .gte('active_until', new Date().toISOString())
        .order('active_from', { ascending: false });

      if (error || !cards) return { history: null, courseOfWeek: null, debate: null };

      let historyCard: HistoryCardFeedPost | null = null;
      let courseOfWeekCard: CourseOfWeekCardFeedPost | null = null;
      let debateCard: DebateCardFeedPost | null = null;

      for (const card of cards) {
        const cardType = card.card_type as string;

        if (cardType === 'history' && !historyCard) {
          // Fetch linked course if course_id exists
          let linkedCourse: HistoryCardData['linkedCourse'] = null;
          if (card.course_id) {
            const { data: course } = await supabase
              .from('golf_courses')
              .select('id, name, country, global_rank, thumbnail_image')
              .eq('id', card.course_id)
              .single();

            if (course) {
              const { count: reviewCount } = await supabase
                .from('course_ratings')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', course.id);

              const { data: avgData } = await supabase
                .from('course_ratings')
                .select('rating')
                .eq('course_id', course.id);

              const avgRating = avgData && avgData.length > 0
                ? avgData.reduce((sum, r) => sum + (r.rating ?? 0), 0) / avgData.length
                : null;

              linkedCourse = {
                id: course.id,
                name: course.name,
                globalRank: (course as any).global_rank ?? null,
                country: course.country ?? '',
                reviewCount: reviewCount ?? 0,
                communityRating: avgRating,
                thumbnailImage: (course as any).thumbnail_image ?? null,
              };
            }
          }

          const cardData: HistoryCardData = {
            cardId: card.id,
            cardType: 'history',
            title: card.title,
            body: card.body ?? null,
            bodyExtended: card.body_extended ?? null,
            reactionCount: card.reaction_count ?? 0,
            commentCount: card.comment_count ?? 0,
            activeUntil: card.active_until as string,
            historyYear: card.history_year ?? 0,
            historyDate: card.history_date ?? '',
            linkedCourse,
          };

          historyCard = {
            ...baseFeedPost,
            id: `editorial-history-${card.id}`,
            postType: 'history_card',
            cardData,
            mediaItems: [],
            review: null,
            isReview: false,
          };
        }

        if (cardType === 'course_of_week' && !courseOfWeekCard && card.course_id) {
          const { data: course } = await supabase
            .from('golf_courses')
            .select('id, name, country, sub_country, global_rank, regional_rank, usa_rank, thumbnail_image, description')
            .eq('id', card.course_id)
            .single();

          if (course) {
            const { count: reviewCount } = await supabase
              .from('course_ratings')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            // Do not show Course of the Week if it has no reviews on Clbhouz
            if (!reviewCount || reviewCount === 0) {
              console.log('[useEditorialCards] Course of week has no reviews — skipping card');
              continue;
            }

            const { data: avgData } = await supabase
              .from('course_ratings')
              .select('rating')
              .eq('course_id', course.id);

            const avgRating = avgData && avgData.length > 0
              ? avgData.reduce((sum, r) => sum + (r.rating ?? 0), 0) / avgData.length
              : null;

            // Want-to-play status — hardcoded for now until a dedicated table exists
            let isOnMyWantToPlay = false;
            try {
              // No dedicated want-to-play column exists in user_courses
              // This will be wired once a proper wishlist/bucket-list table is available
              isOnMyWantToPlay = false;
            } catch {
              // fail silently — card still shows
            }

            // Get friends who played this course
            let friendsWhoPlayed: CourseOfWeekCardData['course']['friendsWhoPlayed'] = [];
            if (userId) {
              try {
                const { data: friendRows } = await supabase
                  .from('user_friends')
                  .select('friend_id')
                  .eq('user_id', userId)
                  .eq('status', 'accepted');

                const friendIds = (friendRows || []).map((f: any) => f.friend_id);

                if (friendIds.length > 0) {
                  const { data: friendRatings } = await supabase
                    .from('course_ratings')
                    .select('user_id, rating, user_profiles!inner(display_name, profile_photo_url)')
                    .eq('course_id', course.id)
                    .in('user_id', friendIds)
                    .limit(5);

                  friendsWhoPlayed = (friendRatings || []).map((r: any) => ({
                    userId: r.user_id,
                    displayName: r.user_profiles.display_name || 'Golfer',
                    avatarUrl: r.user_profiles.profile_photo_url || null,
                    rating: r.rating || null,
                  }));
                }
              } catch (err) {
                console.warn('[useEditorialCards] Friends query failed:', err);
              }
            }

            const cardData: CourseOfWeekCardData = {
              cardId: card.id,
              cardType: 'course_of_week',
              title: card.title,
              body: card.body ?? null,
              bodyExtended: card.body_extended ?? null,
              reactionCount: card.reaction_count ?? 0,
              commentCount: card.comment_count ?? 0,
              activeUntil: card.active_until as string,
              editorialBlurb: card.course_editorial_blurb ?? null,
              course: {
                id: course.id,
                name: course.name,
                country: course.country ?? '',
                subCountry: (course as any).sub_country ?? null,
                globalRank: (course as any).global_rank ?? null,
                regionalRank: (course as any).regional_rank ?? null,
                usaRank: (course as any).usa_rank ?? null,
                thumbnailImage: (course as any).thumbnail_image ?? null,
                reviewCount: reviewCount ?? 0,
                communityRating: avgRating,
                friendsWhoPlayed,
                isOnMyWantToPlay,
              },
            };

            courseOfWeekCard = {
              ...baseFeedPost,
              id: `editorial-course-${card.id}`,
              postType: 'course_of_week_card',
              cardData,
              mediaItems: [],
              review: null,
              isReview: false,
            };
          }
        }

        if (cardType === 'debate' && !debateCard) {
          let myVote: 'a' | 'b' | null = null;
          if (userId) {
            const { data: vote } = await supabase
              .from('editorial_debate_votes')
              .select('option')
              .eq('card_id', card.id)
              .eq('user_id', userId)
              .maybeSingle();
            if (vote) myVote = vote.option as 'a' | 'b';
          }

          // Fetch linked courses for debate options
          let linkedCourseA: DebateCardData['linkedCourseA'] = null;
          let linkedCourseB: DebateCardData['linkedCourseB'] = null;

          if (card.debate_option_a_course_id) {
            const { data: c } = await supabase
              .from('golf_courses')
              .select('id, name')
              .eq('id', card.debate_option_a_course_id)
              .single();
            if (c) linkedCourseA = { id: c.id, name: c.name, communityRating: null };
          }
          if (card.debate_option_b_course_id) {
            const { data: c } = await supabase
              .from('golf_courses')
              .select('id, name')
              .eq('id', card.debate_option_b_course_id)
              .single();
            if (c) linkedCourseB = { id: c.id, name: c.name, communityRating: null };
          }

          const cardData: DebateCardData = {
            cardId: card.id,
            cardType: 'debate',
            title: card.title,
            body: card.body ?? null,
            bodyExtended: card.body_extended ?? null,
            reactionCount: card.reaction_count ?? 0,
            commentCount: card.comment_count ?? 0,
            activeUntil: card.active_until as string,
            optionA: card.debate_option_a ?? '',
            optionB: card.debate_option_b ?? '',
            votesA: card.debate_votes_a ?? 0,
            votesB: card.debate_votes_b ?? 0,
            myVote,
            linkedCourseA,
            linkedCourseB,
          };

          debateCard = {
            ...baseFeedPost,
            id: `editorial-debate-${card.id}`,
            postType: 'debate_card',
            cardData,
            mediaItems: [],
            review: null,
            isReview: false,
          };
        }
      }

      return { history: historyCard, courseOfWeek: courseOfWeekCard, debate: debateCard };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  });

  return {
    historyCard: data?.history ?? null,
    courseOfWeekCard: data?.courseOfWeek ?? null,
    debateCard: data?.debate ?? null,
  };
}
