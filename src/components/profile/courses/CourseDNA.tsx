import React from 'react';
import { Globe, Star, Trophy, TrendingUp } from 'lucide-react';

interface CourseDNAProps {
  countriesPlayed: number;
  avgRating: number | null;
  top100Count: number;
  totalCourses: number;
}

export const CourseDNA: React.FC<CourseDNAProps> = ({
  countriesPlayed,
  avgRating,
  top100Count,
  totalCourses,
}) => {
  // Only show if there's meaningful data
  if (totalCourses === 0) return null;

  const chips = [
    {
      icon: Globe,
      value: countriesPlayed,
      label: countriesPlayed === 1 ? 'country' : 'countries',
      show: countriesPlayed > 0,
    },
    {
      icon: Star,
      value: avgRating?.toFixed(1) || '—',
      label: 'avg rating',
      show: avgRating !== null && avgRating > 0,
    },
    {
      icon: Trophy,
      value: top100Count,
      label: 'Top 100',
      show: top100Count > 0,
    },
  ].filter(chip => chip.show);

  if (chips.length === 0) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 mt-1">
      {chips.map((chip, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-100/80 rounded-sq-md shadow-[0_1px_3px_rgba(0,0,0,0.05)] whitespace-nowrap"
          title={chip.label}
        >
          <chip.icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-slate-900">{chip.value}</span>
          <span className="text-[11px] text-slate-400 uppercase tracking-wide">{chip.label}</span>
        </div>
      ))}
    </div>
  );
};
