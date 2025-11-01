import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SearchResult {
  type: 'course' | 'game';
  id: string;
  name: string;
  subtitle?: string;
  course_id?: string;
}

interface SmartSearchInputProps {
  onCourseSelect: (club: { id: string; name: string }) => void;
  onClear: () => void;
  selectedClub: { id: string; name: string } | null;
}

export const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  onCourseSelect,
  onClear,
  selectedClub,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    const searchAll = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const term = debouncedSearch.toLowerCase();
        
        // Search courses
        const { data: courses } = await supabase
          .from('golf_courses')
          .select('id, name, country, region')
          .ilike('name', `%${term}%`)
          .limit(8);

        const courseResults: SearchResult[] = (courses || []).map(c => ({
          type: 'course' as const,
          id: c.id,
          name: c.name,
          subtitle: [c.region, c.country].filter(Boolean).join(', '),
        }));

        setResults(courseResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchAll();
  }, [debouncedSearch]);

  const handleSelect = (result: SearchResult) => {
    onCourseSelect({ id: result.id, name: result.name });
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    setShowDropdown(false);
    onClear();
  };

  if (selectedClub) {
    return (
      <div className="max-w-md mx-auto rounded-xl bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50 mb-1">Viewing games at</div>
            <div className="text-sm font-medium text-white">{selectedClub.name}</div>
          </div>
          <button
            onClick={handleClear}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="px-2 space-y-1 text-center">
        <h3 className="text-sm font-semibold text-white/95">Find a Game</h3>
        <p className="text-[13px] text-white/60">
          Search golf clubs to find active games
        </p>
      </div>
      
      {/* Search Button/Dropdown */}
      <div className="relative max-w-md mx-auto">
        <button
          onClick={() => {
            setShowDropdown(!showDropdown);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="w-full rounded-xl bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
        >
          <Search className="w-4 h-4 text-white/50" />
          <span className="text-sm text-white/50">Search golf club...</span>
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute z-30 w-full mt-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="p-3 border-b border-neutral-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type club name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="px-4 py-8 text-center text-sm text-white/50">
                    Searching...
                  </div>
                ) : results.length > 0 ? (
                  <>
                    {results.filter(r => r.type === 'course').length > 0 && (
                      <div className="px-3 py-2 text-xs font-semibold text-white/40 bg-neutral-800/50">
                        GOLF CLUBS
                      </div>
                    )}
                    {results.filter(r => r.type === 'course').map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0 flex items-center gap-3"
                      >
                        <MapPin className="w-4 h-4 text-white/50 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{result.name}</div>
                          {result.subtitle && (
                            <div className="text-white/60 text-xs mt-0.5 truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                ) : searchTerm.length >= 2 ? (
                  <div className="px-4 py-8 text-center text-sm text-white/50">
                    No clubs found
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-white/50">
                    Type at least 2 characters
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
