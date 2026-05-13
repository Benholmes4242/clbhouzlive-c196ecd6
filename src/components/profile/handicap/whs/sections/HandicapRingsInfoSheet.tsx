import React from 'react';
import { Target, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Mirrors palette from HeroHandicapCard so the dots in the sheet match
// the actual ring colours on the page.
const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.78)',
  hairline: 'rgba(15,23,42,0.08)',
  neutralTint: 'rgba(15,23,42,0.04)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  amberInk: '#854F0B',
  gold: '#BA7517',
  goldTint: 'rgba(186,117,23,0.10)',
  // Form ring ember/ice ramp
  redHot: '#B91C1C',
  warm: '#F59E0B',
  steady: 'rgba(15,23,42,0.40)',
  cold: '#38BDF8',
  out: '#0E7490',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const BODY_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.6,
  color: T.inkSoft,
  fontFamily: FONT,
};

interface RingExplainerProps {
  accent: string;
  title: string;
  subtitle: string;
  calc: React.ReactNode;
}

const RingExplainer: React.FC<RingExplainerProps> = ({ accent, title, subtitle, calc }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span
        style={{
          width: 14, height: 14, borderRadius: '50%',
          border: `2.5px solid ${accent}`, background: 'transparent',
          flexShrink: 0,
        }}
      />
      <p style={{
        margin: 0, fontSize: 11, fontWeight: 800, color: T.ink,
        letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT,
      }}>
        {title}
      </p>
    </div>
    <p style={{ ...BODY_STYLE, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
      {subtitle}
    </p>
    <div style={BODY_STYLE}>{calc}</div>
  </div>
);

interface BandLadderProps {
  rows: Array<{ color: string; title: string; sub: string }>;
}

const BandLadder: React.FC<BandLadderProps> = ({ rows }) => (
  <div style={{
    margin: '12px 0', borderRadius: 10,
    border: `0.5px solid ${T.hairline}`, overflow: 'hidden',
  }}>
    {rows.map((row, i) => (
      <div
        key={i}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          borderTop: i === 0 ? 'none' : `0.5px solid ${T.hairline}`,
          background: i % 2 === 0 ? '#fff' : T.neutralTint,
        }}
      >
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: row.color, flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 11, fontWeight: 800, color: T.ink,
            letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: FONT,
          }}>
            {row.title}
          </p>
          <p style={{
            margin: '2px 0 0', fontSize: 12, color: T.inkMute, fontFamily: FONT,
          }}>
            {row.sub}
          </p>
        </div>
      </div>
    ))}
  </div>
);

const NoteBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{
    margin: '8px 0 0', fontSize: 12, lineHeight: 1.55,
    color: T.inkMute, fontStyle: 'italic', fontFamily: FONT,
  }}>
    {children}
  </p>
);

const Divider: React.FC = () => (
  <div style={{ height: 1, background: T.hairline, margin: '20px 0' }} />
);

const SectionLabel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <p style={{
    margin: '0 0 8px', fontSize: 10, fontWeight: 800, color: T.inkMute,
    letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: FONT,
    ...style,
  }}>
    {children}
  </p>
);

export const HandicapRingsInfoSheet: React.FC<Props> = ({ open, onClose }) => {
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="handicap-rings-info-title">
      {/* Header — mirrors StablefordDetailSheet */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${T.hairline}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, background: T.amberTint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Target size={15} color={T.amberDeep} strokeWidth={2.2} />
          </div>
          <p
            id="handicap-rings-info-title"
            style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FONT }}
          >
            How these rings work
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close info sheet"
          style={{
            width: 30, height: 30, borderRadius: 999, border: 'none',
            background: T.neutralTint, color: T.inkSoft, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
        >
          <X size={15} strokeWidth={2.4} />
        </button>
      </div>

      <div style={{
        padding: '20px 20px 28px',
        maxHeight: 'calc(90vh - 120px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* ── HANDICAP RING ── */}
        <RingExplainer
          accent={T.amber}
          title="Handicap"
          subtitle="How much your index has moved across the period."
          calc={
            <>
              Compares your index at the start of the period to your index today.
              The ring fills proportionally — full ring means you've moved by the
              expected amount for a player at your level.
            </>
          }
        />
        <BandLadder
          rows={[
            { color: T.amber, title: 'HCP under 5', sub: '0.5-stroke move fills the ring' },
            { color: T.amber, title: 'HCP 5–10', sub: '1.0-stroke move fills the ring' },
            { color: T.amber, title: 'HCP 10–18', sub: '2.0-stroke move fills the ring' },
            { color: T.amber, title: 'HCP 18+', sub: '3.0-stroke move fills the ring' },
          ]}
        />
        <NoteBlock>
          Bigger handicaps naturally move in bigger steps. A 24-handicapper
          dropping 3 strokes in a month is comparable effort to a 2-handicapper
          dropping 0.5 — both fill the ring the same way. Caps double on the
          1Y range to account for the longer window.
        </NoteBlock>

        <Divider />

        {/* ── SCORING AVG RING ── */}
        <RingExplainer
          accent={T.gold}
          title="Scoring Avg"
          subtitle="How close your average gross is to your personal ceiling."
          calc={
            <>
              Averages your adjusted gross scores across rounds in the active
              window. The ring fills relative to your personal
              ceiling — the average of your best 8 gross scores out
              of your last 20 rounds.
            </>
          }
        />
        <BandLadder
          rows={[
            { color: T.gold, title: 'At ceiling', sub: 'Period avg ≤ best-8 average — full ring' },
            { color: T.gold, title: 'Mid-range', sub: 'Halfway between worst and best in the window' },
            { color: T.gold, title: 'At range worst', sub: 'Period avg ≈ your worst recent score — empty ring' },
          ]}
        />
        <NoteBlock>
          The ceiling uses "best 8 of 20" — the same calc that drives your WHS
          handicap, but on raw gross scores. It's the cleanest signal of how
          close you're playing to your actual ceiling right now.
        </NoteBlock>

        <Divider />

        {/* ── FORM RING ── */}
        <RingExplainer
          accent={T.warm}
          title="Form"
          subtitle="How your recent Stableford points compare to your personal baseline."
          calc={
            <>
              Averages your Stableford points across rounds in the active
              period, then compares to your all-time average.
              Anchored on your own baseline so the rings mean the same thing
              whether you're scratch or 24-handicap.
            </>
          }
        />
        <BandLadder
          rows={[
            { color: T.redHot, title: 'Red hot', sub: '+3.0 pts or more above your average' },
            { color: T.warm, title: 'Warm', sub: '+0.5 to +3.0 pts above average' },
            { color: T.steady, title: 'Steady', sub: 'Within ±0.5 pts of your average' },
            { color: T.cold, title: 'Cold form', sub: '−0.5 to −3.0 pts below average' },
            { color: T.out, title: 'Out of form', sub: '−3.0 pts or more below average' },
          ]}
        />
        <NoteBlock>
          Form is intentionally relative, not absolute. A
          24-handicapper averaging 31 points who jumps to 35 is in red-hot form
          for them, even though they're still below the 36 that means "played
          to handicap." This metric tracks your trajectory, not your level.
        </NoteBlock>

        <Divider />

        <SectionLabel>One more thing</SectionLabel>
        <p style={BODY_STYLE}>
          All three rings update when you change the filter (1M,{' '}
          3M, 1Y) at the top. The form ring
          shows "Not enough rounds" if you have fewer than 3 in the window or
          fewer than 5 lifetime — a fair signal needs a fair sample.
        </p>
      </div>
    </BottomSheet>
  );
};

export default HandicapRingsInfoSheet;
