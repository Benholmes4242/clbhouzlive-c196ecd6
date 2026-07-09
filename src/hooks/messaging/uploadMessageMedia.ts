import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/uploads/imageCompression';
import { getImageDimensions } from '@/utils/imageDimensions';
import type { MessageAttachment } from '@/types/messaging';

function makeUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'audio/webm':
      return 'webm';
    case 'audio/mp4':
    case 'audio/x-m4a':
    case 'audio/m4a':
      return 'm4a';
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    default:
      return 'bin';
  }
}

function asFile(input: File | Blob, fallbackName: string): File {
  if (input instanceof File) return input;
  return new File([input], fallbackName, { type: input.type || 'application/octet-stream' });
}

export async function uploadMessageMedia(params: {
  conversationId: string;
  file: File | Blob;
  kind: 'image' | 'voice';
}): Promise<MessageAttachment> {
  const { conversationId, file, kind } = params;

  let blob: Blob = file;
  let mime = file.type || (kind === 'image' ? 'image/jpeg' : 'audio/webm');
  let width: number | null = null;
  let height: number | null = null;

  if (kind === 'image') {
    const asFileInput = asFile(file, `image.${extFromMime(mime)}`);
    try {
      const result = await compressImage(asFileInput);
      blob = result.file;
      mime = result.file.type || mime;
      width = result.width ?? null;
      height = result.height ?? null;
    } catch {
      // Fall back to original file; still measure dimensions.
      try {
        const dims = await getImageDimensions(asFileInput);
        width = dims.width;
        height = dims.height;
      } catch {
        // ignore; leave nulls
      }
    }
  }

  const uuid = makeUuid();
  const ext = extFromMime(mime);
  const path = `${conversationId}/${uuid}.${ext}`;

  const { error } = await supabase.storage
    .from('message-media')
    .upload(path, blob, { contentType: mime, upsert: false });
  if (error) throw error;

  const attachment: MessageAttachment = {
    path,
    kind,
    w: kind === 'image' ? width : null,
    h: kind === 'image' ? height : null,
    size: blob.size,
    uploadStatus: 'uploaded',
  };
  if (kind === 'voice') {
    attachment.duration = null;
  }
  return attachment;
}
