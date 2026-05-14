import React from 'react';

export const CinemaCardSkeleton: React.FC = () => (
  <div
    className="animate-pulse"
    style={{
      width: '100%',
      height: 384,
      borderRadius: 24,
      background: 'rgba(15,23,42,0.06)',
      border: '0.5px solid rgba(15,23,42,0.07)',
    }}
  />
);

export default CinemaCardSkeleton;
