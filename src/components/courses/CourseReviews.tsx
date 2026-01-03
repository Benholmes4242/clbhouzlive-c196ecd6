
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Star, Edit } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import EditRatingModal from './EditRatingModal';
import ReviewMediaDisplay from './ReviewMediaDisplay';

interface CourseReviewsProps {
  courseId: string;
  courseName: string;
  currentUser: any;
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
}

const CourseReviews = ({ courseId, courseName, currentUser }: CourseReviewsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['course-reviews', courseId],
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
        .select('id, review_id, media_url, media_type, file_name, poster_url')
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
          media
        };
      });

      return reviewsWithProfiles as ReviewData[];
    },
    enabled: !!courseId,
  });

  const reviewCount = reviews?.length || 0;

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
    return currentUser?.id === review.user_id;
  };

  return (
    <>
      <div className="border rounded-lg p-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <h3 className="font-semibold">
                Reviews ({reviewCount})
              </h3>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-4">
                Loading reviews...
              </div>
            ) : reviewCount === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No reviews yet. Be the first to leave a review!
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {reviews?.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        {/* User Avatar with Profile Photo */}
                        <SquircleAvatar
                          src={review.profile_photo_url}
                          alt={getUserDisplayName(review)}
                          size="md"
                          fallback={getUserInitials(review)}
                        />
                        
                        <div className="flex-1 space-y-2">
                        {/* User Name and Rating */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {getUserDisplayName(review)}
                            </span>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {review.rating}
                            </Badge>
                            {isUserReview(review) && (
                              <Badge variant="outline" className="text-xs">
                                Your Review
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.review_date)}
                            </span>
                            {isUserReview(review) && currentUser && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => handleEditReview(review)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Review Text */}
                        {review.review && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {review.review}
                          </p>
                        )}

                        {/* Review Media */}
                        {review.media && review.media.length > 0 && (
                          <ReviewMediaDisplay media={review.media} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
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

export default CourseReviews;
