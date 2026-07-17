/**
 * CourseStatusToggle - Equal-width pill buttons for course status
 */
import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Loader2, Star, Check, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useNavigate, Link } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';

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
  const { t } = useTranslation('courses');
  const { status, isLoading, setWantToPlay, isUpdating } = useCoursePersonalStatus(courseId);

  if (!user) {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-sm text-muted-foreground">{t('phase5.statusToggle.signInPrompt')}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="w-full">
          {t('phase5.statusToggle.signIn')}
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
      toast(t('phase5.statusToggle.removedFromBucket'), { duration: 2000 });
    } else {
      await setWantToPlay(true);
      toast(t('phase5.statusToggle.addedToBucket'), { duration: 2000 });
    }
  };

  const isPlayed = status.status === 'played';
  const isWantToPlay = status.status === 'want_to_play';
  const hasNoSelection = status.status === 'none';

  return (
    <div className={cn('space-y-3', className)}>
      {/* HERO — Played / Rate (amber-star language from the reviews page) */}
      {isPlayed ? (
        <button
          onClick={handlePlayedClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            borderRadius: 18,
            cursor: 'pointer',
            textAlign: 'left',
            background: 'linear-gradient(135deg, rgba(247,147,30,0.07), rgba(247,147,30,0.02))',
            border: '1.5px solid rgba(247,147,30,0.15)',
          }}
        >
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #F7931E, #FBBC2E)',
          }}>
            <Star size={22} color="#fff" fill="#fff" strokeWidth={0} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
              {t('phase5.statusToggle.playedTitle')}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
              {t('phase5.statusToggle.playedSub')}
            </div>
          </div>
          <span style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '7px 13px', borderRadius: 999,
            background: 'rgba(247,147,30,0.12)', color: '#F7931E',
            fontSize: 12.5, fontWeight: 700,
          }}>
            <Check size={15} strokeWidth={2.5} /> {t('phase5.statusToggle.playedBadge')}
          </span>
        </button>
      ) : (
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(247,147,30,0.07), rgba(247,147,30,0.02))',
            border: '1.5px solid rgba(247,147,30,0.15)',
          }}
        >
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #F7931E, #FBBC2E)',
          }}>
            <Star size={22} color="#fff" fill="#fff" strokeWidth={0} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Played here?
            </div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
              Your rating helps golfers worldwide
            </div>
          </div>
          <button
            type="button"
            onClick={handlePlayedClick}
            disabled={isUpdating}
            style={{
              flexShrink: 0, padding: '9px 18px', borderRadius: 999,
              fontSize: 13, fontWeight: 700, color: '#fff', border: 'none',
              background: '#F7931E', boxShadow: '0 4px 14px rgba(247,147,30,0.3)',
              cursor: 'pointer',
            }}
          >
            Rate
          </button>
        </div>
      )}

      {/* WANT TO PLAY — subtle toggle row; hidden once played */}
      {!isPlayed && (
        <button
          onClick={handleWantToPlayClick}
          disabled={isUpdating}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
            background: '#fff', border: '1px solid rgba(15,23,42,0.07)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, color: '#0F172A' }}>
            <Bookmark
              size={19}
              strokeWidth={2}
              color={isWantToPlay ? '#F7931E' : '#64748B'}
              fill={isWantToPlay ? '#F7931E' : 'none'}
            />
            {isWantToPlay ? 'On your bucket list' : 'Add to bucket list'}
          </span>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#94A3B8' }} />
          ) : (
            <span style={{
              width: 44, height: 26, borderRadius: 999, position: 'relative', flexShrink: 0,
              background: isWantToPlay ? '#F7931E' : '#E2E8F0',
              transition: 'background 0.18s ease',
            }}>
              <span style={{
                position: 'absolute', top: 3, left: isWantToPlay ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.18s ease',
              }} />
            </span>
          )}
        </button>
      )}

      {/* Footnote — only when nothing marked yet */}
      {hasNoSelection && (
        <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5, margin: '4px 0 0' }}>
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
