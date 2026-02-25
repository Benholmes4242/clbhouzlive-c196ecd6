/**
 * ResultsRecap - Post-tournament results summary card
 * Premium editorial scorecard with grade, accuracy breakdown, and best call
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

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const GRADE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  excellent: { label: 'A+', bg: 'rgba(34,197,94,0.12)', text: 'rgba(34,197,94,0.9)' },
  good:      { label: 'B+', bg: 'rgba(59,130,246,0.12)', text: 'rgba(59,130,246,0.9)' },
  mixed:     { label: 'C',  bg: 'rgba(245,158,11,0.12)', text: 'rgba(245,158,11,0.9)' },
  poor:      { label: 'D',  bg: 'rgba(239,68,68,0.12)', text: 'rgba(239,68,68,0.9)' },
};

export const ResultsRecap: React.FC<ResultsRecapProps> = ({
  predictions,
  accuracy,
  bestCallName,
  bestCallPredicted,
  bestCallActual,
}) => {
  const grade = GRADE_CONFIG[accuracy.overallGrade] ?? GRADE_CONFIG.mixed;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--background))' }}>
            Intelligence Results
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: 'hsl(var(--background) / 0.6)' }}>
            {predictions.tournament.name}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        {/* Accuracy headline */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span
            className="text-foreground"
            style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}
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

        {/* Accuracy breakdown row */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            marginBottom: 12,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid hsl(var(--border) / 0.5)',
          }}
        >
          {[
            { label: 'Top 5', value: accuracy.inTop5 },
            { label: 'Top 10', value: accuracy.inTop10 },
            { label: 'Top 20', value: accuracy.inTop20 },
          ].map((bucket, i) => (
            <div
              key={bucket.label}
              style={{
                flex: 1,
                padding: '10px 0',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid hsl(var(--border) / 0.3)' : 'none',
              }}
            >
              <div
                className="text-foreground"
                style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}
              >
                {bucket.value}
              </div>
              <div
                className="text-muted-foreground"
                style={{ fontSize: 10.5, fontWeight: 500, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {bucket.label}
              </div>
            </div>
          ))}
        </div>

        {/* Best call line */}
        {bestCallName && bestCallActual != null && (
          <div
            className="text-muted-foreground"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: '10px 12px',
              background: 'hsl(var(--muted) / 0.5)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>🎯</span>
            <span>
              <span className="text-foreground" style={{ fontWeight: 600 }}>
                Best call:
              </span>
              {' '}{bestCallName} — Predicted {bestCallPredicted ? `${bestCallPredicted}${getOrdinalSuffix(bestCallPredicted)}` : '1st'}, finished {bestCallActual}{getOrdinalSuffix(bestCallActual)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
