import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, MapPin, Loader2 } from 'lucide-react';
import '@/features/nearby/GamesTab.css';

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
      <label className="findLabel">Where was this played?</label>
      
      {selectedCourse ? (
        // Show selected course pill matching Create Game styling
        <div className="selectedClubRow">
          <div 
            className="clubPill"
            style={{
              padding: '6px 10px 6px 14px',
              borderColor: 'rgba(255, 255, 255, 0.18)',
            }}
          >
            <span className="clubName">{selectedCourse.name}</span>
            <button
              onClick={handleRemoveCourse}
              className="x"
              title="Remove course"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        // Show search input when no course is selected
        <div className="relative">
          <div className="clubSearchBar">
            <MapPin className="searchBox__icon" style={{ width: '18px', height: '18px' }} />
            <input
              ref={inputRef}
              type="text"
              className="clubSearchInput"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Search course name / region / country"
            />
            {isLoading && searchQuery.length >= 2 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-white/60" />
              </div>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="resultsSheet">
              {suggestions.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className="resultRow"
                  onClick={() => handleCourseSelect(course)}
                >
                  <MapPin className="w-5 h-5 text-white/60" />
                  <div className="rMid">
                    <div className="rTitle">{course.name}</div>
                    <div className="rSub">
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
