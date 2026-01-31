import { Link } from 'react-router-dom';
import { MapPin, GraduationCap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourPlayer } from '../hooks/useTourHubData';
import type { CollegeMedia } from '../hooks/useCollegeMedia';
import { CollegeDisplay } from './CollegeLogo';
import { resolvePhotoUrl } from '../utils/resolvePhotoUrl';

interface PlayerCardProps {
  player: TourPlayer;
  /** Pre-resolved college media for efficient rendering */
  college?: CollegeMedia | null;
  className?: string;
}

export function PlayerCard({ player, college, className }: PlayerCardProps) {
  const initials = player.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  const photoUrl = resolvePhotoUrl(player.photo_url);
  
  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "block bg-card border border-border rounded-xl p-4 transition-all",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={player.full_name}
              className="w-12 h-12 object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{initials}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{player.full_name}</h3>
          
          {player.country && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{player.country}</span>
            </p>
          )}
          
          {player.college && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <GraduationCap className="w-3 h-3 shrink-0" />
              <CollegeDisplay 
                collegeName={player.college} 
                college={college || null}
                size="xs"
              />
            </p>
          )}
          
          {player.turned_pro && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 shrink-0" />
              Pro since {player.turned_pro}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
