import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Wind, Trees, Waves, Mountain, Sparkles } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description?: string;
  icon: React.ReactNode;
}

const THEMES: Theme[] = [
  { 
    id: 'links', 
    name: 'Links Golf',
    description: 'Coastal masterpieces',
    icon: <Wind className="w-5 h-5" />,
  },
  { 
    id: 'parkland', 
    name: 'Parkland Classics',
    description: 'Tree-lined treasures',
    icon: <Trees className="w-5 h-5" />,
  },
  { 
    id: 'coastal', 
    name: 'Coastal Courses',
    description: 'Ocean views',
    icon: <Waves className="w-5 h-5" />,
  },
  { 
    id: 'mountain', 
    name: 'Mountain Courses',
    description: 'Elevated experiences',
    icon: <Mountain className="w-5 h-5" />,
  },
  { 
    id: 'hidden-gems', 
    name: 'Hidden Gems',
    description: 'Undiscovered treasures',
    icon: <Sparkles className="w-5 h-5" />,
  },
];

interface ThemeExploreRailProps {
  className?: string;
  onThemeClick?: (themeId: string) => void;
}

/**
 * ThemeExploreRail - Explore by Theme
 * 
 * Rules:
 * - Visual-first
 * - Editorial feel
 * - No creator focus
 * 
 * This adds discovery without complexity.
 */
export const ThemeExploreRail: React.FC<ThemeExploreRailProps> = ({
  className,
  onThemeClick,
}) => {
  return (
    <div className={cn("py-6", className)}>
      {/* Section Header */}
      <div className="px-5 mb-4">
        <h3 className="text-lg font-serif text-foreground">Explore by Theme</h3>
      </div>
      
      {/* Horizontal scroll rail */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeClick?.(theme.id)}
              className="flex-shrink-0 snap-start group"
            >
              <div className="w-36 md:w-44 bg-surface-alt/40 border border-border/40 rounded-xl p-4 hover:bg-surface-alt/60 transition-colors text-left">
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                  {theme.icon}
                </div>
                
                {/* Content */}
                <h4 className="text-sm font-medium text-foreground line-clamp-1">
                  {theme.name}
                </h4>
                {theme.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {theme.description}
                  </p>
                )}
                
                {/* Explore indicator */}
                <div className="flex items-center gap-1 mt-3 text-xs text-primary/80 group-hover:text-primary transition-colors">
                  <span>Explore</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeExploreRail;
