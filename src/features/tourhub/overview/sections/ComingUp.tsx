/**
 * ComingUp — date-block rows with MAJOR/PLAYOFFS chips and right-side
 * thin days-away column. Spec ref: Brief O2.1 section 6.
 */

import { useNavigate } from 'react-router-dom';
import { SectionShell, V4Card } from './SectionShell';
import { V4, NUMERAL_THIN } from '../tokens';
import { useComingUp } from '../data/useComingUp';
import type { TourId } from '../../hooks/useOverviewData';

export function ComingUp({ tour }: { tour: TourId }) {
  const navigate = useNavigate();
  const { data } = useComingUp(tour, 4);
  const rows = data ?? [];
  if (rows.length === 0) return null;

  return (
    <SectionShell eyebrow="What's coming up" linkLabel="Full schedule" onLinkClick={() => navigate('/tourhub?tab=schedule')}>
      <div style={{ margin: '0 16px' }}>
        <V4Card style={{ overflow: 'hidden' }}>
          {rows.map((r, i) => {
            const soon = r.days_away <= 7;
            const d = new Date(r.start_date);
            const day = d.getDate();
            const mon = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/tourhub/tournament/${r.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  padding: '14px 14px',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 21, color: r.isMajor ? V4.amberDeep : V4.ink, lineHeight: 1, ...NUMERAL_THIN }}>{day}</div>
                  <div style={{ marginTop: 4, fontSize: 8.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.12em' }}>{mon}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {r.isMajor ? <Chip label="Major" fg={V4.goldDeep} gradient={`linear-gradient(90deg, ${V4.goldSoftA}, ${V4.goldSoftB})`} /> : null}
                    {r.isPlayoff ? <Chip label="Playoffs" fg={V4.violet} gradient={V4.violetSoft} /> : null}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: V4.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.name}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 11.5, color: V4.inkMute }}>
                    {r.venue ?? '—'}
                    {r.defending_champion ? <span style={{ color: V4.inkFaint }}> · {r.defending_champion} defends</span> : null}
                  </div>
                </div>
                <div style={{ width: 44, textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, color: r.isMajor && soon ? V4.amberDeep : r.isMajor ? V4.ink : V4.inkMute, lineHeight: 1, ...NUMERAL_THIN }}>{r.days_away}</div>
                  <div style={{ marginTop: 4, fontSize: 7.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.12em' }}>DAYS</div>
                </div>
              </button>
            );
          })}
        </V4Card>
      </div>
    </SectionShell>
  );
}

function Chip({ label, fg, gradient }: { label: string; fg: string; gradient: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        borderRadius: 4,
        background: gradient,
        color: fg,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}
