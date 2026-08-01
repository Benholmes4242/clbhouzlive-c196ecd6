/**
 * CourseStatusToggle - a want-to-play control, nothing else.
 *
 * BRIEF_YOU_TAB_STATUS_PANEL supersedes BRIEF_COURSE_YOU_TAB_TREATMENT s2.
 * "Played" is derived from having rated, so a rated member's pill was inert and
 * said what the rating panel below already says twice: the whole panel is
 * hidden in that state. What remains is one toggling bucket-list pill.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';
import { A, LABEL, SANS, Panel } from '@/features/courses/components/holes/analytical/tokens';

interface CourseStatusToggleProps {
  courseId: string;
  courseName: string;
  userRating?: number;
  className?: string;
}

const pillStyle = (active: boolean): React.CSSProperties => ({
  border: `1px solid ${active ? A.INK : A.BORDER}`,
  background: active ? A.INK : A.PANEL,
  color: active ? A.PANEL : A.INK,
  borderRadius: 999,
  padding: '8px 16px',
  fontSize: 12.5,
  fontWeight: 700,
  fontFamily: SANS,
  cursor: 'pointer',
  minHeight: 40,
});

export const CourseStatusToggle: React.FC<CourseStatusToggleProps> = ({
  courseId,
  className,
}) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const { t } = useTranslation('courses');
  const { status, isLoading, setWantToPlay, isUpdating } = useCoursePersonalStatus(courseId);

  if (!user) {
    return (
      <div className={cn('space-y-3', className)}>
        <p className="text-sm text-muted-foreground">{t('phase5.statusToggle.signInPrompt')}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="w-full">
          {t('phase5.statusToggle.signIn')}
        </Button>
      </div>
    );
  }

  if (isLoading || !status) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleWantToPlayClick = async () => {
    if (status.status === 'want_to_play') {
      await setWantToPlay(false);
      toast(t('phase5.statusToggle.removedFromBucket'), { duration: 2000 });
    } else {
      await setWantToPlay(true);
      toast(t('phase5.statusToggle.addedToBucket'), { duration: 2000 });
    }
  };

  // Rated == played. Nothing to control, and the rating panel below states it.
  if (status.status === 'played') return null;

  const isWantToPlay = status.status === 'want_to_play';

  return (
    <Panel style={{ fontFamily: SANS }}>
      <div style={{ ...LABEL, marginBottom: 10 }}>{t('courseDetail.you.wantToPlay')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={handleWantToPlayClick}
          disabled={isUpdating}
          style={pillStyle(isWantToPlay)}
        >
          {t('courseDetail.you.wantToPlay')}
        </button>
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin" style={{ color: A.DIM }} />}
      </div>
    </Panel>
  );
};

export default CourseStatusToggle;
