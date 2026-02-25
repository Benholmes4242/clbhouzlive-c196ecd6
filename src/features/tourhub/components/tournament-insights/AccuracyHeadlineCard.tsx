/**
 * AccuracyHeadlineCard - Shows prediction accuracy summary with progress bar and grade
 * Flat card — no shadow (matches flat card standard)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import type { AccuracyMetrics } from './types';

interface AccuracyHeadlineCardProps {
  accuracy: AccuracyMetrics;
  lastUpdated: string;
}

const GRADE_STYLES: Record<AccuracyMetrics['overallGrade'], { bg: string; text: string; border: string; label: string }> = {
  excellent: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: 'Excellent' },
  good: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', label: 'Good' },
  mixed: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'Mixed' },
  poor: { bg: '#f9fafb', text: '#4b5563', border: '#e5e7eb', label: 'Poor' },
};

function getTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

export const AccuracyHeadlineCard: React.FC<AccuracyHeadlineCardProps> = ({
  accuracy,
  lastUpdated,
}) => {
  const grade = GRADE_STYLES[accuracy.overallGrade];
  const progressPct = Math.round((accuracy.inTop10 / Math.max(accuracy.totalPredictions, 1)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl bg-card border border-border/50 overflow-hidden"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4" style={{ color: '#B8860B' }} />
          <span className="text-sm font-semibold text-foreground">
            Tournament Intelligence Tracker
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-2.5 w-full rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #FFB800, #FF8C00)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
          </div>
          <p className="text-sm font-medium text-foreground mt-2">
            {accuracy.accuracyLabel}
          </p>
        </div>

        {/* Grade + timestamp */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
              backgroundColor: grade.bg,
              color: grade.text,
              border: `1px solid ${grade.border}`,
            }}
          >
            {grade.label}
          </span>
          <span className="text-xs text-muted-foreground">
            · Updated {getTimeAgo(lastUpdated)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
