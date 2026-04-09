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
    <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
      {rounds.map(r => {
        const isLive = r.roundNum === currentRound;
        const isDone = r.score !== null && !isLive;
        const colors = isDone ? getScoreColorSet(r.score!) : null;
        const fmtScore = r.score === null ? null : r.score === 0 ? 'E' : r.score > 0 ? `+${r.score}` : `${r.score}`;

        return (
          <div key={r.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            padding: '4px 8px', borderRadius: 8, minWidth: 36,
            background: isLive ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.05)',
            border: isLive ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.10)',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.5px' }}>
              {r.label}
            </span>
            {isLive ? (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#22C55E' }}>
                Live
              </span>
            ) : isDone ? (
              <span style={{ fontSize: 12, fontWeight: 800, color: colors!.text }}>
                {fmtScore}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
