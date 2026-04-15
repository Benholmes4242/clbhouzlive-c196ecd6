import React from 'react';

interface NetworkChallengePromptProps {
  userPlayedCount: number;
  totalCourses: number;
  onSeeCoursesClick?: () => void;
}

const NetworkChallengePrompt: React.FC<NetworkChallengePromptProps> = ({
  userPlayedCount,
  totalCourses,
  onSeeCoursesClick,
}) => {
  if (totalCourses === 0) return null;
  const remaining = totalCourses - userPlayedCount;
  const allPlayed = remaining <= 0;
  const pct = totalCourses > 0 ? Math.round((userPlayedCount / totalCourses) * 100) : 0;

  return (
    <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px' }}>
        <div style={{ width: 34, height: 34, borderRadius: '34%', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>⛳</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
            You've played{' '}
            <span style={{ color: allPlayed ? '#16A34A' : userPlayedCount === 0 ? '#DC2626' : '#16A34A', fontWeight: 900 }}>
              {userPlayedCount}
            </span>{' '}
            of <span style={{ fontWeight: 900 }}>{totalCourses}</span> courses your friends explored
          </div>
          <div style={{ marginTop: '6px', height: '3px', borderRadius: '2px', background: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#16A34A', borderRadius: '2px', transition: 'width 0.4s' }} />
          </div>
        </div>
        <button
          onClick={onSeeCoursesClick}
          style={{ fontSize: '11px', fontWeight: 800, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
        >
          See all →
        </button>
      </div>
    </div>
  );
};

export default NetworkChallengePrompt;
