/**
 * CourseStatusToggle - Personal status toggle (Played / Want to Play)
 * Phase 5: Calm, private-first design with toast confirmations
 */
import React from 'react';
import { Check, Bookmark, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCoursePersonalStatus, CourseStatus } from '@/hooks/useCoursePersonalStatus';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';

interface CourseStatusToggleProps {
  courseId: string;
  courseName: string;
  className?: string;
}

export const CourseStatusToggle: React.FC<CourseStatusToggleProps> = ({
  courseId,
  courseName,
  className,
}) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { status, isLoading, setWantToPlay, setNextUp, isUpdating } = useCoursePersonalStatus(courseId);

  if (!user) {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-sm text-muted-foreground">
          Sign in to track this course
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/auth')}
          className="w-full"
        >
          Sign in
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handlePlayedClick = () => {
    if (status.status === 'played') {
      // Already played - go to edit rating
      navigate(`/courses/${courseId}/rate`);
    } else {
      // Not played - go to rate
      navigate(`/courses/${courseId}/rate`);
    }
  };

  const handleWantToPlayClick = async () => {
    if (status.status === 'want_to_play') {
      await setWantToPlay(false);
      toast({
        description: "Removed from your journey",
        duration: 2000,
      });
    } else if (status.status !== 'played') {
      await setWantToPlay(true);
      toast({
        description: "Added to your journey",
        duration: 2000,
      });
    }
  };

  const handleNextUpClick = async () => {
    const wasNextUp = status.status === 'next_up';
    await setNextUp(!wasNextUp);
    toast({
      description: wasNextUp ? "Removed from Next Up" : "Marked as Next Up",
      duration: 2000,
    });
  };

  const isPlayed = status.status === 'played';
  const isWantToPlay = status.status === 'want_to_play';
  const isNextUp = status.status === 'next_up';
  const hasNoSelection = status.status === 'none';

  return (
    <div className={cn("space-y-3", className)}>
      {/* Empty state nudge */}
      {hasNoSelection && (
        <p className="text-xs text-slate-400 mb-1">
          Start tracking your journey
        </p>
      )}
      
      {/* Status pills */}
      <div className="flex gap-2">
        {/* Played status */}
        <button
          onClick={handlePlayedClick}
          disabled={isUpdating}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
            isPlayed
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
          )}
        >
          <Check className={cn("h-4 w-4", isPlayed && "text-emerald-600")} />
          {isPlayed ? 'Played' : 'Mark Played'}
        </button>

        {/* Want to Play / Next Up */}
        {!isPlayed && (
          <button
            onClick={handleWantToPlayClick}
            disabled={isUpdating}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
              isWantToPlay || isNextUp
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
            )}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bookmark className={cn("h-4 w-4", (isWantToPlay || isNextUp) && "fill-amber-500")} />
            )}
            {isWantToPlay ? 'Want to Play' : isNextUp ? 'Next Up' : 'Want to Play'}
          </button>
        )}
      </div>

      {/* Next Up option if Want to Play is selected - indented for hierarchy */}
      {(isWantToPlay || isNextUp) && (
        <div className="pl-2">
          <button
            onClick={handleNextUpClick}
            disabled={isUpdating}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              isNextUp
                ? "text-amber-700 font-medium"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <MapPin className={cn("h-3.5 w-3.5", isNextUp && "fill-amber-500")} />
            {isNextUp ? "Marked as Next Up" : "Mark as Next Up"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseStatusToggle;