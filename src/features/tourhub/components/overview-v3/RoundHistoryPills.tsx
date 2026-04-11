

interface RoundHistoryPillsProps {
  round1: number | null;
  round2: number | null;
  round3: number | null;
  round4: number | null;
  currentRound: number;
}

export function RoundHistoryPills({ round1, round2, round3, round4, currentRound }: RoundHistoryPillsProps) {
  const rounds = [
    { label: 'R1', score: round1, roundNum: 1 },
    { label: 'R2', score: round2, roundNum: 2 },
    { label: 'R3', score: round3, roundNum: 3 },
    { label: 'R4', score: round4, roundNum: 4 },
  ].filter(r => r.roundNum <= currentRound);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, width: 'fit-content' }}>
      {rounds.map(r => {
        const isLive = r.roundNum === currentRound && r.score === null;
        const isDone = r.score !== null;
        const fmtScore = r.score === null ? null : r.score === 0 ? 'E' : r.score > 0 ? `+${r.score}` : `${r.score}`;

        return (
          <div key={r.label} style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            padding: '4px 6px',
            borderRadius: 7,
            background: isLive ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.05)',
            border: isLive ? '1px solid rgba(34,197,94,0.20)' : '1px solid rgba(255,255,255,0.08)',
            minWidth: 32,
          }}>
            <span style={{
              fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: isLive ? '#22C55E' : 'rgba(255,255,255,0.28)',
              lineHeight: 1.3,
            }}>
              {r.label}
            </span>
            {isLive ? (
              <span style={{ fontSize: 8, fontWeight: 800, color: '#22C55E', lineHeight: 1.3, letterSpacing: 0.6 }}>LIVE</span>
            ) : isDone ? (
              <span style={{ fontSize: 8, fontWeight: 800, color: r.score! < 0 ? '#ffffff' : r.score! > 0 ? '#f87171' : 'rgba(255,255,255,0.5)', lineHeight: 1.3, fontVariantNumeric: 'tabular-nums' }}>{fmtScore}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
