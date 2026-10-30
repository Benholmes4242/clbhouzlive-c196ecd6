import React, { useLayoutEffect } from 'react';
import { useParams, useNavigate, useNavigationType } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';
import { usePreventOverscroll } from '@/hooks/usePreventOverscroll';
import { analyticsEvents } from '@/utils/analyticsEvents';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { recordRecentCourseView } from '@/lib/recentCourseViews';
import { useGuestScrollGate } from '@/features/guest/useGuestSurfaceGate';
import { courseSurfaceKey } from '@/features/guest/guestGateStore';

const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params?.courseId;
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  // GUEST BROWSING §4: each course page is its own free-look surface,
  // locking 1.5 viewport heights down.
  useGuestScrollGate(courseId ? courseSurfaceKey(courseId) : 'courses');

  usePreventOverscroll();

  useLayoutEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const hasDeepLink = sp.has('review') || sp.has('reviewId');
    if (navigationType !== 'POP' && !hasDeepLink) {
      const rootEl = document.getElementById('root');
      if (rootEl) rootEl.scrollTop = 0;
      scrollPageToTop('auto');
    }

    // Track course detail view
    if (courseId) {
      analyticsEvents.track('course_view', {
        course_id: courseId,
      });
      recordRecentCourseView(courseId);
    }
    // CB110: consuming a landing query changes POP/PUSH to REPLACE on the
    // same mounted course. Only course entry owns this reset, not query cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);


  if (!courseId) {
    return (
      <PageRoot className="min-h-screen bg-background flex items-center justify-center" immersiveStatusBar immersive>
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
    <PageRoot
      className="min-h-screen"
      style={{ overscrollBehaviorY: 'none', background: A.CANVAS }}
      immersiveStatusBar
      immersive
    >
      <FadeInContent>
        <GolfClubView courseId={courseId} isInModal={false} />
      </FadeInContent>
      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default CourseDetailPage;
