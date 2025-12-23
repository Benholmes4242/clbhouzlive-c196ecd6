import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Compass, Palette, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExploreSearch, SearchResult } from '@/hooks/useExploreSearch';

interface ExploreSearchResultsProps {
  query: string;
  onSelect: () => void;
  className?: string;
}

export const ExploreSearchResults: React.FC<ExploreSearchResultsProps> = ({
  query,
  onSelect,
  className,
}) => {
  const navigate = useNavigate();
  const { courses, regions, themes, isLoading, hasResults, isSearching } = useExploreSearch(query);

  if (!isSearching) return null;

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
    onSelect();
  };

  const handleRegionClick = (slug: string) => {
    navigate(`/discover/explore/region/${slug}`);
    onSelect();
  };

  const handleThemeClick = (slug: string) => {
    navigate(`/discover/explore/theme/${slug}`);
    onSelect();
  };

  return (
    <div className={cn(
      "absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto",
      className
    )}>
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !hasResults && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No results found for "{query}"
        </div>
      )}

      {!isLoading && hasResults && (
        <div className="divide-y divide-border">
          {/* Courses */}
          {courses.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Courses
              </div>
              {courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{course.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {course.sub_country || course.country}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Regions */}
          {regions.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Regions
              </div>
              {regions.map(region => (
                <button
                  key={region.id}
                  onClick={() => handleRegionClick(region.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{region.title}</p>
                    {region.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{region.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Themes */}
          {themes.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Themes
              </div>
              {themes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeClick(theme.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Palette className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{theme.title}</p>
                    {theme.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{theme.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExploreSearchResults;
