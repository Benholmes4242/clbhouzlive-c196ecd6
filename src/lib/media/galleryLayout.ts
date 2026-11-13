/** Every member-shot open (course media tab, Courses page “Through members' eyes”
 * and latest holes rails, shot tag card) shows media exactly as the course media
 * tab does. Rect, backdrop, gradient and notch protection share this predicate
 * so presentation cannot drift while chrome and synthetic request gates stay separate. */
export function usesGalleryLayout(s: { courseGallery: unknown; syntheticPosts: boolean }): boolean {
  return !!s.courseGallery || !!s.syntheticPosts;
}