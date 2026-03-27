import React from 'react';
import { Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';

export interface Top100RankBadgeProps {
  listSlug: 'global' | 'gb-i' | 'usa' | 'europe';
  rank: number;
}

/**
 * Reusable Top 100 rank badge showing flag/globe icon + rank number
 * Used in Course Details hero and regional list cards
 */
export const Top100RankBadge: React.FC<Top100RankBadgeProps> = ({ listSlug, rank }) => {
  // Determine which icon to show based on list
  const renderIcon = () => {
    switch (listSlug) {
      case 'global':
        return <Earth className="h-3 w-3 text-white" />;
      case 'gb-i':
        return <CountryFlag country="Britain & Ireland" size="sm" />;
      case 'usa':
        return <CountryFlag country="USA" size="sm" />;
      case 'europe':
        return <CountryFlag country="Continental Europe" size="sm" />;
      default:
        return <Earth className="h-3 w-3 text-white" />;
    }
  };

  return (
    <div
      className="flex items-center gap-1.5 flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: '0.5px solid rgba(255,255,255,0.20)',
        borderRadius: 6,
        padding: '3px 7px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {renderIcon()}
      <span className="text-[11px] font-bold text-white" style={{ lineHeight: 1 }}>
        #{rank}
      </span>
    </div>
  );
};
