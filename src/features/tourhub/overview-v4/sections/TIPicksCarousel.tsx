/**
 * TIPicksCarousel — cards ~232px; meta "fit N" only (NO models line);
 * rank in thin gold numerals; state-aware strips backed by real leaderboard rows.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIPredictions } from '../../hooks/useAIPredictions';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import type { EventState } from '../data/useTourEventContext';
import type { AITopContender } from '../../hooks/useAIPredictions';
import { usePickLiveState, type PickLiveState } from '../data/usePickLiveState';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';

interface Props {
  tournamentId: string | undefined;
  state: EventState;
  tourCode?: string;
}


// ---- Shared formatting helpers ----

function formatPosition(pos: number | null | undefined, tied: boolean): string {
  if (pos == null || !Number.isFinite(pos)) return '—';
  return `${tied ? 'T' : ''}${pos}`;
}

function formatScore(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  if (v === 0) return 'E';
  return v > 0 ? `+${v}` : String(v);
}

function scoreColor(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return V4.inkFaint;
  if (v === 0) return V4.scoreEven;
  return v < 0 ? V4.scoreUnder : V4.scoreOver;
}

function formatThru(thru: number | null | undefined): string {
  if (thru == null || !Number.isFinite(thru)) return '';
  return thru >= 18 ? 'F' : `thru ${thru}`;
}

function verdict(live: PickLiveState | undefined): { hit: boolean; label: string } {
  if (!live || live.position == null) {
    return { hit: false, label: 'MISS' };
  }
  const posText = formatPosition(live.position, live.positionTied);
  const scoreText = formatScore(live.score);
  if (live.position === 1) return { hit: true, label: `WON · ${scoreText}` };
  const hit = live.position <= 10;
  return { hit, label: `${hit ? 'HIT' : 'MISS'} · ${posText} · ${scoreText}` };
}

type SheetState =
  | null
  | { kind: 'index' }
  | { kind: 'case'; pick: AITopContender; from: 'index' | 'card' };

export function TIPicksCarousel({ tournamentId, state, tourCode = 'pga' }: Props) {
  const navigate = useNavigate();
  const { data } = useAIPredictions(tournamentId ?? null);
  const [sheet, setSheet] = useState<SheetState>(null);
  const picks = data?.topContenders ?? [];

  const playerIds = useMemo(() => picks.map((p) => p.playerId).filter(Boolean), [picks]);
  const needsLiveData = state === 'live' || state === 'completed';
  const { data: liveMap } = usePickLiveState(tournamentId, needsLiveData ? playerIds : [], {
    live: state === 'live',
  });

  if (!tournamentId || picks.length === 0) return null;

  const closeCase = () => {
    if (sheet?.kind === 'case' && sheet.from === 'index') {
      setSheet({ kind: 'index' });
    } else {
      setSheet(null);
    }
  };

  const goToPlayer = (playerId: string) => {
    setSheet(null);
    navigate(`/tourhub/player/${playerId}`);
  };

  return (
    <SectionShell eyebrow="Tournament intelligence" linkLabel="All picks" onLinkClick={() => setSheet({ kind: 'index' })}>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 10px', scrollPaddingLeft: 16, scrollSnapType: 'x mandatory' }}>
        {picks.slice(0, 8).map((p) => (
          <button
            key={p.playerId}
            onClick={() => setSheet({ kind: 'case', pick: p, from: 'card' })}
            style={{
              flex: '0 0 232px',
              scrollSnapAlign: 'start',
              textAlign: 'left',
              background: V4.surface,
              border: `0.5px solid ${V4.cardBorder}`,
              boxShadow: V4.cardShadow,
              borderRadius: V4.cardRadius,
              padding: 13,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <div
              role="link"
              onClick={(e) => { e.stopPropagation(); goToPlayer(p.playerId); }}
              style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}
            >
              <PlayerAvatar playerId={p.playerId} playerName={p.playerName} tourCode={tourCode} photoUrl={p.photoUrl} size="md" ringColor={LIGHT_HAIRLINE} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 22, color: V4.inkFaint, lineHeight: 1, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{p.rank}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pick</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: V4.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.playerName}
                </div>
                {p.courseFitScore != null ? (
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: V4.inkMute, letterSpacing: '0.02em' }}>
                    fit {Math.round(p.courseFitScore)}
                  </div>
                ) : null}
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: V4.inkSoft, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {p.pulledQuote || p.reasons?.[0] || '—'}
            </div>

            <StateStrip state={state} pick={p} live={liveMap?.get(p.playerId)} />

            <div style={{ marginTop: 'auto', fontSize: 10, fontWeight: 800, color: V4.amber, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              The case ›
            </div>
          </button>
        ))}
      </div>

      {sheet?.kind === 'index' ? (
        <AllPicksSheet
          picks={picks}
          state={state}
          tourCode={tourCode}
          liveMap={liveMap}
          onPick={(p) => setSheet({ kind: 'case', pick: p, from: 'index' })}
          onClose={() => setSheet(null)}
          onNavigatePlayer={goToPlayer}
        />
      ) : null}

      {sheet?.kind === 'case' ? (
        <CaseSheet
          pick={sheet.pick}
          state={state}
          live={liveMap?.get(sheet.pick.playerId)}
          tourCode={tourCode}
          onClose={closeCase}
          onNavigatePlayer={goToPlayer}
        />
      ) : null}
    </SectionShell>
  );
}

function ConfBar({ pct }: { pct: number }) {
  return (
    <div>
      <div style={{ height: 4, borderRadius: 999, background: '#EFF1F4', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: `linear-gradient(90deg, ${V4.amber}, ${V4.gold})` }} />
      </div>
      <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: V4.inkMute, fontVariantNumeric: 'tabular-nums' }}>
        {pct}% win prob
      </div>
    </div>
  );
}

function StateStrip({ state, pick, live }: { state: EventState; pick: AITopContender; live: PickLiveState | undefined }) {
  if (state === 'upcoming') {
    const pct = Math.round((pick.winProbability ?? 0) * 100);
    return <ConfBar pct={pct} />;
  }
  if (state === 'live') {
    // No leaderboard row yet — fall back to confidence bar (mirrors upcoming shape).
    if (!live || live.position == null) {
      const pct = Math.round((pick.winProbability ?? 0) * 100);
      return <ConfBar pct={pct} />;
    }
    const pos = formatPosition(live.position, live.positionTied);
    const todayText = live.today != null ? formatScore(live.today) : formatScore(live.score);
    const todayCol = scoreColor(live.today ?? live.score);
    const thruText = formatThru(live.thru);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: V4.inkFaint, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{pos}</span>
        <span style={{ fontSize: 11, color: todayCol, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{todayText}</span>
        {thruText ? (
          <span style={{ marginLeft: 'auto', fontSize: 10.5, color: V4.inkFaint, fontVariantNumeric: 'tabular-nums' }}>{thruText}</span>
        ) : null}
      </div>
    );
  }
  // completed: real verdict from the final row.
  const v = verdict(live);
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 6,
        background: v.hit ? V4.hitBg : V4.missBg,
        color: v.hit ? V4.hitFg : V4.missFg,
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {v.label}
    </span>
  );
}

function SheetShell({ onClose, maxHeight = '80vh', children }: { onClose: () => void; maxHeight?: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)' }} />
      <div
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          background: V4.bg,
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          padding: '10px 20px 30px',
          maxHeight,
          overflowY: 'auto',
        }}
      >
        <div style={{ width: 36, height: 4, background: V4.hairline, borderRadius: 999, margin: '4px auto 14px' }} />
        {children}
      </div>
    </div>
  );
}

function CaseSheet({
  pick,
  state,
  live,
  tourCode,
  onClose,
  onNavigatePlayer,
}: {
  pick: AITopContender;
  state: EventState;
  live: PickLiveState | undefined;
  tourCode: string;
  onClose: () => void;
  onNavigatePlayer: (playerId: string) => void;
}) {
  return (
    <SheetShell onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div
          role="link"
          onClick={() => onNavigatePlayer(pick.playerId)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}
        >
          <PlayerAvatar playerId={pick.playerId} playerName={pick.playerName} tourCode={tourCode} photoUrl={pick.photoUrl} size="md" ringColor={LIGHT_HAIRLINE} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: V4.amber, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                The case for
              </span>
              <span style={{ fontSize: 22, color: V4.inkFaint, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>#{pick.rank}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: V4.ink, margin: '2px 0 0', letterSpacing: '-0.025em' }}>
              {pick.playerName}
            </h2>
            <div style={{ marginTop: 6 }}>
              <SheetStateStrip state={state} pick={pick} live={live} />
            </div>
          </div>
        </div>
      </div>
      {pick.pulledQuote ? (
        <div style={{ fontSize: 14, color: V4.inkSoft, lineHeight: 1.5, marginBottom: 14 }}>{pick.pulledQuote}</div>
      ) : null}
      {(pick.reasons ?? []).map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: `0.5px solid ${V4.hairline}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: V4.amber, minWidth: 22, letterSpacing: '0.08em' }}>{String(i + 1).padStart(2, '0')}</div>
          <div style={{ flex: 1, fontSize: 13, color: V4.ink, lineHeight: 1.5 }}>{r}</div>
        </div>
      ))}
      {pick.concern ? (
        <div style={{ marginTop: 16, padding: 12, background: V4.amberSoft, borderRadius: 10, fontSize: 12, color: V4.ink }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: V4.amber, textTransform: 'uppercase', marginBottom: 4 }}>
            Concern
          </div>
          {pick.concern}
        </div>
      ) : null}
    </SheetShell>
  );
}

function AllPicksSheet({
  picks,
  state,
  tourCode,
  liveMap,
  onPick,
  onClose,
  onNavigatePlayer,
}: {
  picks: AITopContender[];
  state: EventState;
  tourCode: string;
  liveMap: Map<string, PickLiveState> | undefined;
  onPick: (p: AITopContender) => void;
  onClose: () => void;
  onNavigatePlayer: (playerId: string) => void;
}) {
  return (
    <SheetShell onClose={onClose} maxHeight="70vh">
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: V4.ink, letterSpacing: '-0.015em' }}>The board</div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: V4.inkMute, letterSpacing: '0.04em', marginTop: 2 }}>
          {picks.length} picks · tap for the case
        </div>
      </div>
      <div>
        {picks.map((p, i) => (
          <div
            key={p.playerId}
            role="button"
            onClick={() => onPick(p)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18, color: V4.inkFaint, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 22, textAlign: 'right' }}>{p.rank}</span>
            <div
              role="link"
              onClick={(e) => { e.stopPropagation(); onNavigatePlayer(p.playerId); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}
            >
              <PlayerAvatar playerId={p.playerId} playerName={p.playerName} tourCode={tourCode} photoUrl={p.photoUrl} size="sm" ringColor={LIGHT_HAIRLINE} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.playerName}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <SheetStateStrip state={state} pick={p} live={liveMap?.get(p.playerId)} />
            </div>
          </div>
        ))}
      </div>
    </SheetShell>
  );
}

function SheetStateStrip({ state, pick, live }: { state: EventState; pick: AITopContender; live: PickLiveState | undefined }) {
  if (state === 'upcoming') {
    const pct = Math.round((pick.winProbability ?? 0) * 100);
    const fit = pick.courseFitScore != null ? `fit ${Math.round(pick.courseFitScore)}` : null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, color: V4.inkMute, fontVariantNumeric: 'tabular-nums' }}>
        <span>{pct}% win prob</span>
        {fit ? <span style={{ color: V4.inkFaint }}>· {fit}</span> : null}
      </div>
    );
  }
  if (state === 'live') {
    if (!live || live.position == null) {
      const pct = Math.round((pick.winProbability ?? 0) * 100);
      return <div style={{ fontSize: 11, fontWeight: 700, color: V4.inkMute, fontVariantNumeric: 'tabular-nums' }}>{pct}% win prob · not on board yet</div>;
    }
    const pos = formatPosition(live.position, live.positionTied);
    const todayText = live.today != null ? formatScore(live.today) : formatScore(live.score);
    const todayCol = scoreColor(live.today ?? live.score);
    const thruText = formatThru(live.thru);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
        <span style={{ color: V4.inkFaint, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>{pos}</span>
        <span style={{ color: todayCol, fontVariantNumeric: 'tabular-nums' }}>{todayText}</span>
        {thruText ? <span style={{ color: V4.inkFaint, fontVariantNumeric: 'tabular-nums' }}>· {thruText}</span> : null}
      </div>
    );
  }
  const v = verdict(live);
  const finalLine = live && live.position != null
    ? `${formatPosition(live.position, live.positionTied)} · ${formatScore(live.score)}`
    : '—';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          padding: '3px 9px',
          borderRadius: 6,
          background: v.hit ? V4.hitBg : V4.missBg,
          color: v.hit ? V4.hitFg : V4.missFg,
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {v.hit ? (live?.position === 1 ? 'Won' : 'Hit') : 'Miss'}
      </span>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: V4.inkMute, fontVariantNumeric: 'tabular-nums' }}>{finalLine}</span>
    </div>
  );
}
