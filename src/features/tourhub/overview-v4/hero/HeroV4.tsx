/**
 * HeroV4 — full-bleed hero with three states (live / upcoming / completed).
 * Sits under the safe area at the same height as course-details.
 * The tour picker sits in the top-right and is the ONLY control on the hero.
 */

import { Zap, MapPin } from 'lucide-react';
import { V4, HERO_HEIGHT_CSS } from '../tokens';
import { TourPicker } from './TourPicker';
import { useHeroLeaderboard } from '../data/useHeroLeaderboard';
import { useCountdown } from '@/hooks/useCountdown';
import type { TourEventContext } from '../data/useTourEventContext';
import type { TourId } from '../../hooks/useOverviewData';

interface Props {
  ctx: TourEventContext | undefined;
  tour: TourId;
  onTourChange: (t: TourId) => void;
}

export function HeroV4({ ctx, tour, onTourChange }: Props) {
  const state = ctx?.state ?? 'upcoming';
  const isLive = state === 'live';
  const board = useHeroLeaderboard(ctx?.event?.id, { live: isLive });

  return (
    <section
      style={{
        position: 'relative',
        minHeight: HERO_HEIGHT_CSS,
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        background:
          'radial-gradient(circle at 20% 10%, rgba(247,147,30,0.08), transparent 55%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderBottom: `0.5px solid ${V4.hairline}`,
        overflow: 'hidden',
      }}
    >
      {/* Tour picker top-right */}
      <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top, 0px), 47px)', right: 14, marginTop: 6, zIndex: 5 }}>
        <TourPicker tour={tour} onChange={onTourChange} />
      </div>

      <div style={{ padding: '18px 18px 24px' }}>
        <StateEyebrow state={state} isMajor={ctx?.isMajor ?? false} />
        <h1
          style={{
            marginTop: 6,
            fontSize: 26,
            lineHeight: 1.1,
            fontWeight: 800,
            color: V4.ink,
            letterSpacing: '-0.02em',
            maxWidth: '80%',
          }}
        >
          {ctx?.event?.name ?? 'No tournament scheduled'}
        </h1>
        <div style={{ marginTop: 6, fontSize: 13, color: V4.inkSoft, fontWeight: 500 }}>
          {ctx?.event?.venue_course_name || ctx?.event?.venue_name || '—'}
          {ctx?.event?.venue_city ? ` · ${ctx.event.venue_city}` : ''}
        </div>

        {state === 'live' && ctx?.event ? (
          <LiveMiniBoard rows={board.data ?? []} isLive />
        ) : null}

        {state === 'completed' && ctx?.event ? (
          <LiveMiniBoard rows={board.data ?? []} isLive={false} />
        ) : null}

        {state === 'upcoming' && ctx?.event ? (
          <UpcomingBlock startDate={ctx.event.start_date} defending={ctx.event.defending_champion} />
        ) : null}
      </div>

      {/* Countdown band — quiet weeks only (upcoming or completed states) */}
      {state !== 'live' && ctx?.nextMajor ? <CountdownBand major={ctx.nextMajor} /> : null}
    </section>
  );
}

function StateEyebrow({ state, isMajor }: { state: string; isMajor: boolean }) {
  if (state === 'live') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: V4.live,
          color: '#fff',
          borderRadius: 999,
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
        className="animate-pulse"
      >
        <Zap size={11} strokeWidth={2.4} /> Live now
      </span>
    );
  }
  const label = state === 'completed' ? 'Final results' : isMajor ? 'Major week' : 'This week';
  const color = isMajor ? V4.gold : V4.amber;
  const bg = isMajor ? V4.goldSoft : V4.amberSoft;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: bg,
        color,
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

function LiveMiniBoard({ rows, isLive }: { rows: { position: number; playerName: string; scoreDisplay: string; thru: number | null; isWinner: boolean }[]; isLive: boolean }) {
  return (
    <div style={{ marginTop: 18, background: V4.surface, borderRadius: 14, border: `0.5px solid ${V4.hairline}`, overflow: 'hidden' }}>
      {rows.length === 0 ? (
        <div style={{ padding: 14, fontSize: 12, color: V4.inkFaint }}>Awaiting scoring…</div>
      ) : (
        rows.map((r, i) => (
          <div
            key={r.playerName + i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
              background: r.isWinner ? V4.amberSoft : 'transparent',
            }}
          >
            <div style={{ width: 22, textAlign: 'center', fontSize: 12, fontWeight: 800, color: V4.ink, fontVariantNumeric: 'tabular-nums' }}>
              {r.position}
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: V4.ink }}>
              {r.playerName}
              {r.isWinner ? <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: V4.amber, letterSpacing: '0.1em' }}>WINNER</span> : null}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: V4.ink, fontVariantNumeric: 'tabular-nums' }}>{r.scoreDisplay}</div>
            {isLive ? (
              <div style={{ marginLeft: 10, fontSize: 11, color: V4.inkFaint, minWidth: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {r.thru != null ? (r.thru >= 18 ? 'F' : `thru ${r.thru}`) : ''}
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

function UpcomingBlock({ startDate, defending }: { startDate: string; defending: string | null }) {
  const cd = useCountdown(startDate);
  return (
    <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {(['days', 'hours', 'minutes', 'seconds'] as const).map((k) => (
        <div
          key={k}
          style={{
            background: V4.surface,
            border: `0.5px solid ${V4.hairline}`,
            borderRadius: 12,
            padding: '10px 6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, color: V4.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {cd ? String(cd[k]).padStart(2, '0') : '--'}
          </div>
          <div style={{ marginTop: 2, fontSize: 9.5, color: V4.inkFaint, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{k}</div>
        </div>
      ))}
      {defending ? (
        <div style={{ gridColumn: '1 / -1', marginTop: 4, fontSize: 12, color: V4.inkSoft }}>
          <span style={{ fontWeight: 700, color: V4.ink }}>Defending:</span> {defending}
        </div>
      ) : null}
    </div>
  );
}

function CountdownBand({ major }: { major: { name: string; days_away: number; venue: string | null } }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        borderTop: `0.5px solid ${V4.hairline}`,
        background: V4.goldSoft,
      }}
    >
      <MapPin size={12} color={V4.gold} strokeWidth={2.4} />
      <div style={{ fontSize: 11, fontWeight: 800, color: V4.gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Next major
      </div>
      <div style={{ marginLeft: 4, fontSize: 12, fontWeight: 700, color: V4.ink, flex: 1 }}>
        {major.name}
        {major.venue ? <span style={{ color: V4.inkSoft, fontWeight: 500 }}> · {major.venue}</span> : null}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: V4.gold, fontVariantNumeric: 'tabular-nums' }}>
        {major.days_away}d
      </div>
    </div>
  );
}
