import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';

interface HeroTop100CardProps {
  totalPlayed: number;
  isPersonal: boolean;
}

/**
 * HeroTop100Card - Full-width tile for Top 100 progress
 * Height: 110-130px
 * Rounded corners: 20px
 * Gradient background
 * Shows large number + subtitle + trophy icon
 */
const HeroTop100Card: React.FC<HeroTop100CardProps> = ({
  totalPlayed,
  isPersonal,
}) => {
  const navigate = useNavigate();
  
  // Only show for personal profiles
  if (!isPersonal) return null;
  
  const club = getTop100Club(totalPlayed);
  const hasStarted = totalPlayed > 0;
  
  // Dynamic subtitle based on progress
  const getSubtitle = () => {
    if (totalPlayed === 0) return 'Start Your Journey';
    if (totalPlayed < 5) return `${5 - totalPlayed} more to unlock your first badge`;
    return club.tierName || 'Top 100 Club';
  };

  return (
    <section className="mt-6 px-4">
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          'relative w-full overflow-hidden',
          'rounded-[20px]',
          'transition-all duration-200',
          'hover:scale-[1.01] active:scale-[0.99]'
        )}
        style={{ height: '120px' }}
      >
        {/* Gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: hasStarted 
              ? `linear-gradient(135deg, ${club.ringColor || '#2F604A'} 0%, #1a3a2a 50%, #0d1f16 100%)`
              : 'linear-gradient(135deg, #2F604A 0%, #1a3a2a 50%, #0d1f16 100%)',
          }}
        />
        
        {/* Subtle texture overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }}
        />
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-between px-5">
          <div className="flex flex-col items-start">
            {/* Large number */}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">
                {totalPlayed}
              </span>
              <span className="text-lg font-medium text-white/80">
                Top 100
              </span>
            </div>
            
            {/* Subtitle */}
            <span className="text-sm font-medium text-white/70 mt-1">
              {getSubtitle()}
            </span>
          </div>
          
          {/* Trophy icon + chevron */}
          <div className="flex items-center gap-2">
            <Trophy 
              className="w-10 h-10 text-white/60" 
              strokeWidth={1.5}
            />
            <ChevronRight className="w-5 h-5 text-white/50" />
          </div>
        </div>
      </button>
    </section>
  );
};

export default HeroTop100Card;
