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
        return <Earth className="h-5 w-5 text-white" />;
      case 'gb-i':
        return <CountryFlag country="Britain & Ireland" size="md" />;
      case 'usa':
        return <CountryFlag country="USA" size="md" />;
      case 'europe':
        return <CountryFlag country="Continental Europe" size="md" />;
      default:
        return <Earth className="h-5 w-5 text-white" />;
    }
  };

  return (
    <div className="glass-badge-tight [--badge-w:52px] md:[--badge-w:56px] lg:[--badge-w:56px]">
      {renderIcon()}
      <span className="text-white">#{rank}</span>
    </div>
  );
};
