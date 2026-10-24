/** Photo identity, not an already-used hole, is the duplicate boundary.
 * Keep one message owner for single, library, batch and retag displays.
 */
/** Specific known failures pass through verbatim; only an unknown error falls
 * back to the caller's generic message. */
const KNOWN_MESSAGES = [
  /^That (photo|photograph|video) is already tagged\.$/,
  /^This (photo|photograph|video) is not yours at this course\.$/,
  /^This (photo|photograph|video) cannot be tagged\.$/,
  /^Please sign in again before tagging\.$/,
];
export function holePhotoErrorMessage(error: unknown, fallback = 'The photograph could not be tagged. The tag was not saved.', mediaType: 'image' | 'video' = 'image'): string {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
    return mediaType === 'video' ? 'That video is already tagged.' : 'That photo is already tagged.';
  }
  if (error instanceof Error && KNOWN_MESSAGES.some(pattern => pattern.test(error.message))) return error.message;
  return fallback;
}