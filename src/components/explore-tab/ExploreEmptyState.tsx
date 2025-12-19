import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExploreEmptyStateProps {
  className?: string;
}

/**
 * ExploreEmptyState - Shown when Explore has limited content
 * 
 * Copy example: "We're building the world's most inspiring course discovery experience."
 * Optional CTAs: "Explore Watch" or "Start your Top 100 journey"
 * 
 * Subtle, never pushy.
 */
export const ExploreEmptyState: React.FC<ExploreEmptyStateProps> = ({
  className,
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn("px-5 py-16 text-center", className)}>
      <div className="max-w-sm mx-auto">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-alt/60 flex items-center justify-center mb-6">
          <Compass className="w-8 h-8 text-muted-foreground" />
        </div>
        
        {/* Message */}
        <h3 className="text-lg font-serif text-foreground">
          Coming soon
        </h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          We're building the world's most inspiring course discovery experience.
        </p>
        
        {/* CTAs - subtle, not pushy */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate('/discover?main=shorts')}
            className="w-full py-2.5 px-4 bg-surface-alt/50 hover:bg-surface-alt rounded-lg text-sm text-foreground transition-colors"
          >
            Explore Watch
          </button>
          <button
            onClick={() => navigate('/top100')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>Start your Top 100 journey</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExploreEmptyState;
