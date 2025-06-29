
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

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
          .ilike('name', `%${searchQuery}%`)
          .limit(10);

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
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!!selectedCourse}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 mt-1">
            {suggestions.map((course) => (
              <div
                key={course.id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleCourseSelect(course)}
              >
                <div className="font-medium text-sm">{course.name}</div>
                <div className="text-xs text-gray-500">
                  {course.region ? `${course.region}, ${course.country}` : course.country}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-50 mt-1">
            <div className="text-sm text-gray-500">Searching courses...</div>
          </div>
        )}
      </div>

      {selectedCourse && (
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <span>{selectedCourse.name}</span>
            <button
              onClick={handleRemoveCourse}
              className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
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
