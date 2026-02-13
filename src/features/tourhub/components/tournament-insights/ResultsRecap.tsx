/**
 * ResultsRecap - Post-tournament results summary card
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2 } from 'lucide-react';
import type { AccuracyMetrics } from './types';
import type { AIPredictionData } from '../../hooks/useAIPredictions';

interface ResultsRecapProps {
  predictions: AIPredictionData;
  accuracy: AccuracyMetrics;
  bestCallName?: string;
  bestCallPredicted?: number;
  bestCallActual?: number;
}

const GRADE_STYLES: Record<AccuracyMetrics['overallGrade'], { bg: string; text: string; border: string; label: string }> = {
  excellent: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: 'Excellent' },
  good: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', label: 'Good' },
  mixed: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'Mixed' },
  poor: { bg: '#f9fafb', text: '#4b5563', border: '#e5e7eb', label: 'Poor' },
};

export const ResultsRecap: React.FC<ResultsRecapProps> = ({
  predictions,
  accuracy,
  bestCallName,
  bestCallPredicted,
  bestCallActual,
}) => {
  const grade = GRADE_STYLES[accuracy.overallGrade];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl bg-card border border-border overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4" style={{ color: '#B8860B' }} />
          <span className="text-sm font-semibold text-foreground">
            Clbhouz Intelligence Results
          </span>
        </div>

        {/* Tournament name */}
        <p className="text-xs text-muted-foreground mb-3">
          {predictions.tournament.name}
        </p>

        {/* Accuracy */}
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: '#059669' }} />
          <span className="text-sm font-medium text-foreground">
            {accuracy.accuracyLabel}
          </span>
        </div>

        {/* Grade */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
              backgroundColor: grade.bg,
              color: grade.text,
              border: `1px solid ${grade.border}`,
            }}
          >
            Grade: {grade.label}
          </span>
        </div>

        {/* Best call */}
        {bestCallName && (
          <p className="text-xs text-muted-foreground">
            Best call: {bestCallName} (Predicted {bestCallPredicted}
            {bestCallPredicted === 1 ? 'st' : bestCallPredicted === 2 ? 'nd' : bestCallPredicted === 3 ? 'rd' : 'th'},
            Finished {bestCallActual}
            {bestCallActual === 1 ? 'st' : bestCallActual === 2 ? 'nd' : bestCallActual === 3 ? 'rd' : 'th'})
          </p>
        )}
      </div>
    </motion.div>
  );
};
