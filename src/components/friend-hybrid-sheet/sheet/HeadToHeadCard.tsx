import React from 'react';
import { Swords, Flame, Sparkles, MapPin } from 'lucide-react';
import { Eyebrow } from './_shared/Eyebrow';
import {
  BG_1,
  T100,
  T60,
  T40,
  GOLD,
  LINE,
  LINE_2,
  FONT,
  TAB,
} from './_shared/tokens';
import type { H2HState } from './_shared/deriveH2H';
import { shortCourseName } from './_shared/deriveH2H';

interface Props {
  state: H2HState;
  rivalFirstName: string;
}

export const HeadToHeadCard: React.FC<Props> = ({ state, rivalFirstName }) => (
  <div style={{ padding: '4px 20px 16px' }}>
    <Eyebrow label="HEAD-TO-HEAD" />
    <div style={{ marginTop: 10 }}>
      {state.kind === 'empty' && <EmptyCard firstName={rivalFirstName} />}
      {state.kind === 'duelsOnly' && <DuelsOnlyCard state={state} />}
      {state.kind === 'full' && (
        <FullCard state={state} rivalFirstName={rivalFirstName} />
      )}
    </div>
  </div>
);

const CardShell: React.FC<{
  children: React.ReactNode;
  variant: 'gold' | 'empty';
}> = ({ children, variant }) => (
  <div
    style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 16,
      padding: '16px 16px 14px',
      background:
        variant === 'gold'
          ? 'linear-gradient(135deg, rgba(251,188,46,0.14) 0%, rgba(251,188,46,0.04) 60%, rgba(251,188,46,0.02) 100%)'
          : BG_1,
      border:
        variant === 'gold'
          ? `1px solid rgba(251,188,46,0.32)`
          : `1px dashed ${LINE_2}`,
      fontFamily: FONT,
    }}
  >
    {children}
  </div>
);

const Watermark: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      top: -10,
      right: -10,
      opacity: 0.08,
      color: GOLD,
      pointerEvents: 'none',
    }}
  >
    <Swords size={96} strokeWidth={1.5} />
  </div>
);

const BigDuelsNumber: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    <span
      style={{
        fontSize: 38,
        fontWeight: 900,
        color: GOLD,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        ...TAB,
      }}
    >
      {count}
    </span>
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: T60,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        marginTop: 2,
      }}
    >
      {count === 1 ? 'Duel' : 'Duels'}
    </span>
  </div>
);

const LastDuelRow: React.FC<{
  lastDuel: { courseName: string; relativeTime: string };
}> = ({ lastDuel }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingTop: 10,
      borderTop: `1px solid ${LINE}`,
      fontSize: 12,
      color: T60,
    }}
  >
    <MapPin size={12} strokeWidth={2} />
    <span>
      Last duel — {shortCourseName(lastDuel.courseName)} · {lastDuel.relativeTime}
    </span>
  </div>
);

// State 3 — empty
const EmptyCard: React.FC<{ firstName: string }> = ({ firstName }) => (
  <CardShell variant="empty">
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 8,
        padding: '6px 4px 2px',
      }}
    >
      <Sparkles size={28} color={T40 as unknown as string} strokeWidth={1.8} />
      <div style={{ fontSize: 15, fontWeight: 700, color: T100 }}>
        No duels yet
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: T60,
          lineHeight: 1.45,
          maxWidth: 300,
        }}
      >
        When you and {firstName} both post a round at the same course on the
        same day, it'll show up here as a duel.
      </p>
    </div>
  </CardShell>
);

// State 2 — duels only
const DuelsOnlyCard: React.FC<{
  state: Extract<H2HState, { kind: 'duelsOnly' }>;
}> = ({ state }) => (
  <CardShell variant="gold">
    <Watermark />
    <div style={{ position: 'relative' }}>
      <BigDuelsNumber count={state.duelsCount} />
      {state.lastDuel && <LastDuelRow lastDuel={state.lastDuel} />}
    </div>
  </CardShell>
);

// State 1 — full H2H
const FullCard: React.FC<{
  state: Extract<H2HState, { kind: 'full' }>;
  rivalFirstName: string;
}> = ({ state, rivalFirstName }) => (
  <CardShell variant="gold">
    <Watermark />
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <BigDuelsNumber count={state.duelsCount} />
        <div
          style={{
            width: 1,
            alignSelf: 'stretch',
            background: LINE,
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* W-L */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              fontFamily: FONT,
              ...TAB,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: state.yourWins > state.theirWins ? GOLD : T60,
                letterSpacing: '-0.02em',
              }}
            >
              {state.yourWins}
            </span>
            <span style={{ fontSize: 16, color: T60, fontWeight: 700 }}>−</span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: state.theirWins > state.yourWins ? GOLD : T60,
                letterSpacing: '-0.02em',
              }}
            >
              {state.theirWins}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: T60,
                letterSpacing: '0.10em',
                marginLeft: 4,
              }}
            >
              STBL
            </span>
          </div>
          {state.streak && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 700,
                color: GOLD,
                background: 'rgba(251,188,46,0.10)',
                padding: '3px 8px',
                borderRadius: 999,
                alignSelf: 'flex-start',
              }}
            >
              <Flame size={11} strokeWidth={2.2} />
              <span>
                {state.streak.side === 'you' ? 'You' : rivalFirstName} ·{' '}
                {state.streak.count} streak
              </span>
            </div>
          )}
        </div>
      </div>
      {state.lastDuel && <LastDuelRow lastDuel={state.lastDuel} />}
    </div>
  </CardShell>
);
