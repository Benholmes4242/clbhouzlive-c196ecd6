/**
 * ExploreSearchResults - Premium floating card search results
 * A* Polish: rounded-2xl shadow-xl, section headers, refined rows
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Compass, Palette, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExploreSearch } from '@/hooks/useExploreSearch';

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
      "absolute left-0 right-0 top-full mt-1 rounded-2xl bg-white shadow-xl border border-gray-100 z-50 overflow-hidden max-h-80 overflow-y-auto",
      className
    )}>
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
        </div>
      )}

      {!isLoading && !hasResults && (
        <div className="flex flex-col items-center py-8">
          <Search className="w-10 h-10 text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">No results found</p>
        </div>
      )}

      {!isLoading && hasResults && (
        <div>
          {/* Courses */}
          {courses.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Courses
              </div>
              {courses.map((course, i) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left",
                    i < courses.length - 1 && "border-b border-gray-50"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {course.sub_country || course.country}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Regions */}
          {regions.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Regions
              </div>
              {regions.map((region, i) => (
                <button
                  key={region.id}
                  onClick={() => handleRegionClick(region.slug)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left",
                    i < regions.length - 1 && "border-b border-gray-50"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{region.title}</p>
                    {region.subtitle && (
                      <p className="text-xs text-gray-400 truncate">{region.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Themes */}
          {themes.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Themes
              </div>
              {themes.map((theme, i) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeClick(theme.slug)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left",
                    i < themes.length - 1 && "border-b border-gray-50"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Palette className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{theme.title}</p>
                    {theme.subtitle && (
                      <p className="text-xs text-gray-400 truncate">{theme.subtitle}</p>
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
