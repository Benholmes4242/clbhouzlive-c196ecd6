/**
 * ResultsRecap - Post-tournament accuracy showcase
 * Centered AccuracyRing with breakdown row and best call highlight
 */

import React from 'react';
import { motion } from 'framer-motion';
import AccuracyRing from './components/AccuracyRing';
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
      className="flex flex-col items-center"
      style={{ padding: '8px 0 0' }}
    >
      {/* Accuracy Ring */}
      <AccuracyRing hit={accuracy.inTop10} total={accuracy.totalPredictions} size={120} />

      {/* Subtitle */}
      <p
        className="text-muted-foreground"
        style={{ fontSize: 14, marginTop: 12, marginBottom: 20 }}
      >
        picks finished in the{' '}
        <span className="text-foreground" style={{ fontWeight: 700 }}>Top 10</span>
      </p>

      {/* Breakdown row */}
      <div
        className="w-full flex border border-border overflow-hidden"
        style={{ borderRadius: 12, marginBottom: 20 }}
      >
        {[
          { label: 'Top 5', value: accuracy.inTop5 },
          { label: 'Top 10', value: accuracy.inTop10 },
          { label: 'Top 20', value: accuracy.inTop20 },
        ].map((bucket, i) => (
          <div
            key={bucket.label}
            className="flex-1 text-center"
            style={{
              padding: '12px 0',
              borderRight: i < 2 ? '1px solid hsl(var(--border))' : 'none',
              background: bucket.value > 0 ? 'rgba(22, 163, 74, 0.04)' : 'transparent',
            }}
          >
            <div
              className="text-foreground"
              style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}
            >
              {bucket.value}
            </div>
            <div
              className="text-muted-foreground uppercase"
              style={{ fontSize: 10, fontWeight: 600, marginTop: 4, letterSpacing: '0.08em' }}
            >
              {bucket.label}
            </div>
          </div>
        ))}
      </div>

      {/* Best call highlight */}
      {bestCallName && bestCallActual != null && (
        <div
          className="w-full text-muted-foreground"
          style={{
            fontSize: 13,
            fontWeight: 500,
            padding: '12px 14px',
            background: 'hsl(var(--muted) / 0.5)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderLeft: '3px solid #CA8A04',
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 14 }}>✦</span>
          <span>
            <span className="text-foreground" style={{ fontWeight: 600 }}>Best call:</span>
            {' '}{bestCallName} (Pick #{bestCallPredicted ?? 1}) — Finished{' '}
            {bestCallActual}{getOrdinalSuffix(bestCallActual)}
          </span>
        </div>
      )}
    </motion.div>
  );
};
