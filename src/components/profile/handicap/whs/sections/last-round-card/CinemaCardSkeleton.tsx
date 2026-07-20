import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const CinemaCardSkeleton: React.FC = () => (
  <Skeleton
    variant="dark"
    style={{
      width: '100%',
      height: 384,
      borderRadius: 24,
      border: '0.5px solid rgba(255,255,255,0.07)',
    }}
  />
);

export default CinemaCardSkeleton;
