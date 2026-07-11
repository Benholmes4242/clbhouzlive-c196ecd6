/**
 * TIPicksCarousel — Overview V4 tournament intelligence rail.
 *
 * Sourced from useAIPredictions (existing hook, leaf module — NOT from
 * overview/v2/v3 orchestrators). Peek cards at ~232px width; state-aware
 * right strip (HIT/MISS overlay on completed events). Tap a card to open
 * a lightweight CASE bottom sheet with the pick's reasoning.
 */

import { useState } from 'react';
import { useAIPredictions } from '../../hooks/useAIPredictions';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
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
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          padding: '0 16px 8px',
          scrollSnapType: 'x mandatory',
        }}
      >
        {picks.slice(0, 8).map((p) => (
          <button
            key={p.playerId}
            onClick={() => setOpen(p)}
            style={{
              flex: '0 0 232px',
              scrollSnapAlign: 'start',
              textAlign: 'left',
              background: V4.surface,
              border: `0.5px solid ${V4.hairline}`,
              borderRadius: 14,
              padding: 12,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '34%',
                  background: '#EEE',
                  backgroundImage: p.photoUrl ? `url(${p.photoUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: `1px solid ${V4.hairline}`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: V4.amber, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  #{p.rank} Pick
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: V4.ink, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.playerName}
                </div>
                <div style={{ fontSize: 11, color: V4.inkFaint, fontWeight: 500 }}>
                  {Math.round((p.winProbability ?? 0) * 100)}% win prob
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: V4.inkSoft, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {p.pulledQuote || p.reasons?.[0] || '—'}
            </div>
            {state === 'completed' ? <ResultStrip label="TBC" /> : null}
          </button>
        ))}
      </div>

      {open ? <CaseSheet pick={open} onClose={() => setOpen(null)} /> : null}
    </SectionShell>
  );
}

function ResultStrip({ label }: { label: 'HIT' | 'MISS' | 'TBC' }) {
  const bg = label === 'HIT' ? V4.live : label === 'MISS' ? '#EF4444' : V4.hairline;
  const color = label === 'TBC' ? V4.ink : '#fff';
  return (
    <div
      style={{
        marginTop: 10,
        alignSelf: 'flex-end',
        padding: '3px 8px',
        borderRadius: 6,
        background: bg,
        color,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        display: 'inline-block',
      }}
    >
      {label}
    </div>
  );
}

function CaseSheet({ pick, onClose }: { pick: AITopContender; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)' }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: V4.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '10px 18px 28px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: 36, height: 4, background: V4.hairline, borderRadius: 999, margin: '4px auto 12px' }} />
        <div style={{ fontSize: 10.5, fontWeight: 800, color: V4.amber, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          The case for #{pick.rank}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: V4.ink, margin: '4px 0 12px', letterSpacing: '-0.02em' }}>
          {pick.playerName}
        </h2>
        {(pick.reasons ?? []).map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: V4.amber, minWidth: 20 }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ flex: 1, fontSize: 13, color: V4.ink, lineHeight: 1.45 }}>{r}</div>
          </div>
        ))}
        {pick.concern ? (
          <div style={{ marginTop: 14, padding: 12, background: V4.amberSoft, borderRadius: 10, fontSize: 12, color: V4.ink }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: V4.amber, textTransform: 'uppercase', marginBottom: 4 }}>
              Concern
            </div>
            {pick.concern}
          </div>
        ) : null}
      </div>
    </div>
  );
}
