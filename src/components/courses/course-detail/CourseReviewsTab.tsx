import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, MessageSquare } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import EditRatingModal from '@/components/courses/EditRatingModal';
import ReviewsTab from '@/components/profile/ReviewsTab';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';

interface CourseReviewsTabProps {
  courseId: string;
  courseName: string;
  ratingStats?: {
    average_rating: number;
    total_ratings: number;
    total_reviews: number;
  } | null;
}

interface ReviewData {
  id: string;
  rating: number;
  review: string | null;
  review_date: string;
  user_id: string;
  display_name?: string | null;
  username?: string | null;
  profile_photo_url?: string | null;
  media?: MediaItem[];
  helpful_count?: number;
  unhelpful_count?: number;
  user_vote?: string;
}

const CourseReviewsTab = ({ courseId, courseName, ratingStats }: CourseReviewsTabProps) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  
  // Fetch user's rating
  const { data: userRating } = useUserCourseRating(courseId, user?.id);
  const hasUserReviewed = !!userRating?.review;

  // Fix N+1 pattern: fetch all data in parallel
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['course-reviews-detailed', courseId],
    queryFn: async () => {
      // Fetch ratings with reviews
      const ratingsPromise = supabase
        .from('course_ratings')
        .select('id, rating, review, review_date, user_id, helpful_count, unhelpful_count')
        .eq('course_id', courseId)
        .not('review', 'is', null)
        .not('review', 'eq', '')
        .order('review_date', { ascending: false });

      const { data: ratingsData, error: ratingsError } = await ratingsPromise;
      
      if (ratingsError) throw ratingsError;
      if (!ratingsData || ratingsData.length === 0) {
        return { 
          reviews: [], 
          stats: ratingStats ? {
            average: ratingStats.average_rating,
            total: ratingStats.total_ratings
          } : { average: 0, total: 0 }
        };
      }

      const userIds = ratingsData.map(rating => rating.user_id);
      const ratingIds = ratingsData.map(rating => rating.id);

      // Fetch all related data in parallel with Promise.all
      const [profilesResult, mediaResult, votesResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', userIds),
        
        ratingIds.length > 0
          ? supabase
              .from('course_review_media')
              .select('id, review_id, media_url, media_type, file_name')
              .in('review_id', ratingIds)
          : Promise.resolve({ data: [], error: null }),
        
        user?.id && ratingIds.length > 0
          ? supabase
              .from('review_votes')
              .select('review_id, value')
              .eq('user_id', user.id)
              .in('review_id', ratingIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (mediaResult.error) throw mediaResult.error;

      const profilesData = profilesResult.data || [];
      const mediaData = mediaResult.data || [];
      const userVotes = votesResult.data || [];

      // Combine the data
      const reviewsWithProfiles = ratingsData.map(rating => {
        const profile = profilesData?.find(p => p.id === rating.user_id);
        const reviewMedia = mediaData.filter(m => m.review_id === rating.id);
        const userVote = userVotes.find(vote => vote.review_id === rating.id);
        return {
          ...rating,
          display_name: profile?.display_name,
          username: profile?.username,
          profile_photo_url: profile?.profile_photo_url,
          media: reviewMedia.map(m => {
            if (m.media_type === 'video') {
              const streamId = getStreamIdFromUrl(m.media_url);
              return {
                id: m.id,
                type: 'video' as const,
                url: m.media_url,
                streamId,
                posterUrl: getStreamPoster(m.media_url, '1s') ?? undefined,
                alt: m.file_name ?? 'Video',
              };
            }
            return { 
              id: m.id, 
              type: 'image' as const, 
              url: m.media_url, 
              alt: m.file_name ?? 'Photo' 
            };
          }),
          helpful_count: rating.helpful_count || 0,
          unhelpful_count: rating.unhelpful_count || 0,
          user_vote: userVote?.value === 1 ? 'helpful' : userVote?.value === -1 ? 'unhelpful' : 'none'
        };
      });

      return {
        reviews: reviewsWithProfiles,
        stats: ratingStats ? {
          average: ratingStats.average_rating,
          total: ratingStats.total_ratings
        } : { average: 0, total: 0 }
      };
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const getUserDisplayName = (review: ReviewData) => {
    return review.display_name || review.username || 'Anonymous';
  };

  const handleEditReview = (review: ReviewData) => {
    setSelectedReview(review);
    setEditModalOpen(true);
  };

  const isUserReview = (review: ReviewData) => {
    return user?.id === review.user_id;
  };

  // Transform data for the new ReviewsTab component
  const transformedReviews = reviewsData?.reviews.map(review => ({
    id: review.id,
    user: {
      name: getUserDisplayName(review),
      avatarUrl: review.profile_photo_url || ''
    },
    rating10: review.rating,
    dateISO: review.review_date,
    text: review.review || '',
    helpfulCount: (review as any).helpful_count || 0,
    unhelpfulCount: (review as any).unhelpful_count || 0,
    userVote: (review as any).user_vote || 'none',
    isYourReview: isUserReview(review),
    media: review.media || []
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviewsData?.reviews || reviewsData.reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 pt-10 pb-24 text-center text-muted-foreground gap-3">
        <div className="w-14 h-14 rounded-full bg-surface-alt flex items-center justify-center">
          <Star className="w-7 h-7" />
        </div>

        <div>
          <p className="text-base font-medium text-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to leave a review for this course!
          </p>
        </div>

        {!hasUserReviewed && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!user) {
                toast({
                  title: "Sign in required",
                  description: "Please sign in to write a review",
                });
                navigate('/auth');
                return;
              }
              // Open rating modal logic here if needed
            }}
          >
            Write a review
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <ReviewsTab
        averageRating10={reviewsData.stats.average}
        totalReviews={reviewsData.stats.total}
        reviews={transformedReviews}
        courseId={courseId}
      />

      {selectedReview && (
        <EditRatingModal
          courseId={courseId}
          courseName={courseName}
          currentRating={selectedReview.rating}
          currentReview={selectedReview.review}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedReview(null);
          }}
        />
      )}
    </>
  );
};

export default CourseReviewsTab;