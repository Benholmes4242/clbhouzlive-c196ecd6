import React from 'react';

interface SeasonSponsorCardProps {
  sponsorName: string;
  prizeDescription: string;
  seasonColor: string;
  seasonLabel: string;
  leaderCourses: number;
  yourCourses: number;
  yourSeasonRank: number;
  totalSeasonPlayers: number;
  daysRemaining: number;
}

const GREEN = '#006747';
const GREEN_DARK = '#004d36';
const GREEN_MID = '#3EBD93';
const GREEN_LIGHT = '#E8F5EF';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const SeasonSponsorCard: React.FC<SeasonSponsorCardProps> = ({
  sponsorName,
  prizeDescription,
  seasonLabel,
  leaderCourses,
  yourCourses,
  yourSeasonRank,
  totalSeasonPlayers,
}) => {
  const gap = Math.max(0, leaderCourses - yourCourses);
  const progressPercent = leaderCourses > 0 ? Math.min(100, (yourCourses / leaderCourses) * 100) : 0;
  const isLeading = yourCourses > 0 && yourCourses >= leaderCourses;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 18,
        border: `1.5px solid ${GREEN}20`,
        boxShadow: `0 0 24px ${GREEN}08, 0 4px 16px rgba(0,0,0,0.05)`,
        background: `linear-gradient(150deg, ${GREEN}08, ${GREEN}02)`,
      }}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 35%, ${GREEN}06 50%, transparent 65%)`,
          backgroundSize: '200% 100%',
          animation: 'shimS 4s linear infinite',
        }}
      />

      {/* Top accent bar */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${GREEN}, ${GREEN}30)`,
        }}
      />

      <div className="relative px-4 py-4 space-y-3">
        {/* Sponsored-by row */}
        <div className="flex items-start justify-between">
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6B7280',
                fontFamily: 'DM Sans,system-ui,sans-serif',
              }}
            >
              Season Sponsored By
            </p>
            <p
              style={{
                fontSize: 'clamp(16px,4vw,20px)',
                fontWeight: 900,
                color: '#0C0C0E',
                fontFamily: 'DM Sans,system-ui,sans-serif',
                marginTop: 2,
              }}
            >
              {sponsorName}
            </p>
          </div>
          <span
            className="flex-shrink-0"
            style={{
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 99,
              backgroundColor: GREEN,
              color: 'white',
              fontFamily: 'DM Sans,system-ui,sans-serif',
            }}
          >
            🏆 Prize
          </span>
        </div>

        {/* Prize box */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            backgroundColor: `${GREEN}08`,
            border: `1px solid ${GREEN}15`,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: GREEN, fontFamily: 'DM Sans,system-ui,sans-serif' }}>
            🎁 {prizeDescription}
          </p>
          <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4, fontFamily: 'DM Sans,system-ui,sans-serif' }}>
            Most Top 100 courses played during {seasonLabel}
          </p>
        </div>

        {/* Race progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, fontWeight: 500, color: '#0C0C0E', fontFamily: 'DM Sans,system-ui,sans-serif' }}>
              You — {yourCourses} this season
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: GREEN, fontFamily: 'DM Sans,system-ui,sans-serif' }}>
              Leader — {leaderCourses}
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: 4,
                background: `linear-gradient(90deg, ${GREEN}, ${GREEN_MID})`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans,system-ui,sans-serif' }}>
              {yourCourses === 0 ? 'Play a course to start' : isLeading ? "You're in the lead! 🔥" : `${gap} courses behind the lead`}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: GREEN, fontFamily: 'DM Sans,system-ui,sans-serif' }}>
              {yourSeasonRank === 0 ? '—' : ordinal(yourSeasonRank)} of {totalSeasonPlayers}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimS {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};

export default SeasonSponsorCard;
