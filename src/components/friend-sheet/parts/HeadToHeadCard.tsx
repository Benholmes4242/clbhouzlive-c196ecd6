import React from 'react';
import { Swords, Flame, Sparkles, MapPin, UserPlus } from 'lucide-react';
import { Eyebrow } from './_shared/Eyebrow';
import { formatMonthDay2ShortGB } from '@/i18n/format';

import {
  BG_1,
  T100,
  T60,
  T40,
  AMBER,
  LINE,
  LINE_2,
  FONT,
  TAB,
} from './_shared/tokens';
import type { SheetState } from './_shared/deriveSheetState';
import { shortCourseName } from './_shared/deriveH2H';

interface Props {
  state: SheetState;
}

export const HeadToHeadCard: React.FC<Props> = ({ state }) => {
  // State 4 (clbhouz_not_synced) hides this section entirely.
  if (state.kind === 'clbhouz_not_synced') return null;

  return (
    <div style={{ padding: '4px 20px 16px' }}>
      <Eyebrow label="HEAD-TO-HEAD" />
      <div style={{ marginTop: 10 }}>
        {state.kind === 'clbhouz_synced_full' && (
          <FullCard rivalry={state.rivalry} firstName={state.firstName} />
        )}
        {state.kind === 'clbhouz_synced_duelsOnly' && (
          <DuelsOnlyCard
            sharedRounds={state.sharedRounds}
            lastDuel={state.lastDuel}
          />
        )}
        {state.kind === 'clbhouz_synced_empty' && (
          <EmptyClbhouzCard firstName={state.firstName} />
        )}
        {state.kind === 'whs_only' && (
          <EmptyWhsOnlyCard firstName={state.firstName} />
        )}
      </div>
    </div>
  );
};

const CardShell: React.FC<{
  tone: 'gold' | 'dashed';
  children: React.ReactNode;
}> = ({ tone, children }) => (
  <div
    style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 16,
      padding: '16px 16px 14px',
      background: tone === 'gold' ? 'rgba(247,147,30,0.08)' : BG_1,
      border:
        tone === 'gold'
          ? `1px solid rgba(247,147,30,0.30)`
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
      color: 'rgba(255,255,255,0.06)',
      pointerEvents: 'none',
    }}
  >
    <Swords size={96} strokeWidth={1.5} />
  </div>
);

const BigDuelsNumber: React.FC<{ count: number }> = ({ count }) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
  >
    <span
      style={{
        fontSize: 38,
        fontWeight: 700,
        color: AMBER,
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

// ─── Variant 1: Full H2H ─────────────────────────────────────────────
const FullCard: React.FC<{
  rivalry: import('@/lib/whs/types').FriendRivalryHydrated;
  firstName: string;
}> = ({ rivalry, firstName }) => {
  const rec = rivalry.stableford_record;
  const streak = deriveStreak(rivalry.shared_round_results);
  const lastDuel = deriveLastDuel(rivalry);
  return (
    <CardShell tone="gold">
      <Watermark />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <BigDuelsNumber count={rivalry.shared_rounds_count} />
          <div style={{ width: 1, alignSelf: 'stretch', background: LINE }} />
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
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
                  fontWeight: 700,
                  color: rec.wins > rec.losses ? AMBER : T100,
                  letterSpacing: '-0.02em',
                }}
              >
                {rec.wins}
              </span>
              <span style={{ fontSize: 16, color: T60, fontWeight: 700 }}>−</span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: rec.losses > rec.wins ? AMBER : T100,
                  letterSpacing: '-0.02em',
                }}
              >
                {rec.losses}
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
            {streak && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: AMBER,
                  background: 'rgba(247,147,30,0.10)',
                  padding: '3px 8px',
                  borderRadius: 999,
                  alignSelf: 'flex-start',
                }}
              >
                <Flame size={11} strokeWidth={2.2} />
                <span>
                  {streak.side === 'you' ? 'You' : firstName} · {streak.count}{' '}
                  streak
                </span>
              </div>
            )}
          </div>
        </div>
        {lastDuel && <LastDuelRow lastDuel={lastDuel} />}
      </div>
    </CardShell>
  );
};

// ─── Variant 2: Duels exist but no H2H computed ──────────────────────
const DuelsOnlyCard: React.FC<{
  sharedRounds: number;
  lastDuel: { courseName: string; relativeTime: string } | null;
}> = ({ sharedRounds, lastDuel }) => (
  <CardShell tone="gold">
    <Watermark />
    <div style={{ position: 'relative' }}>
      <BigDuelsNumber count={sharedRounds} />
      {lastDuel && <LastDuelRow lastDuel={lastDuel} />}
    </div>
  </CardShell>
);

// ─── Variant 3: clbhouz friend, no duels yet ─────────────────────────
const EmptyClbhouzCard: React.FC<{ firstName: string }> = ({ firstName }) => (
  <CardShell tone="dashed">
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

// ─── Variant 4: WHS-only friend (not on clbhouz) ─────────────────────
const EmptyWhsOnlyCard: React.FC<{ firstName: string }> = ({ firstName }) => (
  <CardShell tone="dashed">
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
      <UserPlus size={28} color={T40 as unknown as string} strokeWidth={1.8} />
      <div style={{ fontSize: 15, fontWeight: 700, color: T100 }}>
        Not on clbhouz yet
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
        Invite {firstName} to clbhouz to track your head-to-head when you both
        post the same round.
      </p>
    </div>
  </CardShell>
);

// ─── Helpers ─────────────────────────────────────────────────────────
function deriveStreak(
  rounds: import('@/lib/whs/types').FriendRivalryHydrated['shared_round_results'],
) {
  if (!rounds?.length) return null;
  const sorted = [...rounds].sort((a, b) =>
    b.play_date.localeCompare(a.play_date),
  );
  const first = sorted[0].stableford_outcome;
  if (first === 'T') return null;
  let count = 0;
  for (const r of sorted) {
    if (r.stableford_outcome === first) count++;
    else break;
  }
  return { side: first === 'W' ? ('you' as const) : ('them' as const), count };
}

function deriveLastDuel(
  rivalry: import('@/lib/whs/types').FriendRivalryHydrated,
) {
  const rounds = rivalry.shared_round_results ?? [];
  if (rounds.length === 0) return null;
  const sorted = [...rounds].sort((a, b) =>
    b.play_date.localeCompare(a.play_date),
  );
  const r = sorted[0];
  return { courseName: r.course_name, relativeTime: fmtRelative(r.play_date) };
}

function fmtRelative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 7)}w ago`;
  return formatMonthDay2ShortGB(new Date(iso));
}

