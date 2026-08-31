/**
 * Lead image upload — a SECOND WAY to fill the Image URL field, never a
 * replacement. The URL box stays authoritative and typeable at all times,
 * including while an upload is in flight.
 *
 * Uses the `cloudflare-r2-upload` edge function (real SigV4 signing, bearer
 * auth). NOT `r2-upload`, whose Authorization header is a placeholder and
 * cannot authenticate.
 *
 * REPLACING AN IMAGE DOES NOT DELETE THE OLD OBJECT, deliberately. An editorial
 * image may already be live on a published story or cached in a link preview;
 * deleting on replace risks breaking a story someone is reading. Orphaned
 * objects are cheap. Do not "tidy this up" by wiring in a delete.
 *
 * No compression, resizing or re-encoding: lead images are editorial
 * photography and silently degrading a press photo is worse than a large file.
 */
import React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../../theme';

const MAX_BYTES = 10 * 1024 * 1024;

export function LeadImageUpload({
  onUploaded,
  disabled,
}: {
  onUploaded: (publicUrl: string) => void;
  disabled?: boolean;
}) {
  const ref = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset immediately so picking the same file twice re-fires change.
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('That is not an image.');
      return;
    }
    if (file.type === 'image/svg+xml') {
      toast.error('SVG is not allowed for lead images.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('That image is over 10MB. Compress it first.');
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in.');

      const form = new FormData();
      form.append('file', file);
      form.append('fileName', file.name);
      form.append('bucketType', 'news');

      const { data, error } = await supabase.functions.invoke('cloudflare-r2-upload', {
        body: form,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw new Error(error.message);
      const url = (data as any)?.publicUrl as string | undefined;
      if (!(data as any)?.success || !url) {
        throw new Error((data as any)?.error || 'Upload failed. Paste a URL instead.');
      }

      onUploaded(url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Upload failed. Paste a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled || uploading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', padding: 0,
          fontSize: 11, fontFamily: 'inherit', color: t.inkFaint,
          cursor: disabled || uploading ? 'default' : 'pointer',
        }}
      >
        {uploading ? <Loader2 size={11} className="animate-spin" /> : null}
        {uploading ? 'Uploading…' : 'Upload an image'}
      </button>
    </div>
  );
}

export default LeadImageUpload;
