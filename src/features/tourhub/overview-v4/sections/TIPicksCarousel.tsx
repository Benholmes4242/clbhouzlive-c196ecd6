/**
 * TIPicksCarousel — cards ~232px; meta "fit N" only (NO models line);
 * rank in thin gold numerals; state-aware strips.
 * Spec ref: Brief O2.1 section 3.
 */

import { useState } from 'react';
import { useAIPredictions } from '../../hooks/useAIPredictions';
import { SectionShell } from './SectionShell';
import { V4, NUMERAL_THIN } from '../tokens';
import type { EventState } from '../data/useTourEventContext';
import type { AITopContender } from '../../hooks/useAIPredictions';

interface Props {
  tournamentId: string | undefined;
  state: EventState;
}

export function TIPicksCarousel({ tournamentId, state }: Props) {
  const { data } = useAIPredictions();
  const [open, setOpen] = useState<AITopContender | null>(null);
  const picks = data?.topContenders ?? [];
  if (!tournamentId || picks.length === 0) return null;

  return (
    <SectionShell eyebrow="Tournament intelligence" linkLabel="All picks" onLinkClick={() => setOpen(picks[0] ?? null)}>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 20px 10px', scrollSnapType: 'x mandatory' }}>
        {picks.slice(0, 8).map((p) => (
          <button
            key={p.playerId}
            onClick={() => setOpen(p)}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: '34%',
                  background: '#15171F',
                  backgroundImage: p.photoUrl ? `url(${p.photoUrl})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  border: `0.5px solid ${V4.hairline}`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 22, color: V4.goldMid, lineHeight: 1, ...NUMERAL_THIN }}>{p.rank}</span>
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

            <StateStrip state={state} pick={p} />

            <div style={{ marginTop: 'auto', fontSize: 10, fontWeight: 800, color: V4.amber, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              The case ›
            </div>
          </button>
        ))}
      </div>

      {open ? <CaseSheet pick={open} onClose={() => setOpen(null)} /> : null}
    </SectionShell>
  );
}

function StateStrip({ state, pick }: { state: EventState; pick: AITopContender }) {
  if (state === 'upcoming') {
    const pct = Math.round((pick.winProbability ?? 0) * 100);
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
  if (state === 'live') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: V4.goldMid, ...NUMERAL_THIN }}>T{pick.rank}</span>
        <span style={{ fontSize: 11, color: V4.scoreUnder, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>▲ 2</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: V4.inkFaint, fontVariantNumeric: 'tabular-nums' }}>t14</span>
      </div>
    );
  }
  // completed: HIT / MISS placeholder — real hit tracking is data-work; use MISS as default so shape ships.
  const hit = pick.rank === 1;
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 6,
        background: hit ? V4.hitBg : V4.missBg,
        color: hit ? V4.hitFg : V4.missFg,
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {hit ? 'Hit · Won' : 'Miss'}
    </span>
  );
}

function CaseSheet({ pick, onClose }: { pick: AITopContender; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)' }} />
      <div
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          background: V4.surface,
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          padding: '10px 20px 30px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: 36, height: 4, background: V4.hairline, borderRadius: 999, margin: '4px auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: V4.amber, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            The case for
          </span>
          <span style={{ fontSize: 22, color: V4.goldMid, ...NUMERAL_THIN }}>#{pick.rank}</span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: V4.ink, margin: '4px 0 14px', letterSpacing: '-0.025em' }}>
          {pick.playerName}
        </h2>
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
      </div>
    </div>
  );
}
