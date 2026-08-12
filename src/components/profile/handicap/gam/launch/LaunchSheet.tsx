import React from 'react';
import { ArrowRight, Flame, Trophy, Swords } from 'lucide-react';
import GamSheet from '../_shared/GamSheet';
import FeatureCard from './_internal/FeatureCard';
import PersonalizationSection from './_internal/PersonalizationSection';
import type { LaunchSheetPayload } from './_internal/useLaunchSheetState';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const AMBER = '#F7931E';

interface LaunchSheetProps {
  open: boolean;
  payload: LaunchSheetPayload | null;
  onDismiss: () => void;
}

export const LaunchSheet: React.FC<LaunchSheetProps> = ({ open, payload, onDismiss }) => {
  const hasAnyData =
    !!payload &&
    (payload.achievements_earned > 0 ||
      payload.active_streaks > 0 ||
      payload.shared_rounds > 0);

  return (
    <GamSheet open={open} onClose={onDismiss}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 20px 24px',
        }}
      >
        {/* Hero icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 8,
            paddingBottom: 18,
          }}
          aria-hidden
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: 'rgba(247,147,30,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={44} color={AMBER} strokeWidth={2} />
          </div>
        </div>

        {/* H1 */}
        <h1
          id="gam-launch-title"
          style={{
            fontFamily: FONT,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.15,
            color: 'rgba(255,255,255,0.96)',
            textAlign: 'center',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          The next chapter
        </h1>

        {/* Intro */}
        <p
          style={{
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.72)',
            textAlign: 'center',
            margin: '12px 0 0',
          }}
        >
          We've built a gamification layer that turns your golf history into a journey. Streaks,
          achievements, and rivalries — all powered by your handicap data.
        </p>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.06)',
            margin: '22px 0',
          }}
        />

        {/* Feature cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FeatureCard
            icon={Flame}
            title="Streaks"
            description="Counter rounds in a row, sub-80s, birdie streaks"
          />
          <FeatureCard
            icon={Trophy}
            title="Achievements"
            description="31 badges to earn across six categories"
          />
          <FeatureCard
            icon={Swords}
            title="Rivalries"
            description="Head-to-head with friends from your scorecard"
          />
        </div>

        {/* Personalization */}
        {hasAnyData && payload && (
          <>
            <div
              style={{
                height: 1,
                background: 'rgba(255,255,255,0.06)',
                margin: '22px 0',
              }}
            />
            <PersonalizationSection
              achievementsEarned={payload.achievements_earned}
              activeStreaks={payload.active_streaks}
              sharedRounds={payload.shared_rounds}
            />
          </>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={onDismiss}
          style={{
            marginTop: 24,
            width: '100%',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: AMBER,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Let's go
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </GamSheet>
  );
};

export default LaunchSheet;
