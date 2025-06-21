
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CourseReviewsProps {
  courseId: string;
}

interface ReviewData {
  id: string;
  rating: number;
  review: string | null;
  review_date: string;
  user_id: string;
  display_name?: string | null;
  username?: string | null;
}

const CourseReviews = ({ courseId }: CourseReviewsProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
        .select('id, display_name, username')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const reviewsWithProfiles = ratingsData.map(rating => {
        const profile = profilesData?.find(p => p.id === rating.user_id);
        return {
          ...rating,
          display_name: profile?.display_name,
          username: profile?.username
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

  return (
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
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {getUserInitials(review)}
                      </span>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      {/* User Name and Rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getUserDisplayName(review)}
                          </span>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            {review.rating}/10
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.review_date)}
                        </span>
                      </div>
                      
                      {/* Review Text */}
                      {review.review && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.review}
                        </p>
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
  );
};

export default CourseReviews;
