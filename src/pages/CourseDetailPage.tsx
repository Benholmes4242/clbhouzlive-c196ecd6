import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { scrollToTop } from '@/utils/scrollToTop';
import { FadeInContent } from '@/components/ui/FadeInContent';

const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params?.courseId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);
  const cleanupTriggeredRef = useRef(false);

  // Aggressive cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    cleanupTriggeredRef.current = false;
    
    // Signal we're on course detail - disable location broadcasting
    document.body.setAttribute('data-course-detail', 'true');
    
    if (mountedRef.current) {
      scrollToTop();
    }
    
    return () => {
      if (cleanupTriggeredRef.current) return;
      cleanupTriggeredRef.current = true;
      
      mountedRef.current = false;
      
      // Re-enable location broadcasting
      document.body.removeAttribute('data-course-detail');
      
      // Cancel all course-related queries immediately
      queryClient.cancelQueries({ queryKey: ['course-detail'] });
      queryClient.cancelQueries({ queryKey: ['course-rating'] });
      queryClient.cancelQueries({ queryKey: ['user-course-rating'] });
      queryClient.cancelQueries({ queryKey: ['course-reviews'] });
      queryClient.cancelQueries({ queryKey: ['course-media'] });
      
      // Force garbage collection hint
      if (typeof window !== 'undefined' && (window as any).gc) {
        try {
          (window as any).gc();
        } catch (e) {
          // gc not available
        }
      }
    };
  }, [courseId, queryClient]);

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