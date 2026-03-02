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
      style={{ padding: '8px 0 0' }}
    >
      {/* Top section — horizontal: ring + stats */}
      <div className="flex items-center" style={{ gap: 20 }}>
        {/* Accuracy Ring */}
        <div className="flex-shrink-0">
          <AccuracyRing hit={accuracy.inTop10} total={accuracy.totalPredictions} size={88} />
        </div>

        {/* Right column: subtitle + breakdown */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <p className="text-muted-foreground" style={{ fontSize: 14 }}>
            picks finished in the{' '}
            <span className="text-foreground" style={{ fontWeight: 700 }}>Top 10</span>
          </p>

          {/* Breakdown values — raw numbers */}
          <div className="flex items-baseline" style={{ gap: 20, marginTop: 10 }}>
            {[
              { label: 'Top 5', value: accuracy.inTop5 },
              { label: 'Top 10', value: accuracy.inTop10 },
              { label: 'Top 20', value: accuracy.inTop20 },
            ].map((bucket) => (
              <div key={bucket.label} className="flex flex-col items-center">
                <span
                  className="text-foreground"
                  style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}
                >
                  {bucket.value}
                </span>
                <span
                  className="text-muted-foreground uppercase"
                  style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', marginTop: 2 }}
                >
                  {bucket.label}
                </span>
              </div>
            ))}
          </div>
        </div>
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
            marginTop: 16,
            marginBottom: 20,
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
