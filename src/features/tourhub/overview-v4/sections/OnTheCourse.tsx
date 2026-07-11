/**
 * OnTheCourse — live only. Renders featured groups from get_featured_groups RPC.
 * Rail is horizontally scrollable. When the RPC returns an unexpected shape,
 * the section is silently skipped (best-effort, non-blocking).
 */

import { useFeaturedGroups } from '../data/useFeaturedGroups';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';

interface Props {
  tournamentId: string | undefined;
  live: boolean;
}

interface GroupPlayerShape {
  full_name?: string;
  name?: string;
  photo_url?: string | null;
  score?: number | string | null;
  thru?: number | null;
}

interface GroupShape {
  group_id?: string;
  tee_time?: string;
  players?: GroupPlayerShape[];
}

function parseGroups(raw: unknown): GroupShape[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as GroupShape[];
  if (typeof raw === 'object' && raw !== null) {
    const groups = (raw as Record<string, unknown>).groups;
    if (Array.isArray(groups)) return groups as GroupShape[];
  }
  return [];
}

export function OnTheCourse({ tournamentId, live }: Props) {
  const { data } = useFeaturedGroups(tournamentId, { live });
  if (!live) return null;
  const groups = parseGroups(data);
  if (groups.length === 0) return null;

  return (
    <SectionShell eyebrow="On the course">
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          padding: '0 16px 4px',
          scrollSnapType: 'x mandatory',
        }}
      >
        {groups.map((g, gi) => (
          <div
            key={g.group_id ?? gi}
            style={{
              flex: '0 0 232px',
              scrollSnapAlign: 'start',
              background: V4.surface,
              border: `0.5px solid ${V4.hairline}`,
              borderRadius: 14,
              padding: 12,
            }}
          >
            {g.tee_time ? (
              <div style={{ fontSize: 10.5, fontWeight: 800, color: V4.amber, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                {new Date(g.tee_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
            ) : null}
            {(g.players ?? []).slice(0, 3).map((p, pi) => (
              <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: pi === 0 ? 'none' : `0.5px solid ${V4.hairline}` }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: V4.ink }}>{p.full_name || p.name}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: V4.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {p.score != null ? String(p.score) : '—'}
                </div>
                {p.thru != null ? (
                  <div style={{ fontSize: 10, color: V4.inkFaint, minWidth: 30, textAlign: 'right' }}>
                    {p.thru >= 18 ? 'F' : `t${p.thru}`}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
