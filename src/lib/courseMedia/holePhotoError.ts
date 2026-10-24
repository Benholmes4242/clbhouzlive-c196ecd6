/** Photo identity, not an already-used hole, is the duplicate boundary.
 * Keep one message owner for single, library, batch and retag displays.
 */
export function holePhotoErrorMessage(error: unknown, fallback = 'The photograph could not be tagged. The tag was not saved.', mediaType: 'image' | 'video' = 'image'): string {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
    return mediaType === 'video' ? 'That video is already tagged.' : 'That photo is already tagged.';
  }
  return fallback;
}