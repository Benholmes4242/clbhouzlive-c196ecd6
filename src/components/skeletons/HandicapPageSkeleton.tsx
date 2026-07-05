import React from 'react';

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1B1E27 25%, #20242E 50%, #1B1E27 75%)',
  backgroundSize: '200% 100%',
  animation: 'hcpSkelWave 1.4s ease-in-out infinite',
  borderRadius: 12,
};

export const HandicapPageSkeleton: React.FC = () => (
  <div
    className="min-h-screen w-full"
    style={{
      background: '#15171F',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
    }}
  >
    <style>{`
      @keyframes hcpSkelWave {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>

    {/* Header area */}
    <div className="px-4 pt-2 pb-4">
      <div style={{ ...shimmer, width: '40%', height: 28, marginBottom: 16 }} />
      <div style={{ ...shimmer, width: '65%', height: 20, borderRadius: 8 }} />
    </div>

    {/* Hero stats row */}
    <div className="flex gap-3 px-4 pb-5">
      <div style={{ ...shimmer, flex: 1, height: 96 }} />
      <div style={{ ...shimmer, flex: 1, height: 96 }} />
      <div style={{ ...shimmer, flex: 1, height: 96 }} />
    </div>

    {/* Section tabs */}
    <div className="flex gap-3 px-4 pb-5">
      <div style={{ ...shimmer, width: 80, height: 32, borderRadius: 8 }} />
      <div style={{ ...shimmer, width: 80, height: 32, borderRadius: 8 }} />
      <div style={{ ...shimmer, width: 80, height: 32, borderRadius: 8 }} />
    </div>

    {/* Large content block */}
    <div className="px-4 pb-4">
      <div style={{ ...shimmer, width: '55%', height: 18, marginBottom: 12 }} />
      <div style={{ ...shimmer, width: '100%', height: 180 }} />
    </div>

    {/* List rows */}
    <div className="px-4 space-y-3 pb-4">
      <div style={{ ...shimmer, width: '100%', height: 64 }} />
      <div style={{ ...shimmer, width: '100%', height: 64 }} />
      <div style={{ ...shimmer, width: '100%', height: 64 }} />
      <div style={{ ...shimmer, width: '100%', height: 64 }} />
    </div>

    {/* Bottom spacer for safe area */}
    <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
  </div>
);
