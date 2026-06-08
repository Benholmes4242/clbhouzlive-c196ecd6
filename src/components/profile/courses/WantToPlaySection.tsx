/**
 * WantToPlaySection - Aspirational planning surface for courses
 * Single horizontal snap carousel of 200px cards.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserWantToPlay, WantToPlayCourse } from '@/hooks/useUserWantToPlay';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface WantToPlaySectionProps {
  userId: string;
  isOwnProfile: boolean;
  className?: string;
}

export const WantToPlaySection: React.FC<WantToPlaySectionProps> = ({
  userId,
  isOwnProfile,
  className,
}) => {
  const navigate = useNavigate();
  const { wantToPlay, isLoading, remove } = useUserWantToPlay(userId);

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleReview = (course: WantToPlayCourse) => {
    navigate(`/courses/${course.course_id}/rate`);
  };

  const handleRemove = (course: WantToPlayCourse) => {
    remove(course.course_id);
    toast.success(`Removed from bucket list`);
  };

  if (isLoading) {
    return (
      <div className={cn("", className)}>
        <div className="h-5 w-32 bg-muted rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (wantToPlay.length === 0) {
    return null;
  }

  return (
    <section className={cn('', className)}>
      {/* Eyebrow */}
      <div className="flex items-center justify-between mb-3 px-2.5">
        <div className="flex items-center gap-1.5">
          <Trophy size={11} strokeWidth={2.4} color="#F7931E" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#F7931E', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
            On Your List
          </span>
        </div>
      </div>

      {/* Horizontal snap carousel */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: 4,
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
          scrollbarWidth: 'none',
        }}
        className="wtp-carousel"
      >
        {wantToPlay.map((course) => {
          const isTop100 = !!(course.global_rank || course.regional_rank || course.usa_rank);
          const addedAgo = formatDistanceToNow(new Date(course.added_at), { addSuffix: true });
          const loc = course.sub_country || course.country;
          return (
            <article
              key={course.id}
              onClick={() => handleCourseClick(course.course_id)}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: 200,
                scrollSnapAlign: 'start',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#FFFFFF',
                border: '0.5px solid rgba(15,23,42,0.08)',
                cursor: 'pointer',
              }}
            >
              {/* Photo */}
              <div
                style={{
                  position: 'relative',
                  height: 124,
                  background: course.thumbnail_image
                    ? `url(${course.thumbnail_image})`
                    : 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0) 35%, rgba(15,23,42,0.6) 100%)' }} />
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove(course); }}
                    aria-label="Remove from list"
                    style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X className="w-3.5 h-3.5" style={{ color: '#fff' }} />
                  </button>
                )}
                {isTop100 && (
                  <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 999, background: 'rgba(247,147,30,0.92)' }}>
                    <Trophy size={9} strokeWidth={2.6} color="#fff" />
                    <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>TOP 100</span>
                  </div>
                )}
                <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {course.course_name}
                  </div>
                  {loc && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <MapPin size={9} strokeWidth={2.4} color="rgba(255,255,255,0.85)" />
                      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                        {loc}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px 10px 12px', gap: 8 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', color: '#94A3B8', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {addedAgo}
                </span>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReview(course); }}
                    style={{ flexShrink: 0, padding: '6px 13px', borderRadius: 999, border: '1px solid rgba(247,147,30,0.30)', background: 'rgba(247,147,30,0.10)', color: '#C97211', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Review
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <style>{`.wtp-carousel::-webkit-scrollbar{display:none}`}</style>
    </section>
  );
};
