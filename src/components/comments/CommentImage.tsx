import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CommentImageProps {
  mediaUrl: string;
  isDark?: boolean;
}

export const CommentImage: React.FC<CommentImageProps> = ({ mediaUrl, isDark }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    supabase.storage
      .from('comment-images')
      .createSignedUrl(mediaUrl, 3600)
      .then(({ data, error }) => {
        if (data?.signedUrl) setSignedUrl(data.signedUrl);
        else setHasError(true);
      });
  }, [mediaUrl]);

  if (hasError) return null;

  if (!signedUrl) {
    return (
      <div className={cn(
        "w-full h-32 rounded-lg animate-pulse mt-1.5 mb-1",
        isDark ? "bg-white/8" : "bg-muted/60"
      )} />
    );
  }

  return (
    <>
      <img
        src={signedUrl}
        alt="Comment attachment"
        className="w-full max-h-48 object-cover rounded-lg cursor-pointer mt-1.5 mb-1"
        onClick={() => setIsExpanded(true)}
        onError={() => setHasError(true)}
      />
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center"
            onClick={() => setIsExpanded(false)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              onClick={() => setIsExpanded(false)}
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <img src={signedUrl} alt="" className="max-w-full max-h-full object-contain p-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
