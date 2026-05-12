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
  /** Optional. Controls which subset of the stack renders.
   * 'hero-only' = form hero + HandicapProjectionCard.
   * 'rest' = StablefordCard + TrendNarrativeSection + CourseFormCard.
   * undefined (default) = whole stack (backwards-compatible). */
  splitAt?: 'hero-only' | 'rest';
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const HOT_RED = '#DC2626';
const COLD_BLUE = '#0EA5E9';
const SLATE = '#475569';

export const TrendCardsStack: React.FC<Props> = ({ connectionId, currentHandicap, splitAt }) => {
  const { data: scores, isLoading } = useAllScores(connectionId);
  const prediction = predictHandicap(scores ?? []);
  const meta = VERDICT_META[prediction.verdict];

  const accent =
    meta.theme === 'positive' ? HOT_RED : meta.theme === 'negative' ? COLD_BLUE : SLATE;

  const deltaStr =
    prediction.delta && prediction.delta !== 0
      ? `${prediction.direction === 'up' ? '+' : '\u2212'}${Math.abs(prediction.delta).toFixed(1)} Projected`
      : null;

  const showHero = !prediction.insufficientData && !isLoading;

  const [showInfo, setShowInfo] = useState(false);

  return (
    <section style={{ padding: '10px 20px 0', marginBottom: 28, fontFamily: FONT }}>
      {splitAt !== 'rest' && (showHero ? (
        <div style={{ padding: '0 4px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              aria-label={showInfo ? 'Hide info' : 'Show info'}
              aria-expanded={showInfo}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: showInfo ? INK : 'transparent',
                border: `1px solid ${showInfo ? INK : 'rgba(15,23,42,0.12)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                padding: 0,
              }}
            >
              <Info size={12} color={showInfo ? '#FFFFFF' : SLATE} strokeWidth={2.25} />
            </button>
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
              You&apos;re <span style={{ color: accent }}>{meta.label.toLowerCase()}</span>
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
            Your last 5 rounds suggest where your handicap is heading.
          </p>

          {showInfo && (
            <div
              style={{
                marginTop: 12,
                padding: '12px 14px',
                background: 'rgba(15,23,42,0.04)',
                border: '1px solid rgba(15,23,42,0.08)',
                borderRadius: 10,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  fontFamily: FONT,
                }}
              >
                How this works
              </p>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'rgba(15,23,42,0.78)', fontFamily: FONT }}>
                Your <strong>differential</strong> is each round&apos;s score adjusted for course difficulty.
                Lower is better. Your <strong>handicap</strong> is the average of your best 8 differentials
                from your last 20 rounds — those are your <strong>counters</strong>. The{' '}
                <strong>projection</strong> simulates 5 more rounds at your recent average and recomputes
                your handicap.
              </p>
            </div>
          )}
        </div>
      ) : (
        <SectionHeader
          eyebrow="Your Form"
          title="The numbers behind your handicap"
          sub="Three signals that explain your trajectory"
        />
      ))}

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
          {splitAt !== 'rest' && <HandicapProjectionCard scores={scores ?? []} />}
          {splitAt !== 'hero-only' && (
            <>
              <StablefordCard scores={scores ?? []} />
              <TrendNarrativeSection connectionId={connectionId} />
              <CourseFormCard connectionId={connectionId} currentHandicap={currentHandicap} />
            </>
          )}
        </>
      )}
    </section>
  );
};

export default TrendCardsStack;
