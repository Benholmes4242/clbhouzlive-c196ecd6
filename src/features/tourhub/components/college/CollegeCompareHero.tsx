import { Link } from 'react-router-dom';
import { DollarSign, Trophy, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useTourSeason } from '../../hooks/useTourHubData';
import type { CollegeCompareData } from '../../hooks/useCollegeCompare';
import type { CollegeAlumnus } from '../../hooks/useCollegeAlumni';

interface CollegeCompareHeroProps {
  data: CollegeCompareData;
  className?: string;
}

interface MetricCompareRowProps {
  label: string;
  icon: React.ElementType;
  value1: number;
  value2: number;
  format?: (v: number) => string;
  iconColor?: string;
}

function MetricCompareRow({ label, icon: Icon, value1, value2, format = String, iconColor }: MetricCompareRowProps) {
  const winner = value1 > value2 ? 1 : value2 > value1 ? 2 : 0;
  
  return (
    <div className="flex items-center py-3 border-b border-border last:border-0">
      <div className={cn(
        'flex-1 text-right pr-4',
        winner === 1 && 'font-bold text-primary'
      )}>
        <span className="text-lg font-semibold">{format(value1)}</span>
      </div>
      
      <div className="w-28 flex flex-col items-center">
        <Icon className={cn('w-4 h-4 mb-1', iconColor || 'text-muted-foreground')} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      
      <div className={cn(
        'flex-1 text-left pl-4',
        winner === 2 && 'font-bold text-primary'
      )}>
        <span className="text-lg font-semibold">{format(value2)}</span>
      </div>
    </div>
  );
}

function AlumniCompareBlock({ title, alumni1, alumni2 }: { 
  title: string; 
  alumni1: CollegeAlumnus[]; 
  alumni2: CollegeAlumnus[];
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {alumni1.length > 0 ? alumni1.map((a, i) => (
            <Link
              key={a.id}
              to={`/tourhub/player/${a.id}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
              <div className="w-6 h-6 bg-card overflow-hidden shrink-0" style={{ borderRadius: '34%' }}>
                <img
                  src={getPlayerHeadshotUrl(`${a.first_name} ${a.last_name}`, a.tour_codes?.[0] ?? 'pga')}
                  alt={`${a.first_name} ${a.last_name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                />
              </div>
              <span className="text-xs text-foreground truncate">
                {a.first_name} {a.last_name}
              </span>
            </Link>
          )) : (
            <p className="text-xs text-muted-foreground py-2">No data</p>
          )}
        </div>
        
        <div className="space-y-2">
          {alumni2.length > 0 ? alumni2.map((a, i) => (
            <Link
              key={a.id}
              to={`/tourhub/player/${a.id}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
              <div className="w-6 h-6 bg-card overflow-hidden shrink-0" style={{ borderRadius: '34%' }}>
                <img
                  src={getPlayerHeadshotUrl(`${a.first_name} ${a.last_name}`, a.tour_codes?.[0] ?? 'pga')}
                  alt={`${a.first_name} ${a.last_name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                />
              </div>
              <span className="text-xs text-foreground truncate">
                {a.first_name} {a.last_name}
              </span>
            </Link>
          )) : (
            <p className="text-xs text-muted-foreground py-2">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CollegeCompareHero({ data, className }: CollegeCompareHeroProps) {
  const { college1, college2 } = data;
  const { data: season } = useTourSeason();
  const seasonYear = season?.year || new Date().getFullYear();
  
  const name1 = college1.media?.short_name || college1.media?.college_name || 'College 1';
  const name2 = college2.media?.short_name || college2.media?.college_name || 'College 2';
  
  return (
    <div className={cn('', className)}>
      {/* Hero Strip */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          to={`/tourhub/college-golf/${college1.stats?.normalized_name}`}
          className="flex flex-col items-center group"
        >
          <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden mb-2 group-hover:border-primary/30 transition-colors">
            {getCollegeLogoUrl(college1.media?.college_name || name1) ? (
              <img src={getCollegeLogoUrl(college1.media?.college_name || name1)!} alt={name1} className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <span className="text-xl font-bold text-muted-foreground">{name1.charAt(0)}</span>
            )}
          </div>
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {name1}
          </span>
        </Link>
        
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black text-muted-foreground">VS</span>
          <span className="text-xs text-muted-foreground">{seasonYear} Season</span>
        </div>
        
        <Link 
          to={`/tourhub/college-golf/${college2.stats?.normalized_name}`}
          className="flex flex-col items-center group"
        >
          <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden mb-2 group-hover:border-primary/30 transition-colors">
            {getCollegeLogoUrl(college2.media?.college_name || name2) ? (
              <img src={getCollegeLogoUrl(college2.media?.college_name || name2)!} alt={name2} className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <span className="text-xl font-bold text-muted-foreground">{name2.charAt(0)}</span>
            )}
          </div>
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {name2}
          </span>
        </Link>
      </div>
      
      {/* Metrics Comparison */}
      <div className="bg-card border border-border rounded-xl p-4">
        <MetricCompareRow
          label="Earnings"
          icon={DollarSign}
          value1={college1.stats?.earnings_total || 0}
          value2={college2.stats?.earnings_total || 0}
          format={formatCurrency}
          iconColor="text-emerald-600"
        />
        <MetricCompareRow
          label="Wins"
          icon={Trophy}
          value1={college1.stats?.wins_total || 0}
          value2={college2.stats?.wins_total || 0}
          iconColor="text-amber-500"
        />
        <MetricCompareRow
          label="Cuts Made"
          icon={Target}
          value1={college1.stats?.cuts_total || 0}
          value2={college2.stats?.cuts_total || 0}
        />
        <MetricCompareRow
          label="Top 10s"
          icon={TrendingUp}
          value1={college1.stats?.top10_total || 0}
          value2={college2.stats?.top10_total || 0}
          iconColor="text-primary"
        />
      </div>
      
      {/* Alumni Comparisons */}
      <AlumniCompareBlock
        title="Top Earners"
        alumni1={college1.topEarners}
        alumni2={college2.topEarners}
      />
      <AlumniCompareBlock
        title="Best World Rankings"
        alumni1={college1.topRanked}
        alumni2={college2.topRanked}
      />
    </div>
  );
}
