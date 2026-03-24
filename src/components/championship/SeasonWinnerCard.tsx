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

/**
 * SeasonWinnerCard — Gold champion card for completed season winners.
 * Renders above Hall of Fame in all-time mode.
 */
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
        @keyframes shimmerGold {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes crownDrop {
          0% { opacity: 0; transform: translateY(-20px) scale(0.5); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes stampIn {
          0% { opacity: 0; transform: scale(2.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(180,130,0,0.12), rgba(245,158,11,0.04), rgba(180,130,0,0.08))',
          backgroundSize: '200%',
          animation: 'shimmerGold 3.5s linear infinite',
        }}
      >
        <div
          className="overflow-hidden"
          style={{
            border: '1.5px solid rgba(245,158,11,0.4)',
            borderRadius: 20,
            boxShadow: '0 0 32px rgba(245,158,11,0.12), 0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          {/* Top bar */}
          <div
            className="h-[3px] w-full"
            style={{ background: 'linear-gradient(90deg, #F59E0B, rgba(245,158,11,0.2))' }}
          />

          <div className="px-5 pt-4 pb-5 space-y-3">
            {/* Crown */}
            <div
              className="text-center text-[28px]"
              style={{ animation: 'crownDrop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}
            >
              👑
            </div>

            {/* Stamp badge */}
            <div
              className="flex justify-center"
              style={{ animation: 'stampIn 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.4s both' }}
            >
              <span
                className="px-3 py-1 text-xs font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#1a1a1a',
                  borderRadius: 8,
                }}
              >
                {seasonLabel} Champion
              </span>
            </div>

            {/* Winner row */}
            <div
              className="flex items-center gap-3.5 mt-3.5"
              style={{ animation: 'fadeUp 0.4s ease 0.6s both' }}
            >
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl bg-muted flex-shrink-0 overflow-hidden"
                style={{ outline: '2.5px solid #F59E0B', outlineOffset: 1 }}
              >
                {winnerAvatarUrl ? (
                  <img
                    src={winnerAvatarUrl}
                    alt={winnerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                    {winnerName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name & club */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xl font-black text-foreground truncate"
                  style={{ letterSpacing: '-0.025em' }}
                >
                  {winnerName}
                </p>
                {winnerClubName && (
                  <p className="text-[13px] text-muted-foreground truncate">
                    {winnerClubName}
                  </p>
                )}
              </div>

              {/* Courses */}
              <div className="text-right flex-shrink-0">
                <p className="text-[32px] font-black leading-none" style={{ color: '#F59E0B' }}>
                  {winnerCourses}
                </p>
                <p
                  className="text-[9px] uppercase font-semibold tracking-wider"
                  style={{ color: 'rgba(245,158,11,0.6)' }}
                >
                  courses
                </p>
              </div>
            </div>

            {/* Prize box */}
            {sponsorName && prizeDescription && (
              <div
                className="px-3.5 py-3 mt-2"
                style={{
                  borderRadius: 12,
                  backgroundColor: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  animation: 'fadeUp 0.4s ease 0.8s both',
                }}
              >
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Sponsored by {sponsorName}
                </p>
                <p className="text-sm font-bold text-foreground mt-1">
                  🎁 {prizeDescription}
                </p>
                {prizeClaimed && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Awarded {endMonth} · Claimed ✓
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
