// SuccessScreen — Step 6: Upload queued celebration
// Amber halo checkmark + eyebrow label + live upload progress

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { UploadBanner } from '../components/UploadBanner';
import { DURATION } from '../constants';

interface SuccessScreenProps {
  onDone: () => void;
}

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 bg-clbhouzBg">
      {/* Animated checkmark with amber halo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ duration: DURATION.successCheck, ease: 'easeOut' }}
        className="flex items-center justify-center"
      >
        <div className="w-28 h-28 rounded-full bg-primary/15 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-10 h-10 text-primary-foreground" strokeWidth={3} />
          </div>
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-2"
      >
        <p className="text-[11px] font-semibold text-primary uppercase tracking-[1.5px]">POST QUEUED</p>
        <h2 className="text-foreground text-xl font-bold">Uploading in background</h2>
        <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">
          Your post will appear once uploaded. You can keep using clbhouz.
        </p>
      </motion.div>

      {/* Upload progress banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm"
      >
        <UploadBanner />
      </motion.div>

      {/* Done button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onDone}
        className="w-full max-w-sm py-3.5 rounded-xl bg-muted text-foreground font-semibold text-sm min-h-[48px]"
      >
        Done
      </motion.button>
    </div>
  );
}
