/**
 * ResultsRecap - Post-tournament results summary card
 * Premium editorial scorecard with accuracy breakdown and best call
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
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

export const ResultsRecap: React.FC<ResultsRecapProps> = ({
  predictions,
  accuracy,
  bestCallName,
  bestCallPredicted,
  bestCallActual,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden"
      style={{ borderTop: '2px solid hsl(var(--foreground))' }}
    >
      {/* Header bar */}
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
        {/* Accuracy headline — 32px/800 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span
            className="text-foreground"
            style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}
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

        {/* Accuracy breakdown row — subtle green tint when hits > 0 */}
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
                background: bucket.value > 0 ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
              }}
            >
              <div
                className="text-foreground"
                style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}
              >
                {bucket.value}
              </div>
              <div
                className="text-muted-foreground"
                style={{ fontSize: 11, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {bucket.label}
              </div>
            </div>
          ))}
        </div>

        {/* Best call line — gold left border */}
        {bestCallName && bestCallActual != null && (
          <div
            className="text-muted-foreground"
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: '12px 14px',
              background: 'hsl(var(--muted) / 0.5)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderLeft: '3px solid #D4A853',
            }}
          >
            <Target className="w-4 h-4 flex-shrink-0" style={{ color: '#D4A853' }} />
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
