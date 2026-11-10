import { supabase } from '@/integrations/supabase/client';

/** Convert a Blob to a base64 string (no data: prefix). */
async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Record blob → Whisper text via the existing voice-to-text edge function. */
export async function transcribeAudio(blob: Blob, opts?: { prompt?: string }): Promise<string> {
  const audio = await blobToBase64(blob);
  const { data, error } = await supabase.functions.invoke('voice-to-text', {
    body: opts?.prompt ? { audio, mimeType: blob.type, prompt: opts.prompt } : { audio, mimeType: blob.type },
  });
  if (error) throw error;
  if (typeof data?.text !== 'string') throw new Error('No transcription returned');
  return (data.text as string).trim();
}
