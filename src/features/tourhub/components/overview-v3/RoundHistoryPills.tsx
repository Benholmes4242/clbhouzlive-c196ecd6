import { getScoreColorSet } from '../../utils/scoreColors';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {rounds.map(r => {
        const isLive = r.roundNum === currentRound;
        const isDone = r.score !== null && !isLive;
        const colors = isDone ? getScoreColorSet(r.score!) : null;
        const fmtScore = r.score === null ? null : r.score === 0 ? 'E' : r.score > 0 ? `+${r.score}` : `${r.score}`;

        return (
          <div key={r.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, padding: '3px 9px', borderRadius: 8,
            background: isLive ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.06)',
            border: isLive ? '1px solid rgba(34,197,94,0.20)' : '1px solid rgba(255,255,255,0.07)',
            minWidth: 72,
          }}>
            <span style={{
              fontSize: 8, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: isLive ? '#22C55E' : 'rgba(255,255,255,0.28)',
            }}>
              {r.label}
            </span>
            {isLive ? (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#22C55E' }}>Live</span>
            ) : isDone && colors ? (
              <span style={{ fontSize: 12, fontWeight: 800, color: colors.text, fontVariantNumeric: 'tabular-nums' }}>{fmtScore}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
