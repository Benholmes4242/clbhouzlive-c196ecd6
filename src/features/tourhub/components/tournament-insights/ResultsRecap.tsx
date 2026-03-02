/**
 * ResultsRecap - Post-tournament accuracy showcase
 * Typography-driven layout: hero stat, inline breakdown, best call highlight
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

export const ResultsRecap: React.FC<ResultsRecapProps> = ({
  accuracy,
  bestCallName,
  bestCallPredicted,
  bestCallActual,
}) => {
  const hasWinner = bestCallActual === 1;
  const isBestCallTheWinner = hasWinner && bestCallName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: '20px 0 0' }}
    >
      {hasWinner && bestCallName ? (
        <>
          {/* Winner variant */}
          <div style={{ fontSize: 28, marginBottom: 4 }}>🏆</div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
              color: 'hsl(142, 71%, 45%)',
            }}
          >
            We called it
          </p>
          <p style={{ marginBottom: 2 }}>
            <span
              className="text-foreground"
              style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              {bestCallName} won
            </span>
          </p>
          <p className="text-muted-foreground" style={{ fontSize: 14, fontWeight: 400, marginBottom: 14 }}>
            <span className="text-foreground" style={{ fontWeight: 800 }}>{accuracy.inTop10}</span>
            <span style={{ fontWeight: 300 }}> of </span>
            <span className="text-foreground" style={{ fontWeight: 800 }}>{accuracy.totalPredictions}</span>
            {' '}picks in the{' '}
            <span className="text-foreground" style={{ fontWeight: 600 }}>Top 10</span>
          </p>
        </>
      ) : (
        <>
          {/* Standard hero stat */}
          <p style={{ marginBottom: 2, lineHeight: 1.1 }}>
            <span
              className="text-foreground"
              style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              {accuracy.inTop10}
            </span>
            <span
              className="text-muted-foreground"
              style={{ fontSize: 40, fontWeight: 300, letterSpacing: '-0.03em' }}
            >
              {' '}of{' '}
            </span>
            <span
              className="text-foreground"
              style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              {accuracy.totalPredictions}
            </span>
          </p>
          <p className="text-muted-foreground" style={{ fontSize: 14, fontWeight: 400, marginBottom: 14 }}>
            picks finished in the{' '}
            <span className="text-foreground" style={{ fontWeight: 600 }}>Top 10</span>
          </p>
        </>
      )}

      {/* Inline breakdown */}
      <p className="text-muted-foreground" style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
        <span className="text-foreground" style={{ fontWeight: 700 }}>{accuracy.inTop5}</span>
        {' '}in Top 5
        <span className="text-muted-foreground" style={{ margin: '0 4px' }}>·</span>
        <span className="text-foreground" style={{ fontWeight: 700 }}>{accuracy.inTop10}</span>
        {' '}in Top 10
        <span className="text-muted-foreground" style={{ margin: '0 4px' }}>·</span>
        <span className="text-foreground" style={{ fontWeight: 700 }}>{accuracy.inTop20}</span>
        {' '}in Top 20
      </p>

      {/* Best call highlight — omit if winner IS the best call */}
      {bestCallName && bestCallActual != null && !isBestCallTheWinner && (
        <div
          className="text-muted-foreground"
          style={{
            fontSize: 13,
            fontWeight: 400,
            padding: '10px 14px',
            background: 'hsl(var(--muted) / 0.5)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderLeft: '3px solid #CA8A04',
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 14, color: '#CA8A04' }}>✦</span>
          <span>
            <span className="text-foreground" style={{ fontWeight: 700 }}>Best call:</span>
            {' '}{bestCallName} (Pick #{bestCallPredicted ?? 1}) — Finished{' '}
            {bestCallActual}{getOrdinalSuffix(bestCallActual)}
          </span>
        </div>
      )}

      {/* Non-winner best call still needs bottom margin */}
      {isBestCallTheWinner && <div style={{ marginBottom: 20 }} />}
    </motion.div>
  );
};
