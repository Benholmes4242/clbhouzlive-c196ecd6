/**
 * FeaturedGroupsRail — TD1 On-the-Course rail. Reads useFeaturedGroups.
 * 150px cards: HOLE {n} + member rows (avatar + name + score).
 * Self-hides on empty (parent decides via presence of children).
 */
import { useNavigate } from 'react-router-dom';
import { useFeaturedGroups } from '../../overview/data/useFeaturedGroups';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { SectionEyebrow } from './SectionEyebrow';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import {
  FONT, INK, INK_MUTE, INK_FAINT, SURFACE, HAIRLINE_INK_8,
  SCORE_UNDER_PAR_LIGHT, SCORE_OVER_PAR_LIGHT,
} from '../../_shared/tokens';

interface Props {
  tournamentId: string;
  live: boolean;
  tourCode: string;
}

function parseGroups(raw: unknown): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && raw !== null) {
    const g = (raw as any).groups;
    if (Array.isArray(g)) return g;
  }
  return [];
}
function fmtScore(v: any): string | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return String(v);
  if (n === 0) return 'E';
  return n < 0 ? String(n) : `+${n}`;
}
function scoreColor(s: string | null): string {
  if (!s || s === 'E') return INK;
  if (s.startsWith('-')) return SCORE_UNDER_PAR_LIGHT;
  return SCORE_OVER_PAR_LIGHT;
}

export function FeaturedGroupsRail({ tournamentId, live, tourCode }: Props) {
  const navigate = useNavigate();
  const { data } = useFeaturedGroups(tournamentId, { live });
  const groups = parseGroups(data);
  // Self-hide when there are no featured groups. Eyebrow lives INSIDE
  // the rail so a live event without groups shows no floating chrome
  // (Brief F-TD-3 §1).
  if (groups.length === 0) return null;

  return (
    <>
      <SectionEyebrow kicker="On the Course" />
      <div
        style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          padding: '0 16px 8px', scrollSnapType: 'x mandatory',
          fontFamily: FONT,
        }}
      >
      {groups.map((g: any, gi: number) => {
        const thru = typeof g.thru === 'number' ? g.thru : null;
        return (
          <div
            key={g.group_id ?? gi}
            style={{
              minWidth: 218, flexShrink: 0, scrollSnapAlign: 'start',
              background: SURFACE, border: `0.5px solid ${HAIRLINE_INK_8}`,
              borderRadius: 12, padding: '12px',
            }}
          >
            <div
              style={{
                fontSize: 9, fontWeight: 800, color: INK_FAINT,
                letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8,
              }}
            >
              {thru != null ? `HOLE ${thru >= 18 ? 'F' : thru}` : 'ON COURSE'}
            </div>
            {(g.players ?? []).slice(0, 3).map((p: any, pi: number) => {
              const name = p.full_name || p.name || '';
              const display = fmtScore(p.today) ?? fmtScore(p.score) ?? '—';
              const status = (p.status || '').toUpperCase();
              const isCut = status === 'CUT' || status === 'WD' || status === 'DQ';
              return (
                <button
                  key={pi}
                  type="button"
                  onClick={() => { if (p.player_id) navigate(`/tourhub/player/${p.player_id}`); }}
                  disabled={!p.player_id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 0', width: '100%',
                    background: 'transparent', border: 'none',
                    borderTop: pi === 0 ? 'none' : `0.5px solid ${HAIRLINE_INK_8}`,
                    textAlign: 'left', cursor: p.player_id ? 'pointer' : 'default',
                    fontFamily: FONT,
                  }}
                >
                  <PlayerAvatar
                    playerId={p.player_id ?? name}
                    playerName={name}
                    tourCode={tourCode}
                    photoUrl={p.photo_url ?? null}
                    size="xs"
                    ringColor={LIGHT_HAIRLINE}
                  />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                  </div>
                  {isCut ? (
                    <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.10em' }}>{status}</span>
                  ) : (
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: scoreColor(display), fontVariantNumeric: 'tabular-nums' }}>
                      {display}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
      </div>
    </>
  );
}
