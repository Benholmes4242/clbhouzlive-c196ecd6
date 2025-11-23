import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { scrollToTop } from '@/utils/scrollToTop';
import { FadeInContent } from '@/components/ui/FadeInContent';

const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params?.courseId;
  const navigate = useNavigate();

  // Ensure course detail always starts from the top
  useEffect(() => {
    scrollToTop();
  }, [courseId]);

  // Cleanup logging for debugging (remove in production)
  useEffect(() => {
    return () => {
      if (import.meta.env.DEV) {
        console.log('[CourseDetailPage] unmount');
      }
    };
  }, []);

  // Add defensive check for courseId
  if (!courseId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FadeInContent>
        <GolfClubView courseId={courseId} isInModal={false} />
      </FadeInContent>
    </div>
  );
};

export default CourseDetailPage;