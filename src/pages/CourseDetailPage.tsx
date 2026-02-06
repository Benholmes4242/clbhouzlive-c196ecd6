import React, { useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { usePreventOverscroll } from '@/hooks/usePreventOverscroll';

const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params?.courseId;
  const navigate = useNavigate();
  
  // Prevent pull-down overscroll bounce on this immersive page
  usePreventOverscroll();
  
  // Safe area bleed: transparent status bar with white icons for hero image
  useMedianStatusBar("dark", "transparent", true, false);
  
  // Register as dimmable page for auto-hide header
  const { setDimmablePage } = useCinemaDimContext();
  
  useLayoutEffect(() => {
    setDimmablePage('course-detail');
    return () => setDimmablePage(null);
  }, [setDimmablePage]);

  // Always scroll to top ONLY when navigating to a different course
  // Does NOT scroll when tab/filter changes (preserves scroll position)
  useEffect(() => {
    // Scroll both window and #root container to ensure it works
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
    
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    }
  }, [courseId]); // Only courseId - NOT location.pathname

  // Add defensive check for courseId
  if (!courseId) {
    return (
      <PageRoot className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
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
    <PageRoot className="min-h-screen bg-[var(--bg-page)]" immersive immersiveStatusBar style={{ overscrollBehaviorY: 'none' }}>
      <FadeInContent>
        <GolfClubView courseId={courseId} isInModal={false} />
      </FadeInContent>
    </PageRoot>
  );
};

export default CourseDetailPage;
