/**
 * WorldRankings — three independent boards; ink-active chips, thin rank
 * numerals (rank 1 in amberDeep), movement arrows w/ up/down colors.
 */

import { useState } from 'react';
import { SectionShell, V4Card } from './SectionShell';
import { V4, NUMERAL_THIN } from '../tokens';
import { useRankingsBoards, type RankingsBoard } from '../data/useRankingsBoards';

const BOARDS: { id: RankingsBoard; label: string; meta: string }[] = [
  { id: 'owgr', label: 'OWGR', meta: 'Official World Golf Ranking' },
  { id: 'r2d', label: 'Race to Dubai', meta: 'DP World Tour season race' },
  { id: 'rolex', label: 'Rolex Rankings', meta: 'Women\u2019s world ranking' },
];

export function WorldRankings() {
  const [board, setBoard] = useState<RankingsBoard>('owgr');
  const { data, isLoading } = useRankingsBoards(board);
  const meta = BOARDS.find((b) => b.id === board)?.meta ?? '';

  return (
    <SectionShell eyebrow="World rankings">
      <div style={{ display: 'flex', gap: 6, padding: '0 20px', marginBottom: 8, overflowX: 'auto' }}>
        {BOARDS.map((b) => {
          const active = b.id === board;
          return (
            <button
              key={b.id}
              onClick={() => setBoard(b.id)}
              style={{
                padding: '7px 13px',
                borderRadius: 14,
                border: active ? '0.5px solid transparent' : `0.5px solid ${V4.hairline}`,
                background: active ? V4.ink : V4.surface,
                color: active ? '#FFFFFF' : V4.ink,
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: '0 20px 6px', fontSize: 11, fontWeight: 500, color: V4.inkMute }}>{meta}</div>
      <div style={{ margin: '0 20px' }}>
        <V4Card style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: 14, fontSize: 12, color: V4.inkFaint }}>Loading…</div>
          ) : (data ?? []).length === 0 ? (
            <div style={{ padding: 14, fontSize: 12, color: V4.inkFaint }}>No rankings yet.</div>
          ) : (
            (data ?? []).map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                }}
              >
                <div style={{ width: 26, textAlign: 'center', fontSize: 17, color: r.rank === 1 ? V4.amberDeep : V4.ink, ...NUMERAL_THIN }}>
                  {r.rank}
                </div>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: '34%',
                    background: '#15171F',
                    color: V4.amber,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800,
                    backgroundImage: r.photoUrl ? `url(${r.photoUrl})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    flexShrink: 0,
                  }}
                >
                  {!r.photoUrl ? initials(r.playerName) : null}
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.playerName}
                </div>
                {r.points != null ? (
                  <div style={{ minWidth: 52, textAlign: 'right', fontSize: 12, fontWeight: 800, color: V4.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(r.points).toLocaleString()}
                  </div>
                ) : null}
                {r.movement != null && r.movement !== 0 ? (
                  <div style={{ minWidth: 34, textAlign: 'right', fontSize: 11, fontWeight: 800, color: r.movement > 0 ? V4.up : V4.down, fontVariantNumeric: 'tabular-nums' }}>
                    {r.movement > 0 ? '▲' : '▼'} {Math.abs(r.movement)}
                  </div>
                ) : (
                  <div style={{ minWidth: 34, textAlign: 'right', fontSize: 11, color: V4.inkFaint }}>—</div>
                )}
              </div>
            ))
          )}
        </V4Card>
      </div>
    </SectionShell>
  );
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
