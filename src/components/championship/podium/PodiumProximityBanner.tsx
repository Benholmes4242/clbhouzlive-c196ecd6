import React from 'react';
import { usePodiumProximity } from '@/hooks/championship/usePodiumProximity';
import { PodiumMode, PodiumScope } from '@/types/podium';

interface PodiumProximityBannerProps {
  userId?: string;
  mode: PodiumMode;
  scope: PodiumScope;
  divisionId?: string;
}

export const PodiumProximityBanner: React.FC<PodiumProximityBannerProps> = ({
  userId,
  mode,
  scope,
  divisionId,
}) => {
  const { data: proximity } = usePodiumProximity({
    userId,
    mode,
    scope,
    divisionId,
  });

  if (!proximity || proximity.is_on_podium || proximity.courses_to_podium > 5) {
    return null;
  }

  return (
    <div className="text-center text-sm text-muted-foreground py-2">
      You're{' '}
      <span className="font-semibold text-primary">
        {proximity.courses_to_podium} course{proximity.courses_to_podium !== 1 ? 's' : ''}
      </span>{' '}
      from the podium
    </div>
  );
};
