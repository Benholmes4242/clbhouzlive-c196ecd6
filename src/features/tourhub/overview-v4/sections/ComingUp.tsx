/**
 * ComingUp — next 4 upcoming events for the selected tour.
 * MAJOR (gold) and PLAYOFFS (violet) chips. Days-away column warms at <=7d.
 */

import { useNavigate } from 'react-router-dom';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { useComingUp } from '../data/useComingUp';
import type { TourId } from '../../hooks/useOverviewData';

export function ComingUp({ tour }: { tour: TourId }) {
  const navigate = useNavigate();
  const { data } = useComingUp(tour, 4);
  const rows = data ?? [];
  if (rows.length === 0) return null;

  return (
    <SectionShell eyebrow="What's coming up" linkLabel="Full schedule" onLinkClick={() => navigate('/tourhub')}>
      <div style={{ margin: '0 16px', background: V4.surface, border: `0.5px solid ${V4.hairline}`, borderRadius: 14, overflow: 'hidden' }}>
        {rows.map((r, i) => {
          const soon = r.days_away <= 7;
          return (
            <button
              key={r.id}
              onClick={() => navigate(`/tourhub/tournament/${r.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 44, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: soon ? V4.amber : V4.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {r.days_away}
                </div>
                <div style={{ fontSize: 9, color: V4.inkFaint, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {r.days_away === 1 ? 'day' : 'days'}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {r.isMajor ? <Chip label="Major" color={V4.gold} bg={V4.goldSoft} /> : null}
                  {r.isPlayoff ? <Chip label="Playoffs" color={V4.violet} bg={V4.violetSoft} /> : null}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: V4.ink, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 11, color: V4.inkSoft, marginTop: 1 }}>
                  {r.venue ?? '—'}
                </div>
                {r.defending_champion ? (
                  <div style={{ fontSize: 11, color: V4.inkFaint, marginTop: 1 }}>
                    Defends: <span style={{ color: V4.ink, fontWeight: 600 }}>{r.defending_champion}</span>
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </SectionShell>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 4, background: bg, color, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      {label}
    </span>
  );
}
