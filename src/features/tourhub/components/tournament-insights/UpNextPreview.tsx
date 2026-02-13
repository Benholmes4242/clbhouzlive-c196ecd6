/**
 * UpNextPreview - Compact card showing next tournament preview
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import type { NextTournamentPreview as NextTournamentPreviewType } from './types';

interface UpNextPreviewProps {
  preview: NextTournamentPreviewType;
}

function formatDateRange(startDate: string): string {
  try {
    return format(parseISO(startDate), 'MMM d');
  } catch {
    return startDate;
  }
}

export const UpNextPreview: React.FC<UpNextPreviewProps> = ({ preview }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: '#f9fafb',
        borderColor: 'rgba(0, 0, 0, 0.05)',
      }}
    >
      <p
        className="uppercase font-bold tracking-wider mb-1"
        style={{ fontSize: '10px', color: '#9ca3af' }}
      >
        Up Next
      </p>
      <p className="text-sm font-semibold text-foreground">
        {preview.name}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {preview.courseName} · {formatDateRange(preview.startDate)}
      </p>
      {preview.hasPredictions && (
        <p
          className="text-xs font-medium mt-2"
          style={{ color: '#d97706' }}
        >
          Predictions ready →
        </p>
      )}
    </motion.div>
  );
};
