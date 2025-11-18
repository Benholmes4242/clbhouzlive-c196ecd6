import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

interface CourseSearchInputProps {
  selectedCourse: GolfCourse | null;
  onCourseSelect: (course: GolfCourse | null) => void;
}

/**
 * Course Search Input - matches the Games "Find a Game" search UI pattern
 * Reuses the same styling tokens and dropdown behavior from the Games search page
 */
export const CourseSearchInput = ({ 
  selectedCourse, 
  onCourseSelect
}: CourseSearchInputProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GolfCourse[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const searchCourses = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('golf_courses')
          .select('id, name, country, region')
          .or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%,region.ilike.%${searchQuery}%`)
          .limit(8);

        if (error) throw error;
        
        setSuggestions(data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching courses:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCourses, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleCourseSelect = (course: GolfCourse) => {
    onCourseSelect(course);
    setSearchQuery('');
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleRemoveCourse = () => {
    onCourseSelect(null);
  };

  return (
    <div className="relative">
      {selectedCourse ? (
        // Selected course pill - matches Games selected club styling
        <div className="w-full h-11 flex items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm h-full"
            style={{
              background: 'var(--surface-input)',
              border: '1px solid var(--border)',
            }}
          >
            <MapPin className="w-4 h-4" style={{ color: 'var(--icon-primary)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {selectedCourse.name}
            </span>
            {(selectedCourse.region || selectedCourse.country) && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {selectedCourse.region ? `${selectedCourse.region}, ${selectedCourse.country}` : selectedCourse.country}
              </span>
            )}
            <button
              onClick={handleRemoveCourse}
              className="ml-1 rounded-full p-1 transition-colors duration-150"
              style={{ 
                color: 'var(--icon-secondary)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-input-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Remove course"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        // Search input - matches Games "Find a Game" search bar
        <div className="relative">
          <div 
            className="flex items-center gap-3 h-11 px-3 rounded-xl transition-all duration-200 cursor-text"
            style={{
              background: 'var(--surface-input)',
              border: '1px solid var(--border)',
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--icon-secondary)' }} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  setShowDropdown(true);
                }
              }}
              onFocus={() => {
                if (searchQuery.length >= 2) {
                  setShowDropdown(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowDropdown(false), 200);
              }}
              placeholder="Search golf club..."
              className="flex-1 bg-transparent border-0 outline-none text-[15px]"
              style={{ 
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Dropdown - matches Games search dropdown */}
          {showDropdown && searchQuery.trim() && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              
              {/* Results dropdown */}
              <div 
                className="absolute left-0 right-0 mt-2 rounded-xl p-2 z-20 max-h-80 overflow-y-auto"
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-medium)',
                }}
              >
                {isLoading && (
                  <div className="px-4 py-3 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                    Searching...
                  </div>
                )}
                
                {!isLoading && suggestions.length > 0 && suggestions.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseSelect(course)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-150"
                    style={{
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-input)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--icon-secondary)' }} />
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {course.name}
                      </div>
                      {(course.region || course.country) && (
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {course.region ? `${course.region}, ${course.country}` : course.country}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                
                {!isLoading && suggestions.length === 0 && (
                  <div className="px-4 py-3 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No courses found
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
