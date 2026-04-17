import React from 'react';
import { useTop100CourseInsights } from '@/hooks/useTop100CourseInsights';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type CourseTop100SpotlightProps = {
  courseId: string;
  courseName: string;
};

export const CourseTop100Spotlight: React.FC<CourseTop100SpotlightProps> = ({
  courseId,
  courseName,
}) => {
  const { data, isLoading } = useTop100CourseInsights(courseId);
  const { user } = useSupabaseSession();
  const { data: top100Progress } = useTop100ProgressForUser(user?.id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)',
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
    navigate(`/top100?list=${listSlug}`);
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
        background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)',
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
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>Top 100 Spotlight</h3>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
            Appears in {listCount} prestigious {listCount === 1 ? 'list' : 'lists'}
          </p>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }}>
        {data.list_memberships.map((list) => {
          const progress = progressBySlug.get(list.list_slug);
          const value = progress ? `${progress.played}/${progress.total}` : '—';

          return (
            <button
              key={list.list_slug}
              type="button"
              onClick={() => handleChipTap(list.list_slug)}
              style={{
                flex: '1 1 calc(50% - 4px)',
                minWidth: 0,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(247,147,30,0.18)',
                borderRadius: 10,
                padding: '10px 12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: '#F7931E', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                {value}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#CBD5E1', marginTop: 4, lineHeight: 1.3 }}>
                {list.list_name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress strip */}
      {bestProgress && bestProgress.played > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px solid rgba(247,147,30,0.18)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Your Top 100 Journey
            </span>
            <span style={{ fontSize: 11, color: '#F7931E', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {bestProgress.played} of {bestProgress.total} played
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
