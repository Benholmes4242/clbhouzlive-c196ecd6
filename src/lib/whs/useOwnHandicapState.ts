/** Shared own-handicap presentation; pro status never mutates WHS connections.
 * Only ChromeIsland opts into profile-only verification readiness; all other
 * consumers retain full request settlement, so pending/rejected reads stay authoritative. */
import { useHandicapChipState } from './useHandicapChipState';
import { useMyProStatus } from '@/features/pro-verification/useMyProStatus';
export function useOwnHandicapState(userId: string | undefined, options?: { island?: boolean }) {
  const chip = useHandicapChipState(userId);
  const status = useMyProStatus(userId);
  return { ...chip, pro: status.verified, proPending: status.pending, noHandicap: status.verified || status.pending, proKind: status.kind, proTour: status.tour,
    proClub: status.club, settled: chip.settled && (options?.island ? status.verifiedKnown : !status.unknown) };
}
