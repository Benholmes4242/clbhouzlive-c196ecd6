/**
 * CollegeFranchiseSection — editorial headline + duel card + top-5 rows.
 * Ships as visual shell; earnings/movement default gracefully when data
 * is absent on college_season_stats.
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SectionShell, V4Card } from './SectionShell';
import { V4, NUMERAL_THIN } from '../tokens';

interface SchoolRow {
  id: string;
  name: string;
  wins: number;
  top10: number;
  captains?: number;
  onTour?: number;
  earnings?: number | null;
  movement?: number | null;
  colorA?: string;
  colorB?: string;
}

const SCHOOL_COLORS: Array<[string, string]> = [
  ['#8A1538', '#F4D35E'],
  ['#154734', '#FFB81C'],
  ['#4B2E83', '#B7A57A'],
  ['#00274C', '#FFCB05'],
  ['#B3A369', '#003057'],
];

function useCollegeTopWins() {
  return useQuery({
    queryKey: ['overview-v4', 'college-top-wins'],
    queryFn: async (): Promise<SchoolRow[]> => {
      const { data, error } = await supabase
        .from('college_season_stats')
        .select('id, normalized_name, wins_total, top10_total')
        .order('wins_total', { ascending: false })
        .limit(5);
      if (error) throw error;
      return ((data as any[]) ?? []).map((r, i) => ({
        id: r.id,
        name: r.normalized_name,
        wins: r.wins_total ?? 0,
        top10: r.top10_total ?? 0,
        colorA: SCHOOL_COLORS[i % SCHOOL_COLORS.length][0],
        colorB: SCHOOL_COLORS[i % SCHOOL_COLORS.length][1],
      }));
    },
    staleTime: 60 * 60 * 1000,
  });
}

function shortInitials(name: string): string {
  const p = name.split(/\s+/);
  return (p[0]?.[0] ?? '') + (p[1]?.[0] ?? '');
}

export function CollegeFranchiseSection() {
  const navigate = useNavigate();
  const { data } = useCollegeTopWins();
  const top5 = data ?? [];
  if (top5.length < 2) return null;

  const [a, b] = top5;
  const total = a.wins + b.wins || 1;
  const aPct = Math.round((a.wins / total) * 100);
  const bPct = 100 - aPct;

  return (
    <SectionShell eyebrow="College franchise" linkLabel="Franchise" onLinkClick={() => navigate('/tourhub/college-golf')}>
      <div style={{ margin: '0 20px 10px', fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
        {a.name} pulls level with {b.name} as the top wins-producing programs on tour this season.
      </div>

      <div style={{ margin: '0 20px 14px' }}>
        <V4Card style={{ padding: '14px 14px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
            <SchoolSide school={a} align="left" />
            <div style={{ fontSize: 10, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.14em' }}>VS</div>
            <SchoolSide school={b} align="right" />
          </div>
          <div style={{ marginTop: 12, position: 'relative', height: 8, borderRadius: 4, background: V4.hairline, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${aPct}%`, background: a.colorA }} />
            <div style={{ width: `${bPct}%`, background: b.colorA }} />
          </div>
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: V4.inkMute, fontVariantNumeric: 'tabular-nums' }}>
            <span>{a.wins} W</span>
            <span>{b.wins} W</span>
          </div>
        </V4Card>
      </div>

      <div style={{ margin: '0 20px' }}>
        <V4Card style={{ overflow: 'hidden' }}>
          {top5.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}` }}>
              <div style={{ width: 22, textAlign: 'center', fontSize: 15, color: V4.ink, ...NUMERAL_THIN }}>{i + 1}</div>
              <div
                style={{
                  width: 32, height: 32, borderRadius: '34%',
                  background: `linear-gradient(135deg, ${c.colorA}, ${c.colorB})`,
                  color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {shortInitials(c.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ marginTop: 1, fontSize: 10.5, color: V4.inkFaint }}>
                  {c.top10} top-10s on tour
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: V4.ink, fontVariantNumeric: 'tabular-nums' }}>
                {c.wins} W
              </div>
            </div>
          ))}
        </V4Card>
      </div>
    </SectionShell>
  );
}

function SchoolSide({ school, align }: { school: SchoolRow; align: 'left' | 'right' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
      <div
        style={{
          width: 40, height: 40, borderRadius: '34%',
          background: `linear-gradient(135deg, ${school.colorA}, ${school.colorB})`,
          color: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {shortInitials(school.name)}
      </div>
      <div style={{ minWidth: 0, textAlign: align }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: V4.ink, letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {school.name}
        </div>
        <div style={{ marginTop: 1, fontSize: 10.5, color: V4.inkFaint }}>{school.top10} top-10s</div>
      </div>
    </div>
  );
}
