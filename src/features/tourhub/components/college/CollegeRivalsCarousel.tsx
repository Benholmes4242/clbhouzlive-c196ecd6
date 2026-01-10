import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeRivalries } from '../../hooks/useCollegeMovers';

interface CollegeRivalsCarouselProps {
  normalizedName: string;
  className?: string;
}

export function CollegeRivalsCarousel({ normalizedName, className }: CollegeRivalsCarouselProps) {
  const { data: rivalries, isLoading } = useCollegeRivalries(normalizedName);
  
  if (isLoading) {
    return (
      <div className={cn('flex gap-3 overflow-x-auto pb-2', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shrink-0 w-28 h-32 bg-surface-card border border-border-subtle rounded-sq-lg animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (!rivalries?.length) {
    return null;
  }
  
  return (
    <div className={cn('flex gap-3 overflow-x-auto pb-2 -mx-4 px-4', className)}>
      {rivalries.map((rivalry) => {
        const rivalName = rivalry.rivalNormalizedName;
        const college = rivalry.college;
        const displayName = college?.short_name || college?.college_name || rivalName;
        
        return (
          <Link
            key={rivalry.id}
            to={`/tourhub/college-golf/compare?c1=${normalizedName}&c2=${rivalName}`}
            className={cn(
              'shrink-0 w-28 p-3 rounded-sq-lg',
              'bg-surface-card border border-border-subtle',
              'hover:border-primary/30 hover:bg-surface-card-hover transition-all duration-200',
              'flex flex-col items-center text-center group'
            )}
          >
            {/* Logo */}
            <div className="w-12 h-12 rounded-sq-lg bg-background-secondary flex items-center justify-center overflow-hidden mb-2">
              {college?.logo_url ? (
                <img 
                  src={college.logo_url} 
                  alt={displayName}
                  className="w-10 h-10 object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-lg font-bold text-text-tertiary">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Name */}
            <p className="text-body-xs font-medium text-text-primary truncate w-full group-hover:text-primary transition-colors">
              {displayName}
            </p>
            
            {/* Compare label */}
            <span className="text-body-xs text-text-tertiary mt-1 flex items-center gap-0.5">
              Compare <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
