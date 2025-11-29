import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { FadeInContent } from '@/components/ui/FadeInContent';

const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params?.courseId;
  const navigate = useNavigate();
  const location = useLocation();

  // Always scroll to top when navigating to a different course
  // Only watches courseId - tab changes don't trigger scroll
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
  }, [courseId]);

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