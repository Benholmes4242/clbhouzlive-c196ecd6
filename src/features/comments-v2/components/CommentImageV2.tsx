/**
 * CommentImageV2 — full-width in-card image renderer for image comments.
 * Signs the storage URL (comment-images bucket) and opens a lightweight
 * fullscreen viewer on tap.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  mediaUrl: string;
  height?: number;
}

export function CommentImageV2({ mediaUrl, height = 140 }: Props) {
  const [signed, setSigned] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Support both storage-path values and already-absolute URLs.
    if (/^https?:\/\//.test(mediaUrl)) {
      setSigned(mediaUrl);
      return;
    }
    supabase.storage
      .from('comment-images')
      .createSignedUrl(mediaUrl, 3600)
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.signedUrl) setSigned(data.signedUrl);
        else setErr(true);
      });
    return () => { cancelled = true; };
  }, [mediaUrl]);

  if (err) return null;
  if (!signed) {
    return (
      <div
        className="w-full rounded-[12px] mt-2"
        style={{ height, background: 'rgba(255,255,255,0.08)' }}
      />
    );
  }

  const viewer = open ? createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[13000] bg-black/95 flex items-center justify-center"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          style={{ top: 'max(env(safe-area-inset-top, 0px), 16px)' }}
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <img
          src={signed}
          alt=""
          className="max-w-full max-h-full object-contain p-4"
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full mt-2 overflow-hidden rounded-[12px] block bg-white/[0.06]"
        style={{ height, border: 0, padding: 0, cursor: 'zoom-in' }}
        aria-label="Open image"
      >
        <img
          src={signed}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
          loading="lazy"
        />
      </button>
      {viewer}
    </>
  );
}

export default CommentImageV2;
