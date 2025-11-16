import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';

interface Top100Membership {
  list_slug: string;
  short_label: string;
  rank: number;
}

interface Top100PillsProps {
  memberships: Top100Membership[];
  variant?: 'overlay' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

const Top100Pills: React.FC<Top100PillsProps> = ({ 
  memberships, 
  variant = 'overlay',
  size = 'sm'
}) => {
  if (!memberships || memberships.length === 0) return null;

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'global-top-100':
        return <Earth className={size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />;
      case 'gb-i-top-100':
        return <CountryFlag country="Britain & Ireland" size="sm" />;
      case 'usa-top-100':
        return <CountryFlag country="USA" size="sm" />;
      case 'europe-top-100':
        return <CountryFlag country="Continental Europe" size="sm" />;
      default:
        return null;
    }
  };

  const pillClasses = variant === 'overlay'
    ? 'bg-black/70 backdrop-blur-sm border-white/20 text-white'
    : 'bg-primary/10 border-primary/20 text-primary';

  const textSize = size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-wrap gap-1.5">
      {memberships.map((membership) => (
        <Badge
          key={membership.list_slug}
          variant="outline"
          className={`${pillClasses} ${textSize} font-semibold px-2 py-0.5 flex items-center gap-1`}
        >
          {getIcon(membership.list_slug)}
          <span>#{membership.rank}</span>
        </Badge>
      ))}
    </div>
  );
};

export default Top100Pills;
