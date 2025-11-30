import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { useNavigate } from 'react-router-dom';

interface Top100Membership {
  list_slug: string;
  short_label: string;
  rank: number;
}

interface Top100PillsProps {
  memberships: Top100Membership[];
  variant?: 'overlay' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  courseId?: string; // Add courseId prop for navigation
}

const Top100Pills: React.FC<Top100PillsProps> = ({ 
  memberships, 
  variant = 'overlay',
  size = 'sm',
  courseId
}) => {
  const navigate = useNavigate();
  
  if (!memberships || memberships.length === 0) return null;

  const handlePillClick = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    if (courseId) {
      navigate(`/top100/${slug}?courseId=${courseId}`);
    }
  };

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

  // Frosted white glass styling for overlay variant (matches CourseRankBadges)
  const pillClasses = variant === 'overlay'
    ? 'bg-white/16 backdrop-blur-[18px] border border-white/45 text-white shadow-[0_0_12px_rgba(0,0,0,0.35)]'
    : 'bg-primary/10 border-primary/20 text-primary';

  const textSize = size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-wrap gap-1.5">
      {memberships.map((membership) => (
        <Badge
          key={membership.list_slug}
          variant="outline"
          className={`${pillClasses} ${textSize} font-semibold px-2 py-0.5 flex items-center gap-1 ${courseId ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
          onClick={courseId ? (e) => handlePillClick(e, membership.list_slug) : undefined}
        >
          {getIcon(membership.list_slug)}
          <span>#{membership.rank}</span>
        </Badge>
      ))}
    </div>
  );
};

export default Top100Pills;
