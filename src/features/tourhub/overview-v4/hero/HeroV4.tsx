/**
 * HeroV4 — dark full-bleed hero with three states + optional quiet-week
 * countdown band. Spec ref: Brief O2.1 section 1.
 */

import { Zap, MapPin } from 'lucide-react';
import { V4, HERO_HEIGHT_CSS, heroGradient, NUMERAL_THIN } from '../tokens';
import { TourPicker } from './TourPicker';
import { useHeroLeaderboard, type HeroLeaderboardEntry } from '../data/useHeroLeaderboard';
import { useCountdown } from '@/hooks/useCountdown';
import type { TourEventContext } from '../data/useTourEventContext';
import type { TourId } from '../../hooks/useOverviewData';

interface Props {
  ctx: TourEventContext | undefined;
  tour: TourId;
  onTourChange: (t: TourId) => void;
}

const FROST_BG = 'rgba(10,14,20,0.66)';
const FROST_BORDER = 'rgba(255,255,255,0.10)';
const WHITE = '#FFFFFF';
const WHITE_SOFT = 'rgba(255,255,255,0.72)';
const WHITE_FAINT = 'rgba(255,255,255,0.55)';

export function HeroV4({ ctx, tour, onTourChange }: Props) {
  const state = ctx?.state ?? 'upcoming';
  const isLive = state === 'live';
  const board = useHeroLeaderboard(ctx?.event?.id, { live: isLive });
  const showBand = state !== 'live' && ctx?.nextMajor && !ctx?.isMajor;

  return (
    <section
      style={{
        position: 'relative',
        minHeight: HERO_HEIGHT_CSS,
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        background: heroGradient(tour),
        overflow: 'hidden',
        color: WHITE,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Ambient glow overlays */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 12% 8%, rgba(247,147,30,0.18), transparent 42%), radial-gradient(circle at 92% 100%, rgba(255,255,255,0.06), transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top, 0px), 47px)', right: 14, marginTop: 6, zIndex: 5 }}>
        <TourPicker tour={tour} onChange={onTourChange} />
      </div>

      <div style={{ position: 'relative', padding: '20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <StateEyebrow state={state} isMajor={ctx?.isMajor ?? false} />
        <h1
          style={{
            marginTop: 8,
            fontSize: 28,
            lineHeight: 1.06,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            maxWidth: '82%',
          }}
        >
          {ctx?.event?.name ?? 'No tournament scheduled'}
        </h1>
        <div style={{ marginTop: 6, fontSize: 12.5, color: WHITE_SOFT, fontWeight: 500 }}>
          {ctx?.event?.venue_course_name || ctx?.event?.venue_name || '—'}
          {ctx?.event?.venue_city ? ` · ${ctx.event.venue_city}` : ''}
        </div>

        {state === 'live' && ctx?.event ? (
          <FrostedMiniBoard rows={board.data ?? []} showThru />
        ) : null}

        {state === 'upcoming' && ctx?.event ? (
          <UpcomingCells startDate={ctx.event.start_date} defending={ctx.event.defending_champion} isMajor={ctx?.isMajor ?? false} />
        ) : null}

        {state === 'completed' && ctx?.event ? (
          <ChampionStrip rows={board.data ?? []} />
        ) : null}
      </div>

      {showBand && ctx?.nextMajor ? <CountdownBand major={ctx.nextMajor} /> : null}
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
          gap: 7,
          padding: '4px 10px',
          background: V4.live,
          color: WHITE,
          borderRadius: 999,
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: WHITE }} className="animate-pulse" />
        <Zap size={11} strokeWidth={2.6} /> Live · Round 3
      </span>
    );
  }
  if (state === 'completed') {
    return <Eyebrow label="Final · Champion" color={V4.gold} />;
  }
  return <Eyebrow label={isMajor ? 'Major week' : 'Next up'} color={isMajor ? V4.gold : V4.amber} />;
}

function Eyebrow({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 800, color, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
      {label}
    </span>
  );
}

function scoreColor(display: string): string {
  if (!display || display === 'E' || display === '—') return WHITE_FAINT;
  if (display.startsWith('-')) return V4.live;
  if (display.startsWith('+')) return WHITE_SOFT;
  return WHITE;
}

function FrostedMiniBoard({ rows, showThru }: { rows: HeroLeaderboardEntry[]; showThru: boolean }) {
  return (
    <div
      style={{
        marginTop: 18,
        background: FROST_BG,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 14,
        border: `1px solid ${FROST_BORDER}`,
        overflow: 'hidden',
      }}
    >
      {rows.length === 0 ? (
        <div style={{ padding: 14, fontSize: 12, color: WHITE_FAINT }}>Awaiting scoring…</div>
      ) : (
        rows.slice(0, 3).map((r, i) => (
          <div
            key={r.playerName + i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 14px',
              borderTop: i === 0 ? 'none' : `0.5px solid ${FROST_BORDER}`,
            }}
          >
            <div style={{ width: 22, textAlign: 'center', fontSize: 15, color: V4.gold, ...NUMERAL_THIN }}>
              {r.position}
            </div>
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: WHITE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.playerName}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: scoreColor(r.scoreDisplay), fontVariantNumeric: 'tabular-nums' }}>
              {r.scoreDisplay}
            </div>
            {showThru ? (
              <div style={{ minWidth: 34, textAlign: 'right', fontSize: 10.5, color: WHITE_FAINT, fontVariantNumeric: 'tabular-nums' }}>
                {r.thru != null ? (r.thru >= 18 ? 'F' : `t${r.thru}`) : ''}
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: FROST_BG,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${FROST_BORDER}`,
        borderRadius: 12,
        padding: '10px 8px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 800, color: WHITE, letterSpacing: '-0.01em' }}>{value}</div>
      <div style={{ marginTop: 3, fontSize: 8, fontWeight: 800, color: WHITE_FAINT, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

function UpcomingCells({ startDate, defending, isMajor }: { startDate: string; defending: string | null; isMajor: boolean }) {
  const cd = useCountdown(startDate);
  const dt = new Date(startDate);
  const day = dt.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
  const dayNum = dt.getDate();
  const mon = dt.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  const startsLabel = cd && cd.days > 0 ? `${cd.days}D ${String(cd.hours).padStart(2, '0')}H` : `${day} ${dayNum} ${mon}`;
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', gap: 9 }}>
        <Cell label="Starts" value={startsLabel} />
        <Cell label="First tee" value="07:15" />
        <Cell label="Defends" value={defending ? shortName(defending) : '—'} />
      </div>
      {isMajor ? (
        <div style={{ marginTop: 12, fontSize: 10.5, fontWeight: 800, color: V4.gold, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Season's fourth major
        </div>
      ) : null}
    </div>
  );
}

function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return full;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function ChampionStrip({ rows }: { rows: HeroLeaderboardEntry[] }) {
  const winner = rows.find((r) => r.isWinner) ?? rows[0];
  if (!winner) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 14px',
          background: 'linear-gradient(100deg, rgba(201,162,39,0.30) 0%, rgba(201,162,39,0.08) 100%)',
          border: '1px solid rgba(201,162,39,0.40)',
          borderRadius: 15,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '34%',
            background: '#15171F',
            border: `1.5px solid ${V4.gold}`,
            backgroundImage: winner.photoUrl ? `url(${winner.photoUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: WHITE, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {winner.playerName}
          </div>
          <div style={{ marginTop: 2, fontSize: 11, color: WHITE_FAINT, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Champion
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, color: V4.gold, lineHeight: 1, ...NUMERAL_THIN }}>{winner.scoreDisplay}</div>
          <div style={{ marginTop: 3, fontSize: 8, fontWeight: 800, color: WHITE_FAINT, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Final
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          background: FROST_BG,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${FROST_BORDER}`,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {rows.slice(0, 3).map((r, i) => (
          <div
            key={r.playerName + i}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: i === 0 ? 'none' : `0.5px solid ${FROST_BORDER}` }}
          >
            <div style={{ width: 22, textAlign: 'center', fontSize: 14, color: V4.gold, ...NUMERAL_THIN }}>{r.position}</div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: WHITE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.playerName}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: scoreColor(r.scoreDisplay), fontVariantNumeric: 'tabular-nums' }}>{r.scoreDisplay}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountdownBand({ major }: { major: { name: string; days_away: number; venue: string | null } }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderTop: '1px solid rgba(201,162,39,0.40)',
        background: 'linear-gradient(90deg, rgba(201,162,39,0.28) 0%, rgba(201,162,39,0.10) 100%)',
      }}
    >
      <MapPin size={12} color={V4.gold} strokeWidth={2.4} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: V4.gold, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {major.name}
        </div>
        {major.venue ? (
          <div style={{ marginTop: 1, fontSize: 11, color: WHITE_SOFT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {major.venue}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, color: V4.gold, ...NUMERAL_THIN }}>{major.days_away}</span>
        <span style={{ fontSize: 8.5, fontWeight: 800, color: V4.gold, letterSpacing: '0.14em' }}>DAYS</span>
      </div>
    </div>
  );
}
