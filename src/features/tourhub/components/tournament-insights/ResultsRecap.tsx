/**
 * ResultsRecap - Post-tournament results summary card
 * Premium editorial scorecard design
 */

import React from 'react';
import { motion } from 'framer-motion';
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

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

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
      className="bg-card rounded-2xl border border-border/50 overflow-hidden"
    >
      {/* Header bar — dark */}
      <div
        style={{
          background: 'hsl(var(--foreground))',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--background))' }}>
            Intelligence Results
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: 'hsl(var(--background) / 0.6)' }}>
            {predictions.tournament.name}
          </span>
        </div>
        {/* Grade badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 6,
            background: grade.bg,
            color: grade.text,
            border: `1px solid ${grade.border}`,
            flexShrink: 0,
          }}
        >
          {grade.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        {/* Accuracy headline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span
            className="text-foreground"
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}
          >
            {accuracy.inTop10}/{accuracy.totalPredictions}
          </span>
          <span
            className="text-muted-foreground"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            picks finished in the Top 10
          </span>
        </div>

        {/* Best call line */}
        {bestCallName && bestCallActual != null && (
          <div
            className="text-muted-foreground"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: '8px 12px',
              background: 'hsl(var(--muted) / 0.5)',
              borderRadius: 8,
            }}
          >
            <span className="text-foreground" style={{ fontWeight: 600 }}>
              {bestCallName}
            </span>
            {' '}— Predicted 1st, finished {bestCallActual}{getOrdinalSuffix(bestCallActual)}
          </div>
        )}
      </div>
    </motion.div>
  );
};