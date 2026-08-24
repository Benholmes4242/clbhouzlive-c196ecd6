/**
 * TournamentPageSkeleton — Suspense fallback for /tourhub/tournament/:id AND
 * the in-page meta-loading hold (imported by TournamentPage). Hero bone uses
 * the exact HERO_MIN_H formula from tournament-v2 HeroSection so the swap is
 * jump-free.
 */
import { Skeleton } from '@/components/ui/skeleton';
import { HERO_MIN_H } from '@/features/tourhub/_shared/tokens';

const SLATE_50 = '#15171F';
const HAIRLINE_INK_8 = 'rgba(15,23,42,0.08)';

export const TournamentPageSkeleton = () => {
  return (
    <div style={{ background: SLATE_50, minHeight: '100dvh' }}>
      {/* Hero bone — dark hold at the real hero height, content bottom-anchored
          like the real masthead */}
      <div
        style={{
          minHeight: HERO_MIN_H,
          background: '#0A0E14',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 16px calc(env(safe-area-inset-bottom, 0px) + 20px)',
          gap: 10,
        }}
      >
        <Skeleton variant="dark" style={{ width: 90, height: 10, borderRadius: 4 }} />
        <Skeleton variant="dark" style={{ width: '70%', height: 26, borderRadius: 6 }} />
        <Skeleton variant="dark" style={{ width: 140, height: 12, borderRadius: 4 }} />
      </div>

      {/* Body bones — eyebrow + four board-ish rows */}
      <div style={{ padding: 16 }}>
        <Skeleton style={{ width: 90, height: 10, borderRadius: 4, marginBottom: 10 }} />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
            }}
          >
            <Skeleton style={{ width: 28, height: 12, borderRadius: 4 }} />
            <Skeleton style={{ flex: 1, height: 12, borderRadius: 4 }} />
            <Skeleton style={{ width: 40, height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentPageSkeleton;
