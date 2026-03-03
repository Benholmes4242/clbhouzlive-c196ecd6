/**
 * ResultsRecap - Compact horizontal layout with animated ring, stat pills, and best call banner
 */

import React, { useState, useEffect, useRef } from 'react';
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

/* ── Inline Accuracy Ring (84px SVG) ── */
const RING_SIZE = 84;
const RING_R = 36;
const RING_STROKE = 5;
const RING_C = 2 * Math.PI * RING_R; // ≈226

const ScoreRing: React.FC<{ hit: number; total: number }> = ({ hit, total }) => {
  const [visible, setVisible] = useState(false);
  const [hitCount, setHitCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const pct = total > 0 ? (hit / total) * 100 : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Count-up for hit number
  useEffect(() => {
    if (!visible || hit === 0) return;
    const duration = 400;
    const steps = hit;
    const interval = Math.max(Math.floor(duration / steps), 30);
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setHitCount(i);
      if (i >= hit) clearInterval(iv);
    }, interval);
    return () => clearInterval(iv);
  }, [visible, hit]);

  // Count-up for total number
  useEffect(() => {
    if (!visible || total === 0) return;
    const duration = 400;
    const steps = total;
    const interval = Math.max(Math.floor(duration / steps), 30);
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setTotalCount(i);
      if (i >= total) clearInterval(iv);
    }, interval);
    return () => clearInterval(iv);
  }, [visible, total]);

  const offset = visible ? RING_C - (pct / 100) * RING_C : RING_C;

  return (
    <div ref={ref} className="relative" style={{ width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          fill="none" stroke="#16A34A" strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          style={{ transition: `stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#16A34A' }}>
          {visible ? hitCount : 0}
        </span>
        <span style={{ fontWeight: 300 }} className="text-muted-foreground">/</span>
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }} className="text-foreground">
          {visible ? totalCount : 0}
        </span>
      </div>
    </div>
  );
};

/* ── Stat Pill ── */
const StatPill: React.FC<{ label: string; value: number; index: number }> = ({ label, value, index }) => {
  const active = value > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 + index * 0.08 }}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        borderRadius: 8,
        background: active ? 'rgba(22, 163, 74, 0.06)' : '#F5F5F4',
        border: `1px solid ${active ? 'rgba(22, 163, 74, 0.12)' : '#E7E5E4'}`,
      }}
    >
      <span style={{
        fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em',
        color: active ? '#16A34A' : '#A8A29E',
      }}>
        {value}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
        color: active ? '#16A34A' : '#A8A29E', opacity: 0.8,
      }}>
        {label}
      </span>
    </motion.div>
  );
};

/* ── Best Call Text Line ── */
const BestCallLine: React.FC<{
  name: string; actual: number;
}> = ({ name, actual }) => {
  const isWinner = actual === 1;
  const finishText = isWinner ? 'Won the tournament' : `Finished ${actual}${getOrdinalSuffix(actual)}`;

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      style={{ fontSize: 13, lineHeight: 1.4, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
    >
      <span style={{ fontSize: 14, color: '#16A34A', lineHeight: 1 }}>★</span>
      <span className="text-foreground" style={{ fontWeight: 700 }}>Best call</span>
      <span className="text-muted-foreground"> – </span>
      <span className="text-foreground" style={{ fontWeight: 700 }}>{name}, {finishText}</span>
    </motion.p>
  );
};

/* ── Gradient Separator ── */
const GradientSeparator = () => (
  <div style={{
    height: 1,
    background: 'linear-gradient(90deg, transparent, #E7E5E4 20%, #E7E5E4 80%, transparent)',
    margin: '16px 0',
  }} />
);

/* ── Main Component ── */
export const ResultsRecap: React.FC<ResultsRecapProps> = ({
  accuracy,
  bestCallName,
  bestCallPredicted,
  bestCallActual,
}) => {
  const isWinner = bestCallActual === 1;

  return (
    <div>
      {/* Score + Stats horizontal layout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '24px 0 20px' }}
      >
        {/* Left — Ring */}
        <ScoreRing hit={accuracy.inTop10} total={accuracy.totalPredictions} />

        {/* Right — Context + Stat Pills */}
        <div style={{ paddingTop: 6 }}>
          <p className="text-muted-foreground" style={{ fontSize: 14, marginBottom: 14 }}>
            picks finished in the{' '}
            <span className="text-foreground" style={{ fontWeight: 700 }}>Top 10</span>
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Top 5', value: accuracy.inTop5 },
              { label: 'Top 10', value: accuracy.inTop10 },
              { label: 'Top 20', value: accuracy.inTop20 },
            ].map((s, i) => (
              <StatPill key={s.label} label={s.label} value={s.value} index={i} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Best Call Text */}
      {bestCallName && bestCallActual != null && (
        <BestCallLine name={bestCallName} actual={bestCallActual} />
      )}

      {/* Gradient separator */}
      <GradientSeparator />
    </div>
  );
};
