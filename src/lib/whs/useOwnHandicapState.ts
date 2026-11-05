/** Shared own-handicap presentation; pro status never mutates WHS connections. */
import { useHandicapChipState } from './useHandicapChipState';
import { useMyProStatus } from '@/features/pro-verification/useMyProStatus';
export function useOwnHandicapState(userId: string | undefined) {
  const chip = useHandicapChipState(userId);
  const status = useMyProStatus(userId);
  return { ...chip, pro: status.verified, proKind: status.kind, proTour: status.tour,
    proClub: status.club, settled: chip.settled && !status.unknown };
}
