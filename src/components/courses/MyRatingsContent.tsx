import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { compareOwnRatings } from '@/lib/sortCoursesByRating';
import { annotateTies } from '@/lib/breakdown';
import MyRatingsCourseCard, {
  type MyRatingsCourseCardData,
} from './MyRatingsCourseCard';
import EditRatingModal from './EditRatingModal';

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
    country: string | null;
    sub_country: string | null;
    region: string | null;
    continent: string | null;
    global_rank: number | null;
    regional_rank: number | null;
    usa_rank: number | null;
    thumbnail_image: string | null;
  };
}

const MyRatingsContent = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const viewingUsername = searchParams.get('user');
  const viewingUserId = searchParams.get('userId');
  const isViewingOwnRatings = !viewingUsername && !viewingUserId;

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const { data: viewedUserProfile } = useQuery({
    queryKey: ['user-profile', viewingUsername, viewingUserId],
    queryFn: async () => {
      if (isViewingOwnRatings) return null;

      let query = supabase
        .from('user_profiles')
        .select('id, display_name, username');

      if (viewingUsername) {
        query = query.eq('username', viewingUsername);
      } else if (viewingUserId) {
        query = query.eq('id', viewingUserId);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !isViewingOwnRatings,
  });

  const targetUserId = isViewingOwnRatings ? user?.id : viewedUserProfile?.id;
  const displayName = isViewingOwnRatings
    ? 'My'
    : viewedUserProfile?.display_name || viewedUserProfile?.username || 'User';

  const { data: ratedCourses = [], isLoading } = useQuery({
    queryKey: ['user-rated-courses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

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
            sub_country,
            region,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            thumbnail_image
          )
        `)
        .eq('user_id', targetUserId)
        .order('rating', { ascending: false });

      if (error) throw error;

      const rows = (data as unknown as RatedCourse[]) || [];
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

  const annotatedCourses = useMemo(
    () => annotateTies(ratedCourses as RatedCourse[]),
    [ratedCourses]
  );

  const editingCourse = useMemo(
    () => annotatedCourses.find((c) => c.golf_courses.id === editingCourseId),
    [annotatedCourses, editingCourseId]
  );

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleAddBreakdown = (courseId: string) => {
    setEditingCourseId(courseId);
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
        <div className="text-center py-8 text-muted-foreground">Loading ratings...</div>
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
            {annotatedCourses.length} courses rated
          </Badge>
        </div>

        {annotatedCourses.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: '#FFFFFF',
              border: '0.5px solid #E2E8F0',
              borderRadius: 8,
            }}
          >
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No ratings yet</h3>
            <p className="text-muted-foreground">
              {isViewingOwnRatings
                ? "Start rating courses you've played to see them here"
                : `${displayName} hasn't rated any courses yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {annotatedCourses.map((course, index) => (
              <MyRatingsCourseCard
                key={course.id}
                course={course as MyRatingsCourseCardData}
                rank={index + 1}
                onCourseClick={handleCourseClick}
                onAddBreakdown={handleAddBreakdown}
              />
            ))}
          </div>
        )}
      </div>

      {editingCourse && (
        <EditRatingModal
          courseId={editingCourse.golf_courses.id}
          courseName={editingCourse.golf_courses.name}
          currentRating={editingCourse.rating}
          currentReview={editingCourse.review}
          currentDesignScore={editingCourse.design_score}
          currentConditionScore={editingCourse.condition_score}
          currentClubhouseScore={editingCourse.clubhouse_score}
          currentFacilitiesScore={editingCourse.facilities_score}
          isOpen={!!editingCourseId}
          onClose={() => setEditingCourseId(null)}
        />
      )}
    </>
  );
};

export default MyRatingsContent;
