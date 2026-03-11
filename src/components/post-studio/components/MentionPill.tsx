// MentionPill — Orange pill for @mentions in captions
import React from 'react';
import { motion } from 'framer-motion';
import { SPRING } from '../constants';

interface MentionPillProps {
  displayName: string;
  onClick?: () => void;
}

export function MentionPill({ displayName, onClick }: MentionPillProps) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', ...SPRING.pill }}
      onClick={onClick}
      className="inline-flex items-center bg-primary/15 text-primary rounded-full px-2 py-0.5 text-sm font-medium cursor-pointer"
    >
      @{displayName}
    </motion.span>
  );
}
