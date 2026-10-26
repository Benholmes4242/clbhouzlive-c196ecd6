/** BRIEF_HOLE_TAG_BATCH_V3 confirmation copy, shared by the batch window and
 * the single-shot toast so both read the same words. */
import { ordinal } from '@/lib/text/numbers';
import { holeOrdinal } from './holeWalk';

/** count = the member's non-rejected tags on that hole, including this one. */
export function memberTagConfirmation(hole: number, count: number): string {
  return count <= 1
    ? `Tag confirmed on the ${ordinal(hole)}.`
    : `Tag confirmed. This is your ${holeOrdinal(count)} tag on the ${ordinal(hole)}.`;
}

export function adminTagConfirmation(hole: number, ownerName?: string | null): string {
  return ownerName ? `Tag confirmed on the ${ordinal(hole)} for ${ownerName}.` : `Tag confirmed on the ${ordinal(hole)}.`;
}
