import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ArrowLeft, Calendar, MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { compareOwnRatings } from '@/lib/sortCoursesByRating';


interface RatedCourse {
  id: string;
  rating: number;
  review: string | null;
  review_date: string;
  course_id: string;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  golf_courses: {
    id: string;
    name: string;
    country: string;
    region: string;
    continent: string;
    global_rank: number | null;
    regional_rank: number | null;
    usa_rank: number | null;
    description: string;
    thumbnail_image: string;
    latitude: number | null;
    longitude: number | null;
    website_url: string | null;
  };
}

const MyRatingsContent = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get the user parameter from URL to determine whose ratings to show
  const viewingUsername = searchParams.get('user');
  const viewingUserId = searchParams.get('userId');
  const isViewingOwnRatings = !viewingUsername && !viewingUserId;

  console.log('MyRatingsContent: viewingUsername:', viewingUsername, 'viewingUserId:', viewingUserId, 'isViewingOwnRatings:', isViewingOwnRatings);

  // Fetch the user profile if viewing someone else's ratings
  const { data: viewedUserProfile } = useQuery({
    queryKey: ['user-profile', viewingUsername, viewingUserId],
    queryFn: async () => {
      if (isViewingOwnRatings) return null;
      
      console.log('Fetching profile for username:', viewingUsername, 'or userId:', viewingUserId);
      
      let query = supabase
        .from('user_profiles')
        .select('id, display_name, username');
      
      if (viewingUsername) {
        query = query.eq('username', viewingUsername);
      } else if (viewingUserId) {
        query = query.eq('id', viewingUserId);
      }
      
      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
      console.log('Found user profile:', data);
      return data;
    },
    enabled: !isViewingOwnRatings,
  });

  // Determine which user's ratings to fetch
  const targetUserId = isViewingOwnRatings ? user?.id : viewedUserProfile?.id;
  const displayName = isViewingOwnRatings 
    ? 'My' 
    : (viewedUserProfile?.display_name || viewedUserProfile?.username || 'User');

  console.log('MyRatingsContent: targetUserId:', targetUserId, 'displayName:', displayName);

  const { data: ratedCourses = [], isLoading } = useQuery({
    queryKey: ['user-rated-courses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) {
        console.log('No targetUserId, returning empty array');
        return [];
      }
      
      console.log('Fetching ratings for user:', targetUserId);
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          id,
          rating,
          review,
          review_date,
          course_id,
          design_score,
          condition_score,
          clubhouse_score,
          facilities_score,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image,
            latitude,
            longitude,
            website_url
          )
        `)
        .eq('user_id', targetUserId)
        // Server primary sort; full canonical chain re-applied client-side.
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching ratings:', error);
        throw error;
      }

      console.log('Found ratings:', data?.length || 0);
      const rows = (data as RatedCourse[]) || [];
      return [...rows].sort((a, b) =>
        compareOwnRatings(
          {
            course_id: a.course_id,
            rating: a.rating,
            design_score: a.design_score,
            condition_score: a.condition_score,
            clubhouse_score: a.clubhouse_score,
            facilities_score: a.facilities_score,
            review_date: a.review_date,
          },
          {
            course_id: b.course_id,
            rating: b.rating,
            design_score: b.design_score,
            condition_score: b.condition_score,
            clubhouse_score: b.clubhouse_score,
            facilities_score: b.facilities_score,
            review_date: b.review_date,
          },
          'desc'
        )
      );
    },
    enabled: !!targetUserId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReviewSummary = (review: string | null) => {
    if (!review) return null;
    const words = review.split(' ');
    if (words.length <= 15) return review;
    return words.slice(0, 15).join(' ') + '...';
  };

  const handleCourseClick = (course: RatedCourse['golf_courses']) => {
    navigate(`/courses/${course.id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isViewingOwnRatings ? 'My Ratings' : `${displayName} Ratings`}
          </h1>
        </div>
        <div className="text-center py-8">Loading ratings...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isViewingOwnRatings ? 'My Ratings' : `${displayName} Ratings`}
          </h1>
          <Badge variant="secondary" className="ml-auto">
            {ratedCourses.length} courses rated
          </Badge>
        </div>

        {ratedCourses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No ratings yet</h3>
              <p className="text-muted-foreground">
                {isViewingOwnRatings 
                  ? 'Start rating courses you\'ve played to see them here' 
                  : `${displayName} hasn't rated any courses yet`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ratedCourses.map((ratedCourse) => (
              <Card key={ratedCourse.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 
                            className="font-semibold text-lg hover:text-secondary transition-colors cursor-pointer"
                            onClick={() => handleCourseClick(ratedCourse.golf_courses)}
                          >
                            {ratedCourse.golf_courses.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {ratedCourse.golf_courses.region}, {ratedCourse.golf_courses.country}
                          </p>
                        </div>
                        <Badge variant="default" className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {ratedCourse.rating}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Rated {formatDate(ratedCourse.review_date)}</span>
                        </div>
                        {ratedCourse.review && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>Review included</span>
                          </div>
                        )}
                      </div>

                      {ratedCourse.review && (
                        <div className="space-y-2">
                          <p className="text-sm leading-relaxed">
                            {getReviewSummary(ratedCourse.review)}
                          </p>
                          {ratedCourse.review.split(' ').length > 15 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleCourseClick(ratedCourse.golf_courses)}
                            >
                              View Full Review
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {ratedCourse.golf_courses.thumbnail_image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={ratedCourse.golf_courses.thumbnail_image}
                          alt={ratedCourse.golf_courses.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=100&h=100&fit=crop';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyRatingsContent;
