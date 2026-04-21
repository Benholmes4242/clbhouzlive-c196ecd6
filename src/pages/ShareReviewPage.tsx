/**
 * Share Review Page - Fullscreen preview before sharing to Clubhouse
 * Allows user to preview their review post before publishing to feed
 */

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShareReview } from '@/hooks/useShareReview';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { ReviewPostViewer } from '@/components/posts/ReviewPostViewer';
import type { ReviewMediaItem } from '@/components/posts/FullscreenReviewPost';
import { formatCourseLocation } from '@/utils/courseLocation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShareReviewPage() {
  const { courseId, reviewId } = useParams<{ courseId: string; reviewId: string }>();
  const navigate = useNavigate();
  const { notifyReviewShared, isSharing } = useShareReview();
  const { user } = useSupabaseSession();
  const [hasShared, setHasShared] = useState(false);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['user-profile-share', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-for-share', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, region, thumbnail_image')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch review data with media
  const { data: review, isLoading: reviewLoading } = useQuery({
    queryKey: ['review-for-share', reviewId],
    queryFn: async () => {
      if (!reviewId) return null;
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          id,
          rating,
          review,
          course_review_media (
            id,
            media_type,
            media_url,
            poster_url,
            stream_id
          )
        `)
        .eq('id', reviewId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!reviewId,
  });

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleShare = useCallback(async () => {
    if (!courseId || !reviewId || !review) return;

    const result = await notifyReviewShared({
      ratingId: reviewId,
    });

    if (result.success) {
      setHasShared(true);
      setTimeout(() => {
        navigate(`/courses/${courseId}?reviewId=${reviewId}`);
      }, 1500);
    }
  }, [courseId, reviewId, review, shareReview, navigate]);

  const isLoading = courseLoading || reviewLoading;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!course || !review) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-4 text-white">
        <p>Review not found</p>
        <Button variant="outline" onClick={handleBack}>Go Back</Button>
      </div>
    );
  }

  // Transform media to expected format
  const reviewMedia: ReviewMediaItem[] = (review.course_review_media || []).map((m: any) => ({
    id: m.id,
    media_type: m.media_type,
    media_url: m.media_url,
    poster_url: m.poster_url,
  }));

  const courseLocation = formatCourseLocation(course);

  const creator = profile ? {
    id: profile.id,
    name: profile.display_name || profile.username || 'You',
    username: profile.username || undefined,
    avatar: profile.profile_photo_url || undefined,
  } : { id: '', name: 'You' };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <ReviewPostViewer
        mode="preview"
        courseId={courseId!}
        courseName={course.name}
        heroSubtitle={courseLocation}
        rating={review.rating}
        reviewText={review.review || ''}
        media={reviewMedia}
        initialIndex={0}
        onBack={handleBack}
        sourceReviewId={reviewId!}
        creator={creator}
        showReviewCapsule={false}
      >
        {/* Share CTA at bottom */}
        <div className="absolute bottom-0 inset-x-0 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-black/80 to-transparent pt-12 px-4">
          <div className="flex gap-3 pb-4">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-full border-white/30 text-white bg-white/10 backdrop-blur-sm"
              onClick={handleBack}
              disabled={isSharing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-12 rounded-full bg-white text-black font-semibold"
              onClick={handleShare}
              disabled={isSharing || hasShared}
            >
              {isSharing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sharing...</>
              ) : hasShared ? (
                'Shared!'
              ) : (
                'Share to Clubhouse'
              )}
            </Button>
          </div>
        </div>
      </ReviewPostViewer>
    </div>
  );
}
