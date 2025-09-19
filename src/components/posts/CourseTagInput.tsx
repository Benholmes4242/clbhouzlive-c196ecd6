
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
    <div className="space-y-2">
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="w-full pr-10 pl-4 h-11 rounded-xl bg-black/20 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 outline-none"
            disabled={!!selectedCourse}
          />
          <MapPin className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          {isLoading && searchQuery.length >= 2 && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-white/60" />
            </div>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && typeof window !== 'undefined' && (
          createPortal(
            <div 
              className="fixed z-[70] max-h-[40vh] overflow-auto rounded-2xl bg-neutral-900/85 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] divide-y divide-white/8 pointer-events-auto"
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
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/8 cursor-pointer transition-colors duration-150"
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className="flex-shrink-0">
                      <span className="text-lg" role="img" aria-label="golf">⛳</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm leading-5 truncate">
                        {course.name}
                      </div>
                      <div className="text-xs text-white/60 mt-0.5">
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

      {selectedCourse && (
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
            <span className="text-base" role="img" aria-label="golf">⛳</span>
            <span className="font-medium">{selectedCourse.name}</span>
            <span className="text-green-600 text-xs">
              {selectedCourse.region ? `${selectedCourse.region}, ${selectedCourse.country}` : selectedCourse.country}
            </span>
            <button
              onClick={handleRemoveCourse}
              className="ml-1 hover:bg-green-100 rounded-full p-1 transition-colors duration-150"
              title="Remove course"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseTagInput;
