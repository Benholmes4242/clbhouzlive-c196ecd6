/**
 * OnTheCourse — live-only horizontal rail of featured groups.
 * Card min 218; header TEE {time} · THRU {n}; row = 24px squircle + name + score
 * (falls back to formatted total, CUT/WD as muted tag).
 */

import { useNavigate } from 'react-router-dom';
import { useFeaturedGroups } from '../data/useFeaturedGroups';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { getScoreColor } from '../../_shared/scoreColor';

import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { SPACE } from '@/lib/spacing';

interface Props {
  tournamentId: string | undefined;
  live: boolean;
  tourCode?: string;
}

interface GroupPlayerShape {
  player_id?: string;
  full_name?: string;
  name?: string;
  photo_url?: string | null;
  headshot_override?: string | null;
  score?: number | string | null;
  today?: number | string | null;
  thru?: number | null;
  status?: string | null;
}

interface GroupShape {
  group_id?: string;
  tee_time?: string;
  thru?: number | null;
  players?: GroupPlayerShape[];
}

function parseGroups(raw: unknown): GroupShape[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as GroupShape[];
  if (typeof raw === 'object' && raw !== null) {
    const g = (raw as Record<string, unknown>).groups;
    if (Array.isArray(g)) return g as GroupShape[];
  }
  return [];
}

function parseRoundNumber(raw: unknown): number | null {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = (raw as Record<string, unknown>).round_number;
    if (typeof r === 'number' && Number.isFinite(r)) return r;
    if (typeof r === 'string') {
      const n = Number(r);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}


function formatScore(v: number | string | null | undefined): string | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return String(v);
  if (n === 0) return 'E';
  return n < 0 ? String(n) : `+${n}`;
}

function scoreColor(s: string | null): string {
  if (!s || s === 'E') return V4.scoreEven;
  const n = s.startsWith('-') ? -1 : 1;
  return getScoreColor(n, 'light');
}


function groupThru(g: GroupShape): number | null {
  if (typeof g.thru === 'number') return g.thru;
  const first = g.players?.find((p) => typeof p.thru === 'number')?.thru;
  return typeof first === 'number' ? first : null;
}

export function OnTheCourse({ tournamentId, live, tourCode = 'pga' }: Props) {
  const navigate = useNavigate();
  const { data } = useFeaturedGroups(tournamentId, { live });
  if (!live) return null;
  const groups = parseGroups(data);
  if (groups.length === 0) return null;
  const round = parseRoundNumber(data);

  return (
    <SectionShell eyebrow="On the course" eyebrowColor={V4.amber} rightMeta={round != null ? `R${round}` : undefined} style={{ marginTop: SPACE.sectionSection }}>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 6px', scrollPaddingLeft: 16, scrollSnapType: 'x mandatory' }}>
        {groups.map((g, gi) => {
          const thru = groupThru(g);
          const time = g.tee_time ? new Date(g.tee_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toUpperCase() : '';
          return (
            <div
              key={g.group_id ?? gi}
              style={{
                minWidth: 218,
                flexShrink: 0,
                scrollSnapAlign: 'start',
                background: V4.surface,
                border: `0.5px solid ${V4.cardBorder}`,
                boxShadow: V4.cardShadow,
                borderRadius: 14,
                padding: '12px 12px 10px',
              }}
            >
              <div style={{ fontSize: 9.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                {time ? `TEE ${time}` : ''}
                {time && thru != null ? ' · ' : ''}
                {thru != null ? `THRU ${thru >= 18 ? 'F' : thru}` : ''}
              </div>
              {(g.players ?? []).slice(0, 3).map((p, pi) => {
                const name = p.full_name || p.name || '';
                const status = (p.status || '').toUpperCase();
                const isCut = status === 'CUT' || status === 'WD' || status === 'DQ';
                const display = formatScore(p.today) ?? formatScore(p.score) ?? '—';
                return (
                  <button
                    key={pi}
                    type="button"
                    onClick={() => { if (p.player_id) navigate(`/tourhub/player/${p.player_id}`); }}
                    disabled={!p.player_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '6px 0',
                      minHeight: 40,
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderTop: pi === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                      textAlign: 'left',
                      cursor: p.player_id ? 'pointer' : 'default',
                    }}
                  >
                    <PlayerAvatar
                      playerId={name}
                      playerName={name}
                      tourCode={tourCode}
                      photoUrl={p.photo_url ?? null}
                      size="xs"
                      ringColor={LIGHT_HAIRLINE}
                    />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {name}
                    </div>
                    {isCut ? (
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.1em' }}>{status}</span>
                    ) : (
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: scoreColor(display), fontVariantNumeric: 'tabular-nums' }}>{display}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
