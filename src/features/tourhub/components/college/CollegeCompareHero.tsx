import { Link } from 'react-router-dom';
import { DollarSign, Trophy, Target, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollegeCompareData } from '../../hooks/useCollegeCompare';
import type { CollegeAlumnus } from '../../hooks/useCollegeAlumni';

interface CollegeCompareHeroProps {
  data: CollegeCompareData;
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
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
    <div className="flex items-center py-3 border-b border-border-subtle last:border-0">
      {/* Left Value */}
      <div className={cn(
        'flex-1 text-right pr-4',
        winner === 1 && 'font-bold text-primary'
      )}>
        <span className="text-heading-md">{format(value1)}</span>
      </div>
      
      {/* Center Label */}
      <div className="w-28 flex flex-col items-center">
        <Icon className={cn('w-4 h-4 mb-1', iconColor || 'text-text-tertiary')} />
        <span className="text-body-xs text-text-secondary">{label}</span>
      </div>
      
      {/* Right Value */}
      <div className={cn(
        'flex-1 text-left pl-4',
        winner === 2 && 'font-bold text-primary'
      )}>
        <span className="text-heading-md">{format(value2)}</span>
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
      <h3 className="text-body-md font-semibold text-text-primary mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Left Side */}
        <div className="space-y-2">
          {alumni1.length > 0 ? alumni1.map((a, i) => (
            <Link
              key={a.id}
              to={`/tourhub/player/${a.id}`}
              className="flex items-center gap-2 p-2 rounded-sq-md bg-background-secondary hover:bg-surface-card-hover transition-colors"
            >
              <span className="text-body-xs text-text-tertiary w-4">{i + 1}</span>
              <div className="w-6 h-6 rounded-full bg-surface-card overflow-hidden shrink-0">
                {a.photo_url ? (
                  <img src={a.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-1 text-text-tertiary" />
                )}
              </div>
              <span className="text-body-xs text-text-primary truncate">
                {a.first_name} {a.last_name}
              </span>
            </Link>
          )) : (
            <p className="text-body-xs text-text-tertiary py-2">No data</p>
          )}
        </div>
        
        {/* Right Side */}
        <div className="space-y-2">
          {alumni2.length > 0 ? alumni2.map((a, i) => (
            <Link
              key={a.id}
              to={`/tourhub/player/${a.id}`}
              className="flex items-center gap-2 p-2 rounded-sq-md bg-background-secondary hover:bg-surface-card-hover transition-colors"
            >
              <span className="text-body-xs text-text-tertiary w-4">{i + 1}</span>
              <div className="w-6 h-6 rounded-full bg-surface-card overflow-hidden shrink-0">
                {a.photo_url ? (
                  <img src={a.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-1 text-text-tertiary" />
                )}
              </div>
              <span className="text-body-xs text-text-primary truncate">
                {a.first_name} {a.last_name}
              </span>
            </Link>
          )) : (
            <p className="text-body-xs text-text-tertiary py-2">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CollegeCompareHero({ data, className }: CollegeCompareHeroProps) {
  const { college1, college2 } = data;
  
  const name1 = college1.media?.short_name || college1.media?.college_name || 'College 1';
  const name2 = college2.media?.short_name || college2.media?.college_name || 'College 2';
  
  return (
    <div className={cn('', className)}>
      {/* Hero Strip */}
      <div className="flex items-center justify-between mb-6">
        {/* College 1 */}
        <Link 
          to={`/tourhub/college-golf/${college1.stats?.normalized_name}`}
          className="flex flex-col items-center group"
        >
          <div className="w-16 h-16 rounded-sq-xl bg-surface-card border border-border-subtle flex items-center justify-center overflow-hidden mb-2 group-hover:border-primary/30 transition-colors">
            {college1.media?.logo_url ? (
              <img src={college1.media.logo_url} alt={name1} className="w-12 h-12 object-contain" />
            ) : (
              <span className="text-xl font-bold text-text-tertiary">{name1.charAt(0)}</span>
            )}
          </div>
          <span className="text-body-md font-semibold text-text-primary group-hover:text-primary transition-colors">
            {name1}
          </span>
        </Link>
        
        {/* VS */}
        <div className="flex flex-col items-center">
          <span className="text-heading-lg font-black text-text-tertiary">VS</span>
          <span className="text-body-xs text-text-secondary">2025 Season</span>
        </div>
        
        {/* College 2 */}
        <Link 
          to={`/tourhub/college-golf/${college2.stats?.normalized_name}`}
          className="flex flex-col items-center group"
        >
          <div className="w-16 h-16 rounded-sq-xl bg-surface-card border border-border-subtle flex items-center justify-center overflow-hidden mb-2 group-hover:border-primary/30 transition-colors">
            {college2.media?.logo_url ? (
              <img src={college2.media.logo_url} alt={name2} className="w-12 h-12 object-contain" />
            ) : (
              <span className="text-xl font-bold text-text-tertiary">{name2.charAt(0)}</span>
            )}
          </div>
          <span className="text-body-md font-semibold text-text-primary group-hover:text-primary transition-colors">
            {name2}
          </span>
        </Link>
      </div>
      
      {/* Metrics Comparison */}
      <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-4">
        <MetricCompareRow
          label="Earnings"
          icon={DollarSign}
          value1={college1.stats?.earnings_total || 0}
          value2={college2.stats?.earnings_total || 0}
          format={formatCurrency}
          iconColor="text-accent-success"
        />
        <MetricCompareRow
          label="Wins"
          icon={Trophy}
          value1={college1.stats?.wins_total || 0}
          value2={college2.stats?.wins_total || 0}
          iconColor="text-accent-warning"
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
