/**
 * StatOfTheWeekV4 — bespoke overview-v4 shell. Reuses the existing
 * useGamifiedLeaderboards data source; the visual shell is new per spec
 * (Brief O2.1 section 5). Does NOT mount the legacy StatOfTheWeek.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamifiedLeaderboards } from '../../hooks/useGamifiedLeaderboards';
import { LEADER_CATEGORIES } from '../../components/leaders/constants';
import { SectionShell, V4Card } from './SectionShell';
import { V4, NUMERAL_THIN } from '../tokens';

function splitDisplay(display: string): { whole: string; unit: string } {
  const dot = display.indexOf('.');
  if (dot >= 0) return { whole: display.slice(0, dot), unit: display.slice(dot) };
  const sp = display.indexOf(' ');
  if (sp >= 0) return { whole: display.slice(0, sp), unit: display.slice(sp) };
  return { whole: display, unit: '' };
}

export function StatOfTheWeekV4() {
  const navigate = useNavigate();
  const { entries } = useGamifiedLeaderboards();

  const first = useMemo(() => {
    for (const c of LEADER_CATEGORIES) {
      const e = entries.get(c.key);
      if (e && e.players.length > 0) return { category: c, entry: e };
    }
    return null;
  }, [entries]);

  if (!first) return null;
  const { category, entry } = first;
  const leader = entry.players[0];
  const { whole, unit } = splitDisplay(leader.display);
  const unitStr = unit || (category.unit === '%' ? '%' : '');

  return (
    <SectionShell
      eyebrow="Stat of the week"
      linkLabel="More stats"
      onLinkClick={() => navigate(`/tourhub?tab=leaderboards&category=${category.key}`)}
    >
      <div style={{ margin: '0 20px' }}>
        <V4Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: V4.amber, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {category.gamifiedTitle ?? category.label}
              </div>
              <div style={{ marginTop: 6, fontSize: 13.5, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.3 }}>
                {leader.lastName} leads {category.label.toLowerCase()}
              </div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: V4.inkMute, lineHeight: 1.4 }}>
                {entry.marginDisplay
                  ? `${leader.lastName} leads the field by ${entry.marginDisplay}.`
                  : `${leader.lastName} sets the pace.`}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 58, color: V4.ink, lineHeight: 0.95, ...NUMERAL_THIN }}>{whole}</span>
                {unitStr ? (
                  <span style={{ fontSize: 20, color: V4.ink, marginLeft: 2, ...NUMERAL_THIN }}>{unitStr}</span>
                ) : null}
              </div>
              <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {leader.lastName}
              </div>
            </div>
          </div>
        </V4Card>
      </div>
    </SectionShell>
  );
}
