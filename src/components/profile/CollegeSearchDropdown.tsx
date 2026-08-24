import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS, FIELD_REST_BG, FIELD_FOCUS_BG, FIELD_REST_BORDER, FIELD_FOCUS_BORDER } from '@/lib/tokens/field';
import React, { useState, useRef, useEffect } from 'react';
import { useCollegeMediaSearch, CollegeMediaResult } from '@/hooks/useCollegeMediaSearch';
import { GraduationCap, Loader2 } from 'lucide-react';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';

interface CollegeSearchDropdownProps {
  value: CollegeMediaResult | null;
  onChange: (college: CollegeMediaResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Searchable dropdown for selecting a college from college_media.
 * Used in signup/onboarding flows.
 */
export const CollegeSearchDropdown: React.FC<CollegeSearchDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Start typing your college…',
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: results, isLoading } = useCollegeMediaSearch(searchTerm);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !results?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (college: CollegeMediaResult) => {
    onChange(college);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleChange = () => {
    onChange(null);
    setSearchTerm('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  /* FIELD CANON (lib/tokens/field.ts). Was a private 2/5/8% ramp with a 7%
     border — near-canon by eye, off-canon by value. Disabled keeps its own
     lower fill; rest/focus come from the canon. */
  const getInputBackground = () => {
    if (disabled) return 'rgba(255,255,255,0.02)';
    return isFocused ? FIELD_FOCUS_BG : FIELD_REST_BG;
  };

  const getDisplayName = (college: CollegeMediaResult) => 
    college.short_name || college.college_name;

  // If a college is selected, show compact pill preview
  if (value) {
    const displayName = getDisplayName(value);
    return (
      <div className="space-y-1.5">
        <div 
          className="flex items-center justify-between h-[54px] px-4 rounded-2xl transition-all"
          style={{
            background: getInputBackground(),
            border: '1px solid #2F9E44',
          }}
        >
          <div className="flex items-center gap-2.5">
            {value.logo_url ? (
              <img 
                src={value.logo_url} 
                alt={`${displayName} logo`}
                className="w-[22px] h-[22px] rounded-full object-contain bg-background flex-shrink-0"
              />
            ) : (
              <div className="w-[22px] h-[22px] rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-medium text-white/60">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-white text-[15px]">{displayName}</span>
          </div>
          <button
            type="button"
            onClick={handleChange}
            disabled={disabled}
            className="text-[13px] text-white/50 hover:text-white/70 transition-colors"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (searchTerm.length >= 2) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          /* HEIGHT EXCEPTION (54px): matches the selected-college row it swaps
             with — 44 would jump the card's height on selection. */
          className={`${FIELD_PLACEHOLDER_CLASS} w-full h-[54px] px-4 pr-10 rounded-2xl text-[rgba(255,255,255,0.96)] text-[15px] focus:outline-none transition-all duration-200`}
          style={{
            background: getInputBackground(),
            border: `1px solid ${isFocused ? FIELD_FOCUS_BORDER : FIELD_REST_BORDER}`,
            opacity: disabled ? 0.5 : 1,
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
          ) : (
            <GraduationCap className="w-4 h-4 text-white/30" />
          )}
        </div>
      </div>

      {/* Helper text */}
      <p className="text-[12px] text-white/40 px-1">
        Choose from our database to get your college badge on your profile.
      </p>

      {/* Dropdown results */}
      {isOpen && results && results.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden shadow-xl max-h-[280px] overflow-y-auto"
          style={{
            background: 'rgba(30, 32, 35, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            top: '100%',
          }}
        >
          {results.map((college, index) => {
            const displayName = getDisplayName(college);
            const showFullName = college.short_name && college.short_name !== college.college_name;
            const isHighlighted = index === highlightedIndex;
            
            return (
              <button
                key={college.normalized_name}
                type="button"
                onClick={() => handleSelect(college)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                  isHighlighted ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                {getCollegeLogoUrl(college.college_name) ? (
                  <img 
                    src={getCollegeLogoUrl(college.college_name)!} 
                    alt={`${displayName} logo`}
                    className="w-[22px] h-[22px] rounded-full object-contain bg-background flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-[22px] h-[22px] rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-medium text-white/60">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[14px] truncate">{displayName}</p>
                  {showFullName && (
                    <p className="text-white/40 text-[12px] truncate">{college.college_name}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading state */}
      {isOpen && searchTerm.length >= 2 && isLoading && (
        <div 
          className="absolute z-50 w-full mt-2 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(30, 32, 35, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            top: '100%',
          }}
        >
          <p className="text-white/40 text-[13px] text-center flex items-center justify-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Searching colleges…
          </p>
        </div>
      )}

      {/* No results message */}
      {isOpen && searchTerm.length >= 2 && !isLoading && results?.length === 0 && (
        <div 
          className="absolute z-50 w-full mt-2 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(30, 32, 35, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            top: '100%',
          }}
        >
          <p className="text-white/40 text-[13px] text-center">
            No matches yet — try the full name (e.g., "University of Texas").
          </p>
        </div>
      )}
    </div>
  );
};

export default CollegeSearchDropdown;
