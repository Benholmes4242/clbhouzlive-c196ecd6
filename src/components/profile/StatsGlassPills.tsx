import React, { useEffect, useState } from 'react';

interface StatsPillProps {
  label: string;
  value: number;
  delay?: number;
  onClick?: () => void;
}

const StatPill: React.FC<StatsPillProps> = ({ label, value, delay = 0, onClick }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Count-up animation
      const duration = 800;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const countUp = setInterval(() => {
        current += increment;
        if (current >= value) {
          setAnimatedValue(value);
          clearInterval(countUp);
        } else {
          setAnimatedValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(countUp);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const formatValue = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <button
      onClick={onClick}
      className={`
        glass-card glow-hover rounded-xl min-h-[56px] px-4 py-3
        flex flex-col justify-center items-center text-center
        transition-all duration-200 ease-out
        hover:scale-[1.02] focus:scale-[1.02]
        focus:outline-none focus:ring-2 focus:ring-accent/40
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-white font-semibold text-lg md:text-xl leading-tight">
        {formatValue(animatedValue)}
      </div>
      <div className="text-white/70 text-xs md:text-sm leading-tight mt-0.5">
        {label}
      </div>
    </button>
  );
};

interface StatsGlassPillsProps {
  stats: {
    posts: number;
    totalXP: number;
    following: number;
    followers: number;
  };
  onStatClick?: (stat: string) => void;
}

const StatsGlassPills: React.FC<StatsGlassPillsProps> = ({ stats, onStatClick }) => {
  return (
    <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-[680px] mx-auto px-4">
      <StatPill
        label="Posts"
        value={stats.posts}
        delay={0}
        onClick={() => onStatClick?.('posts')}
      />
      <StatPill
        label="Total XP"
        value={stats.totalXP}
        delay={100}
        onClick={() => onStatClick?.('xp')}
      />
      <StatPill
        label="Following"
        value={stats.following}
        delay={200}
        onClick={() => onStatClick?.('following')}
      />
      <StatPill
        label="Followers"
        value={stats.followers}
        delay={300}
        onClick={() => onStatClick?.('followers')}
      />
    </div>
  );
};

export default StatsGlassPills;