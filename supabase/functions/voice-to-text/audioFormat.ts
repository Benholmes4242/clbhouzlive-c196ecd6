/** MIME is a description of source bytes, never a conversion. Preserve it in
 * the multipart Blob and select the matching Whisper filename extension.
 */
export function audioFormat(mimeType?: string | null) {
  const type = mimeType || 'audio/webm';
  const base = type.toLowerCase().split(';')[0].trim();
  const extension = base.includes('mp4') || base.includes('aac') || base.includes('m4a') ? 'm4a'
    : base.includes('ogg') ? 'ogg' : base.includes('wav') ? 'wav'
    : base.includes('mpeg') ? 'mp3' : base.includes('webm') ? 'webm' : 'bin';
  return { mimeType: type, filename: `audio.${extension}` };
}