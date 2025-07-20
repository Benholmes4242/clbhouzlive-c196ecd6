import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import EditRatingModal from '@/components/courses/EditRatingModal';
import ReviewMediaDisplay from '@/components/courses/ReviewMediaDisplay';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

interface CourseReviewsTabProps {
  courseId: string;
  courseName: string;
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
  media?: Array<{
    id: string;
    media_url: string;
    media_type: 'image' | 'video';
    file_name?: string;
  }>;
  likes_count?: number;
  user_liked?: boolean;
}

const CourseReviewsTab = ({ courseId, courseName }: CourseReviewsTabProps) => {
  const { user } = useSupabaseSession();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['course-reviews-detailed', courseId],
    queryFn: async () => {
      // First get the ratings with reviews
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('id, rating, review, review_date, user_id')
        .eq('course_id', courseId)
        .not('review', 'is', null)
        .not('review', 'eq', '')
        .order('review_date', { ascending: false });

      if (ratingsError) throw ratingsError;
      if (!ratingsData) return [];

      // Get user profiles for the ratings
      const userIds = ratingsData.map(rating => rating.user_id);
      
      if (userIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get review media for each rating
      const { data: mediaData, error: mediaError } = await supabase
        .from('course_review_media')
        .select('id, review_id, media_url, media_type, file_name')
        .in('review_id', ratingsData.map(r => r.id));

      if (mediaError) throw mediaError;

      // Combine the data
      const reviewsWithProfiles = ratingsData.map(rating => {
        const profile = profilesData?.find(p => p.id === rating.user_id);
        const media = mediaData?.filter(m => m.review_id === rating.id) || [];
        return {
          ...rating,
          display_name: profile?.display_name,
          username: profile?.username,
          profile_photo_url: profile?.profile_photo_url,
          media,
          likes_count: Math.floor(Math.random() * 10), // Placeholder
          user_liked: false // Placeholder
        };
      });

      return reviewsWithProfiles as ReviewData[];
    },
    enabled: !!courseId,
  });

  const getUserDisplayName = (review: ReviewData) => {
    return review.display_name || review.username || 'Anonymous';
  };

  const getUserInitials = (review: ReviewData) => {
    const name = getUserDisplayName(review);
    if (name === 'Anonymous') return 'A';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEditReview = (review: ReviewData) => {
    setSelectedReview(review);
    setEditModalOpen(true);
  };

  const isUserReview = (review: ReviewData) => {
    return user?.id === review.user_id;
  };

  const toggleExpandReview = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const isReviewExpanded = (reviewId: string) => expandedReviews.has(reviewId);

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

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
        <p className="text-muted-foreground">Be the first to leave a review for this course!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {reviews.map((review) => {
          const isExpanded = isReviewExpanded(review.id);
          const reviewText = review.review || '';
          const shouldTruncate = reviewText.length > 200;
          const displayText = shouldTruncate && !isExpanded 
            ? reviewText.substring(0, 200) + '...' 
            : reviewText;

          return (
            <div key={review.id} className="bg-card p-6 border">
              <div className="flex items-start gap-4">
                {/* User Avatar */}
                <OptimizedAvatar
                  src={review.profile_photo_url}
                  alt={getUserDisplayName(review)}
                  size={48}
                  className="w-12 h-12 flex-shrink-0"
                  fallback={getUserInitials(review)}
                />
                
                <div className="flex-1 space-y-3">
                  {/* User Name, Rating, and Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">
                        {getUserDisplayName(review)}
                      </span>
                      <div className="flex items-center gap-1">
                        <ClubhouseLogo size="sm" showTooltip />
                        <span className="font-medium">{review.rating}/10</span>
                      </div>
                      {isUserReview(review) && (
                        <Badge variant="outline" className="text-xs">
                          Your Review
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(review.review_date)}
                      </span>
                      {isUserReview(review) && user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => handleEditReview(review)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Review Text */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground leading-relaxed">
                      {displayText}
                    </p>
                    {shouldTruncate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-primary hover:bg-transparent"
                        onClick={() => toggleExpandReview(review.id)}
                      >
                        {isExpanded ? (
                          <>
                            Show less <ChevronUp className="h-4 w-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Read more <ChevronDown className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Review Media */}
                  {review.media && review.media.length > 0 && (
                    <div className="mt-4">
                      <ReviewMediaDisplay media={review.media} />
                    </div>
                  )}

                  {/* Like Button */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-muted-foreground hover:text-red-500"
                    >
                      <Heart className={`h-4 w-4 mr-1 ${review.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
                      Helpful ({review.likes_count})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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