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
      {/* Section Header - Centered */}
      <div className="px-2 space-y-1 text-center">
        <h3 className="text-sm font-semibold text-white/95">Find a Game</h3>
        <p className="text-[13px] text-white/60">
          Search a golf club or browse games nearby to find active games or golfers looking for playing partners.
        </p>
      </div>
      
      {/* Search Input - Centered */}
      <div className="relative max-w-md mx-auto">
        <button
          onClick={() => {
            setShowDropdown(!showDropdown);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="w-full h-10 rounded-[14px] px-4 flex items-center gap-3 transition-colors text-[15px]"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--hub-text)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
        >
          <Search className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
          <span style={{ color: 'var(--hub-text-dim)' }}>Search golf club...</span>
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute z-30 w-full mt-2 rounded-[14px] shadow-2xl overflow-hidden"
              style={{
                background: 'rgba(18, 18, 20, 0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type club name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-[14px] text-[15px] transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--hub-text)',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--hub-text-dim)' }}>
                    Searching...
                  </div>
                ) : courses.length > 0 ? (
                  courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => handleSelect(course)}
                      className="w-full text-left px-4 py-3 transition-colors"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div className="text-sm font-medium" style={{ color: 'var(--hub-text)' }}>{course.name}</div>
                      {course.region && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--hub-text-sub)' }}>
                          {course.region}, {course.country}
                        </div>
                      )}
                    </button>
                  ))
                ) : searchTerm.length >= 2 ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--hub-text-dim)' }}>
                    No clubs found
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--hub-text-dim)' }}>
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
