
import React, { useState, useRef, useEffect } from 'react';
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

const CourseTagInput = ({ 
  selectedCourse, 
  onCourseSelect, 
  placeholder = "Start typing to find a course..." 
}: CourseTagInputProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GolfCourse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const searchCourses = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('golf_courses')
          .select('id, name, country, region')
          .or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%,region.ilike.%${searchQuery}%`)
          .limit(6);

        if (error) throw error;
        
        setSuggestions(data || []);
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
  }, [searchQuery]);

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
      <label className="findLabel">Select a golf club</label>
      
      {selectedCourse ? (
        // Show selected course pill that replaces the search input
        <div className="w-full h-11 flex items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-xl text-sm h-full shadow-sm">
            <span className="text-lg -ml-1" role="img" aria-label="golf">⛳</span>
            <span className="font-medium">{selectedCourse.name}</span>
            <span className="text-zinc-600 text-xs">
              {selectedCourse.region ? `${selectedCourse.region}, ${selectedCourse.country}` : selectedCourse.country}
            </span>
            <button
              onClick={handleRemoveCourse}
              className="ml-1 hover:bg-zinc-100 rounded-full p-1 transition-colors duration-150 text-zinc-500 hover:text-zinc-700"
              title="Remove course"
            >
              <X className="h-3 w-3" />
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
              placeholder="Tag a golf club..."
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
