import React from 'react';

export const CinemaFriendCardSkeleton: React.FC = () => (
  <div
    style={{
      height: 280,
      borderRadius: 22,
      background: 'linear-gradient(135deg, rgba(15,23,42,0.04), rgba(15,23,42,0.08))',
      margin: '0 20px 12px',
      animation: 'pulse 2s ease-in-out infinite',
    }}
  />
);

export default CinemaFriendCardSkeleton;
