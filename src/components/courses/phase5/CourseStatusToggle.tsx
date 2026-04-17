/**
 * CourseStatusToggle - Equal-width pill buttons for course status
 */
import React from 'react';
import { Check, Loader2 } from 'lucide-react';
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
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Mark Played — white/dark border by default; amber gradient when played */}
        <button
          onClick={handlePlayedClick}
          disabled={isUpdating}
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: isPlayed
              ? 'linear-gradient(90deg, #F59E0B, #F7931E)'
              : '#ffffff',
            color: isPlayed ? '#fff' : '#0F172A',
            border: isPlayed ? 'none' : '1.5px solid rgba(15,23,42,0.12)',
            boxShadow: isPlayed ? '0 3px 12px rgba(247,147,30,0.28)' : 'none',
            transition: 'all 0.18s ease',
          }}
        >
          {isPlayed && <Check className="h-4 w-4" />}
          {isPlayed ? 'Played' : 'Mark as Played'}
        </button>

        {/* Want to Play — dark when active */}
        <button
          onClick={handleWantToPlayClick}
          disabled={isUpdating || isPlayed}
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: isPlayed ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: isWantToPlay ? '#0F172A' : '#ffffff',
            color: isWantToPlay ? '#ffffff' : '#0F172A',
            border: isWantToPlay ? 'none' : '1.5px solid rgba(15,23,42,0.12)',
            opacity: isPlayed ? 0.35 : 1,
            transition: 'all 0.18s ease',
          }}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            isWantToPlay ? '🔖 Saved' : 'Want to Play'
          )}
        </button>
      </div>

      {hasNoSelection && (
        <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
          Every course you mark becomes part of your journey — view them anytime on your{' '}
          <Link to="/map" style={{ color: '#64748B', textDecoration: 'underline', textUnderlineOffset: 2 }}>
            map
          </Link>.
        </p>
      )}
    </div>
  );
};

export default CourseStatusToggle;
