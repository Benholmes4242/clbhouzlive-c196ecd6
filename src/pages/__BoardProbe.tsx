/** TEMP measurement harness — deleted after verification. */
import { BoardTable, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';

const mk = (id: string, name: string, pos: number, extra?: Partial<BoardEntry>): BoardEntry =>
  ({
    id,
    position: pos,
    position_tied: false,
    score: -8 + pos,
    thru: 12,
    round_1: -3,
    round_2: -2,
    round_3: -1,
    round_4: null,
    status: null,
    player: { id: `p${id}`, full_name: name, country_code: 'US' },
    ...extra,
  } as unknown as BoardEntry);

export default function BoardProbe() {
  const entries: BoardEntry[] = [
    mk('1', 'Jon Rahm', 1),
    mk('2', 'Joaquin Niemann Rodriguez Villalobos', 2),
    mk('3', 'Matthieu Pavon', 3),
    mk('4', 'Erik van Rooyen', 4, { status: 'CUT', position: null } as Partial<BoardEntry>),
  ];
  return (
    <div data-probe style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <BoardTable
        entries={entries}
        cutState={{ cutLine: -1, cutRound: 2 } as never}
        currentRound={4}
      />
    </div>
  );
}
