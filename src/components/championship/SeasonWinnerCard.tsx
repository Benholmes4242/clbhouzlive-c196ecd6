import React from 'react';

interface SeasonWinnerCardProps {
  seasonLabel: string;
  winnerName: string;
  winnerAvatarUrl?: string | null;
  winnerClubName?: string | null;
  winnerCourses: number;
  sponsorName?: string | null;
  prizeDescription?: string | null;
  prizeClaimed?: boolean;
  endDate: string;
}

const GOLD = '#F59E0B';

export const SeasonWinnerCard: React.FC<SeasonWinnerCardProps> = ({
  seasonLabel,
  winnerName,
  winnerAvatarUrl,
  winnerClubName,
  winnerCourses,
  sponsorName,
  prizeDescription,
  prizeClaimed,
  endDate,
}) => {
  const endMonth = new Date(endDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <>
      <style>{`
        @keyframes goldShim { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes crownIn { 0%{opacity:0;transform:translateY(-14px) scale(0.5)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes stampIn { 0%{opacity:0;transform:scale(1.8)} 100%{opacity:1;transform:scale(1)} }
        @keyframes fadeUp { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 18,
          border: `1.5px solid ${GOLD}66`,
          boxShadow: `0 0 32px ${GOLD}1A, 0 4px 20px rgba(0,0,0,0.06)`,
          background: `linear-gradient(135deg, rgba(180,130,0,0.10), rgba(245,158,11,0.03), rgba(180,130,0,0.07))`,
          backgroundSize: '200%',
          animation: 'goldShim 3.5s linear infinite',
        }}
      >
        {/* Gold top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD}33)` }} />

        {/* Gold shimmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 35%, ${GOLD}0A 50%, transparent 65%)`,
            backgroundSize: '200% 100%',
            animation: 'goldShim 4s linear infinite',
          }}
        />

        <div className="relative px-5 pt-4 pb-5" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Stamp badge */}
          <div
            className="flex justify-center"
            style={{ animation: 'stampIn 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.4s both' }}
          >
            <span
              style={{
                padding: '3px 12px',
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: GOLD,
                color: '#1a1a1a',
                borderRadius: 8,
                fontFamily: 'DM Sans,system-ui,sans-serif',
              }}
            >
              {seasonLabel} Champion
            </span>
          </div>

          {/* Winner row */}
          <div
            className="flex items-center gap-3.5 mt-1"
            style={{ animation: 'fadeUp 0.4s ease 0.6s both' }}
          >
            {/* Avatar */}
            <div
              className="flex-shrink-0 overflow-hidden"
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                outline: `2.5px solid ${GOLD}`,
                outlineOffset: 1,
                background: '#f1f5f9',
              }}
            >
              {winnerAvatarUrl ? (
                <img
                  src={winnerAvatarUrl}
                  alt={winnerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ fontSize: 20, fontWeight: 700, color: '#6B7280' }}
                >
                  {winnerName.charAt(0)}
                </div>
              )}
            </div>

            {/* Name & club */}
            <div className="flex-1 min-w-0">
              <p
                className="truncate"
                style={{
                  fontSize: 'clamp(16px,4vw,20px)',
                  fontWeight: 900,
                  color: '#0C0C0E',
                  letterSpacing: '-0.025em',
                  fontFamily: 'DM Sans,system-ui,sans-serif',
                }}
              >
                {winnerName}
              </p>
              {winnerClubName && (
                <p className="truncate" style={{ fontSize: 13, color: '#6B7280', fontFamily: 'DM Sans,system-ui,sans-serif' }}>
                  {winnerClubName}
                </p>
              )}
              <p style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'DM Sans,system-ui,sans-serif', marginTop: 2 }}>
                {endMonth}
              </p>
            </div>

            {/* Courses with crown */}
            <div className="flex-shrink-0" style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 'clamp(16px,4vw,20px)',
                  animation: 'crownIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
                  lineHeight: 1,
                }}
              >
                👑
              </div>
              <p
                style={{
                  fontSize: 'clamp(28px,7vw,36px)',
                  fontWeight: 900,
                  color: GOLD,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'DM Sans,system-ui,sans-serif',
                }}
              >
                {winnerCourses}
              </p>
              <p
                style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: `${GOLD}99`,
                  fontFamily: 'DM Sans,system-ui,sans-serif',
                }}
              >
                courses
              </p>
            </div>
          </div>

          {/* Prize box */}
          {sponsorName && prizeDescription && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                backgroundColor: `${GOLD}0F`,
                border: `1px solid ${GOLD}33`,
                animation: 'fadeUp 0.4s ease 0.8s both',
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', fontFamily: 'DM Sans,system-ui,sans-serif' }}>
                Sponsored by {sponsorName}
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C0E', marginTop: 4, fontFamily: 'DM Sans,system-ui,sans-serif' }}>
                🎁 {prizeDescription}{prizeClaimed ? ' · Claimed ✓' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
