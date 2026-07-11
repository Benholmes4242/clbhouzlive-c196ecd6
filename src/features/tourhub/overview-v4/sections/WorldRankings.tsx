/**
 * WorldRankings — three independent boards (OWGR / R2D / ROLEX). The chip
 * row does NOT follow the hero tour picker.
 */

import { useState } from 'react';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { useRankingsBoards, type RankingsBoard } from '../data/useRankingsBoards';

const BOARDS: { id: RankingsBoard; label: string }[] = [
  { id: 'owgr', label: 'OWGR' },
  { id: 'r2d', label: 'Race to Dubai' },
  { id: 'rolex', label: 'Rolex Rankings' },
];

export function WorldRankings() {
  const [board, setBoard] = useState<RankingsBoard>('owgr');
  const { data, isLoading } = useRankingsBoards(board);

  return (
    <SectionShell eyebrow="World rankings">
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 8, overflowX: 'auto' }}>
        {BOARDS.map((b) => {
          const active = b.id === board;
          return (
            <button
              key={b.id}
              onClick={() => setBoard(b.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: `0.5px solid ${active ? V4.ink : V4.hairline}`,
                background: active ? V4.ink : V4.surface,
                color: active ? '#fff' : V4.ink,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>
      <div style={{ margin: '0 16px', background: V4.surface, border: `0.5px solid ${V4.hairline}`, borderRadius: 14, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 14, fontSize: 12, color: V4.inkFaint }}>Loading…</div>
        ) : (data ?? []).length === 0 ? (
          <div style={{ padding: 14, fontSize: 12, color: V4.inkFaint }}>No rankings yet.</div>
        ) : (
          (data ?? []).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}` }}>
              <div style={{ width: 22, textAlign: 'center', fontSize: 12, fontWeight: 800, color: V4.ink, fontVariantNumeric: 'tabular-nums' }}>
                {r.rank}
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: V4.ink }}>{r.playerName}</div>
              {r.movement != null && r.movement !== 0 ? (
                <div style={{ fontSize: 11, fontWeight: 700, color: r.movement > 0 ? V4.live : '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
                  {r.movement > 0 ? '▲' : '▼'} {Math.abs(r.movement)}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: V4.inkFaint }}>—</div>
              )}
              {r.points != null ? (
                <div style={{ minWidth: 50, textAlign: 'right', fontSize: 12, fontWeight: 800, color: V4.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(r.points).toLocaleString()}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </SectionShell>
  );
}
