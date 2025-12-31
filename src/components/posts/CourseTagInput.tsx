import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  variant?: 'dark' | 'light';
}

// Simple in-memory cache for search results
const searchCache = new Map<string, { data: GolfCourse[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const CourseTagInput = ({ 
  selectedCourse, 
  onCourseSelect, 
  placeholder = "Where was this played?",
  variant = 'dark'
}: CourseTagInputProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GolfCourse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isLight = variant === 'light';

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
          .limit(10);

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

  // Light mode styles
  const lightStyles = {
    label: { color: 'var(--cm-text-primary)', fontSize: '14px', fontWeight: 600 },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      borderRadius: '14px',
      padding: '10px 12px',
      background: 'var(--cm-surface-input)',
      border: '1px solid var(--cm-border-subtle)',
    },
    input: {
      flex: 1,
      background: 'transparent',
      border: 0,
      color: 'var(--cm-text-primary)',
      outline: 'none',
      fontSize: '15px',
    },
    icon: { color: 'var(--cm-icon-primary)', flexShrink: 0 },
    loader: { color: 'var(--cm-text-tertiary)' },
    resultsSheet: {
      position: 'relative' as const,
      zIndex: 60,
      marginTop: '10px',
      borderRadius: '16px',
      background: 'var(--cm-surface-card)',
      border: '1px solid var(--cm-border)',
      boxShadow: 'var(--cm-shadow-soft)',
      maxHeight: '42vh',
      overflow: 'auto',
      padding: '8px',
    },
    resultRow: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      width: '100%',
      borderRadius: '12px',
      padding: '10px 12px',
      background: 'transparent',
      border: '1px solid var(--cm-border-subtle)',
      textAlign: 'left' as const,
      marginBottom: '8px',
      cursor: 'pointer',
    },
    resultTitle: { color: 'var(--cm-text-primary)', fontWeight: 600, fontSize: '15px', marginBottom: '2px' },
    resultSub: { color: 'var(--cm-text-secondary)', fontSize: '13px' },
    pill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '14px',
      background: 'var(--cm-surface-alt)',
      border: '1px solid var(--cm-border)',
      color: 'var(--cm-text-primary)',
      marginTop: '6px',
    },
    pillName: { fontWeight: 600 },
    pillX: {
      width: '24px',
      height: '24px',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--cm-surface-input)',
      borderRadius: '8px',
      color: 'var(--cm-text-secondary)',
      fontSize: '16px',
      cursor: 'pointer',
      border: 'none',
    },
  };

  // If light mode, use inline styles; otherwise use CSS classes
  if (isLight) {
    return (
      <div className="space-y-2">
        <label style={lightStyles.label}>Where was this played?</label>
        
        {selectedCourse ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 8px' }}>
            <div style={lightStyles.pill}>
              <MapPin style={{ width: '14px', height: '14px', color: 'var(--cm-icon-secondary)', flexShrink: 0 }} />
              <span style={lightStyles.pillName}>{selectedCourse.name}</span>
              <button
                onClick={handleRemoveCourse}
                style={lightStyles.pillX}
                title="Remove course"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div style={lightStyles.searchBar}>
              <MapPin style={{ ...lightStyles.icon, width: '18px', height: '18px' }} />
              <input
                ref={inputRef}
                type="text"
                style={lightStyles.input}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Search course name / region / country"
              />
              {isLoading && searchQuery.length >= 2 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" style={lightStyles.loader} />
                </div>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div style={lightStyles.resultsSheet}>
                {suggestions.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    style={lightStyles.resultRow}
                    onClick={() => handleCourseSelect(course)}
                  >
                    <MapPin className="w-5 h-5" style={{ color: 'var(--cm-icon-secondary)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={lightStyles.resultTitle}>{course.name}</div>
                      <div style={lightStyles.resultSub}>
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
  }

  // Dark mode - use existing CSS classes
  return (
    <div className="space-y-2">
      <label className="findLabel">Where was this played?</label>
      
      {selectedCourse ? (
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
