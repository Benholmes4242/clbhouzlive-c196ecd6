import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { usePreventOverscroll } from '@/hooks/usePreventOverscroll';
import { analyticsEvents } from '@/utils/analyticsEvents';

const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params?.courseId;
  const navigate = useNavigate();
  
  usePreventOverscroll();
  useMedianStatusBar("dark", "transparent", true, false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    // Track course detail view
    if (courseId) {
      analyticsEvents.track('course_view', {
        course_id: courseId,
      });
    }
  }, [courseId]);

  if (!courseId) {
    return (
      <PageRoot className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/courses')}>
            Back to Courses
          </Button>
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-background" immersive immersiveStatusBar style={{ overscrollBehaviorY: 'none' }}>
      <FadeInContent>
        <GolfClubView courseId={courseId} isInModal={false} />
      </FadeInContent>
    </PageRoot>
  );
};

export default CourseDetailPage;
