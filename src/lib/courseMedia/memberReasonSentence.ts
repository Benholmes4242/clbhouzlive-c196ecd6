/** Single contributor vocabulary for coded hole-photo rejection reasons.
 * Internal moderator notes are never accepted or returned by this helper.
 */
export const memberReasonSentence = (code: string | null): string => {
  switch (code) {
    case 'not_a_golf_hole':
      return 'The photo did not show a golf hole.';
    case 'wrong_hole':
      return 'The photo did not appear to be the hole it was submitted for.';
    case 'poor_quality':
      return 'The photo was not clear enough to use.';
    case 'not_your_photo':
      return 'We could not confirm the photo was taken by you.';
    case 'replaced':
      return 'Another photo is now live on this hole.';
    default:
      return 'The photo was not a fit for this hole.';
  }
};