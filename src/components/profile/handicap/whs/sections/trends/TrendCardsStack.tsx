import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useAllScores } from '@/lib/whs/hooks';
import SectionHeader from '../SectionHeader';
import HandicapProjectionCard from './HandicapProjectionCard';
import StablefordCard from './StablefordCard';
import CourseFormCard from './CourseFormCard';
import { predictHandicap, VERDICT_META } from './predictHandicap';
import TrendNarrativeSection from './TrendNarrativeSection';

interface Props {
  connectionId: string;
  currentHandicap: number | null | undefined;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const HOT_RED = '#DC2626';
const COLD_BLUE = '#0EA5E9';
const SLATE = '#475569';

export const TrendCardsStack: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { data: scores, isLoading } = useAllScores(connectionId);
  const prediction = predictHandicap(scores ?? []);
  const meta = VERDICT_META[prediction.verdict];

  const accent =
    meta.theme === 'positive' ? HOT_RED : meta.theme === 'negative' ? COLD_BLUE : SLATE;

  const deltaStr =
    prediction.delta && prediction.delta !== 0
      ? `${prediction.direction === 'up' ? '+' : '\u2212'}${Math.abs(prediction.delta).toFixed(1)} in 5 rounds`
      : null;

  const showHero = !prediction.insufficientData && !isLoading;

  return (
    <section style={{ padding: '0 20px', marginBottom: 28, fontFamily: FONT }}>
      {showHero ? (
        <div style={{ padding: '0 4px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: accent,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: INK_55,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontFamily: FONT,
              }}
            >
              Your Form
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: '-0.025em',
                color: INK,
                lineHeight: 1.05,
                fontFamily: FONT,
              }}
            >
              You&apos;re {meta.label.toLowerCase()}
            </h2>
            {deltaStr && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: accent,
                  fontFamily: FONT,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                {deltaStr}
              </span>
            )}
          </div>

          <p
            style={{
              margin: '8px 0 0',
              fontSize: 13,
              color: INK_55,
              fontFamily: FONT,
              lineHeight: 1.5,
            }}
          >
            Three signals explaining your trajectory.
          </p>
        </div>
      ) : (
        <SectionHeader
          eyebrow="Your Form"
          title="The numbers behind your handicap"
          sub="Three signals that explain your trajectory"
        />
      )}

      {isLoading ? (
        [420, 320, 360].map((h, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: h,
              background: 'rgba(15,23,42,0.04)',
              borderRadius: 16,
              marginBottom: 14,
            }}
          />
        ))
      ) : (
        <>
          <HandicapProjectionCard scores={scores ?? []} />
          <StablefordCard scores={scores ?? []} />
          <TrendNarrativeSection connectionId={connectionId} />
          <CourseFormCard connectionId={connectionId} currentHandicap={currentHandicap} />
        </>
      )}
    </section>
  );
};

export default TrendCardsStack;
