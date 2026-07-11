/**
 * CollegeFranchiseSection — editorial headline + duel-style top-5 standings.
 * Reuses useCollegeStats for standings (existing leaf hook — not overview-tree).
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';

function useCollegeTopWins() {
  return useQuery({
    queryKey: ['overview-v4', 'college-top-wins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('college_season_stats')
        .select('id, normalized_name, wins_total, top10_total')
        .order('wins_total', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function CollegeFranchiseSection() {
  const navigate = useNavigate();
  const { data } = useCollegeTopWins();
  const top5 = ((data ?? []) as any[]).slice(0, 5);
  if (top5.length === 0) return null;

  const [a, b] = top5;

  return (
    <SectionShell eyebrow="College franchise" linkLabel="Franchise" onLinkClick={() => navigate('/tourhub/college-golf')}>
      <div style={{ margin: '0 16px 4px', background: V4.surface, border: `0.5px solid ${V4.hairline}`, borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: V4.ink, letterSpacing: '-0.01em', marginBottom: 10 }}>
          {a?.normalized_name} vs {b?.normalized_name}
        </div>
        {/* Tug bar */}
        <div style={{ position: 'relative', height: 8, borderRadius: 999, background: V4.hairline, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '52%', background: V4.ink }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '48%', background: V4.amber }} />
        </div>
        <div style={{ marginTop: 12 }}>
          {top5.map((c: any, i: number) => (
            <div key={c.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}` }}>
              <div style={{ width: 20, textAlign: 'center', fontSize: 11, fontWeight: 800, color: V4.ink, fontVariantNumeric: 'tabular-nums' }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: V4.ink }}>
                {c.normalized_name}
              </div>
              <div style={{ fontSize: 12, color: V4.inkSoft, fontVariantNumeric: 'tabular-nums' }}>
                {c.wins_total ?? 0} W
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
