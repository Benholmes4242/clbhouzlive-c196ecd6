import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GolfClubView from '@/components/golf-club/GolfClubView';

const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params?.courseId;
  const navigate = useNavigate();

  // Ensure course detail always starts from the top
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });

    // Extra safety for some mobile browsers
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
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
      {/* Back Button - Overlay on golf club view */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 z-50"
        onClick={() => navigate('/courses')}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <GolfClubView courseId={courseId} isInModal={false} />
    </div>
  );
};

export default CourseDetailPage;