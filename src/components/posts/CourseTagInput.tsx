import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, MapPin, Loader2 } from 'lucide-react';
// Using Tailwind semantic tokens instead of dark-mode CSS classes

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

interface CourseTagInputProps {
  selectedCourse: GolfCourse | null;
  onCourseSelect: (course: GolfCourse | null) => void;
  placeholder?: string;
}

// Simple in-memory cache for search results
const searchCache = new Map<string, { data: GolfCourse[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const CourseTagInput = ({ 
  selectedCourse, 
  onCourseSelect, 
  placeholder = "Where was this played?" 
}: CourseTagInputProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GolfCourse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check cache for results
  const getCachedResults = useCallback((query: string): GolfCourse[] | null => {
    const cached = searchCache.get(query.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }, []);

  // Save results to cache
  const setCachedResults = useCallback((query: string, data: GolfCourse[]) => {
    searchCache.set(query.toLowerCase(), { data, timestamp: Date.now() });
  }, []);

  useEffect(() => {
    const searchCourses = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Check cache first
      const cached = getCachedResults(searchQuery);
      if (cached) {
        setSuggestions(cached);
        setShowSuggestions(true);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('golf_courses')
          .select('id, name, country, region')
          .or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%,region.ilike.%${searchQuery}%`)
          .limit(10); // Increased from 6 to 10

        if (error) throw error;
        
        const results = data || [];
        setSuggestions(results);
        setCachedResults(searchQuery, results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching courses:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCourses, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, getCachedResults, setCachedResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCourseSelect = (course: GolfCourse) => {
    onCourseSelect(course);
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleRemoveCourse = () => {
    onCourseSelect(null);
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground mb-1.5">Where was this played?</label>
      
      {selectedCourse ? (
        // Show selected course pill
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <span className="font-semibold text-sm text-foreground">{selectedCourse.name}</span>
            <button
              onClick={handleRemoveCourse}
              className="w-5 h-5 grid place-items-center rounded-md bg-muted hover:bg-muted/80 text-muted-foreground text-xs"
              title="Remove course"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        // Show search input when no course is selected
        <div className="relative">
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-muted border border-border">
            <MapPin className="w-[18px] h-[18px] text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-0 text-foreground text-[15px] outline-none placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Search course name / region / country"
            />
            {isLoading && searchQuery.length >= 2 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-60 mt-2 w-full rounded-xl bg-background border border-border shadow-lg max-h-[42vh] overflow-auto p-2">
              {suggestions.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-left hover:bg-muted transition-colors"
                  onClick={() => handleCourseSelect(course)}
                >
                  <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-foreground">{course.name}</div>
                    <div className="text-[13px] text-muted-foreground">
                      {course.region ? `${course.region}, ${course.country}` : course.country}
                    </div>
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

export default CourseTagInput;
