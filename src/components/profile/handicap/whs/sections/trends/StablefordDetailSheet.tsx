import React from 'react';
import { Target, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { StablefordDistribution } from './computeStablefordDistribution';

interface Props {
  open: boolean;
  onClose: () => void;
  dist: StablefordDistribution;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.78)',
  hairline: 'rgba(15,23,42,0.08)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  amberInk: '#854F0B',
  green: '#059669',
  greenInk: '#065F46',
  red: '#9F1D1D',
  redInk: '#7F1D1D',
  neutralTint: 'rgba(15,23,42,0.04)',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const StablefordDetailSheet: React.FC<Props> = ({ open, onClose, dist }) => {
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="stableford-sheet-title">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${T.hairline}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: T.amberTint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Target size={15} color={T.amberDeep} strokeWidth={2.2} />
          </div>
          <p
            id="stableford-sheet-title"
            style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FONT }}
          >
            Stableford Points
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail sheet"
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            border: 'none',
            background: T.neutralTint,
            color: T.inkSoft,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <X size={15} strokeWidth={2.4} />
        </button>
      </div>

      <div style={{ overflowY: 'auto', padding: '16px 18px 24px', maxHeight: '70vh' }}>
        <SectionLabel>What is Stableford</SectionLabel>
        <p style={BODY_STYLE}>
          Stableford is a points-based scoring system that rewards good holes and limits the damage of bad ones. Birdies score big; blow-up holes are capped. A round of <strong>36 points</strong> means you played exactly to your handicap — the baseline for your level.
        </p>

        <SectionLabel style={{ marginTop: 20 }}>How the bands work</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BandRow
            color={T.green}
            ink={T.greenInk}
            title="In the zone — 36+ points"
            description="Rounds at or above your handicap. These are the ones that become handicap counters and drive your handicap down."
          />
          <BandRow
            color={T.amber}
            ink={T.amberInk}
            title="Solid round — 33 to 35 points"
            description="Just below your level. Decent rounds where the swing was working but a few holes leaked shots."
          />
          <BandRow
            color={T.red}
            ink={T.redInk}
            title="Off day — under 33 points"
            description="Off-pace days where the round didn't quite click. Drops out of your scoring record over time."
          />
        </div>

        <SectionLabel style={{ marginTop: 20 }}>Why this matters</SectionLabel>
        <p style={BODY_STYLE}>
          Your handicap moves based on your <strong>best 8 of 20</strong> differentials. Stableford is a different lens on the same rounds — but the visual distribution tells you something the handicap number alone hides: how often you produce the rounds that move your handicap, vs how often you have weak rounds that don't.
        </p>
        <p style={{ ...BODY_STYLE, marginTop: 12 }}>
          A high <strong>In the zone</strong> count means your ceiling is high and you reach it often. A high <strong>Solid round</strong> count means you&apos;re consistent. A high <strong>Off day</strong> count means there&apos;s untapped headroom to improve.
        </p>

        {!dist.insufficientData && (
          <>
            <SectionLabel style={{ marginTop: 20 }}>Your distribution</SectionLabel>
            <div style={{ background: T.neutralTint, padding: '14px 16px', borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: T.ink, fontFamily: FONT }}>
                {dist.inZoneCount} of your last {dist.total} rounds were in the zone — these became your handicap counters. {dist.solidCount} were solid, sitting just below your level. {dist.offDayCount} were off days.
              </p>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
};

const BODY_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.6,
  color: T.inkSoft,
  fontFamily: FONT,
};

interface SectionLabelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ children, style }) => (
  <p
    style={{
      margin: '0 0 8px',
      fontSize: 11,
      fontWeight: 800,
      color: T.inkMute,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      fontFamily: FONT,
      ...style,
    }}
  >
    {children}
  </p>
);

interface BandRowProps {
  color: string;
  ink: string;
  title: string;
  description: string;
}

const BandRow: React.FC<BandRowProps> = ({ color, ink, title, description }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 3,
        background: color,
        marginTop: 6,
        flexShrink: 0,
      }}
    />
    <div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: ink, fontFamily: FONT }}>{title}</p>
      <p style={{ margin: '2px 0 0', fontSize: 12, lineHeight: 1.5, color: 'rgba(15,23,42,0.78)', fontFamily: FONT }}>
        {description}
      </p>
    </div>
  </div>
);

export default StablefordDetailSheet;
