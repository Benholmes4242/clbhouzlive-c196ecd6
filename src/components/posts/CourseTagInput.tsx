
import React, { useState, useRef, useEffect } from 'react';
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
        // Enhanced search - match by name, city, region, or country
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
    // Delay hiding suggestions to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Enhanced Input Field with external map pin */}
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="flex-1 px-4 pr-3 h-11 rounded-xl bg-black/20 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 outline-none"
            disabled={!!selectedCourse}
          />
          <div
            className="h-11 w-11 rounded-xl bg-white/12 backdrop-blur-md flex items-center justify-center"
            aria-label="Location indicator"
          >
            <span className="text-[18px]">📍</span>
          </div>
          {isLoading && searchQuery.length >= 2 && (
            <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Enhanced Suggestions Dropdown with high z-index */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto z-[9999] mt-2">
            {suggestions.length > 0 ? (
              <div className="py-2">
                {suggestions.map((course, index) => (
                  <div
                    key={course.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                      index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    onClick={() => handleCourseSelect(course)}
                  >
                    {/* Golf Tee Emoji */}
                    <div className="flex-shrink-0">
                      <span className="text-lg" role="img" aria-label="golf">⛳</span>
                    </div>
                    
                    {/* Course Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm leading-5 truncate">
                        {course.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {course.region ? `${course.region}, ${course.country}` : course.country}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.length >= 2 && !isLoading ? (
              /* Empty State */
              <div className="py-8 px-4 text-center">
                <div className="text-gray-400 mb-2">
                  <MapPin className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-sm text-gray-500 mb-1">No course found</p>
                <p className="text-xs text-gray-400">Try a different name or location</p>
                {/* Future feature placeholder */}
                {/* <button className="text-xs text-blue-500 hover:text-blue-600 mt-2">
                  Suggest this course
                </button> */}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Selected Course Display */}
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
