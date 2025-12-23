import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Wind, Trees, Waves, Mountain, Sparkles, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExploreThemes, ExploreTheme } from '@/hooks/useExploreData';

// Map icon strings to components
const THEME_ICONS: Record<string, LucideIcon> = {
  Wind: Wind,
  Trees: Trees,
  Waves: Waves,
  Mountain: Mountain,
  Sparkles: Sparkles,
};

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
  const navigate = useNavigate();
  const { data: themes, isLoading } = useExploreThemes();

  const handleThemeClick = (theme: ExploreTheme) => {
    if (onThemeClick) {
      onThemeClick(theme.id);
    }
    navigate(`/discover/explore/theme/${theme.slug}`);
  };

  if (isLoading) {
    return (
      <div className={cn("py-6", className)}>
        <div className="px-5 mb-4">
          <div className="h-6 w-36 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-36 h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!themes?.length) return null;

  return (
    <div className={cn("py-6", className)}>
      {/* Section Header */}
      <div className="px-5 mb-4">
        <h3 className="text-lg font-serif text-foreground">Explore by Theme</h3>
      </div>
      
      {/* Horizontal scroll rail */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory">
          {themes.map((theme) => {
            const IconComponent = theme.icon ? THEME_ICONS[theme.icon] : Sparkles;
            
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeClick(theme)}
                className="flex-shrink-0 snap-start group"
              >
                <div className="w-36 md:w-44 bg-surface-alt/40 border border-border/40 rounded-xl p-4 hover:bg-surface-alt/60 transition-colors text-left">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  {/* Content */}
                  <h4 className="text-sm font-medium text-foreground line-clamp-1">
                    {theme.title}
                  </h4>
                  {theme.subtitle && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {theme.subtitle}
                    </p>
                  )}
                  
                  {/* Course count */}
                  {(theme.course_count ?? 0) > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {theme.course_count} courses
                    </p>
                  )}
                  
                  {/* Explore indicator */}
                  <div className="flex items-center gap-1 mt-3 text-xs text-primary/80 group-hover:text-primary transition-colors">
                    <span>Explore</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeExploreRail;
