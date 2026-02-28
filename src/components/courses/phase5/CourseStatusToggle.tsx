/**
 * CourseStatusToggle - Personal status toggle (Played / Want to Play)
 * Played button matches user's rating color (Gray/Amber)
 */
import React from 'react';
import { Check, Bookmark, Loader2, Sparkles, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useNavigate, Link } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { getScoreTier } from '@/utils/getScoreTier';

interface CourseStatusToggleProps {
  courseId: string;
  courseName: string;
  userRating?: number;
  className?: string;
}

export const CourseStatusToggle: React.FC<CourseStatusToggleProps> = ({
  courseId,
  courseName,
  userRating,
  className,
}) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  
  const { status, isLoading, setWantToPlay, isUpdating } = useCoursePersonalStatus(courseId);

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
    navigate(`/courses/${courseId}/rate`);
  };

  const handleWantToPlayClick = async () => {
    if (status.status === 'played') return;
    
    if (status.status === 'want_to_play') {
      await setWantToPlay(false);
      toast("Removed from Want to Play", { duration: 2000 });
    } else {
      await setWantToPlay(true);
      toast("Added to Want to Play", { duration: 2000 });
    }
  };

  const isPlayed = status.status === 'played';
  const isWantToPlay = status.status === 'want_to_play';
  const hasNoSelection = status.status === 'none';
  
  const scoreTier = userRating ? getScoreTier(userRating) : null;
  const isOutstanding = scoreTier?.isOutstanding ?? false;
  
  // Gray for Fair→Excellent, Amber for Outstanding
  const playedBgColor = isOutstanding ? 'bg-[#f59e0b]' : 'bg-[#9ca3af]';
  const playedShadowColor = isOutstanding ? 'shadow-[#f59e0b]/25' : 'shadow-[#9ca3af]/25';

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {/* Played button */}
        <button
          onClick={handlePlayedClick}
          disabled={isUpdating}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95",
            isPlayed
              ? `${playedBgColor} text-white ${playedShadowColor}`
              : "bg-muted text-muted-foreground hover:bg-secondary"
          )}
        >
          {isPlayed && <Check className="h-4 w-4" />}
          <span>{isPlayed ? 'Played' : 'Mark Played'}</span>
        </button>

        {/* Want to Play */}
        <button
          onClick={handleWantToPlayClick}
          disabled={isUpdating || isPlayed}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95",
            isPlayed && "opacity-40 cursor-not-allowed",
            isWantToPlay
              ? "bg-amber-100 text-amber-700 border-2 border-amber-300 shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          )}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark className={cn("h-4 w-4", isWantToPlay && "fill-amber-500")} />
          )}
          <span>Want to Play</span>
        </button>
      </div>

      {/* Journey tooltip */}
      {hasNoSelection && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>
            Every course you mark becomes part of your journey — view them anytime on your{' '}
            <Link to="/map" className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
              map
            </Link>.
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseStatusToggle;
