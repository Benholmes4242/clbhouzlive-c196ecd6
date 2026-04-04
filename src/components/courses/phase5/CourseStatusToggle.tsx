/**
 * CourseStatusToggle - Pinpoint CTA buttons
 * Mark Played: Primary Dark (orange gradient when played)
 * Want to Play: Secondary Outline (orange tint when active)
 */
import React from 'react';
import { Check, Bookmark, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useNavigate, Link } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

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
        <p className="text-sm text-muted-foreground">Sign in to track this course</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="w-full">
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

  const handlePlayedClick = () => navigate(`/courses/${courseId}/rate`);

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

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {/* Mark Played — Primary Dark; orange gradient when already played */}
        <button
          onClick={handlePlayedClick}
          disabled={isUpdating}
          style={{
            height: 42,
            paddingLeft: 20,
            paddingRight: 20,
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: isPlayed
              ? 'linear-gradient(90deg, #F59E0B, #F7931E)'
              : 'linear-gradient(90deg, #F59E0B, #F7931E)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 3px 12px rgba(247,147,30,0.28)',
            transition: 'all 0.18s ease',
          }}
        >
          {isPlayed && <Check className="h-4 w-4" />}
          {isPlayed ? 'Played' : 'Mark as Played'}
        </button>

        {/* Want to Play — Outline with orange tint when active */}
        <button
          onClick={handleWantToPlayClick}
          disabled={isUpdating || isPlayed}
          style={{
            height: 42,
            paddingLeft: 20,
            paddingRight: 20,
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: isPlayed ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: isWantToPlay ? 'rgba(245,158,11,0.06)' : 'transparent',
            color: isWantToPlay ? '#F7931E' : 'hsl(var(--foreground))',
            border: isWantToPlay ? '1.5px solid #F59E0B' : '1.5px solid hsl(var(--border))',
            opacity: isPlayed ? 0.35 : 1,
            transition: 'all 0.18s ease',
          }}
        >
          {isUpdating
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Bookmark className={cn('h-4 w-4', isWantToPlay && 'fill-[#F7931E]')} />}
          Want to Play
        </button>
      </div>

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
