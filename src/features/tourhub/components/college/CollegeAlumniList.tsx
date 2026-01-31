import { Link } from 'react-router-dom';
import { User, Trophy, DollarSign, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeAlumni, type CollegeAlumnus } from '../../hooks/useCollegeAlumni';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';

interface CollegeAlumniListProps {
  normalizedName: string;
  limit?: number;
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

function AlumnusRow({ alumnus, rank }: { alumnus: CollegeAlumnus; rank: number }) {
  const fullName = `${alumnus.first_name} ${alumnus.last_name}`;
  
  return (
    <Link
      to={`/tourhub/player/${alumnus.id}`}
      className={cn(
        'flex items-center gap-3 p-3 rounded-sq-lg',
        'bg-surface-card border border-border-subtle',
        'hover:border-primary/30 hover:bg-surface-card-hover transition-all duration-200',
        'group'
      )}
    >
      {/* Rank */}
      <div className="shrink-0 w-6 text-center">
        <span className="text-body-sm font-semibold text-text-tertiary">
          {rank}
        </span>
      </div>
      
      {/* Photo */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-background-secondary overflow-hidden flex items-center justify-center">
        {resolvePhotoUrl(alumnus.photo_url) ? (
          <img 
            src={resolvePhotoUrl(alumnus.photo_url)!} 
            alt={fullName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <User className="w-5 h-5 text-text-tertiary" />
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
          {fullName}
        </p>
        <div className="flex items-center gap-3 text-body-xs text-text-secondary mt-0.5">
          {alumnus.world_ranking && alumnus.world_ranking < 9999 && (
            <span className="inline-flex items-center gap-1">
              <Globe className="w-3 h-3" />
              #{alumnus.world_ranking}
            </span>
          )}
          {(alumnus.earnings || 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-accent-success">
              <DollarSign className="w-3 h-3" />
              {formatCurrency(alumnus.earnings || 0)}
            </span>
          )}
          {(alumnus.wins || 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-accent-warning">
              <Trophy className="w-3 h-3" />
              {alumnus.wins} win{alumnus.wins !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CollegeAlumniList({ normalizedName, limit = 10, className }: CollegeAlumniListProps) {
  const { data: alumni, isLoading, error } = useCollegeAlumni(normalizedName, { limit });
  
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i}
            className="h-16 bg-surface-card border border-border-subtle rounded-sq-lg animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (error || !alumni?.length) {
    return (
      <div className={cn('text-center py-8 text-body-sm text-text-secondary', className)}>
        No alumni found for this college
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-2', className)}>
      {alumni.map((alumnus, index) => (
        <AlumnusRow key={alumnus.id} alumnus={alumnus} rank={index + 1} />
      ))}
    </div>
  );
}
