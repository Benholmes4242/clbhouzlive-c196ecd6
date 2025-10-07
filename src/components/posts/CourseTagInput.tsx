
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { X, MapPin, Loader2 } from 'lucide-react';

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
    <div className="relative">
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
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="w-full pr-10 pl-4 h-11 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 outline-none shadow-inner focus:ring-2 focus:ring-[rgb(var(--brand-orange-accent))]/30 focus:border-[rgb(var(--brand-orange-accent))]/40 transition-all duration-200"
          />
          <MapPin className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          {isLoading && searchQuery.length >= 2 && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          )}

          {showSuggestions && suggestions.length > 0 && typeof window !== 'undefined' && (
            createPortal(
              <div 
                className="fixed z-[9999] max-h-[40vh] overflow-auto rounded-2xl bg-white border border-zinc-200 shadow-[0_8px_32px_rgba(0,0,0,0.15)] divide-y divide-zinc-100 pointer-events-auto"
                style={{
                  top: inputRef.current ? inputRef.current.getBoundingClientRect().bottom + window.scrollY + 8 : 0,
                  left: inputRef.current ? inputRef.current.getBoundingClientRect().left + window.scrollX : 0,
                  width: inputRef.current ? inputRef.current.getBoundingClientRect().width : 'auto',
                }}
              >
                <div className="py-2">
                  {suggestions.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--brand-orange-accent))]/5 cursor-pointer transition-colors duration-150"
                      onClick={() => handleCourseSelect(course)}
                    >
                      <div className="flex-shrink-0">
                        <span className="text-lg" role="img" aria-label="golf">⛳</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-900 text-sm leading-5 truncate">
                          {course.name}
                        </div>
                        <div className="text-xs text-zinc-600 mt-0.5">
                          {course.region ? `${course.region}, ${course.country}` : course.country}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>,
              document.body
            )
          )}
        </div>
      )}
    </div>
  );
};

export default CourseTagInput;
