import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useAllScores } from '@/lib/whs/hooks';
import { SectionHeader } from '@/components/ui/SectionHeader';
import HandicapProjectionCard from './HandicapProjectionCard';
import LastFiveTokens from './LastFiveTokens';
import StablefordCard from './StablefordCard';

import { predictHandicap, VERDICT_META } from './predictHandicap';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null | undefined;
  /** Optional. Controls which subset of the stack renders.
   * 'hero-only' = form hero + HandicapProjectionCard.
   * 'rest' = StablefordCard.
   * undefined (default) = whole stack (backwards-compatible). */
  splitAt?: 'hero-only' | 'rest';
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = 'var(--hcp-t-100)';
const INK_55 = 'var(--hcp-t-60)';
const HOT_RED = '#DC2626';
const COLD_BLUE = '#0EA5E9';
const SLATE = 'var(--hcp-t-80)';
export const TrendCardsStack: React.FC<Props> = ({ connectionId, userId, currentHandicap, splitAt, viewMode = 'owner', ownerFirstName = null }) => {
  const possessiveCap = viewMode === 'friend'
    ? (ownerFirstName ? `${ownerFirstName}'s` : 'Their')
    : 'Your';
  const possessiveLower = viewMode === 'friend'
    ? (ownerFirstName ? `${ownerFirstName}'s` : 'their')
    : 'your';

  const { data: scores, isLoading } = useAllScores(connectionId);
  const prediction = predictHandicap(scores ?? []);
  const meta = VERDICT_META[prediction.verdict];

  // Individual 5 most recent round differentials, ordered newest → oldest.
  // Used by LastFiveTokens to render the magnitude-encoded mini chart.
  const recentFiveDiffs = React.useMemo(() => {
    if (!scores) return [];
    return scores
      .filter((s) => s.handicap_differential !== null)
      .sort((a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime())
      .slice(0, 5)
      .map((s) => s.handicap_differential as number);
  }, [scores]);

  const accent =
    meta.theme === 'positive' ? HOT_RED : meta.theme === 'negative' ? COLD_BLUE : SLATE;

  const showHero = !prediction.insufficientData && !isLoading;

  const [showInfo, setShowInfo] = useState(false);

  return (
    <section style={{ padding: '0 16px', marginTop: 32, fontFamily: FONT }}>
      {splitAt !== 'rest' && (showHero ? (
        <div style={{ padding: '0 0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
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
                  fontSize: 9,
                  fontWeight: 800,
                  color: 'var(--hcp-t-60)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontFamily: FONT,
                }}
              >
                {possessiveCap} Form
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

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 4,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 68,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 0.88,
                color: accent,
                textTransform: 'lowercase',
                fontFamily: FONT,
              }}
            >
              {meta.label.toLowerCase()}
            </h1>
            {prediction.delta > 0 && prediction.projected !== null && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 6,
                  paddingTop: 8,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--hcp-t-40)',
                    fontFamily: FONT,
                  }}
                >
                  Projected
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background:
                      meta.theme === 'positive'
                        ? 'rgba(220, 38, 38, 0.10)'
                        : meta.theme === 'negative'
                          ? 'rgba(14, 165, 233, 0.10)'
                          : 'var(--hcp-bg-2)',
                    border: `1px solid ${accent}40`,
                    fontSize: 14,
                    fontWeight: 800,
                    color: accent,
                    fontVariantNumeric: 'tabular-nums',
                    fontFamily: FONT,
                  }}
                >
                  {prediction.direction === 'up' ? '↑' : prediction.direction === 'down' ? '↓' : '→'}{' '}
                  {prediction.delta.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <p
            style={{
              margin: '4px 0 0',
              fontSize: 13,
              color: 'var(--hcp-t-60)',
              fontFamily: FONT,
              lineHeight: 1.4,
            }}
          >
            {possessiveCap} last 5 rounds suggest where {possessiveLower} handicap is heading.
          </p>

          {showInfo && (
            <div
              style={{
                marginTop: 12,
                padding: '12px 14px',
                background: 'var(--hcp-bg-2)',
                border: '1px solid var(--hcp-line)',
                borderRadius: 10,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--hcp-t-100)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  fontFamily: FONT,
                }}
              >
                How this works
              </p>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'var(--hcp-t-80)', fontFamily: FONT }}>
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
          kicker={`${possessiveCap} Form`}
          title={`The numbers behind ${possessiveLower} handicap`}
          sub={`Three signals that explain ${possessiveLower} trajectory`}
        />
      ))}

      {isLoading ? (
        [420, 320, 360].map((h, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: h,
              background: 'var(--hcp-bg-2)',
              borderRadius: 16,
              marginBottom: 14,
            }}
          />
        ))
      ) : (
        <>
          {splitAt !== 'rest' && (
            <>
              <LastFiveTokens
                diffs={recentFiveDiffs}
                avg={prediction.recentFormAvg}
                accent={accent}
                accentInk={accent}
              />
              <HandicapProjectionCard scores={scores ?? []} />
            </>
          )}
          {splitAt !== 'hero-only' && (
            <StablefordCard scores={scores ?? []} userId={userId} connectionId={connectionId} />
          )}
        </>
      )}
    </section>
  );
};

export default TrendCardsStack;
