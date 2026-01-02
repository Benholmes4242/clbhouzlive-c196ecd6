/**
 * CourseStatusToggle - Personal status toggle (Played / Want to Play / Wishlist)
 * Phase 5: Calm, private-first design with mutually exclusive states
 */
import React from 'react';
import { Check, Bookmark, Heart, Loader2 } from 'lucide-react';
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
  const { status, isLoading, setWantToPlay, setWishlist, isUpdating } = useCoursePersonalStatus(courseId);

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
    // Navigate to rate page
    navigate(`/courses/${courseId}/rate`);
  };

  const handleWantToPlayClick = async () => {
    if (status.status === 'played') return; // Disable if played
    
    if (status.status === 'want_to_play') {
      await setWantToPlay(false);
      toast({
        description: "Removed from Want to Play",
        duration: 2000,
      });
    } else {
      await setWantToPlay(true);
      toast({
        description: "Added to Want to Play",
        duration: 2000,
      });
    }
  };

  const handleWishlistClick = async () => {
    if (status.status === 'played') return; // Disable if played
    
    if (status.status === 'wishlist') {
      await setWishlist(false);
      toast({
        description: "Removed from Wishlist",
        duration: 2000,
      });
    } else {
      await setWishlist(true);
      toast({
        description: "Added to Wishlist",
        duration: 2000,
      });
    }
  };

  const isPlayed = status.status === 'played';
  const isWantToPlay = status.status === 'want_to_play';
  const isWishlist = status.status === 'wishlist';
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
      <div className="flex flex-wrap gap-2">
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

        {/* Want to Play - disabled if played */}
        <button
          onClick={handleWantToPlayClick}
          disabled={isUpdating || isPlayed}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
            isPlayed && "opacity-40 cursor-not-allowed",
            isWantToPlay
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
          )}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark className={cn("h-4 w-4", isWantToPlay && "fill-amber-500")} />
          )}
          {isWantToPlay ? '✓ Want to Play' : 'Want to Play'}
        </button>

        {/* Wishlist - disabled if played */}
        <button
          onClick={handleWishlistClick}
          disabled={isUpdating || isPlayed}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
            isPlayed && "opacity-40 cursor-not-allowed",
            isWishlist
              ? "bg-rose-100 text-rose-800 border border-rose-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
          )}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", isWishlist && "fill-rose-500")} />
          )}
          {isWishlist ? '✓ Wishlist' : 'Wishlist'}
        </button>
      </div>

      {/* Wishlist privacy note */}
      {isWishlist && (
        <p className="text-xs text-slate-400">
          Saved for later — visible only to you
        </p>
      )}
    </div>
  );
};

export default CourseStatusToggle;
