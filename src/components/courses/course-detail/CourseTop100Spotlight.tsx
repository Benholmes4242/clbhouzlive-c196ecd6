import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTop100CourseInsights } from '@/hooks/useTop100CourseInsights';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Trophy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type CourseTop100SpotlightProps = {
  courseId: string;
  courseName: string;
};

export const CourseTop100Spotlight: React.FC<CourseTop100SpotlightProps> = ({
  courseId,
  courseName,
}) => {
  const { t } = useTranslation('courses');
  const { data, isLoading } = useTop100CourseInsights(courseId);
  const { user } = useSupabaseSession();
  const { data: top100Progress } = useTop100ProgressForUser(user?.id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div
        style={{
          background: '#15171F',
          borderRadius: 16,
          padding: 18,
          margin: '0 16px',
        }}
      >
        <div style={{ height: 16, width: 140, background: 'rgba(247,147,30,0.15)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 12, width: 200, background: 'rgba(247,147,30,0.1)', borderRadius: 4, marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, height: 56, background: 'rgba(247,147,30,0.08)', borderRadius: 10 }} />
          <div style={{ flex: 1, height: 56, background: 'rgba(247,147,30,0.08)', borderRadius: 10 }} />
        </div>
      </div>
    );
  }

  if (!data || !data.list_memberships || data.list_memberships.length === 0) {
    return null;
  }

  const handleChipTap = (listSlug: string) => {
    navigate('/courses?tab=top100');
  };

  const listCount = data.list_memberships.length;

  const progressBySlug = new Map(
    (top100Progress?.lists ?? []).map(l => [l.listSlug, l])
  );

  const relevantProgress = data.list_memberships
    .map(m => progressBySlug.get(m.list_slug))
    .filter((p): p is NonNullable<typeof p> => !!p && p.total > 0);

  const bestProgress = relevantProgress.length > 0
    ? relevantProgress.reduce((best, current) =>
        (current.played / current.total) > (best.played / best.total) ? current : best
      )
    : null;

  return (
    <div
      style={{
        position: 'relative',
        background: '#15171F',
        borderRadius: 16,
        padding: 18,
        margin: '0 16px',
        overflow: 'hidden',
      }}
    >
      {/* Decorative orbital rings */}
      <div
        style={{
          position: 'absolute',
          right: -40,
          top: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: '1px solid rgba(247,147,30,0.15)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -20,
          top: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: '1px solid rgba(247,147,30,0.1)',
          pointerEvents: 'none',
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, position: 'relative' }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F59E0B, #F7931E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(247,147,30,0.35)',
          }}
        >
          <Trophy style={{ width: 18, height: 18, color: '#fff' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{t('courseDetail.top100Spotlight.title')}</h3>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
            {t('courseDetail.top100Spotlight.appearsIn', { count: listCount })}
          </p>
        </div>
      </div>

      {/* Stat tiles — course rank leads, user progress demoted to a chip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }}>
        {data.list_memberships.map((list) => (
          <button
            key={list.list_slug}
            type="button"
            onClick={() => handleChipTap(list.list_slug)}
            style={{
              flex: '1 1 calc(50% - 4px)',
              minWidth: 0,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(247,147,30,0.18)',
              borderRadius: 12,
              padding: 12,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {/* Course rank - the headline */}
            <div style={{ fontSize: 26, fontWeight: 900, color: '#F7931E', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {list.rank != null ? `#${list.rank}` : '—'}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#E2E8F0', marginTop: 5, lineHeight: 1.3 }}>
              {list.list_name}
            </div>
            {/* Your progress - demoted to a chip */}
            {(() => {
              const progress = progressBySlug.get(list.list_slug);
              if (!progress) {
                return (
                  <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 8, fontSize: 9.5, fontWeight: 700, color: '#94A3B8', background: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: '3px 8px' }}>
                    {t('courseDetail.top100Spotlight.tapToView')}
                  </div>
                );
              }
              const playedThis = data.user_has_played;
              return (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
                  fontSize: 9.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                  borderRadius: 999, padding: '3px 8px',
                  color: playedThis ? '#F7931E' : '#94A3B8',
                  background: playedThis ? 'rgba(247,147,30,0.14)' : 'rgba(255,255,255,0.06)',
                }}>
                  {playedThis && <Check size={9} strokeWidth={3} />}
                  {t('courseDetail.top100Spotlight.youvePlayed', { played: progress.played, total: progress.total })}
                </div>
              );
            })()}
          </button>
        ))}
      </div>

      {/* Progress strip */}
      {bestProgress && bestProgress.played > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px solid rgba(247,147,30,0.18)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('courseDetail.top100Spotlight.journeyLabel')}
            </span>
            <span style={{ fontSize: 11, color: '#F7931E', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {t('courseDetail.top100Spotlight.progressPlayed', { played: bestProgress.played, total: bestProgress.total })}
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 999, overflow: 'hidden', background: 'rgba(247,147,30,0.12)' }}>
            <div
              style={{
                height: '100%',
                width: `${(bestProgress.played / bestProgress.total) * 100}%`,
                background: 'linear-gradient(to right, #F59E0B, #F7931E)',
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
