/**
 * Hook to provide fixed mock data when in Design Review Mode
 */

import { useDesignReview } from '../DesignReviewContext';
import {
  FIXED_NEARBY_GOLFERS,
  FIXED_GAME_BEACONS,
  FIXED_MY_BEACON,
} from '../fixtures';
import { NearbyGolfer } from '@/features/nearby/types';
import { GameBeacon } from '@/features/nearby/hooks/useGameBeacon';

interface ReviewDataOverrides {
  nearbyGolfers?: NearbyGolfer[];
  gameBeacons?: GameBeacon[];
  myBeacon?: GameBeacon | null;
}

export const useReviewData = () => {
  const { isReviewMode, currentState } = useDesignReview();

  if (!isReviewMode) {
    return null;
  }

  const overrides: ReviewDataOverrides = {};

  // Provide data based on current state
  switch (currentState?.id) {
    case 'nearby-07-golfers-list':
      overrides.nearbyGolfers = FIXED_NEARBY_GOLFERS;
      break;

    case 'nearby-08-games-list':
      overrides.gameBeacons = FIXED_GAME_BEACONS;
      break;

    case 'creategame-01-open-modal':
    case 'creategame-02-game-type':
    case 'creategame-03-location':
    case 'creategame-04-note':
    case 'creategame-05-timing':
    case 'creategame-06-players':
    case 'creategame-07-handicaps':
    case 'creategame-08-submit':
      // Show empty form for create states
      overrides.myBeacon = null;
      break;

    default:
      // Default: show some golfers and beacons
      overrides.nearbyGolfers = FIXED_NEARBY_GOLFERS;
      overrides.gameBeacons = FIXED_GAME_BEACONS;
      overrides.myBeacon = null;
  }

  return overrides;
};
