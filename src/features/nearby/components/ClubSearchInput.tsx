import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useCourseSearch } from '../hooks/useCourseSearch';

interface ClubSearchInputProps {
  onClubSelect: (club: { id: string; name: string; country: string; region?: string }) => void;
  onClear: () => void;
  selectedClub: { id: string; name: string } | null;
}

export function ClubSearchInput({ onClubSelect, onClear, selectedClub }: ClubSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { courses, isLoading } = useCourseSearch(searchTerm);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setSearchTerm('');
    setShowDropdown(false);
    onClear();
  };

  const handleSelect = (club: { id: string; name: string; country: string; region?: string }) => {
    onClubSelect(club);
    setSearchTerm('');
    setShowDropdown(false);
  };

  if (selectedClub) {
    return (
      <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3">
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
    <div className="space-y-2">
      <div className="text-xs font-medium text-white/50 px-2">
        Search for a game?
      </div>
      <div className="relative">
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
        <div className="text-xs text-white/60 px-2 mt-1.5">
          Search a golf club to find active games or golfers looking for a match.
        </div>

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
                ) : courses.length > 0 ? (
                  courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => handleSelect(course)}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0"
                    >
                      <div className="text-white text-sm font-medium">{course.name}</div>
                      {course.region && (
                        <div className="text-white/60 text-xs mt-0.5">
                          {course.region}, {course.country}
                        </div>
                      )}
                    </button>
                  ))
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
}
