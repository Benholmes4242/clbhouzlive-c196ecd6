/**
 * CB71 — post images are never saved without a file extension.
 *
 * `imageUploadFileName` builds the fileName every post-image upload sends to
 * cloudflare-r2-upload (which keys the object on that name's extension). The
 * extension comes from the uploaded File's MIME type first, then the original
 * name's extension, then `.jpeg` — never empty, never a trailing dot.
 *
 * `assertSavableImageUrl` is the save guard: a post / post edit only writes an
 * image row for the publicUrl the upload returned, and only when that URL ends
 * in a known image extension. Anything else throws into the caller's existing
 * upload-failed path.
 */

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/pjpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export const KNOWN_IMAGE_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif', 'gif', 'avif'] as const;

/** Chosen fallback for an empty-type file whose name has no usable extension:
 *  JPEG is what the compressor and canvas bakes emit by default. */
export const FALLBACK_IMAGE_EXT = 'jpeg';

function nameExtension(name: string | undefined | null): string | null {
  if (!name) return null;
  const m = /\.([a-z0-9]{2,5})$/i.exec(name.trim());
  if (!m) return null;
  const ext = m[1].toLowerCase();
  return (KNOWN_IMAGE_EXTENSIONS as readonly string[]).includes(ext) ? ext : null;
}

/** The extension (no dot) for an image File. Never empty. */
export function imageExtensionFor(file: Pick<File, 'type' | 'name'>): string {
  const byType = MIME_EXT[(file.type || '').toLowerCase().split(';')[0].trim()];
  return byType ?? nameExtension(file.name) ?? FALLBACK_IMAGE_EXT;
}

/** `${base}.${ext}` with base stripped of trailing dots and any existing
 *  extension the caller may have appended. */
export function imageUploadFileName(file: Pick<File, 'type' | 'name'>, base: string): string {
  const stem = base.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/\.+$/, '') || `${Date.now()}`;
  return `${stem}.${imageExtensionFor(file)}`;
}

export function isSavableImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  let path = url;
  try { path = new URL(url).pathname; } catch { /* relative or bare: test as-is */ }
  return nameExtension(path) !== null;
}

/** Throws unless `url` is the upload's returned publicUrl with a known image
 *  extension. Callers already treat a throw as a failed upload. */
export function assertSavableImageUrl(url: string | null | undefined, returnedPublicUrl?: string | null): string {
  if (returnedPublicUrl !== undefined && url !== returnedPublicUrl) {
    throw new Error('Image upload failed: saved URL is not the uploaded file');
  }
  if (!isSavableImageUrl(url)) {
    throw new Error('Image upload failed: uploaded file has no image extension');
  }
  return url as string;
}
