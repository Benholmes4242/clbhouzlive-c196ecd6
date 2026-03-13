import { motion } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getCollegeGradientCSS } from '../../config/collegeBrandColors';
import type { CollegeCompareData } from '../../hooks/useCollegeCompare';

interface CollegeCompareHeroProps {
  data: CollegeCompareData;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export function CollegeCompareHero({ data }: CollegeCompareHeroProps) {
  const { college1, college2 } = data;
  const name1 = college1.media?.short_name || college1.media?.college_name || '—';
  const name2 = college2.media?.short_name || college2.media?.college_name || '—';
  const logo1 = getCollegeLogoUrl(college1.media?.college_name || '');
  const logo2 = getCollegeLogoUrl(college2.media?.college_name || '');

  const stats = [
    { label: 'Earnings', v1: formatCurrency(college1.stats?.earnings_total || 0), v2: formatCurrency(college2.stats?.earnings_total || 0), w1: (college1.stats?.earnings_total || 0) >= (college2.stats?.earnings_total || 0) },
    { label: 'Wins', v1: String(college1.stats?.wins_total || 0), v2: String(college2.stats?.wins_total || 0), w1: (college1.stats?.wins_total || 0) >= (college2.stats?.wins_total || 0) },
    { label: 'Top 10s', v1: String(college1.stats?.top10_total || 0), v2: String(college2.stats?.top10_total || 0), w1: (college1.stats?.top10_total || 0) >= (college2.stats?.top10_total || 0) },
    { label: 'Alumni', v1: String(college1.stats?.player_count || 0), v2: String(college2.stats?.player_count || 0), w1: (college1.stats?.player_count || 0) >= (college2.stats?.player_count || 0) },
  ];

  return (
    <motion.div
      className="rounded-2xl border border-border/50 bg-card overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logos header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col items-center gap-2 flex-1">
          {logo1 && <img src={logo1} alt={name1} className="w-14 h-14 object-contain" />}
          <span className="text-foreground text-center" style={{ fontSize: 13, fontWeight: 700 }}>{name1}</span>
        </div>
        <span className="text-muted-foreground" style={{ fontSize: 13, fontWeight: 600 }}>VS</span>
        <div className="flex flex-col items-center gap-2 flex-1">
          {logo2 && <img src={logo2} alt={name2} className="w-14 h-14 object-contain" />}
          <span className="text-foreground text-center" style={{ fontSize: 13, fontWeight: 700 }}>{name2}</span>
        </div>
      </div>

      {/* Stat rows */}
      <div className="divide-y divide-border/30">
        {stats.map(s => (
          <div key={s.label} className="flex items-center px-4 py-3">
            <span className="flex-1 text-right" style={{ fontSize: 14, fontWeight: s.w1 ? 700 : 500, color: s.w1 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>{s.v1}</span>
            <span className="text-muted-foreground mx-4" style={{ fontSize: 11, fontWeight: 600, width: 60, textAlign: 'center' }}>{s.label}</span>
            <span className="flex-1" style={{ fontSize: 14, fontWeight: !s.w1 ? 700 : 500, color: !s.w1 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>{s.v2}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
